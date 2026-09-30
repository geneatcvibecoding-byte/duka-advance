"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import {
  submitPaymentRefAction,
  type PaymentRefState,
} from "@/app/actions/checkout";
import { Alert, Field, Input, buttonStyles } from "@/components/ui";
import type { Locale } from "@/lib/i18n";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonStyles("primary", "md")}>
      {pending ? <Loader2 size={17} aria-hidden className="animate-spin" /> : null}
      {label}
    </button>
  );
}

export function PaymentRefForm({
  locale,
  orderNumber,
  currentRef,
  labels,
}: {
  locale: Locale;
  orderNumber: string;
  currentRef: string | null;
  labels: {
    reference: string;
    hint: string;
    submit: string;
    submitted: string;
  };
}) {
  const [state, formAction] = useActionState<PaymentRefState, FormData>(
    submitPaymentRefAction,
    null,
  );

  if (state?.ok) return <Alert tone="success">{labels.submitted}</Alert>;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="orderNumber" value={orderNumber} />

      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <Field label={labels.reference} htmlFor="paymentRef" hint={labels.hint} required>
        <Input
          id="paymentRef"
          name="paymentRef"
          defaultValue={currentRef ?? ""}
          placeholder="QJ12AB34CD"
          className="uppercase"
          required
        />
      </Field>

      <Submit label={labels.submit} />
    </form>
  );
}
