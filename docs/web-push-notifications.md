# Browser Push Notifications (Web Push / VAPID)

Standard Web Push Protocol (RFC 8030 / RFC 8188 / RFC 8292). No Firebase, no cloud account.

---

## Architecture

Two options were considered. **This implementation uses the dedicated Node service** because the requirement was to keep the official `web-push` library, and because it keeps the VAPID private key out of the ASP.NET host that also serves the app and holds every business table.

### Chosen: ASP.NET Core outbox + dedicated Node delivery service

```
 React PWA (src/sw.js)
   │  PushManager.subscribe({ applicationServerKey: PUBLIC })
   ▼
 POST /api/push/subscribe  (Authorization: Bearer <JWT>)
   ▼
 MySQL PushSubscriptions ───────────────────────────────┐
                                                        │
 Business event (Lost&Found / Library / Guidance /      │ readable
 Marketplace / Account verification)                   │
   │ PushDispatcher.EnqueueAsync(...)                   │
   ▼                                                    │
 MySQL PushOutbox   (Pending, deduped)                 │
   │                                                    │
   └──────────────────────────┐                         │
                              ▼                         ▼
                  cdm-oneserve-push-service (Node)  web-push
                  polls PushOutbox                  setVapidDetails()
                  claims atomically                  sendNotification()
                  retries w/ backoff
                  404/410 → IsActive = 0
                              │
                              ▼
                      Push service (FCM/Mozilla)
                              ▼
                     browser sw.js 'push' handler
                              ▼
                     notificationclick → internal page
```

### Rejected: sending from ASP.NET Core directly

Rejected because it needs `Lib.Net.Http.WebPush` instead of the requested official `web-push` library, and because it would put the VAPID private key in `appsettings.json` next to the JWT key and the SMTP password. If the campus ever wants a **.NET-only** deployment instead, the change is small: swap `src/sender.js` for a `WebPushClient` and skip the Node process entirely — the `PushOutbox` schema, API surface and React code all stay identical. That is the reason for the outbox.

---

## What was there before

- A **module-scoped** `LostFoundPushSubscriptions` table and subscribe/unsubscribe endpoints existed but nothing ever read them to send. VAPID was never configured. They are migrated into the new shared table by `001_web_push_schema.sql`.
- SignalR pushes Guidance live, but only when the app is open, and only for Guidance.

---

## 2. Database migration

**File:** `CDM-OneServe-API/Database/Notifications/001_web_push_schema.sql`

```sql
USE `cdm_oneserve`;

CREATE TABLE IF NOT EXISTS `PushSubscriptions` (
  `PushSubscriptionId` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) NOT NULL,
  `Endpoint` varchar(500) NOT NULL,
  `P256dh` varchar(255) NOT NULL,
  `Auth` varchar(255) NOT NULL,
  `UserAgent` varchar(500) DEFAULT NULL,
  `DeviceLabel` varchar(100) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT 1,
  `DeactivatedAt` datetime DEFAULT NULL,
  `LastUsedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`PushSubscriptionId`),
  UNIQUE KEY `IX_PushSub_Endpoint` (`Endpoint`),
  KEY `IX_PushSub_UserId_Active` (`UserId`,`IsActive`),
  CONSTRAINT `FK_PushSub_User`
    FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PushOutbox` (
  `PushOutboxId` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) NOT NULL,
  `PushSubscriptionId` int(11) DEFAULT NULL,
  `Module` varchar(50) NOT NULL DEFAULT 'General',
  `Type` varchar(80) NOT NULL DEFAULT 'General',
  `Title` varchar(200) NOT NULL,
  `Body` varchar(1000) NOT NULL,
  `IconUrl` varchar(500) DEFAULT NULL,
  `BadgeUrl` varchar(500) DEFAULT NULL,
  `TargetUrl` varchar(500) NOT NULL DEFAULT '/dashboard',
  `Tag` varchar(120) DEFAULT NULL,
  `DedupeKey` varchar(190) NOT NULL,
  `Priority` tinyint(4) NOT NULL DEFAULT 5,
  `Status` varchar(20) NOT NULL DEFAULT 'Pending',
  `Attempts` tinyint(4) NOT NULL DEFAULT 0,
  `LastError` varchar(1000) DEFAULT NULL,
  `ScheduledAt` datetime NOT NULL DEFAULT current_timestamp(),
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `ProcessedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`PushOutboxId`),
  UNIQUE KEY `IX_PushOutbox_DedupeKey` (`DedupeKey`),
  KEY `IX_PushOutbox_Claim` (`Status`,`ScheduledAt`,`PushOutboxId`),
  KEY `IX_PushOutbox_UserId` (`UserId`),
  CONSTRAINT `FK_PushOutbox_User`
    FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PushDeliveryLogs` (
  `PushDeliveryLogId` bigint(20) NOT NULL AUTO_INCREMENT,
  `PushOutboxId` bigint(20) NOT NULL,
  `PushSubscriptionId` int(11) NOT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'Sent',
  `StatusCode` int(11) DEFAULT NULL,
  `Error` varchar(1000) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`PushDeliveryLogId`),
  KEY `IX_PushDeliveryLog_Outbox` (`PushOutboxId`),
  KEY `IX_PushDeliveryLog_Sub` (`PushSubscriptionId`,`CreatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- migrate the old LostFound-only table, then keep it as a backup
