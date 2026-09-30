import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { resolveLocale } from "@/lib/i18n";

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
