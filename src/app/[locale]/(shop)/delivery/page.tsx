import type { Metadata } from "next";
import { getDeliveryZones, getShopSettings } from "@/lib/settings";
import { getTranslator, resolveLocale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { Alert } from "@/components/ui";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  return { title: getTranslator(resolveLocale(raw))("footer.deliveryInfo") };
}

export default async function DeliveryPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const [zones, settings] = await Promise.all([getDeliveryZones(), getShopSettings()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {t("footer.deliveryInfo")}
      </h1>
      <p className="mt-3 leading-relaxed text-ink-600">{t("home.why2Body")}</p>

      {settings.freeDeliveryOver !== null ? (
        <Alert tone="success" className="mt-5">
          {t("checkout.freeDeliveryOver", {
            amount: formatTZS(settings.freeDeliveryOver),
          })}
        </Alert>
      ) : null}

      {/* The table is generated from the delivery zones the admin manages, so
          it can never drift from what checkout actually charges. */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-ink-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-50 text-ink-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                {t("checkout.region")}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {t("checkout.delivery")}
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                {locale === "sw" ? "Muda" : "Time"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {zones.map((zone) => (
              <tr key={zone.id}>
                <td className="px-4 py-2.5 text-ink-900">{zone.region}</td>
                <td className="px-4 py-2.5 font-medium text-ink-900">
                  {formatTZS(zone.fee)}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-ink-600">
                  {zone.etaMinDays}–{zone.etaMaxDays}{" "}
                  {locale === "sw" ? "siku" : "days"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 text-sm text-ink-500">
        {locale === "sw"
          ? "Muda ni wa siku za kazi na huanza kuhesabiwa baada ya oda kuthibitishwa."
          : "Times are in working days and start once your order is confirmed."}
      </p>
    </div>
  );
}
