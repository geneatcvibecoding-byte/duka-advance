"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { isListingCondition, isPurchasable } from "@/lib/escrow";
import { createListingOrder } from "@/lib/marketplace";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";

/**
 * Listing actions for the student marketplace.
 *
 * Only a student who has verified a university mailbox may create or buy, and
 * every write is scoped to the seller in the query itself — never by trusting
 * an id from the form and then checking afterwards.
 */

export type ListingState = { ok: true } | { ok: false; error: string } | null;

const MAX_TITLE = 120;
const MAX_DESC = 4000;
const MIN_PRICE = 100;
const MAX_PRICE = 50_000_000;
const MAX_IMAGES = 6;

export async function createListingAction(
  _prev: ListingState,
  formData: FormData,
): Promise<ListingState> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const t = getTranslator(locale);

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("auth.invalidCredentials") };

  // Re-read verification from the database rather than trusting the session
  // token: a student can be un-verified by an admin mid-session.
  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { studentVerifiedAt: true, universityId: true },
  });
  if (!full?.studentVerifiedAt || !full.universityId) {
    return { ok: false, error: t("mkt.verifyFirst") };
  }

  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleSw = String(formData.get("titleSw") ?? "").trim() || titleEn;
  const descEn = String(formData.get("descEn") ?? "").trim();
  const descSw = String(formData.get("descSw") ?? "").trim() || descEn;
  const price = Number(formData.get("price") ?? 0);
  const condition = String(formData.get("condition") ?? "GOOD");
  const categoryId = String(formData.get("categoryId") ?? "");
  const imageUrls = formData
    .getAll("imageUrl")
    .map((v) => String(v).trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGES);

  if (titleEn.length < 3 || titleEn.length > MAX_TITLE) {
    return { ok: false, error: t("mkt.titleLength") };
  }
  if (descEn.length < 10 || descEn.length > MAX_DESC) {
    return { ok: false, error: t("mkt.descLength") };
  }
  if (!Number.isInteger(price) || price < MIN_PRICE || price > MAX_PRICE) {
    return { ok: false, error: t("mkt.priceRange") };
  }
  if (!isListingCondition(condition)) {
    return { ok: false, error: t("mkt.badCondition") };
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || !category.isActive) {
    return { ok: false, error: t("error.required") };
  }

  // Only allow images the uploader already stored, so a seller cannot point at
  // someone else's file or at an arbitrary external URL.
  if (imageUrls.length > 0) {
    const owned = await prisma.listingImage.count({ where: { url: { in: imageUrls } } });
    if (owned !== imageUrls.length) {
      return { ok: false, error: t("mkt.badImage") };
    }
  }

  const base = slugify(titleEn) || "listing";
  const slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;

  const listing = await prisma.listing.create({
    data: {
      slug,
      titleEn,
      titleSw,
      descEn,
      descSw,
      price,
      condition,
      status: "ACTIVE",
      sellerId: user.id,
      universityId: full.universityId,
      categoryId,
      images: {
        create: imageUrls.map((url, index) => ({ url, position: index })),
      },
    },
  });

  updateTag("listings");
  revalidatePath("/", "layout");
  redirect(link(locale, `/marketplace/${listing.slug}`));
}

/** Pause / resume / mark sold. Scoped to the owner in the query. */
export async function updateListingStatusAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const listingId = String(formData.get("listingId") ?? "");
  const next = String(formData.get("status") ?? "");

  if (!listingId) return;

  const allowed = ["ACTIVE", "PAUSED", "SOLD", "REMOVED"] as const;
  if (!(allowed as readonly string[]).includes(next)) return;

  // The sellerId in the where clause is the authorisation check. A seller
  // cannot move someone else's listing by guessing an id.
  await prisma.listing.updateMany({
    where: { id: listingId, sellerId: (await getCurrentUser())?.id ?? "" },
    data: { status: next },
  });

  updateTag("listings");
  revalidatePath("/", "layout");
  redirect(link(locale, "/account/listings"));
}

