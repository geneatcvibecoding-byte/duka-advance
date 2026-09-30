import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getNavCategories, getShopSettings } from "@/lib/settings";
import { getTranslator, link, pick, type Locale } from "@/lib/i18n";
import { formatPhone, whatsappNumber } from "@/lib/tz";

export async function Footer({ locale }: { locale: Locale }) {
  const t = getTranslator(locale);
  const [settings, categories] = await Promise.all([
    getShopSettings(),
    getNavCategories(),
  ]);

  const shopName = pick(locale, settings.nameEn, settings.nameSw);

  return (
    <footer className="mt-16 border-t border-ink-200 bg-ink-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-base font-bold text-ink-900">{shopName}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {t("footer.aboutBody")}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-900">
            {t("nav.categories")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={link(locale, `/category/${category.slug}`)}
                  className="text-ink-600 hover:text-brand-700 hover:underline"
                >
                  {pick(locale, category.nameEn, category.nameSw)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-900">
            {t("footer.help")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href={link(locale, "/track")}
                className="text-ink-600 hover:text-brand-700 hover:underline"
              >
                {t("nav.trackOrder")}
              </Link>
            </li>
            <li>
              <Link
                href={link(locale, "/delivery")}
                className="text-ink-600 hover:text-brand-700 hover:underline"
              >
                {t("footer.deliveryInfo")}
              </Link>
            </li>
            <li>
              <Link
                href={link(locale, "/returns")}
                className="text-ink-600 hover:text-brand-700 hover:underline"
              >
                {t("footer.returns")}
              </Link>
            </li>
            <li>
              <Link
                href={link(locale, "/account/orders")}
                className="text-ink-600 hover:text-brand-700 hover:underline"
              >
                {t("nav.orders")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-900">
            {t("footer.contact")}
          </h2>
          <ul className="mt-3 space-y-3 text-sm text-ink-600">
            <li>
              <a
                href={`tel:${settings.phone}`}
                className="flex items-center gap-2 hover:text-brand-700"
              >
                <Phone size={15} aria-hidden className="shrink-0" />
                {formatPhone(settings.phone)}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${whatsappNumber(settings.whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-brand-700"
              >
                <MessageCircle size={15} aria-hidden className="shrink-0" />
                {formatPhone(settings.whatsapp)}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${settings.email}`}
                className="flex items-center gap-2 hover:text-brand-700"
              >
                <Mail size={15} aria-hidden className="shrink-0" />
                {settings.email}
              </a>
            </li>
            {settings.addressLine ? (
              <li className="flex items-start gap-2">
                <MapPin size={15} aria-hidden className="mt-0.5 shrink-0" />
                <span>{settings.addressLine}</span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {shopName}. {t("footer.rights")}
          </p>
          <div className="flex gap-4">
            <Link href={link(locale, "/terms")} className="hover:text-brand-700">
              {t("footer.terms")}
            </Link>
            <Link href={link(locale, "/privacy")} className="hover:text-brand-700">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
