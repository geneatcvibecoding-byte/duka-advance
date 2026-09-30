"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { buyListingAction, type ListingState } from "@/app/actions/listing";
import { buttonStyles } from "@/components/ui";
import type { Locale } from "@/lib/i18n";

/**
 * Buy button for a listing. A Server Action in a form so it degrades to a
 * plain form post without JavaScript; useActionState surfaces the failure the
 * action returns (listing gone, raced, not verified) instead of a dead click.
 */
export function BuyListingButton({
  locale,
  listingId,
  buyLabel,
  escrowNote,
}: {
  locale: Locale;
  listingId: string;
  buyLabel: string;
  escrowNote: string;
}) {
  const [state, action, pending] = useActionState<ListingState, FormData>(
    async (_prev, formData) => {
      await buyListingAction(formData);
      return null;
    },
    null,
  );

  if (state?.ok === false) {
    return <p className="text-sm font-medium text-red-700">{state.error}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        disabled={pending}
        className={`${buttonStyles("primary", "lg")} w-full`}
      >
        <ShieldCheck size={19} aria-hidden />
        {pending ? "…" : buyLabel}
      </button>
      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-ink-500">
        <ShieldCheck size={13} aria-hidden className="mt-0.5 shrink-0" />
        <span>{escrowNote}</span>
      </p>
    </form>
  );
}