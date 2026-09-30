import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  Star,
  Store,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getPublicSeller,
  getPublicSellerListings,
  getSellerRecentRatings,
  getSellerSalesSummary,
} from "@/lib/marketplace";
import { isSellerFollowed } from "@/lib/seller-dashboard";
import { sellerTrustScore } from "@/lib/trust";
import {
  formatDate,
  getTranslator,
  link,
  pick,
  resolveLocale,
} from "@/lib/i18n";
import { Badge, buttonStyles, Card, EmptyState } from "@/components/ui";
import { ListingCard } from "@/components/ListingCard";
import { toggleFollowSellerAction } from "@/app/actions/listing";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const seller = await getPublicSeller(id);
  if (!seller) return { title: "Not found" };
  return { title: seller.name };
}

export default async function SellerProfilePage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const [seller, user] = await Promise.all([getPublicSeller(id), getCurrentUser()]);
  if (!seller) notFound();

  const [listings, summary, ratings] = await Promise.all([
    getPublicSellerListings(seller.id),
    getSellerSalesSummary(seller.id),
    getSellerRecentRatings(seller.id, 5),
  ]);

  const isSelf = user?.id === seller.id;
  const following = user && !isSelf ? await isSellerFollowed(user.id, seller.id) : false;

  const trust = sellerTrustScore({
    verified: Boolean(seller.studentVerifiedAt),
    avgRating: summary.avgRating,
    ratingCount: summary.ratingCount,
    completedOrders: summary.orders,
  });

  const campus = seller.university
    ? pick(locale, seller.university.nameEn, seller.university.nameSw)
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Seller header ------------------------------------------------- */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-brand-700 to-brand-900 p-6 text-white">
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/15 text-2xl font-bold text-white">
              {seller.name.charAt(0).toUpperCase()}
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {seller.name}
              </h1>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-100">
                {campus ? (
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap size={14} aria-hidden />
                    {campus}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} aria-hidden />
                  {t("seller.memberSince", { date: formatDate(seller.createdAt, locale) })}
                </span>
                <span>
                  {t("seller.listingCount", { count: seller._count.listings })}
                </span>
                <span>{t("seller.followers", { count: seller._count.followers })}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {seller.studentVerifiedAt ? (
                  <Badge tone="success">
                    <ShieldCheck size={12} aria-hidden /> {t("seller.verified")}
                  </Badge>
                ) : null}
                <Badge tone="info">
                  {t("seller.trustScore")}: {trust.score}/100 ·{" "}
                  {t(`seller.tier${trust.tier}`)}
                </Badge>
                {summary.avgRating ? (
                  <Badge tone="warning">
                    <Star size={12} aria-hidden className="fill-gold-400" />{" "}
                    {summary.avgRating.toFixed(1)} ({summary.ratingCount})
                  </Badge>
                ) : null}
              </div>
            </div>

            {isSelf ? (
              <Link href={link(locale, "/account/dashboard")} className={buttonStyles("secondary", "sm")}>
                {t("seller.backToDashboard")}
              </Link>
            ) : user ? (
              <form action={toggleFollowSellerAction}>
                <input type="hidden" name="sellerId" value={seller.id} />
                <button className={buttonStyles("gold", "sm")}>
                  {following ? (
                    <>
                      <UserCheck size={16} aria-hidden />
                      {t("seller.unfollowAction")}
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} aria-hidden />
                      {t("seller.follow")}
                    </>
                  )}
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <p className="px-6 py-3 text-xs text-ink-500">{t("seller.trustExplain")}</p>
      </Card>

      {/* Listings ------------------------------------------------------ */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-ink-900">
          {t("seller.publicListings")}
        </h2>

        {listings.length === 0 ? (
          <EmptyState
            icon={<Store size={36} aria-hidden />}
            title={t("seller.noPublicListings")}
            body={t("seller.browse")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} locale={locale} />
            ))}
          </div>
        )}
      </section>

      {/* Ratings ------------------------------------------------------- */}
      {ratings.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-ink-900">
            {t("seller.ratingsTitle")}
          </h2>
          <ul className="space-y-2">
            {ratings.map((rating) => (
              <li key={rating.id}>
                <Card className="p-3.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={13}
                        aria-hidden
                        className={
                          n <= rating.rating
                            ? "fill-gold-400 text-gold-500"
                            : "text-ink-300"
                        }
                      />
                    ))}
                    <span className="ml-2 text-xs text-ink-500">
                      {formatDate(rating.createdAt, locale)}
                    </span>
                  </div>
                  {rating.comment ? (
                    <p className="mt-1.5 text-sm text-ink-700">{rating.comment}</p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
