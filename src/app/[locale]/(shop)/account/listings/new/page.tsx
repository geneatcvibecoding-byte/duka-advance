import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { ListingForm } from "@/components/ListingForm";
import { Alert } from "@/components/ui";

export default async function NewListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = (await getCurrentUser())!; // guarded by the account layout

  // The create action re-checks verification in the transaction, but reaching
  // the form when unverified would be a broken screen, so check here too.
  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { studentVerifiedAt: true },
  });
  if (!full?.studentVerifiedAt) redirect(link(locale, "/account/verify"));

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { id: true, nameEn: true, nameSw: true },
  });

  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-bold text-ink-900">{t("mkt.sell")}</h2>
      <p className="mt-1 text-sm text-ink-600">{t("mkt.tagline")}</p>

      <Alert tone="info" className="mt-4">
        {t("mkt.meetOnCampus")} — {t("mkt.meetOnCampusBody")}
      </Alert>

      <div className="mt-6">
        <ListingForm
          locale={locale}
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
            submit: t("mkt.publish"),
            [`condition_NEW`]: t("mkt.condition.NEW"),
            [`condition_LIKE_NEW`]: t("mkt.condition.LIKE_NEW"),
            [`condition_GOOD`]: t("mkt.condition.GOOD"),
            [`condition_FAIR`]: t("mkt.condition.FAIR"),
          }}
          imageHint={t("mkt.imageHint", { mb: 5, count: 6 })}
        />
      </div>
    </div>
  );
}