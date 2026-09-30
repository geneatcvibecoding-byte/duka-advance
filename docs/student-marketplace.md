# Duka Campus — student marketplace

The original Lean Canvas was written for US college students. This is the
Tanzanian retarget, and the spec that the code in this repo implements.

## What changed from the original canvas, and why

| Original canvas | Tanzanian reality | What we build |
| --- | --- | --- |
| `.edu` email verification | There is no `.edu`; universities use domains like `udsm.ac.tz` | A 6-digit code emailed to the address, hashed and expiring |
| "Proprietary `.edu` verification integrated with university databases" | No university exposes a student-roster API to a private startup. The original unfair-advantage claim was not achievable | Verification proves a *mailbox* on a university domain. It is a real trust signal, but it is not exclusive, and the schema says so |
| Escrow via a payment provider | M-Pesa, Tigo Pesa, Airtel Money, Halopesa. No PSP is integrated | An escrow state machine with an admin reconciliation step per leg. This matches the payment abstraction the shop already uses |
| Campus ambassadors | Per-campus growth is an ops program | A `University` record. Ambassador tooling is deliberately not built |
| Multiple sellers per cart | Multi-seller escrow needs split payouts | One order per seller, so payout accounting is unambiguous |

## Assumptions to re-check before launch

These are judgement calls, not facts. Each one can invalidate part of the model.

1. **Escrow without a PSP requires a trust account.** Holding buyer money in a
   merchant account and paying sellers later is a regulated activity. Before
   real volume, this needs a PSP agreement or a legal opinion. The code models
   the *workflow*; it does not make the activity lawful.
2. **Manual reconciliation does not scale.** Each escrow leg is a human
   confirming a mobile-money reference. That is fine for a pilot on one campus
   and breaks at volume. This is the single biggest known weakness.
3. **University domains are not a complete student list.** Staff and alumni
   keep addresses. The `role` claim in the code is user-asserted and unverified.
4. **Commission is unvalidated.** The "5-8%" figure in the original canvas had
   no traceable source. The rate is a single configurable field
   (`ShopSettings.marketplaceFeePercent`) precisely so it can be measured
   instead of assumed.
5. **"Unfair advantage" is thin.** Anyone can email a code at a university
   domain. The defensible assets, if any, will be per-campus liquidity and
   seller relationships — neither of which is code.

## Data model

- `University` — campus record, with the email domain students use.
- `User` gains `universityId`, `studentVerifiedAt`, `studentNumber`.
- `StudentVerificationCode` — hashed 6-digit codes with `expiresAt`.
- `Listing` — a seller's item. Reuses `Category` so the admin panel keeps working.
- `ListingImage` — same storage driver as product images.
- `Order` gains `sellerId` and the escrow fields. `sellerId` is nullable: null
  means the shop's own stock, which keeps existing shop orders valid.

## Escrow state machine

Defined in `src/lib/escrow.ts`, and the only place that may advance escrow.

```
AWAITING_FUNDING   buyer has not paid (or has submitted a reference, unconfirmed)
FUNDED             admin confirmed the buyer's mobile-money reference
DELIVERED          seller handed over; awaiting buyer confirmation
RELEASED           buyer confirmed; seller paid out
REFUNDED           returned to buyer
DISPUTED           buyer or seller disputed; frozen until admin resolves
```

The money legs in order:

1. Buyer sends mobile money to a platform number and submits the reference
   (`submitEscrowRefAction`). Nothing moves yet.
2. An admin checks the reference against the account and confirms it
   (`fundEscrowAction`) → `FUNDED`.
3. Seller hands the item over and marks it (`markDeliveredAction`) → `DELIVERED`.
4. Buyer confirms receipt (`releaseEscrowAction`) → `RELEASED`. An admin may also
   release after `AUTO_RELEASE_DAYS` when the buyer goes quiet.
5. An admin may refund before release, or resolve a `DISPUTED` order either way.

Guards, in one place:

- The buyer never moves money in the model — only the admin's confirmation does.
- Only `FUNDED` may become `DELIVERED`.
- Only `DELIVERED` may become `RELEASED` or `DISPUTED`.
- Only `AWAITING_FUNDING` or `FUNDED` may become `REFUNDED`.
- `DISPUTED` is frozen until an admin resolves it to `RELEASED` or `REFUNDED`.
- Only the platform's admin role may confirm funding or release funds.
- Buyers may only confirm delivery on their own order; sellers may only mark
  handed-over on orders for their own listings.

## Applying the migration

`prisma/migrations/20260928000000_student_marketplace/` was written by hand
because no live database was reachable when the feature was built. Apply it with
`npm run db:deploy` (or `db:migrate` in development) against a real database
before running the app, then `npm run db:seed` to load the universities and the
verified demo student.

## Security notes

- Verification codes are stored as bcrypt hashes, never plaintext, and are
  single-use with a 15-minute expiry.
- Rate limits reuse the existing `LoginAttempt` mechanism.
- Every Server Action re-checks authorisation inside the action body, because
  Server Functions are reachable by direct POST.
- Listings are owner-scoped on every read and write.
