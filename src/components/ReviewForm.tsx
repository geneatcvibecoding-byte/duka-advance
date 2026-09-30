"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { submitReviewAction, type ReviewState } from "@/app/actions/product";
import { Alert, Textarea, buttonStyles } from "@/components/ui";
import { cn } from "@/lib/utils";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonStyles("primary", "md")}>
      {pending ? <Loader2 size={17} aria-hidden className="animate-spin" /> : null}
      {label}
    </button>
  );
}

export function ReviewForm({
  productId,
  labels,
}: {
  productId: string;
  labels: {
    heading: string;
    rating: string;
    review: string;
    submit: string;
    submitted: string;
  };
}) {
  const [state, formAction] = useActionState<ReviewState, FormData>(
    submitReviewAction,
    null,
  );
  const [rating, setRating] = useState(5);

  if (state?.ok) {
    return <Alert tone="success">{labels.submitted}</Alert>;
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-ink-200 p-5">
      <h3 className="font-semibold text-ink-900">{labels.heading}</h3>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <fieldset>
        <legend className="field-label">{labels.rating}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} / 5`}
              aria-pressed={rating === value}
              className={cn(
                "rounded p-0.5 transition-colors",
                value <= rating ? "text-gold-500" : "text-ink-300 hover:text-gold-300",
              )}
            >
              <svg
                width={26}
                height={26}
                viewBox="0 0 20 20"
                fill={value <= rating ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="field-label" htmlFor="review-comment">
          {labels.review}
        </label>
        <Textarea id="review-comment" name="comment" rows={4} required />
      </div>

      {state && !state.ok && state.message ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.message}
        </p>
      ) : null}

      <Submit label={labels.submit} />
    </form>
  );
}
