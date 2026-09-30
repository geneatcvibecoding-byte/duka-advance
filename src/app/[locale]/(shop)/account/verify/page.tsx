import { GraduationCap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { VerificationForm } from "@/components/VerificationForm";
import { Badge } from "@/components/ui";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = await getCurrentUser();
  if (!user) return null; // the account layout guards this route

  const university = user.studentVerifiedAt
    ? await prisma.university.findUnique({
        where: { id: user.universityId ?? "" },
        select: { nameEn: true, nameSw: true, emailDomain: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-white">
          <GraduationCap size={24} aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {t("mkt.verify")}
          </h1>
          <p className="text-ink-600">{t("mkt.verifyFirst")}</p>
        </div>
      </div>

      {university ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <ShieldCheck size={20} aria-hidden className="text-brand-700" />
          <div className="text-sm text-brand-900">
            <strong>{t("mkt.verified")}</strong> — {t("mkt.yourCampus")}:{" "}
            <strong>{university.nameEn}</strong>
          </div>
          <Badge tone="success" className="ml-auto">
            {t("mkt.verified")}
          </Badge>
        </div>
      ) : null}

      <div className="mt-6">
        <VerificationForm
          locale={locale}
          verifiedEmail={user.email?.toLowerCase() ?? null}
          labels={{
            email: t("auth.email"),
            emailHint: t("auth.emailHint"),
            send: t("auth.sendCode"),
            code: t("auth.verificationCode"),
            codeHint: t("auth.codeHint"),
            confirm: t("auth.confirmCode"),
            sentHeading: t("auth.codeSent"),
            sentBody: t("auth.codeSentBody"),
            already: t("auth.alreadyVerified"),
          }}
        />
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        <Link href={link(locale, "/marketplace")} className="underline">
          {t("mkt.browse")}
        </Link>
      </p>
    </div>
  );
}