"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { savePayoutAccountAction, type PayoutState } from "@/app/actions/seller";
import { Field, Input, Select, buttonStyles } from "@/components/ui";

/** Where escrow payouts are sent. Empty number clears the account. */
export function PayoutAccountForm({
  current,
  locale,
  methods,
  labels,
}: {
  current:
    | { method?: string | null; number?: string | null; name?: string | null; payoutMethod?: string | null; payoutNumber?: string | null; payoutName?: string | null }
    | null;
  locale: string;
  methods: { value: string; label: string }[];
  labels: {
    method: string;
    number: string;
    numberHint: string;
    name: string;
    submit: string;
    pending: string;
    saved: string;
  };
}) {
  const [state, action, pending] = useActionState<PayoutState, FormData>(
    savePayoutAccountAction,
    null,
  );

  const initialMethod = current?.method ?? current?.payoutMethod ?? "MPESA";
  const initialNumber = current?.number ?? current?.payoutNumber ?? "";
  const initialName = current?.name ?? current?.payoutName ?? "";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <Field label={labels.method} htmlFor="payout-method" required>
        <Select id="payout-method" name="method" defaultValue={initialMethod}>
          {methods.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={labels.number}
        hint={labels.numberHint}
        htmlFor="payout-number"
        required
      >
        <Input
          id="payout-number"
          name="number"
          type="tel"
          inputMode="tel"
          defaultValue={initialNumber}
          placeholder="0712 345 678"
        />
      </Field>

      <Field label={labels.name} htmlFor="payout-name" required>
        <Input
          id="payout-name"
          name="name"
          defaultValue={initialName}
          placeholder="Amina Juma"
          maxLength={80}
        />
      </Field>

      {state && !state.ok ? <p className="field-error">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-brand-700">{labels.saved}</p> : null}

      <button type="submit" className={buttonStyles("primary", "md")} disabled={pending}>
        <Save size={18} aria-hidden />
        {pending ? labels.pending : labels.submit}
      </button>
    </form>
  );
}
