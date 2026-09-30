import Link from "next/link";
import { Heart } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { ProductCard, ProductGrid } from "@/components/ProductCard";
import { EmptyState, buttonStyles } from "@/components/ui";

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = await requireUser(locale, link(locale, "/wishlist"));

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id, product: { isActive: true } },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameSw: true,
          price: true,
          compareAt: true,
          stock: true,
          images: {
            orderBy: { position: "asc" },
            take: 1,
            select: { url: true, alt: true },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink-900">
        {t("account.wishlist")}
      </h1>

      {items.length === 0 ? (
        <EmptyState
          icon={<Heart size={40} aria-hidden />}
          title={t("account.noWishlist")}
          action={
            <Link href={link(locale, "/shop")} className={buttonStyles("primary", "md")}>
              {t("cart.emptyCta")}
            </Link>
          }
        />
      ) : (
        <ProductGrid>
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} locale={locale} />
          ))}
        </ProductGrid>
      )}
    </div>
  );
}
