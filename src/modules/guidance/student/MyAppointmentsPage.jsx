import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, CalendarX2, ChevronDown, ChevronUp, Clock3 } from "lucide-react";
import toast from "react-hot-toast";

import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { CardListSkeleton, Empty, ErrorBox } from "../components/GuidanceStates";
import { useGuidanceMe } from "../components/GuidanceGate";
import { DateBadge, FilterChips, SectionTitle } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";
import { formatStamp, formatYMD, slotToMinutes, todayISO } from "../utils/dateTime";

const FILTERS = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];
const ACTIVE = ["Pending", "Confirmed"];
const hiddenKey = (id) => `gp_hidden_appts_${id}`;

const byWhen = (a, b) => a.date.localeCompare(b.date) || slotToMinutes(a.timeSlot) - slotToMinutes(b.timeSlot);

export default function MyAppointmentsPage() {
    const { me } = useGuidanceMe();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("All");
    const [cancelling, setCancelling] = useState(null);
    const [openSched, setOpenSched] = useState(null);
    const [hidden, setHidden] = useState(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem(hiddenKey(me.userId)) || "[]"));
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        try { localStorage.setItem(hiddenKey(me.userId), JSON.stringify([...hidden])); } catch { /* ignore */ }
    }, [hidden, me.userId]);

    const load = useCallback(async (signal) => {
        setError("");
        setLoading(true);
        try {
            setItems(await guidanceApi.getMyAppointments(signal));
        } catch (e) {
            if (e?.name !== "AbortError") setError(e.message || "Could not load appointments.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const c = new AbortController();
        load(c.signal);
        return () => c.abort();
    }, [load]);

    const cancel = async (id) => {
        if (!window.confirm("Cancel this appointment? This frees the time slot for other students.")) return;
        setCancelling(id);
        try {
            await guidanceApi.cancelAppointment(id);
            setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Cancelled" } : a)));
            toast.success("Appointment cancelled.");
        } catch (e) {
            toast.error(e.message || "Could not cancel.");
            load(); // state may have changed on the server
        } finally {
            setCancelling(null);
        }
    };

    const today = todayISO();
    const rows = (filter === "All" ? items : items.filter((a) => a.status === filter)).filter((a) => !hidden.has(a.id));
    const upcoming = rows.filter((a) => ACTIVE.includes(a.status) && a.date >= today).sort(byWhen);
    const past = rows.filter((a) => !(ACTIVE.includes(a.status) && a.date >= today)).sort((a, b) => byWhen(b, a));

    // How many appointments each filter would show (hidden ones not counted).
    const visibleItems = items.filter((a) => !hidden.has(a.id));
    const counts = FILTERS.reduce((acc, f) => {
        acc[f] = f === "All" ? visibleItems.length : visibleItems.filter((a) => a.status === f).length;
        return acc;
    }, {});

    const card = (a) => {
        const changes = a.reschedules || [];
        const sched = openSched === a.id;
        const canHide = ["Cancelled", "Completed", "Expired", "Rejected"].includes(a.status);
        const active = ACTIVE.includes(a.status);

        return (
            <article key={a.id} className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <DateBadge date={a.date} muted={!active} />

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{formatYMD(a.date)}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            <Clock3 size={12} aria-hidden="true" /> {a.timeSlot}
                        </p>
                        <p className="mt-1.5 truncate text-sm text-slate-700">{a.counselorName || "Counselor"}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                        <StatusBadge status={a.status} />

                        {changes.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setOpenSched(sched ? null : a.id)}
                                aria-expanded={sched}
                                className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700"
                            >
                                <CalendarClock size={12} aria-hidden="true" /> Rescheduled
                                {sched ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        )}
                    </div>
                </div>

                {a.concernType && (
                    <span className="mt-3 inline-block rounded-full bg-pink-50 px-2.5 py-0.5 text-[10px] font-semibold text-[#B13C70]">
                        {a.concernType}
                    </span>
                )}

                {sched && changes.length > 0 && (
                    <div className="mt-3 space-y-3 rounded-xl border-l-4 border-purple-300 bg-purple-50 p-3 text-xs text-purple-900">
                        {changes.map((c, i) => (
                            <div key={c.id} className={i > 0 ? "border-t border-purple-200 pt-3" : ""}>
                                <p className="text-[11px] text-purple-700">
                                    {changes.length > 1 ? (i === 0 ? "Latest change · " : "Earlier change · ") : ""}
                                    {c.counselorName || "Your counselor"}
                                    {formatStamp(c.rescheduledAt) ? ` · ${formatStamp(c.rescheduledAt)}` : ""}
                                </p>

                                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="text-purple-700 line-through">
                                        {formatYMD(c.oldDate)} · {c.oldTimeSlot}
                                    </span>
                                    <ArrowRight size={12} aria-hidden="true" />
                                    <span className="font-semibold">
                                        {formatYMD(c.newDate)} · {c.newTimeSlot}
                                    </span>
                                </p>

                                {c.previousStatus === "Pending" && (
                                    <p className="mt-1 italic">Your request was still pending — this change confirmed it for the new time.</p>
                                )}
                                {c.reason && <p className="mt-1"><span className="font-semibold">Reason:</span> {c.reason}</p>}
                                {c.instructions && <p><span className="font-semibold">Instructions:</span> {c.instructions}</p>}
                            </div>
                        ))}
                    </div>
                )}

                {(active || canHide) && (
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        {active ? (
                            <button
                                type="button"
                                disabled={cancelling === a.id}
                                onClick={() => cancel(a.id)}
                                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-700 transition active:scale-95 disabled:opacity-60"
                            >
                                {cancelling === a.id ? "Cancelling…" : "Cancel"}
                            </button>
                        ) : (
                            <span />
                        )}

                        {canHide && (
                            <button
                                type="button"
                                onClick={() => setHidden((p) => new Set([...p, a.id]))}
                                className="text-xs font-medium text-slate-400"
                            >
                                Hide
                            </button>
                        )}
                    </div>
                )}
            </article>
        );
    };

    return (
        <>
            <PageHeader title="My Appointments" subtitle="Your counseling bookings and their status." />

            <main className="space-y-3 px-4 pt-4">
                <FilterChips options={FILTERS} value={filter} onChange={setFilter} counts={counts} />

                {loading && items.length === 0 && <CardListSkeleton rows={3} label="Loading appointments..." />}
                {error && <ErrorBox message={error} onRetry={() => load()} />}
                {!loading && !error && rows.length === 0 && (
                    <Empty
                        icon={CalendarX2}
                        title="No appointments here"
                        note={hidden.size > 0 ? `${hidden.size} hidden.` : "Book one from the Counselors or Book tab."}
                        action={
                            <Link
                                to="/guidance/book"
                                className="inline-flex rounded-xl bg-[#D9578F] px-4 py-2 text-xs font-semibold text-white shadow-sm active:scale-95"
                            >
                                Book an appointment
                            </Link>
                        }
                    />
                )}

                {upcoming.length > 0 && (
                    <>
                        <SectionTitle>Upcoming</SectionTitle>
                        {upcoming.map(card)}
                    </>
                )}
                {past.length > 0 && (
                    <>
                        <SectionTitle>Past</SectionTitle>
                        {past.map(card)}
                    </>
                )}

                {hidden.size > 0 && (
                    <button type="button" onClick={() => setHidden(new Set())} className="w-full text-xs font-medium text-slate-400 underline">
                        Show {hidden.size} hidden
                    </button>
                )}
            </main>
        </>
    );
}