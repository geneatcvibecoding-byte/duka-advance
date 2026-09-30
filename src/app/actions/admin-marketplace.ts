"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { getTranslator, resolveLocale } from "@/lib/i18n";

/**
 * Admin actions for the marketplace. The admin panel's own copy is English-only
 * by design, but the *rejections* a user can hit from a shared page are
 * translated, because a seller may be the one who triggers them.
 */

/** Suspend or restore a listing (moderation). */
export async function moderateListingAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const listingId = String(formData.get("listingId") ?? "");
  const next = String(formData.get("status") ?? "");

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect(`/${locale}/admin/login`);

  if ((next !== "ACTIVE" && next !== "REMOVED") || !listingId) return;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) return;

  await prisma.listing.update({
    where: { id: listing.id },
    data: { status: next },
  });

  updateTag("listings");
  revalidatePath("/", "layout");
}

/** Feature a listing on the marketplace home for a fixed window. */
export async function featureListingAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const listingId = String(formData.get("listingId") ?? "");
  const days = Number(formData.get("days") ?? 7);

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect(`/${locale}/admin/login`);
  if (!listingId) return;

  const window = Number.isInteger(days) && days > 0 && days <= 90 ? days : 7;
  const until = new Date(Date.now() + window * 24 * 60 * 60 * 1000);

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, slug: true },
  });
  if (!listing) return;

  await prisma.listing.update({
    where: { id: listingId },
    data: { isFeatured: true, featuredUntil: until },
  });

  await notify(prisma, listing.sellerId, "LISTING_FEATURED", `/marketplace/${listing.slug}`);

  updateTag("listings");
  revalidatePath("/", "layout");
}

/** Remove a listing from the featured rail. */
export async function unfeatureListingAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const listingId = String(formData.get("listingId") ?? "");

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect(`/${locale}/admin/login`);
  if (!listingId) return;

  await prisma.listing.update({
    where: { id: listingId },
    data: { isFeatured: false, featuredUntil: null },
  });

  updateTag("listings");
  revalidatePath("/", "layout");
}

export type EscrowState = { ok: true } | { ok: false; error: string } | null;
export async function resolveDisputeAction(
  _prev: EscrowState,
  formData: FormData,
): Promise<EscrowState> {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const outcome = String(formData.get("outcome") ?? "").trim();
  const payoutRef = String(formData.get("payoutRef") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const t = getTranslator(resolveLocale(String(formData.get("locale") ?? "")));

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, error: t("mkt.escNotAllowed") };
  }

  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) return { ok: false, error: t("mkt.escNotFound") };
  if (order.escrowStatus !== "DISPUTED") {
    return { ok: false, error: t("mkt.escNotDisputed") };
  }

  if (outcome === "REFUNDED") {
    if (reason.length < 5) {
      return { ok: false, error: t("mkt.escDecisionRequired") };
    }
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          escrowStatus: "REFUNDED",
          status: "CANCELLED",
          paymentStatus: "REFUNDED",
          refundedAt: new Date(),
          disputeReason: `Resolved for the buyer: ${reason}`,
          resolvedBy: user.name,
          resolvedAt: new Date(),
        },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          status: "CANCELLED",
          note: `Dispute resolved with a refund. Reason: ${reason}`,
          actor: user.name,
        },
      }),
    ]);
    updateTag("listings");
    revalidatePath("/", "layout");

    // Both parties get told how it ended, with the money involved: the buyer
    // learns the refund amount, the seller learns their net.
    if (order.userId) {
      await notify(
        prisma,
        order.userId,
        "ESCROW_REFUNDED",
        `/order/${order.orderNumber}`,
        order.total,
      );
    }
    if (order.sellerId) {
      await notify(
        prisma,
        order.sellerId,
        "ESCROW_DISPUTED",
        `/order/${order.orderNumber}`,
      );
    }

    return { ok: true };
  }

  if (outcome === "RELEASED") {
    if (payoutRef.length < 4 || !/\d/.test(payoutRef)) {
      return { ok: false, error: t("mkt.escNeedPayoutRef") };
    }
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          escrowStatus: "RELEASED",
          status: "DELIVERED",
          payoutRef,
          releasedAt: new Date(),
          disputeReason: reason ? `Resolved for the seller: ${reason}` : null,
          resolvedBy: user.name,
          resolvedAt: new Date(),
        },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          status: "DELIVERED",
          note: `Dispute resolved for the seller; payout released (${payoutRef}).`,
          actor: user.name,
        },
      }),
    ]);
    updateTag("listings");
    revalidatePath("/", "layout");

    if (order.userId) {
      await notify(
        prisma,
        order.userId,
        "ESCROW_RELEASED",
        `/order/${order.orderNumber}`,
        order.total - order.platformFee,
      );
    }
    if (order.sellerId) {
      await notify(
        prisma,
        order.sellerId,
        "ESCROW_RELEASED",
        `/order/${order.orderNumber}`,
        order.total - order.platformFee,
      );
    }

    return { ok: true };
  }

  return { ok: false, error: t("mkt.escDecisionRequired") };
}