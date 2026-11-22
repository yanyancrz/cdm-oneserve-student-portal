import { RECORDS_PER_PAGE } from "../components/recordTable.js";
import { RecordPagination, SortHeader } from "../components/LfRecords";
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


const DEFAULT_QUERY = { page: 1, sort: "timestamp", descending: true };

export default function LfAdminActivityLogPage() {
    const consoleAdmin = getConsoleAdmin();
    const canManage = consoleAdmin.canManageAdmins;

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [query, setQuery] = useState(DEFAULT_QUERY);
    const [draft, setDraft] = useState({ search: "", administrator: "", activity: "", date: "", entityType: "" });
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { page } = query;
    const table = {
        sort: { key: query.sort, desc: query.descending },
        changeSort: (key) => setQuery((previous) => ({
            ...previous, page: 1, sort: key,
            descending: previous.sort === key && !previous.descending,
        })),
    };

    useEffect(() => {
        if (!canManage) return;
        const controller = new AbortController();
        lfAdminApi.activityLog({ ...query, pageSize: RECORDS_PER_PAGE }, controller.signal)
            .then((response) => {
                setItems(response.data?.items || []);
                setTotal(response.data?.total || 0);
                setError("");
            })
            .catch((error) => {
                if (!controller.signal.aborted) setError(error.message);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [canManage, query, refresh]);

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

    const totalPages = Math.max(1, Math.ceil(total / RECORDS_PER_PAGE));

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

                <LfButton variant="secondary" onClick={() => setRefresh((value) => value + 1)}>
                    <RefreshCw size={14} aria-hidden="true" /> Refresh
                </LfButton>
            </div>
            <form className="flex flex-wrap items-end gap-3 text-xs" onSubmit={(event) => {
                event.preventDefault();
                setQuery((previous) => ({ ...previous, ...draft, page: 1 }));
            }}>
                {[
                    ["search", "Search records", "search"],
                    ["administrator", "Administrator name", "text"],
                    ["activity", "Activity type", "text"],
                    ["date", "Activity date", "date"],
                ].map(([field, label, type]) => (
                    <label key={field}>
                        <span className="block font-semibold">{label}</span>
                        <input className="rounded-lg border p-2" type={type} value={draft[field]}
                            onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} />
                    </label>
                ))}
                <label>
                    <span className="block font-semibold">Record type</span>
                    <select className="rounded-lg border p-2" value={draft.entityType}
                        onChange={(event) => setDraft({ ...draft, entityType: event.target.value })}>
                        {ENTITY_FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
                <LfButton type="submit">Apply filters</LfButton>
                <LfButton type="button" variant="secondary" onClick={() => {
                    setDraft({ search: "", administrator: "", activity: "", date: "", entityType: "" });
                    setQuery(DEFAULT_QUERY);
                }}>Reset filters</LfButton>
            </form>

            {error && <LfNotice tone="bad">{error}</LfNotice>}
            <LfPanel title="Recorded actions">
                {loading ? <p role="status">Loading activity…</p> : items.length === 0 ? (
                    <LfEmpty
                        icon={History}
                        title="No matching activity"
                        message="Report reviews, claim decisions, pickups and account changes appear here."
                    />
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[1100px] text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <SortHeader table={table} field="timestamp" className={lfThClass}>When</SortHeader>
                                    <SortHeader table={table} field="actorName" className={lfThClass}>Administrator</SortHeader>
                                    <SortHeader table={table} field="actorRole" className={lfThClass}>Role</SortHeader>
                                    <SortHeader table={table} field="action" className={lfThClass}>Action</SortHeader>
                                    <SortHeader table={table} field="entityId" className={lfThClass}>Record</SortHeader>
                                    <SortHeader table={table} field="newStatus" className={lfThClass}>Status change</SortHeader>
                                    <SortHeader table={table} field="details" className={lfThClass}>Details</SortHeader>
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

                <RecordPagination page={Math.min(page, totalPages)} pages={totalPages} total={total}
                    onPage={(next) => setQuery((previous) => ({ ...previous, page: next }))} />
            </LfPanel>
        </div>
    );
}
