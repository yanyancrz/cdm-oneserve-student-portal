/**
 * Which browser is "this device".
 *
 * The API mints a key at every login and hands it back with the token. Keeping
 * it here is what lets the server answer "has somebody else signed in since
 * you did?" - a stateless JWT cannot answer that on its own, and nothing in
 * the auth path reads this key, so losing it can never lock anybody out.
 */
import { API_URL } from "../config/api.js";

const SESSION_KEY_STORAGE = "oneserve:sessionKey";

function tokenKeys() {
    return ["token", "authToken"].some((key) => localStorage.getItem(key));
}

/** Called right after a successful login. */
export function rememberSessionKey(sessionKey) {
    if (typeof sessionKey === "string" && sessionKey.length > 0) {
        localStorage.setItem(SESSION_KEY_STORAGE, sessionKey);
    }
}

export function forgetSessionKey() {
    localStorage.removeItem(SESSION_KEY_STORAGE);
}

export function getSessionKey() {
    if (!tokenKeys()) return null;
    return localStorage.getItem(SESSION_KEY_STORAGE);
}

/**
 * Asks the API whether this account was signed in somewhere else after this
 * device did.
 *
 * `null` means "cannot tell" (no key, or signed in before this feature) - the
 * caller must show NOTHING in that case, never a guess.
 */
export async function checkDeviceSession() {
    const sessionKey = getSessionKey();
    if (!sessionKey) return null;

    const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return null;

    const response = await fetch(`${API_URL}/api/auth/session/status`, {
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "X-Session-Key": sessionKey,
        },
    });

    if (!response.ok) return null;

    const body = await response.json();
    if (!body?.success) return null;

    return body;
}

/**
 * Stops the warning. Records that the user has seen it - it does NOT sign the
 * other device out, because a stateless token cannot be revoked.
 */
export async function dismissOtherDevices() {
    const sessionKey = getSessionKey();
    if (!sessionKey) return { ok: false, error: "This device has no session key." };

    const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

    const response = await fetch(`${API_URL}/api/auth/session/dismiss-others`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "X-Session-Key": sessionKey,
        },
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
        return { ok: false, error: body?.message || "Could not clear the warning." };
    }
    return { ok: true, message: body?.message };
}

/**
 * Drops this device's own session row, so a device the user has abandoned
 * stops producing the warning.
 */
export async function clearMySessionRecord() {
    const sessionKey = getSessionKey();
    if (!sessionKey) return { ok: true };

    const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

    await fetch(`${API_URL}/api/auth/session/clear-mine`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "X-Session-Key": sessionKey,
        },
    }).catch(() => undefined);

    forgetSessionKey();
    return { ok: true };
}

export function formatWhen(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
