/**
 * The opt-in prompt for browser notifications.
 *
 * Why this exists: the Profile page lives inside the student layout, so a
 * librarian, marketplace staff member, counselor or admin could never reach
 * the toggle. This banner is the one entry point every role sees.
 *
 * Rules it follows:
 *   - only when the browser supports Web Push
 *   - only when the user is signed in
 *   - only when they have never been asked (permission === "default")
 *     and are not already subscribed
 *   - only with an explicit "Turn on" button - it NEVER calls
 *     Notification.requestPermission() on its own
 *   - dismissible, and the dismissal is remembered for 30 days
 */
import { useEffect, useState } from "react";

import { usePushSubscription } from "./usePushSubscription.js";

const DISMISS_KEY = "oneserve:push-banner-dismissed-at";
const DISMISS_DAYS = 30;

function isDismissed() {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;

    const dismissedAt = Number.parseInt(raw, 10);
    if (Number.isNaN(dismissedAt)) return false;

    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function PushNotificationBanner() {
    const push = usePushSubscription();
    const [visible, setVisible] = useState(false);
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!push.supported || push.loading) return;
        if (push.subscribed || push.permission !== "default") return;
        if (isDismissed()) return;

        // Small delay so it never fights the page for attention on load.
        const timer = setTimeout(() => setVisible(true), 2500);
        return () => clearTimeout(timer);
    }, [push.supported, push.loading, push.subscribed, push.permission]);

    function dismiss() {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setVisible(false);
    }

    async function turnOn() {
        setBusy(true);
        try {
            const result = await push.enable();
            if (result.ok) {
                setVisible(false);
                setDone(true);
                setTimeout(() => setDone(false), 6000);
            }
        } finally {
            setBusy(false);
        }
    }

    if (!visible) {
        if (!done) return null;

        return (
            <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 px-4">
                <p className="rounded-full bg-slate-900/90 px-4 py-2 text-center text-xs font-medium text-white shadow-lg backdrop-blur">
                    Notifications on for this device.
                </p>
            </div>
        );
    }

    return (
        <div className="fixed bottom-24 left-1/2 z-[60] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 px-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                        <span className="text-base" aria-hidden="true">
                            🔔
                        </span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-slate-900">
                            Turn on campus notifications?
                        </h2>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                            Lost &amp; found, library, guidance, marketplace
                            orders and account updates - even when OneServe is
                            closed.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={dismiss}
                        aria-label="Not now"
                        className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="mt-3 flex gap-2">
                    <button
                        type="button"
                        onClick={dismiss}
                        className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Not now
                    </button>

                    <button
                        type="button"
                        onClick={turnOn}
                        disabled={busy}
                        className="flex-1 rounded-xl bg-[#106A2E] py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                        {busy ? "Turning on…" : "Turn on"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PushNotificationBanner;
