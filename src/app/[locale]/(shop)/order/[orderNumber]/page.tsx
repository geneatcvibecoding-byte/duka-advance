import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, CircleDot, MapPin, MessageCircle, Store, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getShopSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { AUTO_RELEASE_DAYS } from "@/lib/escrow";
import {
  formatDateTime,
  getTranslator,
  link,
  resolveLocale,
  type TranslationKey,
} from "@/lib/i18n";
import { formatPhone, formatTZS, whatsappNumber } from "@/lib/tz";
import { Alert, Badge, buttonStyles } from "@/components/ui";
import { PaymentRefForm } from "@/components/PaymentRefForm";
import { EscrowPanel } from "@/components/EscrowPanel";
import { OrderMessages } from "@/components/OrderMessages";
import { getOrderMessages } from "@/lib/seller-dashboard";

type Props = { params: Promise<{ locale: string; orderNumber: string }> };

const FLOW = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: orderNumber };
}

export default async function OrderPage({ params }: Props) {
  const { locale: raw, orderNumber } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      seller: { select: { id: true, name: true, phone: true, studentVerifiedAt: true } },
      user: { select: { id: true, name: true } },
    },
  });
  if (!order) notFound();

  const user = await getCurrentUser();
  const settings = await getShopSettings();

  const isMarketplace = Boolean(order.sellerId);
  const isBuyer = user?.id === order.userId;
  const isSeller = user?.id === order.sellerId;

  const currentStep = FLOW.indexOf(order.status as (typeof FLOW)[number]);
  const isCancelled = order.status === "CANCELLED";

  // The thread is only fetched for the two people on the order, and the check
  // lives in the query as well as here.
  const messages =
    isMarketplace && user && (isBuyer || isSeller)
      ? await getOrderMessages(user.id, order.id)
      : [];

  const tillNumbers = [
    { label: "M-Pesa (Lipa Namba)", value: settings.mpesaLipaNamba, name: settings.mpesaName },
    { label: "Tigo Pesa", value: settings.tigoPesaNumber, name: settings.mpesaName },
    { label: "Airtel Money", value: settings.airtelMoneyNumber, name: settings.mpesaName },
    { label: "HaloPesa", value: settings.halopesaNumber, name: settings.mpesaName },
    {
      label: settings.bankName ?? "Bank",
      value: settings.bankAccountNumber,
      name: settings.bankAccountName,
    },
  ].filter((entry) => Boolean(entry.value));

  const whatsappMessage = encodeURIComponent(
    [
      `Habari, ninataka kuthibitisha oda yangu.`,
      `Order: ${order.orderNumber}`,
      `Jina: ${order.customerName}`,
      ...order.items.map((i) => `- ${i.nameEn} x${i.quantity} = ${formatTZS(i.lineTotal)}`),
      `Jumla: ${formatTZS(order.total)}`,
      `Anwani: ${order.street}, ${order.district}, ${order.region}`,
    ].join("\n"),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-6">
        <h1 className="text-xl font-bold text-brand-900 sm:text-2xl">
          {t("order.thankYou")}
        </h1>
        <p className="mt-2 text-brand-800">
          {t("order.confirmationBody", { phone: formatPhone(order.customerPhone) })}
        </p>
        <p className="mt-4 text-sm text-brand-800">
          {t("order.orderNumber")}:{" "}
          <span className="font-mono text-lg font-bold tracking-wide text-brand-900">
            {order.orderNumber}
          </span>
        </p>
      </div>

      {/* Marketplace escrow takes over the payment sections entirely. */}
      {isMarketplace ? (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-ink-900">
            <ShieldCheck size={18} aria-hidden className="text-brand-600" />
            {t("mkt.escrow")}
          </h2>
          <EscrowPanel
            locale={locale}
            orderNumber={order.orderNumber}
            escrowStatus={order.escrowStatus}
            amount={order.total}
            isBuyer={isBuyer}
            isSeller={isSeller}
            buyerName={order.user?.name ?? order.customerName}
            sellerName={order.seller?.name ?? "—"}
            escrowRef={order.escrowRef}
            autoReleaseDays={AUTO_RELEASE_DAYS}
            sampleNumbers={tillNumbers.map((entry) => ({
              label: entry.label,
              value: entry.value ?? "",
            }))}
            labels={{
              status: (status) => t(`mkt.escrow${status}` as TranslationKey),
              payTitle: t("mkt.escrowPayTitle"),
              payBody: t("mkt.escrowPayBody"),
              ref: t("mkt.escrowRef"),
              refHint: t("mkt.escrowRefHint"),
              confirmPaid: t("mkt.escrowConfirmPaid"),
              refSubmitted: t("mkt.escrowRefSubmitted"),
              markDelivered: t("mkt.markDelivered"),
              markDeliveredBody: t("mkt.markDeliveredBody"),
              confirmReceived: t("mkt.confirmReceived"),
              confirmReceivedBody: t("mkt.confirmReceivedBody"),
              deadline: t("mkt.handoverDeadline"),
              next: t("mkt.whatHappensNext"),
              waitingSeller: t("mkt.waitingSeller"),
              rateTitle: t("mkt.rateTitle"),
              rateComment: t("mkt.rateComment"),
              openDispute: t("mkt.openDispute"),
              disputeReason: t("mkt.disputeReason"),
              seller: t("mkt.seller"),
              buyer: t("account.profile"),
              phone: t("auth.phone"),
              submit: t("common.save"),
              needHelp: t("mkt.openDispute"),
              invalidRef: t("error.required"),
              invalidReason: t("error.required"),
              missingPayoutRef: t("error.required"),
            }}
          />
        </section>
      ) : null}

      {/* Buyer <-> seller thread, so a campus handover can be arranged. Only the
          two people on the order ever see it. */}
      {isMarketplace && user && (isBuyer || isSeller) ? (
        <section className="mt-6">
          <OrderMessages
            locale={locale}
            orderId={order.id}
            currentUserId={user.id}
            messages={messages.map((message) => ({
              id: message.id,
              body: message.body,
              createdAt: message.createdAt,
              senderId: message.senderId,
              senderName: message.sender.name,
            }))}
            labels={{
              title: t("seller.messages"),
              empty: t("seller.noMessages"),
              placeholder: t("seller.messagePlaceholder"),
              send: t("seller.send"),
            }}
          />
        </section>
      ) : null}

      {/* Payment instructions vary by method — this is the screen that decides
          whether the customer actually pays. */}
      {!isMarketplace && order.paymentMethod === "TRANSFER" && order.paymentStatus !== "PAID" ? (
        <section className="mt-6 rounded-xl border border-ink-200 p-5">
          <h2 className="font-bold text-ink-900">{t("order.payInstructionsTitle")}</h2>
          <p className="mt-1.5 text-sm text-ink-600">
            {t("order.payInstructionsBody", { amount: formatTZS(order.total) })}
          </p>

          <ul className="mt-4 divide-y divide-ink-200 rounded-lg border border-ink-200">
            {tillNumbers.map((entry) => (
              <li
                key={entry.label}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <span className="text-sm text-ink-600">{entry.label}</span>
                <span className="text-right">
                  <span className="block font-mono text-base font-bold text-ink-900">
                    {entry.value}
                  </span>
                  {entry.name ? (
                    <span className="block text-xs text-ink-500">{entry.name}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5">
            {order.paymentStatus === "AWAITING_CONFIRMATION" ? (
              <Alert tone="info">{t("order.refSubmitted")}</Alert>
            ) : (
              <PaymentRefForm
                locale={locale}
                orderNumber={order.orderNumber}
                currentRef={order.paymentRef}
                labels={{
                  reference: t("order.transactionRef"),
                  hint: t("order.transactionRefHint"),
                  submit: t("order.submitRef"),
                  submitted: t("order.refSubmitted"),
                }}
              />
            )}
          </div>
        </section>
      ) : null}

      {order.paymentMethod === "WHATSAPP" ? (
        <section className="mt-6 rounded-xl border border-ink-200 p-5">
          <h2 className="font-bold text-ink-900">{t("pay.whatsapp.name")}</h2>
          <p className="mt-1.5 text-sm text-ink-600">{t("pay.whatsapp.desc")}</p>
          <a
            href={`https://wa.me/${whatsappNumber(settings.whatsapp)}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles("primary", "md", "mt-4")}
          >
            <MessageCircle size={18} aria-hidden />
            {t("order.whatsappCta")}
          </a>
        </section>
      ) : null}

      {order.paymentMethod === "PICKUP" ? (
        <section className="mt-6 rounded-xl border border-ink-200 p-5">
          <h2 className="flex items-center gap-2 font-bold text-ink-900">
            <Store size={18} aria-hidden />
            {t("order.pickupTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-ink-600">
            {t("order.pickupBody", { address: settings.addressLine })}
          </p>
        </section>
      ) : null}

      {order.paymentMethod === "COD" ? (
        <Alert tone="info" className="mt-6">
          {t("pay.cod.desc")} — <strong>{formatTZS(order.total)}</strong>
        </Alert>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 font-bold text-ink-900">{t("order.timeline")}</h2>

        {isCancelled ? (
          <Alert tone="danger">{t("status.CANCELLED")}</Alert>
        ) : (
          <ol className="flex flex-wrap gap-x-2 gap-y-3">
            {FLOW.map((step, index) => {
              const done = index <= currentStep;
              return (
                <li key={step} className="flex items-center gap-2">
                  <span
                    className={
                      done
                        ? "grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-white"
                        : "grid h-7 w-7 place-items-center rounded-full bg-ink-200 text-ink-500"
                    }
                  >
                    {done ? (
                      <Check size={15} aria-hidden />
                    ) : (
                      <CircleDot size={15} aria-hidden />
                    )}
                  </span>
                  <span
                    className={
                      done
                        ? "text-sm font-semibold text-ink-900"
                        : "text-sm text-ink-500"
                    }
                  >
                    {t(`status.${step}` as TranslationKey)}
                  </span>
                  {index < FLOW.length - 1 ? (
                    <span aria-hidden className="hidden text-ink-300 sm:inline">
                      —
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={isCancelled ? "danger" : "success"}>
            {t(`status.${order.status}` as TranslationKey)}
          </Badge>
          <Badge
            tone={
              order.paymentStatus === "PAID"
                ? "success"
                : order.paymentStatus === "AWAITING_CONFIRMATION"
                  ? "warning"
                  : "neutral"
            }
          >
            {t(`paystatus.${order.paymentStatus}` as TranslationKey)}
          </Badge>
          <span className="text-sm text-ink-500">
            {t("order.placedOn")} {formatDateTime(order.createdAt, locale)}
          </span>
        </div>
      </section>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 font-bold text-ink-900">{t("order.items")}</h2>
          <ul className="divide-y divide-ink-200 rounded-xl border border-ink-200">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-3 p-3">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-lg border border-ink-200 object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900">{item.nameEn}</p>
                  {item.variantLabel ? (
                    <p className="text-xs text-ink-500">{item.variantLabel}</p>
                  ) : null}
                  <p className="text-xs text-ink-500">
                    {item.quantity} × {formatTZS(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink-900">
                  {formatTZS(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">{t("checkout.subtotal")}</dt>
              <dd>{formatTZS(order.subtotal)}</dd>
            </div>
            {order.discount > 0 ? (
              <div className="flex justify-between text-brand-700">
                <dt>
                  {t("checkout.discount")}
                  {order.couponCode ? ` (${order.couponCode})` : ""}
                </dt>
                <dd>−{formatTZS(order.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-ink-600">{t("checkout.delivery")}</dt>
              <dd>
                {order.deliveryFee === 0
                  ? t("checkout.free")
                  : formatTZS(order.deliveryFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold">
              <dt>{t("checkout.total")}</dt>
              <dd>{formatTZS(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-ink-900">
            <MapPin size={17} aria-hidden />
            {t("order.deliverTo")}
          </h2>
          <address className="rounded-xl border border-ink-200 p-4 not-italic leading-relaxed text-ink-700">
            <span className="block font-medium text-ink-900">{order.customerName}</span>
            <span className="block">{formatPhone(order.customerPhone)}</span>
            <span className="mt-2 block">{order.street}</span>
            <span className="block">
              {order.district}, {order.region}
            </span>
            {order.landmark ? (
              <span className="block text-ink-500">{order.landmark}</span>
            ) : null}
          </address>

          {order.notes ? (
            <p className="mt-3 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">
              {order.notes}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={link(locale, "/shop")} className={buttonStyles("secondary", "md")}>
          {t("cart.continueShopping")}
        </Link>
        <Link href={link(locale, "/track")} className={buttonStyles("ghost", "md")}>
          {t("nav.trackOrder")}
        </Link>
      </div>
    </div>
  );
}
