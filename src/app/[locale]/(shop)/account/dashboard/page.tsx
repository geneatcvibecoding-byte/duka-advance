import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  HandCoins,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  formatDateTime,
  getTranslator,
  link,
  pick,
  resolveLocale,
  type TranslationKey,
} from "@/lib/i18n";
import {
  getSellerActionQueue,
  getSellerDailySales,
  getSellerRecentRatings,
  getSellerTopListings,
} from "@/lib/marketplace";
import { getPendingOfferCount } from "@/lib/seller-dashboard";
import { sellerTrustScore } from "@/lib/trust";
import { formatTZS } from "@/lib/tz";
import { Badge, buttonStyles, Card, EmptyState } from "@/components/ui";
import { SalesChart } from "@/components/SalesChart";

/**
 * The seller's home base: what is live, what has sold, what money is where.
 * Everything here is derived from `sellerId = the signed-in user`, so a seller
 * can only ever see their own numbers.
 */

const ESCROW_TONE = {
  AWAITING_FUNDING: "warning",
  FUNDED: "info",
  DELIVERED: "warning",
  RELEASED: "success",
  REFUNDED: "neutral",
  DISPUTED: "danger",
} as const;

type EscrowStatus = keyof typeof ESCROW_TONE;

function Stat({
  icon,
  label,
  value,
  hint,
  accent = "text-brand-600 bg-brand-50",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink-500">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-500">{hint}</p> : null}
    </Card>
  );
}

