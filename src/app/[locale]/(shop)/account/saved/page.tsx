import Link from "next/link";
import { Bookmark, GraduationCap, Heart, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getFollowedSellers, getSavedListings } from "@/lib/seller-dashboard";
import { formatDate, getTranslator, link, pick, resolveLocale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { Badge, buttonStyles, Card, EmptyState } from "@/components/ui";
import {
  toggleFollowSellerAction,
  toggleSavedListingAction,
} from "@/app/actions/listing";

export default async function SavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = (await getCurrentUser())!; // guarded by the account layout
  const [saved, following] = await Promise.all([
    getSavedListings(user.id),
    getFollowedSellers(user.id),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink-900">
          <Bookmark size={18} aria-hidden />
          {t("seller.saved")}
        </h2>

        {saved.length === 0 ? (
          <EmptyState
            icon={<Heart size={36} aria-hidden />}
            title={t("seller.noSaved")}
            body={t("seller.browse")}
          />
        ) : (
          <ul className="space-y-3">
            {saved.map(({ id, createdAt, listing }) => {
              const live = listing.status === "ACTIVE";
              return (
                <li key={id}>
                  <Card className="flex flex-wrap items-center gap-4 p-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                      {listing.images[0] ? (
                        <img
                          src={listing.images[0].url}
                          alt=""
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={link(locale, `/marketplace/${listing.slug}`)}
                        className="font-medium text-ink-900 hover:text-brand-700"
                      >
                        {pick(locale, listing.titleEn, listing.titleSw)}
                      </Link>
                      <p className="text-sm text-ink-500">
                        {formatTZS(listing.price)} ·{" "}
                        {t("seller.savedOn", { date: formatDate(createdAt, locale) })}
                      </p>
                    </div>
                    {!live ? <Badge tone="neutral">{t("mkt.gone")}</Badge> : null}
                    <form action={toggleSavedListingAction}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <button className={buttonStyles("secondary", "sm")}>
                        {t("common.remove")}
                      </button>
                    </form>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink-900">
          <GraduationCap size={18} aria-hidden />
          {t("seller.followingTitle")}
        </h2>

        {following.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={36} aria-hidden />}
            title={t("seller.noFollowing")}
            body={t("seller.browse")}
          />
        ) : (
          <ul className="space-y-3">
            {following.map(({ id, seller }) => (
              <li key={id}>
                <Card className="flex flex-wrap items-center gap-4 p-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-base font-bold text-white">
                    {seller.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={link(locale, `/seller/${seller.id}`)}
                      className="font-medium text-ink-900 hover:text-brand-700"
                    >
                      {seller.name}
                    </Link>
                    <p className="text-sm text-ink-500">
                      {t("seller.listingCount", { count: seller._count.listings })}
                    </p>
                  </div>
                  {seller.studentVerifiedAt ? (
                    <Badge tone="success">
                      <ShieldCheck size={12} aria-hidden /> {t("seller.verified")}
                    </Badge>
                  ) : null}
                  <form action={toggleFollowSellerAction}>
                    <input type="hidden" name="sellerId" value={seller.id} />
                    <button className={buttonStyles("secondary", "sm")}>
                      {t("seller.unfollow")}
                    </button>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
