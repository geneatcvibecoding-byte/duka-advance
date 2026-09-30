import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSellerListingsManaged } from "@/lib/seller-dashboard";
import { getTranslator, link, pick, resolveLocale } from "@/lib/i18n";
import { buttonStyles, EmptyState } from "@/components/ui";
import { ListingManager } from "@/components/ListingManager";

export default async function MyListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = (await getCurrentUser())!; // guarded by the account layout

  const filters = {
    q: (query.q ?? "").slice(0, 80),
    status: query.status ?? "",
    sort: query.sort ?? "newest",
  };

  const rows = await getSellerListingsManaged(user.id, filters);

  const statusOptions = [
    { value: "DRAFT", label: t("mkt.mineDRAFT") },
    { value: "ACTIVE", label: t("mkt.mineACTIVE") },
    { value: "PAUSED", label: t("mkt.minePAUSED") },
    { value: "SOLD", label: t("mkt.mineSOLD") },
    { value: "REMOVED", label: t("mkt.mineREMOVED") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-ink-900">{t("mkt.myListings")}</h2>
        <Link
          href={link(locale, "/account/listings/new")}
          className={buttonStyles("primary", "sm")}
        >
          <Plus size={16} aria-hidden />
          {t("mkt.sell")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Package size={40} aria-hidden />}
          title={t("mkt.myListingsEmpty")}
          body={t("mkt.noListingsBody")}
          action={
            <Link
              href={link(locale, "/account/listings/new")}
              className={buttonStyles("primary", "md")}
            >
              {t("mkt.sell")}
            </Link>
          }
        />
      ) : (
        <ListingManager
          locale={locale}
          basePath={link(locale, "/account/listings")}
          filters={filters}
          listings={rows.map((row) => ({
            id: row.id,
            slug: row.slug,
            title: pick(locale, row.titleEn, row.titleSw),
            price: row.price,
            status: row.status,
            viewCount: row.viewCount,
            imageUrl: row.images[0]?.url ?? null,
          }))}
          labels={{
            search: t("seller.searchListings"),
            apply: t("seller.apply"),
            filterStatus: t("seller.filterStatus"),
            sortBy: t("seller.sortBy"),
            all: t("seller.all"),
            statusOptions,
            sortOptions: [
              { value: "newest", label: t("seller.sortNewest") },
              { value: "oldest", label: t("seller.sortOldest") },
              { value: "price_asc", label: t("seller.sortPriceLow") },
              { value: "price_desc", label: t("seller.sortPriceHigh") },
              { value: "views", label: t("seller.sortMostViewed") },
            ],
            selected: t("seller.selected"),
            selectAll: t("seller.selectAll"),
            bulkAction: t("seller.bulkAction"),
            edit: t("seller.edit"),
            duplicate: t("seller.duplicate"),
            relist: t("seller.relist"),
            view: t("seller.view"),
            views: t("seller.views"),
            save: t("common.save"),
            statusLabels: Object.fromEntries(
              statusOptions.map((option) => [option.value, option.label]),
            ),
            bulkStatusOptions: statusOptions.filter((option) => option.value !== "DRAFT"),
          }}
        />
      )}
    </div>
  );
}
