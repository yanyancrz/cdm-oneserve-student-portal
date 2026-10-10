/**
 * HTTP client for /api/push.
 *
 * Mirrors the pattern used by every other OneServe API client: the JWT is
 * read from localStorage under "token" (with the "authToken" alias), and
 * the user is always the one the token belongs to - the browser never
 * sends a user id.
 */
import { API_URL } from "../config/api.js";

const TOKEN_KEYS = ["token", "authToken"];

function getToken() {
    for (const key of TOKEN_KEYS) {
        const value = localStorage.getItem(key);
        if (value) return value;
    }
    return null;
}

async function request(path, options = {}) {
    const token = getToken();
    if (!token) throw new Error("not-signed-in");

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        },
    });

    // 401 means the token is dead; clear it the way the other clients do.
    if (response.status === 401) {
        const tokenKeys = ["token", "authToken", "userId", "userRole", "role"];
        tokenKeys.forEach((key) => localStorage.removeItem(key));
    }

    return response;
}

async function toJson(response) {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

export async function subscribe(subscription, deviceLabel) {
    const response = await request("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
            endpoint: subscription.endpoint,
            // Serialised with .toJSON(): ArrayBuffers must not be sent raw.
            p256dh: subscription.keys?.p256dh,
            auth: subscription.keys?.auth,
            deviceLabel,
        }),
    });

    const body = await toJson(response);
    if (!response.ok) {
        throw new Error(body?.message || "Could not enable notifications.");
    }
    return body;
}

export async function unsubscribe(subscription) {
    const response = await request("/api/push/unsubscribe", {
        method: "POST",
        body: JSON.stringify({
            endpoint: subscription?.endpoint,
            pushSubscriptionId: subscription?.pushSubscriptionId,
        }),
    });

    const body = await toJson(response);
    if (!response.ok && response.status !== 404) {
        throw new Error(body?.message || "Could not disable notifications.");
    }
    return body;
}

/** The server's view of this account's devices. */
export async function getMySubscriptions() {
    const response = await request("/api/push/subscriptions");
    const body = await toJson(response);
    if (!response.ok) {
        throw new Error(body?.message || "Could not read your notification settings.");
    }
    return body;
}

/**
 * Confirms the stored row matches what the browser actually has. Called on
 * app start (repairs a rotated key, an expired row, a cancelled browser
 * permission) and by the service worker's pushsubscriptionchange handler.
 */
export async function validate(subscription) {
    const response = await request("/api/push/validate", {
        method: "POST",
        body: subscription
            ? JSON.stringify({
                  endpoint: subscription.endpoint,
                  p256dh: subscription.keys?.p256dh,
                  auth: subscription.keys?.auth,
              })
            : undefined,
    });

    const body = await toJson(response);
    if (!response.ok) {
        throw new Error(body?.message || "Could not validate notifications.");
    }
    return body;
}

export async function sendTest(pushSubscriptionId) {
    const response = await request(
        `/api/push/test${pushSubscriptionId ? `?pushSubscriptionId=${pushSubscriptionId}` : ""}`,
        { method: "POST" }
    );

    const body = await toJson(response);
    if (!response.ok) {
        throw new Error(body?.message || "Could not send a test notification.");
    }
    return body;
}
