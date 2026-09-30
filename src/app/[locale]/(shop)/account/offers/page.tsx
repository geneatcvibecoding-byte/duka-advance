import Link from "next/link";
import { HandCoins, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getMyOffers, getSellerOfferInbox } from "@/lib/seller-dashboard";
import {
  formatDateTime,
  getTranslator,
  link,
  pick,
  resolveLocale,
  type TranslationKey,
} from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { Badge, buttonStyles, Card, EmptyState } from "@/components/ui";
import { respondOfferAction } from "@/app/actions/offer";

export default async function OffersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = (await getCurrentUser())!; // guarded by the account layout
  const [inbox, mine] = await Promise.all([
    getSellerOfferInbox(user.id),
    getMyOffers(user.id),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink-900">
          <HandCoins size={18} aria-hidden />
          {t("seller.offers")}
        </h2>

        {inbox.length === 0 ? (
          <EmptyState
            icon={<HandCoins size={36} aria-hidden />}
            title={t("seller.noOffers")}
            body={t("seller.subtitle")}
          />
        ) : (
          <ul className="space-y-3">
            {inbox.map((offer) => {
              const title = pick(locale, offer.listing.titleEn, offer.listing.titleSw);
              const off = Math.round(
                ((offer.listing.price - offer.amount) / offer.listing.price) * 100,
              );
              return (
                <li key={offer.id}>
                  <Card className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={link(locale, `/marketplace/${offer.listing.slug}`)}
                          className="font-medium text-ink-900 hover:text-brand-700"
                        >
                          {title}
                        </Link>
                        <p className="mt-1 text-sm text-ink-600">
                          {t("seller.offerAmount")}:{" "}
                          <span className="font-semibold text-ink-900">
                            {formatTZS(offer.amount)}
                          </span>{" "}
                          <span className="text-ink-400">
                            ({formatTZS(offer.listing.price)})
                          </span>
                          {off > 0 ? (
                            <span className="ml-1 text-brand-700">−{off}%</span>
                          ) : null}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                          {offer.buyer.studentVerifiedAt ? (
                            <ShieldCheck size={13} aria-hidden className="text-brand-600" />
                          ) : null}
                          {offer.buyer.name} ·{" "}
                          {formatDateTime(offer.createdAt, locale)}
                        </p>
                        {offer.message ? (
                          <p className="mt-2 rounded-lg bg-ink-50 p-2.5 text-sm text-ink-700">
                            {offer.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          tone={
                            offer.status === "ACCEPTED"
                              ? "success"
                              : offer.status === "DECLINED"
                                ? "neutral"
                                : "warning"
                          }
                        >
                          {t(`seller.offer${offer.status}` as TranslationKey)}
                        </Badge>

                        {offer.status === "PENDING" ? (
                          <>
                            <form action={respondOfferAction}>
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="offerId" value={offer.id} />
                              <input type="hidden" name="decision" value="ACCEPT" />
                              <button className={buttonStyles("primary", "sm")}>
                                {t("seller.accept")}
                              </button>
                            </form>
                            <form action={respondOfferAction}>
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="offerId" value={offer.id} />
                              <input type="hidden" name="decision" value="DECLINE" />
                              <button className={buttonStyles("secondary", "sm")}>
                                {t("seller.decline")}
                              </button>
                            </form>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-ink-900">{t("seller.myOffers")}</h2>

        {mine.length === 0 ? (
          <EmptyState
            icon={<HandCoins size={36} aria-hidden />}
            title={t("seller.noMyOffers")}
            body={t("seller.browse")}
          />
        ) : (
          <ul className="space-y-3">
            {mine.map((offer) => (
              <li key={offer.id}>
                <Card className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={link(locale, `/marketplace/${offer.listing.slug}`)}
                      className="font-medium text-ink-900 hover:text-brand-700"
                    >
                      {pick(locale, offer.listing.titleEn, offer.listing.titleSw)}
                    </Link>
                    <p className="text-sm text-ink-500">
                      {t("seller.offerAmount")}: {formatTZS(offer.amount)} ·{" "}
                      {formatDateTime(offer.createdAt, locale)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      offer.status === "ACCEPTED"
                        ? "success"
                        : offer.status === "DECLINED"
                          ? "neutral"
                          : "warning"
                    }
                  >
                    {t(`seller.offer${offer.status}` as TranslationKey)}
                  </Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
