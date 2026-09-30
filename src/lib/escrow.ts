/**
 * The escrow state machine.
 *
 * This module is the *only* place allowed to write `Order.escrowStatus`. Every
 * transition is checked here so the rules cannot drift between the buyer, the
 * seller, and the admin path.
 *
 * Escrow in this build is a manual workflow, not an integrated payment
 * provider: a buyer sends mobile money to the platform's number, an admin
 * confirms the reference, the item changes hands, and an admin releases the
 * seller's payout. That is honest about what the code does. Holding buyer
 * funds in a merchant account is a regulated activity that needs a PSP
 * agreement or legal sign-off before real volume — see
 * docs/student-marketplace.md.
 */

/**
 * AWAITING_FUNDING: the order exists, the buyer has not paid.
 * FUNDED:          an admin confirmed the buyer's mobile-money reference.
 * DELIVERED:       the seller handed the item over; awaiting buyer confirmation.
 * RELEASED:        the buyer confirmed; the seller's payout was made.
 * REFUNDED:        the money went back to the buyer.
 * DISPUTED:        frozen pending an admin decision. Terminal until resolved.
 */
export const ESCROW_STATUSES = [
  "AWAITING_FUNDING",
  "FUNDED",
  "DELIVERED",
  "RELEASED",
  "REFUNDED",
  "DISPUTED",
] as const;

export type EscrowStatus = (typeof ESCROW_STATUSES)[number];

export function isEscrowStatus(value: string): value is EscrowStatus {
  return (ESCROW_STATUSES as readonly string[]).includes(value);
}

/** How long a buyer has to confirm handover before an admin can step in. */
export const AUTO_RELEASE_DAYS = 3;

type Transition = {
  from: EscrowStatus;
  to: EscrowStatus;
  /** Who is allowed to make this move. */
  actor: "BUYER" | "SELLER" | "ADMIN";
};

/**
 * The complete set of legal moves. Anything not listed here is rejected, which
 * is what stops a seller from releasing their own payout and a buyer from
 * marking an item delivered on someone else's order.
 */
const TRANSITIONS: readonly Transition[] = [
  // The buyer pays; an admin confirms the money actually arrived.
  { from: "AWAITING_FUNDING", to: "FUNDED", actor: "ADMIN" },

  // Money in escrow, item handed over.
  { from: "FUNDED", to: "DELIVERED", actor: "SELLER" },

  // Buyer confirms receipt, so the seller gets paid.
  { from: "DELIVERED", to: "RELEASED", actor: "BUYER" },
  // An admin can release on the buyer's behalf when they go quiet, which is the
  // whole point of the AUTO_RELEASE_DAYS deadline.
  { from: "DELIVERED", to: "RELEASED", actor: "ADMIN" },

  // Either side can walk away while the money is still held.
  { from: "FUNDED", to: "DISPUTED", actor: "SELLER" },
  { from: "DELIVERED", to: "DISPUTED", actor: "BUYER" },

  // Refund only before the item is released. After RELEASED the seller has the
  // money, so unwinding it is a separate process this schema does not model.
  { from: "AWAITING_FUNDING", to: "REFUNDED", actor: "ADMIN" },
  { from: "FUNDED", to: "REFUNDED", actor: "ADMIN" },

  // A dispute is frozen until an admin decides. Deciding means picking one of
  // the two money-moving outcomes: give the seller their payout (RELEASED) or
  // send the money back to the buyer (REFUNDED).
  { from: "DISPUTED", to: "RELEASED", actor: "ADMIN" },
  { from: "DISPUTED", to: "REFUNDED", actor: "ADMIN" },
];

export type EscrowActor = "BUYER" | "SELLER" | "ADMIN";

export type TransitionCheck =
  | { ok: true }
  | { ok: false; reason: "BAD_STATUS" | "ILLEGAL_TRANSITION" | "WRONG_ACTOR" };

/**
 * Can `actor` move an order from `from` to `to`?
 *
 * Pure and synchronous, so it is safe to call from UI for enabling buttons —
 * but that is a convenience only. Every mutation re-checks server-side.
 */
export function canTransition(
  from: string,
  to: string,
  actor: EscrowActor,
): TransitionCheck {
  if (!isEscrowStatus(from) || !isEscrowStatus(to)) {
    return { ok: false, reason: "BAD_STATUS" };
  }

  const legal = TRANSITIONS.filter(
    (t) => t.from === from && t.to === to && t.actor === actor,
  );

  if (legal.length > 0) return { ok: true };

  // Distinguish "not a legal move at all" from "legal, but not for you".
  const existsForAnyone = TRANSITIONS.some((t) => t.from === from && t.to === to);
  return {
    ok: false,
    reason: existsForAnyone ? "WRONG_ACTOR" : "ILLEGAL_TRANSITION",
  };
}

/** The moves `actor` can make right now, for rendering buttons. */
export function availableTransitions(
  from: string,
  actor: EscrowActor,
): EscrowStatus[] {
  if (!isEscrowStatus(from)) return [];
  return TRANSITIONS.filter((t) => t.from === from && t.actor === actor).map(
    (t) => t.to,
  );
}

/**
 * True once the order is settled one way or the other. Used to close the order
 * out and to stop showing a buyer any action they can still take.
 */
export function isEscrowSettled(status: string): boolean {
  return status === "RELEASED" || status === "REFUNDED";
}

/**
 * Whether the item is currently sitting in escrow with the buyer expected to
 * act. Drives the "confirm you received it" prompt and its deadline.
 */
export function isAwaitingBuyerConfirmation(status: string): boolean {
  return status === "DELIVERED";
}

/** Order status used for a shop order, mirrored onto marketplace orders. */
export const LISTING_CONDITIONS = [
  "NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
] as const;

export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export function isListingCondition(value: string): value is ListingCondition {
  return (LISTING_CONDITIONS as readonly string[]).includes(value);
}

export const LISTING_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "SOLD",
  "REMOVED",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export function isListingStatus(value: string): value is ListingStatus {
  return (LISTING_STATUSES as readonly string[]).includes(value);
}

/** A listing is only purchasable in this state. */
export function isPurchasable(status: string): boolean {
  return status === "ACTIVE";
}

/**
 * Commission in whole shillings.
 *
 * Rounded up so a small sale still contributes something: a 6% cut on a 5,000
 * shilling textbook is 300, but on a 500 shiring notebook rounding down would
 * yield 30 and make micro-listings pointless to host.
 */
export function platformFeeFor(total: number, percent: number): number {
  if (total <= 0 || percent <= 0) return 0;
  return Math.ceil((total * percent) / 100);
}

/** What the seller actually receives: total less the platform's cut. */
export function sellerPayout(total: number, platformFee: number): number {
  return Math.max(0, total - platformFee);
}
