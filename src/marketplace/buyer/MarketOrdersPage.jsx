import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ChevronRight,
    ClipboardList,
    MapPin,
    PackageCheck,
    Truck,
    XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { buyerApi } from "../services/marketApi";
import {
    FULFILLMENT,
    ORDER_STATUS,
    STATUS_FLOW,
    fulfillmentLabel,
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
} from "../components/marketUi";

/**
 * The buyer's order list and one order's detail.
 *
 * Every read here is scoped to the signed-in buyer on the server, so this screen
 * can only ever show the viewer's own history - swapping an id in the URL returns
 * "not found" rather than somebody else's order.
 */
export default function MarketOrdersPage() {
    const navigate = useNavigate();
    const { orderId } = useParams();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const response = await buyerApi.orders();
                if (cancelled) return;
                setOrders(response.data || []);
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
    }, []);

    const visible = orders.filter((order) => {
        if (filter === "all") return true;
        if (filter === "active") {
            return (
                order.status !== ORDER_STATUS.Completed &&
                order.status !== ORDER_STATUS.Cancelled
            );
        }
        if (filter === "completed") return order.status === ORDER_STATUS.Completed;
        if (filter === "cancelled") return order.status === ORDER_STATUS.Cancelled;
        return true;
    });

    if (orderId) {
        return (
            <OrderDetail
                orderId={Number(orderId)}
                onChanged={(updated) =>
                    setOrders((current) =>
                        current.map((order) =>
                            order.orderId === updated.orderId ? updated : order
                        )
                    )
                }
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                    { value: "all", label: "All" },
                    { value: "active", label: "In progress" },
                    { value: "completed", label: "Completed" },
                    { value: "cancelled", label: "Cancelled" },
                ].map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => setFilter(option.value)}
                        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                            filter === option.value
                                ? "border-[#106A2E] bg-[#106A2E] text-white"
                                : "border-slate-200 bg-white text-slate-500"
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={4} />
                </MarketPanel>
            ) : visible.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<ClipboardList size={20} />}
                        title="No orders yet"
                        hint="Your CampusMarket orders will appear here with their status."
                        action={
                            <MarketButton onClick={() => navigate("/marketplace")}>
                                Browse the store
                            </MarketButton>
                        }
                    />
                </MarketPanel>
            ) : (
                <div className="space-y-3">
                    {visible.map((order) => (
                        <button
                            key={order.orderId}
                            type="button"
                            onClick={() =>
                                navigate(`/marketplace/orders/${order.orderId}`)
                            }
                            className="flex w-full items-center gap-3 rounded-2xl border border-[#0E3B22]/10 bg-white p-3.5 text-left shadow-sm transition active:scale-[0.99]"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-xs font-semibold text-slate-800">
                                        {order.orderReference}
                                    </span>
                                    <span
                                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusTone(order.status)}`}
                                    >
                                        {statusLabel(order.status)}
                                    </span>
                                </div>

                                <p className="mt-1 text-[11px] text-slate-400">
                                    {formatDateTime(order.createdAt)} &middot;{" "}
                                    {order.items.length} item
                                    {order.items.length === 1 ? "" : "s"}
                                </p>

                                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                    {order.fulfillmentMethod === FULFILLMENT.CAMPUS_DELIVERY ? (
                                        <>
                                            <MapPin size={11} />
                                            {order.campusLocationName || "Campus location"}
                                        </>
                                    ) : (
                                        <>
                                            <PackageCheck size={11} />
                                            {fulfillmentLabel(order.fulfillmentMethod)}
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold text-[#106A2E]">
                                    {formatPeso(order.totalCentavos)}
                                </p>
                                <ChevronRight
                                    size={15}
                                    className="ml-auto mt-1 text-slate-300"
                                />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// =====================================================
// order detail
// =====================================================

function OrderDetail({ orderId, onChanged }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const response = await buyerApi.order(orderId);
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

    const cancel = async () => {
        if (!window.confirm("Cancel this order? The items will be released back to stock.")) {
            return;
        }

        setCancelling(true);

        try {
            const response = await buyerApi.cancelOrder(orderId, "Cancelled by buyer");
            toast.success(response.message || "Order cancelled.");

            const refreshed = await buyerApi.order(orderId);
            setOrder(refreshed.data);
            onChanged?.(refreshed.data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setCancelling(false);
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
                    hint="This order does not exist, or it is not yours."
                />
            </MarketPanel>
        );
    }

    const isDelivery = order.fulfillmentMethod === FULFILLMENT.CAMPUS_DELIVERY;
    const flow = STATUS_FLOW[order.fulfillmentMethod] || STATUS_FLOW[FULFILLMENT.PICKUP];
    const currentIndex = flow.indexOf(order.status);
    const cancelled = order.status === ORDER_STATUS.Cancelled;

    // The server decides whether cancelling is still allowed; the UI only
    // mirrors the states where it makes sense to offer the button.
    const canCancel =
        !cancelled &&
        order.status !== ORDER_STATUS.Completed &&
        order.status !== ORDER_STATUS.Delivered &&
        order.status !== ORDER_STATUS.ReadyForPickup &&
        order.status !== ORDER_STATUS.OutForDelivery;

    return (
        <div className="space-y-4">
            <MarketPanel>
                <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[.16em] text-slate-400">
                                Order reference
                            </p>
                            <p className="truncate text-base font-semibold text-slate-800">
                                {order.orderReference}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                Placed {formatDateTime(order.createdAt)}
                            </p>
                        </div>

                        <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusTone(order.status)}`}
                        >
                            {statusLabel(order.status)}
                        </span>
                    </div>
                </div>
            </MarketPanel>

            {/* The timeline follows THIS order's fulfillment path. A Pick Up order
                never shows delivery steps, and vice versa. */}
            <MarketPanel title="Progress">
                <div className="p-4">
                    {cancelled ? (
                        <MarketNotice tone="error" title="This order was cancelled">
                            Cancelled {formatDateTime(order.cancelledAt)}. The reserved
                            items were released back to stock.
                        </MarketNotice>
                    ) : (
                        <ol className="space-y-3">
                            {flow.map((step, index) => {
                                const reached = currentIndex >= index;
                                const isCurrent = currentIndex === index;

                                return (
                                    <li
                                        key={step}
                                        className="flex items-start gap-3"
                                    >
                                        <span
                                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                                reached
                                                    ? "bg-[#106A2E] text-white"
                                                    : "bg-slate-100 text-slate-400"
                                            }`}
                                        >
                                            {reached ? "âœ“" : index + 1}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={`text-xs font-semibold ${
                                                    reached
                                                        ? "text-slate-800"
                                                        : "text-slate-400"
                                                }`}
                                            >
                                                {statusLabel(step)}
                                            </p>
                                            {isCurrent && (
                                                <p className="text-[10px] text-[#106A2E]/60">
                                                    Current step
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}

                    {canCancel && (
                        <MarketButton
                            variant="secondary"
                            size="sm"
                            className="mt-4 w-full text-rose-600"
                            onClick={cancel}
                            disabled={cancelling}
                        >
                            <XCircle size={12} />
                            {cancelling ? "Cancelling..." : "Cancel order"}
                        </MarketButton>
                    )}
                </div>
            </MarketPanel>

            <MarketPanel
                title={isDelivery ? "Campus delivery" : "Pick up"}
                action={
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#106A2E]">
                        {isDelivery ? <Truck size={11} /> : <PackageCheck size={11} />}
                        {fulfillmentLabel(order.fulfillmentMethod)}
                    </span>
                }
            >
                <div className="space-y-1.5 p-4 text-xs text-slate-600">
                    {isDelivery ? (
                        <>
                            <p className="font-semibold text-slate-800">
                                {order.campusLocationName}
                            </p>
                            {order.specificLocation && <p>{order.specificLocation}</p>}
                            <p className="text-slate-400">
                                Recipient: {order.recipientName} &middot; {order.contactNumber}
                            </p>
                            {order.deliveryInstructions && (
                                <p className="text-slate-400">
                                    Instructions: {order.deliveryInstructions}
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-slate-400">
                            Collect your order at the campus counter. Marketplace Staff
                            will notify you when it is ready.
                        </p>
                    )}
                </div>
            </MarketPanel>

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
                                    {item.variantName ? ` (${item.variantName})` : ""}
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
                        label="Delivery fee"
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
                    <p className="pt-1 text-[10px] text-slate-400">
                        Payment: cash on{" "}
                        {isDelivery ? "campus delivery" : "pickup"} (
                        {order.paymentStatus})
                    </p>
                </div>
            </MarketPanel>

            {order.notes && (
                <MarketPanel title="Your note">
                    <p className="p-4 text-xs leading-5 text-slate-600">
                        {order.notes}
                    </p>
                </MarketPanel>
            )}
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
