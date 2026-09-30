"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type ReviewState = { ok: boolean; message?: string } | null;

/**
 * Reviews land unapproved. A new shop cannot afford a spam review sitting on a
 * product page overnight, so an admin releases each one.
 */
export async function submitReviewAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to leave a review." };

  const productId = String(formData.get("productId") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!productId) return { ok: false, message: "Missing product." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: "Choose a rating from 1 to 5." };
  }
  if (comment.length < 4) {
    return { ok: false, message: "Please write a few words." };
  }

  await prisma.review.upsert({
    where: { productId_userId: { productId, userId: user.id } },
    create: {
      productId,
      userId: user.id,
      rating,
      comment: comment.slice(0, 1000),
      isApproved: false,
    },
    // Re-reviewing replaces the previous text and sends it back for approval.
    update: { rating, comment: comment.slice(0, 1000), isApproved: false },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleWishlistAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  }

  revalidatePath("/", "layout");
}
