import { Wallet } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getPayoutAccount, PAYOUT_METHODS } from "@/lib/seller-dashboard";
import { formatDateTime, getTranslator, resolveLocale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { Badge, Card, EmptyState } from "@/components/ui";
import { PayoutAccountForm } from "@/components/PayoutAccountForm";

/**
 * Where the money goes, and the record of where it went.
 *
 * The account is a prerequisite for release: an admin cannot pay a seller who
 * has not told the platform which number to send to, so the page leads with the
 * gap when one exists.
 */

const METHOD_LABELS: Record<string, string> = {
  MPESA: "M-Pesa",
  TIGO: "Tigo Pesa",
  AIRTEL: "Airtel Money",
  HALOPESA: "HaloPesa",
};

export default async function PayoutsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = (await getCurrentUser())!; // guarded by the account layout
  const { account, history } = await getPayoutAccount(user.id);

  const hasAccount = Boolean(account?.payoutNumber);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-ink-900">{t("seller.payoutTitle")}</h2>
        <p className="mt-1 text-sm text-ink-600">{t("seller.payoutBody")}</p>
      </div>

      {!hasAccount ? (
        <Card className="border-gold-200 bg-gold-50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-gold-900">
            <Wallet size={16} aria-hidden />
            {t("seller.payoutNotSet")}
          </p>
        </Card>
      ) : null}

      <Card className="p-5">
        <PayoutAccountForm
          locale={locale}
          current={
            account
              ? {
                  method: account.payoutMethod,
                  number: account.payoutNumber,
                  name: account.payoutName,
                }
              : null
          }
          methods={PAYOUT_METHODS.map((value) => ({
            value,
            label: METHOD_LABELS[value] ?? value,
          }))}
          labels={{
            method: t("seller.payoutMethod"),
            number: t("seller.payoutNumber"),
            numberHint: t("seller.payoutNumberHint"),
            name: t("seller.payoutName"),
            submit: t("seller.payoutSave"),
            pending: t("common.loading"),
            saved: t("seller.payoutSaved"),
          }}
        />
      </Card>

      <section>
        <h3 className="mb-3 font-bold text-ink-900">{t("seller.payoutHistory")}</h3>

        {history.length === 0 ? (
          <EmptyState
            icon={<Wallet size={36} aria-hidden />}
            title={t("seller.noPayouts")}
            body={t("seller.payoutBody")}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-200 bg-ink-50 text-ink-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("order.orderNumber")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("seller.gross")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("seller.fee")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("seller.net")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("seller.payouts")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {history.map((order) => (
                  <tr key={order.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-ink-800">
                        {order.orderNumber}
                      </span>
                      <p className="text-xs text-ink-500">
                        {order.items[0]?.nameEn ?? ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">{formatTZS(order.total)}</td>
                    <td className="px-4 py-3 text-ink-500">
                      −{formatTZS(order.platformFee)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-900">
                      {formatTZS(order.total - order.platformFee)}
                    </td>
                    <td className="px-4 py-3">
                      {order.payoutRef ? (
                        <span className="font-mono text-xs text-ink-600">
                          {order.payoutRef}
                        </span>
                      ) : null}
                      <p className="text-xs text-ink-500">
                        {order.releasedAt
                          ? formatDateTime(order.releasedAt, locale)
                          : ""}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-sm text-ink-500">
        <Badge tone="neutral">{t("seller.net")}</Badge> = {t("seller.gross")} −{" "}
        {t("seller.fee")}.{" "}
        <a
          href="/api/account/orders.csv"
          className="font-medium text-brand-700 hover:underline"
        >
          {t("seller.exportOrders")}
        </a>
      </p>
    </div>
  );
}
