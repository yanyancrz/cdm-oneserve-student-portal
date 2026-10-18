# Campus Services

The four campus services that sit on top of the existing Marketplace module:
canteen pre-ordering, the Paper Shop, the Student/Faculty ID claim, and the
campus card.

Nothing here replaced the marketplace. It reuses its auth, its RBAC, its cart,
its order pipeline and its inventory, and adds what was missing.

---

## What was added

| Feature | Where |
|---|---|
| Canteen menu + pre-order slot | `src/marketplace/buyer/MarketCanteenPage.jsx`, slot picker in `MarketCheckoutPage.jsx` |
| Paper Shop / Supplies category | `Supplies` in `marketVocabulary.js` + `MarketplaceCategories.cs` |
| Campus card balance + ledger | `src/marketplace/buyer/MarketCardPage.jsx` |
| ID claim (buyer) | `src/marketplace/buyer/MarketIdClaimsPage.jsx` |
| Claim verification (counter) | `src/marketplace/staff/MarketStaffClaimsPage.jsx` |
| Campus card top-up (counter) | `src/marketplace/staff/MarketStaffCardsPage.jsx` |
| ID claim queue (counter) | `src/marketplace/staff/MarketStaffIdClaimsPage.jsx` |

The Paper Shop needed **no new table** - `marketplace_products`.`Category` is
already a free string. `Supplies` is a vocabulary value, and the `Paper Shop`
workspace seeded by the migration is where those products live.

---

## Routes

### Buyer (mobile, Student **and** Faculty)

| Route | Screen |
|---|---|
| `/marketplace/canteen` | Canteen menu, pre-order entry |
| `/marketplace/card` | Campus card balance + ledger |
| `/marketplace/id-claim` | File and follow an ID claim |

Reachable from the strip on the marketplace shop page. Deliberately **not** three
more bottom tabs: the bar already overflows into a "More" sheet past four tabs,
so pushing Shop or Cart behind that sheet would cost more than it gains.

### Staff / vendor (operator only, `X-Operator-Session`)

| Route | Screen |
|---|---|
| `/marketplace/staff/claims` | Verify a claim code, release the order |
| `/marketplace/staff/cards` | Find a card, load it, read the ledger |
| `/marketplace/staff/id-claims` | ID claim review queue |

---

## Database

`Database/Marketplace/003_campus_services.sql` in the **API repo**. Apply it
before deploying the frontend:

```
"C:\Program Files\MySQL\MySQL Server 9.7\bin\mysql.exe" -uroot cdm_oneserve < 003_campus_services.sql
```

It is safe to re-run: every `CREATE TABLE` is `IF NOT EXISTS` and every `ALTER`
is guarded by an `information_schema` probe (MySQL has no
`ADD COLUMN IF NOT EXISTS`).

It adds:

- `marketplace_orders` - `IsPreOrder`, `ScheduledFor`, `ClaimCode` (UNIQUE),
  `ClaimedAt`, `ClaimedByUserId`
- `marketplace_campus_cards` - one card per user, `BalanceCentavos` with a
  `CHECK (>= 0)`
- `marketplace_card_transactions` - append-only ledger, each row carrying the
  balance *after* it
- `marketplace_id_claims` - with a UNIQUE generated column that permits only one
  open claim per user
- Two seeded workspaces: `Campus Canteen`, `Paper Shop`

There is **no** new users table and no change to `users`, RBAC or the auth
tables. Every table points at the existing `users`.`Id`.

---

## Rules worth knowing

**Money is integer centavos everywhere**, matching the rest of the module.

**Claim codes** are 8 characters from an alphabet with `0`/`O` and `1`/`I`/`L`
removed, so a code can be read aloud across a counter without being misheard.
The UNIQUE index is the real guard.

**Claim verification is two steps on purpose.** Look up is read-only, so staff
can confirm the code belongs to the person in front of them *before* anything
changes. Release is the mutation. One wrong keystroke must not hand over the
wrong order.

**A campus card is debited only after the stock is safely reserved** in
`PlaceOrderAsync`. Debiting earlier would take the money for an order that might
then fail. The debit is a conditional `UPDATE`, not a read-then-write, so two
simultaneous orders cannot both pass a balance check and overdraw the card.

**Cancelling a card-paid order refunds the card**, and the refund is idempotent -
it only credits when the order actually has a `Debit` on its ledger, so a buyer
and a member of staff racing to cancel cannot pay out twice.

**Releasing a claimed order consumes reserved stock** through the same
`MarketplaceInventoryService.ConsumeAsync` as the normal Completed transition, so
stock is consumed in exactly one place.

**One open ID claim per user** is enforced by the database, not by a
read-then-write check, so two impatient double-taps cannot produce two
replacement IDs.

**Pre-orders are always collected, never delivered.** A booked slot is dropped
if the fulfillment method is campus delivery - a meal taken to a room cannot
honour a 12:00 slot. The window (15 minutes to 7 days ahead) comes from the API
so the UI never hardcodes it.

---

## Auth and RBAC

Unchanged, and deliberately so:

- `[Authorize]` is the existing OneServe JWT. The caller is read from the token,
  never from a body field.
- Role checks live in `MarketplaceAccessService`, not in attributes - the same
  pattern the rest of the module uses.
- Buyer endpoints accept **Student and Faculty**; staff, head and admin tokens
  are refused with a 403.
- Card top-ups, order release and ID claim review all require a live operator
  session (`X-Operator-Session`), so the operator name on the audit trail comes
  from the server-validated session rather than the request.

---

## Not changed

- Login, register, session or token handling.
- `users`, RBAC, or any auth table.
- The existing buyer flow: shop -> cart -> checkout -> orders still works, with
  the slot picker and campus card as additions inside it.
- `src/sw.js` - navigation is network-first with an app-shell fallback and the
  new screens land in the content-hashed bundle covered by `globPatterns`, so no
  PWA change was needed.
