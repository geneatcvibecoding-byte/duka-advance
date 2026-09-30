import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, link, resolveLocale } from "@/lib/i18n";
import { Badge, buttonStyles } from "@/components/ui";
import { approveReviewAction } from "@/app/actions/admin";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const reviews = await prisma.review.findMany({
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true } },
      product: { select: { nameEn: true, slug: true } },
    },
    take: 100,
  });

  const pending = reviews.filter((r) => !r.isApproved).length;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Reviews</h1>
      <p className="mt-1.5 text-ink-600">
        {pending > 0
          ? `${pending} review${pending === 1 ? "" : "s"} waiting for approval.`
          : "Nothing waiting for approval."}
      </p>

      <ul className="mt-5 space-y-3">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="rounded-xl border border-ink-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  href={link(locale, `/product/${review.product.slug}`)}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {review.product.nameEn}
                </Link>
                <p className="text-xs text-ink-500">
                  {review.user.name} · {formatDate(review.createdAt, locale)} ·{" "}
                  {review.rating}/5
                </p>
              </div>
              <Badge tone={review.isApproved ? "success" : "warning"}>
                {review.isApproved ? "Published" : "Pending"}
              </Badge>
            </div>

            <p className="mt-2 leading-relaxed text-ink-700">{review.comment}</p>

            <div className="mt-3 flex gap-2">
              {!review.isApproved ? (
                <form action={approveReviewAction}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <input type="hidden" name="approve" value="1" />
                  <button type="submit" className={buttonStyles("primary", "sm")}>
                    Approve
                  </button>
                </form>
              ) : null}

              <form action={approveReviewAction}>
                <input type="hidden" name="reviewId" value={review.id} />
                <input type="hidden" name="approve" value="0" />
                <button
                  type="submit"
                  className={buttonStyles("ghost", "sm", "text-red-600 hover:bg-red-50")}
                >
                  Delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
