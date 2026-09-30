import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bookmark,
  CalendarDays,
  Eye,
  GraduationCap,
  HandCoins,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getListingDetail } from "@/lib/marketplace";
import { isListingSaved } from "@/lib/seller-dashboard";
import { sellerTrustScore } from "@/lib/trust";
import { isPurchasable } from "@/lib/escrow";
import { toggleSavedListingAction } from "@/app/actions/listing";
import {
  formatDate,
  getTranslator,
  link,
  pick,
  resolveLocale,
} from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { Alert, Badge, buttonStyles } from "@/components/ui";
import { BuyListingButton } from "@/components/BuyListingButton";
import { ListingViewPing } from "@/components/ListingViewPing";
import { OfferForm } from "@/components/OfferForm";
import { ShareButtons } from "@/components/ShareButtons";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingDetail(slug);
  if (!listing) return { title: "Not found" };
  return { title: `${listing.titleEn} — Campus Marketplace`, openGraph: { images: listing.images.map((i) => i.url) } };
}

export default async function ListingDetailPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const [listing, user, settings] = await Promise.all([
    getListingDetail(slug),
    getCurrentUser(),
    prisma.shopSettings.findUnique({
      where: { id: "shop" },
      select: { marketplaceFeePercent: true, phone: true, whatsapp: true },
    }),
  ]);
  if (!listing) notFound();

  const rating = await prisma.sellerRating.aggregate({
    where: { sellerId: listing.seller.id },
    _avg: { rating: true },
    _count: true,
  });
  const averageRating = rating?._avg.rating;
  const ratingCount = rating?._count ?? 0;

  // Trust is shown where the decision is made: a buyer deciding whether to pay
  // a stranger is exactly the moment the score has to be visible.
  const releasedOrders = await prisma.order.count({
    where: { sellerId: listing.seller.id, escrowStatus: "RELEASED" },
  });
  const trust = sellerTrustScore({
    verified: Boolean(listing.seller.studentVerifiedAt),
    avgRating: averageRating ?? null,
    ratingCount,
    completedOrders: releasedOrders,
  });

  const saved = user ? await isListingSaved(user.id, listing.id) : false;

  const title = pick(locale, listing.titleEn, listing.titleSw);
  const desc = pick(locale, listing.descEn, listing.descSw);
  const campus = pick(locale, listing.university.nameEn, listing.university.nameSw);
  const categoryName = pick(locale, listing.category.nameEn, listing.category.nameSw);

  const feePercent = settings?.marketplaceFeePercent ?? 6;
  const fee = Math.ceil((listing.price * feePercent) / 100);

  const isOwn = user?.id === listing.seller.id;
  const isVerifiedBuyer = Boolean(user?.studentVerifiedAt);
  const purchasable = isPurchasable(listing.status) && !isOwn;
  const image = listing.images[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ListingViewPing listingId={listing.id} />
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Media */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-ink-200 bg-ink-50">
            {image ? (
              <img
                src={image.url}
                alt={image.alt ?? title}
                width={800}
                height={800}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-ink-400">
                {title}
              </div>
            )}
          </div>

          {listing.images.length > 1 ? (
            <div className="mt-3 flex gap-2">
              {listing.images.map((img) => (
                <img
                  key={img.url}
                  src={img.url}
                  alt=""
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-lg border border-ink-200 object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{categoryName}</Badge>
            <Badge tone="neutral">{t(`mkt.condition.${listing.condition}` as never)}</Badge>
            {listing.status !== "ACTIVE" ? (
              <Badge tone="danger">{t("mkt.gone")}</Badge>
            ) : null}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            {title}
          </h1>

          <p className="mt-3 text-3xl font-bold text-ink-900">
            {formatTZS(listing.price)}
          </p>

          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} aria-hidden />
              {t("mkt.posted", { date: formatDate(listing.createdAt, locale) })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={15} aria-hidden />
              {t("seller.views", { count: listing.viewCount })}
            </span>
          </p>

          {/* Seller card */}
          <div className="mt-5 rounded-xl border border-ink-200 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-base font-bold text-white">
                {listing.seller.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <Link
                  href={link(locale, `/seller/${listing.seller.id}`)}
                  className="font-semibold text-ink-900 hover:text-brand-700 hover:underline"
                >
                  {listing.seller.name}
                </Link>
                <p className="flex items-center gap-1 text-sm text-ink-500">
                  <GraduationCap size={14} aria-hidden /> {campus}
                </p>
              </div>
              <span className="ml-auto flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800">
                <ShieldCheck size={13} aria-hidden />
                {t("mkt.verified")}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink-600">
              {averageRating ? (
                <span className="flex items-center gap-1">
                  <Star size={15} aria-hidden className="fill-gold-400 text-gold-500" />
                  {averageRating.toFixed(1)}
                  <span className="text-ink-400">({ratingCount})</span>
                </span>
              ) : null}
              <span>
                {t("seller.listingCount", { count: listing.seller._count.listings })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} aria-hidden className="text-brand-600" />
                {t("seller.trustScore")} {trust.score}/100 ·{" "}
                {t(`seller.tier${trust.tier}`)}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-ink-500">{t("seller.trustExplain")}</p>
          </div>

          {/* Purchase panel */}
          <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-5">
            {!user ? (
              <div className="space-y-3">
                <Alert tone="info">{t("mkt.verifyFirst")}</Alert>
                <a
                  href={`${link(locale, "/login")}?next=${encodeURIComponent(link(locale, `/marketplace/${slug}`))}`}
                  className={`${buttonStyles("primary", "lg")} w-full`}
                >
                  {t("nav.login")}
                </a>
              </div>
            ) : !isVerifiedBuyer ? (
              <div className="space-y-3">
                <Alert tone="warning">{t("mkt.verifyFirst")}</Alert>
                <a
                  href={link(locale, "/account/verify")}
                  className={`${buttonStyles("primary", "lg")} w-full`}
                >
                  {t("mkt.verify")}
                </a>
              </div>
            ) : isOwn ? (
              <Alert tone="info">{t("mkt.buyOwnListing")}</Alert>
            ) : !purchasable ? (
              <Alert tone="danger">{t("mkt.gone")}</Alert>
            ) : (
              <BuyListingButton
                locale={locale}
                listingId={listing.id}
                buyLabel={t("mkt.buyNowEscrow")}
                escrowNote={t("mkt.escrowExplained")}
              />
            )}

            {purchasable ? (
              <div className="mt-4 border-t border-brand-200 pt-4 text-sm text-ink-700">
                <div className="flex justify-between">
                  <span>{t("mkt.soldBy", { name: listing.seller.name })}</span>
                  <span>{formatTZS(listing.price)}</span>
                </div>
                <div className="mt-1 flex justify-between text-ink-500">
                  <span>{t("mkt.feeNote", { percent: feePercent })}</span>
                  <span>−{formatTZS(fee)}</span>
                </div>
                <div className="mt-1 flex justify-between font-semibold text-ink-900">
                  <span>{t("checkout.total")}</span>
                  <span>{formatTZS(listing.price)}</span>
                </div>
                <p className="mt-2 text-xs text-ink-500">
                  {t("mkt.meetOnCampusBody")}
                </p>
              </div>
            ) : null}
          </div>

          {/* Save, share, and — for a verified buyer who is not ready to commit —
              a way to name a price instead. */}
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {user ? (
                <form action={toggleSavedListingAction}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <button
                    type="submit"
                    aria-pressed={saved}
                    className={buttonStyles("secondary", "sm")}
                  >
                    <Bookmark
                      size={15}
                      aria-hidden
                      className={saved ? "fill-brand-600 text-brand-600" : undefined}
                    />
                    {saved ? t("seller.unSave") : t("seller.save")}
                  </button>
                </form>
              ) : null}

              <ShareButtons
                url={link(locale, `/marketplace/${slug}`)}
                title={title}
                labels={{
                  whatsapp: t("seller.shareWhatsApp"),
                  copy: t("seller.copyLink"),
                  copied: t("seller.copied"),
                }}
              />
            </div>

            {isVerifiedBuyer && purchasable ? (
              <details className="rounded-xl border border-ink-200 bg-white p-4">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-900">
                  <HandCoins size={16} aria-hidden />
                  {t("seller.makeOffer")}
                </summary>
                <div className="mt-4">
                  <OfferForm
                    listingId={listing.id}
                    locale={locale}
                    labels={{
                      title: t("seller.makeOffer"),
                      hint: t("seller.offerRange"),
                      amount: t("seller.offerAmount"),
                      message: t("seller.offerMessage"),
                      messageOptional: t("seller.offerMessageHint"),
                      submit: t("seller.makeOffer"),
                      pending: t("common.loading"),
                      sent: t("seller.offerSent"),
                    }}
                  />
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-bold text-ink-900">Description</h2>
        <div className="max-w-3xl whitespace-pre-line leading-relaxed text-ink-700">
          {desc}
        </div>
      </section>
    </div>
  );
}