import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  Bookmark,
  GraduationCap,
  HandCoins,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Star,
  Store,
  User,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/marketplace";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { logoutAction } from "@/app/actions/auth";

export default async function AccountLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  // Every /account route is behind this one guard.
  const user = await requireUser(locale, link(locale, "/account"));

  const unreadCount = await getUnreadNotificationCount(user.id);

  const tabs: { href: string; label: string; icon: typeof User; badge?: number }[] = [
    {
      href: link(locale, "/account/dashboard"),
      label: t("seller.dashboard"),
      icon: LayoutDashboard,
    },
    { href: link(locale, "/account"), label: t("account.profile"), icon: User },
    { href: link(locale, "/account/orders"), label: t("account.orders"), icon: Package },
    {
      href: link(locale, "/account/listings"),
      label: t("mkt.myListings"),
      icon: Store,
    },
    { href: link(locale, "/account/payouts"), label: t("seller.payouts"), icon: Wallet },
    { href: link(locale, "/account/offers"), label: t("seller.offers"), icon: HandCoins },
    { href: link(locale, "/account/reviews"), label: t("seller.reviews"), icon: Star },
    { href: link(locale, "/account/saved"), label: t("seller.saved"), icon: Bookmark },
    {
      href: link(locale, "/account/notifications"),
      label: t("seller.notifications"),
      icon: Bell,
      badge: unreadCount,
    },
    {
      href: link(locale, "/account/addresses"),
      label: t("account.addresses"),
      icon: MapPin,
    },
    { href: link(locale, "/wishlist"), label: t("account.wishlist"), icon: Heart },
    { href: link(locale, "/account/verify"), label: t("mkt.verify"), icon: GraduationCap },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          {t("account.greeting", { name: user.name.split(" ")[0] })}
        </h1>

        <form action={logoutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-red-600"
          >
            <LogOut size={16} aria-hidden />
            {t("nav.logout")}
          </button>
        </form>
      </div>

      <nav className="no-scrollbar mt-6 flex gap-1 overflow-x-auto border-b border-ink-200">
        {tabs.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className="flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-ink-600 hover:border-ink-300 hover:text-ink-900"
          >
            <Icon size={16} aria-hidden />
            {label}
            {badge ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="mt-7">{children}</div>
    </div>
  );
}
