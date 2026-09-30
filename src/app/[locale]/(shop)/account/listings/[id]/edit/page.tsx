import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSellerOwnedListing } from "@/lib/seller-dashboard";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { EditListingForm } from "@/components/EditListingForm";
import { buttonStyles } from "@/components/ui";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = (await getCurrentUser())!; // guarded by the account layout

  // Owner-scoped: asking for somebody else's listing is a 404, not a 403, so
  // the page does not confirm that the id exists.
  const listing = await getSellerOwnedListing(user.id, id);
  if (!listing) notFound();

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { id: true, nameEn: true, nameSw: true },
  });

  return (
    <div className="max-w-3xl">
      <Link
        href={link(locale, "/account/listings")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft size={15} aria-hidden />
        {t("seller.backToDashboard")}
      </Link>

      <h2 className="mt-3 text-lg font-bold text-ink-900">{t("seller.editListing")}</h2>

      <div className="mt-6">
        <EditListingForm
          locale={locale}
          listingId={listing.id}
          listing={{
            titleEn: listing.titleEn,
            titleSw: listing.titleSw,
            descEn: listing.descEn,
            descSw: listing.descSw,
            price: listing.price,
            condition: listing.condition,
            categoryId: listing.categoryId,
            images: listing.images.map((image) => image.url),
            sold: listing.status === "SOLD",
          }}
          categories={categories}
          labels={{
            titleEn: t("mkt.titleEn"),
            titleSw: t("mkt.titleSw"),
            descEn: t("mkt.descEn"),
            descSw: t("mkt.descSw"),
            price: t("mkt.price"),
            condition: t("mkt.condition"),
            category: t("nav.categories"),
            images: t("mkt.images"),
            submit: t("common.save"),
            soldNotice: t("seller.soldFrozen"),
            [`condition_NEW`]: t("mkt.condition.NEW"),
            [`condition_LIKE_NEW`]: t("mkt.condition.LIKE_NEW"),
            [`condition_GOOD`]: t("mkt.condition.GOOD"),
            [`condition_FAIR`]: t("mkt.condition.FAIR"),
            photoLimit: t("seller.photoLimit", { count: 6 }),
            uploadFailed: t("seller.uploadFailed"),
            dragPhotos: t("seller.dragPhotos"),
            chooseFiles: t("seller.chooseFiles"),
            uploading: t("seller.uploading"),
            removePhoto: t("seller.removePhoto"),
          }}
          imageHint={t("mkt.imageHint", { mb: 5, count: 6 })}
        />
      </div>

      <p className="mt-6 text-sm text-ink-500">
        <Link
          href={link(locale, `/marketplace/${listing.slug}`)}
          className={buttonStyles("ghost", "sm")}
        >
          {t("seller.view")}
        </Link>
      </p>
    </div>
  );
}
