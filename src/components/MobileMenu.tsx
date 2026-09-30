"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export type MobileMenuLink = { href: string; label: string };

/**
 * Closing on click rather than on a pathname effect: the drawer shuts the
 * moment the link is tapped, and there is no cascading render after navigation.
 */
function DrawerLink({
  item,
  onNavigate,
  muted,
}: {
  item: MobileMenuLink;
  onNavigate: () => void;
  muted?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={
        muted
          ? "block rounded-lg px-3 py-2 text-ink-700 hover:bg-ink-100"
          : "block rounded-lg px-3 py-2.5 font-medium text-ink-900 hover:bg-ink-100"
      }
    >
      {item.label}
    </Link>
  );
}

/**
 * Slide-over navigation for phones. Labels arrive already translated so the
 * dictionaries stay out of the client bundle.
 */
export function MobileMenu({
  openLabel,
  closeLabel,
  primary,
  categoriesLabel,
  categories,
  account,
}: {
  openLabel: string;
  closeLabel: string;
  primary: MobileMenuLink[];
  categoriesLabel: string;
  categories: MobileMenuLink[];
  account: MobileMenuLink[];
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // A background that still scrolls behind an open drawer feels broken.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={openLabel}
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden"
      >
        <Menu size={22} aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-900/50"
          />

          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
              <span className="font-semibold text-ink-900">{openLabel}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <nav className="flex-1 px-2 py-3">
              <ul>
                {primary.map((item) => (
                  <li key={item.href}>
                    <DrawerLink item={item} onNavigate={close} />
                  </li>
                ))}
              </ul>

              <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
                {categoriesLabel}
              </p>
              <ul className="mt-1">
                {categories.map((item) => (
                  <li key={item.href}>
                    <DrawerLink item={item} onNavigate={close} muted />
                  </li>
                ))}
              </ul>

              <ul className="mt-4 border-t border-ink-200 pt-3">
                {account.map((item) => (
                  <li key={item.href}>
                    <DrawerLink item={item} onNavigate={close} />
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
