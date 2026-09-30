import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getShopSettings } from "@/lib/settings";
import { formatDate, getTranslator, link, pick, resolveLocale } from "@/lib/i18n";
import { formatTZS, whatsappNumber } from "@/lib/tz";
import { discountPercent } from "@/lib/utils";
import { AddToCartForm, type VariantOption } from "@/components/AddToCartForm";
import { ReviewForm } from "@/components/ReviewForm";
import { ProductCard, ProductGrid } from "@/components/ProductCard";
import { Badge, SectionHeading } from "@/components/ui";
import { toggleWishlistAction } from "@/app/actions/product";

type Props = { params: Promise<{ locale: string; slug: string }> };

async function loadProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const product = await loadProduct(slug);
  if (!product) return { title: "Not found" };

  const name = pick(locale, product.nameEn, product.nameSw);
  const description = pick(locale, product.descEn, product.descSw).slice(0, 160);
  const path = `/product/${product.slug}`;

  return {
    title: name,
    description,
    // Tells Google the English and Swahili pages are translations of each
    // other, not duplicate content competing for the same ranking.
    alternates: {
      canonical: link(locale, path),
      languages: { en: link("en", path), sw: link("sw", path) },
    },
    openGraph: { title: name, description, images: product.images[0]?.url },
  };
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-gold-500"
      aria-label={`${rating} / 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill={n <= Math.round(rating) ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export default async function ProductPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const product = await loadProduct(slug);
  if (!product) notFound();

  const [settings, user] = await Promise.all([getShopSettings(), getCurrentUser()]);

  const [related, wishlisted] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameSw: true,
        price: true,
        compareAt: true,
        stock: true,
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true, alt: true } },
      },
      take: 4,
    }),
    user
      ? prisma.wishlistItem.findUnique({
          where: { userId_productId: { userId: user.id, productId: product.id } },
        })
      : null,
  ]);

  const name = pick(locale, product.nameEn, product.nameSw);
  const description = pick(locale, product.descEn, product.descSw);
  const categoryName = pick(locale, product.category.nameEn, product.category.nameSw);
  const discount = discountPercent(product.price, product.compareAt);

  const totalStock =
    product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + v.stock, 0)
      : product.stock;
  const outOfStock = totalStock <= 0;

  const variantOptions: VariantOption[] = product.variants.map((v) => ({
    id: v.id,
    label: pick(locale, v.optionEn, v.optionSw),
    value: v.value,
    priceDelta: v.priceDelta,
    stock: v.stock,
  }));

  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  const whatsappText = encodeURIComponent(
    `Habari, ${name} (${formatTZS(product.price)}) — ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${link(locale, `/product/${product.slug}`)}`,
  );

  // Structured data: this is what makes Google show the price, stock status and
  // star rating directly in the search result.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    sku: product.sku ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: product.images.map((image) => `${siteUrl}${image.url}`),
    offers: {
      "@type": "Offer",
      priceCurrency: "TZS",
      price: product.price,
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: `${siteUrl}${link(locale, `/product/${product.slug}`)}`,
    },
    aggregateRating:
      product.reviews.length > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: averageRating.toFixed(1),
            reviewCount: product.reviews.length,
          }
        : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <script
        type="application/ld+json"
        // Content is our own database values, not user HTML.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={link(locale, "/")} className="hover:text-brand-700">
              {t("nav.home")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href={link(locale, `/category/${product.category.slug}`)}
              className="hover:text-brand-700"
            >
              {categoryName}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink-800">{name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
            {product.images[0] ? (
              <img
                src={product.images[0].url}
                alt={product.images[0].alt ?? name}
                width={800}
                height={800}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="grid aspect-square place-items-center text-ink-400">
                {name}
              </div>
            )}
          </div>

          {product.images.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.images.map((image) => (
                <img
                  key={image.id}
                  src={image.url}
                  alt={image.alt ?? name}
                  width={120}
                  height={120}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg border border-ink-200 object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{categoryName}</Badge>
            {product.brand ? (
              <span className="text-sm text-ink-500">{product.brand}</span>
            ) : null}
          </div>

          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-ink-900 sm:text-3xl">
            {name}
          </h1>

          {product.reviews.length > 0 ? (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Stars rating={averageRating} />
              <span className="text-ink-500">
                {averageRating.toFixed(1)} · {product.reviews.length}{" "}
                {t("product.reviews").toLowerCase()}
              </span>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-black text-ink-900">
              {formatTZS(product.price)}
            </span>
            {discount !== null ? (
              <>
                <span className="text-lg text-ink-400 line-through">
                  {formatTZS(product.compareAt!)}
                </span>
                <Badge tone="warning">{t("product.save", { percent: discount })}</Badge>
              </>
            ) : null}
          </div>

          <p className="mt-2 text-sm font-medium">
            {outOfStock ? (
              <span className="text-red-600">{t("product.outOfStock")}</span>
            ) : totalStock <= 5 ? (
              <span className="text-gold-700">
                {t("product.lowStock", { count: totalStock })}
              </span>
            ) : (
              <span className="text-brand-700">{t("product.inStock")}</span>
            )}
          </p>

          <div className="mt-6 border-y border-ink-200 py-6">
            <AddToCartForm
              productId={product.id}
              variants={variantOptions}
              optionLabel={variantOptions[0]?.label ?? null}
              outOfStock={outOfStock}
              labels={{
                addToCart: t("product.addToCart"),
                added: t("product.added"),
                quantity: t("product.quantity"),
                outOfStock: t("product.outOfStock"),
                chooseOption: t("product.quantity"),
              }}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            {user ? (
              <form action={toggleWishlistAction}>
                <input type="hidden" name="productId" value={product.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 font-medium text-ink-700 hover:text-brand-700"
                >
                  <Heart
                    size={17}
                    aria-hidden
                    fill={wishlisted ? "currentColor" : "none"}
                    className={wishlisted ? "text-red-500" : ""}
                  />
                  {wishlisted
                    ? t("product.removeFromWishlist")
                    : t("product.addToWishlist")}
                </button>
              </form>
            ) : null}

            <a
              href={`https://wa.me/${whatsappNumber(settings.whatsapp)}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-ink-700 hover:text-brand-700"
            >
              <MessageCircle size={17} aria-hidden />
              {t("product.askAboutProduct")}
            </a>
          </div>

          <dl className="mt-6 space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-ink-600">
              <Truck size={16} aria-hidden className="shrink-0 text-brand-600" />
              <span>{t("home.why2Body")}</span>
            </div>
            <div className="flex items-center gap-2 text-ink-600">
              <ShieldCheck size={16} aria-hidden className="shrink-0 text-brand-600" />
              <span>{t("home.why1Body")}</span>
            </div>
            {product.sku ? (
              <div className="flex gap-2 pt-1 text-ink-500">
                <dt className="font-medium">{t("product.sku")}:</dt>
                <dd>{product.sku}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-lg font-bold text-ink-900">{t("product.description")}</h2>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-700">
          {description}
        </p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-lg font-bold text-ink-900">{t("product.reviews")}</h2>

        {product.reviews.length === 0 ? (
          <p className="mt-3 text-ink-600">{t("product.noReviews")}</p>
        ) : (
          <ul className="mt-4 space-y-5">
            {product.reviews.map((review) => (
              <li key={review.id} className="border-b border-ink-200 pb-5 last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars rating={review.rating} />
                  <span className="font-medium text-ink-900">{review.user.name}</span>
                  <span className="text-sm text-ink-500">
                    {formatDate(review.createdAt, locale)}
                  </span>
                </div>
                <p className="mt-1.5 leading-relaxed text-ink-700">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          {user ? (
            <ReviewForm
              productId={product.id}
              labels={{
                heading: t("product.writeReview"),
                rating: t("product.yourRating"),
                review: t("product.yourReview"),
                submit: t("product.submitReview"),
                submitted: t("product.reviewSubmitted"),
              }}
            />
          ) : (
            <p className="text-sm text-ink-600">
              <Link
                href={link(locale, "/login")}
                className="font-semibold text-brand-700 hover:underline"
              >
                {t("product.reviewLoginRequired")}
              </Link>
            </p>
          )}
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mt-14">
          <SectionHeading title={t("product.related")} />
          <ProductGrid>
            {related.map((item) => (
              <ProductCard key={item.id} product={item} locale={locale} />
            ))}
          </ProductGrid>
        </section>
      ) : null}
    </div>
  );
}
