# Duka — Tanzanian e-commerce, phase 1

A bilingual (English / Kiswahili) online shop built for the Tanzanian market.
Phase 1 is a complete, working shop **without any online payment processing** —
customers order and pay through channels that need no payment API. The payment
layer is written as an interface, so adding M-Pesa in phase 2 does not touch
checkout, orders, or the admin panel.

**Deploying?** See [DEPLOY.md](DEPLOY.md).

## Running it

Needs a Postgres database. Copy `.env.example` to `.env` and fill in
`DATABASE_URL` and `DIRECT_URL` — a free Supabase or Neon project takes about
two minutes.

```bash
npm install
```

```bash
npm run db:migrate && npm run db:seed
```

```bash
npm run dev
```

Open http://localhost:3000 — it redirects to `/en`. Swahili is at `/sw`.

### Sign-in details from the demo seed

| Role     | Phone         | Password        |
| -------- | ------------- | --------------- |
| Admin    | 0700 000 001  | `Admin@2026`    |
| Customer | 0712 000 001  | `Customer@2026` |

The admin panel is at `/en/admin`.

> These are for local development only. Production uses
> `npm run db:seed:prod`, which creates no demo data and takes the admin
> password from an environment variable — see [DEPLOY.md](DEPLOY.md).

### Database commands

| Command                | What it does                                          |
| ---------------------- | ------------------------------------------------------ |
| `npm run db:migrate`   | Create and apply a migration in development             |
| `npm run db:deploy`    | Apply existing migrations — use this in production      |
| `npm run db:seed`      | Demo catalogue: 6 categories, 22 products, test users   |
| `npm run db:seed:prod` | Production: delivery zones, settings, one real admin    |
| `npm run db:reset`     | Drop, re-migrate and re-seed (destroys all data)        |
| `npm run db:studio`    | Browse the database in a GUI                            |

## What phase 1 includes

**Storefront**
- Home page with featured products, category grid, and trust points
- Catalogue with category, price-range, in-stock and sort filters, plus paging
- Search across names, descriptions, brand and SKU
- Product pages with options (size/colour), image gallery, reviews, related items
- Cart that survives without an account, kept in a cookie
- Checkout with all 31 Tanzanian regions and their districts
- Live delivery pricing per region, with a free-delivery threshold
- Discount codes
- Order confirmation with payment instructions per method
- Public order tracking by order number + phone
- Customer accounts: profile, order history, saved addresses, wishlist
- Delivery, returns, terms and privacy pages
- Full English/Kiswahili translation with a header switcher

**Admin panel** (English only — see "Design decisions")
- Dashboard: paid revenue, orders, low stock, pending work
- Orders: filter, search, status and payment updates, internal notes, call/WhatsApp the customer
- Products: create, edit, images, per-option stock, delete/hide
- Categories, discount codes, delivery zones per region
- Customers: search, disable, reset a password
- Reviews: approve or delete before they appear publicly
- Shop settings: names, contacts, till numbers, bank details, free-delivery threshold

## The four phase-1 payment methods

None of these need a payment API. All are chosen at checkout:

| Method     | How the money actually moves                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `COD`      | Rider collects cash on delivery.                                                                   |
| `TRANSFER` | Customer sends to your Lipa Namba / Tigo Pesa / Airtel / HaloPesa / bank, then types the reference. An admin confirms it against the statement. |
| `WHATSAPP` | Cart becomes a pre-filled WhatsApp message to the shop; payment is arranged in the chat.          |
| `PICKUP`   | Customer reserves online and pays at the counter.                                                  |

Till numbers and bank details shown to customers come from **Admin → Settings**,
not from code.

> A customer-submitted transaction reference never marks an order paid by
> itself. It sets the order to `AWAITING_CONFIRMATION`; only an admin marking it
> `PAID` counts it as revenue. That is deliberate — anyone can type a code.

## Phase 2: adding M-Pesa

The work is already scoped to three places:

1. **`src/lib/payments/providers.ts`** — the `MpesaOnline` class. Implement
   `initiate()` against Vodacom's Daraja/OpenAPI, or an aggregator such as
   Selcom or ClickPesa that covers all four networks under one contract.
2. **`src/app/api/payments/[provider]/callback/route.ts`** — the async result
   endpoint. It already refuses traffic while the provider is disabled, is
   idempotent against retried callbacks, and writes the order event trail.
   Replace the shared-secret check with the provider's real signature scheme.
3. **`.env`** — set `MPESA_ENABLED=true` and fill the credentials.

Nothing else changes. Checkout renders whatever `enabledProviders()` returns,
and shows disabled online providers as "coming soon", so the option appears the
moment it is switched on.

