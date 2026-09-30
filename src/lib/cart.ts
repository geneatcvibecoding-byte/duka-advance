import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { pick, type Locale } from "@/lib/i18n";

const CART_COOKIE = "duka_cart";
const MAX_QUANTITY_PER_LINE = 20;

export type CartLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
};

export type CartItem = {
  key: string;
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantLabel: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** Stock available for this exact product/variant combination. */
  available: number;
};

export type CartView = {
  items: CartItem[];
  subtotal: number;
  count: number;
  /** True when stored quantities exceeded stock and were clamped for display. */
  adjusted: boolean;
};

function lineKey(productId: string, variantId: string | null): string {
  return variantId ? `${productId}:${variantId}` : productId;
}

// ---------------------------------------------------------------------------
// Cookie storage
//
// The cart lives in a cookie rather than the database so that shoppers who are
// not signed in still keep their basket. Only identifiers and quantities are
// stored — every price is recalculated from the database on read, so editing
// the cookie cannot change what anything costs.
// ---------------------------------------------------------------------------

export async function readCart(): Promise<CartLine[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry): CartLine[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const { productId, variantId, quantity } = entry as Record<string, unknown>;
      if (typeof productId !== "string" || !productId) return [];
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty < 1) return [];
      return [
        {
          productId,
          variantId: typeof variantId === "string" && variantId ? variantId : null,
          quantity: Math.min(Math.floor(qty), MAX_QUANTITY_PER_LINE),
        },
      ];
    });
  } catch {
    return [];
  }
}

/** Only callable from a Server Action or Route Handler. */
export async function writeCart(lines: CartLine[]): Promise<void> {
  const store = await cookies();
  const kept = lines.filter((l) => l.quantity > 0);

  if (kept.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }

  store.set(CART_COOKIE, JSON.stringify(kept), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

// ---------------------------------------------------------------------------
// Reading the cart with live prices
// ---------------------------------------------------------------------------

export async function getCartView(locale: Locale): Promise<CartView> {
  const lines = await readCart();
  if (lines.length === 0) {
    return { items: [], subtotal: 0, count: 0, adjusted: false };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set(lines.map((l) => l.productId))] }, isActive: true },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: true,
    },
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const items: CartItem[] = [];
  let adjusted = false;

  for (const line of lines) {
    const product = byId.get(line.productId);
    // Product was deleted or deactivated since it went in the cart.
    if (!product) {
      adjusted = true;
      continue;
    }

    const variant = line.variantId
      ? product.variants.find((v) => v.id === line.variantId)
      : undefined;

    // The variant vanished — treat the line as stale rather than silently
    // selling the customer a different option.
    if (line.variantId && !variant) {
      adjusted = true;
      continue;
    }

    const available = variant ? variant.stock : product.stock;
    if (available <= 0) {
      adjusted = true;
      continue;
    }

    const quantity = Math.min(line.quantity, available);
    if (quantity !== line.quantity) adjusted = true;

    const unitPrice = product.price + (variant?.priceDelta ?? 0);

    items.push({
      key: lineKey(product.id, variant?.id ?? null),
      productId: product.id,
      variantId: variant?.id ?? null,
      slug: product.slug,
      name: pick(locale, product.nameEn, product.nameSw),
      variantLabel: variant
        ? `${pick(locale, variant.optionEn, variant.optionSw)}: ${variant.value}`
        : null,
      imageUrl: product.images[0]?.url ?? null,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      available,
    });
  }

  return {
    items,
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    adjusted,
  };
}

/** Cheap header badge count that avoids loading the whole cart. */
export async function getCartCount(): Promise<number> {
  const lines = await readCart();
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export { lineKey, MAX_QUANTITY_PER_LINE };
