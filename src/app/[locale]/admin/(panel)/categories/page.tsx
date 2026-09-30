import { prisma } from "@/lib/db";
import { Badge, Input, Textarea, buttonStyles } from "@/components/ui";
import { deleteCategoryAction, saveCategoryAction } from "@/app/actions/admin";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Categories</h1>

      <div className="mt-5 space-y-3">
        {categories.map((category) => (
          <form
            key={category.id}
            action={saveCategoryAction}
            className="rounded-xl border border-ink-200 bg-white p-4"
          >
            <input type="hidden" name="id" value={category.id} />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {category.image ? (
                  <img
                    src={category.image}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg border border-ink-200 object-cover"
                  />
                ) : null}
                <div>
                  <p className="font-semibold text-ink-900">{category.nameEn}</p>
                  <p className="text-xs text-ink-500">
                    {category._count.products} product
                    {category._count.products === 1 ? "" : "s"} · /{category.slug}
                  </p>
                </div>
              </div>
              <Badge tone={category.isActive ? "success" : "neutral"}>
                {category.isActive ? "Live" : "Hidden"}
              </Badge>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input name="nameEn" defaultValue={category.nameEn} placeholder="Name (English)" required />
              <Input name="nameSw" defaultValue={category.nameSw} placeholder="Name (Kiswahili)" required />
              <Textarea
                name="descEn"
                rows={2}
                defaultValue={category.descEn ?? ""}
                placeholder="Description (English)"
              />
              <Textarea
                name="descSw"
                rows={2}
                defaultValue={category.descSw ?? ""}
                placeholder="Description (Kiswahili)"
              />
              <Input name="slug" defaultValue={category.slug} placeholder="Web address" />
              <Input name="image" defaultValue={category.image ?? ""} placeholder="Image URL" />
              <Input
                name="position"
                type="number"
                defaultValue={category.position}
                placeholder="Order"
                className="w-28"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={category.isActive}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                Visible
              </label>

              <button type="submit" className={buttonStyles("primary", "sm")}>
                Save
              </button>

              <button
                type="submit"
                formAction={deleteCategoryAction}
                className={buttonStyles("ghost", "sm", "text-red-600 hover:bg-red-50")}
              >
                Delete
              </button>
            </div>
          </form>
        ))}
      </div>

      <form
        action={saveCategoryAction}
        className="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-5"
      >
        <h2 className="mb-4 font-bold text-ink-900">Add a category</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="nameEn" placeholder="Name (English)" required />
          <Input name="nameSw" placeholder="Name (Kiswahili)" required />
          <Input name="slug" placeholder="Web address (optional)" />
          <Input name="image" placeholder="Image URL (optional)" />
        </div>
        <label className="mt-4 flex items-center gap-2.5 text-sm font-medium text-ink-800">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          Visible
        </label>
        <button type="submit" className={buttonStyles("primary", "md", "mt-4")}>
          Add category
        </button>
      </form>
    </div>
  );
}
