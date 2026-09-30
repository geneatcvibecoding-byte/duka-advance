import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUTO_RELEASE_DAYS, canTransition } from "@/lib/escrow";
import { notifyMany } from "@/lib/notify";

/**
 * Auto-release delivered orders whose buyer never confirmed.
 *
 * The escrow rules in `lib/escrow.ts` remain the authority: this route asks
 * `canTransition` with the ADMIN actor before writing anything, so it can only
 * make moves an admin could have made by hand. The payout still happens by
 * mobile money — this only settles the order record and tells the seller to
 * expect their money.
 *
 * Protect it with CRON_SECRET (a Bearer token) in any deployment where the URL
 * could be guessed.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set on this server." },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const deadline = new Date(Date.now() - AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000);

  const stale = await prisma.order.findMany({
    where: {
      escrowStatus: "DELIVERED",
      deliveredAt: { lt: deadline },
      // A marketplace order always has a seller, but the column is nullable
      // because shop orders do not, so be explicit rather than assert.
      sellerId: { not: null },
    },
    select: { id: true, orderNumber: true, sellerId: true, escrowStatus: true },
  });

  const released: string[] = [];
  const skipped: { orderNumber: string; reason: string }[] = [];

  for (const order of stale) {
    if (!order.sellerId) continue;
    const check = canTransition(order.escrowStatus, "RELEASED", "ADMIN");
    if (!check.ok) {
      skipped.push({ orderNumber: order.orderNumber, reason: check.reason });
      continue;
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { escrowStatus: "RELEASED", status: "DELIVERED", releasedAt: new Date() },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          status: "CONFIRMED",
          note: `Auto-released after ${AUTO_RELEASE_DAYS} days without buyer confirmation.`,
          actor: "auto-release",
        },
      }),
    ]);

    await notifyMany(prisma, [order.sellerId], "ESCROW_RELEASED", `/order/${order.orderNumber}`);

    released.push(order.orderNumber);
  }

  return NextResponse.json({ ok: true, released, skipped });
}

export const GET = POST;
