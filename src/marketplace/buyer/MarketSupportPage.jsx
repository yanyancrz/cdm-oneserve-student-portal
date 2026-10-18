import { useCallback, useEffect, useRef, useState } from "react";
import { LifeBuoy, MessageSquareWarning, RefreshCw, Send } from "lucide-react";
import toast from "react-hot-toast";

import { moderationApi } from "../services/marketApi";
import {
    MarketButton,
    MarketEmpty,
    MarketField,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";
import { ticketStatusLabel, ticketStatusTone } from "../config/marketVocabulary";
import { formatDateTime } from "../utils/format";

const SUBJECT_MAX = 150;
const BODY_MAX = 3000;

function StatusBadge({ status }) {
    return (
        <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${ticketStatusTone(status)}`}
        >
            {ticketStatusLabel(status)}
        </span>
    );
}

/**
 * Support & feedback.
 *
 * A private message to the ADMINISTRATORS - a refund dispute, a damaged item,
 * feedback - anything the stall itself cannot settle. This is deliberately not
 * the store chat: the chat goes to the stall, a ticket goes to whoever runs the
 * marketplace and keeps its answer on record.
 *
 * The buyer may file a request and read the reply. There is no reply box here
 * because only an administrator answers, and the server refuses a buyer on the
 * respond/close endpoints. So this screen is a request list, not a thread.
 */
export default function MarketSupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ subject: "", body: "" });
    const [submitError, setSubmitError] = useState("");

    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    /**
     * One loader for first load and refreshes. `silent` keeps the page on screen
     * (no skeleton flash) so a submit error or a freshly filed request never gets
     * wiped out mid-send.
     */
    const load = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        setError("");

        try {
            const response = await moderationApi.myTickets();
            if (mountedRef.current) setTickets(response.data || []);
        } catch (err) {
            if (mountedRef.current) setError(err.message);
        } finally {
            if (mountedRef.current && !silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const submit = async (event) => {
        event.preventDefault();

        const nextErrors = { subject: "", body: "" };
        if (subject.trim().length < 3) {
            nextErrors.subject = "Give it a short subject (at least 3 characters).";
        }
        if (body.trim().length < 5) {
            nextErrors.body = "Tell us what happened (at least 5 characters).";
        }

        setFieldErrors(nextErrors);
        setSubmitError("");
        if (nextErrors.subject || nextErrors.body) return;

        setSubmitting(true);

        try {
            const response = await moderationApi.openTicket({
                subject: subject.trim(),
                body: body.trim(),
            });

            toast.success(response.message || "Your message was sent to the administrators.");

            setSubject("");
            setBody("");
            await load({ silent: true });
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            if (mountedRef.current) setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={4} />
            </MarketPanel>
        );
    }

    return (
        <div className="space-y-4">
            <MarketNotice tone="info" icon={<LifeBuoy size={14} />}>
                Send a request straight to the CDM OneServe administrators. Use this for
                anything the stall cannot settle &mdash; a refund dispute, a damaged item,
                or feedback. Replies appear on this page.
            </MarketNotice>

            {error ? (
                <MarketNotice tone="error" title="Could not load your requests">
                    {error}
                </MarketNotice>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
                <MarketPanel
                    title="Send a message"
                    subtitle="The administrators will reply here."
                >
                    <form onSubmit={submit} className="space-y-4 p-4" noValidate>
                        {submitError ? (
                            <MarketNotice tone="error" title="Could not send your message">
                                {submitError}
                            </MarketNotice>
                        ) : null}

                        <MarketField
                            label="Subject"
                            hint="A few words summarising it."
                            error={fieldErrors.subject}
                        >
                            <div>
                                <input
                                    className={marketInputClass}
                                    value={subject}
                                    maxLength={SUBJECT_MAX}
                                    placeholder="e.g. Refund not received"
                                    onChange={(event) => {
                                        setSubject(event.target.value);
                                        setFieldErrors((previous) => ({
                                            ...previous,
                                            subject: "",
                                        }));
                                    }}
                                />
                                <p className="mt-1 text-right text-[11px] tabular-nums text-slate-400">
                                    {subject.length}/{SUBJECT_MAX}
                                </p>
                            </div>
                        </MarketField>

                        <MarketField label="How can we help?" error={fieldErrors.body}>
                            <div>
                                <textarea
                                    className={`${marketInputClass} min-h-[130px] resize-y`}
                                    value={body}
                                    maxLength={BODY_MAX}
                                    placeholder="Include the order reference if you have one."
                                    onChange={(event) => {
                                        setBody(event.target.value);
                                        setFieldErrors((previous) => ({
                                            ...previous,
                                            body: "",
                                        }));
                                    }}
                                />
                                <p className="mt-1 text-right text-[11px] tabular-nums text-slate-400">
                                    {body.length}/{BODY_MAX}
                                </p>
                            </div>
                        </MarketField>

                        <div className="[&>button]:w-full sm:[&>button]:w-auto">
                            <MarketButton type="submit" disabled={submitting}>
                                <Send size={13} />
                                {submitting ? "Sending..." : "Send to support"}
                            </MarketButton>
                        </div>
                    </form>
                </MarketPanel>

                <MarketPanel
                    title="Your requests"
                    subtitle={tickets.length > 0 ? `${tickets.length} on record` : undefined}
                    action={
                        <MarketButton variant="secondary" onClick={() => load({ silent: true })}>
                            <RefreshCw size={13} />
                            Refresh
                        </MarketButton>
                    }
                >
                    {tickets.length === 0 ? (
                        <div className="p-4">
                            <MarketEmpty
                                icon={<MessageSquareWarning size={20} />}
                                title="No requests yet"
                                hint="Send a message and the administrators' reply will show up here."
                            />
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {tickets.map((ticket) => (
                                <li key={ticket.ticketId} className="space-y-2 px-4 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="min-w-0 text-sm font-semibold text-slate-700">
                                            {ticket.subject}
                                        </p>
                                        <StatusBadge status={ticket.status} />
                                    </div>

                                    <p className="whitespace-pre-line text-xs leading-5 text-slate-600">
                                        {ticket.body}
                                    </p>

                                    <p className="text-[11px] text-slate-400">
                                        Sent {formatDateTime(ticket.createdAt)}
                                    </p>

                                    {ticket.response ? (
                                        <blockquote className="rounded-xl border-l-2 border-[#106A2E]/40 bg-[#106A2E]/5 px-3 py-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#106A2E]/70">
                                                Administrator
                                            </p>
                                            <p className="mt-0.5 whitespace-pre-line text-xs leading-5 text-slate-700">
                                                {ticket.response}
                                            </p>
                                            {ticket.respondedAt ? (
                                                <p className="mt-1 text-[11px] text-slate-400">
                                                    Replied {formatDateTime(ticket.respondedAt)}
                                                </p>
                                            ) : null}
                                        </blockquote>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </MarketPanel>
            </div>
        </div>
    );
}
