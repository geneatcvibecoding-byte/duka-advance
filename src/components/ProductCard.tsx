"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, ShieldCheck, Star, Truck } from "lucide-react";
import { getTranslator, link, pick, type Locale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { discountPercent } from "@/lib/utils";
import { ProductQuickViewModal } from "./ProductQuickViewModal";

export type ProductCardData = {
  id: string;
  slug: string;
  nameEn: string;
  nameSw: string;
  descEn?: string;
  descSw?: string;
  brand?: string | null;
  price: number;
  compareAt: number | null;
  stock: number;
  images: { url: string; alt: string | null }[];
  rating?: number;
  reviewsCount?: number;
  ordersCount?: number;
  isChoice?: boolean;
  hasFreeShipping?: boolean;
};

export function ProductCard({
  product,
  locale,
  view = "grid",
}: {
  product: ProductCardData;
  locale: Locale;
  view?: "grid" | "list";
}) {
  const [showQuickView, setShowQuickView] = useState(false);
  const t = getTranslator(locale);
  const name = pick(locale, product.nameEn, product.nameSw);
  const desc = pick(locale, product.descEn ?? "", product.descSw ?? "");
  const discount = discountPercent(product.price, product.compareAt);
  const outOfStock = product.stock <= 0;
  const image = product.images[0];

  const rating = product.rating ?? 4.8;
  const reviewsCount = product.reviewsCount ?? 42;
  const ordersCount = product.ordersCount ?? 110;
  const isChoice = product.isChoice ?? false;
  const hasFreeShipping = product.hasFreeShipping ?? product.price >= 100000;

  // List view layout (AliExpress horizontal comparison card)
  if (view === "list") {
    return (
      <>
        <article className="group relative flex flex-col sm:flex-row overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
          <div className="relative aspect-square w-full sm:w-56 shrink-0 overflow-hidden bg-slate-50">
            {image ? (
              <img
                src={image.url}
                alt={image.alt ?? name}
                loading="lazy"
                width={300}
                height={300}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-400">
                {name}
              </div>
            )}

            {/* Badges */}
            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
              {discount !== null && !outOfStock ? (
                <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-slate-950 shadow-sm">
                  -{discount}%
                </span>
              ) : null}
              {isChoice ? (
                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 shadow-sm">
                  CHOICE
                </span>
              ) : null}
            </div>

            {outOfStock ? (
              <div className="absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-xs">
                <span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                  {t("product.outOfStock")}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {product.brand ? (
                <span className="font-semibold uppercase tracking-wider text-slate-700">
                  {product.brand}
                </span>
              ) : null}
              <div className="flex items-center gap-1 text-amber-600 font-medium">
                <Star size={13} className="fill-amber-400 text-amber-500" aria-hidden />
                <span>{rating}</span>
                <span className="text-slate-400">({reviewsCount})</span>
              </div>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">{ordersCount}+ sold</span>
            </div>

            <h3 className="mt-1.5 text-base font-semibold leading-snug text-slate-900">
              <Link href={link(locale, `/product/${product.slug}`)} className="hover:underline">
                {name}
              </Link>
            </h3>

            {desc ? (
              <p className="mt-1 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                {desc}
              </p>
            ) : null}

            <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
              {hasFreeShipping ? (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                  <Truck size={13} aria-hidden />
                  {locale === "sw" ? "Usafirishaji Bure" : "Free Delivery"}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 text-slate-500">
                <ShieldCheck size={13} aria-hidden />
                Escrow Safe
              </span>
            </div>

            <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tabular-nums text-slate-900">
                  {formatTZS(product.price)}
                </span>
                {discount !== null && product.compareAt ? (
                  <span className="text-xs text-slate-400 line-through tabular-nums">
                    {formatTZS(product.compareAt)}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickView(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
                >
                  <Eye size={14} aria-hidden />
                  Quick View
                </button>
                <Link
                  href={link(locale, `/product/${product.slug}`)}
                  className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  {t("nav.shop")}
                </Link>
              </div>
            </div>
          </div>
        </article>

        {showQuickView && (
          <ProductQuickViewModal
            product={{
              id: product.id,
              slug: product.slug,
              name,
              desc,
              brand: product.brand,
              price: product.price,
              compareAt: product.compareAt,
              stock: product.stock,
              images: product.images,
              rating,
              reviewsCount,
              ordersCount,
              isChoice,
              hasFreeShipping,
            }}
            locale={locale}
            onClose={() => setShowQuickView(false)}
          />
        )}
      </>
    );
  }

  // Grid view layout (AliExpress high-density product card with quick-peek)
  return (
    <>
      <article className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          {image ? (
            <img
              src={image.url}
              alt={image.alt ?? name}
              loading="lazy"
              width={400}
              height={400}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-slate-400">
              {name}
            </div>
          )}

          {/* AliExpress Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {discount !== null && !outOfStock ? (
              <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[11px] font-black text-slate-950 shadow-sm">
                -{discount}%
              </span>
            ) : null}
            {isChoice ? (
              <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 shadow-sm">
                CHOICE
              </span>
            ) : null}
          </div>

          {outOfStock ? (
            <div className="absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-xs">
              <span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                {t("product.outOfStock")}
              </span>
            </div>
          ) : null}

          {/* Hover Quick View Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowQuickView(true);
            }}
            className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 rounded-lg border border-white/60 bg-white/90 backdrop-blur-md py-1.5 text-xs font-semibold text-slate-800 opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 hover:bg-white"
          >
            <Eye size={13} aria-hidden />
            <span>Quick View</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col p-3">
          {/* Metadata: Brand / Category & Ratings */}
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            {product.brand ? (
              <span className="truncate uppercase font-medium">{product.brand}</span>
            ) : (
              <span className="text-slate-400">Verified</span>
            )}
            <div className="flex items-center gap-1 font-semibold text-amber-600">
              <Star size={11} className="fill-amber-400 text-amber-500" aria-hidden />
              <span>{rating}</span>
            </div>
          </div>

          <h3 className="mt-1 line-clamp-2 text-xs font-semibold leading-tight text-slate-900 sm:text-sm">
            <Link
              href={link(locale, `/product/${product.slug}`)}
              className="hover:underline"
            >
              {name}
            </Link>
          </h3>

          {/* AliExpress delivery & sales tag */}
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
            {hasFreeShipping ? (
              <span className="font-medium text-emerald-700">Free Ship</span>
            ) : (
              <span>Express</span>
            )}
            <span className="text-slate-300">·</span>
            <span>{ordersCount}+ sold</span>
          </div>

          <div className="mt-auto pt-2.5">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums">
                {formatTZS(product.price)}
              </span>
              {discount !== null && product.compareAt ? (
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  {formatTZS(product.compareAt)}
                </span>
              ) : null}
            </div>

            {!outOfStock && product.stock <= 5 ? (
              <p className="mt-0.5 text-[11px] font-medium text-amber-700">
                {t("product.lowStock", { count: product.stock })}
              </p>
            ) : null}
          </div>
        </div>
      </article>

      {showQuickView && (
        <ProductQuickViewModal
          product={{
            id: product.id,
            slug: product.slug,
            name,
            desc,
            brand: product.brand,
            price: product.price,
            compareAt: product.compareAt,
            stock: product.stock,
            images: product.images,
            rating,
            reviewsCount,
            ordersCount,
            isChoice,
            hasFreeShipping,
          }}
          locale={locale}
          onClose={() => setShowQuickView(false)}
        />
      )}
    </>
  );
}

/** Shared grid wrapper so every listing lines up identically */
export function ProductGrid({
  children,
  view = "grid",
}: {
  children: React.ReactNode;
  view?: "grid" | "list";
}) {
  if (view === "list") {
    return <div className="flex flex-col gap-3">{children}</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}
