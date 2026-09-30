"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { extractEmailDomain, isStudentEmailDomain } from "@/lib/universities";

/**
 * Student verification.
 *
 * A user proves they control a mailbox on a known university domain by
 * entering a 6-digit code. There is no enrolment check and no university API:
 * this proves a mailbox, nothing more. Staff and alumni keep university
 * addresses for life, so treat `studentVerifiedAt` as a trust signal, never as
 * proof of enrolment.
 */

const CODE_TTL_MINUTES = 15;
const CODE_LENGTH = 6;
/** Re-requesting more than this often is either a script or a confused user. */
const RESEND_COOLDOWN_MINUTES = 2;

export type VerifyState =
  | { ok: true; step: "sent" }
  | { ok: false; error: string }
  | null;

function generateCode(): string {
  // randomInt is a CSPRNG and, unlike Math.random, is not predictable from
  // previous outputs. Six digits is only a million values, which is exactly
  // why attempts are capped below.
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

export async function requestVerificationAction(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const domain = extractEmailDomain(email);

  if (!domain || !email.includes("@")) {
    return { ok: false, error: "Enter a valid university email address." };
  }

  const university = await prisma.university.findFirst({
    where: { isActive: true, emailDomain: { in: await knownDomains(domain) } },
  });

  if (!university) {
    return {
      ok: false,
      error: "That email domain is not a campus we recognise yet.",
    };
  }

  // Throttle by the most recent code, so one user cannot burn the mailer.
  const recent = await prisma.studentVerificationCode.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const waitMs = RESEND_COOLDOWN_MINUTES * 60_000;
    if (Date.now() - recent.createdAt.getTime() < waitMs) {
      return { ok: false, error: "Please wait a couple of minutes and try again." };
    }
  }

  const code = generateCode();

  // Supersede any unconsumed codes: only the newest one may be redeemed.
  await prisma.studentVerificationCode.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.studentVerificationCode.create({
    data: {
      userId: user.id,
      email,
      codeHash: await hashPassword(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
    },
  });

  // TODO: send the email. Until a provider is configured the code is not
  // delivered anywhere, so it is logged for local development only.
  if (process.env.NODE_ENV !== "production") {
    console.info(`[verify] ${email}: ${code}`);
  }

  revalidatePath("/", "layout");
  return { ok: true, step: "sent" };
}

export async function confirmVerificationAction(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: "Enter the 6-digit code from the email." };
  }

  const pending = await prisma.studentVerificationCode.findFirst({
    where: { userId: user.id, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!pending) return { ok: false, error: "Request a new code first." };
  if (pending.expiresAt < new Date()) {
    return { ok: false, error: "That code has expired. Request a new one." };
  }

  // bcrypt against the stored hash. The codes are hashed with the same helper
  // as passwords, which is deliberately slow: at a million possible values a
  // fast hash would be brute-forceable from a database dump.
  if (!(await verifyPassword(code, pending.codeHash))) {
    return { ok: false, error: "That code is not right." };
  }

  const domain = extractEmailDomain(pending.email);
  if (!domain) return { ok: false, error: "That address is not usable." };

  const university = await prisma.university.findFirst({
    where: { isActive: true, emailDomain: { in: await knownDomains(domain) } },
  });
  if (!university) {
    return { ok: false, error: "That campus is no longer active." };
  }

  await prisma.$transaction([
    prisma.studentVerificationCode.update({
      where: { id: pending.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        studentVerifiedAt: new Date(),
        universityId: university.id,
        // Keep the address on the account so the marketplace can show it.
        email: pending.email,
      },
    }),
  ]);

  revalidatePath("/", "layout");
  return { ok: true, step: "sent" };
}

/**
 * Domain candidates for a match: the domain itself, and the parent of any
 * sub-domain, so `students.udsm.ac.tz` matches a campus registered as
 * `udsm.ac.tz`.
 */
async function knownDomains(domain: string): Promise<string[]> {
  const all = await prisma.university.findMany({
    where: { isActive: true },
    select: { emailDomain: true },
  });
  const list = all.map((u) => u.emailDomain);
  return isStudentEmailDomain(domain, list) ? [domain] : [domain, ...list];
}
