import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import "../globals.css";
import { getShopSettings } from "@/lib/settings";
import { isLocale, locales, pick, resolveLocale } from "@/lib/i18n";

// Both locales are known at build time, so their shells can be prerendered.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const settings = await getShopSettings();
  const name = pick(locale, settings.nameEn, settings.nameSw);
  const tagline = pick(locale, settings.taglineEn, settings.taglineSw);

  return {
    title: { default: name, template: `%s · ${name}` },
    description: tagline,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    openGraph: { title: name, description: tagline, locale, type: "website" },
  };
}

export default async function LocaleRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Guards against /xx/... resolving to a half-translated page.
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
