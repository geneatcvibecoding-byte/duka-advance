"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { saveSettingsAction, type AdminState } from "@/app/actions/admin";
import { Alert, Field, Input, buttonStyles } from "@/components/ui";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonStyles("primary", "md")}>
      {pending ? <Loader2 size={17} aria-hidden className="animate-spin" /> : null}
      Save settings
    </button>
  );
}

export type SettingsValues = {
  nameEn: string;
  nameSw: string;
  taglineEn: string;
  taglineSw: string;
  phone: string;
  whatsapp: string;
  email: string;
  addressLine: string;
  mpesaName: string;
  mpesaLipaNamba: string;
  tigoPesaNumber: string;
  airtelMoneyNumber: string;
  halopesaNumber: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  freeDeliveryOver: number | "";
};

export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    saveSettingsAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.ok ? <Alert tone="success">Settings saved.</Alert> : null}
      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <section className="rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="mb-4 font-bold text-ink-900">Shop identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Shop name (English)" htmlFor="nameEn" required>
            <Input id="nameEn" name="nameEn" defaultValue={values.nameEn} required />
          </Field>
          <Field label="Shop name (Kiswahili)" htmlFor="nameSw" required>
            <Input id="nameSw" name="nameSw" defaultValue={values.nameSw} required />
          </Field>
          <Field label="Tagline (English)" htmlFor="taglineEn">
            <Input id="taglineEn" name="taglineEn" defaultValue={values.taglineEn} />
          </Field>
          <Field label="Tagline (Kiswahili)" htmlFor="taglineSw">
            <Input id="taglineSw" name="taglineSw" defaultValue={values.taglineSw} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="mb-4 font-bold text-ink-900">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="phone" hint="Shown in the header" required>
            <Input id="phone" name="phone" defaultValue={values.phone} required />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp" required>
            <Input id="whatsapp" name="whatsapp" defaultValue={values.whatsapp} required />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={values.email} />
          </Field>
          <Field label="Shop address" htmlFor="addressLine" hint="Used for shop pickup">
            <Input id="addressLine" name="addressLine" defaultValue={values.addressLine} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="mb-1 font-bold text-ink-900">Payment details</h2>
        <p className="mb-4 text-sm text-ink-500">
          These appear on the order screen when a customer chooses to pay by transfer.
          Leave a field empty to hide that line.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Account name" htmlFor="mpesaName">
            <Input id="mpesaName" name="mpesaName" defaultValue={values.mpesaName} />
          </Field>
          <Field label="M-Pesa Lipa Namba" htmlFor="mpesaLipaNamba">
            <Input
              id="mpesaLipaNamba"
              name="mpesaLipaNamba"
              defaultValue={values.mpesaLipaNamba}
            />
          </Field>
          <Field label="Tigo Pesa number" htmlFor="tigoPesaNumber">
            <Input
              id="tigoPesaNumber"
              name="tigoPesaNumber"
              defaultValue={values.tigoPesaNumber}
            />
          </Field>
          <Field label="Airtel Money number" htmlFor="airtelMoneyNumber">
            <Input
              id="airtelMoneyNumber"
              name="airtelMoneyNumber"
              defaultValue={values.airtelMoneyNumber}
            />
          </Field>
          <Field label="HaloPesa number" htmlFor="halopesaNumber">
            <Input
              id="halopesaNumber"
              name="halopesaNumber"
              defaultValue={values.halopesaNumber}
            />
          </Field>
          <Field label="Bank name" htmlFor="bankName">
            <Input id="bankName" name="bankName" defaultValue={values.bankName} />
          </Field>
          <Field label="Bank account name" htmlFor="bankAccountName">
            <Input
              id="bankAccountName"
              name="bankAccountName"
              defaultValue={values.bankAccountName}
            />
          </Field>
          <Field label="Bank account number" htmlFor="bankAccountNumber">
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              defaultValue={values.bankAccountNumber}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="mb-4 font-bold text-ink-900">Delivery</h2>
        <Field
          label="Free delivery over (TSh)"
          htmlFor="freeDeliveryOver"
          hint="Leave empty to always charge delivery"
        >
          <Input
            id="freeDeliveryOver"
            name="freeDeliveryOver"
            type="number"
            min={0}
            step={5000}
            defaultValue={values.freeDeliveryOver}
            className="max-w-xs"
          />
        </Field>
      </section>

      <Submit />
    </form>
  );
}
