import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { link, resolveLocale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { Badge, buttonStyles } from "@/components/ui";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);

  const where: Prisma.ProductWhereInput = {};
  if (query.q?.trim()) {
    const term = query.q.trim();
    where.OR = [
      { nameEn: { contains: term, mode: "insensitive" } },
      { nameSw: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
    ];
  }
  if (query.category) where.categoryId = query.category;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { nameEn: true } },
        images: { take: 1, orderBy: { position: "asc" } },
      },
      take: 200,
    }),
    prisma.category.findMany({ orderBy: { position: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Products</h1>
        <Link
          href={link(locale, "/admin/products/new")}
          className={buttonStyles("primary", "md")}
        >
          <Plus size={17} aria-hidden />
          New product
        </Link>
      </div>

      <form method="get" className="mt-5 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search name or SKU"
          className="field-input w-60"
        />
        <select name="category" defaultValue={query.category ?? ""} className="field-input w-52">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nameEn}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonStyles("secondary", "md")}>
          Filter
        </button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-ink-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Product</th>
              <th scope="col" className="px-4 py-3 font-semibold">Category</th>
              <th scope="col" className="px-4 py-3 font-semibold">Price</th>
              <th scope="col" className="px-4 py-3 font-semibold">Stock</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-lg border border-ink-200 object-cover"
                        />
                      ) : (
                        <span className="h-10 w-10 shrink-0 rounded-lg bg-ink-100" />
                      )}
                      <div className="min-w-0">
                        <Link
                          href={link(locale, `/admin/products/${product.id}`)}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          {product.nameEn}
                        </Link>
                        <p className="text-xs text-ink-500">{product.sku ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{product.category.nameEn}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink-900">
                    {formatTZS(product.price)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        product.stock === 0
                          ? "danger"
                          : product.stock <= product.lowStockAt
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {product.stock}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={product.isActive ? "success" : "neutral"}>
                        {product.isActive ? "Live" : "Hidden"}
                      </Badge>
                      {product.isFeatured ? <Badge tone="info">Featured</Badge> : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
