"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2, ShoppingCart } from "lucide-react";
import { addToCartAction, type CartActionState } from "@/app/actions/cart";
import { buttonStyles } from "@/components/ui";
import { cn } from "@/lib/utils";

export type VariantOption = {
  id: string;
  label: string;
  value: string;
  priceDelta: number;
  stock: number;
};

function SubmitButton({ label, addedLabel, added, disabled }: {
  label: string;
  addedLabel: string;
  added: boolean;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={buttonStyles("primary", "lg", "w-full sm:w-auto sm:min-w-56")}
    >
      {pending ? (
        <Loader2 size={19} aria-hidden className="animate-spin" />
      ) : added ? (
        <Check size={19} aria-hidden />
      ) : (
        <ShoppingCart size={19} aria-hidden />
      )}
      {added && !pending ? addedLabel : label}
    </button>
  );
}

/**
 * Progressive enhancement: this is a real <form>, so it still adds to the cart
 * with JavaScript disabled. The client hooks only add the pending spinner and
 * the transient "added" confirmation.
 */
export function AddToCartForm({
  productId,
  variants,
  optionLabel,
  labels,
  outOfStock,
}: {
  productId: string;
  variants: VariantOption[];
  optionLabel: string | null;
  labels: {
    addToCart: string;
    added: string;
    quantity: string;
    outOfStock: string;
    chooseOption: string;
  };
  outOfStock: boolean;
}) {
  const [state, formAction] = useActionState<CartActionState, FormData>(
    addToCartAction,
    null,
  );
  const [selectedVariant, setSelectedVariant] = useState<string>(
    variants.find((v) => v.stock > 0)?.id ?? "",
  );

  // `useActionState` hands back a fresh object per submission, so remembering
  // which one has been acknowledged lets "Added" be derived rather than stored.
  // The only setState happens inside the timeout, never during the effect body.
  const [acknowledged, setAcknowledged] = useState<CartActionState>(null);
  const justAdded = Boolean(state?.ok) && state !== acknowledged;

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setAcknowledged(state), 2500);
    return () => clearTimeout(timer);
  }, [justAdded, state]);

  const activeVariant = variants.find((v) => v.id === selectedVariant);
  const disabled = outOfStock || (variants.length > 0 && !activeVariant?.stock);
  const maxQuantity = activeVariant ? activeVariant.stock : undefined;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="productId" value={productId} />

      {variants.length > 0 ? (
        <fieldset>
          <legend className="field-label">{optionLabel ?? labels.chooseOption}</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const soldOut = variant.stock <= 0;
              const isSelected = variant.id === selectedVariant;

              return (
                <label
                  key={variant.id}
                  className={cn(
                    "cursor-pointer rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                    isSelected
                      ? "border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-600"
                      : "border-ink-300 text-ink-800 hover:border-ink-400",
                    soldOut &&
                      "cursor-not-allowed border-ink-200 text-ink-300 line-through hover:border-ink-200",
                  )}
                >
                  <input
                    type="radio"
                    name="variantId"
                    value={variant.id}
                    checked={isSelected}
                    disabled={soldOut}
                    onChange={() => setSelectedVariant(variant.id)}
                    className="sr-only"
                  />
                  {variant.value}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-28">
          <label className="field-label" htmlFor="quantity">
            {labels.quantity}
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={maxQuantity}
            defaultValue={1}
            disabled={disabled}
            className="field-input text-center"
          />
        </div>

        <SubmitButton
          label={disabled ? labels.outOfStock : labels.addToCart}
          addedLabel={labels.added}
          added={justAdded}
          disabled={disabled}
        />
      </div>

      {state && !state.ok && state.message ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.message}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p role="status" className="text-sm font-medium text-gold-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
