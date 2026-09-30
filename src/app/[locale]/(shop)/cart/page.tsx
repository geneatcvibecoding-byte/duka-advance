import type { Metadata } from "next";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { getCartView } from "@/lib/cart";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { Alert, EmptyState, buttonStyles } from "@/components/ui";
import {
  removeFromCartAction,
  updateCartQuantityAction,
} from "@/app/actions/cart";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  return { title: getTranslator(resolveLocale(raw))("cart.title") };
}

export default async function CartPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const cart = await getCartView(locale);

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink-900">
          {t("cart.title")}
        </h1>
        <EmptyState
          icon={<ShoppingBag size={40} aria-hidden />}
          title={t("cart.empty")}
          body={t("cart.emptyHint")}
          action={
            <Link href={link(locale, "/shop")} className={buttonStyles("primary", "md")}>
              {t("cart.emptyCta")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {t("cart.title")}
      </h1>

      {cart.adjusted ? (
        <Alert tone="warning" className="mt-4">
          {t("cart.stockAdjusted")}
        </Alert>
      ) : null}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-ink-200 rounded-xl border border-ink-200 bg-white">
          {cart.items.map((item) => (
            <li key={item.key} className="flex gap-4 p-4">
              <Link
                href={link(locale, `/product/${item.slug}`)}
                className="shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-50"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    width={96}
                    height={96}
                    className="h-24 w-24 object-cover"
                  />
                ) : (
                  <div className="h-24 w-24" />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={link(locale, `/product/${item.slug}`)}
                  className="font-medium text-ink-900 hover:text-brand-700"
                >
                  {item.name}
                </Link>
                {item.variantLabel ? (
                  <p className="mt-0.5 text-sm text-ink-500">{item.variantLabel}</p>
                ) : null}
                <p className="mt-1 text-sm text-ink-600">{formatTZS(item.unitPrice)}</p>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {/* One form, two submit buttons: each carries its own
                      quantity value, so no JavaScript is needed. */}
                  <form
                    action={updateCartQuantityAction}
                    className="inline-flex items-center rounded-lg border border-ink-300"
                  >
                    <input type="hidden" name="productId" value={item.productId} />
                    <input
                      type="hidden"
                      name="variantId"
                      value={item.variantId ?? ""}
                    />
                    <button
                      type="submit"
                      name="quantity"
                      value={item.quantity - 1}
                      aria-label="-"
                      className="grid h-9 w-9 place-items-center rounded-l-lg text-ink-700 hover:bg-ink-100"
                    >
                      <Minus size={15} aria-hidden />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-ink-900">
                      {item.quantity}
                    </span>
                    <button
                      type="submit"
                      name="quantity"
                      value={item.quantity + 1}
                      disabled={item.quantity >= item.available}
                      aria-label="+"
                      className="grid h-9 w-9 place-items-center rounded-r-lg text-ink-700 hover:bg-ink-100 disabled:text-ink-300 disabled:hover:bg-transparent"
                    >
                      <Plus size={15} aria-hidden />
                    </button>
                  </form>

                  <form action={removeFromCartAction}>
                    <input type="hidden" name="productId" value={item.productId} />
                    <input
                      type="hidden"
                      name="variantId"
                      value={item.variantId ?? ""}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-red-600"
                    >
                      <Trash2 size={15} aria-hidden />
                      {t("common.remove")}
                    </button>
                  </form>
                </div>
              </div>

              <p className="shrink-0 font-bold text-ink-900">
                {formatTZS(item.lineTotal)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-xl border border-ink-200 bg-white p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-ink-600">{t("cart.subtotal")}</span>
              <span className="text-xl font-bold text-ink-900">
                {formatTZS(cart.subtotal)}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-500">{t("cart.deliveryNote")}</p>

            <Link
              href={link(locale, "/checkout")}
              className={buttonStyles("primary", "lg", "mt-5 w-full")}
            >
              {t("cart.checkout")}
            </Link>
            <Link
              href={link(locale, "/shop")}
              className={buttonStyles("ghost", "md", "mt-2 w-full")}
            >
              {t("cart.continueShopping")}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
