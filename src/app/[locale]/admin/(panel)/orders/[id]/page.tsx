import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { getShopSettings } from "@/lib/settings";
import { formatDateTime, link, resolveLocale } from "@/lib/i18n";
import { formatPhone, formatTZS, whatsappNumber } from "@/lib/tz";
import { Badge, Select, Textarea, buttonStyles } from "@/components/ui";
import {
  addOrderNoteAction,
  updateOrderStatusAction,
  updatePaymentStatusAction,
} from "@/app/actions/admin";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];
const PAYMENT_STATUSES = [
  "UNPAID",
  "AWAITING_CONFIRMATION",
  "PAID",
  "REFUNDED",
  "FAILED",
];

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { createdAt: "desc" } },
        user: { select: { id: true, name: true } },
      },
    }),
    getShopSettings(),
  ]);

  if (!order) notFound();

  return (
    <div>
      <Link
        href={link(locale, "/admin/orders")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft size={15} aria-hidden />
        Back to orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-ink-900">
          {order.orderNumber}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Badge tone={order.status === "CANCELLED" ? "danger" : "success"}>
            {order.status}
          </Badge>
          <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"}>
            {order.paymentStatus}
          </Badge>
          <Badge tone="neutral">{order.paymentMethod}</Badge>
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-500">
        Placed {formatDateTime(order.createdAt, locale)}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="rounded-xl border border-ink-200 bg-white">
            <h2 className="border-b border-ink-200 px-4 py-3 font-bold text-ink-900">
              Items
            </h2>
            <ul className="divide-y divide-ink-200">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 px-4 py-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 shrink-0 rounded-lg border border-ink-200 object-cover"
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

            <dl className="space-y-1.5 border-t border-ink-200 px-4 py-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-600">Subtotal</dt>
                <dd>{formatTZS(order.subtotal)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-brand-700">
                  <dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                  <dd>−{formatTZS(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-ink-600">Delivery</dt>
                <dd>{formatTZS(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-200 pt-1.5 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatTZS(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-ink-200 bg-white p-4">
            <h2 className="mb-3 font-bold text-ink-900">History</h2>

            <form action={addOrderNoteAction} className="mb-4 space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <Textarea
                name="note"
                rows={2}
                placeholder="Add an internal note (e.g. 'Customer asked to deliver Saturday')"
                required
              />
              <button type="submit" className={buttonStyles("secondary", "sm")}>
                Add note
              </button>
            </form>

            <ol className="space-y-3">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="text-ink-800">{event.note ?? event.status}</p>
                    <p className="text-xs text-ink-500">
                      {formatDateTime(event.createdAt, locale)}
                      {event.actor ? ` · ${event.actor}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-ink-200 bg-white p-4">
            <h2 className="mb-3 font-bold text-ink-900">Update status</h2>

            <form action={updateOrderStatusAction} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <Select name="status" defaultValue={order.status}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
              <button type="submit" className={buttonStyles("primary", "sm", "w-full")}>
                Save status
              </button>
            </form>

            <p className="mt-2 text-xs text-ink-500">
              Cancelling returns the items to stock.
            </p>

            <form action={updatePaymentStatusAction} className="mt-4 space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <Select name="paymentStatus" defaultValue={order.paymentStatus}>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
              <button type="submit" className={buttonStyles("secondary", "sm", "w-full")}>
                Save payment
              </button>
            </form>

            {order.paymentRef ? (
              <div className="mt-4 rounded-lg bg-gold-50 p-3">
                <p className="text-xs font-medium text-gold-800">
                  Customer reference
                </p>
                <p className="font-mono text-sm font-bold text-gold-900">
                  {order.paymentRef}
                </p>
                <p className="mt-1 text-xs text-gold-700">
                  Check this against your statement before marking the order paid.
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-ink-200 bg-white p-4">
            <h2 className="mb-2 font-bold text-ink-900">Customer</h2>
            <p className="font-medium text-ink-900">{order.customerName}</p>
            <p className="text-sm text-ink-600">{formatPhone(order.customerPhone)}</p>
            {order.customerEmail ? (
              <p className="text-sm text-ink-600">{order.customerEmail}</p>
            ) : null}
            {!order.user ? (
              <p className="mt-1 text-xs text-ink-500">Guest checkout</p>
            ) : null}

            <div className="mt-3 flex gap-2">
              <a
                href={`tel:${order.customerPhone}`}
                className={buttonStyles("secondary", "sm", "flex-1")}
              >
                <Phone size={14} aria-hidden />
                Call
              </a>
              <a
                href={`https://wa.me/${whatsappNumber(order.customerPhone)}?text=${encodeURIComponent(
                  `Habari ${order.customerName}, ni kuhusu oda yako ${order.orderNumber}.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles("secondary", "sm", "flex-1")}
              >
                <MessageCircle size={14} aria-hidden />
                Chat
              </a>
            </div>

            <address className="mt-4 text-sm not-italic leading-relaxed text-ink-600">
              {order.street}
              <br />
              {order.district}, {order.region}
              {order.landmark ? (
                <>
                  <br />
                  <span className="text-ink-500">{order.landmark}</span>
                </>
              ) : null}
            </address>

            {order.notes ? (
              <p className="mt-3 rounded-lg bg-ink-50 p-2.5 text-sm text-ink-700">
                “{order.notes}”
              </p>
            ) : null}
          </section>

          {order.paymentMethod === "TRANSFER" ? (
            <section className="rounded-xl border border-ink-200 bg-white p-4 text-sm">
              <h2 className="mb-2 font-bold text-ink-900">Where to check</h2>
              <p className="text-ink-600">
                M-Pesa Lipa Namba{" "}
                <span className="font-mono font-semibold text-ink-900">
                  {settings.mpesaLipaNamba ?? "—"}
                </span>
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
