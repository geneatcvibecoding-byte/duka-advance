import { Send } from "lucide-react";
import { sendOrderMessageAction } from "@/app/actions/order-message";
import { formatDateTime, type Locale } from "@/lib/i18n";
import { buttonStyles } from "@/components/ui";

export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: Date;
  senderId: string;
  senderName: string;
};

/**
 * The buyer/seller thread on an order, used to arrange the campus handover.
 * Server-rendered: posting is a plain form, so it works without JavaScript.
 */
export function OrderMessages({
  messages,
  currentUserId,
  orderId,
  locale,
  labels,
}: {
  messages: ThreadMessage[];
  currentUserId: string;
  orderId: string;
  locale: Locale;
  labels: {
    title: string;
    empty: string;
    placeholder: string;
    send: string;
  };
}) {
  return (
    <section className="rounded-xl border border-ink-200 bg-white">
      <div className="border-b border-ink-200 px-4 py-3">
        <h2 className="font-bold text-ink-900">{labels.title}</h2>
      </div>

      {messages.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-500">{labels.empty}</p>
      ) : (
        <ul className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <li key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "rounded-br-sm bg-brand-600 text-white"
                      : "rounded-bl-sm bg-ink-100 text-ink-900"
                  }`}
                >
                  {!mine ? (
                    <p className="mb-0.5 text-xs font-semibold opacity-70">
                      {message.senderName}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className={`mt-1 text-[11px] ${mine ? "text-brand-100" : "text-ink-500"}`}>
                    {formatDateTime(message.createdAt, locale)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form action={sendOrderMessageAction} className="flex gap-2 border-t border-ink-200 p-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="orderId" value={orderId} />
        <input
          name="body"
          maxLength={1000}
          required
          placeholder={labels.placeholder}
          className="field-input"
          aria-label={labels.placeholder}
        />
        <button type="submit" className={buttonStyles("primary", "md", "shrink-0")}>
          <Send size={16} aria-hidden />
          {labels.send}
        </button>
      </form>
    </section>
  );
}
