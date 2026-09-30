/**
 * A seller's trust score.
 *
 * Deliberately simple and explainable: there is no model and no opaque
 * weighting. Verification is the only hard gate in the system, so it carries
 * the largest fixed share; the rest is earned from real ratings and real
 * completed sales. A seller can see exactly why their number moves.
 */

export type TrustInput = {
  verified: boolean;
  avgRating: number | null;
  ratingCount: number;
  completedOrders: number;
};

export type TrustTier = "NEW" | "BRONZE" | "SILVER" | "GOLD";

export type TrustScore = {
  score: number;
  tier: TrustTier;
};

export function sellerTrustScore(input: TrustInput): TrustScore {
  // Verification alone is worth 40 — it is the only thing here that cannot be
  // faked by simply using the platform a lot.
  let score = input.verified ? 40 : 0;

  // Ratings contribute up to 35, but need a few data points to count fully so a
  // single 5-star from a friend cannot max it out.
  if (input.avgRating != null && input.ratingCount > 0) {
    const confidence = Math.min(1, input.ratingCount / 5);
    score += Math.round((input.avgRating / 5) * 35 * confidence);
  }

  // Completed sales contribute up to 25, saturating at 10 orders.
  score += Math.min(25, Math.round(input.completedOrders * 2.5));

  score = Math.max(0, Math.min(100, score));

  const tier: TrustTier =
    score >= 80 ? "GOLD" : score >= 55 ? "SILVER" : score >= 30 ? "BRONZE" : "NEW";

  return { score, tier };
}
