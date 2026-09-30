import { getPolicy, type PolicyKey } from "@/lib/policies";
import type { Locale } from "@/lib/i18n";

export function PolicyPage({
  policyKey,
  locale,
}: {
  policyKey: PolicyKey;
  locale: Locale;
}) {
  const policy = getPolicy(policyKey, locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {policy.title}
      </h1>
      <p className="mt-3 leading-relaxed text-ink-600">{policy.intro}</p>

      <div className="mt-8 space-y-8">
        {policy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-bold text-ink-900">{section.heading}</h2>
            <ul className="mt-2 space-y-2">
              {section.body.map((line) => (
                <li key={line} className="flex gap-2 leading-relaxed text-ink-700">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
