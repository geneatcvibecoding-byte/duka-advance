import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

/**
 * A seller's orders and earnings as a spreadsheet.
 *
 * Scoped to the signed-in seller in the query, like every other seller read.
 * The date is a plain ISO day: a seller reconciling against a mobile-money
 * statement is looking at a calendar day, not a timezone edge case.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Not signed in.", { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      orderNumber: true,
      createdAt: true,
      customerName: true,
      customerPhone: true,
      escrowStatus: true,
      total: true,
      platformFee: true,
      payoutRef: true,
      items: { select: { nameEn: true, quantity: true } },
    },
  });

  const rows = orders.map((order) => [
    order.orderNumber,
    order.createdAt.toISOString().slice(0, 10),
    order.items.map((item) => `${item.nameEn} x${item.quantity}`).join("; "),
    order.customerName,
    order.customerPhone,
    order.escrowStatus,
    order.total,
    order.platformFee,
    order.total - order.platformFee,
    order.payoutRef ?? "",
  ]);

  const csv = toCsv(
    [
      "Order",
      "Date",
      "Item",
      "Buyer",
      "Buyer phone",
      "Escrow status",
      "Gross (TSh)",
      "Platform fee (TSh)",
      "Net (TSh)",
      "Payout reference",
    ],
    rows,
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="duka-seller-orders.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
