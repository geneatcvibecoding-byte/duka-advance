"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { link, resolveLocale } from "@/lib/i18n";
import { normalizePhone } from "@/lib/tz";
import { slugify } from "@/lib/utils";

/**
 * Every action here re-checks the admin role. The layout guard only protects
 * rendering — a server action is a public endpoint and must guard itself.
 */
async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Not authorised.");
  }
  return user;
}

function int(value: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function optionalStr(value: FormDataEntryValue | null): string | null {
  return str(value) || null;
}

export type AdminState = { ok?: boolean; error?: string } | null;

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function saveProductAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await assertAdmin();

  const locale = resolveLocale(str(formData.get("locale")));
  const id = optionalStr(formData.get("id"));

  const nameEn = str(formData.get("nameEn"));
  const nameSw = str(formData.get("nameSw"));
  const categoryId = str(formData.get("categoryId"));
  const price = int(formData.get("price"));

  if (!nameEn || !nameSw) return { error: "Both English and Swahili names are required." };
  if (!categoryId) return { error: "Choose a category." };
  if (price <= 0) return { error: "Price must be greater than zero." };

  const slug = slugify(str(formData.get("slug")) || nameEn);

  // Slugs are in the URL, so a duplicate would silently shadow another product.
  const clash = await prisma.product.findFirst({
    where: { slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) return { error: `The web address "${slug}" is already used by another product.` };

  const data = {
    slug,
    nameEn,
    nameSw,
    descEn: str(formData.get("descEn")),
    descSw: str(formData.get("descSw")),
    brand: optionalStr(formData.get("brand")),
    sku: optionalStr(formData.get("sku")),
    price,
    compareAt: int(formData.get("compareAt")) || null,
    stock: int(formData.get("stock")),
    lowStockAt: int(formData.get("lowStockAt"), 5),
    categoryId,
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  };

  let productId = id;
  if (id) {
    await prisma.product.update({ where: { id }, data });
  } else {
    const created = await prisma.product.create({ data });
    productId = created.id;

    const imageUrl = optionalStr(formData.get("imageUrl"));
    if (imageUrl) {
      await prisma.productImage.create({
        data: { productId: created.id, url: imageUrl, alt: nameEn, position: 0 },
      });
    }
  }

  revalidatePath("/", "layout");
  redirect(link(locale, `/admin/products/${productId}`));
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const locale = resolveLocale(str(formData.get("locale")));
  const id = str(formData.get("id"));

  // Products that have been ordered are deactivated rather than deleted, so
  // historic orders keep their link to the catalogue.
  const orderCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderCount > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.product.delete({ where: { id } });
  }

  revalidatePath("/", "layout");
  redirect(link(locale, "/admin/products"));
}

export async function addProductImageAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const productId = str(formData.get("productId"));
  const url = str(formData.get("url"));
  if (!productId || !url) return;

  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, url, alt: optionalStr(formData.get("alt")), position: count },
  });

  revalidatePath("/", "layout");
}

/**
 * Called by the image uploader once a file is stored. Takes plain arguments
 * rather than FormData so it can be bound to a product id and passed to the
 * client component as a prop.
 */
export async function attachProductImageAction(
  productId: string,
  url: string,
): Promise<void> {
  await assertAdmin();
  if (!productId || !url) return;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { nameEn: true },
  });
  if (!product) return;

  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, url, alt: product.nameEn, position: count },
  });

  revalidatePath("/", "layout");
}

export async function deleteProductImageAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await prisma.productImage.delete({ where: { id: str(formData.get("imageId")) } });
  revalidatePath("/", "layout");
}

export async function addVariantAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const productId = str(formData.get("productId"));
  const optionEn = str(formData.get("optionEn"));
  const value = str(formData.get("value"));
  if (!productId || !optionEn || !value) return;

  const count = await prisma.productVariant.count({ where: { productId } });
  await prisma.productVariant.create({
    data: {
      productId,
      optionEn,
      optionSw: str(formData.get("optionSw")) || optionEn,
      value,
      priceDelta: int(formData.get("priceDelta")),
      stock: int(formData.get("stock")),
      position: count,
    },
  });

  revalidatePath("/", "layout");
}

export async function deleteVariantAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await prisma.productVariant.delete({ where: { id: str(formData.get("variantId")) } });
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function saveCategoryAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = optionalStr(formData.get("id"));
  const nameEn = str(formData.get("nameEn"));
  const nameSw = str(formData.get("nameSw"));
  if (!nameEn || !nameSw) return;

  const data = {
    slug: slugify(str(formData.get("slug")) || nameEn),
    nameEn,
    nameSw,
    descEn: optionalStr(formData.get("descEn")),
    descSw: optionalStr(formData.get("descSw")),
    image: optionalStr(formData.get("image")),
    position: int(formData.get("position")),
    isActive: formData.get("isActive") === "on",
  };

  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    await prisma.category.create({ data });
  }

  revalidatePath("/", "layout");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData.get("id"));

  // Deleting a category with products would orphan them, so it is deactivated.
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    await prisma.category.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.category.delete({ where: { id } });
  }

  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = str(formData.get("orderId"));
  const status = str(formData.get("status"));
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return;

  // Cancelling returns the reserved stock to the shelf.
  if (status === "CANCELLED" && order.status !== "CANCELLED") {
    await prisma.$transaction(
      order.items
        .filter((item) => item.productId)
        .map((item) =>
          prisma.product.update({
            where: { id: item.productId! },
            data: { stock: { increment: item.quantity } },
          }),
        ),
    );
  }

  await prisma.order.update({
    where: { id },
    data: {
      status,
      events: {
        create: {
          status,
          note: `Status changed to ${status}`,
          actor: admin.name,
        },
      },
    },
  });

  revalidatePath("/", "layout");
}

