import { useEffect, useState } from "react";
import { History, RefreshCw, ShieldCheck } from "lucide-react";

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
// ADMIN ACTIVITY LOG (SUPER ADMIN ONLY, APPEND-ONLY)
//
// Every report review, claim decision, pickup and account change.
// There is deliberately no edit or delete control: the server exposes
// read endpoints only, so the trail cannot be rewritten from the UI.
// =====================================================

const ENTITY_FILTERS = [
    { value: "", label: "All records" },
    { value: "Report", label: "Reports" },
    { value: "Claim", label: "Claims" },
    { value: "Pickup", label: "Pickups" },
    { value: "Administrator", label: "Administrators" },
];

const PAGE_SIZE = 50;

export default function LfAdminActivityLogPage() {
    const consoleAdmin = getConsoleAdmin();
    const canManage = consoleAdmin.canManageAdmins;

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [entityType, setEntityType] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const load = async ({ resetPage = false, isRefresh = false } = {}) => {
        const nextPage = resetPage ? 1 : page;

        if (isRefresh) setRefreshing(true);

        try {
            const response = await lfAdminApi.activityLog({
                page: nextPage,
                pageSize: PAGE_SIZE,
                entityType: entityType || undefined,
            });

            setItems(response.data?.items || []);
            setTotal(response.data?.total || 0);
            if (resetPage) setPage(1);
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

            if (canManage) await load({ resetPage: true });
            else if (!cancelled) setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManage, entityType]);

    if (!canManage) {
        return (
            <LfNotice tone="bad">
                <span className="flex items-center gap-2 font-semibold">
                    <ShieldCheck size={16} aria-hidden="true" />
                    Super Admin access required
                </span>
                <span className="mt-1 block">
                    The activity log is an administrative record and is not
                    available to Sub-Admins.
                </span>
            </LfNotice>
        );
    }

    if (loading) return <LfSkeleton rows={6} />;
    if (error) return <LfNotice tone="bad">{error}</LfNotice>;

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-800">
                        Admin Activity Log
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Append-only. Every administrator action is recorded with
                        who did it, when, and the previous / new status.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={entityType}
                        onChange={(event) => setEntityType(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none"
                    >
                        {ENTITY_FILTERS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <LfButton
                        variant="secondary"
                        onClick={() => load({ isRefresh: true })}
                        loading={refreshing}
                    >
                        <RefreshCw size={14} aria-hidden="true" />
                        Refresh
                    </LfButton>
                </div>
            </div>

            <LfPanel
                title="Recorded actions"
                subtitle={`${total} entr${total === 1 ? "y" : "ies"} · page ${page} of ${totalPages}`}
            >
                {items.length === 0 ? (
                    <LfEmpty
                        icon={History}
                        title="No activity recorded"
                        message="Report reviews, claim decisions, pickups and account changes appear here."
                    />
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[1100px] text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className={lfThClass}>When</th>
                                    <th className={lfThClass}>Administrator</th>
                                    <th className={lfThClass}>Role</th>
                                    <th className={lfThClass}>Action</th>
                                    <th className={lfThClass}>Record</th>
                                    <th className={lfThClass}>Status change</th>
                                    <th className={lfThClass}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className={lfTrClass}>
                                        <td className={`${lfTdClass} whitespace-nowrap text-slate-500`}>
                                            {formatDateTime(item.timestamp)}
                                        </td>
                                        <td className={`${lfTdClass} font-semibold text-slate-800`}>
                                            {item.actorName}
                                        </td>
                                        <td className={lfTdClass}>
                                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                                {item.actorRoleLabel || item.actorRole || "—"}
                                            </span>
                                        </td>
                                        <td className={`${lfTdClass} font-medium text-slate-700`}>
                                            {item.action}
                                        </td>
                                        <td className={`${lfTdClass} text-slate-600`}>
                                            {item.entityType || "—"}
                                            {item.entityId ? ` #${item.entityId}` : ""}
                                        </td>
                                        <td className={`${lfTdClass} text-slate-600`}>
                                            {item.previousStatus || item.newStatus ? (
                                                <span className="flex flex-wrap items-center gap-1">
                                                    <span className="text-slate-400">
                                                        {item.previousStatus || "—"}
                                                    </span>
                                                    <span aria-hidden="true">→</span>
                                                    <span className="font-semibold text-slate-700">
                                                        {item.newStatus || "—"}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className={`${lfTdClass} max-w-[320px] text-slate-500`}>
                                            {item.details || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => {
                                const next = page - 1;
                                setPage(next);
                                lfAdminApi
                                    .activityLog({
                                        page: next,
                                        pageSize: PAGE_SIZE,
                                        entityType: entityType || undefined,
                                    })
                                    .then((response) => {
                                        setItems(response.data?.items || []);
                                        setTotal(response.data?.total || 0);
                                    });
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <span className="text-[11px] text-slate-400">
                            {page} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => {
                                const next = page + 1;
                                setPage(next);
                                lfAdminApi
                                    .activityLog({
                                        page: next,
                                        pageSize: PAGE_SIZE,
                                        entityType: entityType || undefined,
                                    })
                                    .then((response) => {
                                        setItems(response.data?.items || []);
                                        setTotal(response.data?.total || 0);
                                    });
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </LfPanel>
        </div>
    );
}
