"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { normalizePhone } from "@/lib/tz";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized. Admin access required.");
  }
  return user;
}

export type ActionResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

/**
 * Add an item directly to stock / inventory from the Selling Panel.
 */
export async function quickAddStockAction(formData: FormData): Promise<ActionResponse> {
  await assertAdmin();

  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameSw = String(formData.get("nameSw") ?? "").trim() || nameEn;
  const price = Number(formData.get("price") ?? 0);
  const stock = Number(formData.get("stock") ?? 1);
  const categoryId = String(formData.get("categoryId") ?? "");
  const descEn = String(formData.get("descEn") ?? "").trim();
  const descSw = String(formData.get("descSw") ?? "").trim() || descEn;
  const brand = String(formData.get("brand") ?? "").trim() || "Duka Campus";
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || "/img/p/casio-calculator.svg";
  const isFeatured = formData.get("isFeatured") === "on";

  if (!nameEn) return { ok: false, error: "Item name in English is required." };
  if (!categoryId) return { ok: false, error: "Please select a category." };
  if (price <= 0) return { ok: false, error: "Price must be greater than zero." };

  const baseSlug = slugify(nameEn);
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
  const sku = `STK-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const created = await prisma.product.create({
      data: {
        slug: uniqueSlug,
        nameEn,
        nameSw,
        descEn: descEn || `${nameEn} - Available directly from campus stock.`,
        descSw: descSw || `${nameSw} - Inapatikana moja kwa moja stoo.`,
        brand,
        sku,
        price,
        stock,
        lowStockAt: 3,
        categoryId,
        isActive: true,
        isFeatured,
      },
    });

    // Create product image
    await prisma.productImage.create({
      data: {
        productId: created.id,
        url: imageUrl,
        alt: nameEn,
        position: 0,
      },
    });

    revalidatePath("/", "layout");
    return { ok: true, message: `Added "${nameEn}" to inventory successfully!` };
  } catch (err) {
    console.error("quickAddStockAction error:", err);
    return { ok: false, error: "Failed to create stock item." };
  }
}

/**
 * Remove an item from stock / inventory.
 */
export async function quickRemoveStockAction(formData: FormData): Promise<ActionResponse> {
  await assertAdmin();

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { ok: false, error: "Missing product ID." };

  try {
    const orderCount = await prisma.orderItem.count({ where: { productId } });
    if (orderCount > 0) {
      // Deactivate so historic orders are preserved
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: false, stock: 0 },
      });
      revalidatePath("/", "layout");
      return { ok: true, message: "Item archived and marked out of stock." };
    }

    // Delete images first
    await prisma.productImage.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });

    revalidatePath("/", "layout");
    return { ok: true, message: "Stock item deleted permanently." };
  } catch (err) {
    console.error("quickRemoveStockAction error:", err);
    return { ok: false, error: "Failed to remove stock item." };
  }
}

/**
 * Quick inline update of stock quantity.
 */
export async function quickUpdateStockQtyAction(formData: FormData): Promise<ActionResponse> {
  await assertAdmin();

  const productId = String(formData.get("productId") ?? "");
  const stock = Number(formData.get("stock") ?? 0);

  if (!productId) return { ok: false, error: "Missing product ID." };
  if (stock < 0) return { ok: false, error: "Stock cannot be negative." };

  try {
    await prisma.product.update({
      where: { id: productId },
      data: { stock, isActive: stock > 0 },
    });
    revalidatePath("/", "layout");
    return { ok: true, message: `Stock updated to ${stock}.` };
  } catch (err) {
    console.error("quickUpdateStockQtyAction error:", err);
    return { ok: false, error: "Failed to update stock quantity." };
  }
}

/**
 * Add a new seller via Admin capabilities.
 */
export async function addSellerAction(formData: FormData): Promise<ActionResponse> {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  const universityId = String(formData.get("universityId") ?? "");
  const studentNumber = String(formData.get("studentNumber") ?? "").trim();
  const payoutMethod = String(formData.get("payoutMethod") ?? "MPESA");
  const payoutNumber = String(formData.get("payoutNumber") ?? "").trim();

  if (!name) return { ok: false, error: "Seller name is required." };
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid phone number (e.g., 0712 345 678)." };

  // Check phone clash
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return { ok: false, error: "A user with this phone number already exists." };
  }

  try {
    await prisma.user.create({
      data: {
        name,
        phone,
        email: rawEmail || null,
        passwordHash: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyL1d6sWqCvh6j4r2jP5kO1kF5Xw4X8O", // Default temp pass
        role: "CUSTOMER",
        universityId: universityId || null,
        studentNumber: studentNumber || null,
        studentVerifiedAt: new Date(), // Auto-verified by Admin
        payoutMethod,
        payoutNumber: payoutNumber ? normalizePhone(payoutNumber) : phone,
        payoutName: name,
        isActive: true,
      },
    });

    revalidatePath("/", "layout");
    return { ok: true, message: `New seller "${name}" added and verified successfully!` };
  } catch (err) {
    console.error("addSellerAction error:", err);
    return { ok: false, error: "Failed to add new seller." };
  }
}

/**
 * Toggle seller student verification status.
 */
export async function toggleSellerVerificationAction(formData: FormData): Promise<ActionResponse> {
  await assertAdmin();

  const sellerId = String(formData.get("sellerId") ?? "");
  if (!sellerId) return { ok: false, error: "Missing seller ID." };

  try {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { studentVerifiedAt: true },
    });
    if (!seller) return { ok: false, error: "Seller not found." };

    const newVerifiedAt = seller.studentVerifiedAt ? null : new Date();
    await prisma.user.update({
      where: { id: sellerId },
      data: { studentVerifiedAt: newVerifiedAt },
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: newVerifiedAt ? "Seller verified!" : "Seller verification revoked.",
    };
  } catch (err) {
    console.error("toggleSellerVerificationAction error:", err);
    return { ok: false, error: "Failed to update verification status." };
  }
}

/**
 * Remove or deactivate a seller.
 */
export async function removeSellerAction(formData: FormData): Promise<ActionResponse> {
  await assertAdmin();

  const sellerId = String(formData.get("sellerId") ?? "");
  if (!sellerId) return { ok: false, error: "Missing seller ID." };

  try {
    await prisma.user.update({
      where: { id: sellerId },
      data: { isActive: false, studentVerifiedAt: null },
    });

    // Also pause their listings
    await prisma.listing.updateMany({
      where: { sellerId },
      data: { status: "PAUSED" },
    });

    revalidatePath("/", "layout");
    return { ok: true, message: "Seller deactivated and their listings paused." };
  } catch (err) {
    console.error("removeSellerAction error:", err);
    return { ok: false, error: "Failed to deactivate seller." };
  }
}

/**
 * Update primary seller contact info (Gene / Admin) in shop settings.
 */
export async function updateSellerContactSettingsAction(formData: FormData): Promise<ActionResponse> {
  await assertAdmin();

  const phone = String(formData.get("phone") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!phone || !whatsapp) {
    return { ok: false, error: "Phone and WhatsApp numbers are required." };
  }

  try {
    await prisma.shopSettings.upsert({
      where: { id: "shop" },
      create: {
        id: "shop",
        nameEn: "Duka Campus",
        nameSw: "Duka la Chuo",
        taglineEn: "Campus Marketplace & Student Store",
        taglineSw: "Soko la Wanafunzi na Duka la Chuo",
        phone,
        whatsapp,
        email: email || "gene.atc.vibe.coding@gmail.com",
        addressLine: "Campus Student Center & Safe Trade Zone",
      },
      update: {
        phone,
        whatsapp,
        email: email || undefined,
      },
    });

    revalidatePath("/", "layout");
    return { ok: true, message: "Seller direct contact details updated successfully!" };
  } catch (err) {
    console.error("updateSellerContactSettingsAction error:", err);
    return { ok: false, error: "Failed to update seller contact details." };
  }
}
