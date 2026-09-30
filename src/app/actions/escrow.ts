"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canTransition, type EscrowActor, type EscrowStatus } from "@/lib/escrow";
import { getTranslator, resolveLocale } from "@/lib/i18n";
import { notify } from "@/lib/notify";

/**
 * Escrow mutations.
 *
 * Every action re-reads the order, re-derives the actor's identity from the
 * session (never from the form), and asks `canTransition` before writing. The
 * actor is decided by *ownership*, so a seller cannot mark an item delivered on
 * somebody else's order and a buyer cannot release their own refund.
 */

export type EscrowState = { ok: true } | { ok: false; error: string } | null;

type OrderForEscrow = {
  id: string;
  orderNumber: string;
  userId: string | null;
  sellerId: string | null;
  escrowStatus: string;
  status: string;
  escrowRef: string | null;
  total: number;
  platformFee: number;
  releasedAt: Date | null;
  refundedAt: Date | null;
};

/**
 * Work out who is acting. Returns null when the caller has no standing on this
 * order at all — an unrecognised id is treated the same as no order, so the
 * response does not confirm that an order exists.
 */
function actorFor(
  order: OrderForEscrow,
  user: { id: string; role: string },
): EscrowActor | null {
  if (user.role === "ADMIN") return "ADMIN";
  if (order.sellerId && order.sellerId === user.id) return "SELLER";
  if (order.userId && order.userId === user.id) return "BUYER";
  return null;
}

async function loadOrder(orderNumber: string) {
  if (!/^[A-Z]{3}-[A-Za-z0-9]{1,12}$/.test(orderNumber)) return null;
  return prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      sellerId: true,
      escrowStatus: true,
      escrowRef: true,
      status: true,
      total: true,
      platformFee: true,
      releasedAt: true,
      refundedAt: true,
    },
  });
}

/**
 * Buyer tells the platform which mobile-money reference to check. This only
 * records the reference — nothing moves until an admin confirms it (FUNDED).
 * Distinct from `fundEscrowAction`, which is admin-only and is the step that
 * actually pushes the order into escrow.
 */
export async function submitEscrowRefAction(
  _prev: EscrowState,
  formData: FormData,
): Promise<EscrowState> {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const reference = String(formData.get("escrowRef") ?? "").trim();
  const t = getTranslator(resolveLocale(String(formData.get("locale") ?? "")));

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("mkt.escSignIn") };

  const order = await loadOrder(orderNumber);
  if (!order) return { ok: false, error: t("mkt.escNotFound") };

  const actor = actorFor(order, user);
  if (actor !== "BUYER") return { ok: false, error: t("mkt.escNotAllowed") };
  if (order.escrowStatus !== "AWAITING_FUNDING") {
    return { ok: false, error: t("mkt.escNoPaymentExpected") };
  }
  if (reference.length < 4 || !/\d/.test(reference)) {
    return { ok: false, error: t("mkt.escNeedMoneyRef") };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { escrowRef: reference },
  });
  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      status: "PENDING",
      note: `Buyer submitted payment reference ${reference}. Awaiting admin confirmation.`,
      actor: user.name,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Buyer sends mobile money to the platform; an admin confirms the reference. */
export async function fundEscrowAction(
  _prev: EscrowState,
  formData: FormData,
): Promise<EscrowState> {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const reference = String(formData.get("escrowRef") ?? "").trim();
  const t = getTranslator(resolveLocale(String(formData.get("locale") ?? "")));

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("mkt.escSignIn") };

  const order = await loadOrder(orderNumber);
  if (!order) return { ok: false, error: t("mkt.escNotFound") };

  const actor = actorFor(order, user);
  if (actor !== "ADMIN") return { ok: false, error: t("mkt.escNotAllowed") };

  const check = canTransition(order.escrowStatus, "FUNDED", actor);
  if (!check.ok) return { ok: false, error: `Cannot confirm funding (${check.reason}).` };

  // The reference is usually the one the buyer already submitted; an admin
  // typing it in is the confirmation gesture. Either way it must look like a
  // mobile-money reference, not empty.
  const confirmedRef = reference || order.escrowRef || "";
  if (confirmedRef.length < 4 || !/\d/.test(confirmedRef)) {
    return { ok: false, error: t("mkt.escNeedMoneyRef") };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        escrowStatus: "FUNDED",
        escrowRef: confirmedRef,
        escrowFundedAt: new Date(),
        paymentStatus: "PAID",
        paidAt: new Date(),
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: "CONFIRMED",
        note: `Escrow funded, reference ${confirmedRef}.`,
        actor: user.name,
      },
    }),
  ]);

  // Both sides want to know the money is now held by the platform: the seller
  // can hand the item over, the buyer has nothing left to do.
  if (order.sellerId) {
    await notify(prisma, order.sellerId, "ESCROW_FUNDED", `/order/${orderNumber}`);
  }
  if (order.userId) {
    await notify(prisma, order.userId, "ESCROW_FUNDED", `/order/${orderNumber}`);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Seller confirms they handed the item over. */
export async function markDeliveredAction(formData: FormData): Promise<void> {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const user = await getCurrentUser();
  if (!user) return;

  const order = await loadOrder(orderNumber);
  if (!order) return;

  const actor = actorFor(order, user);
  if (actor !== "SELLER") return;

  if (!canTransition(order.escrowStatus, "DELIVERED", actor).ok) return;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { escrowStatus: "DELIVERED", deliveredAt: new Date() },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: "SHIPPED",
        note: "Seller marked the item as handed over. Awaiting buyer confirmation.",
        actor: user.name,
      },
    }),
  ]);

  // The buyer is the one who has to act next, so they get the ping.
  if (order.userId) {
    await notify(prisma, order.userId, "ESCROW_DELIVERED", `/order/${orderNumber}`);
  }

  revalidatePath("/", "layout");
}

