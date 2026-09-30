"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { placeOrderAction, type CheckoutState } from "@/app/actions/checkout";
import { Alert, Field, Input, Select, Textarea, buttonStyles } from "@/components/ui";
import { REGIONS, districtsFor, formatTZS } from "@/lib/tz";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type PaymentOption = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type DeliveryZoneOption = {
  region: string;
  fee: number;
  etaMinDays: number;
  etaMaxDays: number;
};

export type CheckoutLabels = {
  contactSection: string;
  fullName: string;
  phone: string;
  phoneHint: string;
  email: string;
  optional: string;
  addressSection: string;
  region: string;
  district: string;
  street: string;
  landmark: string;
  landmarkHint: string;
  notes: string;
  selectRegion: string;
  selectDistrict: string;
  paymentSection: string;
  summary: string;
  subtotal: string;
  delivery: string;
  discount: string;
  total: string;
  free: string;
  selectRegionForDelivery: string;
  placeOrder: string;
  comingSoon: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonStyles("primary", "lg", "w-full")}
    >
      {pending ? <Loader2 size={18} aria-hidden className="animate-spin" /> : null}
      {label}
    </button>
  );
}

export function CheckoutForm({
  locale,
  subtotal,
  discount,
  couponCode,
  freeDeliveryOver,
  zones,
  paymentOptions,
  comingSoon,
  defaults,
  labels,
}: {
  locale: Locale;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  freeDeliveryOver: number | null;
  zones: DeliveryZoneOption[];
  paymentOptions: PaymentOption[];
  comingSoon: PaymentOption[];
  defaults: {
    name: string;
    phone: string;
    email: string;
    region: string;
    district: string;
    street: string;
    landmark: string;
  };
  labels: CheckoutLabels;
}) {
  const [state, formAction] = useActionState<CheckoutState, FormData>(
    placeOrderAction,
    null,
  );

  const [region, setRegion] = useState(defaults.region);
  const [district, setDistrict] = useState(defaults.district);
  const [method, setMethod] = useState(paymentOptions[0]?.id ?? "COD");

  const districts = useMemo(() => districtsFor(region), [region]);

  // Display only — placeOrderAction recomputes all of this from the database.
  const zone = zones.find((z) => z.region === region);
  const afterDiscount = Math.max(0, subtotal - discount);
  const qualifiesFreeDelivery =
    freeDeliveryOver !== null && afterDiscount >= freeDeliveryOver;
  const deliveryFee = !zone ? null : qualifiesFreeDelivery ? 0 : zone.fee;
  const total = afterDiscount + (deliveryFee ?? 0);

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <input type="hidden" name="locale" value={locale} />
      {couponCode ? (
        <input type="hidden" name="couponCode" value={couponCode} />
      ) : null}

      <div className="space-y-8">
        {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink-900">{labels.contactSection}</h2>

          <Field label={labels.fullName} htmlFor="customerName" required>
            <Input
              id="customerName"
              name="customerName"
              autoComplete="name"
              defaultValue={defaults.name}
              required
            />
          </Field>

          <Field
            label={labels.phone}
            htmlFor="customerPhone"
            hint={labels.phoneHint}
            required
          >
            <Input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0712 345 678"
              defaultValue={defaults.phone}
              required
            />
          </Field>

          <Field
            label={`${labels.email} (${labels.optional})`}
            htmlFor="customerEmail"
          >
            <Input
              id="customerEmail"
              name="customerEmail"
              type="email"
              autoComplete="email"
              defaultValue={defaults.email}
            />
          </Field>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink-900">{labels.addressSection}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={labels.region} htmlFor="region" required>
              <Select
                id="region"
                name="region"
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value);
                  setDistrict("");
                }}
                required
              >
                <option value="">{labels.selectRegion}</option>
                {REGIONS.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={labels.district} htmlFor="district" required>
              <Select
                id="district"
                name="district"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                disabled={!region}
                required
              >
                <option value="">{labels.selectDistrict}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label={labels.street} htmlFor="street" required>
            <Input
              id="street"
              name="street"
              autoComplete="street-address"
              defaultValue={defaults.street}
              required
            />
          </Field>

          <Field
            label={`${labels.landmark} (${labels.optional})`}
            htmlFor="landmark"
            hint={labels.landmarkHint}
          >
            <Input id="landmark" name="landmark" defaultValue={defaults.landmark} />
          </Field>

          <Field label={`${labels.notes} (${labels.optional})`} htmlFor="notes">
            <Textarea id="notes" name="notes" rows={3} />
          </Field>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink-900">{labels.paymentSection}</h2>

          <div className="space-y-2.5">
            {paymentOptions.map((option) => (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                  method === option.id
                    ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                    : "border-ink-200 hover:border-ink-300",
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.id}
                  checked={method === option.id}
                  onChange={() => setMethod(option.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block font-semibold text-ink-900">
                    {option.name}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink-600">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}

            {/* Showing M-Pesa as "coming soon" reassures customers far more
                than leaving it out entirely. */}
            {comingSoon.map((option) => (
              <div
                key={option.id}
                className="flex gap-3 rounded-xl border border-dashed border-ink-200 bg-ink-50 p-4 opacity-70"
              >
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-ink-300" />
                <span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink-700">{option.name}</span>
                    <span className="rounded-full bg-ink-200 px-2 py-0.5 text-xs font-semibold text-ink-700">
                      {labels.comingSoon}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink-500">
                    {option.description}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-40 lg:self-start">
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          <h2 className="font-bold text-ink-900">{labels.summary}</h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">{labels.subtotal}</dt>
              <dd className="font-medium text-ink-900">{formatTZS(subtotal)}</dd>
            </div>

            {discount > 0 ? (
              <div className="flex justify-between text-brand-700">
                <dt>
                  {labels.discount}
                  {couponCode ? ` (${couponCode})` : ""}
                </dt>
                <dd className="font-medium">−{formatTZS(discount)}</dd>
              </div>
            ) : null}

            <div className="flex justify-between">
              <dt className="text-ink-600">{labels.delivery}</dt>
              <dd className="font-medium text-ink-900">
                {deliveryFee === null ? (
                  <span className="text-xs font-normal text-ink-500">
                    {labels.selectRegionForDelivery}
                  </span>
                ) : deliveryFee === 0 ? (
                  <span className="text-brand-700">{labels.free}</span>
                ) : (
                  formatTZS(deliveryFee)
                )}
              </dd>
            </div>

            <div className="flex justify-between border-t border-ink-200 pt-3 text-base">
              <dt className="font-bold text-ink-900">{labels.total}</dt>
              <dd className="font-black text-ink-900">{formatTZS(total)}</dd>
            </div>
          </dl>

          {zone ? (
            <p className="mt-3 text-xs text-ink-500">
              {zone.etaMinDays}–{zone.etaMaxDays} days · {zone.region}
            </p>
          ) : null}

          <div className="mt-5">
            <SubmitButton label={labels.placeOrder} />
          </div>
        </div>
      </aside>
    </form>
  );
}
