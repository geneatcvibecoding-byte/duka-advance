"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { saveProductAction, type AdminState } from "@/app/actions/admin";
import { Alert, Field, Input, Select, Textarea, buttonStyles } from "@/components/ui";
import type { Locale } from "@/lib/i18n";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonStyles("primary", "md")}>
      {pending ? <Loader2 size={17} aria-hidden className="animate-spin" /> : null}
      {label}
    </button>
  );
}

export type ProductFormValues = {
  id?: string;
  slug: string;
  nameEn: string;
  nameSw: string;
  descEn: string;
  descSw: string;
  brand: string;
  sku: string;
  price: number | "";
  compareAt: number | "";
  stock: number | "";
  lowStockAt: number | "";
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
};

export function ProductForm({
  locale,
  categories,
  values,
}: {
  locale: Locale;
  categories: { id: string; nameEn: string }[];
  values: ProductFormValues;
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    saveProductAction,
    null,
  );
  const isEdit = Boolean(values.id);
  const [imageUrl, setImageUrl] = useState("");

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <section className="rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="mb-4 font-bold text-ink-900">Names and description</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name (English)" htmlFor="nameEn" required>
            <Input id="nameEn" name="nameEn" defaultValue={values.nameEn} required />
          </Field>
          <Field label="Name (Kiswahili)" htmlFor="nameSw" required>
            <Input id="nameSw" name="nameSw" defaultValue={values.nameSw} required />
          </Field>
          <Field
            label="Description (English)"
            htmlFor="descEn"
            hint="Explain what the product is, what is included, and why a customer would want it."
          >
            <Textarea id="descEn" name="descEn" rows={5} placeholder="Describe the product clearly for customers…" defaultValue={values.descEn} />
          </Field>
          <Field
            label="Description (Kiswahili)"
            htmlFor="descSw"
            hint="Andika maelezo ya bidhaa kwa Kiswahili rahisi na kinachoeleweka."
          >
            <Textarea id="descSw" name="descSw" rows={5} placeholder="Eleza bidhaa kwa Kiswahili…" defaultValue={values.descSw} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="mb-4 font-bold text-ink-900">Pricing and stock</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Price (TSh)" htmlFor="price" required>
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              step={100}
              defaultValue={values.price}
              required
            />
          </Field>
          <Field label="Was price (TSh)" htmlFor="compareAt" hint="Leave empty if not on offer">
            <Input
              id="compareAt"
              name="compareAt"
              type="number"
              min={0}
              step={100}
              defaultValue={values.compareAt}
            />
          </Field>
          <Field label="Stock" htmlFor="stock" required>
            <Input
              id="stock"
              name="stock"
              type="number"
              min={0}
              defaultValue={values.stock}
              required
            />
          </Field>
          <Field label="Low stock warning at" htmlFor="lowStockAt">
            <Input
              id="lowStockAt"
              name="lowStockAt"
              type="number"
              min={0}
              defaultValue={values.lowStockAt}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="mb-4 font-bold text-ink-900">Organisation</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="categoryId" required>
            <Select
              id="categoryId"
              name="categoryId"
              defaultValue={values.categoryId}
              required
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameEn}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Brand" htmlFor="brand">
            <Input id="brand" name="brand" defaultValue={values.brand} />
          </Field>
          <Field label="SKU" htmlFor="sku">
            <Input id="sku" name="sku" defaultValue={values.sku} />
          </Field>
          <Field
            label="Web address"
            htmlFor="slug"
            hint="Leave empty to generate it from the English name"
          >
            <Input id="slug" name="slug" defaultValue={values.slug} />
          </Field>
        </div>

        {!isEdit ? (
          <div className="mt-4">
            <Field
              label="Main product image"
              htmlFor="imageUrl"
              hint="Paste an image URL. After creating the product, you can upload photos directly from your computer in the Images section."
            >
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://example.com/product-photo.jpg"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
              />
            </Field>
            {imageUrl.trim() ? (
              <div className="mt-3 max-w-xs rounded-xl border border-ink-200 bg-ink-50 p-3">
                <p className="mb-2 text-xs font-semibold text-ink-600">Image preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Product image preview"
                  className="aspect-square w-full rounded-lg bg-white object-contain"
                  onError={(event) => { event.currentTarget.style.display = "none"; }}
                  onLoad={(event) => { event.currentTarget.style.display = "block"; }}
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-ink-500">
                Add a clear, well-lit photo so customers can see what they are buying.
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-5">
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={values.isActive}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            Visible in the shop
          </label>
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={values.isFeatured}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            Feature on the home page
          </label>
        </div>
      </section>

      <Submit label={isEdit ? "Save changes" : "Create product"} />
    </form>
  );
}
