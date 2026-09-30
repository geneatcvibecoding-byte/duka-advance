import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { link, resolveLocale } from "@/lib/i18n";
import { LoginForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Admin sign in" };

/**
 * Sits outside the (panel) group so the admin guard cannot redirect to it in
 * a loop.
 */
export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect(link(locale, "/admin"));

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck size={20} aria-hidden />
          </span>
          <div>
            <h1 className="font-bold text-ink-900">Admin sign in</h1>
            <p className="text-sm text-ink-500">Shop staff only</p>
          </div>
        </div>

        <LoginForm
          locale={locale}
          next={link(locale, "/admin")}
          demoType="admin"
          labels={{
            phone: "Phone number",
            password: "Password",
            submit: "Sign in",
            showPassword: "Show password",
            hidePassword: "Hide password",
          }}
        />

        <p className="mt-6 text-center text-sm text-ink-500">
          <Link href={link(locale, "/")} className="hover:text-brand-700">
            ← Back to the shop
          </Link>
        </p>
      </div>
    </div>
  );
}
