import { useEffect, useState } from "react";
import { Clock, Monitor, RefreshCw, ShieldCheck } from "lucide-react";

import { lfAdminApi } from "../services/lfApi";
import { formatDateTime } from "../config/lfTheme";
import { getConsoleAdmin } from "../session";
import {
    LfButton,
    LfEmpty,
    LfNotice,
    LfPanel,
    LfSkeleton,
    lfTdClass,
    lfThClass,
    lfTrClass,
} from "../components/lfUi";

// =====================================================
// ADMIN LOGIN ACTIVITY (SUPER ADMIN ONLY)
//
// One row per login: administrator, role, login time, logout time,
// last activity and a server-derived session status.
//
// "Session Expired" is how an app closed without signing out is
// represented: the JWT lifetime (8 hours) ends the session, so the
// console never leaves a closed browser "Active" forever.
// =====================================================

const STATUS_STYLES = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Logged Out": "bg-slate-100 text-slate-600 border-slate-200",
    "Session Expired": "bg-amber-50 text-amber-700 border-amber-200",
};

export default function LfAdminLoginActivityPage() {
    const consoleAdmin = getConsoleAdmin();
    const canManage = consoleAdmin.canManageAdmins;

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);

        try {
            const response = await lfAdminApi.loginActivity();
            setRows(response.data || []);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (cancelled) return;

            if (canManage) await load();
            else if (!cancelled) setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [canManage]);

    if (!canManage) {
        return (
            <LfNotice tone="bad">
                <span className="flex items-center gap-2 font-semibold">
                    <ShieldCheck size={16} aria-hidden="true" />
                    Super Admin access required
                </span>
                <span className="mt-1 block">
                    Login monitoring is an administrative function and is not
                    available to Sub-Admins.
                </span>
            </LfNotice>
        );
    }

    if (loading) return <LfSkeleton rows={6} />;
    if (error) return <LfNotice tone="bad">{error}</LfNotice>;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-800">
                        Admin Login Activity
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Every Lost &amp; Found administrator sign-in, with the
                        current session state. Showing the last 90 days.
                    </p>
                </div>

                <LfButton
                    variant="secondary"
                    onClick={() => load(true)}
                    loading={refreshing}
                >
                    <RefreshCw size={14} aria-hidden="true" />
                    Refresh
                </LfButton>
            </div>

            <LfPanel
                title="Login sessions"
                subtitle={`${rows.length} session${rows.length === 1 ? "" : "s"}, newest first`}
            >
                {rows.length === 0 ? (
                    <LfEmpty
                        icon={Clock}
                        title="No login activity yet"
                        message="Administrator sign-ins appear here as soon as they log in."
                    />
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[1000px] text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className={lfThClass}>Administrator</th>
                                    <th className={lfThClass}>Role</th>
                                    <th className={lfThClass}>Login</th>
                                    <th className={lfThClass}>Logout</th>
                                    <th className={lfThClass}>Last activity</th>
                                    <th className={lfThClass}>Session</th>
                                    <th className={lfThClass}>Device</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.sessionId} className={lfTrClass}>
                                        <td className={lfTdClass}>
                                            <span className="block font-semibold text-slate-800">
                                                {row.fullName}
                                            </span>
                                            <span className="block text-[10px] text-slate-400">
                                                {row.email}
                                            </span>
                                            {row.isCurrentSession && (
                                                <span className="mt-0.5 inline-block rounded-full bg-[#106A2E]/10 px-2 py-0.5 text-[9px] font-bold text-[#106A2E]">
                                                    This device
                                                </span>
                                            )}
                                        </td>
                                        <td className={lfTdClass}>
                                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                                {row.roleLabel}
                                            </span>
                                        </td>
                                        <td className={`${lfTdClass} whitespace-nowrap text-slate-600`}>
                                            {formatDateTime(row.loginAt)}
                                        </td>
                                        <td className={`${lfTdClass} whitespace-nowrap text-slate-600`}>
                                            {row.logoutAt ? (
                                                <>
                                                    {formatDateTime(row.logoutAt)}
                                                    {row.logoutReason && (
                                                        <span className="mt-0.5 block text-[10px] text-slate-400">
                                                            {row.logoutReason}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className={`${lfTdClass} whitespace-nowrap text-slate-500`}>
                                            {formatDateTime(row.lastActivityAt)}
                                        </td>
                                        <td className={lfTdClass}>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                                                    STATUS_STYLES[row.sessionStatus] ||
                                                    "bg-slate-100 text-slate-600 border-slate-200"
                                                }`}
                                            >
                                                {row.sessionStatus}
                                            </span>
                                        </td>
                                        <td className={lfTdClass}>
                                            <span className="flex items-center gap-1.5 text-slate-600">
                                                <Monitor size={12} aria-hidden="true" />
                                                {row.deviceLabel || "Unknown device"}
                                            </span>
                                            {row.ipAddress && (
                                                <span className="mt-0.5 block text-[10px] text-slate-400">
                                                    {row.ipAddress}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </LfPanel>

            <p className="text-[11px] leading-5 text-slate-400">
                A session that is closed without pressing Log out is shown as
                <strong> Session Expired</strong> once its eight-hour token
                lifetime ends. This keeps the record honest without inventing a
                logout time the server never saw.
            </p>
        </div>
    );
}
