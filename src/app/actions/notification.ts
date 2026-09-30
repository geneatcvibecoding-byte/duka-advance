"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { link, resolveLocale } from "@/lib/i18n";

/** Mark notifications read. Scoped to the signed-in user in the query. */
export async function markNotificationsReadAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const all = String(formData.get("all") ?? "");

  const user = await getCurrentUser();
  if (!user) return;

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
  } else {
    const ids = formData.getAll("notificationId").map(String).filter(Boolean);
    if (ids.length === 0) return;
    await prisma.notification.updateMany({
      where: { userId: user.id, id: { in: ids } },
      data: { isRead: true },
    });
  }

  revalidatePath(link(locale, "/account/notifications"));
  revalidatePath("/", "layout");
}
