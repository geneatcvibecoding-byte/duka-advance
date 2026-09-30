import { getShopSettings } from "@/lib/settings";
import { enabledProviders, comingSoonProviders } from "@/lib/payments/providers";
import { Badge } from "@/components/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getShopSettings();
  const enabled = enabledProviders();
  const comingSoon = comingSoonProviders();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Settings</h1>

      <div className="mt-5">
        <SettingsForm
          values={{
            nameEn: settings.nameEn,
            nameSw: settings.nameSw,
            taglineEn: settings.taglineEn,
            taglineSw: settings.taglineSw,
            phone: settings.phone,
            whatsapp: settings.whatsapp,
            email: settings.email,
            addressLine: settings.addressLine,
            mpesaName: settings.mpesaName ?? "",
            mpesaLipaNamba: settings.mpesaLipaNamba ?? "",
            tigoPesaNumber: settings.tigoPesaNumber ?? "",
            airtelMoneyNumber: settings.airtelMoneyNumber ?? "",
            halopesaNumber: settings.halopesaNumber ?? "",
            bankName: settings.bankName ?? "",
            bankAccountName: settings.bankAccountName ?? "",
            bankAccountNumber: settings.bankAccountNumber ?? "",
            freeDeliveryOver: settings.freeDeliveryOver ?? "",
          }}
        />
      </div>

      <section className="mt-6 rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="mb-1 font-bold text-ink-900">Payment methods</h2>
        <p className="mb-4 text-sm text-ink-500">
          Which methods customers can pick at checkout. Online payment is switched on
          with environment variables, not from this screen.
        </p>

        <ul className="space-y-2 text-sm">
          {enabled.map((provider) => (
            <li key={provider.id} className="flex items-center gap-3">
              <Badge tone="success">On</Badge>
              <span className="font-mono text-ink-700">{provider.id}</span>
              <span className="text-ink-500">
                {provider.isOnline ? "online" : "settled by hand"}
              </span>
            </li>
          ))}
          {comingSoon.map((provider) => (
            <li key={provider.id} className="flex items-center gap-3">
              <Badge tone="neutral">Off</Badge>
              <span className="font-mono text-ink-700">{provider.id}</span>
              <span className="text-ink-500">
                set MPESA_ENABLED=true and the API credentials in .env
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
