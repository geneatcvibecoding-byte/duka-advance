import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { RegisterForm } from "@/components/AuthForms";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  return { title: getTranslator(resolveLocale(raw))("auth.registerTitle") };
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const [{ locale: raw }, { next }] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = await getCurrentUser();
  if (user) redirect(next ?? link(locale, "/account"));

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        {t("auth.registerTitle")}
      </h1>
      <p className="mt-1.5 text-ink-600">{t("auth.registerSubtitle")}</p>

      <div className="mt-7">
        <RegisterForm
          locale={locale}
          next={next}
          labels={{
            name: t("auth.name"),
            phone: t("auth.phone"),
            phoneHint: t("checkout.phoneHint"),
            email: t("checkout.email"),
            optional: t("common.optional"),
            password: t("auth.password"),
            confirmPassword: t("auth.confirmPassword"),
            submit: t("auth.registerCta"),
            showPassword: t("auth.showPassword"),
            hidePassword: t("auth.hidePassword"),
          }}
        />
      </div>

      <p className="mt-6 text-center text-sm text-ink-600">
        {t("auth.haveAccount")}{" "}
        <Link
          href={
            next
              ? `${link(locale, "/login")}?next=${encodeURIComponent(next)}`
              : link(locale, "/login")
          }
          className="font-semibold text-brand-700 hover:underline"
        >
          {t("auth.loginCta")}
        </Link>
      </p>
    </div>
  );
}
