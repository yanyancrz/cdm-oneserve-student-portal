/**
 * The only file that talks to a push service.
 *
 * Uses the official web-push library:
 *   webPush.setVapidDetails(subject, publicKey, privateKey)
 *   webPush.sendNotification(subscription, payload, options)
 *
 * VAPID signing is done in-process, so nothing but this service ever
 * holds the private key.
 */
import webPush from "web-push";

import { config } from "./config.js";
import { child } from "./logger.js";

const log = child("sender");

/**
 * Practical ceiling for the encrypted body. RFC 8188 (aes128gcm, which
 * web-push uses by default) keeps the whole encrypted record under 4 KB,
 * and every real push service enforces something similar.
 */
export const MAX_PAYLOAD_BYTES = 3800;

let configured = false;

/** Call once at startup, BEFORE any sendNotification(). */
export function initWebPush() {
    webPush.setVapidDetails(
        config.vapid.subject,
        config.vapid.publicKey,
        config.vapid.privateKey
    );
    configured = true;
    log.info("VAPID details registered.", {
        subject: config.vapid.subject,
    });
}

/**
 * Builds the JSON the service worker renders.
 * Returns null when the payload cannot be sent safely (too big / no target).
 */
export function buildPayload(message) {
    const payload = {
        title: clamp(message.Title, "CDM OneServe", 90),
        body: clamp(message.Body, "You have a new update.", 400),
        targetUrl: safeRelativeUrl(message.TargetUrl),
        module: clamp(message.Module, "General", 40),
        type: clamp(message.Type, "General", 60),
    };

    if (message.Tag) payload.tag = String(message.Tag).slice(0, 120);
    if (message.IconUrl) payload.icon = String(message.IconUrl);
    if (message.BadgeUrl) payload.badge = String(message.BadgeUrl);

    const serialized = JSON.stringify(payload);

    if (Buffer.byteLength(serialized, "utf8") > MAX_PAYLOAD_BYTES) {
        // Shrink instead of dropping: the title and URL carry the meaning,
        // so drop the optional extras before giving up.
        delete payload.icon;
        delete payload.badge;

        const shrunk = JSON.stringify(payload);
        if (Buffer.byteLength(shrunk, "utf8") > MAX_PAYLOAD_BYTES) {
            return null;
        }
        return shrunk;
    }

    return serialized;
}

/**
 * Sends one notification.
 *
 * @returns {Promise<{ok: boolean, statusCode: number|null, gone: boolean, retryable: boolean, error: string|null}>}
 */
export async function deliver(subscription, payload) {
    if (!configured) {
        throw new Error("initWebPush() must be called before deliver()");
    }

    if (!isUsableSubscription(subscription)) {
        return {
            ok: false,
            statusCode: null,
            gone: true,
            retryable: false,
            error: "Stored subscription is missing endpoint/keys.",
        };
    }

    const pushSubscription = {
        endpoint: subscription.Endpoint,
        keys: {
            p256dh: subscription.P256dh,
            auth: subscription.Auth,
        },
    };

    const options = {
        TTL: 4 * 60 * 60,
        urgency: urgencyFor(subscription.Priority),
        // Keeps the OS tray from stacking duplicates of one subject.
        ...(payload.tag ? { topic: payload.tag } : {}),
    };

    try {
        await webPush.sendNotification(pushSubscription, payload, options);
        return { ok: true, statusCode: 201, gone: false, retryable: false, error: null };
    } catch (error) {
        const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : null;

        // 404 / 410 = the push service no longer knows this subscription.
        const gone = statusCode === 404 || statusCode === 410;

        // 413 / 400 are permanent: retrying identical bytes cannot help.
        const retryable =
            statusCode === null ||
            statusCode === 429 ||
            statusCode >= 500 ||
            statusCode === 408;

        return {
            ok: false,
            statusCode,
            gone,
            retryable,
            error: describe(error, statusCode),
        };
    }
}

export function isUsableSubscription(subscription) {
    return (
        typeof subscription?.Endpoint === "string" &&
        subscription.Endpoint.startsWith("https://") &&
        typeof subscription?.P256dh === "string" &&
        subscription.P256dh.length > 0 &&
        typeof subscription?.Auth === "string" &&
        subscription.Auth.length > 0
    );
}

/**
 * Priorities: the API writes 1 for "act now" and 9 for "reminder".
 * web-push maps these to the push service's urgency field.
 */
function urgencyFor(priority) {
    const value = Number(priority ?? 5);
    if (Number.isNaN(value)) return "normal";
    if (value <= 3) return "high";
    if (value >= 8) return "low";
    return "normal";
}

function describe(error, statusCode) {
    if (statusCode === null) {
        // Network-level failure: never leak the endpoint into the message.
        return `Network error reaching the push service: ${error?.message ?? "unknown"}`;
    }

    const body = typeof error?.body === "string" ? error.body.slice(0, 200) : "";
    return `Push service returned ${statusCode}${body ? `: ${body}` : ""}`;
}

function clamp(value, fallback, max) {
    const text = typeof value === "string" ? value.trim() : "";
    if (text.length === 0) return fallback;
    return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function safeRelativeUrl(value) {
    const candidate = typeof value === "string" ? value.trim() : "";
    if (candidate.length === 0) return "/dashboard";
    if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/dashboard";
    if (/\\|javascript:|data:/i.test(candidate)) return "/dashboard";
    return candidate.length > 500 ? "/dashboard" : candidate;
}
