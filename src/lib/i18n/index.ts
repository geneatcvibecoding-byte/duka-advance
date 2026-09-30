import { dictionaries, type TranslationKey } from "./dictionaries";
import { defaultLocale, isLocale, type Locale } from "./config";

export * from "./config";
export type { TranslationKey };

export type Translator = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => string;

/**
 * Returns a translate function for the given locale.
 * `{name}` placeholders in the string are replaced from `vars`.
 */
export function getTranslator(locale: Locale): Translator {
  const dict = dictionaries[locale] ?? dictionaries[defaultLocale];
  return (key, vars) => {
    let value: string = dict[key] ?? dictionaries[defaultLocale][key] ?? key;
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
    }
    return value;
  };
}

/** Coerce an unknown route segment into a supported locale. */
export function resolveLocale(value: string | undefined): Locale {
  return value && isLocale(value) ? value : defaultLocale;
}

/**
 * Choose between the English and Swahili column of a database row.
 * Falls back to English when a Swahili translation is missing.
 */
export function pick(locale: Locale, en: string, sw: string): string {
  return locale === "sw" ? sw || en : en;
}

export function pickOptional(
  locale: Locale,
  en: string | null | undefined,
  sw: string | null | undefined,
): string | null {
  const value = locale === "sw" ? sw || en : en;
  return value ?? null;
}

/** Build a locale-prefixed href: link("sw", "/cart") -> "/sw/cart" */
export function link(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}

/** Swap the locale on the current pathname, keeping the rest of the route. */
export function switchLocalePath(pathname: string, next: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = next;
  } else {
    segments.unshift(next);
  }
  return `/${segments.join("/")}`;
}

export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "sw" ? "sw-TZ" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "sw" ? "sw-TZ" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