export async function updatePaymentStatusAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = str(formData.get("orderId"));
  const paymentStatus = str(formData.get("paymentStatus"));

  const allowed = ["UNPAID", "AWAITING_CONFIRMATION", "PAID", "REFUNDED", "FAILED"];
  if (!allowed.includes(paymentStatus)) return;

  await prisma.order.update({
    where: { id },
    data: {
      paymentStatus,
      paidAt: paymentStatus === "PAID" ? new Date() : null,
      events: {
        create: {
          status: paymentStatus,
          note: `Payment marked ${paymentStatus}`,
          actor: admin.name,
        },
      },
    },
  });

  revalidatePath("/", "layout");
}

export async function addOrderNoteAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const orderId = str(formData.get("orderId"));
  const note = str(formData.get("note"));
  if (!orderId || !note) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  await prisma.orderEvent.create({
    data: { orderId, status: order.status, note, actor: admin.name },
  });

  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Coupons, delivery zones, settings, customers
// ---------------------------------------------------------------------------

export async function saveCouponAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const code = str(formData.get("code")).toUpperCase();
  if (!code) return;

  const data = {
    code,
    type: str(formData.get("type")) === "FIXED" ? "FIXED" : "PERCENT",
    value: int(formData.get("value")),
    minSubtotal: int(formData.get("minSubtotal")),
    maxUses: int(formData.get("maxUses")) || null,
    isActive: formData.get("isActive") === "on",
  };

  await prisma.coupon.upsert({ where: { code }, create: data, update: data });
  revalidatePath("/", "layout");
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await prisma.coupon.delete({ where: { id: str(formData.get("id")) } });
  revalidatePath("/", "layout");
}

export async function saveDeliveryZoneAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const region = str(formData.get("region"));
  if (!region) return;

  const data = {
    region,
    fee: int(formData.get("fee")),
    etaMinDays: int(formData.get("etaMinDays"), 1),
    etaMaxDays: int(formData.get("etaMaxDays"), 3),
    isActive: formData.get("isActive") === "on",
  };

  await prisma.deliveryZone.upsert({ where: { region }, create: data, update: data });
  revalidatePath("/", "layout");
}

export async function saveSettingsAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await assertAdmin();

  const phone = normalizePhone(str(formData.get("phone")));
  const whatsapp = normalizePhone(str(formData.get("whatsapp")));
  if (!phone || !whatsapp) {
    return { error: "Enter valid Tanzanian phone numbers, e.g. 0712 345 678." };
  }

  const data = {
    nameEn: str(formData.get("nameEn")),
    nameSw: str(formData.get("nameSw")),
    taglineEn: str(formData.get("taglineEn")),
    taglineSw: str(formData.get("taglineSw")),
    phone,
    whatsapp,
    email: str(formData.get("email")),
    addressLine: str(formData.get("addressLine")),
    mpesaName: optionalStr(formData.get("mpesaName")),
    mpesaLipaNamba: optionalStr(formData.get("mpesaLipaNamba")),
    tigoPesaNumber: optionalStr(formData.get("tigoPesaNumber")),
    airtelMoneyNumber: optionalStr(formData.get("airtelMoneyNumber")),
    halopesaNumber: optionalStr(formData.get("halopesaNumber")),
    bankName: optionalStr(formData.get("bankName")),
    bankAccountName: optionalStr(formData.get("bankAccountName")),
    bankAccountNumber: optionalStr(formData.get("bankAccountNumber")),
    freeDeliveryOver: int(formData.get("freeDeliveryOver")) || null,
  };

  await prisma.shopSettings.upsert({
    where: { id: "shop" },
    create: { id: "shop", ...data },
    update: data,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleCustomerActiveAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = str(formData.get("userId"));

  // An admin locking themselves out would need database access to recover.
  if (id === admin.id) return;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;

  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  revalidatePath("/", "layout");
}

export async function resetCustomerPasswordAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData.get("userId"));
  const password = str(formData.get("password"));
  if (!id || password.length < 8) return;

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(password) },
  });

  revalidatePath("/", "layout");
}

export async function approveReviewAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData.get("reviewId"));
  const approve = str(formData.get("approve")) === "1";

  if (approve) {
    await prisma.review.update({ where: { id }, data: { isApproved: true } });
  } else {
    await prisma.review.delete({ where: { id } });
  }

  revalidatePath("/", "layout");
}
