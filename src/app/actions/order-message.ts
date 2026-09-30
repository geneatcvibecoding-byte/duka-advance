"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { link, resolveLocale } from "@/lib/i18n";

/**
 * Buyer <-> seller messages on an order. Arranging a campus handover needs
 * somewhere to say "I am at the library at 2". Only the two people on the
 * order can read or write the thread.
 */

const MAX_BODY = 1000;

export async function sendOrderMessageAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const orderId = String(formData.get("orderId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, MAX_BODY);

  const user = await getCurrentUser();
  if (!user || !orderId || body.length === 0) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, userId: true, sellerId: true },
  });
  if (!order) return;

  // The authorisation check: exactly the buyer or the seller may post.
  const isBuyer = order.userId === user.id;
  const isSeller = order.sellerId === user.id;
  if (!isBuyer && !isSeller) return;

  await prisma.orderMessage.create({
    data: { orderId: order.id, senderId: user.id, body },
  });

  const recipientId = isBuyer ? order.sellerId : order.userId;
  if (recipientId && recipientId !== user.id) {
    await notify(prisma, recipientId, "ORDER_MESSAGE", `/order/${order.orderNumber}`);
  }

  revalidatePath(link(locale, `/order/${order.orderNumber}`));
}
