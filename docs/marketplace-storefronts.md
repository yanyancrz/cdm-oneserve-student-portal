# Storefronts — Phase 0 of the CampusMarket port

Multi-store seller storefronts with named team permissions, layered on top of the
existing workspace-scoped marketplace.

Created by `Database/Marketplace/006_storefronts.sql` (+ `007`, `008`) in the
**API repo**, consumed by `src/marketplace/buyer/MarketStore*Page.jsx`.

**No online payments.** Cash and campus card only, by decision.

---

## Why this is a new layer, not a rename

`marketplace_workspaces` is a **fulfilment container**: where stock lives and
which stall terminal is pinned to it. No owner, no team, no public page.

A **storefront** is a seller's shopfront: who owns it, who works there, what it
sells, how it looks to a buyer.

**The bridge is `marketplace_stores`.`WorkspaceId`.** A store fronts exactly one
workspace, so every existing workspace-scoped behaviour — reserved stock, the
order state machine, operator duty shifts, the staff order queue — keeps working
without modification. Products, stock and orders stay where they already are.

A store can be **paused or banned to stop people ordering without touching a
single inventory or order row**.

---

## Two different kinds of "staff" — both still exist

| | `marketplace_stall_accounts` | `marketplace_store_members` |
|---|---|---|
| What it is | a **shared terminal login** | a **person with permissions** |
| Scoped to | exactly one workspace | one or more stores |
| Identified by | `Role = MarketplaceStaff` | a row per (store, person) |
| Answers | "which terminal is this account?" | "what may this person do in this shop?" |

They are not substitutes. A store member with the `orders` permission may operate
the store's workspace; a stall login is what a shared counter terminal signs in
with.

---

## The five permissions

`catalog` · `orders` · `cash` · `analytics` · `delivery`

Closed list, enforced by a `CHECK` constraint in the database as well as by
`MarketplaceStorePermissions` in C#, so a bad write cannot invent a sixth.

**The owner is not a member row.** Ownership lives on
`marketplace_stores`.`OwnerUserId` and implies all five, so an owner can never be
edited out of their own store, never lose a permission by accident, and never
appear twice in the team list. The team screen renders them as a synthetic locked
first row.

**Permissions are replaced wholesale on save**, not merged. A tick the owner
unticks really stops applying — there is no partial merge to reason about.

---

## Routes

| Route | Audience | Screen |
|---|---|---|
| `/marketplace/stores` | any buyer | Browse storefronts, by sales |
| `/marketplace/stores/:storeId` | any buyer | One storefront |
| `/marketplace/stores/:storeId/team` | **owner only** | Team, permissions, applications |
| `/marketplace/staff/stores` | **Head only** | Create/edit storefronts, assign owners |

The team screen lives on the **buyer** side because a store owner is a Student or
Faculty account in this model, not a marketplace staff login. The server refuses
a non-owner with a 403 regardless.

The `Stores` tab sits fourth in the bottom bar, so `Shop / Cart / Orders /
Stores` stay as pill tabs and `Help` moves into the "More" sheet — the nav's
existing overflow behaviour, not a new pattern.

The Head's `Storefronts` screen sits next to `Workspaces` in the staff bar,
because a storefront is the public face of a workspace.

---

## Endpoints

All under `api/marketplace/stores`. `[Authorize]` is the plain OneServe JWT; the
caller is always read from the token, never from a body field.

| Method | Path | Gate |
|---|---|---|
| `GET` | `/` | any signed-in account |
| `GET` | `/manage` | **Head only** — every storefront, including banned/deleted |
| `GET` | `/{storeId}` | any; banned/deleted is 404 for non-staff |
| `POST` | `/` | **Head only** — create/edit a storefront |
| `GET` | `/{storeId}/team` | owner |
| `POST` | `/{storeId}/team` | owner |
| `POST` | `/apply` | Student/Faculty |
| `GET` | `/{storeId}/applications` | owner |
| `POST` | `/applications/{id}/review` | owner (store id read from the row, never the route) |
| `GET` | `/{storeId}/categories` | any |
| `POST` | `/{storeId}/categories` | needs `catalog` |
| `GET` | `/products/{id}/photos` | any |
| `POST` | `/products/{id}/photos` | needs `catalog` on the product's store |
| `DELETE` | `/photos/{id}` | needs `catalog` on the product's store |

