import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Shop settings are read on nearly every page (header, footer, checkout).
 * `cache` deduplicates the query within a single request.
 */
export const getShopSettings = cache(async () => {
  const settings = await prisma.shopSettings.findUnique({ where: { id: "shop" } });

  // A fresh database with no seed still has to render rather than crash.
  return (
    settings ?? {
      id: "shop",
      nameEn: "Duka",
      nameSw: "Duka",
      taglineEn: "Online shop",
      taglineSw: "Duka la mtandaoni",
      phone: "+255000000000",
      whatsapp: "+255000000000",
      email: "hello@example.com",
      addressLine: "",
      mpesaName: null,
      mpesaLipaNamba: null,
      tigoPesaNumber: null,
      airtelMoneyNumber: null,
      halopesaNumber: null,
      bankName: null,
      bankAccountName: null,
      bankAccountNumber: null,
      freeDeliveryOver: null,
      marketplaceFeePercent: 6,
      updatedAt: new Date(),
    }
  );
});

export type ShopSettings = Awaited<ReturnType<typeof getShopSettings>>;

/** Navigation needs the category list almost as often as the settings. */
export const getNavCategories = cache(async () => {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { id: true, slug: true, nameEn: true, nameSw: true, image: true },
  });
});

export const getDeliveryZones = cache(async () => {
  return prisma.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
});

/**
 * Delivery fee for a region, honouring the free-delivery threshold.
 * Unknown regions fall back to the most expensive zone so the shop never
 * under-charges for a destination it has not priced.
 */
export async function calculateDelivery(
  region: string,
  subtotal: number,
): Promise<{ fee: number; etaMinDays: number; etaMaxDays: number; isFree: boolean }> {
  const [settings, zones] = await Promise.all([getShopSettings(), getDeliveryZones()]);

  const zone =
    zones.find((z) => z.region === region) ??
    zones.reduce<(typeof zones)[number] | null>(
      (worst, z) => (!worst || z.fee > worst.fee ? z : worst),
      null,
    );

  if (!zone) return { fee: 0, etaMinDays: 1, etaMaxDays: 5, isFree: true };

  const isFree =
    settings.freeDeliveryOver !== null && subtotal >= settings.freeDeliveryOver;

  return {
    fee: isFree ? 0 : zone.fee,
    etaMinDays: zone.etaMinDays,
    etaMaxDays: zone.etaMaxDays,
    isFree,
  };
}
