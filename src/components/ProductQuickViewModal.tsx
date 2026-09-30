"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck, ShoppingCart, Star, Truck, X } from "lucide-react";
import { formatTZS } from "@/lib/tz";
import { discountPercent } from "@/lib/utils";
import { link, type Locale } from "@/lib/i18n";
import { addToCartAction } from "@/app/actions/cart";

export type QuickViewProduct = {
  id: string;
  slug: string;
  name: string;
  desc?: string;
  brand?: string | null;
  price: number;
  compareAt: number | null;
  stock: number;
  images: { url: string; alt: string | null }[];
  rating: number;
  reviewsCount: number;
  ordersCount: number;
  isChoice: boolean;
  hasFreeShipping: boolean;
};

export function ProductQuickViewModal({
  product,
  locale,
  onClose,
}: {
  product: QuickViewProduct;
  locale: Locale;
  onClose: () => void;
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const discount = discountPercent(product.price, product.compareAt);
  const outOfStock = product.stock <= 0;
  const currentImg = product.images[selectedImage] || product.images[0];

  const handleAddToCart = async () => {
    if (outOfStock || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("productId", product.id);
      fd.set("quantity", String(quantity));
      const res = await addToCartAction(null, fd);
      if (res?.ok) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X size={20} aria-hidden />
        </button>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Gallery view */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50">
              {currentImg ? (
                <img
                  src={currentImg.url}
                  alt={currentImg.alt ?? product.name}
                  className="h-full w-full object-cover transition-transform duration-300"
                />
              ) : null}

              {discount !== null && (
                <span className="absolute left-3 top-3 rounded-md bg-amber-500 px-2 py-0.5 text-xs font-bold text-slate-900 shadow-sm">
                  -{discount}%
                </span>
              )}

              {product.isChoice && (
                <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-amber-300 shadow-sm">
                  CHOICE
                </span>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-all ${
                      selectedImage === idx
                        ? "border-slate-900 ring-2 ring-slate-900/10"
                        : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Buy action */}
          <div className="flex flex-col">
            {product.brand ? (
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {product.brand}
              </p>
            ) : null}

            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {product.name}
            </h2>

            {/* AliExpress style rating & orders count */}
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1 font-semibold text-amber-600">
                <Star size={14} className="fill-amber-400 text-amber-500" aria-hidden />
                <span>{product.rating}</span>
              </div>
              <span className="text-slate-300">·</span>
              <span>{product.reviewsCount} reviews</span>
              <span className="text-slate-300">·</span>
              <span className="font-medium text-slate-700">{product.ordersCount}+ sold</span>
            </div>

            {/* Price display */}
            <div className="mt-4 flex items-baseline gap-2.5">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {formatTZS(product.price)}
              </span>
              {discount !== null && product.compareAt ? (
                <span className="text-sm text-slate-400 line-through tabular-nums">
                  {formatTZS(product.compareAt)}
                </span>
              ) : null}
            </div>

            {/* Trust and delivery perks */}
            <div className="mt-4 space-y-2 border-y border-slate-200/60 py-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-slate-700 shrink-0" aria-hidden />
                <span>
                  {product.hasFreeShipping
                    ? (locale === "sw" ? "Usafirishaji Bure Tanzania" : "Free Countrywide Shipping")
                    : (locale === "sw" ? "Usafirishaji wa haraka siku 1-3" : "Fast delivery in 1–3 business days")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-slate-700 shrink-0" aria-hidden />
                <span>{locale === "sw" ? "Ulinzi wa Escrow & Marejesho" : "Escrow Buyer Protection & Easy Returns"}</span>
              </div>
            </div>

            {/* Quantity selector & Add to Cart */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-700">
                  {locale === "sw" ? "Idadi:" : "Quantity:"}
                </span>
                <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || outOfStock}
                    className="px-3 py-1 text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock || outOfStock}
                    className="px-3 py-1 text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-500">
                  {outOfStock
                    ? (locale === "sw" ? "Mzigo umeisha" : "Out of stock")
                    : `${product.stock} available`}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={outOfStock || isSubmitting}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-sm transition-all ${
                    added
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300"
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={16} aria-hidden />
                      {locale === "sw" ? "Imeongezwa kwenye Kikapu!" : "Added to Cart!"}
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} aria-hidden />
                      {outOfStock
                        ? (locale === "sw" ? "Haipatikani" : "Out of Stock")
                        : (locale === "sw" ? "Weka Kikapuni" : "Add to Cart")}
                    </>
                  )}
                </button>

                <Link
                  href={link(locale, `/product/${product.slug}`)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {locale === "sw" ? "Maelezo Kamili" : "Full Details"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
