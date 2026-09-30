import { formatTZS } from "@/lib/tz";

export type SalesPoint = { day: string; orders: number; net: number };

/**
 * A 14-day sales chart drawn with plain divs.
 *
 * No chart library: the dataset is 14 numbers, and a dependency here would cost
 * more than the twenty lines it saves. Bars are orders per day; the net figure
 * under each one is what the seller actually keeps.
 */
export function SalesChart({
  data,
  labels,
}: {
  data: SalesPoint[];
  labels: { orders: string; net: string; empty: string };
}) {
  const max = Math.max(1, ...data.map((point) => point.orders));
  const hasData = data.some((point) => point.orders > 0);
  const totalNet = data.reduce((sum, point) => sum + point.net, 0);

  if (!hasData) {
    return (
      <p className="px-4 py-10 text-center text-sm text-ink-500">{labels.empty}</p>
    );
  }

  return (
    <div className="p-4">
      <div className="flex h-32 items-end gap-1" role="img" aria-label={labels.orders}>
        {data.map((point) => {
          const heightPct = Math.max(3, Math.round((point.orders / max) * 100));
          return (
            <div
              key={point.day}
              className="group relative flex flex-1 flex-col items-center justify-end"
            >
              <div
                className="w-full rounded-t bg-brand-200 transition-colors group-hover:bg-brand-400"
                style={{ height: `${heightPct}%` }}
                title={`${point.day} · ${point.orders} ${labels.orders} · ${formatTZS(point.net)}`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-ink-500">
        <span>{data[0]?.day.slice(5)}</span>
        <span>
          {data.at(-1)?.day.slice(5)}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-200 pt-3 text-sm">
        <div>
          <dt className="text-ink-500">{labels.orders}</dt>
          <dd className="font-semibold text-ink-900">
            {data.reduce((sum, point) => sum + point.orders, 0)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-500">{labels.net}</dt>
          <dd className="font-semibold text-ink-900">{formatTZS(totalNet)}</dd>
        </div>
      </dl>
    </div>
  );
}
