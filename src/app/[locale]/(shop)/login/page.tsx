import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { LoginForm } from "@/components/AuthForms";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  return { title: getTranslator(resolveLocale(raw))("auth.loginTitle") };
}

export default async function LoginPage({ params, searchParams }: Props) {
  const [{ locale: raw }, { next }] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  // Nothing to sign in to if they already are.
  const user = await getCurrentUser();
  if (user) redirect(next ?? link(locale, "/account"));

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        {t("auth.loginTitle")}
      </h1>
      <p className="mt-1.5 text-ink-600">{t("auth.loginSubtitle")}</p>

      <div className="mt-7">
        <LoginForm
          locale={locale}
          next={next}
          demoType="customer"
          labels={{
            phone: t("auth.phone"),
            password: t("auth.password"),
            submit: t("auth.loginCta"),
            showPassword: t("auth.showPassword"),
            hidePassword: t("auth.hidePassword"),
          }}
        />
      </div>

      <p className="mt-6 text-center text-sm text-ink-600">
        {t("auth.noAccount")}{" "}
        <Link
          href={
            next
              ? `${link(locale, "/register")}?next=${encodeURIComponent(next)}`
              : link(locale, "/register")
          }
          className="font-semibold text-brand-700 hover:underline"
        >
          {t("auth.registerCta")}
        </Link>
      </p>
    </div>
  );
}
