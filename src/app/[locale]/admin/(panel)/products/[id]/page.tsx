import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { link, resolveLocale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { Input, buttonStyles } from "@/components/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { storageStatus } from "@/lib/storage/drivers";
import {
  addProductImageAction,
  attachProductImageAction,
  addVariantAction,
  deleteProductAction,
  deleteProductImageAction,
  deleteVariantAction,
} from "@/app/actions/admin";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: { position: "asc" } },
      },
    }),
    prisma.category.findMany({
      orderBy: { position: "asc" },
      select: { id: true, nameEn: true },
    }),
  ]);

  if (!product) notFound();

  const storage = storageStatus();

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={link(locale, "/admin/products")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
        >
          <ArrowLeft size={15} aria-hidden />
          Back to products
        </Link>

        <Link
          href={link(locale, `/product/${product.slug}`)}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
        >
          <ExternalLink size={15} aria-hidden />
          View in shop
        </Link>
      </div>

      <h1 className="mb-6 mt-3 text-2xl font-bold tracking-tight text-ink-900">
        {product.nameEn}
      </h1>

      <ProductForm
        locale={locale}
        categories={categories}
        values={{
          id: product.id,
          slug: product.slug,
          nameEn: product.nameEn,
          nameSw: product.nameSw,
          descEn: product.descEn,
          descSw: product.descSw,
          brand: product.brand ?? "",
          sku: product.sku ?? "",
          price: product.price,
          compareAt: product.compareAt ?? "",
          stock: product.stock,
          lowStockAt: product.lowStockAt,
          categoryId: product.categoryId,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        }}
      />

      <section className="mt-6 rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="mb-4 font-bold text-ink-900">Images</h2>

        {product.images.length > 0 ? (
          <ul className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {product.images.map((image) => (
              <li key={image.id} className="relative">
                <img
                  src={image.url}
                  alt={image.alt ?? ""}
                  width={120}
                  height={120}
                  className="aspect-square w-full rounded-lg border border-ink-200 object-cover"
                />
                <form action={deleteProductImageAction}>
                  <input type="hidden" name="imageId" value={image.id} />
                  <button
                    type="submit"
                    aria-label="Remove image"
                    className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-red-600 shadow hover:bg-white"
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-ink-500">No images yet.</p>
        )}

        <ImageUploader
          folder="products"
          onUploaded={attachProductImageAction.bind(null, product.id)}
        />

        <p className="mt-4 mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">
          Or link to an image hosted elsewhere
        </p>
        <form action={addProductImageAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="productId" value={product.id} />
          <Input
            name="url"
            placeholder="https://…"
            className="w-72"
            required
          />
          <Input name="alt" placeholder="Alt text (optional)" className="w-56" />
          <button type="submit" className={buttonStyles("secondary", "md")}>
            Add by URL
          </button>
        </form>

        <p className="mt-4 text-xs text-ink-500">{storage.message}</p>
      </section>

      <section className="mt-6 rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="mb-1 font-bold text-ink-900">Options</h2>
        <p className="mb-4 text-sm text-ink-500">
          Sizes, colours and other choices. Each option keeps its own stock.
        </p>

        {product.variants.length > 0 ? (
          <ul className="mb-4 divide-y divide-ink-200 rounded-lg border border-ink-200">
            {product.variants.map((variant) => (
              <li
                key={variant.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <span>
                  <span className="font-medium text-ink-900">
                    {variant.optionEn}: {variant.value}
                  </span>
                  <span className="ml-2 text-ink-500">
                    stock {variant.stock}
                    {variant.priceDelta !== 0
                      ? ` · ${variant.priceDelta > 0 ? "+" : ""}${formatTZS(variant.priceDelta)}`
                      : ""}
                  </span>
                </span>
                <form action={deleteVariantAction}>
                  <input type="hidden" name="variantId" value={variant.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 text-ink-500 hover:text-red-600"
                  >
                    <Trash2 size={14} aria-hidden />
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-ink-500">
            No options — the product is sold as a single item.
          </p>
        )}

        <form action={addVariantAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="productId" value={product.id} />
          <Input name="optionEn" placeholder="Option (Size)" className="w-36" required />
          <Input name="optionSw" placeholder="Chaguo (Ukubwa)" className="w-40" />
          <Input name="value" placeholder="Value (42)" className="w-28" required />
          <Input
            name="priceDelta"
            type="number"
            step={100}
            defaultValue={0}
            placeholder="± TSh"
            className="w-28"
          />
          <Input
            name="stock"
            type="number"
            min={0}
            defaultValue={0}
            placeholder="Stock"
            className="w-24"
          />
          <button type="submit" className={buttonStyles("secondary", "md")}>
            Add option
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="font-bold text-red-900">Delete product</h2>
        <p className="mt-1 text-sm text-red-800">
          Products that appear in past orders are hidden from the shop instead of
          deleted, so order history stays intact.
        </p>
        <form action={deleteProductAction} className="mt-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="id" value={product.id} />
          <button type="submit" className={buttonStyles("danger", "sm")}>
            Delete
          </button>
        </form>
      </section>
    </div>
  );
}
