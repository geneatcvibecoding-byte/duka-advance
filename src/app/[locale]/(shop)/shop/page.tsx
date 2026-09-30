import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownUp, Grid2X2, List, SearchX, Sparkles, Tag } from "lucide-react";
import { getNavCategories } from "@/lib/settings";
import { queryCatalogue, type CatalogueQuery } from "@/lib/catalogue";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { ProductCard, ProductGrid } from "@/components/ProductCard";
import { CatalogueFilters, Pagination } from "@/components/CatalogueFilters";
import { EmptyState } from "@/components/ui";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<CatalogueQuery>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const t = getTranslator(resolveLocale(raw));
  return { title: `${t("shop.title")} · AliExpress-Style Deals` };
}

export default async function ShopPage({ params, searchParams }: Props) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const [categories, result] = await Promise.all([
    getNavCategories(),
    queryCatalogue(query),
  ]);

  const viewMode = query.view === "list" ? "list" : "grid";

  const heading = query.q
    ? t("shop.searchResultsFor", { query: query.q })
    : query.deals === "1"
      ? "Super Deals & Discount Catalogue"
      : query.choice === "1"
        ? "AliExpress Choice & Curated Selection"
        : t("shop.title");

  // Helper to create sort link keeping other search params
  const buildSortHref = (sortVal: string) => {
    const p = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val && key !== "sort" && key !== "page") p.set(key, String(val));
    }
    if (sortVal) p.set("sort", sortVal);
    const qs = p.toString();
    return qs ? `${link(locale, "/shop")}?${qs}` : link(locale, "/shop");
  };

  const buildViewHref = (mode: "grid" | "list") => {
    const p = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val && key !== "view") p.set(key, String(val));
    }
    if (mode === "list") p.set("view", "list");
    const qs = p.toString();
    return qs ? `${link(locale, "/shop")}?${qs}` : link(locale, "/shop");
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* AliExpress Top Category & Deal Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {heading}
            </h1>
            {query.deals === "1" && (
              <span className="rounded-md bg-amber-500 px-2 py-0.5 text-xs font-bold text-slate-950 shadow-xs">
                SUPER DEALS
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {result.total === 1
              ? t("shop.resultCountOne")
              : t("shop.resultCount", { count: result.total })}
            {" · "}
            {locale === "sw" ? "Uhakiki wa Ubora na Ulinzi wa Escrow" : "Verified Quality with Escrow Protection"}
          </p>
        </div>

        {/* Quick Deal Filter Pills */}
        <div className="flex items-center gap-2">
          <Link
            href={query.deals === "1" ? link(locale, "/shop") : `${link(locale, "/shop")}?deals=1`}
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
            href={query.choice === "1" ? link(locale, "/shop") : `${link(locale, "/shop")}?choice=1`}
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
        {/* Left Filter Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CatalogueFilters
            locale={locale}
            action={link(locale, "/shop")}
            categories={categories}
            current={query}
          />
        </aside>

        {/* Right Product Grid + Sorting Toolbar */}
        <div className="space-y-4">
          {/* AliExpress Sorting & View Mode Strip */}
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

          {/* Results Display */}
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
                basePath={link(locale, "/shop")}
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
