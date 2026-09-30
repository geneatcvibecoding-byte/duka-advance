"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createListingOrder } from "@/lib/marketplace";
import { notify } from "@/lib/notify";
import { formatTZS } from "@/lib/tz";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";

/**
 * Offers: a buyer proposes a price below the asking price and the seller
 * decides. Accepting an offer opens a real escrow order at the offered amount,
 * so the buyer's money path afterwards is identical to a normal purchase.
 */

export type OfferState = { ok: true } | { ok: false; error: string } | null;

const MIN_OFFER = 1_000;
const MAX_OFFER = 50_000_000;
const MAX_MESSAGE = 500;

export async function makeOfferAction(
  _prev: OfferState,
  formData: FormData,
): Promise<OfferState> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const t = getTranslator(locale);

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: t("auth.invalidCredentials") };
  }

  const listingId = String(formData.get("listingId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const message = String(formData.get("message") ?? "").trim().slice(0, MAX_MESSAGE);

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, studentVerifiedAt: true },
  });
  if (!full?.studentVerifiedAt) {
    return { ok: false, error: t("mkt.verifyFirst") };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, price: true, sellerId: true, status: true, slug: true, titleEn: true },
  });
  if (!listing) return { ok: false, error: t("error.notFound") };
  if (listing.sellerId === full.id) return { ok: false, error: t("mkt.buyOwnListing") };
  if (listing.status !== "ACTIVE") return { ok: false, error: t("mkt.gone") };

  if (!Number.isInteger(amount) || amount < MIN_OFFER || amount > MAX_OFFER) {
    return { ok: false, error: t("seller.offerRange") };
  }
  // At or above the asking price an offer is just a purchase; make the buyer
  // use the buy button so they land in escrow instead of a chat thread.
  if (amount >= listing.price) {
    return { ok: false, error: t("seller.offerTooHigh") };
  }

  // One open offer per buyer per listing: a second one is an update.
  const existing = await prisma.offer.findFirst({
    where: { listingId: listing.id, buyerId: full.id, status: "PENDING" },
    select: { id: true },
  });

  if (existing) {
    await prisma.offer.update({
      where: { id: existing.id },
      data: { amount, message: message || null },
    });
  } else {
    await prisma.offer.create({
      data: { listingId: listing.id, buyerId: full.id, amount, message: message || null },
    });
  }

  await notify(
    prisma,
    listing.sellerId,
    "OFFER_RECEIVED",
    "/account/dashboard",
    amount,
  );

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Seller accepts or declines. Scoped to offers on their own listings. */
export async function respondOfferAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const offerId = String(formData.get("offerId") ?? "");
  const decision = String(formData.get("decision") ?? "");

  const user = await getCurrentUser();
  if (!user || !offerId) return;

  const offer = await prisma.offer.findFirst({
    where: { id: offerId, listing: { sellerId: user.id } },
    select: {
      id: true,
      amount: true,
      status: true,
      buyerId: true,
      listingId: true,
      listing: { select: { slug: true } },
    },
  });
  if (!offer || offer.status !== "PENDING") return;

  if (decision === "DECLINE") {
    await prisma.offer.update({ where: { id: offer.id }, data: { status: "DECLINED" } });
    await notify(
      prisma,
      offer.buyerId,
      "OFFER_DECLINED",
      `/marketplace/${offer.listing.slug}`,
    );
    revalidatePath("/", "layout");
    redirect(link(locale, "/account/dashboard"));
  }

  if (decision !== "ACCEPT") return;

  // Accepting claims the listing and opens escrow at the offered price. If
  // another buyer beat us to it the claim matches nothing and we fall through
  // without an order.
  const created = await prisma.$transaction(async (tx) => {
    const order = await createListingOrder(tx, {
      buyerId: offer.buyerId,
      listingId: offer.listingId,
      amount: offer.amount,
      note: `Offer of ${formatTZS(offer.amount)} accepted.`,
    });
    if (order) {
      await tx.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
    }
    return order;
  });

  if (created) {
    await notify(
      prisma,
      offer.buyerId,
      "OFFER_ACCEPTED",
      `/order/${created.orderNumber}`,
    );
  }

  revalidatePath("/", "layout");
  redirect(link(locale, "/account/dashboard"));
}
