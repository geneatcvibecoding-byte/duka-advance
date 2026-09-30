import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowDownUp, Grid2X2, List, RotateCcw, SearchX, Sparkles, Tag } from "lucide-react";
import { prisma } from "@/lib/db";
import { getNavCategories } from "@/lib/settings";
import { queryCatalogue, type CatalogueQuery } from "@/lib/catalogue";
import { getTranslator, link, pick, pickOptional, resolveLocale } from "@/lib/i18n";
import { ProductCard, ProductGrid } from "@/components/ProductCard";
import { CatalogueFilters, Pagination } from "@/components/CatalogueFilters";
import { EmptyState } from "@/components/ui";
import { formatTZS } from "@/lib/tz";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<CatalogueQuery>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Not found" };

  return {
    title: `${pick(locale, category.nameEn, category.nameSw)} · AliExpress-Style Deals`,
    description: pickOptional(locale, category.descEn, category.descSw) ?? undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ locale: raw, slug }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
  });
  if (!category) notFound();

  const [categories, result] = await Promise.all([
    getNavCategories(),
    queryCatalogue(query, { categorySlug: slug }),
  ]);

  const name = pick(locale, category.nameEn, category.nameSw);
  const description = pickOptional(locale, category.descEn, category.descSw);
  const basePath = link(locale, `/category/${slug}`);

  const viewMode = query.view === "list" ? "list" : "grid";

  // Build sorting and view toggle URLs preserving other query params
  const buildSortHref = (sortVal: string) => {
    const p = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val && key !== "sort" && key !== "page") p.set(key, String(val));
    }
    if (sortVal) p.set("sort", sortVal);
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const buildViewHref = (mode: "grid" | "list") => {
    const p = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val && key !== "view") p.set(key, String(val));
    }
    if (mode === "list") p.set("view", "list");
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const activeSort = query.sort || "newest";

  const sortTabs = [
    { id: "newest", label: "Best Match" },
    { id: "popular", label: "Orders / Popular" },
    { id: "price-asc", label: "Price: Low to High" },
    { id: "price-desc", label: "Price: High to Low" },
    { id: "rating", label: "Top Rated" },
    { id: "discount", label: "Big Discount" },
  ];

  const hasPriceFilter = Boolean(query.min || query.max);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Category Top Banner & Deal Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {name}
            </h1>
            {query.deals === "1" && (
              <span className="rounded-md bg-amber-500 px-2 py-0.5 text-xs font-bold text-slate-950 shadow-xs">
                SUPER DEALS
              </span>
            )}
          </div>
          {description ? (
            <p className="mt-1 text-xs text-slate-600 max-w-2xl">{description}</p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>
              {result.total === 1
                ? t("shop.resultCountOne")
                : t("shop.resultCount", { count: result.total })}
            </span>
            {hasPriceFilter && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800 border border-amber-200/60">
                  <span>
                    Price: {query.min ? formatTZS(Number(query.min)) : "TSh 0"} –{" "}
                    {query.max ? formatTZS(Number(query.max)) : "1M+ TSh"}
                  </span>
                  <Link
                    href={basePath}
                    title="Clear price filter"
                    className="hover:text-amber-950"
                  >
                    <RotateCcw size={10} />
                  </Link>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Deal Filter Pills */}
        <div className="flex items-center gap-2">
          <Link
            href={query.deals === "1" ? basePath : `${basePath}?deals=1`}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              query.deals === "1"
                ? "border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-400/20"
                : "border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Tag size={13} className="text-amber-600" aria-hidden />
            <span>Super Deals</span>
          </Link>

          <Link
            href={query.choice === "1" ? basePath : `${basePath}?choice=1`}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              query.choice === "1"
                ? "border-slate-900 bg-slate-900 text-amber-300 shadow-xs"
                : "border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Sparkles size={13} className="text-amber-400" aria-hidden />
            <span>AliExpress Choice</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CatalogueFilters
            locale={locale}
            action={basePath}
            categories={categories}
            current={query}
            lockedCategory
          />
        </aside>

        <div className="space-y-4">
          {/* Sorting & View Mode Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-md px-3.5 py-2.5 shadow-xs">
            {/* Sort options as horizontal clean segmented buttons */}
            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto text-xs">
              <span className="mr-1 flex items-center gap-1 font-semibold text-slate-500 shrink-0">
                <ArrowDownUp size={13} aria-hidden />
                Sort:
              </span>
              {sortTabs.map((tab) => {
                const isActive = activeSort === tab.id;
                return (
                  <Link
                    key={tab.id}
                    href={buildSortHref(tab.id)}
                    className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-slate-900 font-semibold text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
              <Link
                href={buildViewHref("grid")}
                title="Grid view"
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "grid"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Grid2X2 size={16} aria-hidden />
              </Link>
              <Link
                href={buildViewHref("list")}
                title="List view"
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <List size={16} aria-hidden />
              </Link>
            </div>
          </div>

          {/* Results display */}
          {result.products.length === 0 ? (
            <EmptyState
              icon={<SearchX size={40} aria-hidden />}
              title={t("shop.noResults")}
              body={t("shop.noResultsHint")}
            />
          ) : (
            <>
              <ProductGrid view={viewMode}>
                {result.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    view={viewMode}
                  />
                ))}
              </ProductGrid>

              <Pagination
                locale={locale}
                basePath={basePath}
                searchParams={query as Record<string, string | undefined>}
                page={result.page}
                totalPages={result.totalPages}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
