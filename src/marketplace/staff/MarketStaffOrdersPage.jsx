import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    ChevronRight,
    ClipboardList,
    MapPin,
    PackageCheck,
    Search,
    Truck,
} from "lucide-react";
import toast from "react-hot-toast";

import { staffApi } from "../services/marketApi";
import {
    FULFILLMENT,
    STATUS_FLOW,
    fulfillmentLabel,
    nextStatusAction,
    statusLabel,
    statusTone,
} from "../config/marketVocabulary";
import { formatDateTime, formatPeso } from "../utils/format";
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
 * Staff Orders, and one order's detail.
 *
 * The "next step" button is the important part: the server computes the only
 * legal next status for THIS order's fulfillment path and refuses anything else,
 * so a Pick Up order cannot be pushed down the delivery path, and staff cannot
 * skip a step. This screen just renders what the server says is next.
 */
export default function MarketStaffOrdersPage() {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const status = searchParams.get("status") || "";
    const method = searchParams.get("method") || "";
    const [search, setSearch] = useState("");

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await staffApi.orders({ status, method });
                if (cancelled) return;

                setOrders(response.data || []);
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
    }, [status, method]);

    const visible = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return orders;

        return orders.filter((order) =>
            [
                order.orderReference,
                order.buyerName,
                order.recipientName,
                order.campusLocationName,
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(needle))
        );
    }, [orders, search]);

    const setParam = (key, value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        setSearchParams(next);
    };

    if (orderId) {
        return (
            <StaffOrderDetail
                orderId={Number(orderId)}
                onBack={() => navigate("/marketplace/staff/orders")}
            />
        );
    }

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Orders"
                subtitle="Pick Up and Campus Delivery, one queue"
            />

            {/* Filters. Both fulfillment methods share the same order list; the
                Fulfillment filter is what separates the two screens. */}
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
                        className={`${marketInputClass} pl-8 py-2 text-xs`}
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
                    {[
                        ...STATUS_FLOW[FULFILLMENT.PICKUP],
                        ORDER_STATUSES_EXTRA(),
                    ]
                        .filter((value, index, all) => all.indexOf(value) === index)
                        .map((value) => (
                            <option key={value} value={value}>
                                {statusLabel(value)}
                            </option>
                        ))}
                </select>
            </div>

            {error && (
                <MarketNotice tone="error" title="Could not load orders">
                    {error}
                </MarketNotice>
            )}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={6} />
                </MarketPanel>
            ) : visible.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<ClipboardList size={20} />}
                        title="No orders match"
                        hint="Adjust the filters, or wait for the next order to come in."
                    />
                </MarketPanel>
            ) : (
                <MarketPanel>
                    {/* Desktop table */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-[9px] uppercase tracking-wider text-slate-400">
                                    <th className="px-4 py-2.5 font-semibold">Reference</th>
                                    <th className="px-4 py-2.5 font-semibold">Buyer</th>
                                    <th className="px-4 py-2.5 font-semibold">Fulfillment</th>
                                    <th className="px-4 py-2.5 font-semibold">Destination</th>
                                    <th className="px-4 py-2.5 font-semibold">Status</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {visible.map((order) => (
                                    <tr
                                        key={order.orderId}
                                        onClick={() =>
                                            navigate(`/marketplace/staff/orders/${order.orderId}`)
                                        }
                                        className="cursor-pointer transition hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-2.5">
                                            <p className="font-semibold text-slate-800">
                                                {order.orderReference}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {formatDateTime(order.createdAt)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <p className="text-slate-700">{order.buyerName}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {order.buyerAccountType}
                                            </p>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="inline-flex items-center gap-1 text-slate-600">
                                                {order.fulfillmentMethod ===
                                                FULFILLMENT.CAMPUS_DELIVERY ? (
                                                    <Truck size={11} />
                                                ) : (
                                                    <PackageCheck size={11} />
                                                )}
                                                {fulfillmentLabel(order.fulfillmentMethod)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {order.fulfillmentMethod ===
                                            FULFILLMENT.CAMPUS_DELIVERY
                                                ? `${order.campusLocationName || "-"}${
                                                      order.specificLocation
                                                          ? ` / ${order.specificLocation}`
                                                          : ""
                                                  }`
                                                : "-"}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone(order.status)}`}
                                            >
                                                {statusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                                            {formatPeso(order.totalCentavos)}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <ul className="divide-y divide-slate-100 md:hidden">
                        {visible.map((order) => (
                            <li key={order.orderId}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/marketplace/staff/orders/${order.orderId}`
                                        )
                                    }
                                    className="w-full p-3.5 text-left"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-xs font-semibold text-slate-800">
                                            {order.orderReference}
                                        </span>
                                        <span
                                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusTone(order.status)}`}
                                        >
                                            {statusLabel(order.status)}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {order.buyerName} &middot;{" "}
                                        {order.buyerAccountType}
                                    </p>

                                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                                        {order.fulfillmentMethod ===
                                        FULFILLMENT.CAMPUS_DELIVERY ? (
                                            <>
                                                <MapPin size={10} />
                                                {order.campusLocationName}
                                            </>
                                        ) : (
                                            <>
                                                <PackageCheck size={10} />
                                                {fulfillmentLabel(order.fulfillmentMethod)}
                                            </>
                                        )}
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-[#106A2E]">
                                        {formatPeso(order.totalCentavos)}
                                    </p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </MarketPanel>
            )}
        </div>
    );
}

// Cancelled is reachable from either flow, so it is added explicitly rather than
// pulled from one of them.
function ORDER_STATUSES_EXTRA() {
    return ["Cancelled"];
}

// =====================================================
// order detail with the next-step control
// =====================================================

function StaffOrderDetail({ orderId, onBack }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [advancing, setAdvancing] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const response = await staffApi.order(orderId);
                if (cancelled) return;
                setOrder(response.data);
            } catch (err) {
                if (!cancelled) toast.error(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [orderId]);

    const advance = async (nextStatus) => {
        setAdvancing(true);

        try {
            const response = await staffApi.updateOrderStatus(orderId, nextStatus);
            toast.success(response.message || "Order updated.");

            const refreshed = await staffApi.order(orderId);
            setOrder(refreshed.data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setAdvancing(false);
        }
    };

    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={5} />
            </MarketPanel>
        );
    }

    if (!order) {
        return (
            <MarketPanel>
                <MarketEmpty
                    icon={<ClipboardList size={20} />}
                    title="Order not found"
                />
            </MarketPanel>
        );
    }

    const isDelivery = order.fulfillmentMethod === FULFILLMENT.CAMPUS_DELIVERY;
    const flow = STATUS_FLOW[order.fulfillmentMethod] || STATUS_FLOW[FULFILLMENT.PICKUP];
    const currentIndex = flow.indexOf(order.status);
    const cancelled = order.status === "Cancelled";

    const canCancel =
        !cancelled &&
        order.status !== "Completed" &&
        order.status !== "Delivered" &&
        order.status !== "ReadyForPickup" &&
        order.status !== "OutForDelivery";

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={onBack}
                className="text-xs font-medium text-[#106A2E]/70"
            >
                &larr; Back to orders
            </button>

            <MarketPanel>
                <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div>
                        <p className="text-[9px] uppercase tracking-[.16em] text-slate-400">
                            Order reference
                        </p>
                        <p className="text-lg font-semibold text-slate-800">
                            {order.orderReference}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                            {order.buyerName} &middot; {order.buyerAccountType} &middot;{" "}
                            {formatDateTime(order.createdAt)}
                        </p>
                    </div>

                    <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusTone(order.status)}`}
                    >
                        {statusLabel(order.status)}
                    </span>
                </div>

                {/* The one action this screen offers. The button names the step
                    the server already considers next. */}
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 p-3.5">
                    {!cancelled && order.nextStatus && (
                        <MarketButton
                            onClick={() => advance(order.nextStatus)}
                            disabled={advancing}
                        >
                            {advancing ? "Updating..." : nextStatusAction(order.nextStatus)}
                        </MarketButton>
                    )}

                    {canCancel && (
                        <MarketButton
                            variant="secondary"
                            className="text-rose-600"
                            disabled={advancing}
                            onClick={() => {
                                if (
                                    window.confirm(
                                        "Cancel this order? The reserved items go back to stock."
                                    )
                                ) {
                                    advance("Cancelled");
                                }
                            }}
                        >
                            Cancel order
                        </MarketButton>
                    )}

                    {cancelled && (
                        <p className="text-[11px] text-rose-600">
                            Cancelled {formatDateTime(order.cancelledAt)}. Stock was
                            released.
                        </p>
                    )}

                    {order.status === "Completed" && (
                        <p className="text-[11px] text-slate-400">
                            Completed {formatDateTime(order.completedAt)}. Stock was
                            consumed.
                        </p>
                    )}
                </div>
            </MarketPanel>

            <MarketPanel title="Progress">
                <ol className="space-y-3 p-4">
                    {flow.map((step, index) => {
                        const reached = currentIndex >= index;

                        return (
                            <li key={step} className="flex items-start gap-3">
                                <span
                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                        reached
                                            ? "bg-[#106A2E] text-white"
                                            : "bg-slate-100 text-slate-400"
                                    }`}
                                >
                                    {reached ? "✓" : index + 1}
                                </span>
                                <span
                                    className={`text-xs font-semibold ${
                                        reached ? "text-slate-800" : "text-slate-400"
                                    }`}
                                >
                                    {statusLabel(step)}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </MarketPanel>

            {isDelivery && (
                <MarketPanel title="Campus delivery">
                    <div className="space-y-1.5 p-4 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">
                            {order.campusLocationName}
                        </p>
                        {order.specificLocation && <p>{order.specificLocation}</p>}
                        <p className="text-slate-400">
                            Recipient: {order.recipientName} &middot;{" "}
                            {order.contactNumber}
                        </p>
                        {order.deliveryInstructions && (
                            <p className="text-slate-400">
                                Instructions: {order.deliveryInstructions}
                            </p>
                        )}
                    </div>
                </MarketPanel>
            )}

            <MarketPanel title="Items">
                <ul className="divide-y divide-slate-100">
                    {order.items.map((item) => (
                        <li
                            key={item.orderItemId}
                            className="flex items-start justify-between gap-3 p-3.5"
                        >
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800">
                                    {item.productName}
                                    {item.variantName
                                        ? ` (${item.variantName})`
                                        : ""}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    {item.quantity} x {formatPeso(item.unitPriceCentavos)}
                                </p>
                            </div>
                            <span className="shrink-0 text-xs font-semibold text-slate-700">
                                {formatPeso(item.subtotalCentavos)}
                            </span>
                        </li>
                    ))}
                </ul>

                <div className="space-y-1.5 border-t border-slate-100 p-4">
                    <Row label="Subtotal" value={formatPeso(order.subtotalCentavos)} />
                    <Row
                        label="Campus delivery fee"
                        value={
                            order.deliveryFeeCentavos === 0
                                ? "Free"
                                : formatPeso(order.deliveryFeeCentavos)
                        }
                    />
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-semibold text-slate-800">
                            Total
                        </span>
                        <span className="text-base font-semibold text-[#106A2E]">
                            {formatPeso(order.totalCentavos)}
                        </span>
                    </div>
                    {order.notes && (
                        <p className="pt-1.5 text-[11px] text-slate-500">
                            Buyer note: {order.notes}
                        </p>
                    )}
                </div>
            </MarketPanel>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-700">{value}</span>
        </div>
    );
}