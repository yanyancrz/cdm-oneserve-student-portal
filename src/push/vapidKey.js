/**
 * The VAPID public key.
 *
 * This key is PUBLIC by design - it is published inside every VAPID token
 * and the browser uses it to verify that a notification really came from
 * OneServe. The matching PRIVATE key never reaches the browser: it lives
 * only in the Node notification service's environment.
 *
 * Two sources, in order:
 *   1. VITE_VAPID_PUBLIC_KEY at build time (preferred: no extra request,
 *      works offline, and the shell can decide whether to show the toggle)
 *   2. GET /api/push/vapid-public-key at runtime (fallback for a build made
 *      without the env var, and used by the service worker's own resubscribe)
 */
import { API_URL } from "../config/api.js";

let cachedKey = null;

export function getBuildTimeVapidKey() {
    const fromEnv = import.meta.env?.VITE_VAPID_PUBLIC_KEY;

    if (typeof fromEnv !== "string") return null;

    const trimmed = fromEnv.trim();
    return trimmed.length > 0 ? trimmed : null;
}

/**
 * The base64url string the browser wants has to become a
 * Uint8Array of the raw bytes, NOT the decoded text of the string.
 */
export function urlBase64ToUint8Array(base64Url) {
    const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
    const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");

    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);

    for (let i = 0; i < raw.length; i += 1) {
        output[i] = raw.charCodeAt(i);
    }

    return output;
}

export async function getVapidPublicKey() {
    if (cachedKey) return cachedKey;

    const buildTimeKey = getBuildTimeVapidKey();
    if (buildTimeKey) {
        cachedKey = buildTimeKey;
        return cachedKey;
    }

    const response = await fetch(`${API_URL}/api/push/vapid-public-key`);
    if (!response.ok) return null;

    const body = await response.json();
    cachedKey = body?.publicKey || null;

    return cachedKey;
}

/** True when this browser can do Web Push at all (iOS < 16.4 cannot). */
export function isPushSupported() {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        typeof Notification !== "undefined"
    );
}
