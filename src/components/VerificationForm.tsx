"use client";

import { useActionState } from "react";
import {
  confirmVerificationAction,
  requestVerificationAction,
  type VerifyState,
} from "@/app/actions/verify";
import { Alert, Button, Field, Input } from "@/components/ui";
import type { Locale } from "@/lib/i18n";

/**
 * Two-step student verification: request a code to the university mailbox,
 * then redeem it. Both steps are plain Server Actions so the form works
 * without JavaScript.
 */
export function VerificationForm({
  locale,
  verifiedEmail,
  labels,
}: {
  locale: Locale;
  verifiedEmail: string | null;
  labels: {
    email: string;
    emailHint: string;
    send: string;
    code: string;
    codeHint: string;
    confirm: string;
    sentHeading: string;
    sentBody: string;
    already: string;
  };
}) {
  const [sentState, requestAction, requesting] = useActionState<
    VerifyState,
    FormData
  >(requestVerificationAction, null);
  const [confirmState, confirmAction, confirming] = useActionState<
    VerifyState,
    FormData
  >(confirmVerificationAction, null);

  const justSent = sentState?.ok === true && sentState.step === "sent";

  return (
    <div className="space-y-8">
      {verifiedEmail ? (
        <Alert tone="success">
          {labels.already} <strong>{verifiedEmail}</strong>
        </Alert>
      ) : null}

      {/* Step 1 — request the code */}
      <section className="rounded-xl border border-ink-200 p-5">
        <h2 className="font-bold text-ink-900">1. {labels.email}</h2>
        <form action={requestAction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <Field
            label={labels.email}
            hint={labels.emailHint}
            htmlFor="verify-email"
            required
          >
            <Input
              id="verify-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="yourname@udsm.ac.tz"
              required
            />
          </Field>
          {sentState?.ok === false ? (
            <Alert tone="danger">{sentState.error}</Alert>
          ) : null}
          <Button type="submit" disabled={requesting} className="self-start">
            {requesting ? "…" : labels.send}
          </Button>
        </form>
      </section>

      {/* Step 2 — redeem */}
      <section className="rounded-xl border border-ink-200 p-5">
        <h2 className="font-bold text-ink-900">2. {labels.code}</h2>
        <form action={confirmAction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <Field label={labels.code} hint={labels.codeHint} htmlFor="verify-code">
            <Input
              id="verify-code"
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="123456"
              required
            />
          </Field>
          {confirmState?.ok === false ? (
            <Alert tone="danger">{confirmState.error}</Alert>
          ) : null}
          <Button type="submit" disabled={confirming} className="self-start">
            {confirming ? "…" : labels.confirm}
          </Button>
        </form>
      </section>

      {justSent ? (
        <Alert tone="info">
          {labels.sentHeading} — {labels.sentBody}
        </Alert>
      ) : null}
    </div>
  );
}