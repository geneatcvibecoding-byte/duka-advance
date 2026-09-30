"use client";

import { useActionState } from "react";
import { HandCoins } from "lucide-react";
import { makeOfferAction, type OfferState } from "@/app/actions/offer";
import { Field, Input, buttonStyles } from "@/components/ui";

/** A buyer proposes a price below the asking price. */
export function OfferForm({
  listingId,
  locale,
  labels,
}: {
  listingId: string;
  locale: string;
  labels: {
    title: string;
    hint: string;
    amount: string;
    message: string;
    messageOptional: string;
    submit: string;
    pending: string;
    sent: string;
  };
}) {
  const [state, action, pending] = useActionState<OfferState, FormData>(
    makeOfferAction,
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="listingId" value={listingId} />

      <Field label={labels.amount} hint={labels.hint} htmlFor="offer-amount" required>
        <Input
          id="offer-amount"
          name="amount"
          type="number"
          inputMode="numeric"
          min={1000}
          step={500}
          required
          placeholder="40000"
        />
      </Field>

      <Field label={labels.message} htmlFor="offer-message" hint={labels.messageOptional}>
        <Input id="offer-message" name="message" maxLength={500} />
      </Field>

      {state && !state.ok ? <p className="field-error">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-brand-700">{labels.sent}</p> : null}

      <button type="submit" className={buttonStyles("primary", "md")} disabled={pending}>
        <HandCoins size={18} aria-hidden />
        {pending ? labels.pending : labels.submit}
      </button>
    </form>
  );
}