export default async function SellerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = (await getCurrentUser())!; // guarded by the account layout
  const sellerId = user.id;

  const [
    activeCount,
    soldCount,
    orderCount,
    escrowAgg,
    releasedAgg,
    ratingAgg,
    recentOrders,
    recentListings,
    university,
    actionQueue,
    dailySales,
    topListings,
    recentRatings,
    pendingOffers,
    hasPayout,
  ] = await Promise.all([
    prisma.listing.count({ where: { sellerId, status: "ACTIVE" } }),
    prisma.listing.count({ where: { sellerId, status: "SOLD" } }),
    prisma.order.count({ where: { sellerId } }),
    prisma.order.aggregate({
      where: { sellerId, escrowStatus: { in: ["FUNDED", "DELIVERED"] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { sellerId, escrowStatus: "RELEASED" },
      _sum: { total: true, platformFee: true },
      _count: true,
    }),
    prisma.sellerRating.aggregate({
      where: { sellerId },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        escrowStatus: true,
        total: true,
        createdAt: true,
        customerName: true,
        items: {
          select: {
            nameEn: true,
            nameSw: true,
            listing: { select: { slug: true } },
          },
        },
      },
    }),
    prisma.listing.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        slug: true,
        titleEn: true,
        titleSw: true,
        price: true,
        status: true,
        images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
      },
    }),
    user.universityId
      ? prisma.university.findUnique({
          where: { id: user.universityId },
          select: { nameEn: true, nameSw: true },
        })
      : Promise.resolve(null),
    getSellerActionQueue(sellerId),
    getSellerDailySales(sellerId),
    getSellerTopListings(sellerId),
    getSellerRecentRatings(sellerId),
    getPendingOfferCount(sellerId),
    prisma.user
      .findUnique({ where: { id: sellerId }, select: { payoutNumber: true } })
      .then((row) => Boolean(row?.payoutNumber)),
  ]);

  const verified = Boolean(user.studentVerifiedAt);
  const campus = university ? pick(locale, university.nameEn, university.nameSw) : null;

  const heldInEscrow = escrowAgg._sum.total ?? 0;
  const escrowInProgress = escrowAgg._count;
  const netEarned =
    (releasedAgg._sum.total ?? 0) - (releasedAgg._sum.platformFee ?? 0);
  const releasedCount = releasedAgg._count;
  const ratingCount = ratingAgg._count;
  const avgRating = ratingAgg._avg.rating;

  const trust = sellerTrustScore({
    verified,
    avgRating: avgRating ?? null,
    ratingCount,
    completedOrders: releasedCount,
  });

  return (
    <div className="space-y-6">
      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white shadow-sm sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-400/20 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-brand-300/20 blur-3xl"
        />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                verified
                  ? "bg-white/15 text-white"
                  : "bg-gold-400 text-gold-900"
              }`}
            >
              {verified ? (
                <ShieldCheck size={14} aria-hidden />
              ) : (
                <GraduationCap size={14} aria-hidden />
              )}
              {verified ? t("seller.verified") : t("seller.notVerified")}
            </span>

            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {t("seller.dashboard")}
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-brand-100">
              {t("seller.subtitle")}
            </p>

            {campus ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-100">
                <MapPin size={14} aria-hidden />
                {t("seller.atCampus", { campus })}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {verified ? (
              <Link
                href={link(locale, "/account/listings/new")}
                className={buttonStyles("gold", "md")}
              >
                <Plus size={18} aria-hidden />
                {t("seller.addListing")}
              </Link>
            ) : (
              <Link
                href={link(locale, "/account/verify")}
                className={buttonStyles("gold", "md")}
              >
                <GraduationCap size={18} aria-hidden />
                {t("seller.verifyNow")}
              </Link>
            )}
            <Link
              href={link(locale, "/marketplace")}
              className={buttonStyles(
                "secondary",
                "md",
                "border-white/30 bg-white/10 text-white hover:bg-white/20",
              )}
            >
              {t("seller.browse")}
            </Link>
          </div>
        </div>
      </section>

      {/* Verification nudge ---------------------------------------------- */}
      {!verified ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-gold-200 bg-gold-50 p-5">
          <div className="flex items-start gap-3">
            <GraduationCap size={22} aria-hidden className="mt-0.5 text-gold-700" />
            <div>
              <p className="font-semibold text-gold-900">{t("seller.verifyTitle")}</p>
              <p className="mt-0.5 max-w-xl text-sm text-gold-800">
                {t("seller.verifyBody")}
              </p>
            </div>
          </div>
          <Link
            href={link(locale, "/account/verify")}
            className={buttonStyles("primary", "sm")}
          >
            {t("seller.verifyNow")}
          </Link>
        </Card>
      ) : null}

      {/* Stats ------------------------------------------------------------ */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          icon={<Store size={18} aria-hidden />}
          label={t("seller.statActive")}
          value={String(activeCount)}
        />
        <Stat
          icon={<ShoppingBag size={18} aria-hidden />}
          label={t("seller.statOrders")}
          value={String(orderCount)}
          accent="text-blue-700 bg-blue-50"
        />
        <Stat
          icon={<Lock size={18} aria-hidden />}
          label={t("seller.statEscrow")}
          value={formatTZS(heldInEscrow)}
          hint={
            escrowInProgress > 0
              ? t("seller.inEscrowCount", { count: escrowInProgress })
              : undefined
          }
          accent="text-gold-700 bg-gold-50"
        />
        <Stat
          icon={<Wallet size={18} aria-hidden />}
          label={t("seller.statEarned")}
          value={formatTZS(netEarned)}
          hint={
            releasedCount > 0
              ? t("seller.releasedCount", { count: releasedCount })
              : undefined
          }
          accent="text-brand-700 bg-brand-50"
        />
        <Stat
          icon={<Star size={18} aria-hidden />}
          label={t("seller.statRating")}
          value={avgRating ? avgRating.toFixed(1) : "—"}
          hint={
            ratingCount > 0
              ? t("seller.reviews", { count: ratingCount })
              : t("seller.noRating")
          }
          accent="text-gold-700 bg-gold-50"
        />
        <Stat
          icon={<CheckCircle2 size={18} aria-hidden />}
          label={t("seller.statSold")}
          value={String(soldCount)}
          accent="text-ink-700 bg-ink-100"
        />
      </section>

      {/* Anything waiting on the seller, and the gaps that would block a payout */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
            <h2 className="flex items-center gap-2 font-bold text-ink-900">
              <ClipboardList size={17} aria-hidden />
              {t("seller.actionQueue")}
            </h2>
            {actionQueue.length > 0 ? (
              <Badge tone="warning">{actionQueue.length}</Badge>
            ) : null}
          </div>

          {actionQueue.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-500">
              {t("seller.actionQueueEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-ink-200">
              {actionQueue.map((order) => {
                const item = order.items[0];
                const disputed = order.escrowStatus === "DISPUTED";
                return (
                  <li key={order.id}>
                    <Link
                      href={link(locale, `/order/${order.orderNumber}`)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-xs font-semibold text-ink-800">
                          {order.orderNumber}
                        </span>
                        <p className="truncate text-sm text-ink-700">
                          {item ? pick(locale, item.nameEn, item.nameSw) : "—"}
                        </p>
                        <p className="text-xs text-ink-500">
                          {disputed
                            ? t("seller.actionDisputed")
                            : t("seller.actionDeliver")}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-ink-900">
                        {formatTZS(order.total - order.platformFee)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          {!hasPayout ? (
            <Card className="border-gold-200 bg-gold-50 p-4">
              <p className="text-sm font-medium text-gold-900">
                {t("seller.payoutNotSet")}
              </p>
              <Link
                href={link(locale, "/account/payouts")}
                className={buttonStyles("primary", "sm", "mt-3")}
              >
                {t("seller.payoutSave")}
              </Link>
            </Card>
          ) : null}

          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-ink-500">
                {t("seller.trustScore")}
              </span>
              <Badge tone="info">{t(`seller.tier${trust.tier}`)}</Badge>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100"
              role="img"
              aria-label={`${trust.score} / 100`}
            >
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${trust.score}%` }}
              />
            </div>
            <p className="mt-1.5 text-sm font-semibold text-ink-900">
              {trust.score}/100
            </p>
            <p className="mt-0.5 text-xs text-ink-500">{t("seller.trustExplain")}</p>
          </Card>

          {pendingOffers > 0 ? (
            <Link
              href={link(locale, "/account/offers")}
              className={buttonStyles("primary", "md", "w-full")}
            >
              <HandCoins size={16} aria-hidden />
              {t("seller.offers")} ({pendingOffers})
            </Link>
          ) : null}
        </div>
      </section>

      {/* Sales trend, and what is actually carrying the shop */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="border-b border-ink-200 px-4 py-3">
            <h2 className="font-bold text-ink-900">{t("seller.salesChart")}</h2>
          </div>
          <SalesChart
            data={dailySales}
            labels={{
              orders: t("seller.chartOrders"),
              net: t("seller.chartNet"),
              empty: t("seller.chartEmpty"),
            }}
          />
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-ink-200 px-4 py-3">
            <h2 className="font-bold text-ink-900">{t("seller.topListings")}</h2>
          </div>

          {topListings.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-500">
              {t("seller.noListingsBody")}
            </p>
          ) : (
            <ul className="divide-y divide-ink-200">
              {topListings.map((listing) => (
                <li key={listing.id}>
                  <Link
                    href={link(locale, `/marketplace/${listing.slug}`)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">
                      {pick(locale, listing.titleEn, listing.titleSw)}
                    </span>
                    <span className="shrink-0 text-xs text-ink-500">
                      {t("seller.soldTimes", { count: listing._count.orderItems })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* What buyers are saying, and what is waiting in the inbox */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
            <h2 className="font-bold text-ink-900">{t("seller.ratingsTitle")}</h2>
            <Link
              href={link(locale, "/account/reviews")}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              {t("seller.viewAll")}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>

          {recentRatings.length === 0 ? (
            <EmptyState
              icon={<Star size={36} aria-hidden />}
              title={t("seller.noRatings")}
              body={t("seller.noRatingsBody")}
            />
          ) : (
            <ul className="divide-y divide-ink-200">
              {recentRatings.map((rating) => (
                <li key={rating.id} className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        aria-hidden
                        className={
                          n <= rating.rating
                            ? "fill-gold-400 text-gold-500"
                            : "text-ink-300"
                        }
                      />
                    ))}
                    <span className="ml-2 text-xs text-ink-500">
                      {formatDateTime(rating.createdAt, locale)}
                    </span>
                  </div>
                  {rating.comment ? (
                    <p className="mt-1.5 text-sm text-ink-700">{rating.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-ink-200 px-4 py-3">
            <h2 className="font-bold text-ink-900">{t("seller.quickLinks")}</h2>
          </div>
          <div className="grid gap-2 p-4">
            {[
              { href: "/account/listings", label: t("seller.manageListings") },
              { href: "/account/orders", label: t("seller.orders") },
              { href: "/account/payouts", label: t("seller.payouts") },
              { href: "/account/offers", label: t("seller.offers") },
              { href: "/account/saved", label: t("seller.savedPage") },
              { href: "/account/notifications", label: t("seller.notifications") },
            ].map((item) => (
              <Link
                key={item.href}
                href={link(locale, item.href)}
                className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2.5 text-sm font-medium text-ink-800 transition-colors hover:bg-ink-50"
              >
                {item.label}
                <ArrowRight size={15} aria-hidden className="text-ink-400" />
              </Link>
            ))}
            <a
              href="/api/account/orders.csv"
              className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2.5 text-sm font-medium text-ink-800 transition-colors hover:bg-ink-50"
            >
              {t("seller.exportOrders")}
              <ArrowRight size={15} aria-hidden className="text-ink-400" />
            </a>
          </div>
        </Card>
      </section>

      {/* Orders + listings / tips ---------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
              <h2 className="font-bold text-ink-900">{t("seller.recentOrders")}</h2>
              <Link
                href={link(locale, "/account/orders")}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
              >
                {t("seller.viewAll")}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag size={36} aria-hidden />}
                title={t("seller.noOrdersTitle")}
                body={t("seller.noOrdersBody")}
              />
            ) : (
              <ul className="divide-y divide-ink-200">
                {recentOrders.map((order) => {
                  const status = order.escrowStatus as EscrowStatus;
                  const item = order.items[0];
                  const itemTitle = item
                    ? pick(locale, item.nameEn, item.nameSw)
                    : order.orderNumber;
                  return (
                    <li key={order.id}>
                      <Link
                        href={link(locale, `/order/${order.orderNumber}`)}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-ink-800">
                              {order.orderNumber}
                            </span>
                            <Badge tone={ESCROW_TONE[status] ?? "neutral"}>
                              {t(`mkt.escrow${status}` as TranslationKey)}
                            </Badge>
                          </div>
                          <p className="mt-1 truncate text-sm font-medium text-ink-900">
                            {itemTitle}
                          </p>
                          <p className="truncate text-xs text-ink-500">
                            {t("seller.buyer")}: {order.customerName} ·{" "}
                            {formatDateTime(order.createdAt, locale)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-ink-900">
                          {formatTZS(order.total)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
              <h2 className="font-bold text-ink-900">{t("seller.yourListings")}</h2>
              <Link
                href={link(locale, "/account/listings")}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
              >
                {t("seller.manageListings")}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>

            {recentListings.length === 0 ? (
              <EmptyState
                icon={<Store size={36} aria-hidden />}
                title={t("seller.noListingsTitle")}
                body={t("seller.noListingsBody")}
                action={
                  <Link
                    href={link(locale, "/account/listings/new")}
                    className={buttonStyles("primary", "sm")}
                  >
                    {t("seller.addListing")}
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-ink-200">
                {recentListings.map((listing) => {
                  const image = listing.images[0];
                  const live = listing.status === "ACTIVE";
                  return (
                    <li key={listing.id}>
                      <Link
                        href={link(locale, `/marketplace/${listing.slug}`)}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50"
                      >
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                          {image ? (
                            <img
                              src={image.url}
                              alt=""
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink-900">
                            {pick(locale, listing.titleEn, listing.titleSw)}
                          </span>
                          <span className="block text-xs text-ink-500">
                            {formatTZS(listing.price)}
                          </span>
                        </span>
                        <Badge tone={live ? "success" : "neutral"}>
                          {t(`mkt.mine${listing.status}` as TranslationKey)}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="bg-ink-50 p-5">
            <h2 className="font-bold text-ink-900">{t("seller.tipsTitle")}</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-600">
              {[t("seller.tip1"), t("seller.tip2"), t("seller.tip3")].map((tip) => (
                <li key={tip} className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