/**
 * Release the seller's payout.
 *
 * A buyer triggers this by confirming they received the item. An admin can also
 * trigger it, which is how the AUTO_RELEASE_DAYS deadline is honoured when a
 * buyer goes quiet — the money is already in escrow, so releasing is the safe
 * default rather than stranding it.
 */
export async function releaseEscrowAction(
  _prev: EscrowState,
  formData: FormData,
): Promise<EscrowState> {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const payoutRef = String(formData.get("payoutRef") ?? "").trim();
  const t = getTranslator(resolveLocale(String(formData.get("locale") ?? "")));

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("mkt.escSignIn") };

  const order = await loadOrder(orderNumber);
  if (!order) return { ok: false, error: t("mkt.escNotFound") };

  const actor = actorFor(order, user);
  if (!actor) return { ok: false, error: t("mkt.escNotAllowed") };

  const check = canTransition(order.escrowStatus, "RELEASED", actor);
  if (!check.ok) return { ok: false, error: `Cannot release yet (${check.reason}).` };

  // The buyer is confirming receipt, not paying anyone, so no reference is
  // needed from them. An admin releasing on their behalf is moving real money,
  // so the reference is mandatory or the payout cannot be reconciled later.
  if (actor === "ADMIN" && (payoutRef.length < 4 || !/\d/.test(payoutRef))) {
    return { ok: false, error: t("mkt.escNeedPayoutRef") };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        escrowStatus: "RELEASED",
        status: "DELIVERED",
        payoutRef: payoutRef || null,
        releasedAt: new Date(),
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: "DELIVERED",
        note: `Escrow released to the seller. Platform fee TSh ${order.platformFee.toLocaleString("en-US")}.`,
        actor: user.name,
      },
    }),
  ]);

  // The seller is the one waiting on money, so releasing is their notification,
  // and the amount is the net they actually receive.
  if (order.sellerId) {
    await notify(
      prisma,
      order.sellerId,
      "ESCROW_RELEASED",
      `/order/${orderNumber}`,
      order.total - order.platformFee,
    );
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Return the money to the buyer. Admin only, and only before release. */
export async function refundEscrowAction(
  _prev: EscrowState,
  formData: FormData,
): Promise<EscrowState> {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const t = getTranslator(resolveLocale(String(formData.get("locale") ?? "")));

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("mkt.escSignIn") };

  const order = await loadOrder(orderNumber);
  if (!order) return { ok: false, error: t("mkt.escNotFound") };

  const actor = actorFor(order, user);
  if (actor !== "ADMIN") return { ok: false, error: t("mkt.escNotAllowed") };

  const check = canTransition(order.escrowStatus, "REFUNDED", actor);
  if (!check.ok) return { ok: false, error: `Cannot refund (${check.reason}).` };

  if (reason.length < 5) return { ok: false, error: t("mkt.escRefundReason") };

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        escrowStatus: "REFUNDED",
        status: "CANCELLED",
        paymentStatus: "REFUNDED",
        refundedAt: new Date(),
        disputeReason: reason,
        resolvedBy: user.name,
        resolvedAt: new Date(),
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        note: `Escrow refunded to the buyer. Reason: ${reason}`,
        actor: user.name,
      },
    }),
  ]);

  if (order.userId) {
    await notify(
      prisma,
      order.userId,
      "ESCROW_REFUNDED",
      `/order/${orderNumber}`,
      order.total,
    );
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Either party freezes the order when something has gone wrong. */
export async function disputeEscrowAction(formData: FormData): Promise<void> {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const user = await getCurrentUser();
  if (!user) return;

  const order = await loadOrder(orderNumber);
  if (!order) return;

  const actor = actorFor(order, user);
  if (!actor || actor === "ADMIN") return;

  if (!canTransition(order.escrowStatus, "DISPUTED", actor).ok) return;
  if (reason.length < 5) return;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { escrowStatus: "DISPUTED", disputeReason: reason },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: "PENDING",
        note: `Escrow disputed: ${reason}`,
        actor: user.name,
      },
    }),
  ]);

  // Tell the other party their order is frozen, so they do not keep waiting.
  const counterpartyId = actor === "BUYER" ? order.sellerId : order.userId;
  if (counterpartyId) {
    await notify(prisma, counterpartyId, "ESCROW_DISPUTED", `/order/${orderNumber}`);
  }

  revalidatePath("/", "layout");
}

/** Buyer rates the seller. Only once escrow has settled in the seller's favour. */
export async function rateSellerAction(
  _prev: EscrowState,
  formData: FormData,
): Promise<EscrowState> {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 600);
  const t = getTranslator(resolveLocale(String(formData.get("locale") ?? "")));

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("mkt.escSignIn") };

  const order = await loadOrder(orderNumber);
  if (!order) return { ok: false, error: t("mkt.escNotFound") };
  if (order.userId !== user.id) return { ok: false, error: t("mkt.escNotAllowed") };
  if (!order.sellerId) return { ok: false, error: t("mkt.escNotSellerOrder") };
  if (order.escrowStatus !== "RELEASED") {
    return { ok: false, error: t("mkt.escRateLater") };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: t("mkt.escRateRange") };
  }

  await prisma.sellerRating.upsert({
    where: { orderId: order.id },
    create: { orderId: order.id, sellerId: order.sellerId, raterId: user.id, rating, comment: comment || null },
    update: { rating, comment: comment || null },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export type { EscrowStatus };
