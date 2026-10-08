import { useEffect, useState } from "react";
import { MapPin, PackageCheck, Receipt, Search } from "lucide-react";

import { staffApi } from "../services/marketApi";
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
    MarketStat,
    marketInputClass,
} from "../components/marketUi";
import { StaffPageHeader } from "./MarketStaffLayout";

/**
 * Staff Transactions.
 *
 * Every order, in the shape the Admin monitoring view also uses - so the two
 * screens stay comparable and neither invents its own figures.
 *
 * NOTE ON THE TOTAL: the sum shown here is the SUM OF ALL FILTERED ORDERS, which
 * includes cancelled ones. It is a transaction log, not a revenue figure. The
 * revenue numbers (dashboard tiles) count completed orders only.
 */
export default function MarketStaffTransactionsPage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [status, setStatus] = useState("");
    const [method, setMethod] = useState("");
    const [search, setSearch] = useState("");

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await staffApi.transactions({
                    status,
                    method,
                    search,
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, method, from, to]);

    const filtered = search
        ? rows.filter((row) =>
              `${row.orderReference} ${row.buyerName} ${row.recipientName || ""}`
                  .toLowerCase()
                  .includes(search.toLowerCase())
          )
        : rows;

    const value = filtered.reduce((sum, row) => sum + row.totalCentavos, 0);
    const items = filtered.reduce((sum, row) => sum + row.itemCount, 0);

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Transactions"
                subtitle="Every order, with its items and destination"
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MarketStat label="Orders shown" value={filtered.length} />
                <MarketStat label="Items" value={items} />
                <MarketStat label="Value" value={formatPeso(value)} />
                <MarketStat
                    label="Cancelled"
                    value={filtered.filter((row) => row.status === "Cancelled").length}
                    tone="bad"
                />
            </div>

            <MarketNotice tone="info">
                This table is a log of every order in the current filter. Revenue
                totals on the Dashboard count completed orders only.
            </MarketNotice>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px] flex-1">
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
                    onChange={(event) => setMethod(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                >
                    <option value="">All fulfillment</option>
                    <option value={FULFILLMENT.PICKUP}>Pick Up</option>
                    <option value={FULFILLMENT.CAMPUS_DELIVERY}>Campus Delivery</option>
                </select>

                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                >
                    <option value="">All statuses</option>
                    {[...STATUS_FLOW[FULFILLMENT.PICKUP], "Cancelled", "Delivered", "OutForDelivery"]
                        .filter((value, index, all) => all.indexOf(value) === index)
                        .map((value) => (
                            <option key={value} value={value}>
                                {statusLabel(value)}
                            </option>
                        ))}
                </select>

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
            ) : filtered.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<Receipt size={20} />}
                        title="No transactions"
                        hint="No orders match the current filters."
                    />
                </MarketPanel>
            ) : (
                <MarketPanel>
                    {/* DESKTOP TABLE */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[760px] text-left text-xs">
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
                                {filtered.map((row) => (
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

                    {/* MOBILE CARDS */}
                    {/* A seven-column log on a phone means sideways scrolling to
                        read one reference number. The reference, buyer, total and
                        destination - what a counter operator scans for - are all
                        visible without scrolling. */}
                    <ul className="divide-y divide-slate-100 md:hidden">
                        {filtered.map((row) => (
                            <li key={row.orderId} className="p-3.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-slate-800">
                                            {row.orderReference}
                                        </p>
                                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                            {formatDateTime(row.createdAt)}
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusTone(row.status)}`}
                                    >
                                        {statusLabel(row.status)}
                                    </span>
                                </div>

                                <p className="mt-1.5 truncate text-xs text-slate-600">
                                    {row.buyerName}
                                    <span className="text-slate-400">
                                        {" \u00b7 "}
                                        {row.accountType}
                                    </span>
                                </p>

                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                                    {row.fulfillmentMethod ===
                                    FULFILLMENT.CAMPUS_DELIVERY ? (
                                        <>
                                            <MapPin size={10} />
                                            {row.campusLocationName}
                                            {row.specificLocation
                                                ? ` / ${row.specificLocation}`
                                                : ""}
                                        </>
                                    ) : (
                                        <>
                                            <PackageCheck size={10} />
                                            {fulfillmentLabel(row.fulfillmentMethod)}
                                        </>
                                    )}
                                </p>

                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400">
                                        {row.itemCount} item
                                        {row.itemCount === 1 ? "" : "s"}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-800">
                                        {formatPeso(row.totalCentavos)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </MarketPanel>
            )}
        </div>
    );
}