INSERT INTO `PushSubscriptions`
  (`UserId`, `Endpoint`, `P256dh`, `Auth`, `UserAgent`, `DeviceLabel`,
   `IsActive`, `DeactivatedAt`, `LastUsedAt`, `CreatedAt`)
SELECT
  old.`UserId`, LEFT(old.`Endpoint`, 500), old.`P256dh`, old.`Auth`,
  NULL, 'Lost & Found', 1, NULL, old.`LastUsedAt`, old.`CreatedAt`
FROM `LostFoundPushSubscriptions` old
WHERE NOT EXISTS (
    SELECT 1 FROM `PushSubscriptions` neu WHERE neu.`Endpoint` = old.`Endpoint`
);
```

Run it:

```powershell
# Preferred: the Node runner is case-safe and skips the carry-over when the
# legacy table does not exist.
cd push-service
node scripts/apply-schema.mjs            # apply
node scripts/apply-schema.mjs --dry-run  # preview

# Equivalent raw SQL, if you prefer running it by hand:
mysql -u root -p cdm_oneserve < CDM-OneServe-API\Database\Notifications\001_web_push_schema.sql
```

> **`lower_case_table_names`** — many hosts (Windows, cPanel shared hosting) run `lower_case_table_names=1`, so MySQL stores `pushsubscriptions` instead of `PushSubscriptions`. Queries still work because MySQL resolves names case-insensitively on those servers; the only thing that must be case-insensitive is the *comparison code*, which is why `apply-schema.mjs` and `db.js` lower-case both sides before checking. The raw `.sql`'s carry-over step requires the legacy `LostFoundPushSubscriptions` table to exist, so use the runner when it may not.

---

## 3. Environment variables

### React frontend — `.env` (and `.env.example`, committed)

```ini
VITE_API_URL=https://api.cdmconnect.online

# VAPID PUBLIC key - safe to ship in the browser bundle.
VITE_VAPID_PUBLIC_KEY=<your 87-char base64url public key>
```

### ASP.NET Core API — `appsettings.json` (`WebPush` section)

```json
"WebPush": {
  "VapidPublicKey": "<same public key>",
  "VapidSubject": "mailto:cdmoneserve@gmail.com"
}
```

### Node service — `push-service/.env`

```ini
PORT=4100
HOST=127.0.0.1

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cdm_oneserve

# PRIVATE KEY - this file only. Never git, never the browser.
VAPID_PUBLIC_KEY=<same public key>
VAPID_PRIVATE_KEY=<private key>

VAPID_SUBJECT=mailto:cdmoneserve@gmail.com

