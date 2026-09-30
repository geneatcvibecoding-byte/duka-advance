"use client";

import { useActionState } from "react";
import { fundEscrowAction, refundEscrowAction, releaseEscrowAction } from "@/app/actions/escrow";
import { resolveDisputeAction, type EscrowState } from "@/app/actions/admin-marketplace";
import { Button, Input } from "@/components/ui";

/**
 * The admin's escrow console for a single order. The state machine defines what
 * the admin may do at each status; this renders exactly those controls and lets
 * the server re-check them. English-only like the rest of the admin panel.
 */
export function MarketplaceEscrowActions({
  orderNumber,
  escrowStatus,
  escrowRef,
}: {
  orderNumber: string;
  escrowStatus: string;
  escrowRef: string | null;
}) {
  const [confirmState, confirmAction, confirming] = useActionState<EscrowState, FormData>(fundEscrowAction, null);
  const [releaseState, releaseAction, releasing] = useActionState<EscrowState, FormData>(releaseEscrowAction, null);
  const [refundState, refundAction, refunding] = useActionState<EscrowState, FormData>(refundEscrowAction, null);
  const [resolveState, resolveAction] = useActionState<EscrowState, FormData>(resolveDisputeAction, null);

  const awaitingFunding = escrowStatus === "AWAITING_FUNDING";
  const funded = escrowStatus === "FUNDED";
  const deliverable = escrowStatus === "DELIVERED";
  const disputed = escrowStatus === "DISPUTED";
  const settled = escrowStatus === "RELEASED" || escrowStatus === "REFUNDED";

  if (settled) return <span className="text-xs text-ink-500">—</span>;

  return (
    <div className="flex flex-col items-start gap-2">
      {awaitingFunding && escrowRef ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-ink-100 px-2 py-0.5 font-mono text-xs">
            {escrowRef}
          </span>
          <form action={confirmAction}>
            <input type="hidden" name="orderNumber" value={orderNumber} />
            <Button size="sm" disabled={confirming} type="submit">
              {confirming ? "…" : "Confirm payment"}
            </Button>
          </form>
        </div>
      ) : awaitingFunding && !escrowRef ? (
        <span className="text-xs text-ink-500">No reference yet</span>
      ) : null}
      {awaitingFunding || funded ? (
        <form action={refundAction} className="flex items-center gap-2">
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <Input
            name="reason"
            placeholder="Refund reason"
            required
            minLength={5}
            className="h-8 w-44 text-xs"
          />
          <Button type="submit" size="sm" variant="danger" disabled={refunding}>
            {refunding ? "…" : "Refund"}
          </Button>
        </form>
      ) : null}

      {deliverable ? (
        <form action={releaseAction} className="flex items-center gap-2">
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <Input
            name="payoutRef"
            placeholder="Seller payout ref"
            required
            minLength={4}
            className="h-8 w-44 text-xs"
          />
          <Button type="submit" size="sm" disabled={releasing}>
            {releasing ? "…" : "Release payout"}
          </Button>
        </form>
      ) : null}

      {disputed ? (
        <form action={resolveAction} className="flex flex-col items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <span className="text-xs font-semibold text-red-800">Resolve dispute</span>
          <fieldset className="flex gap-3 text-xs text-ink-700">
            <label className="flex items-center gap-1.5">
              <input type="radio" name="outcome" value="REFUNDED" required />
              Refund buyer
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" name="outcome" value="RELEASED" required />
              Pay seller
            </label>
          </fieldset>
          <Input
            name="reason"
            placeholder="Decision note (required for refunds)"
            className="h-8 w-64 text-xs"
          />
          <Input
            name="payoutRef"
            placeholder="Payout ref (required to pay seller)"
            className="h-8 w-64 text-xs"
          />
          <Button type="submit" size="sm" variant="danger">
            Apply decision
          </Button>
          {resolveState?.ok === false ? (
            <p className="text-xs font-medium text-red-700">{resolveState.error}</p>
          ) : null}
        </form>
      ) : null}

      {confirmState?.ok === false ? (
        <p className="text-xs font-medium text-red-700">{confirmState.error}</p>
      ) : null}
      {releaseState?.ok === false ? (
        <p className="text-xs font-medium text-red-700">{releaseState.error}</p>
      ) : null}
      {refundState?.ok === false ? (
        <p className="text-xs font-medium text-red-700">{refundState.error}</p>
      ) : null}
    </div>
  );
}