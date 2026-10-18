import { useCallback, useEffect, useState } from "react";
import { Check, Inbox, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";

import { sellerApi } from "../services/marketApi";
import {
    APPLICATION_STATUS,
    applicationStatusLabel,
} from "../config/marketVocabulary";
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
 * Seller applications review queue. Marketplace Head only.
 *
 * Each row is a verified Student or Faculty account asking to sell. Approving
 * records that they may; the Head then creates the storefront and assigns them
 * as owner via /marketplace/staff/stores. Approval does not create a store on
 * its own, because a storefront needs a name, a kind, a workspace and an owner -
 * none of which the applicant decides.
 */
export default function MarketStaffSellerApplicationsPage() {
    const [applications, setApplications] = useState([]);
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
            const response = await sellerApi.queue({ status: filter || undefined });
            setApplications(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const response = await sellerApi.queue({ status: status || undefined });
                if (!cancelled) setApplications(response.data || []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [status]);

    const review = async (application, approve) => {
        setSaving(true);

        try {
            const response = await sellerApi.review(application.applicationId, {
                approve,
                note: note.trim() || null,
            });

            toast.success(response.message || "Application reviewed.");
            setDeciding(null);
            setNote("");
            await load(status);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const pending = applications.filter((a) => a.status === APPLICATION_STATUS.PENDING);
    const settled = applications.filter((a) => a.status !== APPLICATION_STATUS.PENDING);

    return (
        <div className="space-y-4">
            <MarketPanel
                title="Seller applications"
                subtitle={
                    pending.length > 0
                        ? `${pending.length} waiting for your decision.`
                        : "Nobody is waiting to sell."
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
                    </select>
                </div>
            </MarketPanel>

            {error ? (
                <MarketNotice tone="error" title="Could not load the queue">
                    {error}
                </MarketNotice>
            ) : null}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={4} />
                </MarketPanel>
            ) : applications.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<Inbox size={20} />}
                        title={status ? "No applications match" : "No seller applications yet"}
                        hint={
                            status
                                ? "Try a different status."
                                : "Verified Student and Faculty accounts can apply to sell from the marketplace."
                        }
                    />
                </MarketPanel>
            ) : (
                <>
                    {pending.length > 0 ? (
                        <MarketPanel title="Waiting for review" subtitle="Oldest first.">
                            <ul className="divide-y divide-slate-100">
                                {pending.map((application) => (
                                    <SellerApplicationRow
                                        key={application.applicationId}
                                        application={application}
                                        deciding={deciding === application.applicationId}
                                        note={note}
                                        saving={saving}
                                        onStartDecide={() => {
                                            setDeciding(application.applicationId);
                                            setNote("");
                                        }}
                                        onCancelDecide={() => setDeciding(null)}
                                        onNote={setNote}
                                        onApprove={() => review(application, true)}
                                        onReject={() => review(application, false)}
                                    />
                                ))}
                            </ul>
                        </MarketPanel>
                    ) : null}

                    {settled.length > 0 ? (
                        <MarketPanel title="Settled" subtitle="Approved or rejected.">
                            <ul className="divide-y divide-slate-100">
                                {settled.map((application) => (
                                    <li
                                        key={application.applicationId}
                                        className="flex items-start justify-between gap-3 px-4 py-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold text-slate-700">
                                                {application.businessName}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                {application.fullName} · {application.email}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                Filed {formatDateTime(application.createdAt)}
                                                {application.reviewedAt
                                                    ? ` · Reviewed ${formatDateTime(application.reviewedAt)}`
                                                    : ""}
                                            </p>
                                            {application.reviewNote ? (
                                                <p className="mt-1.5 rounded-lg bg-slate-50 p-2 text-[10px] leading-4 text-slate-600">
                                                    {application.reviewNote}
                                                </p>
                                            ) : null}
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
                                                application.status === APPLICATION_STATUS.APPROVED
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                            }`}
                                        >
                                            {applicationStatusLabel(application.status)}
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

function SellerApplicationRow({
    application,
    deciding,
    note,
    saving,
    onStartDecide,
    onCancelDecide,
    onNote,
    onApprove,
    onReject,
}) {
    return (
        <li className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                        {application.businessName}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                        {application.fullName} · {application.email}
                    </p>
                    {application.description ? (
                        <p className="mt-1.5 rounded-lg bg-slate-50 p-2 text-[10px] leading-4 text-slate-600">
                            {application.description}
                        </p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-slate-400">
                        Filed {formatDateTime(application.createdAt)}
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
                    <MarketField
                        label="Note"
                        hint="Required to reject. Optional when approving."
                    >
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
                        <MarketButton
                            size="sm"
                            variant="danger"
                            onClick={onReject}
                            disabled={saving}
                        >
                            <X size={12} />
                            Reject
                        </MarketButton>
                        <MarketButton size="sm" variant="ghost" onClick={onCancelDecide}>
                            Cancel
                        </MarketButton>
                    </div>

                    <p className="text-[10px] leading-4 text-slate-400">
                        Approving records that they may sell. Create their storefront
                        and assign them as owner from the Storefronts screen afterwards.
                    </p>
                </div>
            ) : null}
        </li>
    );
}
