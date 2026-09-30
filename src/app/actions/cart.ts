"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { readCart, writeCart, clearCart, MAX_QUANTITY_PER_LINE } from "@/lib/cart";

export type CartActionState = {
  ok: boolean;
  message?: string;
} | null;

function sameLine(
  a: { productId: string; variantId: string | null },
  b: { productId: string; variantId: string | null },
): boolean {
  return a.productId === b.productId && a.variantId === b.variantId;
}

/**
 * Adds a product to the cart. Works as a plain form POST when JavaScript is
 * unavailable, which matters on the low-end handsets much of the market uses.
 */
export async function addToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const productId = String(formData.get("productId") ?? "");
  const variantId = String(formData.get("variantId") ?? "") || null;
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);

  if (!productId) return { ok: false, message: "Missing product." };

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    include: { variants: true },
  });
  if (!product) return { ok: false, message: "Product is no longer available." };

  // A product with options must be added with one of them chosen, otherwise we
  // would not know which stock pool the sale comes out of.
  if (product.variants.length > 0 && !variantId) {
    return { ok: false, message: "Please choose an option first." };
  }

  const variant = variantId
    ? product.variants.find((v) => v.id === variantId)
    : undefined;
  if (variantId && !variant) {
    return { ok: false, message: "That option is no longer available." };
  }

  const available = variant ? variant.stock : product.stock;
  if (available <= 0) return { ok: false, message: "Out of stock." };

  const cart = await readCart();
  const line = { productId, variantId: variant?.id ?? null };
  const existing = cart.find((l) => sameLine(l, line));

  const desired = (existing?.quantity ?? 0) + quantity;
  const capped = Math.min(desired, available, MAX_QUANTITY_PER_LINE);

  if (existing) {
    existing.quantity = capped;
  } else {
    cart.push({ ...line, quantity: capped });
  }

  await writeCart(cart);
  revalidatePath("/", "layout");

  return capped < desired
    ? { ok: true, message: `Only ${available} available — cart set to ${capped}.` }
    : { ok: true };
}

export async function updateCartQuantityAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const variantId = String(formData.get("variantId") ?? "") || null;
  const quantity = Number(formData.get("quantity") ?? 0);

  const cart = await readCart();
  const line = cart.find((l) => sameLine(l, { productId, variantId }));
  if (!line) return;

  if (quantity < 1) {
    await writeCart(cart.filter((l) => l !== line));
  } else {
    line.quantity = Math.min(quantity, MAX_QUANTITY_PER_LINE);
    await writeCart(cart);
  }

  revalidatePath("/", "layout");
}

export async function removeFromCartAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const variantId = String(formData.get("variantId") ?? "") || null;

  const cart = await readCart();
  await writeCart(cart.filter((l) => !sameLine(l, { productId, variantId })));
  revalidatePath("/", "layout");
}

export async function clearCartAction(): Promise<void> {
  await clearCart();
  revalidatePath("/", "layout");
}
