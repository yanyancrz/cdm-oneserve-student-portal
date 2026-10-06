import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarCheck2, Check, CheckCircle2, ChevronRight, Clock, Clock3, Users, X } from "lucide-react";

import { useGuidanceMe } from "../components/GuidanceGate";
import { CardListSkeleton, ErrorBox, StatsSkeleton } from "../components/GuidanceStates";
import { Avatar, SectionTitle } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";
import { formatYMD, slotToMinutes, todayISO } from "../utils/dateTime";

const byWhen = (a, b) => a.date.localeCompare(b.date) || slotToMinutes(a.timeSlot) - slotToMinutes(b.timeSlot);

export default function CounselorDashboard() {
    const { me } = useGuidanceMe();
    const p = me.counselorProfile;

    const [stats, setStats] = useState(null);
    const [appts, setAppts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(null);

    const load = useCallback(async (signal) => {
        setError("");
        setLoading(true);
        try {
            const [s, a] = await Promise.all([
                guidanceApi.getCounselorStats(signal),
                guidanceApi.getCounselorAppointments({}, signal),
            ]);
            setStats(s);
            setAppts(a);
        } catch (e) {
            if (e?.name !== "AbortError") setError(e.message || "Could not load your dashboard.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const c = new AbortController();
        load(c.signal);
        return () => c.abort();
    }, [load]);

    const respond = async (id, status) => {
        setBusy(id);
        try {
            await guidanceApi.updateAppointmentStatus(id, status);
            toast.success(status === "Confirmed" ? "Appointment confirmed." : "Request declined.");
            await load();
        } catch (e) {
            toast.error(e.message || "Action failed.");
            load();
        } finally {
            setBusy(null);
        }
    };

    const today = todayISO();
    const pending = appts.filter((a) => a.status === "Pending" && a.date >= today).sort(byWhen).slice(0, 5);
    const todays = appts.filter((a) => a.status === "Confirmed" && a.date === today).sort(byWhen);

    const cards = stats && [
        { icon: Clock, label: "Pending", value: stats.pending, tone: "text-amber-600 bg-amber-50" },
        { icon: CalendarCheck2, label: "Today", value: stats.today, tone: "text-green-700 bg-green-50" },
        { icon: CheckCircle2, label: "Completed this week", value: stats.completedWeek, tone: "text-sky-700 bg-sky-50" },
        { icon: Users, label: "Students", value: stats.totalStudents, tone: "text-purple-700 bg-purple-50" },
    ];

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    return (
        <main className="space-y-4 p-4">
            <section className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                <Avatar name={me.fullName} accent="green" size="lg" />

                <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">{greeting}</p>
                    <p className="truncate text-base font-semibold text-slate-800">{p?.title || "Guidance Counselor"}</p>
                    <p className="truncate text-xs text-slate-500">
                        {[p?.department, p?.room].filter(Boolean).join(" • ") || me.email}
                    </p>
                </div>
            </section>

            {loading && !stats && (
                <>
                    <StatsSkeleton label="Loading dashboard..." />
                    <CardListSkeleton rows={2} label="Loading requests..." />
                </>
            )}
            {error && <ErrorBox message={error} onRetry={() => load()} />}

            {cards && (
                <section className="grid grid-cols-2 gap-3">
                    {cards.map(({ icon: Icon, label, value, tone }) => (
                        <div key={label} className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                                <Icon size={19} aria-hidden="true" />
                            </div>

                            <p className="text-2xl font-bold tracking-tight text-slate-800">{value}</p>
                            <p className="text-xs text-slate-500">{label}</p>
                        </div>
                    ))}
                </section>
            )}

            {stats && (
                <section className="space-y-2.5">
                    <SectionTitle
                        right={
                            <Link
                                to="/guidance/counselor/appointments"
                                className="flex items-center gap-0.5 text-xs font-semibold text-[#106A2E]"
                            >
                                See all <ChevronRight size={14} aria-hidden="true" />
                            </Link>
                        }
                    >
                        Needs your response
                    </SectionTitle>

                    {pending.length === 0 ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                                <CheckCircle2 size={20} aria-hidden="true" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-700">All caught up</p>
                                <p className="text-xs text-slate-500">No pending requests.</p>
                            </div>
                        </div>
                    ) : (
                        pending.map((a) => (
                            <article key={a.id} className="rounded-2xl border border-black/[0.05] bg-white p-3.5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Avatar name={a.studentName} accent="green" size="sm" />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-800">{a.studentName}</p>
                                        <p className="truncate text-xs text-slate-500">
                                            {formatYMD(a.date)} · {a.timeSlot}
                                        </p>
                                    </div>

                                    {a.concernType && (
                                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                            {a.concernType}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        disabled={busy === a.id}
                                        onClick={() => respond(a.id, "Confirmed")}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#106A2E] py-2 text-xs font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-60"
                                    >
                                        <Check size={14} aria-hidden="true" /> Accept
                                    </button>

                                    <button
                                        type="button"
                                        disabled={busy === a.id}
                                        onClick={() => window.confirm("Decline this request?") && respond(a.id, "Rejected")}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-700 transition active:scale-95 disabled:opacity-60"
                                    >
                                        <X size={14} aria-hidden="true" /> Decline
                                    </button>
                                </div>
                            </article>
                        ))
                    )}

                    <SectionTitle>Today&apos;s sessions</SectionTitle>

                    {todays.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
                            No confirmed sessions today.
                        </p>
                    ) : (
                        todays.map((a) => (
                            <article
                                key={a.id}
                                className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-3.5 shadow-sm"
                            >
                                <div className="flex h-12 min-w-[4.25rem] flex-col items-center justify-center rounded-xl bg-green-50 px-2 text-green-700">
                                    <Clock3 size={12} aria-hidden="true" />
                                    <span className="mt-0.5 text-xs font-bold">{a.timeSlot}</span>
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">{a.studentName}</p>
                                    <p className="truncate text-xs text-slate-500">{a.concernType}</p>
                                </div>
                            </article>
                        ))
                    )}
                </section>
            )}
        </main>
    );
}