`GET /manage` exists because `GET /` deliberately hides banned and deleted
storefronts from buyers — but an administrator who cannot *see* a banned
storefront can never unban it. The two audiences need opposite visibility.

`manage` cannot collide with `{storeId:int}`: it is not an int.

---

## Ownership is a user id, not a picker

A storefront owner is not limited to marketplace staff — a Student or Faculty
account can own one — so there is no sensible short list for a dropdown. Both
the Head screen and the store Team screen ask for the numeric id from
**Admin > Users** instead.

Stores seeded without an owner were assigned to the Marketplace Head, so nobody
is locked out of a team screen while an owner is being designated.

---

## Per-store delivery is display-only right now

`marketplace_stores.DeliveryEnabled` and `DeliveryFeeCentavos` exist and are
shown on the storefront card, but **checkout reads `marketplace_settings`** for
the fee. The flag is stored, validated and rendered — it is just not consulted at
checkout yet.

The seed therefore leaves delivery **off** on every store, so the storefront never
advertises campus delivery that checkout would not honour. Wiring checkout to
respect the per-store flag is part of the order-lifecycle phase.


---

## Selling rules

- Only `status = active` is orderable. **Paused stays listed but is flagged**, so
  a stall link a buyer followed explains itself instead of 404-ing.
- The owner may pause and reopen their own store. An administrator bans, and
  **unbanning lands on `paused`** — reopening is deliberately the owner's call.
- `banned` and `deleted` are not reachable from a save form.
- Sales rank stores, and only **completed orders with settled payment** count.
  Cancelled and unpaid contribute nothing, so the top of the list is a store
  people actually buy from.

---

## Categories

`marketplace_categories.StoreId` **null** = a system category, valid anywhere.
That is what the legacy `SubCategory` strings backfilled into, so the 16
pre-existing products keep working untouched.

`products.CategoryId` is **nullable**. A product may use a system category (the
old behaviour) or one belonging to its own store; a category from a *different*
store is refused.

A store can never rename a system category — that would silently change every
other store's catalogue.

---

## Product photos

`products.ImageUrl` stays the primary image so nothing that already reads it
breaks. `marketplace_product_photos` holds the gallery: **HTTPS only, at most 8
per product**, ordered by `SortOrder`.

---

## Three bugs hit while building this, and their fixes

**1. `UNIQUE(StoreId, Name)` does not dedupe NULLs.** A system category *is* a
row where `StoreId IS NULL`, and MySQL/MariaDB treats every NULL as distinct. The
backfill ran on every deploy and tripled the table (13 → 39 rows).
**Fix:** generated column `StoreKey = COALESCE(StoreId, 0)`. → `007`

**2. The index could not be dropped.** `ERROR 1553` — `FK_Product_Category` is
bound to it and MariaDB will not drop an FK's index.
**Fix:** the working rule goes on under a new name; the ineffective one stays.

**3. Overlapping foreign keys.** `store_members.StoreId` was the FK to *two*
principals — the store, and the permissions table. EF cannot resolve that and
silently created a shadow property, giving
`Unknown column 'm0.MarketplaceStoreMemberStoreId'` on **every query that loads a
member**. This was **invisible at build time** and only appeared at runtime.
**Fix:** surrogate `MemberId` key, natural key kept as a `UNIQUE`. → `008`

All three migrations are safe to re-run.

---

## Not done yet

- **Seller onboarding** (`seller_applications`, identity verification) — Phase 2
- **Category management UI** — the endpoint works, but there is no screen for
  adding/renaming a store's sections
- **Main FoodHub has 0 products** — the other four storefronts are stocked
- Order lifecycle, reviews, refunds, moderation and the email outbox are all
  still ahead in the phase plan.

---

## Not built on purpose

The CampusMarket original was never production-ready. These are missing there too
and are deliberately not attempted:

- Native apps (Windows exe does not exist, iOS unbuilt, Android APK last run
  failed)
- Seller settlement / payouts
- Partial refunds
- Review moderation
- Full-text search (its catalog search was a client-side substring over a full
  dataset fetch)
- The 90-day seller order cap (a bug, not a feature)
