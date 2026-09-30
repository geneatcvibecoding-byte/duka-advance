import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ListingCondition } from "@/lib/escrow";

/**
 * Marketplace query layer.
 *
 * Separate from lib/catalogue (the shop's products) on purpose: a `Listing` is
 * one student's item, not a stock keeping unit, and every read is scoped to
 * `status: "ACTIVE"` + a verified seller.
 */

export type MarketplaceQuery = {
  q?: string;
  category?: string;
  condition?: string;
  university?: string;
  page?: string;
};

export const LISTINGS_PER_PAGE = 24;

export type ListingCardData = {
  id: string;
  slug: string;
  titleEn: string;
  titleSw: string;
  price: number;
  condition: ListingCondition;
  isFeatured: boolean;
  createdAt: Date;
  university: { slug: string; nameEn: string; nameSw: string };
  category: { slug: string; nameEn: string; nameSw: string };
  seller: { name: string; studentVerifiedAt: Date | null };
  images: { url: string; alt: string | null }[];
};

const CARD_SELECT = {
  id: true,
  slug: true,
  titleEn: true,
  titleSw: true,
  price: true,
  condition: true,
  isFeatured: true,
  createdAt: true,
  university: { select: { slug: true, nameEn: true, nameSw: true } },
  category: { select: { slug: true, nameEn: true, nameSw: true } },
  seller: { select: { name: true, studentVerifiedAt: true } },
  images: { select: { url: true, alt: true }, orderBy: { position: "asc" as const } },
} as const;

export type MarketplaceResult = {
  listings: ListingCardData[];
  total: number;
  page: number;
  totalPages: number;
};

/**
 * Browse listings. Only ACTIVE listings from universities with at least one
 * verified member are ever shown, so a classified from a dead campus cannot
 * surface by accident.
 */
export const queryMarketplace = cache(async function queryMarketplace(
  query: MarketplaceQuery,
): Promise<MarketplaceResult> {
  const where = {
    status: "ACTIVE",
    seller: { studentVerifiedAt: { not: null } },
    ...(query.condition ? { condition: query.condition } : {}),
    ...(query.category ? { categoryId: query.category } : {}),
    ...(query.university ? { universityId: query.university } : {}),
    ...(query.q
      ? {
          OR: [
            { titleEn: { contains: query.q, mode: "insensitive" as const } },
            { titleSw: { contains: query.q, mode: "insensitive" as const } },
            { descEn: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const skip = (page - 1) * LISTINGS_PER_PAGE;
  const now = new Date();

  // Paid placement is ranked as a *band* above everything else, and the band
  // only contains placements that have not expired. Ordering on the raw
  // `isFeatured` flag would keep a lapsed promotion pinned to the top forever,
  // and ordering on `featuredUntil` alone would rank a placement that ended
  // last week above one that ends tomorrow. So: the live band is read first,
  // then ordinary listings fill whatever slots are left.
  const liveFeatured = {
    ...where,
    isFeatured: true,
    featuredUntil: { gt: now },
  };
  const ordinary = {
    ...where,
    OR: [{ isFeatured: false }, { featuredUntil: null }, { featuredUntil: { lte: now } }],
  };

  const [featuredRows, total] = await Promise.all([
    prisma.listing.findMany({
      where: liveFeatured,
      select: CARD_SELECT,
      orderBy: [{ featuredUntil: "desc" }, { createdAt: "desc" }],
      take: skip + LISTINGS_PER_PAGE,
    }),
    prisma.listing.count({ where }),
  ]);

  const fromFeatured = featuredRows.slice(skip);
  const stillNeeded = LISTINGS_PER_PAGE - fromFeatured.length;
  const ordinarySkip = Math.max(0, skip - featuredRows.length);

  const ordinaryRows =
    stillNeeded > 0
      ? await prisma.listing.findMany({
          where: ordinary,
          select: CARD_SELECT,
          orderBy: { createdAt: "desc" },
          skip: ordinarySkip,
          take: stillNeeded,
        })
      : [];

  return {
    listings: [...fromFeatured, ...ordinaryRows] as ListingCardData[],
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / LISTINGS_PER_PAGE)),
  };
});

/** A featured listing for the marketplace landing and homepage showcase. */
export const getFeaturedListings = cache(async (limit = 8) => {
  const featured = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      isFeatured: true,
      seller: { studentVerifiedAt: { not: null } },
      OR: [{ featuredUntil: null }, { featuredUntil: { gt: new Date() } }],
    },
    select: CARD_SELECT,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (featured.length < limit) {
    const existingIds = featured.map((l) => l.id);
    const backfill = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        seller: { studentVerifiedAt: { not: null } },
        id: { notIn: existingIds },
      },
      select: CARD_SELECT,
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: limit - featured.length,
    });
    return [...featured, ...backfill] as ListingCardData[];
  }

  return featured as ListingCardData[];
});

