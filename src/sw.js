/* =====================================================================
 * CDM OneServe - service worker
 * ---------------------------------------------------------------------
 * Hand-written so Web Push can live here. vite-plugin-pwa runs in
 * `injectManifest` mode (see vite.config.js), which bundles this file to
 * /sw.js and replaces the single `self.__WB_MANIFEST` token below with
 * the precache manifest.
 *
 * IMPORTANT: `self.__WB_MANIFEST` must appear exactly once in this file.
 *
 * Responsibilities
 *   1. Precache + serve the app shell (what the Workbox worker did before)
 *   2. `push`            -> show a notification
 *   3. `notificationclick` -> open the right OneServe page
 *   4. `pushsubscriptionchange` -> ask an open tab to re-subscribe
 * ===================================================================== */

/// <reference lib="webworker" />

const PRECACHE = "oneserve-precache-v1";
const RUNTIME = "oneserve-runtime-v1";

// Only same-origin, app-owned paths are ever cached.
const APP_SHELL = "./index.html";

// The literal token vite-plugin-pwa replaces with the precache manifest.
const PRECACHE_MANIFEST = self.__WB_MANIFEST;

// ---------------------------------------------------------------------
// INSTALL / ACTIVATE
// ---------------------------------------------------------------------

self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(PRECACHE);

            // addAll() aborts on the first failure, and a single missing
            // icon must not break the whole app shell, so each entry is
            // cached on its own.
            await Promise.all(
                PRECACHE_MANIFEST.map(async (entry) => {
                    try {
                        await cache.add(entry.url);
                    } catch {
                        // A missing asset is not worth a broken worker.
                    }
                })
            );

            await self.skipWaiting();
        })()
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const names = await caches.keys();

            await Promise.all(
                names
                    .filter((name) => name !== PRECACHE && name !== RUNTIME)
                    .map((name) => caches.delete(name))
            );

            await self.clients.claim();
        })()
    );
});

// ---------------------------------------------------------------------
// FETCH - same behaviour as the previous Workbox worker:
//   navigations  -> network first, cached shell as the offline fallback
//   app assets   -> cache first (they are content-hashed)
//   anything else (api.cdmconnect.online, images, fonts) -> untouched
// ---------------------------------------------------------------------

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // Never touch the API, uploads or any third party.
    if (url.origin !== self.location.origin) return;

    if (request.mode === "navigate") {
        event.respondWith(handleNavigation(request));
        return;
    }

    event.respondWith(handleAsset(request));
});

async function handleNavigation(request) {
    const cache = await caches.open(RUNTIME);

    try {
        const response = await fetch(request);
        cache.put(new Request(APP_SHELL), response.clone());
        return response;
    } catch {
        return (
            (await cache.match(new Request(APP_SHELL))) ||
            (await caches.match(APP_SHELL)) ||
            new Response("Offline", { status: 503, statusText: "Offline" })
        );
    }
}

async function handleAsset(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
            const cache = await caches.open(RUNTIME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response("", { status: 504, statusText: "Offline" });
    }
}

// ---------------------------------------------------------------------
// PUSH
// ---------------------------------------------------------------------

self.addEventListener("push", (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        // Never render raw text straight from the network as a title:
        // a malformed payload must not become a system notification.
        payload = {
            title: "CDM OneServe",
            body: "You have a new update.",
            targetUrl: "/dashboard",
        };
    }

    const title = clamp(payload.title, "CDM OneServe", 90);
    const body = clamp(payload.body, "You have a new update.", 400);
    const targetUrl = safeRelativeUrl(payload.targetUrl);
    const tag = typeof payload.tag === "string" ? payload.tag.slice(0, 120) : undefined;

    const options = {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { targetUrl, module: payload.module },
        vibrate: [100, 40, 100],
    };

    // Chrome only honours renotify when the notification is tag-grouped.
    if (tag) {
        options.tag = tag;
        options.renotify = true;
    }

    event.waitUntil(self.registration.showNotification(title, options));
});

// ---------------------------------------------------------------------
// NOTIFICATION CLICK
// ---------------------------------------------------------------------

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl = safeRelativeUrl(event.notification.data?.targetUrl);
    const absoluteUrl = new URL(targetUrl, self.location.origin).href;

    event.waitUntil(
        (async () => {
            // Prefer an already open OneServe tab: the student is usually
            // already inside the app and should not get a second window.
            const clients = await self.clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            });

            const existing = clients.find(
                (client) => new URL(client.url).origin === self.location.origin
            );

            if (existing) {
                if ("navigate" in existing) {
                    try {
                        await existing.navigate(absoluteUrl);
                        await existing.focus();
                        return;
                    } catch {
                        // Fall through and open a new window.
                    }
                }
                await existing.focus();
                return;
            }

            await self.clients.openWindow(absoluteUrl);
        })()
    );
});

// ---------------------------------------------------------------------
// PUSH SUBSCRIPTION CHANGE
// ---------------------------------------------------------------------
// Browsers may rotate the subscription without telling the page (FCM
// does this on token refresh). The page owns the JWT - a worker cannot
// read localStorage - so an open tab is asked to re-subscribe, and if
// there is no tab the new subscription is stashed in the Cache API for
// the next page load to register.
// ---------------------------------------------------------------------

const RESUB_KEY = "oneserve:resubscribe";

self.addEventListener("pushsubscriptionchange", (event) => {
    event.waitUntil(
        (async () => {
            const clients = await self.clients.matchAll({ type: "window" });

            if (clients.length > 0) {
                clients.forEach((client) =>
                    client.postMessage({ type: "oneserve:resubscribe" })
                );
                return;
            }

            try {
                const subscription = await self.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
                });

                const cache = await caches.open(RUNTIME);
                await cache.put(
                    new Request(RESUB_KEY),
                    new Response(JSON.stringify(subscription.toJSON()))
                );
            } catch {
                // Nothing we can do while closed; the page re-checks on load.
            }
        })()
    );
});

// ---------------------------------------------------------------------
// PAGE MESSAGES
// ---------------------------------------------------------------------

self.addEventListener("message", (event) => {
    if (event.data?.type === "oneserve:skip-waiting") {
        self.skipWaiting();
    }
});

// ---------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------

function clamp(value, fallback, max) {
    const text = typeof value === "string" ? value.trim() : "";
    if (text.length === 0) return fallback;
    return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/**
 * Defence in depth: the API already sanitises targetUrl, but the worker
 * re-checks before handing a URL to openWindow().
 */
function safeRelativeUrl(value) {
    const candidate = typeof value === "string" ? value.trim() : "";
    if (candidate.length === 0) return "/dashboard";
    if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/dashboard";
    if (/[\\]|javascript:|data:/i.test(candidate)) return "/dashboard";
    return candidate.length > 500 ? "/dashboard" : candidate;
}