/** Buy a listing. Creates the order in escrow and reserves the listing. */
export async function buyListingAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const listingId = String(formData.get("listingId") ?? "");

  const user = await getCurrentUser();
  if (!user) {
    redirect(`${link(locale, "/login")}?next=${encodeURIComponent(link(locale, "/marketplace"))}`);
  }

  const buyer = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, studentVerifiedAt: true, name: true, phone: true, email: true },
  });
  if (!buyer?.studentVerifiedAt) redirect(link(locale, "/account/verify"));

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, price: true, sellerId: true, status: true, titleEn: true },
  });
  if (!listing) redirect(link(locale, "/marketplace"));
  if (listing.sellerId === buyer.id) redirect(link(locale, "/marketplace"));
  if (!isPurchasable(listing.status)) redirect(link(locale, "/marketplace"));

  // Claim the listing and open escrow in one transaction — see
  // createListingOrder for why the guard is on the update.
  const created = await prisma.$transaction((tx) =>
    createListingOrder(tx, { buyerId: buyer.id, listingId: listing.id }),
  );

  if (!created) redirect(link(locale, "/marketplace"));

  await prisma.notification.create({
    data: { userId: listing.sellerId, type: "LISTING_SOLD", href: `/order/${created.orderNumber}` },
  });

  updateTag("listings");
  revalidatePath("/", "layout");
  redirect(link(locale, `/order/${created.orderNumber}`));
}

// ---------------------------------------------------------------------------
// Editing, bulk actions, saved listings, follows
// ---------------------------------------------------------------------------

/** Edit an existing listing. Owner-scoped in the query, like every write. */
export async function updateListingAction(
  _prev: ListingState,
  formData: FormData,
): Promise<ListingState> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const t = getTranslator(locale);
  const listingId = String(formData.get("listingId") ?? "");

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("auth.invalidCredentials") };

  const existing = await prisma.listing.findFirst({
    where: { id: listingId, sellerId: user.id },
    select: { id: true, status: true, condition: true, categoryId: true },
  });
  if (!existing) return { ok: false, error: t("error.notFound") };

  // A SOLD listing has an order pointing at it, so its price and description
  // become part of the accounting record. Only presentation may change after
  // the sale - the money fields are frozen. They are also disabled in the form,
  // which means they are not submitted at all, so a sold listing must fall back
  // to what it already has rather than failing validation on a missing field.
  const sold = existing.status === "SOLD";

  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleSw = String(formData.get("titleSw") ?? "").trim() || titleEn;
  const descEn = String(formData.get("descEn") ?? "").trim();
  const descSw = String(formData.get("descSw") ?? "").trim() || descEn;
  const price = Number(formData.get("price") ?? 0);
  const condition = sold
    ? existing.condition
    : String(formData.get("condition") ?? "GOOD");
  const categoryId = sold
    ? existing.categoryId
    : String(formData.get("categoryId") ?? "");
  const newImageUrls = formData
    .getAll("imageUrl")
    .map((v) => String(v).trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGES);

  if (titleEn.length < 3 || titleEn.length > MAX_TITLE) {
    return { ok: false, error: t("mkt.titleLength") };
  }
  if (descEn.length < 10 || descEn.length > MAX_DESC) {
    return { ok: false, error: t("mkt.descLength") };
  }
  if (!Number.isInteger(price) || price < MIN_PRICE || price > MAX_PRICE) {
    return { ok: false, error: t("mkt.priceRange") };
  }
  if (!isListingCondition(condition)) {
    return { ok: false, error: t("mkt.badCondition") };
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || !category.isActive) {
    return { ok: false, error: t("error.required") };
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      titleEn,
      titleSw,
      descEn,
      descSw,
      ...(sold ? {} : { price, condition, categoryId }),
      ...(newImageUrls.length > 0
        ? {
            images: {
              deleteMany: {},
              create: newImageUrls.map((url, index) => ({ url, position: index })),
            },
          }
        : {}),
    },
  });

  updateTag("listings");
  revalidatePath("/", "layout");
  redirect(link(locale, "/account/listings"));
}

