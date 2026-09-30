import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { resolveLocale } from "@/lib/i18n";
import { getShopSettings } from "@/lib/settings";
import { getVisitorStats } from "@/lib/analytics";
import { AdminSellingPanel } from "@/components/admin/AdminSellingPanel";

export const metadata: Metadata = {
  title: "Selling Hub & Home Stock",
};

export default async function SellingPanelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  await requireAdmin(locale);

  const [products, sellers, analytics, categories, universities, settings] =
    await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, nameEn: true, nameSw: true } },
          images: { take: 1, orderBy: { position: "asc" } },
        },
      }),
      prisma.user.findMany({
        where: { role: "CUSTOMER" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          studentNumber: true,
          studentVerifiedAt: true,
          isActive: true,
          payoutMethod: true,
          payoutNumber: true,
          university: { select: { nameEn: true, slug: true } },
          _count: { select: { listings: true, orders: true } },
        },
        take: 50,
      }),
      getVisitorStats(),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
        select: { id: true, slug: true, nameEn: true },
      }),
      prisma.university.findMany({
        where: { isActive: true },
        orderBy: { nameEn: "asc" },
        select: { id: true, slug: true, nameEn: true },
      }),
      getShopSettings(),
    ]);

  return (
    <AdminSellingPanel
      initialProducts={products}
      initialSellers={sellers}
      analytics={analytics}
      categories={categories}
      universities={universities}
      shopSettings={{
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
      }}
      locale={locale}
    />
  );
}
