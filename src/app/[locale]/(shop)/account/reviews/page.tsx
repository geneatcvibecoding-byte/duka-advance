import { Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSellerRatingBook } from "@/lib/seller-dashboard";
import { formatDate, getTranslator, resolveLocale } from "@/lib/i18n";
import { Card, EmptyState } from "@/components/ui";

/** Every rating a seller has received, with the order it came from. */
function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={15}
          aria-hidden
          className={
            n <= value ? "fill-gold-400 text-gold-500" : "text-ink-300"
          }
        />
      ))}
    </span>
  );
}

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = (await getCurrentUser())!; // guarded by the account layout
  const ratings = await getSellerRatingBook(user.id);

  const average =
    ratings.length > 0
      ? ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink-900">{t("seller.ratingsTitle")}</h2>
          <p className="mt-1 text-sm text-ink-600">{t("seller.trustExplain")}</p>
        </div>
        {average ? (
          <div className="text-right">
            <p className="text-2xl font-bold text-ink-900">{average.toFixed(1)}</p>
            <Stars value={Math.round(average)} />
          </div>
        ) : null}
      </div>

      {ratings.length === 0 ? (
        <EmptyState
          icon={<Star size={40} aria-hidden />}
          title={t("seller.noRatings")}
          body={t("seller.noRating")}
        />
      ) : (
        <ul className="space-y-3">
          {ratings.map((rating) => (
            <Card key={rating.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars value={rating.rating} />
                <span className="text-xs text-ink-500">
                  {rating.order
                    ? t("seller.reviewedOn", { order: rating.order.orderNumber })
                    : ""}{" "}
                  · {formatDate(rating.createdAt, locale)}
                </span>
              </div>
              {rating.comment ? (
                <p className="mt-2 text-sm text-ink-700">{rating.comment}</p>
              ) : (
                <p className="mt-2 text-sm text-ink-400">{t("seller.noRating")}</p>
              )}
              <p className="mt-2 text-xs font-medium text-ink-500">
                {rating.rater.name}
              </p>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
