"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { locales, localeNames, switchLocalePath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Swaps the locale segment while keeping the current page and its query
 * string, so switching language never loses the shopper's place.
 */
export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-white/10 p-0.5">
      {locales.map((locale) => {
        const href = switchLocalePath(pathname, locale) + (query ? `?${query}` : "");
        const isActive = locale === current;

        return (
          <Link
            key={locale}
            href={href}
            hrefLang={locale}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors",
              isActive ? "bg-white text-brand-800" : "text-white/80 hover:text-white",
            )}
          >
            <span className="sr-only">{localeNames[locale]}</span>
            <span aria-hidden>{locale}</span>
          </Link>
        );
      })}
    </div>
  );
}
