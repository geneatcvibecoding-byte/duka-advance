import Link from "next/link";
import { AlertTriangle, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { link, resolveLocale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { Badge } from "@/components/ui";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    revenue,
    monthRevenue,
    orderCount,
    pendingCount,
    productCount,
    customerCount,
    lowStock,
    recentOrders,
    unapprovedReviews,
  ] = await Promise.all([
    // Revenue counts only orders that were actually paid for.
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      select: { id: true, nameEn: true, stock: true, slug: true },
      take: 8,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
    prisma.review.count({ where: { isApproved: false } }),
  ]);

  const stats = [
    {
      label: "Paid revenue",
      value: formatTZS(revenue._sum.total ?? 0),
      icon: TrendingUp,
      hint: `${formatTZS(monthRevenue._sum.total ?? 0)} this month`,
    },
    {
      label: "Orders",
      value: String(orderCount),
      icon: ShoppingCart,
      hint: `${pendingCount} awaiting action`,
    },
    { label: "Active products", value: String(productCount), icon: Package },
    { label: "Customers", value: String(customerCount), icon: Users },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, hint }) => (
          <div key={label} className="rounded-xl border border-ink-200 bg-white p-4">
            <div className="flex items-center gap-2 text-ink-500">
              <Icon size={16} aria-hidden />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-900">{value}</p>
            {hint ? <p className="mt-0.5 text-xs text-ink-500">{hint}</p> : null}
          </div>
        ))}
      </div>

      {pendingCount > 0 || unapprovedReviews > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {pendingCount > 0 ? (
            <Link
              href={link(locale, "/admin/orders?status=PENDING")}
              className="rounded-lg border border-gold-300 bg-gold-50 px-4 py-2.5 text-sm font-medium text-gold-900 hover:bg-gold-100"
            >
              {pendingCount} order{pendingCount === 1 ? "" : "s"} need confirming →
            </Link>
          ) : null}
          {unapprovedReviews > 0 ? (
            <Link
              href={link(locale, "/admin/reviews")}
              className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-900 hover:bg-blue-100"
            >
              {unapprovedReviews} review{unapprovedReviews === 1 ? "" : "s"} to approve →
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-ink-200 bg-white">
          <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
            <h2 className="font-bold text-ink-900">Recent orders</h2>
            <Link
              href={link(locale, "/admin/orders")}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-ink-200">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={link(locale, `/admin/orders/${order.id}`)}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-ink-900">
                        {order.orderNumber}
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        {order.customerName}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
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
                      <span className="text-sm font-semibold text-ink-900">
                        {formatTZS(order.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-ink-200 bg-white">
          <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-3">
            <AlertTriangle size={16} aria-hidden className="text-gold-600" />
            <h2 className="font-bold text-ink-900">Low stock</h2>
          </div>

          {lowStock.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-500">
              Everything is comfortably in stock.
            </p>
          ) : (
            <ul className="divide-y divide-ink-200">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <Link
                    href={link(locale, `/admin/products/${product.id}`)}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50"
                  >
                    <span className="truncate text-sm text-ink-900">
                      {product.nameEn}
                    </span>
                    <Badge tone={product.stock === 0 ? "danger" : "warning"}>
                      {product.stock} left
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
