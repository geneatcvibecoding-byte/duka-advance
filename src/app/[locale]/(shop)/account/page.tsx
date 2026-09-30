import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTranslator, resolveLocale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { ProfileForm } from "@/components/ProfileForm";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  // The layout already guarded this route, so a user is always present here.
  const user = (await getCurrentUser())!;

  const [orderCount, spent] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.aggregate({
      where: { userId: user.id, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-ink-200 p-4">
          <p className="text-sm text-ink-600">{t("account.orders")}</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{orderCount}</p>
        </div>
        <div className="rounded-xl border border-ink-200 p-4">
          <p className="text-sm text-ink-600">{t("checkout.total")}</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">
            {formatTZS(spent._sum.total ?? 0)}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-ink-900">{t("account.profile")}</h2>
        <ProfileForm
          locale={locale}
          defaults={{
            name: user.name,
            phone: user.phone,
            email: user.email ?? "",
          }}
          labels={{
            name: t("auth.name"),
            phone: t("auth.phone"),
            email: t("checkout.email"),
            optional: t("common.optional"),
            save: t("common.save"),
            saved: t("account.profileUpdated"),
          }}
        />
      </section>
    </div>
  );
}
