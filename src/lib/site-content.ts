/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { getShopSettings } from "@/lib/settings";
import {
  DEFAULT_SITE_CONTENT,
  type SiteContentConfig,
} from "./site-content-types";

export { DEFAULT_SITE_CONTENT, type SiteContentConfig };

// In-memory runtime cache for customizer overrides so admin modifications are immediately live
let cachedCustomizerContent: SiteContentConfig | null = null;

export const getSiteContent = cache(async (): Promise<SiteContentConfig> => {
  if (cachedCustomizerContent) {
    return cachedCustomizerContent;
  }

  try {
    const customizerRow = await (prisma as any).siteContent?.findUnique?.({
      where: { id: "global_content" },
    });

    if (customizerRow?.data) {
      const parsed = typeof customizerRow.data === "string" ? JSON.parse(customizerRow.data) : customizerRow.data;
      const updated: SiteContentConfig = { ...DEFAULT_SITE_CONTENT, ...parsed };
      cachedCustomizerContent = updated;
      return updated;
    }

    const settings = await getShopSettings();
    if (settings) {
      return DEFAULT_SITE_CONTENT;
    }
  } catch {
    // Fall back to default
  }

  return DEFAULT_SITE_CONTENT;
});

export async function saveSiteContent(newConfig: SiteContentConfig): Promise<void> {
  cachedCustomizerContent = newConfig;

  try {
    if ((prisma as any).siteContent?.upsert) {
      await (prisma as any).siteContent.upsert({
        where: { id: "global_content" },
        create: {
          id: "global_content",
          data: JSON.stringify(newConfig),
          updatedAt: new Date(),
        },
        update: {
          data: JSON.stringify(newConfig),
          updatedAt: new Date(),
        },
      });
    }
  } catch (err) {
    console.warn("Could not persist siteContent to database, held in cache:", err);
  }
}

export async function resetSiteContent(): Promise<void> {
  cachedCustomizerContent = { ...DEFAULT_SITE_CONTENT };
  try {
    if ((prisma as any).siteContent?.delete) {
      await (prisma as any).siteContent.delete({
        where: { id: "global_content" },
      }).catch(() => {});
    }
  } catch {
    // Ignore
  }
}
