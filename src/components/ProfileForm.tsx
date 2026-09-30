"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { updateProfileAction, type AccountState } from "@/app/actions/account";
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

export function ProfileForm({
  locale,
  defaults,
  labels,
}: {
  locale: Locale;
  defaults: { name: string; phone: string; email: string };
  labels: {
    name: string;
    phone: string;
    email: string;
    optional: string;
    save: string;
    saved: string;
  };
}) {
  const [state, formAction] = useActionState<AccountState, FormData>(
    updateProfileAction,
    null,
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <input type="hidden" name="locale" value={locale} />

      {state?.ok ? <Alert tone="success">{labels.saved}</Alert> : null}
      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <Field label={labels.name} htmlFor="name" required>
        <Input id="name" name="name" defaultValue={defaults.name} required />
      </Field>

      <Field label={labels.phone} htmlFor="phone" required>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={defaults.phone}
          required
        />
      </Field>

      <Field label={`${labels.email} (${labels.optional})`} htmlFor="email">
        <Input id="email" name="email" type="email" defaultValue={defaults.email} />
      </Field>

      <Submit label={labels.save} />
    </form>
  );
}
