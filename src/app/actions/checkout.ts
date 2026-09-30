"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCartView, clearCart } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { calculateDelivery } from "@/lib/settings";
import { validateCoupon } from "@/lib/coupons";
import { getProvider, isValidPaymentMethod } from "@/lib/payments/providers";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { normalizePhone } from "@/lib/tz";
import { generateOrderNumber } from "@/lib/utils";

export type CheckoutState = { error?: string } | null;

export async function placeOrderAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const t = getTranslator(locale);

  const cart = await getCartView(locale);
  if (cart.items.length === 0) return { error: t("checkout.emptyCart") };

  // --- validate the customer's details ------------------------------------
  const customerName = String(formData.get("customerName") ?? "").trim();
  const phone = normalizePhone(String(formData.get("customerPhone") ?? ""));
  const email = String(formData.get("customerEmail") ?? "").trim() || null;
  const region = String(formData.get("region") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const street = String(formData.get("street") ?? "").trim();
  const landmark = String(formData.get("landmark") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const paymentMethod = String(formData.get("paymentMethod") ?? "");

  if (customerName.length < 2) return { error: t("error.required") };
  if (!phone) return { error: t("auth.invalidPhone") };
  if (!region || !district || !street) return { error: t("error.required") };
  if (!isValidPaymentMethod(paymentMethod)) return { error: t("error.generic") };

  const provider = getProvider(paymentMethod);
  if (!provider?.isEnabled()) return { error: t("error.generic") };

  // --- recompute every figure on the server -------------------------------
  // The browser's totals are display only; these are the ones that count.
  const subtotal = cart.subtotal;

  const couponCode = String(formData.get("couponCode") ?? "").trim();
  let discount = 0;
  let appliedCode: string | null = null;
  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal);
    if (result.ok) {
      discount = result.discount;
      appliedCode = result.code;
    }
    // An invalid code at this point is ignored rather than blocking the sale;
    // the customer already saw it fail when they applied it.
  }

  const delivery = await calculateDelivery(region, subtotal - discount);
  const total = Math.max(0, subtotal - discount + delivery.fee);

  const user = await getCurrentUser();
  const orderNumber = generateOrderNumber();

  // --- write the order and take the stock atomically ----------------------
  // Stock is decremented inside the same transaction that creates the order,
  // so two shoppers racing for the last item cannot both succeed.
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        if (item.variantId) {
          const updated = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(`OUT_OF_STOCK:${item.name}`);
          }
          // Keep the parent product's total in step with its variants.
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(`OUT_OF_STOCK:${item.name}`);
          }
        }
      }

      await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id ?? null,
          status: "PENDING",
          paymentMethod,
          paymentStatus: "UNPAID",
          customerName,
          customerPhone: phone,
          customerEmail: email,
          region,
          district,
          street,
          landmark,
          notes,
          subtotal,
          discount,
          deliveryFee: delivery.fee,
          total,
          couponCode: appliedCode,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              nameEn: item.name,
              nameSw: item.name,
              variantLabel: item.variantLabel,
              imageUrl: item.imageUrl,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
          },
          events: {
            create: { status: "PENDING", note: "Order placed", actor: "customer" },
          },
        },
      });

      if (appliedCode) {
        await tx.coupon.update({
          where: { code: appliedCode },
          data: { usedCount: { increment: 1 } },
        });
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("OUT_OF_STOCK:")) {
      return { error: t("error.outOfStock", { name: message.split(":")[1] ?? "" }) };
    }
    throw error;
  }

  // --- hand off to the payment provider -----------------------------------
  const created = await prisma.order.findUniqueOrThrow({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      customerPhone: true,
      customerName: true,
    },
  });

  const outcome = await provider.initiate(created);
  if (outcome.paymentStatus !== "UNPAID" || outcome.externalRef) {
    await prisma.order.update({
      where: { id: created.id },
      data: {
        paymentStatus: outcome.paymentStatus,
        paymentRef: outcome.externalRef ?? null,
      },
    });
  }

  await clearCart();
  revalidatePath("/", "layout");

  // Online providers will redirect to the gateway here in phase 2.
  redirect(outcome.redirectUrl ?? link(locale, `/order/${orderNumber}`));
}

export type PaymentRefState = { ok?: boolean; error?: string } | null;

/**
 * The customer types the M-Pesa / bank confirmation code from their SMS.
 * This never marks the order paid on its own — an admin verifies it against
 * the actual till statement first.
 */
export async function submitPaymentRefAction(
  _prev: PaymentRefState,
  formData: FormData,
): Promise<PaymentRefState> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const t = getTranslator(locale);

  const orderNumber = String(formData.get("orderNumber") ?? "");
  const reference = String(formData.get("paymentRef") ?? "").trim();

  if (!orderNumber || reference.length < 4) return { error: t("error.required") };

  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) return { error: t("order.notFound") };

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentRef: reference.toUpperCase().slice(0, 40),
      paymentStatus: "AWAITING_CONFIRMATION",
      events: {
        create: {
          status: order.status,
          note: `Customer submitted payment reference ${reference.toUpperCase()}`,
          actor: "customer",
        },
      },
    },
  });

  revalidatePath(link(locale, `/order/${orderNumber}`));
  return { ok: true };
}
