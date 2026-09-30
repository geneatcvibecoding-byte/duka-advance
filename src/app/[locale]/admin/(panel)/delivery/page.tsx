import { prisma } from "@/lib/db";
import { REGION_NAMES, formatTZS } from "@/lib/tz";
import { Input, Select, buttonStyles } from "@/components/ui";
import { saveDeliveryZoneAction } from "@/app/actions/admin";

export const metadata = { title: "Delivery" };

export default async function AdminDeliveryPage() {
  const zones = await prisma.deliveryZone.findMany({ orderBy: { position: "asc" } });
  const covered = new Set(zones.map((z) => z.region));
  const missing = REGION_NAMES.filter((name) => !covered.has(name));

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Delivery zones</h1>
      <p className="mt-1.5 text-ink-600">
        These fees are what checkout charges and what the public delivery page shows.
        Unpriced regions fall back to the most expensive zone.
      </p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-ink-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Region</th>
              <th scope="col" className="px-4 py-3 font-semibold">Fee (TSh)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Days</th>
              <th scope="col" className="px-4 py-3 font-semibold">Active</th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {zones.map((zone) => (
              <tr key={zone.id}>
                <td className="px-4 py-2 font-medium text-ink-900">
                  {zone.region}
                  <span className="ml-2 text-xs font-normal text-ink-500">
                    {formatTZS(zone.fee)}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <form
                    action={saveDeliveryZoneAction}
                    id={`zone-${zone.id}`}
                    className="contents"
                  >
                    <input type="hidden" name="region" value={zone.region} />
                    <Input
                      name="fee"
                      type="number"
                      min={0}
                      step={500}
                      defaultValue={zone.fee}
                      className="w-28"
                    />
                  </form>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <Input
                      form={`zone-${zone.id}`}
                      name="etaMinDays"
                      type="number"
                      min={1}
                      defaultValue={zone.etaMinDays}
                      className="w-16"
                    />
                    <span className="text-ink-400">–</span>
                    <Input
                      form={`zone-${zone.id}`}
                      name="etaMaxDays"
                      type="number"
                      min={1}
                      defaultValue={zone.etaMaxDays}
                      className="w-16"
                    />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <input
                    form={`zone-${zone.id}`}
                    type="checkbox"
                    name="isActive"
                    defaultChecked={zone.isActive}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    form={`zone-${zone.id}`}
                    type="submit"
                    className={buttonStyles("secondary", "sm")}
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missing.length > 0 ? (
        <form
          action={saveDeliveryZoneAction}
          className="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-5"
        >
          <h2 className="mb-4 font-bold text-ink-900">Add a region</h2>
          <div className="flex flex-wrap items-end gap-3">
            <Select name="region" className="w-56" required>
              {missing.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <Input name="fee" type="number" min={0} step={500} placeholder="Fee" className="w-32" required />
            <Input name="etaMinDays" type="number" min={1} defaultValue={2} className="w-20" />
            <Input name="etaMaxDays" type="number" min={1} defaultValue={5} className="w-20" />
            <label className="flex items-center gap-2 text-sm font-medium text-ink-800">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              Active
            </label>
            <button type="submit" className={buttonStyles("primary", "md")}>
              Add
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-5 text-sm text-ink-500">
          All 31 regions are priced.
        </p>
      )}
    </div>
  );
}
