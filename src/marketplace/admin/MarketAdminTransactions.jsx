import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Receipt, Search } from "lucide-react";

import { adminApi } from "../services/marketApi";
import {
    FULFILLMENT,
    STATUS_FLOW,
    fulfillmentLabel,
    statusLabel,
    statusTone,
} from "../config/marketVocabulary";
import { formatDateTime, formatPeso } from "../utils/format";
import {
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";
import { AdminPageHeader } from "./MarketAdminLayout";

/**
 * Admin view of every Marketplace transaction.
 *
 * The same data the staff Transactions screen shows, reachable without operating
 * anything. This screen has no action column on purpose: monitoring cannot change
 * an order, and there is no API to call if it tried.
 */
export default function MarketAdminTransactions() {
    const [searchParams, setSearchParams] = useSearchParams();
    const method = searchParams.get("method") || "";
    const status = searchParams.get("status") || "";

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [accountType, setAccountType] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [workspaces, setWorkspaces] = useState([]);
    const [workspaceId, setWorkspaceId] = useState("");

    useEffect(() => {
        adminApi
            .workspaces()
            .then((response) => setWorkspaces(response.data || []))
            .catch(() => {
                // The table works without the filter; it just hides.
            });
    }, []);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await adminApi.transactions({
                    method,
                    status,
                    accountType,
                    workspaceId: workspaceId || undefined,
                    from: from ? new Date(from).toISOString() : undefined,
                    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
                });

                if (cancelled) return;
                setRows(response.data || []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [method, status, accountType, from, to, workspaceId]);

    const visible = search
        ? rows.filter((row) =>
              `${row.orderReference} ${row.buyerName} ${row.recipientName || ""}`
                  .toLowerCase()
                  .includes(search.toLowerCase())
          )
        : rows;

    const setParam = (key, value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        setSearchParams(next);
    };

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Transactions"
                subtitle="Every Marketplace order, read-only"
            />

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1">
                    <Search
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Reference, buyer, recipient..."
                        className={`${marketInputClass} py-2 pl-8 text-xs`}
                    />
                </div>

                <select
                    value={method}
                    onChange={(event) => setParam("method", event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                >
                    <option value="">All fulfillment</option>
                    <option value={FULFILLMENT.PICKUP}>Pick Up</option>
                    <option value={FULFILLMENT.CAMPUS_DELIVERY}>Campus Delivery</option>
                </select>

                <select
                    value={status}
                    onChange={(event) => setParam("status", event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                >
                    <option value="">All statuses</option>
                    {[...STATUS_FLOW[FULFILLMENT.CAMPUS_DELIVERY], "Cancelled"]
                        .filter((value, index, all) => all.indexOf(value) === index)
                        .map((value) => (
                            <option key={value} value={value}>
                                {statusLabel(value)}
                            </option>
                        ))}
                </select>

                <select
                    value={accountType}
                    onChange={(event) => setAccountType(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                >
                    <option value="">All accounts</option>
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                </select>

                {workspaces.length > 0 && (
                    <select
                        value={workspaceId}
                        onChange={(event) => setWorkspaceId(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                    >
                        <option value="">All stalls</option>
                        {workspaces.map((workspace) => (
                            <option key={workspace.workspaceId} value={workspace.workspaceId}>
                                {workspace.name}
                            </option>
                        ))}
                    </select>
                )}

                <input
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                />

                <input
                    type="date"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                />
            </div>

            {error && (
                <MarketNotice tone="error" title="Could not load transactions">
                    {error}
                </MarketNotice>
            )}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={8} />
                </MarketPanel>
            ) : visible.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<Receipt size={20} />}
                        title="No transactions"
                        hint="No Marketplace order matches the current filters."
                    />
                </MarketPanel>
            ) : (
                <MarketPanel>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-[9px] uppercase tracking-wider text-slate-400">
                                    <th className="px-4 py-2.5 font-semibold">Reference</th>
                                    <th className="px-4 py-2.5 font-semibold">Buyer</th>
                                    <th className="px-4 py-2.5 font-semibold">Fulfillment</th>
                                    <th className="px-4 py-2.5 font-semibold">Destination</th>
                                    <th className="px-4 py-2.5 font-semibold">Status</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Items</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {visible.map((row) => (
                                    <tr key={row.orderId} className="align-top">
                                        <td className="px-4 py-2.5">
                                            <p className="font-semibold text-slate-800">
                                                {row.orderReference}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {formatDateTime(row.createdAt)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <p className="text-slate-700">{row.buyerName}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {row.accountType}
                                            </p>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600">
                                            {fulfillmentLabel(row.fulfillmentMethod)}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {row.fulfillmentMethod ===
                                            FULFILLMENT.CAMPUS_DELIVERY
                                                ? `${row.campusLocationName || "-"}${
                                                      row.specificLocation
                                                          ? ` / ${row.specificLocation}`
                                                          : ""
                                                  }`
                                                : "-"}
                                            {row.recipientName && (
                                                <p className="text-[10px] text-slate-400">
                                                    {row.recipientName}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusTone(row.status)}`}
                                            >
                                                {statusLabel(row.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-slate-500">
                                            {row.itemCount}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                                            {formatPeso(row.totalCentavos)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </MarketPanel>
            )}
        </div>
    );
}