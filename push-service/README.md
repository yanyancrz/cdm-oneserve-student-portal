# CDM OneServe - Web Push notification service
#
# A tiny Node process whose only job is to deliver the browser
# notifications the ASP.NET API queued in `PushOutbox`.
#
# It uses the official `web-push` library:
#   webPush.setVapidDetails(subject, publicKey, privateKey)
#   webPush.sendNotification(subscription, payload, options)
#
# The private key is never read by the API or the React app, and this
# service exposes no "send now" endpoint - everything arrives through the
# database, so the API and the worker stay fully decoupled.

# ---------------------------------------------------------------------
# Install / first run
# ---------------------------------------------------------------------
#   cd push-service
#   npm install
#   cp .env.example .env
#   npm run keys        # prints a VAPID key pair; generate ONCE, reuse forever
#
# Fill in push-service/.env:
#   VAPID_PUBLIC_KEY   -> same value as ../.env VITE_VAPID_PUBLIC_KEY
#   VAPID_PRIVATE_KEY  -> the private half (stays here, never committed)
#   DB_*               -> the cdm_oneserve MySQL database
#
# Then:
#   npm start          # or: npx pm2 start ecosystem.config.cjs

# ---------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------
#   curl http://127.0.0.1:4100/health
#   {
#     "status": "ok",
#     "cycles": 12,
#     "database": "connected",
#     "outbox": { "pending": 0, "processing": 0, "sent": 4, "failed": 0 }
#   }
#
# /stats adds the VAPID subject. Neither endpoint leaks the private key.
# Bind HOST to 127.0.0.1 (the default) unless a monitor needs it.

# ---------------------------------------------------------------------
# Files
# ---------------------------------------------------------------------
#   src/config.js      env + VAPID key-pair shape validation
#   src/db.js          MySQL pool, the claim/complete queries
#   src/sender.js      web-push setVapidDetails + sendNotification
#   src/worker.js      outbox loop, retry policy, 404/410 handling
#   src/server.js      startup + /health + /stats
#   scripts/generate-vapid-keys.js

# ---------------------------------------------------------------------
# Delivery rules
# ---------------------------------------------------------------------
#   2xx                      -> Sent. PushSubscriptions.LastUsedAt = now.
#   404 / 410                -> Expired. Subscription IsActive = 0,
#                               DeactivatedAt = now. The row is kept so the
#                               user still sees the device in the API, and
#                               the API's maintenance job deletes it after
#                               90 days. Never retried.
#   400 / 413                -> Failed immediately (retrying identical bytes
#                               cannot fix them).
#   408 / 429 / 5xx / network-> Pending again with exponential backoff
#                               (30s, 1m, 2m, 4m, 8m) up to MAX_ATTEMPTS.
#
# Duplicate prevention: the API writes a unique DedupeKey per event, and the
# claim is an atomic `UPDATE ... WHERE Status = 'Pending'`, so a restarted
# or doubled worker can never deliver the same message twice.

# ---------------------------------------------------------------------
# Rotating the VAPID keys (avoid if you can)
# ---------------------------------------------------------------------
# A browser pins the public key it subscribed with, so rotating invalidates
# every existing subscription and each user has to opt in again. If you must,
# update BOTH places at once (API appsettings + frontend .env) and rebuild
# the frontend: old subscriptions will simply start returning 404/410 and be
# deactivated automatically.
