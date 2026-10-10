import { useEffect, useState } from "react";
import { History } from "lucide-react";

import { headApi } from "../services/marketApi";
import {
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
    marketSelectClass,
} from "../components/marketUi";
import { StaffPageHeader } from "./MarketStaffLayout";

const ACTION_TYPES = [
    "InitialStock",
    "Restock",
    "Adjustment",
    "Reservation",
    "Sale",
    "Cancellation",
    "Damage",
    "Correction",
];

/**
 * Activity Log - the Head's view of every stock movement.
 *
 * Because every stall shares one login per workspace, the OPERATOR NAME
 * column is the traceability that matters: it names the human on duty from
 * the validated session, next to the account that signed in.
 */
export default function MarketStaffAuditPage() {
    const [rows, setRows] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [workspaceId, setWorkspaceId] = useState("");
    const [operatorName, setOperatorName] = useState("");
    const [actionType, setActionType] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            setError("");

            const [auditRes, wsRes] = await Promise.all([
                headApi.audit({
                    workspaceId: workspaceId || undefined,
                    operatorName: operatorName.trim() || undefined,
                    actionType: actionType || undefined,
                    from: from || undefined,
                    to: to || undefined,
                    take: 200,
                }),
                workspaces.length === 0 ? headApi.workspaces() : null,
            ]);

            setRows(auditRes.data || []);
            if (wsRes) setWorkspaces(wsRes.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Operator Activity Log"
                subtitle="Every stock movement, with the operator on duty"
            />

            <MarketPanel title="Filters" subtitle="Narrow the trail">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="block text-xs font-semibold text-slate-600">
                        Workspace
                        <select
                            value={workspaceId}
                            onChange={(e) => setWorkspaceId(e.target.value)}
                            className={`${marketSelectClass} mt-1`}
                        >
                            <option value="">All workspaces</option>
                            {workspaces.map((workspace) => (
                                <option key={workspace.workspaceId} value={workspace.workspaceId}>
                                    {workspace.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block text-xs font-semibold text-slate-600">
                        Operator name
                        <input
                            value={operatorName}
                            onChange={(e) => setOperatorName(e.target.value)}
                            placeholder="e.g. Juan Dela Cruz"
                            className={`${marketInputClass} mt-1`}
                        />
                    </label>

                    <label className="block text-xs font-semibold text-slate-600">
                        Action
                        <select
                            value={actionType}
                            onChange={(e) => setActionType(e.target.value)}
                            className={`${marketSelectClass} mt-1`}
                        >
                            <option value="">All actions</option>
                            {ACTION_TYPES.map((action) => (
                                <option key={action} value={action}>
                                    {action}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block text-xs font-semibold text-slate-600">
                        From
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className={`${marketInputClass} mt-1`}
                        />
                    </label>

                    <label className="block text-xs font-semibold text-slate-600">
                        To
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className={`${marketInputClass} mt-1`}
                        />
                    </label>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={load}
                            className="w-full rounded-xl bg-[#106A2E] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0E3B22]"
                        >
                            Apply filters
                        </button>
                    </div>
                </div>
            </MarketPanel>

            {error && (
                <MarketNotice tone="error" title="Could not load the log">
                    {error}
                </MarketNotice>
            )}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={6} />
                </MarketPanel>
            ) : rows.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<History size={20} />}
                        title="No movements yet"
                        hint="Stock updates, sales and cancellations appear here with the operator's name."
                    />
                </MarketPanel>
            ) : (
                <MarketPanel
                    title={`${rows.length} movement${rows.length === 1 ? "" : "s"}`}
                    subtitle="Newest first"
                >
                    <ul className="divide-y divide-slate-100">
                        {rows.map((row) => (
                            <li key={row.transactionId} className="py-3">
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                    <span className="text-xs font-bold text-slate-800">
                                        {row.productName}
                                        {row.variantName ? ` (${row.variantName})` : ""}
                                    </span>
                                    <ChangeBadge change={row.quantityChanged} />
                                    <span className="text-[11px] text-slate-400">
                                        {row.previousQuantity} → {row.newQuantity}
                                    </span>
                                </div>
                                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                    {row.actionType}
                                    {" · "}
                                    {row.workspaceName}
                                    {" · "}
                                    {row.operatorName || row.actorName || "system"}
                                    {row.idLast3 ? ` (ID •••${row.idLast3})` : ""}
                                    {row.orderReference ? ` · ${row.orderReference}` : ""}
                                    {row.reason ? ` · ${row.reason}` : ""}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    {new Date(row.createdAt).toLocaleString()}
                                </p>
                            </li>
                        ))}
                    </ul>
                </MarketPanel>
            )}
        </div>
    );
}

function ChangeBadge({ change }) {
    const positive = change > 0;

    return (
        <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                positive ? "bg-emerald-50 text-[#106A2E]" : "bg-rose-50 text-rose-600"
            }`}
        >
            {positive ? `+${change}` : change}
        </span>
    );
}
