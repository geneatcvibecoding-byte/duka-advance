# Going live

Target: **Vercel** (app) + **Supabase Postgres** (database).

Steps 1 and 2 need your accounts, so you have to do those. Everything after
can be run for you.

---

## 1. Create the Supabase database

1. https://supabase.com/dashboard → **New project**.
   - Region: **eu-central-1 (Frankfurt)** or **eu-west-2 (London)** — the
     closest Supabase regions to Tanzania. Avoid US regions; every database
     round trip crosses the Atlantic twice.
   - Save the database password it generates.
2. **Project Settings → Database → Connection string**, and copy two of them:

   | Copy this            | Into          | Port |
   | -------------------- | ------------- | ---- |
   | Transaction pooler   | `DATABASE_URL` | 6543 |
   | Direct connection    | `DIRECT_URL`   | 5432 |

   Append `?pgbouncer=true&connection_limit=1` to the pooler one.

> Why two: Vercel functions open a connection per request and would exhaust
> Postgres's connection limit, so the app goes through the pooler. But pgbouncer
> can't run the DDL and advisory locks migrations need, so migrations use the
> direct connection.

**On SSL:** Supabase's connection strings end in `sslmode=require`, which is
correct. `node-postgres` currently prints a deprecation warning about it and
will eventually treat `require` as `verify-full`. If a future dependency bump
ever turns that warning into a connection error, append
`&uselibpqcompat=true` to both URLs to keep today's behaviour.

**On dropped connections:** the pool in `src/lib/db.ts` is deliberately tuned
(`idleTimeoutMillis`, `maxLifetimeSeconds`) to retire connections before the
pooler hangs up on them. Without that you get intermittent
`P1017: Server has closed the connection` errors under light traffic — this was
observed and fixed during development, so do not "simplify" those settings away.

## 1b. Create the image storage bucket

Supabase → **Storage** → New bucket:

- Name: `product-images`
- **Public bucket: on.** Product photos are meant to be publicly readable;
  a private bucket would need signed URLs for every image on every page.

Then from **Project Settings → API**, copy the `service_role` key.

> The service role key bypasses row-level security. Set it only as
> `SUPABASE_SERVICE_ROLE_KEY` on the server — never as a `NEXT_PUBLIC_`
> variable, or it ships to every visitor's browser.

Without this, product image uploads fail on Vercel: its filesystem is wiped on
every deploy, so the local-disk fallback would lose every photo the client
uploaded. The admin panel says which driver is active on the product page.

## 2. Log in to the CLIs

```bash
vercel login
```

```bash
gh auth login
```

---

## 3. Push the code

```bash
gh repo create duka --private --source=. --remote=origin --push
```

## 4. Apply the schema and seed production

Put the two Supabase URLs into `.env` first, then set an admin password
(12+ characters) in `ADMIN_PASSWORD` and check `ADMIN_NAME` / `ADMIN_PHONE`.

```bash
npm run db:deploy
```

```bash
npm run db:seed:prod
```

That creates the 31 delivery zones, a shop settings row, and **one** admin from
your env vars. No demo products, no known password. It is safe to re-run.

## 5. Deploy

```bash
vercel link
```

Then add the environment variables to Vercel — Production scope:

| Variable               | Value                                              |
| ---------------------- | -------------------------------------------------- |
| `DATABASE_URL`              | Supabase transaction pooler (6543)             |
| `DIRECT_URL`                | Supabase direct connection (5432)              |
| `AUTH_SECRET`               | the 64-char value from your local `.env`       |
| `NEXT_PUBLIC_SITE_URL`      | `https://<your-project>.vercel.app`            |
| `SUPABASE_URL`              | `https://<project>.supabase.co`                |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key — server-side only            |
| `SUPABASE_STORAGE_BUCKET`   | `product-images`                               |

Do **not** add `ADMIN_PASSWORD` or the other seed variables — they are only for
running the seed from your machine.

```bash
vercel --prod
```

---

## 6. First run checklist

1. Sign in at `/en/admin` with the phone and password from step 4.
2. **Settings** → fill in the shop name, phone, WhatsApp, shop address, and the
   real till numbers (M-Pesa Lipa Namba, Tigo Pesa, Airtel, HaloPesa, bank).
   Until these are set, the transfer checkout screen has nothing to show.
3. **Delivery** → check the fees. They are estimates, not your real courier costs.
4. **Categories**, then **Products** → add the real catalogue.
5. Place one test order end to end and confirm it in the admin panel.
6. Read the returns, terms and privacy pages. They are sensible defaults, not
   legal advice — have them reviewed before you take real money.

## Custom domain

Vercel → Project → Settings → Domains. For a `.co.tz` domain, point the
nameservers or add the A/CNAME records your registrar gives you. Then update
`NEXT_PUBLIC_SITE_URL` and redeploy, so order-tracking links use the real domain.

---

## Later: turning on M-Pesa

Three places, described in `README.md`:

1. `MpesaOnline.initiate()` in `src/lib/payments/providers.ts`
2. `src/app/api/payments/[provider]/callback/route.ts` — already idempotent
3. `MPESA_ENABLED=true` plus credentials in Vercel

Checkout renders whatever `enabledProviders()` returns, so the option appears
the moment it is switched on. Nothing else changes.

## Rollback

```bash
vercel rollback
```

Database migrations are not rolled back by that. Take a Supabase backup before
applying any future migration that drops or renames a column.
