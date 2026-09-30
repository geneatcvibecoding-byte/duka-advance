"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { buttonStyles } from "@/components/ui";

/**
 * Catches a failure anywhere in the storefront — most likely the database
 * being briefly unreachable. Bilingual, because at this point we cannot rely
 * on the locale having loaded.
 */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Vercel collects this from the function logs.
    console.error("Storefront error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-bold text-ink-900">
        Something went wrong · Kuna hitilafu imetokea
      </h1>
      <p className="mt-2 leading-relaxed text-ink-600">
        Please try again. If it keeps happening, call us and we will take your
        order over the phone.
        <br />
        <span className="text-ink-500">
          Tafadhali jaribu tena. Ikiendelea, tupigie na tutapokea oda yako kwa simu.
        </span>
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className={buttonStyles("primary", "md")}>
          <RefreshCw size={17} aria-hidden />
          Try again · Jaribu tena
        </button>
        <Link href="/en" className={buttonStyles("secondary", "md")}>
          Home · Mwanzo
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-6 font-mono text-xs text-ink-400">
          Reference: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
