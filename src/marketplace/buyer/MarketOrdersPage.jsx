import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ChevronRight,
    ClipboardList,
    Clock,
    CreditCard,
    MapPin,
    PackageCheck,
    RotateCcw,
    Star,
    Truck,
    XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { buyerApi, refundApi, reviewApi } from "../services/marketApi";
import {
    FULFILLMENT,
    ORDER_BUCKET_OPTIONS,
    ORDER_STATUS,
    PAYMENT_METHOD,
    PAYMENT_STATUS,
    STATUS_FLOW,
    fulfillmentLabel,
    orderBucket,
    slotLabel,
    statusLabel,
    statusTone,
} from "../config/marketVocabulary";
import { formatDateTime, formatPeso } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketField,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
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

    // Grouping is delegated to orderBucket, so the mapping between the server's
    // status vocabulary and the UI's buckets lives in the vocabulary file
    // rather than being re-derived here. "Expired" counts as cancelled here -
    // the distinction is for staff and the audit, not for someone deciding
    // whether their lunch is coming.
    const visible = orders.filter((order) =>
        filter === "all" ? true : orderBucket(order) === filter
    );

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
                {ORDER_BUCKET_OPTIONS.map((option) => (
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
                                    {order.workspaceName
                                        ? ` · ${order.workspaceName}`
                                        : ""}
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

    // Return / refund. The request is fetched separately because the order
    // payload does not carry it; a missing request (404) is the normal state.
    const [refund, setRefund] = useState(null);
    const [showRefund, setShowRefund] = useState(false);
    const [refundReason, setRefundReason] = useState("");
    const [restock, setRestock] = useState(true);
    const [submittingRefund, setSubmittingRefund] = useState(false);

    // Review. One per completed, paid order, ever.
    const [showReview, setShowReview] = useState(false);
    const [rating, setRating] = useState(5);
    const [reviewBody, setReviewBody] = useState("");
    const [reviewPhotos, setReviewPhotos] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewed, setReviewed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);

                const [orderResponse, refundResponse] = await Promise.all([
                    buyerApi.order(orderId),
                    refundApi.get(orderId).catch(() => ({ data: null })),
                ]);

                if (cancelled) return;
                setOrder(orderResponse.data);
                setRefund(refundResponse.data || null);
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

    const submitRefund = async (event) => {
        event.preventDefault();

        if (refundReason.trim().length < 5) {
            toast.error("Tell the store what happened (at least 5 characters).");
            return;
        }

        setSubmittingRefund(true);

        try {
            const response = await refundApi.request({
                orderId,
                reason: refundReason.trim(),
                restock,
            });

            toast.success(response.message || "Return request sent to the store.");
            setShowRefund(false);
            setRefundReason("");

            const refreshed = await refundApi.get(orderId).catch(() => ({ data: null }));
            setRefund(refreshed.data || null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmittingRefund(false);
        }
    };

    const submitReview = async (event) => {
        event.preventDefault();

        // Photo links are HTTPS-only, capped at five, matching the server rule.
        const photos = reviewPhotos
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.startsWith("https://"))
            .slice(0, 5);

        setSubmittingReview(true);

        try {
            const response = await reviewApi.review({
                orderId,
                rating: Number(rating),
                body: reviewBody.trim() || null,
                photos,
            });

            toast.success(response.message || "Thank you for your review.");
            setShowReview(false);
            setReviewBody("");
            setReviewPhotos("");
            setReviewed(true);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmittingReview(false);
        }
    };

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
    const returning =
        order.status === ORDER_STATUS.ReturnRequested ||
        order.status === ORDER_STATUS.Refunded;

    // The server decides whether cancelling is still allowed; the UI only
    // mirrors the states where it makes sense to offer the button.
    const canCancel =
        !cancelled &&
        !returning &&
        order.status !== ORDER_STATUS.Completed &&
        order.status !== ORDER_STATUS.Delivered &&
        order.status !== ORDER_STATUS.ReadyForPickup &&
        order.status !== ORDER_STATUS.OutForDelivery;

    // A review is offered on a completed (and therefore paid) order, once.
    const canReview = order.status === ORDER_STATUS.Completed && !reviewed;

    // A return can be requested on a paid order until one is already on file.
    const canRequestRefund =
        order.paymentStatus === PAYMENT_STATUS.PAID && !refund && !cancelled;

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

                    {/* Pre-order slot and claim code - the two things the buyer
                        needs between ordering and collecting. */}
                    {order.isPreOrder && order.scheduledFor ? (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                            <Clock size={13} className="shrink-0 text-slate-400" />
                            <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                Pickup slot
                            </span>
                            <span className="text-[11px] font-semibold text-slate-700">
                                {slotLabel(order.scheduledFor)}
                            </span>
                        </div>
                    ) : null}

                    {order.claimCode ? (
                        <div
                            className={`mt-3 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2.5 ${
                                order.isClaimed
                                    ? "bg-slate-50"
                                    : "border border-violet-200 bg-violet-50"
                            }`}
                        >
                            <span
                                className={`text-[10px] font-semibold uppercase tracking-[.14em] ${
                                    order.isClaimed ? "text-slate-500" : "text-violet-600"
                                }`}
                            >
                                {order.isClaimed ? "Collected with code" : "Claim code"}
                            </span>
                            <span
                                className={`font-mono text-sm font-semibold tracking-[.18em] ${
                                    order.isClaimed ? "text-slate-400 line-through" : "text-violet-900"
                                }`}
                            >
                                {order.claimCode}
                            </span>
                            {!order.isClaimed ? (
                                <span className="ml-auto text-[10px] text-violet-700">
                                    Show this at the counter
                                </span>
                            ) : order.claimedAt ? (
                                <span className="ml-auto text-[10px] text-slate-400">
                                    {formatDateTime(order.claimedAt)}
                                    {order.claimedByName ? ` · ${order.claimedByName}` : ""}
                                </span>
                            ) : null}
                        </div>
                    ) : null}

                    {order.paymentMethod === PAYMENT_METHOD.CAMPUS_CARD ? (
                        <div className="mt-2 flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2">
                            <CreditCard size={13} className="shrink-0 text-sky-500" />
                            <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-sky-700">
                                Paid with campus card
                            </span>
                            {order.paymentStatus === "unpaid" ? (
                                <span className="ml-auto text-[10px] text-sky-700">Charging…</span>
                            ) : null}
                        </div>
                    ) : null}

                    {/* Cash payment state. Distinct from the fulfillment timeline:
                        an order can be paid and still waiting to be collected. */}
                    {order.paymentMethod !== PAYMENT_METHOD.CAMPUS_CARD ? (
                        <div
                            className={`mt-2 flex items-center gap-2 rounded-xl px-3 py-2 ${
                                order.paymentStatus === "paid"
                                    ? "bg-emerald-50"
                                    : "bg-amber-50"
                            }`}
                        >
                            <CreditCard
                                size={13}
                                className={`shrink-0 ${
                                    order.paymentStatus === "paid"
                                        ? "text-emerald-500"
                                        : "text-amber-500"
                                }`}
                            />
                            <span
                                className={`text-[10px] font-semibold uppercase tracking-[.14em] ${
                                    order.paymentStatus === "paid"
                                        ? "text-emerald-700"
                                        : "text-amber-700"
                                }`}
                            >
                                {order.paymentStatus === "paid" ? "Paid in cash" : "Cash pending"}
                            </span>
                            {order.paymentStatus === "paid" && order.paidAt ? (
                                <span className="ml-auto text-[10px] text-emerald-700">
                                    {formatDateTime(order.paidAt)}
                                </span>
                            ) : order.paymentStatus === "unpaid" ? (
                                <span className="ml-auto text-[10px] text-amber-700">
                                    Pay at the counter
                                </span>
                            ) : null}
                        </div>
                    ) : null}
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
                    ) : returning ? (
                        <MarketNotice
                            tone="warn"
                            title={
                                order.status === ORDER_STATUS.Refunded
                                    ? "This order was refunded"
                                    : "A return is being handled"
                            }
                        >
                            {order.status === ORDER_STATUS.Refunded
                                ? "The refund has been confirmed. See the return details below."
                                : "The store has your return request. The refund is confirmed at the counter once approved."}
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

            {/* After-sales actions: a return request, a review, and the state of
                a return already on file. Server-gated, so the buttons mirror the
                rules rather than enforce them. */}
            <MarketPanel title="After this order">
                <div className="space-y-3 p-4">
                    {/* The refund request already on file, if any. */}
                    {refund ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                    <RotateCcw size={12} />
                                    Return / refund
                                </span>
                                <span
                                    className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
                                        refund.status === "completed"
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : refund.status === "rejected"
                                              ? "border-rose-200 bg-rose-50 text-rose-700"
                                              : "border-amber-200 bg-amber-50 text-amber-700"
                                    }`}
                                >
                                    {refund.status}
                                </span>
                            </div>

                            <p className="mt-2 text-[11px] leading-5 text-slate-600">
                                {refund.reason}
                            </p>

                            {refund.reviewNote ? (
                                <p className="mt-2 rounded-lg bg-white p-2 text-[10px] leading-4 text-slate-500">
                                    {refund.reviewNote}
                                </p>
                            ) : null}

                            {refund.status === "approved" ? (
                                <p className="mt-2 text-[10px] text-emerald-700">
                                    Approved. Collect the refund at the counter.
                                </p>
                            ) : null}
                        </div>
                    ) : canRequestRefund ? (
                        showRefund ? (
                            <form onSubmit={submitRefund} className="space-y-3">
                                <MarketField
                                    label="What happened?"
                                    hint="Explain the problem. This goes to the store owner."
                                >
                                    <textarea
                                        className={`${marketInputClass} min-h-[80px] resize-y`}
                                        value={refundReason}
                                        maxLength={2000}
                                        required
                                        onChange={(event) => setRefundReason(event.target.value)}
                                    />
                                </MarketField>

                                <label className="flex items-center gap-2 text-[11px] text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={restock}
                                        onChange={(event) => setRestock(event.target.checked)}
                                    />
                                    Return the items to stock if approved
                                </label>

                                <div className="flex flex-wrap gap-2">
                                    <MarketButton type="submit" disabled={submittingRefund}>
                                        {submittingRefund ? "Sending..." : "Send request"}
                                    </MarketButton>
                                    <MarketButton
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowRefund(false)}
                                    >
                                        Cancel
                                    </MarketButton>
                                </div>
                            </form>
                        ) : (
                            <MarketButton
                                variant="secondary"
                                onClick={() => setShowRefund(true)}
                            >
                                <RotateCcw size={13} />
                                Request return / refund
                            </MarketButton>
                        )
                    ) : null}

                    {/* The review form, or the "done" state. */}
                    {canReview ? (
                        showReview ? (
                            <form
                                onSubmit={submitReview}
                                className="space-y-3 border-t border-slate-100 pt-3"
                            >
                                <MarketField label="Rating">
                                    <select
                                        className={marketInputClass}
                                        value={rating}
                                        onChange={(event) => setRating(event.target.value)}
                                    >
                                        <option value={5}>5 - Excellent</option>
                                        <option value={4}>4 - Very good</option>
                                        <option value={3}>3 - Good</option>
                                        <option value={2}>2 - Fair</option>
                                        <option value={1}>1 - Poor</option>
                                    </select>
                                </MarketField>

                                <MarketField label="Your review (optional)">
                                    <textarea
                                        className={`${marketInputClass} min-h-[80px] resize-y`}
                                        value={reviewBody}
                                        maxLength={2000}
                                        onChange={(event) => setReviewBody(event.target.value)}
                                    />
                                </MarketField>

                                <MarketField
                                    label="Photo links (optional)"
                                    hint="One HTTPS link per line, up to 5."
                                >
                                    <textarea
                                        className={`${marketInputClass} min-h-[60px] resize-y`}
                                        value={reviewPhotos}
                                        placeholder="https://..."
                                        onChange={(event) => setReviewPhotos(event.target.value)}
                                    />
                                </MarketField>

                                <div className="flex flex-wrap gap-2">
                                    <MarketButton type="submit" disabled={submittingReview}>
                                        <Star size={13} />
                                        {submittingReview ? "Submitting..." : "Submit review"}
                                    </MarketButton>
                                    <MarketButton
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowReview(false)}
                                    >
                                        Cancel
                                    </MarketButton>
                                </div>
                            </form>
                        ) : (
                            <MarketButton
                                variant="secondary"
                                className="w-full"
                                onClick={() => setShowReview(true)}
                            >
                                <Star size={13} />
                                Rate &amp; review this order
                            </MarketButton>
                        )
                    ) : reviewed ? (
                        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                            <Star size={13} />
                            Thanks - your review is on the storefront.
                        </p>
                    ) : null}

                    {!refund && !canRequestRefund && !canReview && !reviewed ? (
                        <p className="text-[11px] text-slate-400">
                            No after-sales actions are available for this order yet.
                        </p>
                    ) : null}
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
