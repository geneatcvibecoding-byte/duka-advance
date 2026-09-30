import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getTranslator, link, pick, type Locale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import type { ListingCardData } from "@/lib/marketplace";

/**
 * A single student listing. Mirrors ProductCard's look so the marketplace feels
 * like the same shop, but shows the campus and the "verified" trust marks that
 * are the whole point of this side of the app.
 */
export function ListingCard({
  listing,
  locale,
}: {
  listing: ListingCardData;
  locale: Locale;
}) {
  const t = getTranslator(locale);
  const title = pick(locale, listing.titleEn, listing.titleSw);
  const campus = pick(locale, listing.university.nameEn, listing.university.nameSw);
  const image = listing.images[0];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-ink-50">
        {image ? (
          <img
            src={image.url}
            alt={image.alt ?? title}
            loading="lazy"
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-ink-400">
            {title}
          </div>
        )}

        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-ink-700">
          <ShieldCheck size={12} aria-hidden className="text-brand-600" />
          {t("mkt.verified")}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-sm font-medium leading-snug text-ink-900">
          <Link
            href={link(locale, `/marketplace/${listing.slug}`)}
            className="after:absolute after:inset-0"
          >
            {title}
          </Link>
        </h3>

        <div className="mt-auto pt-2.5">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-base font-bold text-ink-900">
              {formatTZS(listing.price)}
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-ink-500">
            <span>
              {t(`mkt.condition.${listing.condition}` as import("@/lib/i18n").TranslationKey)}
            </span>
            <span className="truncate">{campus}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Shared grid wrapper so every listing lines up identically. */
export function ListingGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}