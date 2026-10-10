/**
 * "Signed in on another device" warning for the dashboard.
 *
 * Rendered ONLY when the server is certain: a session key exists, and a
 * different one for the same account was created after this device's. When the
 * server cannot tell (signed in before the feature, storage cleared) it returns
 * "cannot tell" and this renders nothing - a false security warning is worse
 * than no warning.
 */
import { useEffect, useState } from "react";

import {
    checkDeviceSession,
    dismissOtherDevices,
    formatWhen,
} from "../../session/deviceSession";

export default function DeviceSessionWarning() {
    const [state, setState] = useState({ loading: true });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const status = await checkDeviceSession();
                if (!cancelled) setState({ loading: false, status });
            } catch {
                if (!cancelled) setState({ loading: false, status: null });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleDismiss() {
        setBusy(true);
        try {
            const result = await dismissOtherDevices();
            if (result.ok) setState({ loading: false, status: null });
        } finally {
            setBusy(false);
        }
    }

    if (state.loading) return null;

    const status = state.status;

    // "Cannot tell" or "no other device" - both render nothing.
    if (!status?.hasOtherDevice) return null;

    const label = status.otherDeviceLabel || "another device";

    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <span aria-hidden="true">⚠️</span>
                </div>

                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-amber-900">
                        Signed in on another device
                    </h2>

                    <p className="mt-1 text-xs leading-relaxed text-amber-800">
                        Your CDM OneServe account was signed in on{" "}
                        <strong>{label}</strong>
                        {status.otherDeviceAt
                            ? ` on ${formatWhen(status.otherDeviceAt)}`
                            : ""}
                        . If this was not you, change your password straight away.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleDismiss}
                            disabled={busy}
                            className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
                        >
                            {busy ? "Clearing…" : "It was me"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { DeviceSessionWarning };
