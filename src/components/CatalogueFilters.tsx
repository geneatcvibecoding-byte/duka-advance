"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Filter, RotateCcw, Sparkles, Star, Tag, Truck, X } from "lucide-react";
import { Select, buttonStyles } from "@/components/ui";
import { getTranslator, pick, type Locale } from "@/lib/i18n";
import { PriceRangeFilter, PRICE_PRESETS } from "./PriceRangeFilter";

export { PriceRangeFilter, PRICE_PRESETS };

export type FilterCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameSw: string;
};

export function CatalogueFilters({
  locale,
  action,
  categories,
  current,
  lockedCategory,
}: {
  locale: Locale;
  action: string;
  categories: FilterCategory[];
  current: {
    q?: string;
    category?: string;
    min?: string;
    max?: string;
    sort?: string;
    inStock?: string;
    deals?: string;
    choice?: string;
    freeShipping?: string;
    minRating?: string;
  };
  lockedCategory?: boolean;
}) {
  const t = getTranslator(locale);
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasFilters = Boolean(
    current.q ||
      current.category ||
      current.min ||
      current.max ||
      current.inStock ||
      current.deals ||
      current.choice ||
      current.freeShipping ||
      current.minRating,
  );

  const removeSingleFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    router.push(`${action}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Active filters summary */}
      {hasFilters && (
        <div className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Active Filters</span>
            <Link
              href={action}
              className="text-[11px] font-medium text-amber-700 hover:underline flex items-center gap-1"
            >
              <RotateCcw size={11} aria-hidden />
              {t("common.clear")}
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {current.category && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-800">
                <span>Cat: {current.category}</span>
                <button
                  type="button"
                  onClick={() => removeSingleFilter("category")}
                  className="hover:text-slate-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {(current.min || current.max) && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-800">
                <span>
                  {current.min ? `${Number(current.min).toLocaleString()} TSh` : "0"} –{" "}
                  {current.max ? `${Number(current.max).toLocaleString()} TSh` : "∞"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("min");
                    params.delete("max");
                    router.push(`${action}?${params.toString()}`);
                  }}
                  className="hover:text-slate-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {current.deals === "1" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 text-xs font-medium">
                Super Deals
                <button
                  type="button"
                  onClick={() => removeSingleFilter("deals")}
                  className="hover:text-amber-950"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {current.choice === "1" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-amber-300 px-2 py-0.5 text-xs font-medium">
                CHOICE
                <button
                  type="button"
                  onClick={() => removeSingleFilter("choice")}
                  className="hover:text-white"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {current.freeShipping === "1" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 text-xs">
                Free Delivery
                <button
                  type="button"
                  onClick={() => removeSingleFilter("freeShipping")}
                  className="hover:text-emerald-950"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {current.inStock === "1" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-800">
                In Stock
                <button
                  type="button"
                  onClick={() => removeSingleFilter("inStock")}
                  className="hover:text-slate-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Filter Form */}
      <form
        method="get"
        action={action}
        className="space-y-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-5 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <Filter size={15} aria-hidden />
            {t("shop.filters")}
          </h2>
          <span className="text-[11px] font-medium text-slate-500">TZS</span>
        </div>

        {current.q ? <input type="hidden" name="q" value={current.q} /> : null}
        {current.sort ? <input type="hidden" name="sort" value={current.sort} /> : null}

        {/* Category Selector */}
        {!lockedCategory ? (
          <div>
            <label className="field-label text-xs font-semibold text-slate-800" htmlFor="filter-category">
              {t("shop.category")}
            </label>
            <Select
              id="filter-category"
              name="category"
              defaultValue={current.category ?? ""}
              className="text-xs"
            >
              <option value="">{t("common.all")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {pick(locale, category.nameEn, category.nameSw)}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {/* Range-Based Price Filtering Component */}
        <PriceRangeFilter
          action={action}
          locale={locale}
          currentMin={current.min}
          currentMax={current.max}
          embeddedInForm
          showHistogram
        />

        {/* AliExpress Deals & Badges Checkboxes */}
        <div className="space-y-2.5 border-t border-slate-100 pt-3">
          <label className="text-xs font-semibold text-slate-800 block">
            Special Deals & Perks
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              name="deals"
              value="1"
              defaultChecked={current.deals === "1"}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="flex items-center gap-1.5 font-medium">
              <Tag size={13} className="text-amber-600" aria-hidden />
              <span>Super Deals (Discounted)</span>
            </span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              name="choice"
              value="1"
              defaultChecked={current.choice === "1"}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles size={13} className="text-amber-500" aria-hidden />
              <span>Choice Curated Items</span>
            </span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              name="freeShipping"
              value="1"
              defaultChecked={current.freeShipping === "1"}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="flex items-center gap-1.5">
              <Truck size={13} className="text-slate-500" aria-hidden />
              <span>Free Delivery Eligible</span>
            </span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              name="inStock"
              value="1"
              defaultChecked={current.inStock === "1"}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="flex items-center gap-1.5">
              <Check size={13} className="text-emerald-600" aria-hidden />
              <span>{t("shop.inStockOnly")}</span>
            </span>
          </label>
        </div>

        {/* Rating Filter */}
        <div className="border-t border-slate-100 pt-3">
          <label className="text-xs font-semibold text-slate-800 block mb-2">
            Customer Rating
          </label>
          <div className="space-y-1.5">
            {[
              { val: "4.5", label: "4.5 stars & above" },
              { val: "4.0", label: "4.0 stars & above" },
            ].map((r) => (
              <label key={r.val} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="minRating"
                  value={r.val}
                  defaultChecked={current.minRating === r.val}
                  className="h-3.5 w-3.5 text-slate-900 border-slate-300"
                />
                <span className="flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 text-amber-500" />
                  <span>{r.label}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            {t("common.apply")}
          </button>
          {hasFilters ? (
            <Link
              href={action}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {t("common.clear")}
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export function Pagination({
  locale,
  basePath,
  searchParams,
  page,
  totalPages,
}: {
  locale: Locale;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const t = getTranslator(locale);

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
  );

  return (
    <nav aria-label="Pagination" className="mt-10 flex justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={buttonStyles("secondary", "sm")}>
          ← {t("common.back")}
        </Link>
      ) : null}

      {pages.map((n, index) => (
        <span key={n} className="flex items-center gap-1.5">
          {index > 0 && n - pages[index - 1] > 1 ? (
            <span className="px-1 text-slate-400">…</span>
          ) : null}
          <Link
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={buttonStyles(n === page ? "primary" : "secondary", "sm", "min-w-9")}
          >
            {n}
          </Link>
        </span>
      ))}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={buttonStyles("secondary", "sm")}>
          →
        </Link>
      ) : null}
    </nav>
  );
}
