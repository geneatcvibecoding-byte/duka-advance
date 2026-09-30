import { prisma } from "@/lib/db";
import { formatTZS } from "@/lib/tz";
import { Badge, Input, Select, buttonStyles } from "@/components/ui";
import { deleteCouponAction, saveCouponAction } from "@/app/actions/admin";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Discount codes</h1>

      <div className="mt-5 overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-ink-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Code</th>
              <th scope="col" className="px-4 py-3 font-semibold">Discount</th>
              <th scope="col" className="px-4 py-3 font-semibold">Minimum</th>
              <th scope="col" className="px-4 py-3 font-semibold">Used</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                  No discount codes yet.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-4 py-3 font-mono font-semibold text-ink-900">
                    {coupon.code}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {coupon.type === "PERCENT"
                      ? `${coupon.value}%`
                      : formatTZS(coupon.value)}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {coupon.minSubtotal > 0 ? formatTZS(coupon.minSubtotal) : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {coupon.usedCount}
                    {coupon.maxUses !== null ? ` / ${coupon.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={coupon.isActive ? "success" : "neutral"}>
                      {coupon.isActive ? "Active" : "Off"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteCouponAction}>
                      <input type="hidden" name="id" value={coupon.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-ink-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form
        action={saveCouponAction}
        className="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-5"
      >
        <h2 className="mb-1 font-bold text-ink-900">Add or update a code</h2>
        <p className="mb-4 text-sm text-ink-500">
          Entering an existing code updates it rather than creating a duplicate.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input name="code" placeholder="KARIBU10" className="uppercase" required />
          <Select name="type" defaultValue="PERCENT">
            <option value="PERCENT">Percentage off</option>
            <option value="FIXED">Fixed amount off (TSh)</option>
          </Select>
          <Input name="value" type="number" min={1} placeholder="Value" required />
          <Input
            name="minSubtotal"
            type="number"
            min={0}
            step={1000}
            placeholder="Minimum subtotal (TSh)"
          />
          <Input name="maxUses" type="number" min={0} placeholder="Max uses (optional)" />
        </div>

        <label className="mt-4 flex items-center gap-2.5 text-sm font-medium text-ink-800">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          Active
        </label>

        <button type="submit" className={buttonStyles("primary", "md", "mt-4")}>
          Save code
        </button>
      </form>
    </div>
  );
}
