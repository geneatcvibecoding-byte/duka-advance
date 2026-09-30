import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCartView } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDeliveryZones, getShopSettings } from "@/lib/settings";
import { validateCoupon } from "@/lib/coupons";
import { comingSoonProviders, enabledProviders } from "@/lib/payments/providers";
import { getTranslator, link, resolveLocale } from "@/lib/i18n";
import { formatTZS } from "@/lib/tz";
import { Alert, EmptyState, buttonStyles } from "@/components/ui";
import { CheckoutForm } from "@/components/CheckoutForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ coupon?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  return { title: getTranslator(resolveLocale(raw))("checkout.title") };
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const [{ locale: raw }, { coupon }] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const cart = await getCartView(locale);

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink-900">
          {t("checkout.title")}
        </h1>
        <EmptyState
          icon={<ShoppingBag size={40} aria-hidden />}
          title={t("cart.empty")}
          body={t("checkout.emptyCart")}
          action={
            <Link href={link(locale, "/shop")} className={buttonStyles("primary", "md")}>
              {t("cart.emptyCta")}
            </Link>
          }
        />
      </div>
    );
  }

  const [user, settings, zones] = await Promise.all([
    getCurrentUser(),
    getShopSettings(),
    getDeliveryZones(),
  ]);

  const defaultAddress = user
    ? await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    : null;

  // The coupon travels in the query string, so applying one is a plain GET
  // form and does not need a nested <form> inside the checkout form.
  const couponResult = coupon ? await validateCoupon(coupon, cart.subtotal) : null;
  const discount = couponResult?.ok ? couponResult.discount : 0;
  const appliedCode = couponResult?.ok ? couponResult.code : null;

  const paymentOptions = enabledProviders().map((provider) => ({
    id: provider.id,
    name: t(provider.nameKey),
    description: t(provider.descriptionKey),
    enabled: true,
  }));

  const comingSoon = comingSoonProviders().map((provider) => ({
    id: provider.id,
    name: t(provider.nameKey),
    description: t(provider.descriptionKey),
    enabled: false,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {t("checkout.title")}
      </h1>

      <div className="mt-5 max-w-md">
        <form method="get" action={link(locale, "/checkout")} className="flex gap-2">
          <label className="sr-only" htmlFor="coupon">
            {t("checkout.couponCode")}
          </label>
          <input
            id="coupon"
            name="coupon"
            defaultValue={coupon ?? ""}
            placeholder={t("checkout.couponPlaceholder")}
            className="field-input"
          />
          <button type="submit" className={buttonStyles("secondary", "md")}>
            {t("common.apply")}
          </button>
        </form>

        {couponResult?.ok ? (
          <Alert tone="success" className="mt-3">
            {t("checkout.couponApplied", { code: couponResult.code })} · −
            {formatTZS(couponResult.discount)}
          </Alert>
        ) : null}

        {couponResult && !couponResult.ok ? (
          <Alert tone="danger" className="mt-3">
            {t(couponResult.errorKey, {
              amount: couponResult.amount ? formatTZS(couponResult.amount) : "",
            })}
          </Alert>
        ) : null}

        {settings.freeDeliveryOver !== null && discount === 0 ? (
          <p className="mt-3 text-sm text-ink-600">
            {t("checkout.freeDeliveryOver", {
              amount: formatTZS(settings.freeDeliveryOver),
            })}
          </p>
        ) : null}
      </div>

      <div className="mt-8">
        <CheckoutForm
          locale={locale}
          subtotal={cart.subtotal}
          discount={discount}
          couponCode={appliedCode}
          freeDeliveryOver={settings.freeDeliveryOver}
          zones={zones.map((z) => ({
            region: z.region,
            fee: z.fee,
            etaMinDays: z.etaMinDays,
            etaMaxDays: z.etaMaxDays,
          }))}
          paymentOptions={paymentOptions}
          comingSoon={comingSoon}
          defaults={{
            name: user?.name ?? "",
            phone: user?.phone ?? "",
            email: user?.email ?? "",
            region: defaultAddress?.region ?? "",
            district: defaultAddress?.district ?? "",
            street: defaultAddress?.street ?? "",
            landmark: defaultAddress?.landmark ?? "",
          }}
          labels={{
            contactSection: t("checkout.contactSection"),
            fullName: t("checkout.fullName"),
            phone: t("checkout.phone"),
            phoneHint: t("checkout.phoneHint"),
            email: t("checkout.email"),
            optional: t("common.optional"),
            addressSection: t("checkout.addressSection"),
            region: t("checkout.region"),
            district: t("checkout.district"),
            street: t("checkout.street"),
            landmark: t("checkout.landmark"),
            landmarkHint: t("checkout.landmarkHint"),
            notes: t("checkout.notes"),
            selectRegion: t("checkout.selectRegion"),
            selectDistrict: t("checkout.selectDistrict"),
            paymentSection: t("checkout.paymentSection"),
            summary: t("checkout.summary"),
            subtotal: t("checkout.subtotal"),
            delivery: t("checkout.delivery"),
            discount: t("checkout.discount"),
            total: t("checkout.total"),
            free: t("checkout.free"),
            selectRegionForDelivery: t("checkout.selectRegionForDelivery"),
            placeOrder: t("checkout.placeOrder"),
            comingSoon: t("pay.comingSoon"),
          }}
        />
      </div>
    </div>
  );
}
