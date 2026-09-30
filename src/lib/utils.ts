import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes so later utilities reliably win over earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** ORD-7K3M9P — short, unambiguous when read aloud over the phone. */
export function generateOrderNumber(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  let suffix = "";
  for (let i = 0; i < 7; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ORD-${suffix}`;
}

export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
