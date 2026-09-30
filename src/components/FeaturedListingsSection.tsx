"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Laptop,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tag,
  Wallet,
} from "lucide-react";
import { formatTZS } from "@/lib/tz";
import { getTranslator, link, pick, type Locale } from "@/lib/i18n";
import type { ListingCardData } from "@/lib/marketplace";

export type FeaturedListingsSectionProps = {
  listings: ListingCardData[];
  totalCount: number;
  locale: Locale;
};

type FilterCategory = "all" | "tech" | "books" | "living";

export function FeaturedListingsSection({
  listings,
  totalCount,
  locale,
}: FeaturedListingsSectionProps) {
  const t = getTranslator(locale);
  const [activeTab, setActiveTab] = useState<FilterCategory>("all");

  const filteredListings = useMemo(() => {
    if (activeTab === "all") return listings;
    if (activeTab === "tech") {
      return listings.filter(
        (l) =>
          l.category.slug.includes("phone") ||
          l.category.slug.includes("elec") ||
          l.titleEn.toLowerCase().includes("laptop") ||
          l.titleEn.toLowerCase().includes("calculator") ||
          l.titleEn.toLowerCase().includes("power bank") ||
          l.titleEn.toLowerCase().includes("lamp"),
      );
    }
    if (activeTab === "books") {
      return listings.filter(
        (l) =>
          l.titleEn.toLowerCase().includes("book") ||
          l.titleEn.toLowerCase().includes("drawing") ||
          l.titleEn.toLowerCase().includes("physiology") ||
          l.titleEn.toLowerCase().includes("microeconomics") ||
          l.titleEn.toLowerCase().includes("calculator"),
      );
    }
    if (activeTab === "living") {
      return listings.filter(
        (l) =>
          l.category.slug.includes("home") ||
          l.category.slug.includes("fash") ||
          l.titleEn.toLowerCase().includes("kettle") ||
          l.titleEn.toLowerCase().includes("lamp") ||
          l.titleEn.toLowerCase().includes("cooker"),
      );
    }
    return listings;
  }, [listings, activeTab]);

  return (
    <section className="border-b border-slate-200/80 bg-slate-50/60 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-amber-300">
                <GraduationCap size={13} aria-hidden />
                <span>{locale === "sw" ? "SOKO LA CHUO KIKUU" : "CAMPUS STUDENT MARKET"}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                <ShieldCheck size={13} aria-hidden />
                <span>{locale === "sw" ? "Uhakiki wa Mwanafunzi" : "Verified Students"}</span>
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {locale === "sw" ? "Bidhaa Maalum za Wanafunzi" : "Featured Student Listings"}
            </h2>

            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              {locale === "sw"
                ? "Vitabu vya kiada, vifaa vya elektroniki, na mahitaji ya mabweni kutoka kwa wanafunzi waliothibitishwa wa vyuo vikuu nchini Tanzania. Malipo yanalindwa kwa escrow na ukaguzi wa ana kwa ana."
                : "Textbooks, engineering instruments, student laptops, and dorm essentials sold by verified university students. Backed by mobile-money escrow and safe on-campus handover zones."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={link(locale, "/marketplace")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-amber-600 transition-colors"
            >
              <span>
                {locale === "sw"
                  ? `Tazama bidhaa zote za chuo (${totalCount})`
                  : `Browse all campus listings (${totalCount})`}
              </span>
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>

        {/* High-Trust Verification Bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
              <CheckCircle2 size={16} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">
                {locale === "sw" ? "Barua Pepe ya Chuo (.ac.tz)" : "Verified Student Identity"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {locale === "sw" ? "Wauzaji wote wanathibitishwa na chuo" : "Sellers verified with official university credentials"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700 shrink-0">
              <Wallet size={16} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">
                {locale === "sw" ? "Ulinzi Kamili wa Escrow" : "100% Escrow Protection"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {locale === "sw" ? "Fedha hazitolewi hadi uhakiki mzigo" : "Payment released only after you inspect and accept"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700 shrink-0">
              <MapPin size={16} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">
                {locale === "sw" ? "Eneo Salama la Makutano" : "Campus Safe Trade Zones"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {locale === "sw" ? "PIN ya nambari 4 ya makabidhiano" : "Handover PIN verified at library or student union"}
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            {locale === "sw" ? "Zote" : "All Listings"} ({listings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tech")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "tech"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Laptop size={13} aria-hidden />
            <span>{locale === "sw" ? "Teknolojia & Vifaa" : "Student Tech & Gadgets"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("books")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "books"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <BookOpen size={13} aria-hidden />
            <span>{locale === "sw" ? "Vitabu & Masomo" : "Textbooks & Stationery"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("living")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "living"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Tag size={13} aria-hidden />
            <span>{locale === "sw" ? "Vifaa vya Bweni" : "Hostel & Living"}</span>
          </button>

          <Link
            href={link(locale, "/account/verify")}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950 underline decoration-slate-300"
          >
            <span>{locale === "sw" ? "Uza bidhaa zako chuoni" : "Sell your gear on campus"}</span>
            <ArrowRight size={12} aria-hidden />
          </Link>
        </div>

        {/* Listings Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {filteredListings.map((listing) => {
            const title = pick(locale, listing.titleEn, listing.titleSw);
            const campusName = pick(locale, listing.university.nameEn, listing.university.nameSw);
            const image = listing.images[0];
            const sellerInitial = listing.seller.name.slice(0, 1).toUpperCase();

            return (
              <article
                key={listing.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-slate-50">
                  {image ? (
                    <img
                      src={image.url}
                      alt={image.alt ?? title}
                      loading="lazy"
                      width={300}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-slate-400 p-2 text-center">
                      {title}
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute left-2.5 top-2.5 flex flex-col gap-1 items-start">
                    <span className="inline-flex items-center gap-1 rounded bg-white/95 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-slate-900 shadow-xs border border-slate-200/80">
                      <ShieldCheck size={11} className="text-emerald-600" aria-hidden />
                      <span>{locale === "sw" ? "Imethibitishwa" : "Verified Student"}</span>
                    </span>
                    {listing.condition ? (
                      <span className="rounded bg-slate-900/90 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-semibold text-slate-200 shadow-xs">
                        {t(`mkt.condition.${listing.condition}` as import("@/lib/i18n").TranslationKey)}
                      </span>
                    ) : null}
                  </div>

                  {/* Campus Watermark / Pill */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="block truncate rounded bg-slate-900/75 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-white shadow-xs">
                      {campusName}
                    </span>
                  </div>
                </div>

                {/* Listing Details */}
                <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                  {/* Category & Region */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate font-medium text-slate-600">
                      {pick(locale, listing.category.nameEn, listing.category.nameSw)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">
                      Escrow
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-slate-900 group-hover:text-amber-600 transition-colors">
                    <Link
                      href={link(locale, `/marketplace/${listing.slug}`)}
                      className="after:absolute after:inset-0"
                    >
                      {title}
                    </Link>
                  </h3>

                  {/* Pricing and Trust Footer */}
                  <div className="mt-auto pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-base font-bold text-slate-900">
                        {formatTZS(listing.price)}
                      </span>
                    </div>

                    {/* Seller info row */}
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700">
                          {sellerInitial}
                        </span>
                        <span className="truncate">{listing.seller.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {locale === "sw" ? "Makutano Chuoni" : "Campus Meetup"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Sell on Campus Banner */}
        <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Sparkles size={14} className="text-amber-500" aria-hidden />
                <span>{locale === "sw" ? "Uza Kwenye Soko la Chuo" : "Turn Used Campus Gear into Cash"}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                {locale === "sw"
                  ? "Una vitabu, kikokotoo, au vifaa vya bweni unavyotaka kuuza?"
                  : "Have textbooks, calculators, or dorm gear you no longer need?"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {locale === "sw"
                  ? "Jiunge na wanafunzi wenzako. Thibitisha barua pepe ya chuo kikuu chako na uorodheshe bidhaa yako ndani ya dakika 2 bila ada ya kuanzia."
                  : "Connect directly with students at your university. Instant email verification, zero listing fees, and guaranteed payout through secure escrow."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href={link(locale, "/marketplace/new")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <span>{locale === "sw" ? "Weka Tangazo Sasa" : "Post a Listing"}</span>
                <ArrowRight size={14} aria-hidden />
              </Link>
              <Link
                href={link(locale, "/account/verify")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ShieldCheck size={15} aria-hidden />
                <span>{locale === "sw" ? "Thibitisha Kitambulisho" : "Verify Student ID"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
