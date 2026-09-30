import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { link, resolveLocale } from "@/lib/i18n";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    select: { id: true, nameEn: true },
  });

  return (
    <div className="max-w-4xl">
      <Link
        href={link(locale, "/admin/products")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft size={15} aria-hidden />
        Back to products
      </Link>

      <h1 className="mb-6 mt-3 text-2xl font-bold tracking-tight text-ink-900">
        New product
      </h1>

      <ProductForm
        locale={locale}
        categories={categories}
        values={{
          slug: "",
          nameEn: "",
          nameSw: "",
          descEn: "",
          descSw: "",
          brand: "",
          sku: "",
          price: "",
          compareAt: "",
          stock: 0,
          lowStockAt: 5,
          categoryId: "",
          isActive: true,
          isFeatured: false,
        }}
      />
    </div>
  );
}
