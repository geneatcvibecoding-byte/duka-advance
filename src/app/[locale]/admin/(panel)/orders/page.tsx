import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime, link, resolveLocale } from "@/lib/i18n";
import { formatPhone, formatTZS } from "@/lib/tz";
import { Badge } from "@/components/ui";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Orders" };

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);

  const where: Prisma.OrderWhereInput = {};
  if (query.status && STATUSES.includes(query.status as (typeof STATUSES)[number])) {
    where.status = query.status;
  }
  if (query.q?.trim()) {
    const term = query.q.trim();
    where.OR = [
      { orderNumber: { contains: term, mode: "insensitive" } },
      { customerName: { contains: term, mode: "insensitive" } },
      { customerPhone: { contains: term } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: { select: { id: true } } },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Orders</h1>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <form method="get" className="flex gap-2">
          {query.status ? (
            <input type="hidden" name="status" value={query.status} />
          ) : null}
          <input
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="Order number, name or phone"
            className="field-input w-64"
          />
          <button type="submit" className="rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white">
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          <Link
            href={link(locale, "/admin/orders")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              !query.status
                ? "bg-ink-900 text-white"
                : "bg-white text-ink-700 hover:bg-ink-100"
            }`}
          >
            All
          </Link>
          {STATUSES.map((status) => (
            <Link
              key={status}
              href={link(locale, `/admin/orders?status=${status}`)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                query.status === status
                  ? "bg-ink-900 text-white"
                  : "bg-white text-ink-700 hover:bg-ink-100"
              }`}
            >
              {status}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-ink-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Order</th>
              <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
              <th scope="col" className="px-4 py-3 font-semibold">Destination</th>
              <th scope="col" className="px-4 py-3 font-semibold">Total</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                  No orders match this filter.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <Link
                      href={link(locale, `/admin/orders/${order.id}`)}
                      className="font-mono font-semibold text-brand-700 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-ink-500">
                      {formatDateTime(order.createdAt, locale)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{order.customerName}</p>
                    <p className="text-xs text-ink-500">
                      {formatPhone(order.customerPhone)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {order.district}, {order.region}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink-900">
                    {formatTZS(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        order.status === "CANCELLED"
                          ? "danger"
                          : order.status === "DELIVERED"
                            ? "success"
                            : "warning"
                      }
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        order.paymentStatus === "PAID"
                          ? "success"
                          : order.paymentStatus === "AWAITING_CONFIRMATION"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {order.paymentStatus}
                    </Badge>
                    <p className="mt-0.5 text-xs text-ink-500">{order.paymentMethod}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
