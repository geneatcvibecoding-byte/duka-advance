import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications } from "@/lib/seller-dashboard";
import {
  formatDateTime,
  getTranslator,
  link,
  resolveLocale,
  type TranslationKey,
} from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { buttonStyles, Card, EmptyState } from "@/components/ui";
import { markNotificationsReadAction } from "@/app/actions/notification";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const user = (await getCurrentUser())!; // guarded by the account layout
  const notifications = await getNotifications(user.id);
  const hasUnread = notifications.some((notification) => !notification.isRead);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
          <Bell size={18} aria-hidden />
          {t("seller.notifications")}
        </h2>

        {hasUnread ? (
          <form action={markNotificationsReadAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="all" value="1" />
            <button className={buttonStyles("secondary", "sm")}>
              {t("seller.markAllRead")}
            </button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={36} aria-hidden />}
          title={t("seller.noNotifications")}
          body={t("seller.noNotificationsBody")}
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => {
            // Hrefs are stored without a locale so a link keeps working when the
            // reader switches language; the order number is surfaced for the two
            // messages that name one.
            const orderNumber = notification.href?.split("/").filter(Boolean).pop() ?? "";
            // The message is translated at read time, so any money in it travels
            // with the row rather than being baked into the string on write.
            const body = t(`seller.notify${notification.type}` as TranslationKey, {
              amount: notification.amount == null ? "" : formatTZS(notification.amount),
              order: orderNumber,
            });

            const inner = (
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    notification.isRead ? "bg-ink-200" : "bg-brand-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-800">{body}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {formatDateTime(notification.createdAt, locale)}
                  </p>
                </div>
              </div>
            );

            const card = (
              <Card
                className={
                  notification.isRead
                    ? "p-3.5 hover:bg-ink-50"
                    : "border-brand-200 bg-brand-50/50 p-3.5 hover:bg-brand-50"
                }
              >
                {inner}
              </Card>
            );

            return (
              <li key={notification.id}>
                {notification.href ? (
                  <div className="flex items-start gap-2">
                    <Link href={link(locale, notification.href)} className="min-w-0 flex-1">
                      {card}
                    </Link>
                    {/* Reading a notification is the act that marks it read, so
                        the unread badge clears without a "mark all" ritual. */}
                    {!notification.isRead ? (
                      <form action={markNotificationsReadAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="notificationId" value={notification.id} />
                        <button
                          className={buttonStyles("secondary", "sm")}
                          title={t("seller.markRead")}
                        >
                          <Check size={15} aria-hidden />
                          <span className="sr-only">
                            {t("seller.markRead")} {orderNumber}
                          </span>
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : (
                  card
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
