import Link from "next/link";
import { Bell, GraduationCap, Phone, Search, ShoppingCart, User } from "lucide-react";
import { getCartCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/marketplace";
import { getNavCategories, getShopSettings } from "@/lib/settings";
import { getTranslator, link, pick, type Locale } from "@/lib/i18n";
import { formatPhone, whatsappNumber } from "@/lib/tz";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileMenu } from "./MobileMenu";

export async function Header({ locale }: { locale: Locale }) {
  const t = getTranslator(locale);
  const [settings, categories, cartCount, user] = await Promise.all([
    getShopSettings(),
    getNavCategories(),
    getCartCount(),
    getCurrentUser(),
  ]);

  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  const shopName = pick(locale, settings.nameEn, settings.nameSw);

  const primaryLinks = [
    { href: link(locale, "/"), label: t("nav.home") },
    { href: link(locale, "/shop"), label: t("nav.shop") },
    { href: link(locale, "/marketplace"), label: t("mkt.browse") },
    { href: link(locale, "/track"), label: t("nav.trackOrder") },
  ];

  const categoryLinks = categories.map((c) => ({
    href: link(locale, `/category/${c.slug}`),
    label: pick(locale, c.nameEn, c.nameSw),
  }));

  const accountLinks = user
    ? [
        { href: link(locale, "/account"), label: t("nav.account") },
        { href: link(locale, "/account/orders"), label: t("nav.orders") },
        { href: link(locale, "/wishlist"), label: t("nav.wishlist") },
        ...(user.role === "ADMIN"
          ? [{ href: link(locale, "/admin"), label: t("nav.admin") }]
          : []),
      ]
    : [
        { href: link(locale, "/login"), label: t("nav.login") },
        { href: link(locale, "/register"), label: t("nav.register") },
      ];

  return (
    <header className="sticky top-0 z-40">
      {/* Contact & trust utility strip */}
      <div className="bg-ink-900 text-ink-300 text-xs">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Phone size={13} aria-hidden />
              <span className="font-medium tracking-tight">{formatPhone(settings.phone)}</span>
            </a>
            <span className="text-ink-600 hidden sm:inline">|</span>
            <span className="text-ink-400 hidden sm:inline">
              {locale === "sw" ? "Usafirishaji wa haraka Tanzania nzima" : "Fast delivery across Tanzania · Escrow Protected"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user?.role === "ADMIN" ? (
              <Link
                href={link(locale, "/admin/customizer")}
                className="inline-flex items-center gap-1.5 rounded bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white transition-colors hover:bg-white/20"
              >
                <span>{locale === "sw" ? "Kihariri cha Tovuti" : "Site Customizer"}</span>
              </Link>
            ) : null}
            <a
              href={`https://wa.me/${whatsappNumber(settings.whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden transition-colors hover:text-white sm:inline"
            >
              {t("footer.whatsappUs")}
            </a>
            <LocaleSwitcher current={locale} />
          </div>
        </div>
      </div>

      {/* Main glass bar */}
      <div className="border-b border-ink-200/80 bg-white/85 backdrop-blur-xl shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <MobileMenu
            openLabel={t("nav.menu")}
            closeLabel={t("common.close")}
            primary={primaryLinks}
            categoriesLabel={t("nav.categories")}
            categories={categoryLinks}
            account={accountLinks}
          />

          <Link
            href={link(locale, "/")}
            className="flex shrink-0 items-center gap-2.5 text-lg font-bold tracking-tight text-ink-900"
          >
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-sm font-bold text-white shadow-sm"
            >
              D
            </span>
            <span className="font-semibold tracking-tight">{shopName}</span>
          </Link>

          <form
            action={link(locale, "/shop")}
            method="get"
            role="search"
            className="relative ml-auto w-full max-w-xl lg:ml-6"
          >
            <label className="sr-only" htmlFor="site-search">
              {t("common.search")}
            </label>
            <input
              id="site-search"
              type="search"
              name="q"
              placeholder={locale === "sw" ? "Tafuta bidhaa, chapa, au vitabu..." : "Search products, brands, or textbooks…"}
              className="h-10 w-full rounded-xl border border-ink-200/80 bg-ink-50/70 pl-10 pr-24 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink-900/10 transition-all"
            />
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-[11px] font-medium text-ink-400 bg-white/80 border border-ink-200/70 px-1.5 py-0.5 rounded">
                TSh
              </span>
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
            {user ? (
              <Link
                href={link(locale, "/account/notifications")}
                aria-label={t("seller.notifications")}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-ink-100/80"
              >
                <Bell size={18} aria-hidden />
                {unreadCount > 0 ? (
                  <span className="absolute 1.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink-900 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            ) : null}

            <Link
              href={user ? link(locale, "/account") : link(locale, "/login")}
              className="hidden h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-100/80 hover:text-ink-900 lg:inline-flex"
            >
              <User size={16} aria-hidden />
              <span className="max-w-[8rem] truncate">
                {user ? user.name.split(" ")[0] : t("nav.login")}
              </span>
            </Link>

            <Link
              href={link(locale, "/cart")}
              className="relative inline-flex h-9 items-center gap-2 rounded-lg border border-ink-200/70 bg-white px-3 text-xs font-medium text-ink-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              <ShoppingCart size={16} aria-hidden />
              <span className="hidden sm:inline">{t("nav.cart")}</span>
              {cartCount > 0 ? (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-ink-900 px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      {/* Category sub-navigation with glassmorphic backing */}
      <nav
        aria-label={t("nav.categories")}
        className="border-b border-ink-200/60 bg-white/70 backdrop-blur-md"
      >
        <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
          <Link
            href={link(locale, "/shop")}
            className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-ink-900 transition-colors hover:text-ink-600"
          >
            {t("common.all")}
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={link(locale, `/category/${category.slug}`)}
              className="whitespace-nowrap px-3 py-2 text-xs text-ink-600 transition-colors hover:text-ink-900"
            >
              {pick(locale, category.nameEn, category.nameSw)}
            </Link>
          ))}
          <div className="ml-auto pl-4 hidden md:flex items-center gap-2 text-xs text-ink-400">
            <Link
              href={link(locale, "/marketplace")}
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
            >
              <GraduationCap size={14} aria-hidden />
              <span>{locale === "sw" ? "Soko la Chuo" : "Campus Market"}</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