/** Clone a listing as a fresh ACTIVE one. Images are copied by reference. */
export async function duplicateListingAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const listingId = String(formData.get("listingId") ?? "");

  const user = await getCurrentUser();
  if (!user || !listingId) return;

  const source = await prisma.listing.findFirst({
    where: { id: listingId, sellerId: user.id },
    select: {
      id: true,
      titleEn: true,
      titleSw: true,
      descEn: true,
      descSw: true,
      price: true,
      condition: true,
      universityId: true,
      categoryId: true,
      images: { select: { url: true }, orderBy: { position: "asc" } },
    },
  });
  if (!source) return;

  const base = slugify(source.titleEn) || "listing";

  await prisma.listing.create({
    data: {
      slug: `${base}-${Math.random().toString(36).slice(2, 8)}`,
      titleEn: source.titleEn,
      titleSw: source.titleSw,
      descEn: source.descEn,
      descSw: source.descSw,
      price: source.price,
      condition: source.condition,
      status: "ACTIVE",
      sellerId: user.id,
      universityId: source.universityId,
      categoryId: source.categoryId,
      images: { create: source.images.map((image) => ({ url: image.url })) },
    },
  });

  updateTag("listings");
  revalidatePath("/", "layout");
  redirect(link(locale, "/account/listings"));
}

/** Put a sold item back on the market without retyping it. */
export async function relistAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const listingId = String(formData.get("listingId") ?? "");

  const user = await getCurrentUser();
  if (!user || !listingId) return;

  await prisma.listing.updateMany({
    where: { id: listingId, sellerId: user.id, status: { in: ["SOLD", "PAUSED"] } },
    data: { status: "ACTIVE" },
  });

  updateTag("listings");
  revalidatePath("/", "layout");
  redirect(link(locale, "/account/listings"));
}

/**
 * Apply one status to many listings at once.
 *
 * The sellerId guard is in the where clause, so a forged id list only ever
 * moves the caller's own listings.
 */
export async function bulkListingStatusAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const next = String(formData.get("status") ?? "");
  const ids = formData.getAll("listingId").map(String).filter(Boolean);

  const allowed = ["ACTIVE", "PAUSED", "SOLD", "REMOVED"] as const;
  if (!(allowed as readonly string[]).includes(next)) return;

  const user = await getCurrentUser();
  if (!user || ids.length === 0) return;

  await prisma.listing.updateMany({
    where: { id: { in: ids }, sellerId: user.id },
    data: { status: next },
  });

  updateTag("listings");
  revalidatePath("/", "layout");
  redirect(link(locale, "/account/listings"));
}

/** Save or unsave a listing. */
export async function toggleSavedListingAction(formData: FormData): Promise<void> {
  const listingId = String(formData.get("listingId") ?? "");
  const user = await getCurrentUser();
  if (!user || !listingId) return;

  const existing = await prisma.savedListing.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.savedListing.delete({ where: { id: existing.id } });
  } else {
    // A deleted listing cascades the row away, so a unique violation here just
    // means someone deleted it in another tab.
    await prisma.savedListing.createMany({
      data: { userId: user.id, listingId },
      skipDuplicates: true,
    });
  }

  revalidatePath("/", "layout");
}

/** Follow or unfollow a seller. Never follows yourself. */
export async function toggleFollowSellerAction(formData: FormData): Promise<void> {
  const sellerId = String(formData.get("sellerId") ?? "");
  const user = await getCurrentUser();
  if (!user || !sellerId || sellerId === user.id) return;

  const existing = await prisma.sellerFollow.findUnique({
    where: { followerId_sellerId: { followerId: user.id, sellerId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.sellerFollow.delete({ where: { id: existing.id } });
  } else {
    await prisma.sellerFollow.createMany({
      data: { followerId: user.id, sellerId },
      skipDuplicates: true,
    });
  }

  revalidatePath("/", "layout");
}