export type ListingDetail = {
  id: string;
  slug: string;
  titleEn: string;
  titleSw: string;
  descEn: string;
  descSw: string;
  price: number;
  condition: string;
  status: string;
  createdAt: Date;
  viewCount: number;
  university: { id: string; nameEn: string; nameSw: string; region: string };
  category: { slug: string; nameEn: string; nameSw: string };
  seller: {
    id: string;
    name: string;
    studentVerifiedAt: Date | null;
    universityId: string | null;
    _count: { listings: number };
  };
  images: { url: string; alt: string | null }[];
  _count: { orderItems: number };
};

export async function getListingDetail(slug: string) {
  return prisma.listing.findFirst({
    where: { slug, status: { not: "REMOVED" } },
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleSw: true,
      descEn: true,
      descSw: true,
      price: true,
      condition: true,
      status: true,
      createdAt: true,
      viewCount: true,
      university: {
        select: { id: true, nameEn: true, nameSw: true, region: true },
      },
      category: { select: { slug: true, nameEn: true, nameSw: true } },
      seller: {
        select: {
          id: true,
          name: true,
          studentVerifiedAt: true,
          universityId: true,
          _count: { select: { listings: true } },
        },
      },
      images: { select: { url: true, alt: true }, orderBy: { position: "asc" } },
      _count: { select: { orderItems: true } },
    },
  }) as Promise<ListingDetail | null>;
}

/** Universities for forms and filters. Only active ones. */
export const getActiveUniversities = cache(async () => {
  return prisma.university.findMany({
    where: { isActive: true },
    orderBy: { nameEn: "asc" },
  });
});

// ---------------------------------------------------------------------------
// Order creation
// ---------------------------------------------------------------------------

export type CreateListingOrderInput = {
  buyerId: string;
  listingId: string;
  /** Offer price. Defaults to the listed price. */
  amount?: number;
  /** Order note, e.g. "Accepted offer of TSh 40,000". */
  note?: string;
};

/**
 * Reserve a listing and open an escrow order for it.
 *
 * The `status: "ACTIVE"` guard on the update is the whole concurrency story:
 * whoever commits first flips the listing to SOLD, and the loser's conditional
 * update matches nothing, so two buyers can never both win the same item. The
 * caller must run this inside a transaction so the claim and the order land
 * together.
 */
