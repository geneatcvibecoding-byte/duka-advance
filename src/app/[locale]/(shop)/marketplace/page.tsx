import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  queryMarketplace,
  type MarketplaceQuery,
} from "@/lib/marketplace";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { ListingCard, ListingGrid } from "@/components/ListingCard";
import { MarketplaceFilters } from "@/components/MarketplaceFilters";
import { Alert, buttonStyles, EmptyState, SectionHeading } from "@/components/ui";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<MarketplaceQuery>;
};

export const metadata: Metadata = { title: "Campus Marketplace" };

export default async function MarketplacePage({ params, searchParams }: Props) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const [result, universities, user] = await Promise.all([
    queryMarketplace(query),
    prisma.university.findMany({
      where: { isActive: true },
      orderBy: { nameEn: "asc" },
    }),
    getCurrentUser(),
  ]);

  const isVerified = Boolean(user?.studentVerifiedAt);
  const basePath = link(locale, "/marketplace");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            {t("mkt.title")}
          </h1>
          <p className="mt-1 text-ink-600">{t("mkt.tagline")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isVerified ? (
            <Link
              href={link(locale, "/account/dashboard")}
              className={buttonStyles("secondary", "md")}
            >
              {t("seller.dashboard")}
            </Link>
          ) : null}
          <Link href={link(locale, "/account/listings/new")} className={buttonStyles("primary", "md")}>
            {t("mkt.sell")}
          </Link>
        </div>
      </div>

      {!isVerified ? (
        <Alert tone="info" className="mt-5">
          <span className="font-semibold">{t("mkt.verifyFirst")}</span>{" "}
          <Link href={link(locale, "/account/verify")} className="underline">
            {t("mkt.verify")} →
          </Link>
        </Alert>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-40 lg:self-start">
          <MarketplaceFilters
            locale={locale}
            action={basePath}
            universities={universities}
            current={query}
          />
        </aside>

        <div>
          {result.listings.length === 0 ? (
            <EmptyState
              icon={<SearchX size={40} aria-hidden />}
              title={t("mkt.noListings")}
              body={t("mkt.noListingsBody")}
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-ink-500">
                {result.total} {result.total === 1 ? "listing" : "listings"}
              </p>
              <ListingGrid>
                {result.listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} locale={locale} />
                ))}
              </ListingGrid>
            </>
          )}
        </div>
      </div>

      <section className="mt-14">
        <SectionHeading
          title={t("mkt.escrowSteps")}
          action={
            <span className="flex items-center gap-1.5 text-sm font-medium text-brand-700">
              <ShieldCheck size={16} aria-hidden />
              {t("mkt.escrow")}
            </span>
          }
        />
        <ol className="grid gap-4 sm:grid-cols-3">
          {[t("mkt.step1"), t("mkt.step2"), t("mkt.step3")].map((step, index) => (
            <li
              key={step}
              className="rounded-xl border border-ink-200 bg-white p-5"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}