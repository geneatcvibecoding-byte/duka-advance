"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizePhone } from "@/lib/tz";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { PAYOUT_METHODS, type PayoutMethod } from "@/lib/seller-dashboard";

/**
 * Where a marketplace payout goes.
 *
 * Escrow release is an admin action that moves real money, so the destination
 * has to exist before an order can be paid out. The number is normalised to
 * +255XXXXXXXXX exactly like a login phone, and an admin reads it off the
 * order page at release time.
 */

export type PayoutState = { ok: true } | { ok: false; error: string } | null;
export type { PayoutMethod };

export async function savePayoutAccountAction(
  _prev: PayoutState,
  formData: FormData,
): Promise<PayoutState> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const t = getTranslator(locale);

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("auth.invalidCredentials") };

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { studentVerifiedAt: true },
  });
  if (!full?.studentVerifiedAt) return { ok: false, error: t("mkt.verifyFirst") };

  const method = String(formData.get("method") ?? "").toUpperCase();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const rawNumber = String(formData.get("number") ?? "").trim();

  if (!(PAYOUT_METHODS as readonly string[]).includes(method)) {
    return { ok: false, error: t("error.required") };
  }
  if (name.length < 2) return { ok: false, error: t("error.required") };

  // An empty number clears the account, which is how a seller opts out.
  const number = rawNumber === "" ? null : normalizePhone(rawNumber);
  if (rawNumber !== "" && !number) {
    return { ok: false, error: t("seller.payoutBadNumber") };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      payoutMethod: number ? method : null,
      payoutNumber: number,
      payoutName: number ? name : null,
    },
  });

  revalidatePath(link(locale, "/account/payouts"));
  revalidatePath(link(locale, "/account/dashboard"));
  return { ok: true };
}
