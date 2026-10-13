/**
 * PushNotificationCard - the on/off switch for Web Push notifications.
 *
 * Added to the Profile page because that is the one place every role
 * reaches (students, faculty, counselors, staff, heads), so the setting is
 * findable no matter which portal a user lives in. No existing UI was
 * replaced; this is a new card inserted between the profile card and the
 * "Edit Profile" button.
 *
 * The permission prompt is only ever raised by this toggle - it is never
 * triggered automatically, so nobody gets a browser dialog they did not ask for.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { usePushSubscription } from "./usePushSubscription.js";
import * as pushClient from "./pushClient.js";

/**
 * How the "Send a test notification" flow reports itself.
 *
 * The API only queues the message; the separate Node push-service
 * delivers it. So after the POST we poll /api/push/test-status and show
 * what actually happened - including "still queued", which is the state
 * the user sees when the notification service is not running. That is the
 * difference between "the button is broken" and "the button worked but
 * nothing is delivering".
 */
const TEST_POLL_ATTEMPTS = 20;
const TEST_POLL_INTERVAL_MS = 2000;

const STATUS_TEXT = {
    queued: "Queued - waiting for the notification service to deliver...",
    delivered: "Delivered - the notification should be in your system tray now.",
    pending:
        "Still queued after a minute. The notification service (push-service) " +
        "is probably not running or cannot reach the database. On the server, run: " +
        "node push-service/scripts/diagnose.mjs",
};

function statusClass(kind) {
    if (kind === "delivered") return "text-emerald-600";
    if (kind === "pending") return "text-amber-600";
    if (kind === "failed" || kind === "error") return "text-red-600";
    return "text-slate-400";
}

export function PushNotificationCard() {
    const push = usePushSubscription();
    const [busy, setBusy] = useState(false);
    const [testState, setTestState] = useState(null);

    // Polling must die with the component.
    const cancelled = useRef(false);
    useEffect(() => {
        cancelled.current = false;
        return () => {
            cancelled.current = true;
        };
    }, []);

    const pollDelivery = useCallback(async () => {
        for (let attempt = 1; attempt <= TEST_POLL_ATTEMPTS; attempt += 1) {
            await new Promise((resolve) =>
                setTimeout(resolve, TEST_POLL_INTERVAL_MS)
            );

            if (cancelled.current) return;

            try {
                const row = await pushClient.getTestStatus();

                if (!row?.exists) continue;
                if (row.status === "Sent") {
                    setTestState({ kind: "delivered" });
                    return;
                }
                if (row.status === "Failed") {
                    setTestState({ kind: "failed", error: row.lastError });
                    return;
                }
                // Pending / Processing: keep polling.
            } catch {
                // An API without the endpoint (not redeployed yet): the
                // toast already said "queued", which is the old truth.
                return;
            }
        }

        if (!cancelled.current) setTestState({ kind: "pending" });
    }, []);

    async function toggle() {
        setBusy(true);
        try {
            if (push.subscribed) {
                const result = await push.disable();
                if (result.ok) {
                    toast.success("Notifications off for this device.");
                    setTestState(null);
                } else if (result.error) {
                    toast.error(result.error);
                }
            } else {
                const result = await push.enable();
                if (result.ok) {
                    toast.success("Notifications on. You will hear from OneServe now.");

                    // A real notification through the whole chain proves it works,
                    // and is the only way for a user to know it is fine.
                    const test = await push.sendTest();
                    if (test.ok && test.message) {
                        toast.success(test.message);
                        setTestState({ kind: "queued" });
                        void pollDelivery();
                    } else if (test.error) {
                        toast.error(test.error);
                    }
                } else if (result.error) {
                    toast.error(result.error);
                }
            }
        } finally {
            setBusy(false);
        }
    }

    async function resendTest() {
        setBusy(true);
        setTestState({ kind: "queued" });
        try {
            const test = await push.sendTest();
            if (test.ok) {
                toast.success(test.message || "Test notification sent.");
                await pollDelivery();
            } else {
                setTestState({ kind: "error", error: test.error });
                toast.error(test.error || "Could not send the test.");
            }
        } finally {
            setBusy(false);
        }
    }

    if (!push.supported) {
        return (
            <div className="mt-4 bg-white border border-slate-200 rounded-[24px] shadow-sm p-4">
                <h2 className="text-sm font-semibold text-slate-900">
                    Notifications
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                    This browser cannot show OneServe notifications. Open OneServe
                    in Chrome, Edge, Firefox or Safari 16.4+ to enable them.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-4 bg-white border border-slate-200 rounded-[24px] shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                        Campus Notifications
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        Lost &amp; found, library, guidance, marketplace orders and
                        account updates - even while the app is closed.
                    </p>
                </div>

                <button
                    type="button"
                    role="switch"
                    aria-checked={push.subscribed}
                    aria-label="Campus notifications"
                    onClick={toggle}
                    disabled={busy || push.loading}
                    className={`
                        relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
                        transition-colors disabled:opacity-60
                        ${push.subscribed ? "bg-[#106A2E]" : "bg-slate-300"}
                    `}
                >
                    <span
                        className={`
                            inline-block h-5 w-5 transform rounded-full bg-white shadow
                            transition-transform
                            ${push.subscribed ? "translate-x-5" : "translate-x-0.5"}
                        `}
                    />
                </button>
            </div>

            {push.error ? (
                <p className="mt-3 text-xs text-red-600">{push.error}</p>
            ) : null}

            {push.subscribed ? (
                <>
                    <button
                        type="button"
                        onClick={resendTest}
                        disabled={busy}
                        className="
                            mt-3 text-xs font-semibold text-[#106A2E]
                            hover:underline disabled:opacity-60
                        "
                    >
                        Send a test notification
                    </button>

                    {testState ? (
                        <p
                            className={`mt-1 text-[11px] leading-relaxed ${statusClass(
                                testState.kind
                            )}`}
                        >
                            {testState.kind === "failed" || testState.kind === "error"
                                ? `${testState.kind === "failed" ? "Failed" : "Error"}: ${testState.error ?? "unknown"}`
                                : STATUS_TEXT[testState.kind]}
                        </p>
                    ) : null}
                </>
            ) : null}

            <p className="mt-3 text-[11px] text-slate-400">
                You can turn this off any time. OneServe never asks for your
                location and never shares your subscription.
            </p>
        </div>
    );
}

export default PushNotificationCard;
