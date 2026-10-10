import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Boxes, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";

import { staffApi } from "../services/marketApi";
import { STOCK_STATE, stockStateTone } from "../config/marketVocabulary";
import { formatPeso } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";
import { StaffPageHeader } from "./MarketStaffLayout";

/**
 * Staff Inventory.
 *
 * Three numbers per row, and the relationship between them is the whole point:
 *
 *   Current  - what is on the shelf, counted by staff.
 *   Reserved - held by open orders. NOT editable here; it belongs to the orders.
 *   Available = Current - Reserved. What a buyer can actually order.
 *
 * Two write paths, deliberately different:
 *   * SET     replaces Current. Refused if it would drop below Reserved, because
 *             the shelf must never promise less than open orders have claimed.
 *   * RESTOCK adds to Current. Additive on purpose, so a miscount tops the shelf
 *             up instead of silently wiping it.
 */
export default function MarketStaffInventoryPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const stockState = searchParams.get("state") || "";

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(null);

    // Stock vs History: the history is this workspace's audit trail - every
    // movement with the operator on duty - while Stock is the live counts.
    const [tab, setTab] = useState("stock");
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await staffApi.inventory({ stockState });
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
    }, [stockState]);

    const visible = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return rows;

        return rows.filter((row) =>
            `${row.productName} ${row.variantName} ${row.category}`
                .toLowerCase()
                .includes(needle)
        );
    }, [rows, search]);

    const setState = (value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set("state", value);
        else next.delete("state");
        setSearchParams(next);
    };

    useEffect(() => {
        if (tab !== "history") return undefined;

        let cancelled = false;

        const loadHistory = async () => {
            try {
                setHistoryLoading(true);
                setHistoryError("");

                const response = await staffApi.inventoryHistory({ take: 100 });
                if (cancelled) return;

                setHistory(response.data || []);
            } catch (err) {
                if (!cancelled) setHistoryError(err.message);
            } finally {
                if (!cancelled) setHistoryLoading(false);
            }
        };

        loadHistory();
        return () => {
            cancelled = true;
        };
    }, [tab]);

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Inventory"
                subtitle="Current, reserved and available stock"
            />

            {/* The arithmetic, stated once. */}
            <MarketNotice tone="info">
                Available = Current &minus; Reserved. Reserved is held by open orders and
                is released on cancel, consumed on complete.
            </MarketNotice>

            <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1">
                {[
                    { value: "stock", label: "Stock" },
                    { value: "history", label: "History" },
                ].map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => setTab(item.value)}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            tab === item.value
                                ? "bg-white text-[#106A2E] shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {tab === "history" ? (
                <HistoryList
                    rows={history}
                    loading={historyLoading}
                    error={historyError}
                />
            ) : (
            <>
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
                        placeholder="Search item or size..."
                        className={`${marketInputClass} py-2 pl-8 text-xs`}
                    />
                </div>

                <select
                    value={stockState}
                    onChange={(event) => setState(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                >
                    <option value="">All stock</option>
                    <option value={STOCK_STATE.OUT}>Out of stock</option>
                    <option value={STOCK_STATE.LOW}>Low stock</option>
                    <option value={STOCK_STATE.HEALTHY}>Healthy</option>
                </select>
            </div>

            {error && (
                <MarketNotice tone="error" title="Could not load inventory">
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
                        icon={<Boxes size={20} />}
                        title="No inventory rows"
                        hint="Inventory rows are created when a product or one of its sizes is added."
                    />
                </MarketPanel>
            ) : (
                <MarketPanel>
                    {/* DESKTOP TABLE */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[760px] text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-[9px] uppercase tracking-wider text-slate-400">
                                    <th className="px-4 py-2.5 font-semibold">Item</th>
                                    <th className="px-4 py-2.5 font-semibold">Type</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Price</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Current</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Reserved</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Available</th>
                                    <th className="px-4 py-2.5 font-semibold">State</th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {visible.map((row) => (
                                    <tr key={row.inventoryId} className="transition hover:bg-slate-50">
                                        <td className="px-4 py-2.5">
                                            <p className="font-semibold text-slate-800">
                                                {row.productName}
                                            </p>
                                            {row.variantName && (
                                                <p className="text-[10px] text-slate-400">
                                                    Size: {row.variantName}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {row.subCategory || row.category}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-slate-600">
                                            {formatPeso(row.priceCentavos)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                                            {row.stockQuantity}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-slate-500">
                                            {row.reservedQuantity}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-[#106A2E]">
                                            {row.availableQuantity}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${stockStateTone(row.stockState)}`}
                                            >
                                                {row.stockState === STOCK_STATE.OUT
                                                    ? "Out of stock"
                                                    : row.stockState === STOCK_STATE.LOW
                                                      ? "Low"
                                                      : "Healthy"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <MarketButton
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setEditing(row)}
                                            >
                                                Manage
                                            </MarketButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARDS */}
                    {/* An eight-column table on a phone means sideways scrolling
                        to read a stock count. The three numbers staff actually
                        came for - Current, Reserved, Available - are shown as a
                        labelled strip instead, which also makes the
                        Current - Reserved = Available relationship visible at a
                        glance rather than something to work out from columns. */}
                    <ul className="divide-y divide-slate-100 md:hidden">
                        {visible.map((row) => (
                            <li key={row.inventoryId} className="p-3.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-slate-800">
                                            {row.productName}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                            {row.variantName
                                                ? `Size ${row.variantName} \u00b7 `
                                                : ""}
                                            {row.subCategory || row.category}
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${stockStateTone(row.stockState)}`}
                                    >
                                        {row.stockState === STOCK_STATE.OUT
                                            ? "Out of stock"
                                            : row.stockState === STOCK_STATE.LOW
                                              ? "Low"
                                              : "Healthy"}
                                    </span>
                                </div>

                                <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                                    {[
                                        { label: "Price", value: formatPeso(row.priceCentavos) },
                                        { label: "Current", value: row.stockQuantity },
                                        { label: "Reserved", value: row.reservedQuantity },
                                        {
                                            label: "Available",
                                            value: row.availableQuantity,
                                            accent: true,
                                        },
                                    ].map((cell) => (
                                        <div
                                            key={cell.label}
                                            className="rounded-lg bg-slate-50 px-2 py-1.5 text-center"
                                        >
                                            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                                                {cell.label}
                                            </p>
                                            <p
                                                className={`mt-0.5 text-xs font-semibold ${
                                                    cell.accent
                                                        ? "text-[#106A2E]"
                                                        : "text-slate-700"
                                                }`}
                                            >
                                                {cell.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <MarketButton
                                    variant="secondary"
                                    size="sm"
                                    className="mt-2.5 w-full"
                                    onClick={() => setEditing(row)}
                                >
                                    Manage stock
                                </MarketButton>
                            </li>
                        ))}
                    </ul>
                </MarketPanel>
            )}
            </>
            )}

            {editing && (
                <InventoryModal
                    row={editing}
                    onClose={() => setEditing(null)}
                    onSaved={(updated) => {
                        setRows((current) =>
                            current.map((item) =>
                                item.inventoryId === updated.inventoryId
                                    ? updated
                                    : item
                            )
                        );
                    }}
                />
            )}
        </div>
    );
}

/**
 * This workspace's audit trail: every stock movement with the operator on
 * duty. Read-only - history is written by the workflows, never edited here.
 */
function HistoryList({ rows, loading, error }) {
    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={6} />
            </MarketPanel>
        );
    }

    if (error) {
        return (
            <MarketNotice tone="error" title="Could not load history">
                {error}
            </MarketNotice>
        );
    }

    if (rows.length === 0) {
        return (
            <MarketPanel>
                <MarketEmpty
                    icon={<Boxes size={20} />}
                    title="No movements yet"
                    hint="Restocks, adjustments, sales and cancellations appear here with the operator's name."
                />
            </MarketPanel>
        );
    }

    return (
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
                            <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                    row.quantityChanged > 0
                                        ? "bg-emerald-50 text-[#106A2E]"
                                        : "bg-rose-50 text-rose-600"
                                }`}
                            >
                                {row.quantityChanged > 0
                                    ? `+${row.quantityChanged}`
                                    : row.quantityChanged}
                            </span>
                            <span className="text-[11px] text-slate-400">
                                {row.previousQuantity} → {row.newQuantity}
                            </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                            {row.actionType}
                            {row.operatorName ? ` · ${row.operatorName}` : ""}
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
    );
}

/**
 * Two separate actions, never merged into one ambiguous field.
 *
 * SET is for a recount. It is refused when the new count is below what open
 * orders have already reserved, so stock can never contradict pending orders.
 *
 * RESTOCK is additive, so a mistyped addition tops the shelf up instead of
 * replacing it with a wrong number.
 *
 * Both carry a reason: it lands in the audit trail next to the operator's name.
 */
function InventoryModal({ row, onClose, onSaved }) {
    const [quantity, setQuantity] = useState(String(row.stockQuantity));
    const [threshold, setThreshold] = useState(String(row.lowStockThreshold));
    const [restockAmount, setRestockAmount] = useState("");
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [restocking, setRestocking] = useState(false);
    const [error, setError] = useState("");

    const save = async () => {
        setSaving(true);
        setError("");

        try {
            const response = await staffApi.saveInventory(row.inventoryId, {
                stockQuantity: Number(quantity) || 0,
                lowStockThreshold: Number(threshold) || 0,
                reason: reason.trim(),
            });

            toast.success(response.message || "Inventory updated.");
            onSaved(response.data);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const restock = async () => {
        const amount = Number(restockAmount);
        if (!amount || amount <= 0) return;

        setRestocking(true);
        setError("");

        try {
            const response = await staffApi.restock(row.inventoryId, {
                quantity: amount,
                reason: reason.trim(),
            });
            toast.success(response.message || "Stock added.");
            onSaved(response.data);
            setRestockAmount("");
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setRestocking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
            <div className="w-full max-w-md rounded-t-2xl bg-white sm:rounded-2xl">
                <header className="border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-800">
                        {row.productName}
                        {row.variantName ? ` - ${row.variantName}` : ""}
                    </h2>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatPeso(row.priceCentavos)} &middot;{" "}
                        {row.subCategory || row.category}
                    </p>
                </header>

                <div className="space-y-4 p-4">
                    {error && (
                        <MarketNotice tone="error" title="Could not update">
                            {error}
                        </MarketNotice>
                    )}

                    {/* Current state, shown so the edit is made against real numbers. */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: "Current", value: row.stockQuantity, tone: "text-slate-800" },
                            { label: "Reserved", value: row.reservedQuantity, tone: "text-slate-500" },
                            {
                                label: "Available",
                                value: row.availableQuantity,
                                tone: "text-[#106A2E]",
                            },
                        ].map((cell) => (
                            <div
                                key={cell.label}
                                className="rounded-xl border border-slate-100 px-3 py-2"
                            >
                                <p className="text-[9px] uppercase tracking-wider text-slate-400">
                                    {cell.label}
                                </p>
                                <p className={`mt-0.5 text-base font-semibold ${cell.tone}`}>
                                    {cell.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* SET */}
                    <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-700">
                            Set the on-hand count
                        </p>
                        <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                            Use this after recounting the shelf. It must stay at or
                            above the {row.reservedQuantity} reserved unit
                            {row.reservedQuantity === 1 ? "" : "s"}.
                        </p>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <label className="block">
                                <span className="mb-1 block text-[9px] uppercase tracking-wider text-slate-400">
                                    Current
                                </span>
                                <input
                                    type="number"
                                    min={row.reservedQuantity}
                                    value={quantity}
                                    onChange={(event) => setQuantity(event.target.value)}
                                    className={marketInputClass}
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-[9px] uppercase tracking-wider text-slate-400">
                                    Low threshold
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    value={threshold}
                                    onChange={(event) => setThreshold(event.target.value)}
                                    className={marketInputClass}
                                />
                            </label>
                        </div>

                        <MarketButton
                            className="mt-2 w-full"
                            size="sm"
                            onClick={save}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save count"}
                        </MarketButton>
                    </div>

                    {/* REASON - recorded in the audit trail with the operator's name. */}
                    <div>
                        <span className="mb-1 block text-[9px] uppercase tracking-wider text-slate-400">
                            Reason (shown in the history)
                        </span>
                        <input
                            type="text"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="e.g. Delivery received, recount, damaged items"
                            maxLength={500}
                            className={marketInputClass}
                        />
                    </div>

                    {/* RESTOCK */}
                    <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-700">
                            Add stock
                        </p>
                        <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                            Additive, so a mistake tops the shelf up instead of
                            overwriting the count.
                        </p>

                        <div className="mt-2 flex gap-2">
                            <input
                                type="number"
                                min="1"
                                value={restockAmount}
                                onChange={(event) => setRestockAmount(event.target.value)}
                                placeholder="Quantity to add"
                                className={marketInputClass}
                            />

                            <MarketButton
                                variant="secondary"
                                onClick={restock}
                                disabled={restocking || !restockAmount}
                                className="shrink-0"
                            >
                                <Plus size={12} />
                                {restocking ? "Adding..." : "Add"}
                            </MarketButton>
                        </div>
                    </div>
                </div>

                <footer className="border-t border-slate-100 px-4 py-3">
                    <MarketButton variant="secondary" className="w-full" onClick={onClose}>
                        Close
                    </MarketButton>
                </footer>
            </div>
        </div>
    );
}