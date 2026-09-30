import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // None of these are useful in search results, and order pages contain a
      // customer's name, phone number and address.
      disallow: [
        "/api/",
        "/en/admin",
        "/sw/admin",
        "/en/account",
        "/sw/account",
        "/en/order/",
        "/sw/order/",
        "/en/checkout",
        "/sw/checkout",
        "/en/cart",
        "/sw/cart",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
