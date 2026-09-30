import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  Headphones,
  Package,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getNavCategories } from "@/lib/settings";
import { getTranslator, link, pick, resolveLocale } from "@/lib/i18n";
import { ProductCard, ProductGrid } from "@/components/ProductCard";
import { getFeaturedListings } from "@/lib/marketplace";
import { SectionHeading } from "@/components/ui";
import { getSiteContent } from "@/lib/site-content";
import { FeaturedListingsSection } from "@/components/FeaturedListingsSection";

const CARD_SELECT = {
  id: true,
  slug: true,
  nameEn: true,
  nameSw: true,
  descEn: true,
  descSw: true,
  brand: true,
  price: true,
  compareAt: true,
  stock: true,
  isFeatured: true,
  images: { orderBy: { position: "asc" }, select: { url: true, alt: true } },
  category: { select: { id: true, slug: true, nameEn: true, nameSw: true } },
} as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const [
    currentUser,
    categories,
    featured,
    superDeals,
    featuredListings,
    liveListings,
    siteContent,
  ] = await Promise.all([
    getCurrentUser(),
    getNavCategories(),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      select: CARD_SELECT,
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true, compareAt: { not: null, gt: 0 } },
      orderBy: { compareAt: "desc" },
      select: CARD_SELECT,
      take: 4,
    }),
    getFeaturedListings(8),
    prisma.listing.count({
      where: { status: "ACTIVE", seller: { studentVerifiedAt: { not: null } } },
    }),
    getSiteContent(),
  ]);

  // Icon mapper for dynamic features
  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case "shield":
        return ShieldCheck;
      case "truck":
        return Truck;
      case "wallet":
        return Wallet;
      default:
        return Headphones;
    }
  };

  return (
    <>
      {/* Top Announcement Bar if enabled */}
      {siteContent.announcement.enabled && (
        <div className="border-b border-slate-200/60 bg-slate-900 py-2.5 text-center text-xs text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-4">
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
              {siteContent.announcement.badgeEn}
            </span>
            <Link
              href={
                siteContent.announcement.link.startsWith("http")
                  ? siteContent.announcement.link
                  : link(locale, siteContent.announcement.link)
              }
              className="text-slate-200 hover:text-white transition-colors truncate"
            >
              {pick(
                locale,
                siteContent.announcement.textEn,
                siteContent.announcement.textSw,
              )}
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section: AliExpress-Style Campus Commercial Portal */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-slate-950 text-white">
        {/* Subtle photo overlay */}
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src="/img/banners/hero_campus.jpg"
            alt="Campus Lifestyle"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-slate-950/85" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
            {/* Left Headline & CTAs */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
                <Sparkles size={13} aria-hidden />
                <span>
                  {pick(locale, siteContent.hero.badgeEn, siteContent.hero.badgeSw)}
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.12] text-balance">
                {pick(locale, siteContent.hero.headlineEn, siteContent.hero.headlineSw)}
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl">
                {pick(locale, siteContent.hero.subtitleEn, siteContent.hero.subtitleSw)}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href={link(locale, siteContent.hero.primaryCtaLink)}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm transition-all hover:bg-amber-400"
                >
                  <span>
                    {pick(locale, siteContent.hero.primaryCtaEn, siteContent.hero.primaryCtaSw)}
                  </span>
                  <ArrowRight size={16} aria-hidden />
                </Link>

                <Link
                  href={link(locale, siteContent.hero.secondaryCtaLink)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <GraduationCap size={16} aria-hidden />
                  <span>
                    {pick(locale, siteContent.hero.secondaryCtaEn, siteContent.hero.secondaryCtaSw)}
                  </span>
                </Link>
              </div>

              {/* Trust micro metrics */}
              <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-slate-400 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-400" aria-hidden />
                  <span>100% Escrow Protected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-amber-400" aria-hidden />
                  <span>31 Regions Countrywide</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-amber-400" aria-hidden />
                  <span>Verified University Credentials</span>
                </div>
              </div>
            </div>

            {/* Right User Portal & Safe Trade Card (AliExpress Style) */}
            <div className="space-y-4">
              {/* Account Box */}
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl shadow-xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-400 text-slate-950 font-bold text-sm">
                    {currentUser ? currentUser.name.slice(0, 1).toUpperCase() : <User size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300">
                      {currentUser ? "Signed in as" : "Welcome to Duka Campus"}
                    </p>
                    <p className="truncate text-sm font-bold text-white">
                      {currentUser ? currentUser.name : "Student & Retail Market"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {currentUser ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Link
                        href={link(locale, "/account/orders")}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-white/10 p-2 text-slate-200 hover:bg-white/20 transition-colors"
                      >
                        <Package size={13} />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        href={link(locale, "/marketplace")}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-white/10 p-2 text-slate-200 hover:bg-white/20 transition-colors"
                      >
                        <GraduationCap size={13} />
                        <span>Marketplace</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Link
                        href={link(locale, "/login")}
                        className="rounded-lg bg-amber-500 py-2 text-center font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href={link(locale, "/register")}
                        className="rounded-lg border border-white/25 bg-white/10 py-2 text-center font-semibold text-white hover:bg-white/20 transition-colors"
                      >
                        Join Free
                      </Link>
                    </div>
                  )}

                  <Link
                    href={link(locale, "/account/verify")}
                    className="block text-center rounded-lg bg-slate-900/80 py-2 text-xs font-semibold text-amber-300 hover:bg-slate-900 transition-colors border border-amber-400/30"
                  >
                    Verify Student ID (.ac.tz)
                  </Link>
                </div>
              </div>

              {/* Buyer Protection Guarantee Box */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <ShieldCheck size={15} />
                  <span>Buyer Protection Guarantee</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                  Money is kept safely in escrow. Releases to the seller only after you inspect your item at an on-campus safe trade zone.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-2.5">
                  <span>Safe Handover PIN</span>
                  <span className="text-emerald-400 font-semibold">Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AliExpress Super Deals Section */}
      {siteContent.superDeals.enabled && (
        <section className="border-b border-slate-200/80 bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/70 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                      {siteContent.superDeals.badgeEn}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                      {pick(locale, siteContent.superDeals.titleEn, siteContent.superDeals.titleSw)}
                    </h2>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600">
                    {pick(locale, siteContent.superDeals.subtitleEn, siteContent.superDeals.subtitleSw)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
                    <Clock size={13} aria-hidden />
                    <span>Limited Time Offers</span>
                  </div>
                  <Link
                    href={link(locale, siteContent.superDeals.ctaLink)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <Tag size={13} aria-hidden />
                    <span>{pick(locale, siteContent.superDeals.ctaEn, siteContent.superDeals.ctaSw)}</span>
                  </Link>
                </div>
              </div>

              {/* Showcase deal products */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {superDeals.map((product) => (
                  <ProductCard key={product.id} product={product} locale={locale} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Listings: Dedicated Student-Verified Marketplace Section */}
      <FeaturedListingsSection
        listings={featuredListings}
        totalCount={liveListings}
        locale={locale}
      />

      {/* Shop By Category Visual Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <SectionHeading title={t("home.shopByCategory")} />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={link(locale, `/category/${category.slug}`)}
              className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-slate-50">
                {category.image ? (
                  <img
                    src={category.image}
                    alt=""
                    width={200}
                    height={200}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <p className="mt-2.5 truncate text-xs font-semibold text-slate-900">
                {pick(locale, category.nameEn, category.nameSw)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Campus Products (Duka Choice Stock) */}
      {featured.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <SectionHeading
            title={t("home.featured")}
            action={
              <Link
                href={link(locale, "/shop")}
                className="text-xs font-semibold text-slate-800 hover:underline"
              >
                {t("home.viewAll")} →
              </Link>
            }
          />
          <ProductGrid>
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </ProductGrid>
        </section>
      ) : null}

      {/* Value Propositions / Why Us Section */}
      <section className="mt-10 border-y border-slate-200/80 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="mb-8 text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {t("home.whyTitle")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {siteContent.features.map((feat) => {
              const Icon = getFeatureIcon(feat.icon);
              return (
                <div
                  key={feat.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-900">
                    <Icon size={20} aria-hidden />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {pick(locale, feat.titleEn, feat.titleSw)}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {pick(locale, feat.bodyEn, feat.bodySw)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <SectionHeading
          title={t("home.newArrivals")}
          action={
            <Link
              href={link(locale, "/shop?sort=newest")}
              className="text-xs font-semibold text-slate-800 hover:underline"
            >
              {t("home.viewAll")} →
            </Link>
          }
        />
        <ProductGrid>
          {featured.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </ProductGrid>
      </section>
    </>
  );
}
