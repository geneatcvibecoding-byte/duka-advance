"use client";

import { useRef, useState, useActionState } from "react";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { createListingAction, type ListingState } from "@/app/actions/listing";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { LISTING_CONDITIONS } from "@/lib/escrow";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 6;

export function ListingForm({
  locale,
  categories,
  labels,
  imageHint,
}: {
  locale: Locale;
  categories: { id: string; nameEn: string; nameSw: string }[];
  labels: {
    titleEn: string;
    titleSw: string;
    descEn: string;
    descSw: string;
    price: string;
    condition: string;
    category: string;
    images: string;
    submit: string;
    condition_NEW: string;
    condition_LIKE_NEW: string;
    condition_GOOD: string;
    condition_FAIR: string;
  };
  imageHint: string;
}) {
  const [state, action, pending] = useActionState<ListingState, FormData>(
    createListingAction,
    null,
  );

  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    // Sequential on purpose: a student on a mobile connection uploading a few
    // photos in parallel would stall the whole form.
    for (const file of Array.from(files)) {
      if (urls.length + 1 > MAX_IMAGES) {
        setError(`You can add up to ${MAX_IMAGES} photos.`);
        break;
      }
      const body = new FormData();
      body.append("file", file);
      try {
        const response = await fetch("/api/marketplace/upload", {
          method: "POST",
          body,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Upload failed.");
        setUrls((prev) => [...prev, result.url]);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error ? uploadError.message : "Upload failed.",
        );
        break;
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeUrl(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  const busy = uploading || pending;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {urls.map((url) => (
        <input key={url} type="hidden" name="imageUrl" value={url} />
      ))}

      {state?.ok === false ? <Alert tone="danger">{state.error}</Alert> : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={labels.titleEn} htmlFor="listing-title-en" required>
          <Input
            id="listing-title-en"
            name="titleEn"
            maxLength={120}
            required
            placeholder="Calculus textbook, 3rd edition"
          />
        </Field>
        <Field label={labels.titleSw} htmlFor="listing-title-sw">
          <Input
            id="listing-title-sw"
            name="titleSw"
            maxLength={120}
            placeholder="Kitabu cha hisabati, toleo la 3"
          />
        </Field>
      </div>

      <Field label={labels.descEn} htmlFor="listing-desc-en" required>
        <Textarea
          id="listing-desc-en"
          name="descEn"
          rows={5}
          required
          placeholder="Condition, where it came from, why you are selling it, whether the price is negotiable…"
        />
      </Field>
      <Field label={labels.descSw} htmlFor="listing-desc-sw">
        <Textarea
          id="listing-desc-sw"
          name="descSw"
          rows={3}
          placeholder="Hali ya bidhaa, kwa nini unaiuza…"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label={labels.price} htmlFor="listing-price" required>
          <Input
            id="listing-price"
            name="price"
            type="number"
            min={100}
            max={50_000_000}
            step={100}
            required
            placeholder="15000"
          />
        </Field>

        <Field label={labels.condition} htmlFor="listing-condition" required>
          <Select id="listing-condition" name="condition" defaultValue="GOOD">
            {LISTING_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {labels[`condition_${c}`] ?? c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={labels.category} htmlFor="listing-category" required>
          <Select id="listing-category" name="categoryId" required>
            <option value="" disabled>
              — {labels.category} —
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === "sw" ? c.nameSw || c.nameEn : c.nameEn}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div>
        <p className="field-label">{labels.images}</p>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            dragging
              ? "border-brand-500 bg-brand-50"
              : "border-ink-300 bg-ink-50",
            busy && "opacity-60",
          )}
        >
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-lg bg-white text-brand-600">
            {busy ? (
              <Loader2 size={22} aria-hidden className="animate-spin" />
            ) : (
              <UploadCloud size={22} aria-hidden />
            )}
          </div>
          <p className="text-sm font-medium text-ink-900">
            {busy ? "Uploading…" : "Drag photos here, or"}{" "}
            {!busy ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-brand-700 underline hover:text-brand-800"
              >
                choose files
              </button>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-ink-500">{imageHint}</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={(event) => void handleFiles(event.target.files)}
            className="sr-only"
          />
        </div>

        {error ? (
          <Alert tone="danger" className="mt-3">
            <span className="flex items-start gap-2">
              <ImagePlus size={16} aria-hidden className="mt-0.5 shrink-0" />
              {error}
            </span>
          </Alert>
        ) : null}

        {urls.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {urls.map((url) => (
              <li key={url} className="relative">
                <img
                  src={url}
                  alt=""
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-lg border border-ink-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeUrl(url)}
                  aria-label="Remove photo"
                  className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Button type="submit" disabled={busy} size="lg">
        {busy ? "…" : labels.submit}
      </Button>
    </form>
  );
}