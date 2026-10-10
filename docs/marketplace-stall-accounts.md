# Marketplace: Per-Stall Accounts + Operator Sessions

One login account per stall/workspace. After signing in with the stall
account, the human on duty enters their OPERATOR NAME once. The account
authenticates; the name attributes.

```
Stall login (e.g. Stall 1 account)
  → Operator Session Setup: Enter Your Name (+ workspace shown, fixed)
  → Continue to Workspace → Stall 1 dashboard
  → every stock update audited with the entered name + timestamp
  → End shift → next operator enters their own name
```

Floating operators (Head, legacy personal staff) pick the workspace on the
same screen instead — the session pins them to it either way.

## Rules enforced server-side

- The workspace is derived from `marketplace_stall_accounts`, never from
  the request. A stall account sending another workspace id gets 403.
- Mutations (inventory, products, photos, order status) require
  `X-Operator-Session` with an active, unexpired session. Reads do not.
- The operator name on audit rows comes from the validated session.
- One order per workspace per checkout (cart spanning stalls → N orders,
  each with its own reference). Retried checkouts replay the group via the
  shared `RequestKey`.
- Inactive workspaces sell nothing; their history stays readable.
- Stall logins use Role `MarketplaceStaff`: they can operate but can never
  buy (buyer endpoints allow Student/Faculty only).

## New tables (`Database/Marketplace/002_stall_workspaces.sql`)

`marketplace_stall_locations`, `marketplace_workspaces`,
`marketplace_stall_accounts`, `marketplace_operator_sessions`,
`marketplace_inventory_transactions`, plus `WorkspaceId` on
`marketplace_products` / `marketplace_orders` and `RequestKey` on orders.

## Key endpoints

| Method | Route | Who |
|---|---|---|
| GET/POST | `/api/marketplace/workspaces`, `/stall-locations` | buyers browse |
| GET/POST | `/api/marketplace/staff/session`, `/session/end`, `/session/context` | operators |
| GET | `/api/marketplace/staff/inventory/history` | own workspace history |
| GET/POST | `/api/marketplace/head/stall-locations`, `/workspaces/save` | Head |
| POST/DELETE | `/api/marketplace/head/workspaces/{id}/account` (+ `/password`) | Head |
| GET | `/api/marketplace/head/audit` | Head |
| GET | `/api/marketplace/admin/*?workspaceId=` | Admin (read-only) |

## Head screens (`/marketplace/staff/*`, desktop)

Workspaces (locations + stalls + BusinessHub + one login each) and Activity
Log. Operators see an "On duty" bar with End shift; mutations without a
session fail with "Start an operator session first".

## Intentional deviations from the original master prompt

- Per-stall accounts instead of ONE shared credential (approved decision:
  a shared password for all stalls is weaker and unauditable at the login
  layer; per-stall accounts scope by construction).
- Order statuses keep the existing Pickup/CampusDelivery state machine
  (renaming to Accepted/Rejected would ripple through push, chat and
  timelines with no functional gain).
- Chat stays a shared support inbox (not workspace-scoped).
- Stall/location management lives in the Head portal, not the read-only
  Admin monitor (the Admin watches; the Head operates).
