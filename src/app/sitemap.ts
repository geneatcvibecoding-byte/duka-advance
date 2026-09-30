import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { locales } from "@/lib/i18n";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Every URL is listed once per locale, with `alternates.languages` pointing at
 * the other one. That is what tells Google the English and Swahili pages are
 * translations rather than duplicate content.
 */
function withAlternates(path: string) {
  return Object.fromEntries(
    locales.map((locale) => [locale, `${BASE}/${locale}${path}`]),
  ) as Record<string, string>;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string }[] = [];
  let listings: { slug: string; createdAt: Date }[] = [];

  try {
    [products, categories, listings] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true },
      }),
      prisma.listing.findMany({
        where: { status: "ACTIVE", seller: { studentVerifiedAt: { not: null } } },
        select: { slug: true, createdAt: true },
      }),
    ]);
  } catch {
    // Database may be unreachable during offline build or provisioning
  }

  const staticPaths = [
    "",
    "/shop",
    "/marketplace",
    "/track",
    "/delivery",
    "/returns",
    "/terms",
    "/privacy",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        changeFrequency: path === "" ? "daily" : "monthly",
        priority: path === "" ? 1 : 0.5,
        alternates: { languages: withAlternates(path) },
      });
    }

    for (const category of categories) {
      const path = `/category/${category.slug}`;
      entries.push({
        url: `${BASE}/${locale}${path}`,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages: withAlternates(path) },
      });
    }

    for (const product of products) {
      const path = `/product/${product.slug}`;
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages: withAlternates(path) },
      });
    }

    for (const listing of listings) {
      const path = `/marketplace/${listing.slug}`;
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: listing.createdAt,
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: { languages: withAlternates(path) },
      });
    }
  }

  return entries;
}
