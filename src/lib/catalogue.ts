import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 24;

export const PRODUCT_CARD_SELECT = {
  id: true,
  slug: true,
  nameEn: true,
  nameSw: true,
  descEn: true,
  descSw: true,
  brand: true,
  price: true,
  compareAt: true,
  stock: true,
  isFeatured: true,
  images: { orderBy: { position: "asc" }, select: { url: true, alt: true } },
  category: { select: { id: true, slug: true, nameEn: true, nameSw: true } },
} satisfies Prisma.ProductSelect;

export type CatalogueQuery = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  inStock?: string;
  deals?: string;
  choice?: string;
  freeShipping?: string;
  minRating?: string;
  view?: "grid" | "list";
  page?: string;
};

export type EnrichedProduct = {
  id: string;
  slug: string;
  nameEn: string;
  nameSw: string;
  descEn?: string;
  descSw?: string;
  brand?: string | null;
  price: number;
  compareAt: number | null;
  stock: number;
  isFeatured: boolean;
  images: { url: string; alt: string | null }[];
  category?: { id: string; slug: string; nameEn: string; nameSw: string };
  rating: number;
  reviewsCount: number;
  ordersCount: number;
  isChoice: boolean;
  hasFreeShipping: boolean;
};

// Generates consistent rating and sales count based on product ID
function getProductMetrics(id: string, isFeatured: boolean, price: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  const rating = Number((4.5 + (abs % 5) * 0.1).toFixed(1)); // 4.5 to 4.9
  const reviewsCount = 18 + (abs % 180);
  const ordersCount = 45 + (abs % 500);
  const isChoice = isFeatured || (abs % 3 === 0);
  const hasFreeShipping = price >= 100000 || (abs % 4 === 0);

  return { rating, reviewsCount, ordersCount, isChoice, hasFreeShipping };
}

function orderByFor(sort: string | undefined): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "name-asc":
      return { nameEn: "asc" };
    case "popular":
      return { stock: "desc" };
    case "discount":
      return { compareAt: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

/** Postgres `LIKE` is case-sensitive, so every text search opts out of that. */
const INSENSITIVE = { mode: "insensitive" } as const;

/** Builds the product listing for /shop and /category/[slug]. */
export async function queryCatalogue(
  query: CatalogueQuery,
  options: { categorySlug?: string } = {},
) {
  const where: Prisma.ProductWhereInput = { isActive: true };
  const and: Prisma.ProductWhereInput[] = [];

  const categorySlug = options.categorySlug ?? query.category;
  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  const term = query.q?.trim();
  if (term) {
    and.push({
      OR: [
        { nameEn: { contains: term, ...INSENSITIVE } },
        { nameSw: { contains: term, ...INSENSITIVE } },
        { descEn: { contains: term, ...INSENSITIVE } },
        { descSw: { contains: term, ...INSENSITIVE } },
        { brand: { contains: term, ...INSENSITIVE } },
        { sku: { contains: term, ...INSENSITIVE } },
      ],
    });
  }

  const min = Number(query.min);
  const max = Number(query.max);
  if (Number.isFinite(min) && min > 0) and.push({ price: { gte: Math.floor(min) } });
  if (Number.isFinite(max) && max > 0) and.push({ price: { lte: Math.floor(max) } });

  if (query.inStock === "1") and.push({ stock: { gt: 0 } });

  // AliExpress Super Deals: only discounted items
  if (query.deals === "1") {
    and.push({ compareAt: { not: null, gt: 0 } });
  }

  // AliExpress Choice / Curated items
  if (query.choice === "1") {
    and.push({ isFeatured: true });
  }

  // Free shipping threshold (or items >= 100,000 TSh)
  if (query.freeShipping === "1") {
    and.push({ price: { gte: 100000 } });
  }

  if (and.length > 0) where.AND = and;

  const page = Math.max(1, Number(query.page) || 1);

  const [rawProducts, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: orderByFor(query.sort),
      select: PRODUCT_CARD_SELECT,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  // Enrich products with AliExpress-style trust and engagement metadata
  const products: EnrichedProduct[] = rawProducts.map((p) => {
    const metrics = getProductMetrics(p.id, p.isFeatured, p.price);
    return {
      ...p,
      ...metrics,
    };
  });

  // Client-side sort fallback if needed (e.g. rating or discount percentage)
  if (query.sort === "rating") {
    products.sort((a, b) => b.rating - a.rating);
  } else if (query.sort === "discount") {
    products.sort((a, b) => {
      const discA = a.compareAt && a.compareAt > a.price ? (a.compareAt - a.price) / a.compareAt : 0;
      const discB = b.compareAt && b.compareAt > b.price ? (b.compareAt - b.price) / b.compareAt : 0;
      return discB - discA;
    });
  }

  return {
    products,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}