## Search engines

- `/sitemap.xml` is generated from the live catalogue, listing every product
  and category in both languages with `hreflang` alternates, so Google treats
  the English and Swahili pages as translations rather than duplicates.
- `/robots.txt` blocks the admin panel, accounts, cart, checkout and order
  pages — order pages contain a customer's name, phone number and address.
- Product pages emit `Product` JSON-LD with price, TZS currency, stock status
  and aggregate rating, which is what makes Google show those directly in the
  result rather than just a blue link.

## Product images

Uploads go through a driver interface, chosen from the environment the same way
payment providers are:

- **Supabase Storage** — used whenever `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` are set. Required on Vercel.
- **Local disk** (`public/uploads`) — development and any VPS with a real disk.
  Deliberately disables itself when `VERCEL=1`, because that filesystem is
  wiped on every deploy and photos would vanish silently.

The admin product page shows which driver is active.

The upload endpoint checks, in order: that the caller is an admin, that the
file is 5MB or under, and that the **leading bytes are really a JPEG, PNG or
WebP**. The browser-supplied Content-Type is never trusted — anyone can set it
to anything. Filenames are generated UUIDs and the destination folder is
whitelisted, so an upload cannot traverse out of its bucket or overwrite an
existing file.

## Security

- **Sign-in throttling.** Five failed attempts against one phone number, or
  twenty from one IP, block further tries for fifteen minutes. Both limits
  matter: the first stops guessing at one account, the second stops one common
  password being sprayed across many numbers. Tanzanian mobile numbers are a
  small, guessable space, so an unthrottled login form is genuinely
  enumerable. Attempts are stored in Postgres, not memory, because serverless
  instances do not share memory — an in-process counter is bypassed by simply
  retrying until the request lands on a cold instance. A correct password
  clears the account's failure history, so a customer who fumbled four times is
  not locked out on their next visit.
- Sign-in failures return one message whether the number is unknown or the
  password is wrong, so the form cannot be used to test which numbers exist.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS) are set in `next.config.ts`.
- Every admin server action re-checks the admin role. The layout guard only
  protects rendering; a server action is a public endpoint.

## Design decisions worth knowing

**Money is stored as whole shillings (`Int`).** TZS has no subunit in practice,
so there are no cents to round and no floating-point drift.

**Prices are never trusted from the browser.** The cart cookie holds only
product ids and quantities; every price, discount and delivery fee is
recalculated server-side in `placeOrderAction` before the order is written.

**Stock is decremented inside the order transaction**, with a
`stock: { gte: quantity }` guard, so two shoppers racing for the last item
cannot both succeed.

**Forms work without JavaScript.** Add-to-cart, cart quantities, filters and
checkout are real form submissions with server actions. Client hooks only add
spinners and inline confirmations. This matters on the low-end handsets and
patchy connections much of the market uses.

**Products that have been ordered are hidden, not deleted**, so historic orders
keep their catalogue link. Same for categories that still hold products.

**The admin panel is English-only.** Shop staff work in one language, and
translating it would double the maintenance for no customer benefit. Customer-
facing text is fully bilingual, including product names and descriptions, which
have separate English and Swahili columns.

**Order numbers** (`ORD-7K3M9P2`) avoid `I`, `O`, `0` and `1` so they are
unambiguous read aloud over the phone. Order pages are reachable by that number
alone — a deliberate trade so guests can track without an account. Tracking by
form additionally requires the phone number.

**Product images are `<img>`, not `next/image`.** The seeded artwork is SVG,
which `next/image` cannot optimise. Once the client uploads real photographs,
switching is worthwhile — that is what the 11 lint warnings are pointing at.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 ·
Prisma 7 · Postgres · bcryptjs + jose for auth.

## Database connections

Two URLs, and they are not interchangeable:

- **`DATABASE_URL`** — Supabase's transaction pooler (port 6543). The running
  app uses this. Serverless functions open a connection per invocation, so a
  direct pool would exhaust Postgres's connection limit under load.
- **`DIRECT_URL`** — the direct connection (port 5432). Migrations and seeding
  use this, because pgbouncer cannot run the DDL and advisory locks they need.

Neither is required at build time: every route is server-rendered on demand, so
`next build` succeeds with no database reachable.

## Not in phase 1

Deliberately out of scope, listed so nothing is assumed:

- Online payment capture (that is phase 2)
- SMS or email notifications — the shop calls customers instead
- Image uploads to cloud storage; images are referenced by URL or served from `/public`
- Multi-currency, multi-vendor, or delivery-partner integrations
