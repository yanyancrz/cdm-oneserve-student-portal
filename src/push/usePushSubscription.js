/**
 * usePushSubscription - the single source of truth for "is this browser
 * subscribed to OneServe push notifications".
 *
 * Deliberately does NOT prompt on mount: browsers punish sites that ask
 * for notification permission before the user has done something that
 * warrants it, and an unrequested prompt cannot be un-shown. The prompt is
 * only ever raised by `enable()`, i.e. the user's own tap on the toggle.
 */
import { useCallback, useEffect, useState } from "react";

import {
    isPushSupported,
    getVapidPublicKey,
    urlBase64ToUint8Array,
} from "./vapidKey.js";
import * as pushClient from "./pushClient.js";

const TOKEN_KEYS = ["token", "authToken"];

function isSignedIn() {
    return TOKEN_KEYS.some((key) => localStorage.getItem(key));
}

async function readyWorker() {
    const registration = await navigator.serviceWorker.ready;
    return registration;
}

async function existingSubscription() {
    const registration = await readyWorker();
    return (await registration.pushManager.getSubscription()) ?? null;
}

/**
 * While there was no tab to ask, the service worker stashed a rotated
 * subscription in the Cache API. Register it now, then clear the stash so
 * it is only ever sent once.
 */
async function drainStashedResubscription() {
    if (!("caches" in window)) return false;

    try {
        const cache = await caches.open("oneserve-runtime-v1");
        const stashed = await cache.match(new Request("oneserve:resubscribe"));
        if (!stashed) return false;

        const json = await stashed.json();
        await cache.delete(new Request("oneserve:resubscribe"));

        if (!json?.endpoint) return false;

        await pushClient.validate({
            endpoint: json.endpoint,
            keys: json.keys ?? {},
        });

        return true;
    } catch {
        return false;
    }
}

export function usePushSubscription() {
    const supported = isPushSupported();
    const [state, setState] = useState({
        loading: supported,
        supported,
        permission:
            supported && typeof Notification !== "undefined"
                ? Notification.permission
                : "default",
        subscribed: false,
        // "default" = never asked, "granted" = we may ask
        canAsk: supported && Notification.permission === "default",
        endpoint: null,
        error: null,
    });

    // ---------------------------------------------------------------
    // Reconcile the browser with the server. Safe to call any number of
    // times: nothing here prompts the user.
    // ---------------------------------------------------------------
    const refresh = useCallback(async () => {
        if (!supported || !isSignedIn()) {
            setState((prev) => ({ ...prev, subscribed: false, endpoint: null }));
            return;
        }

        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            // First, honour anything the worker stashed while the app was closed.
            await drainStashedResubscription();

            const subscription = await existingSubscription();
            const permission = Notification.permission;

            if (!subscription) {
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    subscribed: false,
                    endpoint: null,
                    permission,
                    canAsk: permission === "default",
                }));
                return;
            }

            // The worker may have rotated while the tab was closed.
            await pushClient.validate(subscription);

            setState((prev) => ({
                ...prev,
                loading: false,
                subscribed: true,
                endpoint: subscription.endpoint,
                permission,
                canAsk: permission === "default",
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                loading: false,
                subscribed: false,
                error: error?.message ?? "Could not reach the OneServe API.",
            }));
        }
    }, [supported]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Ask the service worker to hand us a rotated subscription.
    useEffect(() => {
        if (!supported) return undefined;

        const onMessage = (event) => {
            if (event.data?.type === "oneserve:resubscribe") {
                refresh();
            }
        };

        navigator.serviceWorker.addEventListener("message", onMessage);
        return () =>
            navigator.serviceWorker.removeEventListener("message", onMessage);
    }, [refresh, supported]);

    // ---------------------------------------------------------------
    // Enable / disable
    // ---------------------------------------------------------------
    const enable = useCallback(async () => {
        if (!supported) {
            setState((prev) => ({
                ...prev,
                error: "This browser cannot show OneServe notifications.",
            }));
            return { ok: false };
        }

        try {
            const permission = await Notification.requestPermission();

            if (permission !== "granted") {
                setState((prev) => ({
                    ...prev,
                    permission,
                    canAsk: false,
                    error:
                        permission === "denied"
                            ? "Notifications are blocked. Allow them in your browser settings."
                            : "Notification permission was dismissed.",
                }));
                return { ok: false };
            }

            const vapidKey = await getVapidPublicKey();
            if (!vapidKey) {
                setState((prev) => ({
                    ...prev,
                    error:
                        "This OneServe deployment has no Web Push key configured yet.",
                }));
                return { ok: false };
            }

            const applicationServerKey = urlBase64ToUint8Array(vapidKey);

            const registration = await readyWorker();
            const existing = await registration.pushManager.getSubscription();

            // Never subscribe twice: a second subscribe() creates an orphaned
            // row on the push service and a duplicate notification.
            const subscription =
                existing ??
                (await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey,
                }));

            await pushClient.subscribe(subscription);

            setState((prev) => ({
                ...prev,
                subscribed: true,
                endpoint: subscription.endpoint,
                permission: "granted",
                canAsk: false,
                error: null,
            }));

            return { ok: true, subscription };
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error: error?.message ?? "Could not enable notifications.",
            }));
            return { ok: false, error: error?.message };
        }
    }, [supported]);

    const disable = useCallback(async () => {
        if (!supported) return { ok: false };

        try {
            const subscription = await existingSubscription();

            if (subscription) {
                // Unregister on the server first: if the unsubscribe call
                // fails we would rather keep a dead row than a live one the
                // API still thinks belongs to this user.
                await pushClient.unsubscribe(subscription);
                await subscription.unsubscribe().catch(() => undefined);
            }

            setState((prev) => ({
                ...prev,
                subscribed: false,
                endpoint: null,
                error: null,
            }));

            return { ok: true };
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error: error?.message ?? "Could not disable notifications.",
            }));
            return { ok: false, error: error?.message };
        }
    }, [supported]);

    const sendTest = useCallback(async () => {
        try {
            await pushClient.sendTest();
            return { ok: true };
        } catch (error) {
            return { ok: false, error: error?.message };
        }
    }, []);

    return {
        ...state,
        enable,
        disable,
        sendTest,
        refresh,
    };
}
