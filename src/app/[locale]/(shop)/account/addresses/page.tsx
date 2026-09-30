import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getTranslator, resolveLocale } from "@/lib/i18n";
import { formatPhone } from "@/lib/tz";
import { Badge } from "@/components/ui";
import { AddressForm } from "@/components/AddressForm";
import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/app/actions/account";

export default async function AddressesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const user = (await getCurrentUser())!;

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-8">
      {addresses.length === 0 ? (
        <p className="text-ink-600">{t("account.noAddresses")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-xl border border-ink-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-ink-900">{address.fullName}</p>
                {address.isDefault ? (
                  <Badge tone="success">{t("account.defaultAddress")}</Badge>
                ) : null}
              </div>

              <address className="mt-1.5 text-sm not-italic leading-relaxed text-ink-600">
                {formatPhone(address.phone)}
                <br />
                {address.street}
                <br />
                {address.district}, {address.region}
                {address.landmark ? (
                  <>
                    <br />
                    <span className="text-ink-500">{address.landmark}</span>
                  </>
                ) : null}
              </address>

              <div className="mt-3 flex items-center gap-4">
                {!address.isDefault ? (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="addressId" value={address.id} />
                    <button
                      type="submit"
                      className="text-sm font-medium text-brand-700 hover:underline"
                    >
                      {t("account.setDefault")}
                    </button>
                  </form>
                ) : null}

                <form action={deleteAddressAction}>
                  <input type="hidden" name="addressId" value={address.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-red-600"
                  >
                    <Trash2 size={14} aria-hidden />
                    {t("common.remove")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddressForm
        labels={{
          heading: t("account.addAddress"),
          fullName: t("checkout.fullName"),
          phone: t("checkout.phone"),
          region: t("checkout.region"),
          district: t("checkout.district"),
          street: t("checkout.street"),
          landmark: t("checkout.landmark"),
          optional: t("common.optional"),
          selectRegion: t("checkout.selectRegion"),
          selectDistrict: t("checkout.selectDistrict"),
          save: t("common.save"),
        }}
      />
    </div>
  );
}
