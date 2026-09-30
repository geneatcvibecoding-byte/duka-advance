"use client";

import { useEffect } from "react";

/**
 * Count one view of a listing.
 *
 * Done from the client rather than in the page body so the render stays a pure
 * read: a page that writes to the database during render is a page that can
 * mutate state on a prefetch.
 */
export function ListingViewPing({ listingId }: { listingId: string }) {
  useEffect(() => {
    const body = JSON.stringify({ listingId });
    void fetch("/api/marketplace/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  }, [listingId]);

  return null;
}
