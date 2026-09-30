"use client";

import { useActionState } from "react";
import {
  disputeEscrowAction,
  markDeliveredAction,
  rateSellerAction,
  releaseEscrowAction,
  submitEscrowRefAction,
  type EscrowState,
} from "@/app/actions/escrow";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";
import { availableTransitions } from "@/lib/escrow";
import type { Locale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";

/**
 * What each participant of a marketplace order can do right now. The server
 * actions re-check everything; this component only decides which forms to show.
 */
export function EscrowPanel({
  locale,
  orderNumber,
  escrowStatus,
  amount,
  isBuyer,
  isSeller,
  buyerName,
  sellerName,
  escrowRef,
  autoReleaseDays,
  sampleNumbers,
  labels,
}: {
  locale: Locale;
  orderNumber: string;
  escrowStatus: string;
  amount: number;
  isBuyer: boolean;
  isSeller: boolean;
  buyerName: string;
  sellerName: string;
  escrowRef: string | null;
  autoReleaseDays: number;
  sampleNumbers: { label: string; value: string }[];
  labels: {
    status: (status: string) => string;
    payTitle: string;
    payBody: string;
    ref: string;
    refHint: string;
    confirmPaid: string;
    refSubmitted: string;
    markDelivered: string;
    markDeliveredBody: string;
    confirmReceived: string;
    confirmReceivedBody: string;
    deadline: string;
    next: string;
    waitingSeller: string;
    rateTitle: string;
    rateComment: string;
    openDispute: string;
    disputeReason: string;
    seller: string;
    buyer: string;
    phone: string;
    submit: string;
    needHelp: string;
    invalidRef: string;
    invalidReason: string;
    missingPayoutRef: string;
  };
}) {
  const actor = isBuyer ? "BUYER" : isSeller ? "SELLER" : "ADMIN";
  const moves = availableTransitions(escrowStatus, actor);

  const [refState, refAction, submittingRef] = useActionState<EscrowState, FormData>(submitEscrowRefAction, null);
  const [releaseState, releaseAction, releasing] = useActionState<EscrowState, FormData>(releaseEscrowAction, null);
  const [disputeState, disputeAction] = useActionState<EscrowState, FormData>(
    async (_prev, formData) => {
      await disputeEscrowAction(formData);
      return null;
    },
    null,
  );
  const [ratingState, ratingAction, rating] = useActionState<EscrowState, FormData>(rateSellerAction, null);

  const canConfirmFunding =
    escrowStatus === "AWAITING_FUNDING" && isBuyer && !escrowRef;
  const referenceSubmitted = Boolean(escrowRef) && escrowStatus === "AWAITING_FUNDING";
  const canMarkDelivered = moves.includes("DELIVERED") && isSeller;
  const canConfirmReceived = moves.includes("RELEASED") && isBuyer;
  const canDispute = moves.includes("DISPUTED") && (isBuyer || isSeller);
  const canRate = escrowStatus === "RELEASED" && isBuyer;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-brand-900">{labels.status(escrowStatus)}</h2>
          <span className="font-mono text-sm font-semibold text-brand-700">
            {formatTZS(amount)}
          </span>
        </div>

        <dl className="mt-3 grid gap-1.5 text-sm text-brand-900/90 sm:grid-cols-2">
          <div className="flex justify-between gap-2">
            <dt className="text-brand-800">{labels.seller}</dt>
            <dd className="font-medium">{sellerName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-brand-800">{labels.buyer}</dt>
            <dd className="font-medium">{buyerName}</dd>
          </div>
        </dl>

        <p className="mt-3 text-sm text-brand-800">{labels.next}</p>
      </div>

      {/* Buyer: pay the platform so escrow gets funded */}
      {canConfirmFunding && !referenceSubmitted ? (
    <div className="rounded-xl border border-ink-200 p-5">
      <h3 className="font-bold text-ink-900">{labels.payTitle}</h3>
      <p className="mt-1.5 text-sm text-ink-600">
        {labels.payBody.replace("{amount}", formatTZS(amount))}
      </p>

      <ul className="mt-3 divide-y divide-ink-200 rounded-lg border border-ink-200">
        {sampleNumbers.map((entry) => (
          <li
            key={entry.label}
            className="flex items-center justify-between gap-2 px-4 py-2.5"
          >
            <span className="text-sm text-ink-600">{entry.label}</span>
            <span className="font-mono text-sm font-bold text-ink-900">
              {entry.value}
            </span>
          </li>
        ))}
      </ul>

      <form action={refAction} className="mt-4 space-y-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="orderNumber" value={orderNumber} />
        <Field label={labels.ref} hint={labels.refHint} htmlFor="escrow-ref" required>
          <Input id="escrow-ref" name="escrowRef" required placeholder="XPU4Q8RK" />
        </Field>
        {refState?.ok === false ? (
          <Alert tone="danger">{refState.error}</Alert>
        ) : null}
        <Button type="submit" disabled={submittingRef}>
          {submittingRef ? "…" : labels.confirmPaid}
        </Button>
      </form>
    </div>
  ) : null}

  {/* Buyer already told us the reference; an admin confirms it from here. */}
  {referenceSubmitted ? (
    <Alert tone="info">{labels.refSubmitted}</Alert>
  ) : null}

      {/* Seller: handover done */}
      {canMarkDelivered ? (
        <div className="rounded-xl border border-ink-200 p-5">
          <h3 className="font-bold text-ink-900">{labels.markDelivered}</h3>
          <p className="mt-1.5 text-sm text-ink-600">{labels.markDeliveredBody}</p>
          <form action={markDeliveredAction} className="mt-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="orderNumber" value={orderNumber} />
            <Button type="submit">{labels.markDelivered}</Button>
          </form>
        </div>
      ) : null}

      {/* Buyer: received the item */}
      {canConfirmReceived ? (
        <div className="rounded-xl border border-ink-200 p-5">
          <h3 className="font-bold text-ink-900">{labels.confirmReceived}</h3>
          <p className="mt-1.5 text-sm text-ink-600">{labels.confirmReceivedBody}</p>
          <form action={releaseAction} className="mt-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="orderNumber" value={orderNumber} />
            {releaseState?.ok === false ? (
              <Alert tone="danger">{releaseState.error}</Alert>
            ) : null}
            <Button type="submit" disabled={releasing}>
              {releasing ? "…" : labels.confirmReceived}
            </Button>
          </form>
          <p className="mt-3 text-xs text-ink-500">
            {labels.deadline.replace("{days}", String(autoReleaseDays))}
          </p>
        </div>
      ) : null}

      {/* Seller waiting for buyer confirm */}
      {escrowStatus === "FUNDED" && isSeller ? (
        <Alert tone="info">
          {labels.waitingSeller} — {labels.status("FUNDED")}.
        </Alert>
      ) : null}

      {escrowStatus === "REFUNDED" ? (
        <Alert tone="warning">{labels.status("REFUNDED")}</Alert>
      ) : null}

      {escrowStatus === "DISPUTED" ? (
        <Alert tone="danger">{labels.status("DISPUTED")}</Alert>
      ) : null}

      {/* Dispute */}
      {canDispute ? (
        <div className="rounded-xl border border-red-200 p-5">
          <h3 className="font-bold text-red-800">{labels.openDispute}</h3>
          <form action={disputeAction} className="mt-3 space-y-3">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="orderNumber" value={orderNumber} />
            <Field label={labels.disputeReason} htmlFor="dispute-reason" required>
              <Textarea
                id="dispute-reason"
                name="reason"
                rows={2}
                minLength={5}
                required
                placeholder={labels.disputeReason}
              />
            </Field>
            {disputeState?.ok === false ? (
              <Alert tone="danger">{disputeState.error}</Alert>
            ) : null}
            <Button type="submit" variant="danger">
              {labels.openDispute}
            </Button>
          </form>
        </div>
      ) : null}

      {/* Rating after release */}
      {canRate ? (
        <div className="rounded-xl border border-ink-200 p-5">
          <h3 className="font-bold text-ink-900">{labels.rateTitle}</h3>
          <form action={ratingAction} className="mt-3 space-y-3">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="orderNumber" value={orderNumber} />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value} className="flex cursor-pointer flex-col items-center gap-1">
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    defaultChecked={value === 5}
                    className="sr-only"
                  />
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-ink-300 text-sm font-bold text-ink-700 peer-checked:border-brand-600">
                    {value}
                  </span>
                </label>
              ))}
            </div>
            <Field label={labels.rateComment} htmlFor="rating-comment">
              <Input id="rating-comment" name="comment" maxLength={600} />
            </Field>
            {ratingState?.ok === false ? (
              <Alert tone="danger">{ratingState.error}</Alert>
            ) : null}
            <Button type="submit" disabled={rating}>
              {rating ? "…" : labels.submit}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}