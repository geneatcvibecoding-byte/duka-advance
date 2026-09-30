"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { addAddressAction } from "@/app/actions/account";
import { Field, Input, Select, buttonStyles } from "@/components/ui";
import { REGIONS, districtsFor } from "@/lib/tz";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonStyles("primary", "md")}>
      {pending ? <Loader2 size={17} aria-hidden className="animate-spin" /> : null}
      {label}
    </button>
  );
}

export function AddressForm({
  labels,
}: {
  labels: {
    heading: string;
    fullName: string;
    phone: string;
    region: string;
    district: string;
    street: string;
    landmark: string;
    optional: string;
    selectRegion: string;
    selectDistrict: string;
    save: string;
  };
}) {
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const districts = useMemo(() => districtsFor(region), [region]);

  return (
    <form
      action={addAddressAction}
      className="space-y-4 rounded-xl border border-ink-200 p-5"
    >
      <h2 className="font-bold text-ink-900">{labels.heading}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.fullName} htmlFor="fullName" required>
          <Input id="fullName" name="fullName" autoComplete="name" required />
        </Field>

        <Field label={labels.phone} htmlFor="addr-phone" required>
          <Input
            id="addr-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="0712 345 678"
            required
          />
        </Field>

        <Field label={labels.region} htmlFor="addr-region" required>
          <Select
            id="addr-region"
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

        <Field label={labels.district} htmlFor="addr-district" required>
          <Select
            id="addr-district"
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

      <Field label={labels.street} htmlFor="addr-street" required>
        <Input id="addr-street" name="street" autoComplete="street-address" required />
      </Field>

      <Field label={`${labels.landmark} (${labels.optional})`} htmlFor="addr-landmark">
        <Input id="addr-landmark" name="landmark" />
      </Field>

      <Submit label={labels.save} />
    </form>
  );
}
