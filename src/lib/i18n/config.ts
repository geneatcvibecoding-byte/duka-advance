export const locales = ["en", "sw"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  sw: "Kiswahili",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  sw: "🇹🇿",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
