import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgePercent,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Palette,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { link, resolveLocale } from "@/lib/i18n";
import { logoutAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" } };

/**
 * The admin panel is English-only on purpose: shop staff work in one language,
 * and translating it would double the maintenance for no customer benefit.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const admin = await requireAdmin(locale);

  const nav = [
    { href: link(locale, "/admin"), label: "Dashboard", icon: LayoutDashboard },
    { href: link(locale, "/admin/selling-panel"), label: "Selling Hub & Stock", icon: Store },
    { href: link(locale, "/admin/orders"), label: "Orders", icon: ShoppingCart },
    { href: link(locale, "/admin/products"), label: "Products", icon: Package },
    { href: link(locale, "/admin/categories"), label: "Categories", icon: Tags },
    { href: link(locale, "/admin/reviews"), label: "Reviews", icon: MessageSquare },
    { href: link(locale, "/admin/coupons"), label: "Coupons", icon: BadgePercent },
    { href: link(locale, "/admin/marketplace"), label: "Marketplace", icon: ShieldCheck },
    { href: link(locale, "/admin/students"), label: "Students", icon: GraduationCap },
    { href: link(locale, "/admin/delivery"), label: "Delivery", icon: Truck },
    { href: link(locale, "/admin/customers"), label: "Customers", icon: Users },
    { href: link(locale, "/admin/customizer"), label: "Site Customizer", icon: Palette },
    { href: link(locale, "/admin/settings"), label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-ink-50 lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="bg-ink-900 text-white lg:min-h-screen">
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-400 font-black text-brand-900">
            D
          </span>
          <span className="font-bold">Duka admin</span>
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:overflow-visible">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-200 hover:bg-white/10 hover:text-white"
            >
              <Icon size={17} aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 px-4 py-3 text-sm">
          <p className="truncate font-medium text-white">{admin.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              href={link(locale, "/")}
              className="inline-flex items-center gap-1.5 text-ink-300 hover:text-white"
            >
              <Store size={14} aria-hidden />
              View shop
            </Link>
            <form action={logoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-ink-300 hover:text-white"
              >
                <LogOut size={14} aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