POLL_INTERVAL_MS=5000
BATCH_SIZE=50
MAX_ATTEMPTS=6
MAX_MESSAGE_AGE_HOURS=72
DELIVERY_LOG_RETENTION_DAYS=14
LOG_LEVEL=info
```

---

## 4. Files

| Path | Status | Purpose |
|---|---|---|
| `CDM-OneServe-API/Models/Notifications/PushSubscription.cs` | new | subscription entity |
| `…/Models/Notifications/PushOutboxMessage.cs` | new | outbox entity |
| `…/Models/Notifications/PushDeliveryLog.cs` | new | delivery audit |
| `…/DTOs/Notifications/PushDtos.cs` | new | request/response DTOs |
| `…/Services/Notifications/PushNotification.cs` | new | outbox message record |
| `…/Services/Notifications/PushDispatcher.cs` | new | enqueue + dedupe |
| `…/Services/Notifications/PushSubscriptionService.cs` | new | register/remove/validate/expire |
| `…/Services/Notifications/PushRoutes.cs` | new | deep-link table + sanitisation |
| `…/Services/Notifications/PushMaintenanceHostedService.cs` | new | requeue + retention |
| `…/Controllers/PushController.cs` | new | `api/push/*` |
| `…/Database/Notifications/001_web_push_schema.sql` | new | migration |
| `…/Data/AppDbContext.cs` | modified | 3 new DbSets + mappings |
| `…/Program.cs` | modified | DI registration |
| `…/appsettings.json` | modified | `WebPush` section |
| `src/sw.js` | new | service worker (precache + push/click/change) |
| `vite.config.js` | modified | `injectManifest` |
| `src/push/vapidKey.js` | new | public key source |
| `src/push/pushClient.js` | new | `/api/push` client |
| `src/push/usePushSubscription.js` | new | hook |
| `src/push/PushNotificationCard.jsx` | new | Profile toggle |
| `src/push/PushNotificationSync.jsx` | new | per-load repair listener |
| `src/push/PushNotificationBanner.jsx` | new | opt-in prompt (non-student roles) |
| `src/App.jsx` | modified | mounts sync + banner |
| `src/pages/Profile/Profile.jsx` | modified | inserts the card |
| `src/components/BottomNavigation/BottomNavigation.jsx` | modified | Marketplace notifications |
| `public/icons/icon-512.png` | new | the manifest already referenced it |
| `push-service/**` | new | Node delivery service |
| `eslint.config.js` | modified | ignore `push-service` |
| `.gitignore` | modified | ignore `.env`, VAPID private material |

---

## 5. API surface

`[ApiController] [Route("api/push")] [Authorize]` — the userId comes from the JWT, never the body.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/push/vapid-public-key` | anonymous | public key only |
| POST | `/api/push/subscribe` | user | store subscription |
| POST | `/api/push/unsubscribe` | user | remove one |
| GET | `/api/push/subscriptions` | user | list devices + status |
| POST | `/api/push/validate` | user | verify/repair, SW resubscribe hook |
| POST | `/api/push/test` | user | send a real test |

`POST /api/lostfound/notifications/push/subscribe` still works and now writes to the shared table.

---

## 6. Security posture

- **Private key**: only `push-service/.env`. `.gitignore` blocks `.env`, `push-service/.env`, `*.pem`, `vapid-keys.json`. `.env` was untracked from git.
- **Ownership**: every query filters by the JWT userId; `unsubscribe` on someone else's row returns 404, not 403, so ids can't be probed.
- **Authorization**: `[Authorize]`; no role can send to another user's devices.
- **Payload safety**: titles 90 chars, bodies 400, URL must be a relative `/` path (no `//`, `\`, `javascript:`, `data:`), enforced in `PushRoutes`, `sender.js` and the service worker.
- **Dedup**: `DedupeKey` is unique per event per day (`OnceOnly` for "remind once"), with a UNIQUE index behind it.
- **Delivery claim**: `UPDATE … WHERE Status='Pending'` — a doubled or restarted worker can't send twice.
- **Logs**: the Node service never writes an endpoint into error text.

> **Pre-existing issue, not introduced here:** `CDM-OneServe-API/appsettings.json` has the JWT key and Gmail app password committed in plaintext. Move them to environment variables or user-secrets, and rotate both.

---

## 7. Local end-to-end test

```powershell
# 1. Backend
cd CDM-OneServe-API
dotnet run

# 2. Frontend  (production needed: vite-plugin-pwa has no SW in `npm run dev`)
cd cdm-oneserve-mobile
npm run build
npm run preview -- --port 5173 --host

# 3. Notification service
cd push-service
npm install
copy .env.example .env     # paste the private key
npm start
curl http://127.0.0.1:4100/health
```

Then in the browser at `https://localhost` (or the deployed HTTPS origin):

1. Log in → the notification banner appears → **Turn on**.
2. DevTools → Application → Service Workers: `sw.js` should be **activated and running** with no errors.
3. DevTools → Application → Push: a subscription appears.
4. DevTools → Console: `Notification.permission === "granted"`.
5. Trigger any event, or click **Send a test notification** on `/profile`.
6. **Close every tab** → do another event → a system notification must appear.
7. Click the notification → the correct route opens with focus.
8. `curl http://127.0.0.1:4100/health` → `outbox.pending === 0`, `sent` increments.

### Simulating 404/410

```sql
UPDATE PushSubscriptions SET IsActive = 0 WHERE PushSubscriptionId = 1;
```

`GET /api/push/subscriptions` then shows `isActive: false`, and the Profile toggle switches to "off" state on the next load.

### Verifying dedupe

```sql
-- enqueue the same event twice within a day must produce one row
SELECT DedupeKey, COUNT(*) FROM PushOutbox GROUP BY DedupeKey HAVING COUNT(*) > 1;
-- expect zero rows
```

### Manual send via web-push (smoke test)

```javascript
// node -e "…" or: npm run send --prefix push-service -- "Title" "Body" "/dashboard"
import webpush from "web-push";
import mysql from "mysql2/promise";

webpush.setVapidDetails(
    "mailto:you@school.edu",
    process.env.PUB, process.env.PRIV
);

const c = await mysql.createConnection({ user: "root", database: "cdm_oneserve" });
const [[sub]] = await c.query("SELECT * FROM PushSubscriptions WHERE IsActive=1 LIMIT 1");

await webpush.sendNotification(
    {
        endpoint: sub.Endpoint,
        keys: { p256dh: sub.P256dh, auth: sub.Auth },
    },
    JSON.stringify({
        title: "CDM OneServe",
        body: "Manual test",
        targetUrl: "/dashboard",
    }),
    { TTL: 3600 }
);
```

Or use the ready-made helper: `npm run send --prefix push-service -- "Title" "Body" "/dashboard"`.

---

## 8. Vercel deployment (SPA rewrites — required)

**`vercel.json` is required.** Without it, Vercel serves only real files and answers every deep link with its own platform 404 (`404 NOT_FOUND` plus a Request ID), so React Router never sees the request. In-app navigation keeps working, which is why the bug hides until someone refreshes, opens a shared link, or taps a push notification while the PWA is closed.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The committed file also pins cache headers: `sw.js` and `registerSW.js` are `no-cache` (a cached worker breaks `autoUpdate`), `/assets/*` is `immutable` for one year, plus `X-Content-Type-Options` and `X-Frame-Options`.

Why a bare `/(.*)` catch-all is safe: Vercel checks the **filesystem before applying rewrites** ("precedence is given to the filesystem prior to rewrites being applied"). So `/assets/index-*.js`, `/sw.js`, `/manifest.webmanifest` and `/icons/*` are served as real files; only unknown paths fall through to `index.html`. Never add negative-lookahead excludes to that rewrite — if the regex form isn't supported you break asset serving entirely instead of just deep links.

The catch-all also means an unknown route renders the app shell with a blank page rather than a 404. That is normal SPA behaviour; matching is React Router's job, and it already has a `*` fallback per module.

## 9. Production deployment

```powershell
# Web server (IIS) — copy publish output + built PWA
dotnet publish CDM-OneServe-API -c Release -o C:\inetpub\cdm-api
npm --prefix cdm-oneserve-mobile run build
xcopy /E /I /Y cdm-oneserve-mobile\dist C:\inetpub\cdm-app\*

# Notification service
npm --prefix push-service ci --omit=dev
cd push-service
npx pm2 start ecosystem.config.cjs
npx pm2 startup
npx pm2 save
```

`VAPID_PRIVATE_KEY` must be set on the service host (env var or the local `.env`) — never in the published output, and never in the git repo.

---

## 9. Rotating VAPID keys

Generate a new pair (`npm run keys --prefix push-service`), update `push-service/.env`, `appsettings.json` and `.env` together, then rebuild the frontend. **Every existing subscription stops working** and users get re-prompted — do it only when the private key leaks.

> The link in the request was `https://github.com/wenro-cmd/CODEOWNERS`, which is a 404 (the repository `wenro-cmd` doesn't exist). The correct official library is **web-push-libs/web-push** (`npm i web-push`), which is what's implemented here.
