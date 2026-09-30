import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  formatDate,
  getTranslator,
  link,
  resolveLocale,
  type TranslationKey,
} from "@/lib/i18n";
import { formatTZS, normalizePhone } from "@/lib/tz";
import { Alert, Badge, Field, Input, buttonStyles } from "@/components/ui";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string; phone?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  return { title: getTranslator(resolveLocale(raw))("order.trackTitle") };
}

export default async function TrackPage({ params, searchParams }: Props) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const submitted = Boolean(query.order && query.phone);
  const phone = query.phone ? normalizePhone(query.phone) : null;

  // Requiring the phone number as well as the order number stops the page
  // being a way to enumerate other people's orders.
  const order =
    submitted && phone
      ? await prisma.order.findFirst({
          where: {
            orderNumber: query.order!.trim().toUpperCase(),
            customerPhone: phone,
          },
          include: { items: true },
        })
      : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        {t("order.trackTitle")}
      </h1>
      <p className="mt-1.5 text-ink-600">{t("order.trackHint")}</p>

      <form method="get" className="mt-7 space-y-4">
        <Field label={t("order.orderNumber")} htmlFor="order" required>
          <Input
            id="order"
            name="order"
            defaultValue={query.order ?? ""}
            placeholder="ORD-7K3M9P2"
            className="uppercase"
            required
          />
        </Field>

        <Field label={t("checkout.phone")} htmlFor="phone" required>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={query.phone ?? ""}
            placeholder="0712 345 678"
            required
          />
        </Field>

        <button type="submit" className={buttonStyles("primary", "lg", "w-full")}>
          {t("order.trackCta")}
        </button>
      </form>

      {submitted && !order ? (
        <Alert tone="danger" className="mt-6">
          {t("order.notFound")}
        </Alert>
      ) : null}

      {order ? (
        <div className="mt-8 rounded-xl border border-ink-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-lg font-bold text-ink-900">
              {order.orderNumber}
            </span>
            <Badge tone={order.status === "CANCELLED" ? "danger" : "success"}>
              {t(`status.${order.status}` as TranslationKey)}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-ink-500">
            {t("order.placedOn")} {formatDate(order.createdAt, locale)} ·{" "}
            {order.items.length} {t("order.items").toLowerCase()} ·{" "}
            {formatTZS(order.total)}
          </p>

          <Link
            href={link(locale, `/order/${order.orderNumber}`)}
            className={buttonStyles("primary", "md", "mt-4")}
          >
            {t("order.viewOrder")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