export async function createListingOrder(
  tx: Prisma.TransactionClient,
  input: CreateListingOrderInput,
): Promise<{ orderNumber: string; sellerId: string; total: number } | null> {
  const listing = await tx.listing.findUnique({
    where: { id: input.listingId },
    select: {
      id: true,
      price: true,
      sellerId: true,
      status: true,
      titleEn: true,
      titleSw: true,
    },
  });
  if (!listing || listing.status !== "ACTIVE") return null;

  // Re-read verification inside the transaction: an admin can un-verify a
  // student between page render and the buy click.
  const buyer = await tx.user.findUnique({
    where: { id: input.buyerId },
    select: { id: true, name: true, phone: true, email: true, studentVerifiedAt: true },
  });
  if (!buyer?.studentVerifiedAt) return null;

  const settings = await tx.shopSettings.findUnique({
    where: { id: "shop" },
    select: { marketplaceFeePercent: true },
  });
  const feePercent = settings?.marketplaceFeePercent ?? 6;

  const price = input.amount ?? listing.price;
  const platformFee = Math.ceil((price * feePercent) / 100);

  const claimed = await tx.listing.updateMany({
    where: { id: listing.id, status: "ACTIVE" },
    data: { status: "SOLD" },
  });
  if (claimed.count === 0) return null;

  const orderNumber = `MKT-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

  await tx.order.create({
    data: {
      orderNumber,
      userId: buyer.id,
      sellerId: listing.sellerId,
      status: "PENDING",
      paymentMethod: "ESCROW",
      paymentStatus: "UNPAID",
      escrowStatus: "AWAITING_FUNDING",
      platformFee,
      customerName: buyer.name,
      customerPhone: buyer.phone,
      customerEmail: buyer.email,
      // Campus handover, not a courier: there is no street address in a
      // student-to-student transaction, only a meeting point.
      region: "",
      district: "",
      street: "",
      subtotal: price,
      discount: 0,
      deliveryFee: 0,
      total: price,
      notes: input.note,
      items: {
        create: {
          listingId: listing.id,
          nameEn: listing.titleEn,
          nameSw: listing.titleSw,
          unitPrice: price,
          quantity: 1,
          lineTotal: price,
        },
      },
      events: {
        create: { status: "PENDING", note: "Listing sold, awaiting escrow funding." },
      },
    },
  });

  return { orderNumber, sellerId: listing.sellerId, total: price };
}

// ---------------------------------------------------------------------------
// Seller dashboard queries
// ---------------------------------------------------------------------------

/** Orders where the seller is the one being waited on. */
export function getSellerActionQueue(sellerId: string) {
  return prisma.order.findMany({
    where: {
      sellerId,
      // FUNDED: the buyer paid, the seller must hand the item over.
      // DISPUTED: frozen, the seller should know it is under review.
      escrowStatus: { in: ["FUNDED", "DISPUTED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      orderNumber: true,
      escrowStatus: true,
      escrowFundedAt: true,
      total: true,
      platformFee: true,
      customerName: true,
      items: { select: { nameEn: true, nameSw: true } },
    },
  });
}

export type DailySale = {
  /** YYYY-MM-DD in UTC, so the day buckets never shift under a timezone. */
  day: string;
  orders: number;
  net: number;
};

/**
 * Per-day sales and net earnings for the last `days` days.
 *
 * Bucketed in JS rather than SQL: at 14 days and one seller's volume the row
 * count is tiny, and a date_trunc in raw SQL would be the only raw query in
 * the app.
 */
export async function getSellerDailySales(sellerId: string, days = 14): Promise<DailySale[]> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await prisma.order.findMany({
    where: { sellerId, escrowStatus: "RELEASED", releasedAt: { gte: since } },
    select: { total: true, platformFee: true, releasedAt: true },
  });

  const buckets = new Map<string, DailySale>();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(since);
    date.setUTCDate(since.getUTCDate() + i);
    buckets.set(date.toISOString().slice(0, 10), {
      day: date.toISOString().slice(0, 10),
      orders: 0,
      net: 0,
    });
  }

  for (const row of rows) {
    const at = row.releasedAt ?? new Date();
    const key = at.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.net += row.total - row.platformFee;
  }

  return [...buckets.values()];
}

/** Listings ranked by how many times they have been sold. */
export async function getSellerTopListings(sellerId: string, limit = 4) {
  const rows = await prisma.listing.findMany({
    where: { sellerId, orderItems: { some: {} } },
    orderBy: { orderItems: { _count: "desc" } },
    take: limit,
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleSw: true,
      price: true,
      viewCount: true,
      _count: { select: { orderItems: true } },
      images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
    },
  });
  return rows;
}

export const getSellerRecentRatings = cache(async (sellerId: string, limit = 5) => {
  return prisma.sellerRating.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      raterId: true,
      order: { select: { orderNumber: true } },
    },
  });
});

/**
 * Public seller profile: identity, trust signals and what is for sale.
 *
 * Deliberately narrow. A payout number and a student registration number are
 * both secrets-adjacent — the first is money, the second is a campus identifier —
 * so neither is selectable here, and this is the only function a public page is
 * allowed to use for a seller row.
 */
export const getPublicSeller = cache(async (sellerId: string) => {
  return prisma.user.findFirst({
    where: { id: sellerId, role: "CUSTOMER", isActive: true },
    select: {
      id: true,
      name: true,
      studentVerifiedAt: true,
      createdAt: true,
      university: { select: { slug: true, nameEn: true, nameSw: true, region: true } },
      _count: { select: { listings: true, followers: true } },
    },
  });
});

export const getPublicSellerListings = cache(async (sellerId: string) => {
  return prisma.listing.findMany({
    where: {
      sellerId,
      status: "ACTIVE",
      seller: { studentVerifiedAt: { not: null } },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 24,
    select: CARD_SELECT,
  }) as Promise<ListingCardData[]>;
});

export const getSellerSalesSummary = cache(async (sellerId: string) => {
  const [orders, released, inEscrow, rating] = await Promise.all([
    prisma.order.count({ where: { sellerId } }),
    prisma.order.aggregate({
      where: { sellerId, escrowStatus: "RELEASED" },
      _sum: { total: true, platformFee: true },
    }),
    prisma.order.aggregate({
      where: { sellerId, escrowStatus: { in: ["FUNDED", "DELIVERED"] } },
      _sum: { total: true },
    }),
    prisma.sellerRating.aggregate({
      where: { sellerId },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  return {
    orders,
    releasedNet: (released._sum.total ?? 0) - (released._sum.platformFee ?? 0),
    heldInEscrow: inEscrow._sum.total ?? 0,
    avgRating: rating._avg.rating,
    ratingCount: rating._count,
  };
});

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}