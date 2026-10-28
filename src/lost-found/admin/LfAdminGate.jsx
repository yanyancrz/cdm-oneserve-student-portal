import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { KeyRound, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

import { lfAdminApi } from "../services/lfApi";
import {
    getToken,
    rememberConsoleAdmin,
} from "../session";
import { LfButton, LfNotice, lfInputClass } from "../components/lfUi";

/**
 * Confirms the caller is a Lost & Found administrator before the console
 * renders.
 *
 * The check is a real API call to /api/lostfound/admin/me. That endpoint is
 * deliberately reachable even while an initial password change is pending, so
 * the gate can distinguish:
 *
 *   - not signed in        -> shared login
 *   - signed in, not admin -> forbidden notice
 *   - initial password due -> change-password screen (server also blocks
 *                             every other Lost & Found endpoint)
 *   - administrator        -> console
 *
 * A network fault is not a permission decision, so the console renders and
 * the screens surface their own error instead.
 */
export default function LfAdminGate({ children }) {
    const location = useLocation();
    const [state, setState] = useState("loading");
    const [me, setMe] = useState(null);

    const check = async () => {
        if (!getToken()) {
            setState("unauthenticated");
            return;
        }

        try {
            const response = await lfAdminApi.me();
            const data = response.data || null;
            setMe(data);
            rememberConsoleAdmin(data || {});

            if (data?.mustChangePassword) {
                setState("change");
                return;
            }

            setState("admin");
        } catch (err) {
            if (err.status === 401) setState("unauthenticated");
            else if (err.status === 403) setState("forbidden");
            else {
                toast.error(err.message);
                setState("admin");
            }
        }
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (cancelled) return;
            await check();
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (state === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF]">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#106A2E]/20 border-t-[#106A2E]" />
                    <p className="mt-3 text-xs text-slate-400">
                        Checking admin access...
                    </p>
                </div>
            </div>
        );
    }

    if (state === "unauthenticated") {
        return <Navigate to="/" replace />;
    }

    if (state === "forbidden") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-4">
                <div className="w-full max-w-md space-y-4">
                    <LfNotice tone="bad">
                        <span className="flex items-center gap-2 font-semibold">
                            <ShieldAlert size={16} aria-hidden="true" />
                            Lost &amp; Found admin access required
                        </span>
                        <span className="mt-1 block">
                            The Lost &amp; Found console is for the module owner
                            and the administrators they create. Student and
                            Faculty accounts should use the report board.
                        </span>
                    </LfNotice>

                    <div className="flex gap-2">
                        <a
                            href="/lost-found"
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-semibold text-slate-600"
                        >
                            Report board
                        </a>
                        <a
                            href="/admin/dashboard"
                            className="flex-1 rounded-xl bg-[#106A2E] px-4 py-2.5 text-center text-xs font-semibold text-white"
                        >
                            OneServe admin
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (state === "change") {
        return <ForcePasswordChange me={me} onDone={check} />;
    }

    return <div key={location.pathname}>{children}</div>;
}

// =====================================================
// FORCED INITIAL PASSWORD CHANGE
//
// Shown before the console mounts. The API blocks every other Lost &
// Found endpoint while MustChangePassword is true, so this is not merely
// a suggestion. The shared /api/profile/change-password endpoint is used,
// which also clears the flag for the next login.
// =====================================================

function ForcePasswordChange({ me, onDone }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        if (!currentPassword) {
            setError("Enter the initial password you were given.");
            return;
        }

        if (newPassword.length < 8) {
            setError("The new password must be at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("The new password and its confirmation do not match.");
            return;
        }

        if (newPassword === currentPassword) {
            setError("Choose a new password that is different from the initial one.");
            return;
        }

        setSaving(true);

        try {
            await lfAdminApi.changePassword({
                currentPassword,
                newPassword,
            });

            toast.success("Password changed. Welcome to the console.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            await onDone();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-4">
            <div className="w-full max-w-md space-y-4 rounded-[24px] border border-[#0E3B22]/10 bg-white p-7 shadow-xl shadow-black/5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-white">
                    <KeyRound size={22} aria-hidden="true" />
                </div>

                <div className="text-center">
                    <h1 className="text-lg font-bold text-slate-800">
                        Change your initial password
                    </h1>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {me?.fullName ? `${me.fullName}, your` : "Your"} account
                        was created with a temporary password. Choose your own
                        before using the Lost &amp; Found console.
                    </p>
                </div>

                {error && <LfNotice tone="bad">{error}</LfNotice>}

                <form onSubmit={submit} className="space-y-3">
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                            Initial password
                        </span>
                        <input
                            type="password"
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            className={lfInputClass}
                            placeholder="The password you were given"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                            New password
                        </span>
                        <input
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            className={lfInputClass}
                            placeholder="At least 8 characters"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                            Confirm new password
                        </span>
                        <input
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className={lfInputClass}
                            placeholder="Repeat the new password"
                        />
                    </label>

                    <LfButton type="submit" loading={saving} className="w-full">
                        Save password and continue
                    </LfButton>
                </form>
            </div>
        </div>
    );
}
