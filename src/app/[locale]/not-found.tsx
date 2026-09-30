import Link from "next/link";
import { buttonStyles } from "@/components/ui";

/**
 * Rendered for unknown routes under a locale. It cannot read `params` (Next
 * renders not-found outside the segment), so it stays language-neutral by
 * showing both languages rather than guessing wrong.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-brand-600">404</p>

      <h1 className="mt-4 text-xl font-bold text-ink-900">
        Page not found · Ukurasa haujapatikana
      </h1>
      <p className="mt-2 max-w-md leading-relaxed text-ink-600">
        The page you are looking for does not exist or has moved.
        <br />
        <span className="text-ink-500">
          Ukurasa unaoutafuta haupo au umehamishwa.
        </span>
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/en" className={buttonStyles("primary", "md")}>
          Home
        </Link>
        <Link href="/sw" className={buttonStyles("secondary", "md")}>
          Mwanzo
        </Link>
      </div>
    </div>
  );
}
