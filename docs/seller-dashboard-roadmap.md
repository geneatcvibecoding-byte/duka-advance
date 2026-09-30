# Seller dashboard — feature roadmap

The seller dashboard is the seller's command centre: what is live, what has
sold, what money is where, and what needs action. This document lists every
feature built for it, in the order they were implemented, plus what is
deliberately left out.

Everything is scoped to `sellerId = the signed-in user`; a seller can only ever
read or change their own listings, orders, payouts and messages.

## Phase 1 — quick wins (no schema change)

| # | Feature | Where | Notes |
| --- | --- | --- | --- |
| 1 | Pending-actions inbox | `/account/dashboard` | Orders where the seller must act (`FUNDED` → mark handed over) and open disputes, surfaced at the top. Money is stuck until the seller acts, so this is the highest-value widget. |
| 2 | Sales & earnings chart | `/account/dashboard` | 14-day bar chart of paid orders and net earnings, drawn as inline SVG (no chart library). |
| 3 | Payout history | `/account/payouts` | Every `RELEASED` order with gross, platform fee and net, plus lifetime totals, and the payout account it will be sent to. |
| 4 | Top listings | `/account/dashboard` | Listings ranked by number of orders, with thumbnail and sales count. |
| 5 | Ratings received | `/account/reviews` | The individual `SellerRating` rows (stars, comment, buyer, order) behind the average. |
| 6 | Listing search / filter / sort | `/account/listings` | Query, status filter and sort, kept in the URL so links are shareable. |
| 7 | Bulk actions | `/account/listings` | Select many listings and publish / pause / mark sold / remove in one submit. |
| 8 | Edit listing | `/account/listings/[id]/edit` | Reuses `ListingForm` in edit mode; owner-scoped. |
| 9 | Duplicate / relist | `/account/listings` | Clone a listing as a new `ACTIVE` one, or relist a sold item. |
| 10 | Share | Listing detail | WhatsApp share and copy-link buttons. |

## Phase 2 — medium (schema additions)

| # | Feature | Where | Notes |
| --- | --- | --- | --- |
| 11 | Payout account | `/account/payouts` | `User.payoutMethod` / `payoutNumber` / `payoutName`. Where a release is sent. |
| 12 | Listing views | Listing detail, dashboard | `Listing.viewCount`, incremented on each view; shown as a performance signal. |
| 13 | Public seller profile | `/seller/[id]` | Verified badge, trust score, rating, live listings, follow button. |
| 14 | Order messaging | Order page | `OrderMessage` thread between buyer and seller to arrange the campus handover. |
| 15 | Saved listings | `/account/saved` | `SavedListing` — bookmark a listing. |
| 16 | Follow seller | Seller profile | `SellerFollow` — follower count on the profile. |
| 17 | Offers | Listing detail, dashboard | `Offer` — a buyer proposes a price; the seller accepts (creates the escrow order at that price) or declines. |

## Phase 3 — advanced

| # | Feature | Where | Notes |
| --- | --- | --- | --- |
| 18 | In-app notifications | Header bell, `/account/notifications` | `Notification` rows created on escrow transitions and offers; unread count in the header. `Notification.amount` carries the money named in the message, because the text is translated at read time and so cannot contain the number itself. |
| 19 | Auto-release | `GET /api/cron/auto-release` | Releases `DELIVERED` orders older than `AUTO_RELEASE_DAYS` when the buyer goes quiet. Guarded by `CRON_SECRET`. |
| 20 | Featured listings | Admin marketplace | `Listing.featuredUntil`; admin promotes a listing, featured listings sort first and show a badge. |
| 21 | CSV export | `/api/account/orders.csv` | The seller's orders and earnings as a spreadsheet, auth-guarded. |
| 22 | Trust score | Dashboard + seller profile | 0–100 blend of verification, rating and completed sales. |

## Running it

Two migrations, in order — the second builds on the first:

```
npx prisma migrate deploy
npx prisma generate
```

`CRON_SECRET` must be set for the auto-release route to do anything. It is
unauthenticated by design (a scheduler calls it, not a browser), so it rejects
any request without `Authorization: Bearer <CRON_SECRET>`:

```
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-shop.vercel.app/api/cron/auto-release
```

Run it daily. Each call only releases orders that are `DELIVERED` and older than
`AUTO_RELEASE_DAYS`, and it is safe to call repeatedly.

## Deliberately not built

- **Real email/SMS delivery.** Notification rows are written in-app and the
  email send is a `console.info` stub, matching the verification code. Wiring a
  provider (Resend, Beem) is a deployment decision, not a code one.
- **Split payouts across sellers.** One order per seller, by design. See
  `docs/student-marketplace.md`.
- **Chat moderation tooling.** Messages are plain text with length limits.
