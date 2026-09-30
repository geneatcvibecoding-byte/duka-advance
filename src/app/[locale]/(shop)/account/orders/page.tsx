import Link from "next/link";
import { Package } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  formatDate,
  getTranslator,
  link,
  resolveLocale,
  type TranslationKey,
} from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { Badge, EmptyState, buttonStyles } from "@/components/ui";

export default async function AccountOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const user = (await getCurrentUser())!;

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { take: 4 } },
  });

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package size={40} aria-hidden />}
        title={t("account.noOrders")}
        action={
          <Link href={link(locale, "/shop")} className={buttonStyles("primary", "md")}>
            {t("cart.emptyCta")}
          </Link>
        }
      />
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id} className="rounded-xl border border-ink-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                href={link(locale, `/order/${order.orderNumber}`)}
                className="font-mono font-bold text-ink-900 hover:text-brand-700"
              >
                {order.orderNumber}
              </Link>
              <p className="text-sm text-ink-500">
                {formatDate(order.createdAt, locale)} · {order.items.length}{" "}
                {t("order.items").toLowerCase()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={order.status === "CANCELLED" ? "danger" : "success"}>
                {t(`status.${order.status}` as TranslationKey)}
              </Badge>
              <Badge tone={order.paymentStatus === "PAID" ? "success" : "neutral"}>
                {t(`paystatus.${order.paymentStatus}` as TranslationKey)}
              </Badge>
              <span className="font-bold text-ink-900">{formatTZS(order.total)}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {order.items.map((item) =>
              item.imageUrl ? (
                <img
                  key={item.id}
                  src={item.imageUrl}
                  alt={item.nameEn}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-lg border border-ink-200 object-cover"
                />
              ) : null,
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
