"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { buttonStyles } from "@/components/ui";

/**
 * Share a listing. WhatsApp is the channel that actually works in Tanzania, so
 * it gets a plain link; copy-link is the fallback for everywhere else.
 *
 * The absolute URL is resolved in the click handlers rather than during render:
 * the page is server-rendered, so `window` does not exist on the first pass and
 * using it there would produce a different href on the client.
 */
export function ShareButtons({
  url,
  title,
  labels,
}: {
  url: string;
  title: string;
  labels: { whatsapp: string; copy: string; copied: string };
}) {
  const [copied, setCopied] = useState(false);

  function absolute() {
    return new URL(url, window.location.origin).href;
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${title} — ${absolute()}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(absolute());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked by permissions; the WhatsApp button still works.
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={shareWhatsApp}
        className={buttonStyles("secondary", "sm")}
      >
        <Share2 size={15} aria-hidden />
        {labels.whatsapp}
      </button>
      <button type="button" onClick={copy} className={buttonStyles("secondary", "sm")}>
        {copied ? <Check size={15} aria-hidden /> : <Link2 size={15} aria-hidden />}
        {copied ? labels.copied : labels.copy}
      </button>
    </div>
  );
}
