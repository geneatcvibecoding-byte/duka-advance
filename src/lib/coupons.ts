import "server-only";
import { prisma } from "@/lib/db";
import type { TranslationKey } from "@/lib/i18n";

export type CouponResult =
  | { ok: true; code: string; discount: number }
  | { ok: false; errorKey: TranslationKey; amount?: number };

/**
 * Validates a discount code against the current subtotal.
 * Returns the shilling amount to subtract, never more than the subtotal.
 */
export async function validateCoupon(
  rawCode: string,
  subtotal: number,
): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, errorKey: "checkout.couponInvalid" };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) {
    return { ok: false, errorKey: "checkout.couponInvalid" };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, errorKey: "checkout.couponInvalid" };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { ok: false, errorKey: "checkout.couponExpired" };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, errorKey: "checkout.couponExpired" };
  }
  if (subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      errorKey: "checkout.couponMinimum",
      amount: coupon.minSubtotal,
    };
  }

  const raw =
    coupon.type === "PERCENT"
      ? Math.floor((subtotal * coupon.value) / 100)
      : coupon.value;

  return { ok: true, code: coupon.code, discount: Math.min(raw, subtotal) };
}
