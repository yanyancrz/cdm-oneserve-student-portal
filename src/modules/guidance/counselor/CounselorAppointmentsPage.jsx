import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, CalendarX2, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3, X, ArrowUpDown } from "lucide-react";

import StatusBadge from "../components/StatusBadge";
import RoleBadge from "../components/RoleBadge";
import { CardListSkeleton, Empty, ErrorBox } from "../components/GuidanceStates";
import { Avatar, DateBadge, FilterChips, SearchBar } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";
import { personDetails } from "../utils/people";
import { arrivalWindow, formatYMD, slotToMinutes } from "../utils/dateTime";
import RescheduleSheet from "./RescheduleSheet";
import SessionRecordSheet from "./SessionRecordSheet";
import FollowUpSheet from "./FollowUpSheet";

const FILTERS = ["All", "Pending", "Confirmed", "Arrived", "NoShow", "Completed", "Cancelled", "Rejected", "Expired"];
const PAGE_SIZE = 10;
const APPT_PAGE_SIZE = 5;
const byWhen = (a, b) => a.date.localeCompare(b.date) || slotToMinutes(a.timeSlot) - slotToMinutes(b.timeSlot);

export default function CounselorAppointmentsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [busy, setBusy] = useState(null);
    const [resched, setResched] = useState(null);
    const [recordFor, setRecordFor] = useState(null);
    const [followUpFor, setFollowUpFor] = useState(null);
    const [open, setOpen] = useState({}); // which person cards are expanded
    const [sortDesc, setSortDesc] = useState({}); // per-card sort direction
    const [groupPage, setGroupPage] = useState({}); // per-student appointment page
    const [page, setPage] = useState(1);

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
            toast.error(e.message || "Could not update the appointment.");
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

    // Group the filtered appointments per student/faculty person.
    const groups = useMemo(() => {
        const map = new Map();
        for (const a of rows) {
            const key = `${a.role || ""}|${a.studentNumber || a.idNumber || a.studentName}`;
            if (!map.has(key)) map.set(key, { key, person: a, appointments: [] });
            map.get(key).appointments.push(a);
        }
        return [...map.values()]
            .sort((x, y) => String(x.person.studentName || "").localeCompare(String(y.person.studentName || "")));
    }, [rows]);

    // Reset to the first page whenever the result set changes.
    useEffect(() => {
        setPage(1);
    }, [filter, q]);

    // Paginate the grouped (per-student) list, 10 groups per page.
    const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pagedGroups = groups.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // How many appointments each filter would show.
    const counts = FILTERS.reduce((acc, f) => {
        acc[f] = f === "All" ? items.length : items.filter((a) => a.status === f).length;
        return acc;
    }, {});

    const btn = "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition active:scale-95 disabled:opacity-60";

    return (
        <main className="space-y-3 p-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search name, ID or concern" accent="green" />

            <FilterChips options={FILTERS} value={filter} onChange={setFilter} accent="green" counts={counts} />

            {loading && items.length === 0 && <CardListSkeleton rows={3} label="Loading appointments..." />}
            {error && <ErrorBox message={error} onRetry={() => load()} />}
            {!loading && !error && rows.length === 0 && <Empty icon={CalendarX2} title="No appointments found" />}

            {pagedGroups.map((g) => {
                const isOpen = !!open[g.key];

                return (
                    <section key={g.key} className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                        <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => setOpen((prev) => ({ ...prev, [g.key]: !prev[g.key] }))}
                            className="flex w-full items-center gap-3 p-4 text-left transition active:bg-slate-50"
                        >
                            <Avatar name={g.person.studentName} accent="green" />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">{g.person.studentName}</p>
                                <p className="truncate text-xs text-slate-500">{personDetails(g.person)}</p>
                            </div>

                            <RoleBadge role={g.person.role} />

                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-[#106A2E]">
                                {g.appointments.length} appointment{g.appointments.length > 1 ? "s" : ""}
                            </span>

                            <ChevronDown
                                size={16}
                                aria-hidden="true"
                                className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {isOpen && (
                            <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        {g.appointments.length} appointment{g.appointments.length === 1 ? "" : "s"}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => setSortDesc((prev) => ({ ...prev, [g.key]: !(prev[g.key] ?? true) }))}
                                        aria-label="Toggle sort order"
                                        title={(sortDesc[g.key] ?? true) ? "Newest first" : "Oldest first"}
                                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition active:scale-95"
                                    >
                                        <ArrowUpDown size={12} aria-hidden="true" />
                                        {(sortDesc[g.key] ?? true) ? "Newest" : "Oldest"}
                                    </button>
                                </div>

                                {(() => {
                                    const sortedAppts = [...g.appointments].sort((a, b) =>
                                        (sortDesc[g.key] ?? true)
                                            ? b.date.localeCompare(a.date) || slotToMinutes(b.timeSlot) - slotToMinutes(a.timeSlot)
                                            : a.date.localeCompare(b.date) || slotToMinutes(a.timeSlot) - slotToMinutes(b.timeSlot)
                                    );
                                    const apptTotalPages = Math.max(1, Math.ceil(sortedAppts.length / APPT_PAGE_SIZE));
                                    const apptPage = Math.min(Math.max(1, groupPage[g.key] || 1), apptTotalPages);
                                    const apptStart = (apptPage - 1) * APPT_PAGE_SIZE;
                                    const apptItems = sortedAppts.slice(apptStart, apptStart + APPT_PAGE_SIZE);
                                    return (
                                        <>
                                            {apptItems.map((a) => {
                                    const isBusy = busy === a.id;
                                    const active = a.status === "Pending" || a.status === "Confirmed";

                                    return (
                        <article key={a.id} className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-xs font-semibold text-slate-500">{personDetails(a)}</p>
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
                            <ConfirmedArrivalBox
                                appointment={a}
                                isBusy={isBusy}
                                onArrived={() => act(a.id, "Arrived")}
                                onNoShow={() => act(a.id, "NoShow", "Mark this student as no-show now? Sessions with no arrival are terminated as no-show automatically 30 minutes after the start.")}
                            />
                        )}

                        {a.status === "Arrived" && (
                            <div className="mt-3 flex gap-2">
                                <button type="button" disabled={isBusy} onClick={() => act(a.id, "Completed", "Mark this session as completed?")}
                                    className={`${btn} bg-sky-600 text-white shadow-sm`}>
                                    <CheckCircle2 size={14} aria-hidden="true" /> Done
                                </button>
                                <button type="button" disabled={isBusy} onClick={() => setResched(a)}
                                    className={`${btn} border border-slate-200 text-slate-700`}>
                                    <CalendarClock size={14} aria-hidden="true" /> Reschedule
                                </button>
                            </div>
                        )}
                            {a.status === "Completed" && (
                                <div className="mt-3 flex gap-2">
                                    <button type="button" onClick={() => setRecordFor(a)}
                                        className={`${btn} bg-[#106A2E] text-white shadow-sm`}>
                                        Session notes
                                    </button>
                                    <button type="button" onClick={() => setFollowUpFor(a)}
                                        className={`${btn} border border-slate-200 text-slate-700`}>
                                        Follow-up
                                    </button>
                                </div>
                            )}
                                    </article>
                                    );
                                })}
                                {sortedAppts.length > APPT_PAGE_SIZE && (
                                    <div className="flex items-center justify-between gap-2 pt-1">
                                        <p className="text-[10px] text-slate-400">
                                            {apptStart + 1}–{Math.min(apptStart + APPT_PAGE_SIZE, sortedAppts.length)} of {sortedAppts.length}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={apptPage <= 1}
                                                onClick={() => setGroupPage((prev) => ({ ...prev, [g.key]: Math.max(1, apptPage - 1) }))}
                                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 disabled:opacity-40"
                                            >
                                                Prev
                                            </button>
                                            <span className="text-[10px] text-slate-400">
                                                {apptPage}/{apptTotalPages}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={apptPage >= apptTotalPages}
                                                onClick={() => setGroupPage((prev) => ({ ...prev, [g.key]: Math.min(apptTotalPages, apptPage + 1) }))}
                                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 disabled:opacity-40"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </section>
                );
            })}

            {groups.length > PAGE_SIZE && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.05] bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs text-slate-500">
                        Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, groups.length)} of {groups.length} students
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            aria-label="Previous page"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition active:scale-95 disabled:opacity-40"
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <span className="text-xs text-slate-500">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            aria-label="Next page"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition active:scale-95 disabled:opacity-40"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

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

            {recordFor && (
                <SessionRecordSheet
                    appointment={recordFor}
                    onClose={() => setRecordFor(null)}
                    onDone={(message) => {
                        setRecordFor(null);
                        toast.success(message || "Session record saved.");
                    }}
                />
            )}

            {followUpFor && (
                <FollowUpSheet
                    appointment={followUpFor}
                    onClose={() => setFollowUpFor(null)}
                    onDone={() => {
                        setFollowUpFor(null);
                        toast.success("Follow-up requested.");
                    }}
                />
            )}
        </main>
    );
}

/**
 * The ONLY action on a Confirmed appointment is arrival tracking.
 * Arrived unlocks 30 minutes before the session starts; 30 minutes
 * after the start with no arrival, the server terminates the session
 * as no-show by itself (see GuidanceCounselorService.AutoTerminateNoShowsAsync).
 * The button remains as a manual fallback for anyone the job has not
 * reached yet.
 */
function ConfirmedArrivalBox({ appointment, isBusy, onArrived, onNoShow }) {
    const btn = "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition active:scale-95 disabled:opacity-60";
    const window = arrivalWindow(appointment.date, appointment.timeSlot);

    if (window.state === "expired") {
        return (
            <div className="mt-3 space-y-2">
                <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-medium leading-5 text-red-700">
                    No arrival 30 minutes past the start. This session is terminated
                    as a no-show automatically - terminate it now only if you want it gone sooner.
                </p>
                <div className="flex gap-2">
                    <button type="button" disabled={isBusy} onClick={onNoShow}
                        className={`${btn} border border-red-200 bg-red-50 text-red-700`}>
                        <X size={14} aria-hidden="true" /> No-show - terminate now
                    </button>
                </div>
            </div>
        );
    }

    const tooEarly = window.state === "upcoming";

    return (
        <div className="mt-3 space-y-2">
            <div className="flex gap-2">
                <button type="button" disabled={isBusy || tooEarly} onClick={onArrived}
                    className={`${btn} bg-[#106A2E] text-white shadow-sm`}>
                    <Check size={14} aria-hidden="true" /> Arrived
                </button>
            </div>
            {tooEarly && (
                <p className="text-[11px] text-slate-400">
                    Arrived unlocks 30 minutes before the session ({appointment.timeSlot}).
                </p>
            )}
        </div>
    );
}