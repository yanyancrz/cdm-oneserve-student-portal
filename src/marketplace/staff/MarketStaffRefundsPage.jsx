import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, ChevronLeft, RefreshCw, RotateCcw, X } from "lucide-react";
import toast from "react-hot-toast";

import { refundApi } from "../services/marketApi";
import { formatDateTime } from "../utils/format";
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
 * Refund requests for one store. Owner or administrator only.
 *
 * Two steps, and they are deliberately separate:
 *   1. review  - approve or reject. Approving sets the order to refund_pending
 *               but moves no money.
 *   2. confirm - the counter hands the cash back and the order becomes refunded.
 *
 * Splitting them means the money is never returned by a click alone: a person
 * has to be standing at the counter with the cash.
 */
export default function MarketStaffRefundsPage() {
    const { storeId } = useParams();
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [status, setStatus] = useState("pending");
    const [deciding, setDeciding] = useState(null);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async (filter) => {
        setLoading(true);
        setError("");

        try {
            const response = await refundApi.forStore(storeId, { status: filter || undefined });
            setRequests(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const response = await refundApi.forStore(storeId, { status: status || undefined });
                if (!cancelled) setRequests(response.data || []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [storeId, status]);

    const review = async (request, approve) => {
        setSaving(true);

        try {
            const response = await refundApi.review(request.orderId, {
                approve,
                note: note.trim() || null,
            });

            toast.success(response.message || "Reviewed.");
            setDeciding(null);
            setNote("");
            await load(status);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const confirm = async (request) => {
        setSaving(true);

        try {
            const response = await refundApi.confirm(request.orderId);
            toast.success(response.message || "Refund confirmed.");
            await load(status);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const pending = requests.filter((r) => r.status === "pending");
    const approved = requests.filter((r) => r.status === "approved");
    const settled = requests.filter((r) => r.status !== "pending" && r.status !== "approved");

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => navigate(`/marketplace/stores/${storeId}`)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
            >
                <ChevronLeft size={14} aria-hidden="true" />
                Back to the storefront
            </button>

            <MarketPanel
                title="Refunds"
                subtitle={
                    pending.length > 0
                        ? `${pending.length} waiting for your decision.`
                        : "Nothing waiting."
                }
                action={
                    <MarketButton size="sm" variant="secondary" onClick={() => load(status)}>
                        <RefreshCw size={13} />
                        Refresh
                    </MarketButton>
                }
            >
                <div className="p-3.5">
                    <select
                        className={`${marketInputClass} max-w-xs`}
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                    >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </MarketPanel>

            {error ? (
                <MarketNotice tone="error" title="Could not load refund requests">
                    {error}
                </MarketNotice>
            ) : null}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={4} />
                </MarketPanel>
            ) : requests.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<RotateCcw size={20} />}
                        title={status ? "No requests match" : "No refund requests yet"}
                        hint={
                            status
                                ? "Try a different status."
                                : "Buyers can request a return on a paid order from their Orders page."
                        }
                    />
                </MarketPanel>
            ) : (
                <>
                    {pending.length > 0 ? (
                        <MarketPanel title="Waiting for your decision" subtitle="Oldest first.">
                            <ul className="divide-y divide-slate-100">
                                {pending.map((request) => (
                                    <RefundRow
                                        key={request.orderId}
                                        request={request}
                                        deciding={deciding === request.orderId}
                                        note={note}
                                        saving={saving}
                                        onStartDecide={() => {
                                            setDeciding(request.orderId);
                                            setNote("");
                                        }}
                                        onCancelDecide={() => setDeciding(null)}
                                        onNote={setNote}
                                        onApprove={() => review(request, true)}
                                        onReject={() => review(request, false)}
                                    />
                                ))}
                            </ul>
                        </MarketPanel>
                    ) : null}

                    {approved.length > 0 ? (
                        <MarketPanel title="Approved - confirm at the counter" subtitle="Money has not moved yet.">
                            <ul className="divide-y divide-slate-100">
                                {approved.map((request) => (
                                    <li key={request.orderId} className="flex items-center justify-between gap-3 px-4 py-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-slate-700">
                                                Order {request.orderId}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                {request.reason}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                Restock: {request.restock ? "yes" : "no"}
                                                {request.reviewedAt
                                                    ? ` · Reviewed ${formatDateTime(request.reviewedAt)}`
                                                    : ""}
                                            </p>
                                        </div>

                                        <MarketButton size="sm" onClick={() => confirm(request)} disabled={saving}>
                                            {saving ? "Confirming..." : "Confirm refund"}
                                        </MarketButton>
                                    </li>
                                ))}
                            </ul>
                        </MarketPanel>
                    ) : null}

                    {settled.length > 0 ? (
                        <MarketPanel title="Settled" subtitle="Rejected or completed.">
                            <ul className="divide-y divide-slate-100">
                                {settled.map((request) => (
                                    <li key={request.orderId} className="flex items-start justify-between gap-3 px-4 py-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-slate-700">
                                                Order {request.orderId}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                {request.reason}
                                            </p>
                                            {request.reviewNote ? (
                                                <p className="mt-1.5 rounded-lg bg-slate-50 p-2 text-[10px] leading-4 text-slate-600">
                                                    {request.reviewNote}
                                                </p>
                                            ) : null}
                                            {request.completedAt ? (
                                                <p className="mt-1 text-[10px] text-slate-400">
                                                    Completed {formatDateTime(request.completedAt)}
                                                </p>
                                            ) : null}
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
                                                request.status === "completed"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : request.status === "rejected"
                                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                                      : "bg-slate-50 text-slate-600 border-slate-200"
                                            }`}
                                        >
                                            {request.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </MarketPanel>
                    ) : null}
                </>
            )}
        </div>
    );
}

function RefundRow({ request, deciding, note, saving, onStartDecide, onCancelDecide, onNote, onApprove, onReject }) {
    return (
        <li className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">
                        Order {request.orderId}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                        {request.reason}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                        Restock: {request.restock ? "yes" : "no"} · Filed{" "}
                        {formatDateTime(request.createdAt)}
                    </p>
                </div>

                {!deciding ? (
                    <MarketButton size="sm" onClick={onStartDecide}>
                        Decide
                    </MarketButton>
                ) : null}
            </div>

            {deciding ? (
                <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <MarketField label="Note" hint="Required to reject. Optional when approving.">
                        <textarea
                            className={`${marketInputClass} min-h-[70px] resize-y`}
                            value={note}
                            maxLength={500}
                            onChange={(event) => onNote(event.target.value)}
                        />
                    </MarketField>

                    <div className="flex flex-wrap gap-2">
                        <MarketButton size="sm" onClick={onApprove} disabled={saving}>
                            <Check size={12} />
                            {saving ? "Saving..." : "Approve"}
                        </MarketButton>
                        <MarketButton size="sm" variant="danger" onClick={onReject} disabled={saving}>
                            <X size={12} />
                            Reject
                        </MarketButton>
                        <MarketButton size="sm" variant="ghost" onClick={onCancelDecide}>
                            Cancel
                        </MarketButton>
                    </div>
                </div>
            ) : null}
        </li>
    );
}
