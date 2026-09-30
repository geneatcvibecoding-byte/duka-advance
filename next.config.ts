import type { NextConfig } from "next";
import { defaultLocale } from "./src/lib/i18n/config";

const nextConfig: NextConfig = {
  output: "standalone",

  // node-postgres uses Node built-ins (net, tls, dns) that must not be bundled.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],

  async redirects() {
    return [
      // Every page lives under a locale, so the bare root has to pick one.
      { source: "/", destination: `/${defaultLocale}`, permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Send the full URL only to ourselves; other sites see the origin.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
