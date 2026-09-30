import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Sign-in throttling.
 *
 * Two limits, because they stop different attacks:
 *   - per phone number: someone guessing one account's password
 *   - per IP address:   someone spraying one common password across many
 *                       numbers, which the per-phone limit would never see
 *
 * Tanzanian mobile numbers are a small, guessable space (07XXXXXXXX), so an
 * unthrottled login form is genuinely enumerable.
 */

const WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_PHONE = 5;
const MAX_FAILURES_PER_IP = 20;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMinutes: number };

/** Best-effort client IP. Vercel sets x-forwarded-for; the first entry is the client. */
export async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return store.get("x-real-ip") ?? "unknown";
}

function windowStart(): Date {
  return new Date(Date.now() - WINDOW_MINUTES * 60_000);
}

export async function checkLoginRateLimit(
  identifier: string,
  ip: string,
): Promise<RateLimitResult> {
  const since = windowStart();

  const [phoneFailures, ipFailures] = await Promise.all([
    prisma.loginAttempt.count({
      where: { identifier, success: false, createdAt: { gte: since } },
    }),
    prisma.loginAttempt.count({
      where: { ip, success: false, createdAt: { gte: since } },
    }),
  ]);

  if (phoneFailures >= MAX_FAILURES_PER_PHONE || ipFailures >= MAX_FAILURES_PER_IP) {
    // Report the time left on the oldest attempt still inside the window,
    // so the wait shrinks as attempts age out rather than resetting.
    const oldest = await prisma.loginAttempt.findFirst({
      where: {
        success: false,
        createdAt: { gte: since },
        OR: [{ identifier }, { ip }],
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    const elapsedMs = oldest ? Date.now() - oldest.createdAt.getTime() : 0;
    const remainingMs = Math.max(0, WINDOW_MINUTES * 60_000 - elapsedMs);

    return {
      allowed: false,
      retryAfterMinutes: Math.max(1, Math.ceil(remainingMs / 60_000)),
    };
  }

  return { allowed: true };
}

export async function recordLoginAttempt(
  identifier: string,
  ip: string,
  success: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({ data: { identifier, ip, success } });

  // A correct password clears the account's failure history, so a customer who
  // fumbled their password four times is not locked out on their next visit.
  if (success) {
    await prisma.loginAttempt.deleteMany({
      where: { identifier, success: false },
    });
  }
}

/**
 * Housekeeping. Called opportunistically after a successful sign-in so the
 * table cannot grow without bound; there is no cron in phase 1.
 */
export async function pruneOldLoginAttempts(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60_000);
  await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
}
