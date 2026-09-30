import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { resolveLocale } from "@/lib/i18n";
import { getSiteContent } from "@/lib/site-content";
import { InteractiveSiteCustomizer } from "@/components/admin/InteractiveSiteCustomizer";

export const metadata: Metadata = {
  title: "Site Customizer (WordPress/Shopify Editor)",
};

export default async function CustomizerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  await requireAdmin(locale);

  const siteContent = await getSiteContent();

  return (
    <div className="space-y-6">
      <InteractiveSiteCustomizer initialConfig={siteContent} locale={locale} />
    </div>
  );
}
