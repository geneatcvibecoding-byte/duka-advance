import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import {
  DEFAULT_SITE_CONTENT,
  type SiteContentConfig,
} from "./site-content-types";

export { DEFAULT_SITE_CONTENT, type SiteContentConfig };

// Per-process cache speeds up storefront reads. The database remains the source
// of truth so published edits survive deployments and server restarts.
let cachedCustomizerContent: SiteContentConfig | null = null;

export const getSiteContent = cache(async (): Promise<SiteContentConfig> => {
  if (cachedCustomizerContent) return cachedCustomizerContent;

  const row = await prisma.siteContent.findUnique({
    where: { id: "global_content" },
  });

  if (!row?.data) return DEFAULT_SITE_CONTENT;

  try {
    const parsed = JSON.parse(row.data) as Partial<SiteContentConfig>;
    const updated: SiteContentConfig = {
      ...DEFAULT_SITE_CONTENT,
      ...parsed,
      announcement: { ...DEFAULT_SITE_CONTENT.announcement, ...parsed.announcement },
      hero: { ...DEFAULT_SITE_CONTENT.hero, ...parsed.hero },
      superDeals: { ...DEFAULT_SITE_CONTENT.superDeals, ...parsed.superDeals },
      campusMarketplace: {
        ...DEFAULT_SITE_CONTENT.campusMarketplace,
        ...parsed.campusMarketplace,
      },
      aliexpressBadges: {
        ...DEFAULT_SITE_CONTENT.aliexpressBadges,
        ...parsed.aliexpressBadges,
      },
      features: parsed.features ?? DEFAULT_SITE_CONTENT.features,
    };
    cachedCustomizerContent = updated;
    return updated;
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
});

export async function saveSiteContent(newConfig: SiteContentConfig): Promise<void> {
  await prisma.siteContent.upsert({
    where: { id: "global_content" },
    create: {
      id: "global_content",
      data: JSON.stringify(newConfig),
    },
    update: {
      data: JSON.stringify(newConfig),
    },
  });

  // Only publish to the runtime cache after persistence succeeds.
  cachedCustomizerContent = newConfig;
}

export async function resetSiteContent(): Promise<void> {
  await prisma.siteContent.deleteMany({ where: { id: "global_content" } });
  cachedCustomizerContent = { ...DEFAULT_SITE_CONTENT };
}
