"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  saveSiteContent,
  resetSiteContent,
  type SiteContentConfig,
} from "@/lib/site-content";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized access. Admin privileges required.");
  }
  return user;
}

export type CustomizerActionResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

export async function saveSiteContentAction(
  config: SiteContentConfig,
): Promise<CustomizerActionResult> {
  try {
    await assertAdmin();

    if (!config || !config.hero || !config.announcement) {
      return { ok: false, error: "Invalid configuration payload." };
    }

    await saveSiteContent(config);

    // Revalidate all localized storefront paths
    revalidatePath("/", "layout");
    revalidatePath("/en", "layout");
    revalidatePath("/sw", "layout");
    revalidatePath("/en/shop", "page");
    revalidatePath("/sw/shop", "page");

    return { ok: true, message: "Site content updated successfully!" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to save site customizer settings.";
    return { ok: false, error: errorMsg };
  }
}

export async function resetSiteContentAction(): Promise<CustomizerActionResult> {
  try {
    await assertAdmin();
    await resetSiteContent();

    revalidatePath("/", "layout");
    revalidatePath("/en", "layout");
    revalidatePath("/sw", "layout");

    return { ok: true, message: "Site content reset to default presets." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to reset site content.";
    return { ok: false, error: errorMsg };
  }
}
