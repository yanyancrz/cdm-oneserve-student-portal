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

/**
 * A real browser PushSubscription has NO `.keys` property - the p256dh/auth
 * values only exist through toJSON() (base64url strings) or getKey()
 * (ArrayBuffers). A plain { endpoint, keys } object (the shape the service
 * worker stashes) is accepted too.
 */
function bufferToBase64Url(buffer) {
    if (!buffer) return undefined;

    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }

    return window
        .btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function extractSubscription(subscription) {
    if (!subscription) return { endpoint: undefined, p256dh: undefined, auth: undefined };

    let json = {};
    if (typeof subscription.toJSON === "function") {
        json = subscription.toJSON() ?? {};
    }

    const keys = json.keys ?? subscription.keys ?? {};

    let p256dh = keys.p256dh;
    let auth = keys.auth;

    if (!p256dh && typeof subscription.getKey === "function") {
        p256dh = bufferToBase64Url(subscription.getKey("p256dh"));
    }
    if (!auth && typeof subscription.getKey === "function") {
        auth = bufferToBase64Url(subscription.getKey("auth"));
    }

    return {
        endpoint: json.endpoint ?? subscription.endpoint,
        p256dh,
        auth,
    };
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
    const { endpoint, p256dh, auth } = extractSubscription(subscription);

    if (!endpoint || !p256dh || !auth) {
        throw new Error(
            "This browser did not return a complete push subscription. Try again."
        );
    }

    const response = await request("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({ endpoint, p256dh, auth, deviceLabel }),
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
    let body_ = undefined;

    if (subscription) {
        const { endpoint, p256dh, auth } = extractSubscription(subscription);
        body_ = JSON.stringify({ endpoint, p256dh, auth });
    }

    const response = await request("/api/push/validate", {
        method: "POST",
        body: body_,
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