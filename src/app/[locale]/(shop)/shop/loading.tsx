/**
 * Skeleton for the catalogue. On a slow Tanzanian mobile connection the
 * difference between a blank screen and a visible grid shape is the difference
 * between waiting and leaving.
 */
export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="h-8 w-56 animate-pulse rounded bg-ink-100" />
      <div className="mt-2 h-4 w-28 animate-pulse rounded bg-ink-100" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="hidden h-96 animate-pulse rounded-xl bg-ink-100 lg:block" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-ink-200"
            >
              <div className="aspect-square animate-pulse bg-ink-100" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-full animate-pulse rounded bg-ink-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-ink-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
