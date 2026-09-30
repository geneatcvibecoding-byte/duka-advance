import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Notifications.
 *
 * There is no mail provider wired up yet, exactly as with the verification
 * code. The row is the source of truth the UI reads; the console line stands in
 * for an email and is the single place a provider would be dropped in later.
 */

export type NotificationType =
  | "LISTING_SOLD"
  | "LISTING_FEATURED"
  | "ESCROW_FUNDED"
  | "ESCROW_DELIVERED"
  | "ESCROW_RELEASED"
  | "ESCROW_REFUNDED"
  | "ESCROW_DISPUTED"
  | "OFFER_RECEIVED"
  | "OFFER_ACCEPTED"
  | "OFFER_DECLINED"
  | "ORDER_MESSAGE";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * `amount` is the money named in the message, in whole shillings. Notification
 * text is translated at read time, so the number has to travel with the row
 * rather than be interpolated when the message is written.
 */
export async function notify(
  db: Db,
  userId: string,
  type: NotificationType,
  href?: string,
  amount?: number,
) {
  const row = await db.notification.create({
    data: { userId, type, href, amount },
  });

  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[notify] user=${userId} type=${type} href=${href ?? "-"} amount=${amount ?? "-"}`,
    );
  }

  return row;
}

/** Fan a notification out to several recipients in one insert. */
export async function notifyMany(
  db: Db,
  userIds: string[],
  type: NotificationType,
  href?: string,
  amount?: number,
) {
  if (userIds.length === 0) return;
  await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, href, amount })),
  });
  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[notify] ${userIds.length} users type=${type} href=${href ?? "-"} amount=${amount ?? "-"}`,
    );
  }
}
