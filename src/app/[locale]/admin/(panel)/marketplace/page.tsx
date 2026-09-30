import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime, link, resolveLocale } from "@/lib/i18n";
import { formatPhone, formatTZS } from "@/lib/tz";
import { Badge } from "@/components/ui";
import { MarketplaceEscrowActions } from "@/components/admin/MarketplaceEscrowActions";
import { moderateListingAction, featureListingAction, unfeatureListingAction } from "@/app/actions/admin-marketplace";

export const metadata = { title: "Marketplace" };

const ESCROW_STATUSES = [
  "AWAITING_FUNDING",
  "FUNDED",
  "DELIVERED",
  "RELEASED",
  "REFUNDED",
  "DISPUTED",
] as const;

export default async function AdminMarketplacePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ escrow?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);

  const filter = query.escrow;
  const escrowWhere =
    filter && ESCROW_STATUSES.includes(filter as (typeof ESCROW_STATUSES)[number])
      ? { escrowStatus: filter }
      : { escrowStatus: { not: "RELEASED" } };

  const escrowOrders = await prisma.order.findMany({
    where: { sellerId: { not: null }, ...escrowWhere },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      user: { select: { name: true, phone: true } },
      seller: { select: { name: true, phone: true } },
    },
  });

  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      slug: true,
      titleEn: true,
      price: true,
      status: true,
      isFeatured: true,
      featuredUntil: true,
      createdAt: true,
      seller: { select: { name: true } },
    },
  });

  const statusTone = (status: string) =>
    status === "RELEASED"
      ? "success"
      : status === "REFUNDED"
        ? "warning"
        : status === "DISPUTED"
          ? "danger"
          : "neutral";

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Marketplace</h1>
      <p className="mt-1 text-sm text-ink-600">
        Escrow queue on the left, listing moderation below.
      </p>

      <h2 className="mt-8 text-lg font-bold text-ink-900">Escrow</h2>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ESCROW_STATUSES.map((status) => (
          <Link
            key={status}
            href={
              status === "RELEASED"
                ? link(locale, "/admin/marketplace")
                : link(locale, `/admin/marketplace?escrow=${status}`)
            }
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              query.escrow === status
                ? "bg-ink-900 text-white"
                : "bg-white text-ink-700 hover:bg-ink-100"
            }`}
          >
            {status}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-ink-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Order</th>
              <th scope="col" className="px-4 py-3 font-semibold">Buyer</th>
              <th scope="col" className="px-4 py-3 font-semibold">Seller</th>
              <th scope="col" className="px-4 py-3 font-semibold">Amount</th>
              <th scope="col" className="px-4 py-3 font-semibold">Escrow</th>
              <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {escrowOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                  Nothing in the escrow queue.
                </td>
              </tr>
            ) : (
              escrowOrders.map((order) => (
                <tr key={order.id} className="align-top hover:bg-ink-50">
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
                    <p className="font-medium text-ink-900">
                      {order.user?.name ?? order.customerName}
                    </p>
                    <p className="text-xs text-ink-500">
                      {formatPhone(order.user?.phone ?? order.customerPhone)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{order.seller?.name}</p>
                    <p className="text-xs text-ink-500">
                      {formatPhone(order.seller?.phone ?? "")}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink-900">
                    {formatTZS(order.total)}
                    {order.platformFee > 0 ? (
                      <p className="text-xs font-normal text-ink-500">
                        fee {formatTZS(order.platformFee)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(order.escrowStatus)}>
                      {order.escrowStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <MarketplaceEscrowActions
                      orderNumber={order.orderNumber}
                      escrowStatus={order.escrowStatus}
                      escrowRef={order.escrowRef}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-bold text-ink-900">Listing moderation</h2>

      <div className="mt-3 overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-ink-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Listing</th>
              <th scope="col" className="px-4 py-3 font-semibold">Seller</th>
              <th scope="col" className="px-4 py-3 font-semibold">Price</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Featured</th>
              <th scope="col" className="px-4 py-3 font-semibold">Moderate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {listings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                  No listings yet.
                </td>
              </tr>
            ) : (
              listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <Link
                      href={link(locale, `/marketplace/${listing.slug}`)}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {listing.titleEn}
                    </Link>
                    <p className="text-xs text-ink-500">
                      {formatDateTime(listing.createdAt, locale)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{listing.seller?.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink-900">
                    {formatTZS(listing.price)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={listing.status === "REMOVED" ? "neutral" : "success"}>
                      {listing.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {listing.isFeatured ? (
                      <div className="space-y-1.5">
                        <Badge tone="info">Featured</Badge>
                        {listing.featuredUntil ? (
                          <p className="text-xs text-ink-500">
                            until {formatDateTime(listing.featuredUntil, locale)}
                          </p>
                        ) : null}
                        <form action={unfeatureListingAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="listingId" value={listing.id} />
                          <button className="rounded-lg border border-ink-300 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-50">
                            Unfeature
                          </button>
                        </form>
                      </div>
                    ) : (
                      <form action={featureListingAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="listingId" value={listing.id} />
                        <input type="hidden" name="days" value="7" />
                        <button className="rounded-lg border border-brand-300 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                          Feature 7d
                        </button>
                      </form>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <form action={moderateListingAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="listingId" value={listing.id} />
                      {listing.status === "REMOVED" ? (
                        <>
                          <input type="hidden" name="status" value="ACTIVE" />
                          <button className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-800">
                            Restore
                          </button>
                        </>
                      ) : (
                        <>
                          <input type="hidden" name="status" value="REMOVED" />
                          <button className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                            Suspend
                          </button>
                        </>
                      )}
                    </form>
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