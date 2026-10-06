import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, CalendarX2, Check, CheckCircle2, Clock3, X } from "lucide-react";

import StatusBadge from "../components/StatusBadge";
import { CardListSkeleton, Empty, ErrorBox } from "../components/GuidanceStates";
import { Avatar, DateBadge, FilterChips, SearchBar } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";
import { formatYMD, slotToMinutes } from "../utils/dateTime";
import RescheduleSheet from "./RescheduleSheet";

const FILTERS = ["All", "Pending", "Confirmed", "Completed", "Cancelled", "Rejected", "Expired"];
const byWhen = (a, b) => a.date.localeCompare(b.date) || slotToMinutes(a.timeSlot) - slotToMinutes(b.timeSlot);

export default function CounselorAppointmentsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [busy, setBusy] = useState(null);
    const [resched, setResched] = useState(null);

    const load = useCallback(async (signal) => {
        setError("");
        setLoading(true);
        try {
            setItems(await guidanceApi.getCounselorAppointments({}, signal));
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

    const act = async (id, status, confirmText) => {
        if (confirmText && !window.confirm(confirmText)) return;
        setBusy(id);
        try {
            const r = await guidanceApi.updateAppointmentStatus(id, status);
            toast.success(r.message || "Updated.");
            setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
        } catch (e) {
            toast.error(e.message || "Action failed.");
            load();
        } finally {
            setBusy(null);
        }
    };

    const q = search.trim().toLowerCase();
    const rows = useMemo(
        () =>
            items
                .filter((a) => filter === "All" || a.status === filter)
                .filter(
                    (a) =>
                        !q ||
                        [a.studentName, a.studentNumber, a.concernType].filter(Boolean).some((v) => v.toLowerCase().includes(q))
                )
                .sort(byWhen),
        [items, filter, q]
    );

    // How many appointments each filter would show.
    const counts = FILTERS.reduce((acc, f) => {
        acc[f] = f === "All" ? items.length : items.filter((a) => a.status === f).length;
        return acc;
    }, {});

    const btn = "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition active:scale-95 disabled:opacity-60";

    return (
        <main className="space-y-3 p-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search student, ID or concern" accent="green" />

            <FilterChips options={FILTERS} value={filter} onChange={setFilter} accent="green" counts={counts} />

            {loading && items.length === 0 && <CardListSkeleton rows={3} label="Loading appointments..." />}
            {error && <ErrorBox message={error} onRetry={() => load()} />}
            {!loading && !error && rows.length === 0 && <Empty icon={CalendarX2} title="No appointments found" />}

            {rows.map((a) => {
                const isBusy = busy === a.id;
                const active = a.status === "Pending" || a.status === "Confirmed";

                return (
                    <article key={a.id} className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <Avatar name={a.studentName} accent="green" />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">{a.studentName}</p>
                                <p className="truncate text-xs text-slate-500">
                                    {[a.studentNumber, a.course, a.yearLevel].filter(Boolean).join(" • ")}
                                </p>
                            </div>

                            <StatusBadge status={a.status} />
                        </div>

                        <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
                            <DateBadge date={a.date} accent="green" muted={!active} />

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-700">{formatYMD(a.date)}</p>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                    <Clock3 size={12} aria-hidden="true" /> {a.timeSlot}
                                </p>
                            </div>

                            {a.concernType && (
                                <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm">
                                    {a.concernType}
                                </span>
                            )}
                        </div>

                        {a.notes && (
                            <p className="mt-2 rounded-lg border-l-4 border-slate-200 bg-slate-50 p-2.5 text-xs leading-5 text-slate-600">
                                {a.notes}
                            </p>
                        )}

                        {a.status === "Pending" && (
                            <div className="mt-3 flex gap-2">
                                <button type="button" disabled={isBusy} onClick={() => act(a.id, "Confirmed")}
                                    className={`${btn} bg-[#106A2E] text-white shadow-sm`}>
                                    <Check size={14} aria-hidden="true" /> {isBusy ? "…" : "Accept"}
                                </button>
                                <button type="button" disabled={isBusy} onClick={() => setResched(a)}
                                    className={`${btn} border border-slate-200 text-slate-700`}>
                                    <CalendarClock size={14} aria-hidden="true" /> Reschedule
                                </button>
                                <button type="button" disabled={isBusy} onClick={() => act(a.id, "Rejected", "Decline this request?")}
                                    className={`${btn} border border-red-200 bg-red-50 text-red-700`}>
                                    <X size={14} aria-hidden="true" /> Decline
                                </button>
                            </div>
                        )}

                        {a.status === "Confirmed" && (
                            <div className="mt-3 flex gap-2">
                                <button type="button" disabled={isBusy} onClick={() => act(a.id, "Completed", "Mark this session as completed?")}
                                    className={`${btn} bg-sky-600 text-white shadow-sm`}>
                                    <CheckCircle2 size={14} aria-hidden="true" /> Done
                                </button>
                                <button type="button" disabled={isBusy} onClick={() => setResched(a)}
                                    className={`${btn} border border-slate-200 text-slate-700`}>
                                    <CalendarClock size={14} aria-hidden="true" /> Reschedule
                                </button>
                                <button type="button" disabled={isBusy} onClick={() => act(a.id, "Cancelled", "Cancel this appointment? The student will be notified.")}
                                    className={`${btn} border border-red-200 bg-red-50 text-red-700`}>
                                    <X size={14} aria-hidden="true" /> Cancel
                                </button>
                            </div>
                        )}
                    </article>
                );
            })}

            {resched && (
                <RescheduleSheet
                    appointment={resched}
                    onClose={() => setResched(null)}
                    onDone={() => {
                        setResched(null);
                        toast.success("Appointment rescheduled.");
                        load();
                    }}
                />
            )}
        </main>
    );
}