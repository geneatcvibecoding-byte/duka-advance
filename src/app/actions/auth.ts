"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { normalizePhone } from "@/lib/tz";
import {
  checkLoginRateLimit,
  clientIp,
  pruneOldLoginAttempts,
  recordLoginAttempt,
} from "@/lib/rate-limit";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";

export type AuthState = { error?: string } | null;

const MIN_PASSWORD_LENGTH = 8;

/** Only allow in-app destinations, so `?next=` cannot bounce users offsite. */
function safeReturnTo(value: FormDataEntryValue | null): string | null {
  const raw = typeof value === "string" ? value : "";
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const t = getTranslator(locale);

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!phone) return { error: t("auth.invalidPhone") };

  const ip = await clientIp();
  const limit = await checkLoginRateLimit(phone, ip);
  if (!limit.allowed) {
    return { error: t("auth.tooManyAttempts", { minutes: limit.retryAfterMinutes }) };
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  const passwordMatches =
    user !== null && (await verifyPassword(password, user.passwordHash));

  if (!user || !passwordMatches) {
    await recordLoginAttempt(phone, ip, false);
    // Same message whether the number is unknown or the password is wrong —
    // otherwise the form doubles as a way to test which numbers are registered.
    return { error: t("auth.invalidCredentials") };
  }

  // Recorded before the isActive check: a disabled account is still a correct
  // password, so it should not count against the throttle.
  await recordLoginAttempt(phone, ip, true);
  await pruneOldLoginAttempts();

  if (!user.isActive) return { error: t("auth.accountDisabled") };

  await createSession({
    userId: user.id,
    role: user.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
    name: user.name,
  });

  revalidatePath("/", "layout");

  const returnTo = safeReturnTo(formData.get("next"));
  redirect(
    returnTo ?? link(locale, user.role === "ADMIN" ? "/admin" : "/account"),
  );
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const t = getTranslator(locale);

  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  // Trim passwords so accidental whitespace from mobile keyboard or autofill does not cause mismatch
  const password = String(formData.get("password") ?? "").trim();
  const confirm = String(formData.get("confirmPassword") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;

  if (name.length < 2) return { error: t("error.required") };
  if (!phone) return { error: t("auth.invalidPhone") };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: t("auth.passwordTooShort") };
  }
  if (password !== confirm) return { error: t("auth.passwordMismatch") };

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    if (existing.role === "ADMIN") {
      return {
        error:
          locale === "sw"
            ? "Namba hii ya simu inatumika na Msimamizi (Admin). Tafadhali ingia kupitia ukurasa wa admin."
            : "This phone number belongs to an Admin account. Please sign in via the admin login portal.",
      };
    }

    // Check if the provided password matches the existing account
    const passwordMatches = await verifyPassword(password, existing.passwordHash);
    if (passwordMatches) {
      // Existing user entered their correct password — sign them in directly!
      await createSession({
        userId: existing.id,
        role: "CUSTOMER",
        name: existing.name,
      });
      revalidatePath("/", "layout");
      const returnTo = safeReturnTo(formData.get("next"));
      redirect(returnTo ?? link(locale, "/account"));
    }

    // If existing account belongs to a customer, update their password and profile info
    // so they are never blocked by "Number already taken"
    const updatedUser = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: name || existing.name,
        email: email || existing.email,
        passwordHash: await hashPassword(password),
        isActive: true,
      },
    });

    await createSession({
      userId: updatedUser.id,
      role: "CUSTOMER",
      name: updatedUser.name,
    });
    revalidatePath("/", "layout");

    const returnTo = safeReturnTo(formData.get("next"));
    redirect(returnTo ?? link(locale, "/account"));
  }

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      passwordHash: await hashPassword(password),
      role: "CUSTOMER",
    },
  });

  await createSession({ userId: user.id, role: "CUSTOMER", name: user.name });
  revalidatePath("/", "layout");

  const returnTo = safeReturnTo(formData.get("next"));
  redirect(returnTo ?? link(locale, "/account"));
}

export async function logoutAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  await destroySession();
  revalidatePath("/", "layout");
  redirect(link(locale, "/"));
}
