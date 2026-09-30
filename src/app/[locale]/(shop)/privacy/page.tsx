import { PolicyPage } from "@/components/PolicyPage";
import { getPolicy } from "@/lib/policies";
import { resolveLocale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale: raw } = await params;
  return { title: getPolicy("privacy", resolveLocale(raw)).title };
}

export default async function Page({ params }: Props) {
  const { locale: raw } = await params;
  return <PolicyPage policyKey="privacy" locale={resolveLocale(raw)} />;
}
