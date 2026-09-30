/**
 * Reads behind the seller dashboard's second half: payouts, ratings, saved
 * listings, follows, offers and the notification inbox.
 *
 * Split out of `lib/marketplace.ts` because that file is about the *public*
 * marketplace — what a buyer can see. Everything here is scoped to the
 * signed-in user by construction, so a forgotten `sellerId` in a page query
 * cannot leak another seller's orders.
 */

import { cache } from "react";
import { prisma } from "@/lib/db";

export const PAYOUT_METHODS = ["MPESA", "TIGO", "AIRTEL", "HALOPESA"] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

/** The payout account a seller will be paid into, plus history. */
export const getPayoutAccount = cache(async (userId: string) => {
  const [account, history] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { payoutMethod: true, payoutNumber: true, payoutName: true },
    }),
    prisma.order.findMany({
      where: { sellerId: userId, escrowStatus: "RELEASED" },
      orderBy: { releasedAt: "desc" },
      take: 25,
      select: {
        id: true,
        orderNumber: true,
        releasedAt: true,
        total: true,
        platformFee: true,
        payoutRef: true,
        items: { select: { nameEn: true, quantity: true } },
      },
    }),
  ]);

  return { account, history };
});

/** Every rating a seller has received, newest first. */
export const getSellerRatingBook = cache(async (sellerId: string) => {
  return prisma.sellerRating.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      order: { select: { orderNumber: true } },
      rater: { select: { name: true } },
    },
  });
});

/** Listings a buyer bookmarked, newest save first. */
export const getSavedListings = cache(async (userId: string) => {
  return prisma.savedListing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      listing: {
        select: {
          id: true,
          slug: true,
          titleEn: true,
          titleSw: true,
          price: true,
          status: true,
          viewCount: true,
          images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
          seller: { select: { id: true, name: true } },
        },
      },
    },
  });
});

/** Sellers a buyer follows. */
export const getFollowedSellers = cache(async (userId: string) => {
  return prisma.sellerFollow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      seller: {
        select: {
          id: true,
          name: true,
          studentVerifiedAt: true,
          _count: { select: { listings: true } },
          university: { select: { nameEn: true, nameSw: true } },
        },
      },
    },
  });
});

/** Open offers made on a seller's listings, and offers a seller can respond to. */
export const getSellerOfferInbox = cache(async (sellerId: string) => {
  return prisma.offer.findMany({
    where: { listing: { sellerId }, status: { in: ["PENDING", "ACCEPTED"] } },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      amount: true,
      message: true,
      status: true,
      createdAt: true,
      listing: { select: { id: true, slug: true, titleEn: true, titleSw: true, price: true } },
      buyer: { select: { id: true, name: true, studentVerifiedAt: true } },
    },
  });
});

/** Offers the signed-in buyer has made. */
export const getMyOffers = cache(async (buyerId: string) => {
  return prisma.offer.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      listing: { select: { id: true, slug: true, titleEn: true, titleSw: true, price: true } },
    },
  });
});

/** Count of offers waiting on the seller, for the dashboard badge. */
export const getPendingOfferCount = cache(async (sellerId: string) => {
  return prisma.offer.count({
    where: { listing: { sellerId }, status: "PENDING" },
  });
});

/** The notification inbox. */
export const getNotifications = cache(async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
});

/**
 * A seller's own listings for the management table, with the filters the
 * ListingManager form submits. Search is a case-insensitive contains on both
 * language titles; everything else is a plain where/orderBy.
 */
export async function getSellerListingsManaged(
  sellerId: string,
  filters: { q: string; status: string; sort: string },
) {
  const allowedStatuses = ["DRAFT", "ACTIVE", "PAUSED", "SOLD", "REMOVED"];
  const status = allowedStatuses.includes(filters.status) ? filters.status : "";

  const orderBy =
    filters.sort === "price_asc"
      ? ({ price: "asc" } as const)
      : filters.sort === "price_desc"
        ? ({ price: "desc" } as const)
        : filters.sort === "views"
          ? ({ viewCount: "desc" } as const)
          : filters.sort === "oldest"
            ? ({ createdAt: "asc" } as const)
            : ({ createdAt: "desc" } as const);

  return prisma.listing.findMany({
    where: {
      sellerId,
      ...(status ? { status } : {}),
      ...(filters.q
        ? {
            OR: [
              { titleEn: { contains: filters.q, mode: "insensitive" as const } },
              { titleSw: { contains: filters.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy,
    take: 60,
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleSw: true,
      price: true,
      status: true,
      viewCount: true,
      createdAt: true,
      images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
      _count: { select: { orderItems: true } },
    },
  });
}

/** One listing, but only if the signed-in seller owns it. */
export async function getSellerOwnedListing(sellerId: string, listingId: string) {
  return prisma.listing.findFirst({
    where: { id: listingId, sellerId },
    include: { images: { orderBy: { position: "asc" } } },
  });
}

/** Has the signed-in user bookmarked this listing? */
export async function isListingSaved(userId: string, listingId: string) {
  const row = await prisma.savedListing.findUnique({
    where: { userId_listingId: { userId, listingId } },
    select: { id: true },
  });
  return row !== null;
}

/** Is the signed-in user following this seller? */
export async function isSellerFollowed(userId: string, sellerId: string) {
  if (userId === sellerId) return false;
  const row = await prisma.sellerFollow.findUnique({
    where: { followerId_sellerId: { followerId: userId, sellerId } },
    select: { id: true },
  });
  return row !== null;
}

/**
 * The order thread. Scoped to a participant of that order *in the query*, so a
 * visitor who guessed the order number cannot read the conversation even if a
 * page forgets to check.
 */
export async function getOrderMessages(userId: string, orderId: string) {
  return prisma.orderMessage.findMany({
    where: { orderId, order: { OR: [{ userId }, { sellerId: userId }] } },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      body: true,
      createdAt: true,
      senderId: true,
      sender: { select: { name: true } },
    },
  });
}
