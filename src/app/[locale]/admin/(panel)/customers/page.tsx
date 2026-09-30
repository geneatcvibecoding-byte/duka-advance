import { prisma } from "@/lib/db";
import { formatDate, resolveLocale } from "@/lib/i18n";
import { formatPhone, formatTZS } from "@/lib/tz";
import { Badge, Input, buttonStyles } from "@/components/ui";
import {
  resetCustomerPasswordAction,
  toggleCustomerActiveAction,
} from "@/app/actions/admin";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);

  const where: Prisma.UserWhereInput = {};
  if (query.q?.trim()) {
    const term = query.q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
      orders: {
        where: { status: { not: "CANCELLED" } },
        select: { total: true },
      },
    },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Customers</h1>

      <form method="get" className="mt-5 flex gap-2">
        <Input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Name, phone or email"
          className="w-64"
        />
        <button type="submit" className={buttonStyles("secondary", "md")}>
          Search
        </button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-ink-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
              <th scope="col" className="px-4 py-3 font-semibold">Joined</th>
              <th scope="col" className="px-4 py-3 font-semibold">Orders</th>
              <th scope="col" className="px-4 py-3 font-semibold">Spent</th>
              <th scope="col" className="px-4 py-3 font-semibold">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink-900">{user.name}</p>
                    {user.role === "ADMIN" ? <Badge tone="info">Admin</Badge> : null}
                  </div>
                  <p className="text-xs text-ink-500">{formatPhone(user.phone)}</p>
                  {user.email ? (
                    <p className="text-xs text-ink-500">{user.email}</p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-600">
                  {formatDate(user.createdAt, locale)}
                </td>
                <td className="px-4 py-3 text-ink-600">{user._count.orders}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink-900">
                  {formatTZS(user.orders.reduce((sum, o) => sum + o.total, 0))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone={user.isActive ? "success" : "danger"}>
                        {user.isActive ? "Active" : "Disabled"}
                      </Badge>
                      <form action={toggleCustomerActiveAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-ink-600 hover:text-brand-700"
                        >
                          {user.isActive ? "Disable" : "Enable"}
                        </button>
                      </form>
                    </div>

                    <form
                      action={resetCustomerPasswordAction}
                      className="flex items-center gap-1.5"
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        name="password"
                        type="text"
                        minLength={8}
                        placeholder="New password"
                        className="h-8 w-32 rounded border border-ink-200 px-2 text-xs"
                        required
                      />
                      <button
                        type="submit"
                        className="text-xs font-medium text-ink-600 hover:text-brand-700"
                      >
                        Reset
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-500">
        Password resets are for customers who call the shop unable to sign in. Read the
        new password to them over the phone and ask them to change it.
      </p>
    </div>
  );
}
