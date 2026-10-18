import { useCallback, useEffect, useState } from "react";
import {
    AlertTriangle,
    Ban,
    Check,
    MessageSquare,
    RefreshCw,
    Send,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import { moderationApi } from "../services/marketApi";
import { formatDateTime } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketField,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
    marketSelectClass,
} from "../components/marketUi";

/**
 * Moderation queue. Marketplace Head (administrator) only.
 *
 * Three independent queues, each with its own tab:
 *   reports  - user-filed flags on users or stores
 *   tickets  - support messages from users
 *   bans     - account and store bans
 *
 * A report has NO automatic effect - it only creates a queue entry. Only an
 * administrator's decision (reviewed or dismissed) changes anything. The same
 * applies to bans: a ban suspends open orders and may auto-approve refunds,
 * but only when an administrator explicitly sets it.
 */
export default function MarketStaffModerationPage() {

    const [tab, setTab] = useState("reports");
    const [reports, setReports] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [resolving, setResolving] = useState(null);
    const [resolution, setResolution] = useState("");
    const [saving, setSaving] = useState(false);

    const [responding, setResponding] = useState(null);
    const [responseText, setResponseText] = useState("");

    const [banTarget, setBanTarget] = useState("");
    const [banStoreId, setBanStoreId] = useState("");
    const [banReason, setBanReason] = useState("");
    const [banBanned, setBanBanned] = useState(true);

    const load = useCallback(async (which) => {
        setLoading(true);
        setError("");

        try {
            if (which === "reports") {
                const r = await moderationApi.reports({});
                setReports(r.data || []);
            } else if (which === "tickets") {
                const r = await moderationApi.tickets({});
                setTickets(r.data || []);
            }
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
                if (tab === "reports") {
                    const r = await moderationApi.reports({});
                    if (!cancelled) setReports(r.data || []);
                } else if (tab === "tickets") {
                    const r = await moderationApi.tickets({});
                    if (!cancelled) setTickets(r.data || []);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [tab]);

    const resolveReport = async (report, reviewed) => {
        setSaving(true);

        try {
            const response = await moderationApi.resolveReport(report.reportId, {
                status: reviewed ? "reviewed" : "dismissed",
                resolution: resolution.trim() || null,
            });

            toast.success(response.message || "Report resolved.");
            setResolving(null);
            setResolution("");
            await load("reports");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const respondTicket = async (ticket) => {
        setSaving(true);

        try {
            const response = await moderationApi.respondTicket(ticket.ticketId, {
                response: responseText.trim(),
            });

            toast.success(response.message || "Reply sent.");
            setResponding(null);
            setResponseText("");
            await load("tickets");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const closeTicket = async (ticket) => {
        try {
            const response = await moderationApi.closeTicket(ticket.ticketId);
            toast.success(response.message || "Ticket closed.");
            await load("tickets");
        } catch (err) {
            toast.error(err.message);
        }
    };

    const applyBan = async (kind) => {
        setSaving(true);

        try {
            if (kind === "account") {
                const id = Number(banTarget);
                if (!id) {
                    toast.error("Enter a numeric user id.");
                    return;
                }
                const response = await moderationApi.banAccount(id, {
                    banned: banBanned,
                    reason: banReason.trim() || null,
                });
                toast.success(response.message || "Done.");
            } else {
                const id = Number(banStoreId);
                if (!id) {
                    toast.error("Enter a numeric store id.");
                    return;
                }
                const response = await moderationApi.banStore(id, {
                    banned: banBanned,
                    reason: banReason.trim() || null,
                });
                toast.success(response.message || "Done.");
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const openReports = reports.filter((r) => r.status === "open");
    const settledReports = reports.filter((r) => r.status !== "open");
    const openTickets = tickets.filter((t) => t.status === "open" || t.status === "answered");
    const closedTickets = tickets.filter((t) => t.status === "closed");

    return (
        <div className="space-y-4">
            <MarketPanel
                title="Moderation"
                subtitle="Reports, support tickets, and bans. Administrator only."
                action={
                    <MarketButton size="sm" variant="secondary" onClick={() => load(tab)}>
                        <RefreshCw size={13} />
                        Refresh
                    </MarketButton>
                }
            >
                <div className="flex gap-1.5 p-3.5">
                    {[
                        { value: "reports", label: "Reports" },
                        { value: "tickets", label: "Tickets" },
                        { value: "bans", label: "Bans" },
                    ].map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setTab(option.value)}
                            aria-pressed={tab === option.value}
                            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                                tab === option.value
                                    ? "bg-[#106A2E] text-white"
                                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </MarketPanel>

            {error ? (
                <MarketNotice tone="error" title="Could not load">
                    {error}
                </MarketNotice>
            ) : null}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={4} />
                </MarketPanel>
            ) : null}

            {!loading && tab === "reports" ? (
                <>
                    {reports.length === 0 ? (
                        <MarketPanel>
                            <MarketEmpty
                                icon={<AlertTriangle size={20} />}
                                title="No reports"
                                hint="User-filed flags on users or stores will appear here."
                            />
                        </MarketPanel>
                    ) : (
                        <>
                            {openReports.length > 0 ? (
                                <MarketPanel title="Open" subtitle="Needs a decision.">
                                    <ul className="divide-y divide-slate-100">
                                        {openReports.map((report) => (
                                            <ReportRow
                                                key={report.reportId}
                                                report={report}
                                                deciding={resolving === report.reportId}
                                                resolution={resolution}
                                                saving={saving}
                                                onStartDecide={() => {
                                                    setResolving(report.reportId);
                                                    setResolution("");
                                                }}
                                                onCancelDecide={() => setResolving(null)}
                                                onResolution={setResolution}
                                                onReviewed={() => resolveReport(report, true)}
                                                onDismissed={() => resolveReport(report, false)}
                                            />
                                        ))}
                                    </ul>
                                </MarketPanel>
                            ) : null}

                            {settledReports.length > 0 ? (
                                <MarketPanel title="Settled" subtitle="Reviewed or dismissed.">
                                    <ul className="divide-y divide-slate-100">
                                        {settledReports.map((report) => (
                                            <li key={report.reportId} className="px-4 py-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-slate-800">
                                                            {report.targetStoreName || report.targetUserName || "Unknown target"}
                                                        </p>
                                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                                            Reported by {report.reporterName} · {formatDateTime(report.createdAt)}
                                                        </p>
                                                        <p className="mt-1.5 rounded-lg bg-slate-50 p-2 text-[10px] leading-4 text-slate-600">
                                                            {report.reason}
                                                        </p>
                                                        {report.resolution ? (
                                                            <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
                                                                <span className="font-semibold">Resolution: </span>
                                                                {report.resolution}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <span className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold bg-slate-50 text-slate-600 border-slate-200">
                                                        {report.status}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </MarketPanel>
                            ) : null}
                        </>
                    )}
                </>
            ) : null}

            {!loading && tab === "tickets" ? (
                <>
                    {tickets.length === 0 ? (
                        <MarketPanel>
                            <MarketEmpty
                                icon={<MessageSquare size={20} />}
                                title="No tickets"
                                hint="Support messages from users will appear here."
                            />
                        </MarketPanel>
                    ) : (
                        <>
                            {openTickets.length > 0 ? (
                                <MarketPanel title="Open" subtitle="Needs a reply.">
                                    <ul className="divide-y divide-slate-100">
                                        {openTickets.map((ticket) => (
                                            <TicketRow
                                                key={ticket.ticketId}
                                                ticket={ticket}
                                                responding={responding === ticket.ticketId}
                                                responseText={responseText}
                                                saving={saving}
                                                onStartRespond={() => {
                                                    setResponding(ticket.ticketId);
                                                    setResponseText(ticket.response || "");
                                                }}
                                                onCancelRespond={() => setResponding(null)}
                                                onResponse={setResponseText}
                                                onRespond={() => respondTicket(ticket)}
                                                onClose={() => closeTicket(ticket)}
                                            />
                                        ))}
                                    </ul>
                                </MarketPanel>
                            ) : null}

                            {closedTickets.length > 0 ? (
                                <MarketPanel title="Closed" subtitle="No further action.">
                                    <ul className="divide-y divide-slate-100">
                                        {closedTickets.map((ticket) => (
                                            <li key={ticket.ticketId} className="px-4 py-3">
                                                <p className="text-xs font-semibold text-slate-800">{ticket.subject}</p>
                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                    {ticket.fullName} · {formatDateTime(ticket.createdAt)}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </MarketPanel>
                            ) : null}
                        </>
                    )}
                </>
            ) : null}

            {!loading && tab === "bans" ? (
                <MarketPanel title="Ban or unban" subtitle="Administrator only. Bans suspend open orders and may auto-approve refunds.">
                    <div className="space-y-4 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <MarketField label="Target type">
                                <select
                                    className={marketSelectClass}
                                    value={banTarget ? "account" : banStoreId ? "store" : "account"}
                                    onChange={(event) => {
                                        if (event.target.value === "account") {
                                            setBanStoreId("");
                                        } else {
                                            setBanTarget("");
                                        }
                                    }}
                                >
                                    <option value="account">Account</option>
                                    <option value="store">Store</option>
                                </select>
                            </MarketField>

                            <MarketField label={banStoreId ? "Store id" : "User id"}>
                                <input
                                    className={marketInputClass}
                                    type="number"
                                    min="1"
                                    value={banStoreId ? banStoreId : banTarget}
                                    onChange={(event) => {
                                        if (banStoreId) setBanStoreId(event.target.value);
                                        else setBanTarget(event.target.value);
                                    }}
                                />
                            </MarketField>
                        </div>

                        <MarketField label="Action">
                            <select
                                className={marketSelectClass}
                                value={banBanned ? "ban" : "unban"}
                                onChange={(event) => setBanBanned(event.target.value === "ban")}
                            >
                                <option value="ban">Ban</option>
                                <option value="unban">Unban (store lands on paused)</option>
                            </select>
                        </MarketField>

                        <MarketField label="Reason (optional)">
                            <input
                                className={marketInputClass}
                                value={banReason}
                                maxLength={500}
                                onChange={(event) => setBanReason(event.target.value)}
                            />
                        </MarketField>

                        <MarketButton onClick={() => applyBan(banStoreId ? "store" : "account")} disabled={saving}>
                            <Ban size={14} />
                            {saving ? "Applying..." : banBanned ? "Ban" : "Unban"}
                        </MarketButton>

                        <p className="text-[10px] leading-4 text-slate-400">
                            Banning an account or store suspends every open order (unpaid → cancelled
                            with stock released; paid → return_requested with an auto-approved refund).
                            Completed purchases stay in history.
                        </p>
                    </div>
                </MarketPanel>
            ) : null}
        </div>
    );
}

function ReportRow({ report, deciding, resolution, saving, onStartDecide, onCancelDecide, onResolution, onReviewed, onDismissed }) {
    return (
        <li className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">
                        {report.targetStoreName || report.targetUserName || "Unknown target"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                        Reported by {report.reporterName} · {formatDateTime(report.createdAt)}
                    </p>
                    <p className="mt-1.5 rounded-lg bg-slate-50 p-2 text-[10px] leading-4 text-slate-600">
                        {report.reason}
                    </p>
                    {report.resolution ? (
                        <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
                            <span className="font-semibold">Resolution: </span>
                            {report.resolution}
                        </p>
                    ) : null}
                </div>

                {!deciding ? (
                    <MarketButton size="sm" onClick={onStartDecide}>
                        Decide
                    </MarketButton>
                ) : null}
            </div>

            {deciding ? (
                <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <MarketField label="Resolution" hint="Optional when reviewing, required to dismiss.">
                        <textarea
                            className={`${marketInputClass} min-h-[60px] resize-y`}
                            value={resolution}
                            maxLength={2000}
                            onChange={(event) => onResolution(event.target.value)}
                        />
                    </MarketField>

                    <div className="flex flex-wrap gap-2">
                        <MarketButton size="sm" onClick={onReviewed} disabled={saving}>
                            <Check size={12} />
                            {saving ? "Saving..." : "Mark reviewed"}
                        </MarketButton>
                        <MarketButton size="sm" variant="danger" onClick={onDismissed} disabled={saving}>
                            <X size={12} />
                            Dismiss
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

function TicketRow({ ticket, responding, responseText, saving, onStartRespond, onCancelRespond, onResponse, onRespond, onClose }) {
    return (
        <li className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{ticket.subject}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                        {ticket.fullName} · {ticket.email} · {formatDateTime(ticket.createdAt)}
                    </p>
                    <p className="mt-1.5 rounded-lg bg-slate-50 p-2 text-[10px] leading-4 text-slate-600">
                        {ticket.body}
                    </p>
                    {ticket.response ? (
                        <p className="mt-1.5 rounded-lg bg-emerald-50 p-2 text-[10px] leading-4 text-emerald-800">
                            <span className="font-semibold">Reply: </span>
                            {ticket.response}
                        </p>
                    ) : null}
                </div>

                {!responding ? (
                    <div className="flex shrink-0 gap-1.5">
                        <MarketButton size="sm" onClick={onStartRespond}>
                            Reply
                        </MarketButton>
                        <MarketButton size="sm" variant="secondary" onClick={onClose}>
                            Close
                        </MarketButton>
                    </div>
                ) : null}
            </div>

            {responding ? (
                <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <MarketField label="Reply" hint="Overwrites any previous reply.">
                        <textarea
                            className={`${marketInputClass} min-h-[80px] resize-y`}
                            value={responseText}
                            maxLength={3000}
                            onChange={(event) => onResponse(event.target.value)}
                        />
                    </MarketField>

                    <div className="flex flex-wrap gap-2">
                        <MarketButton size="sm" onClick={onRespond} disabled={saving}>
                            <Send size={12} />
                            {saving ? "Sending..." : "Send reply"}
                        </MarketButton>
                        <MarketButton size="sm" variant="ghost" onClick={onCancelRespond}>
                            Cancel
                        </MarketButton>
                    </div>
                </div>
            ) : null}
        </li>
    );
}
