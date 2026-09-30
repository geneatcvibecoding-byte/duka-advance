import { getTranslator, link, pick, type Locale } from "@/lib/i18n";
import { LISTING_CONDITIONS } from "@/lib/escrow";
import type { MarketplaceQuery } from "@/lib/marketplace";
import { Input, Select, buttonStyles } from "@/components/ui";

/**
 * Marketplace filters. A plain GET form so the filters are shareable URLs, like
 * the shop's catalogue filters.
 */
export function MarketplaceFilters({
  locale,
  action,
  universities,
  current,
}: {
  locale: Locale;
  action: string;
  universities: { id: string; nameEn: string; nameSw: string }[];
  current: MarketplaceQuery;
}) {
  const t = getTranslator(locale);

  return (
    <form
      action={action}
      method="get"
      className="space-y-5 rounded-xl border border-ink-200 bg-white p-4"
    >
      <h2 className="text-sm font-bold text-ink-900">{t("common.search")}</h2>

      <div>
        <label className="field-label" htmlFor="mkt-q">
          {t("common.search")}
        </label>
        <Input
          id="mkt-q"
          type="search"
          name="q"
          defaultValue={current.q}
          placeholder={t("mkt.searchPlaceholder")}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="mkt-campus">
          {t("mkt.yourCampus")}
        </label>
        <Select id="mkt-campus" name="university" defaultValue={current.university ?? ""}>
          <option value="">{t("common.all")}</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {pick(locale, u.nameEn, u.nameSw)}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="field-label" htmlFor="mkt-condition">
          {t("mkt.condition")}
        </label>
        <Select
          id="mkt-condition"
          name="condition"
          defaultValue={current.condition ?? ""}
        >
          <option value="">{t("common.all")}</option>
          {LISTING_CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {t(`mkt.condition.${c}` as never)}
            </option>
          ))}
        </Select>
      </div>

      <button type="submit" className={`${buttonStyles("secondary", "md")} w-full`}>
        {t("common.apply")}
      </button>

      <a href={link(locale, "/marketplace")} className="block text-center text-sm text-ink-500 hover:text-ink-900">
        {t("common.clear")}
      </a>
    </form>
  );
}