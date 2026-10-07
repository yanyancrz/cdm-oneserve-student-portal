import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    CalendarCheck2,
    CalendarPlus,
    ChevronRight,
    HeartHandshake,
    MessageCircle,
    Users,
} from "lucide-react";

import { useGuidanceMe } from "../components/GuidanceGate";
import RoleBadge from "../components/RoleBadge";
import StatusBadge from "../components/StatusBadge";
import { Skeleton } from "../components/GuidanceStates";
import { Avatar, DateBadge } from "../components/GuidanceUi";
import { useUnreadChats } from "../hooks/useUnreadChats";
import { personDetails } from "../utils/people";
import { guidanceApi } from "../services/guidanceApi";
import { formatYMD, slotToMinutes, todayISO } from "../utils/dateTime";

const ACTIONS = [
    { to: "/guidance/counselors", icon: Users, label: "Counselors", note: "Browse counselors and their schedules" },
    { to: "/guidance/book", icon: CalendarPlus, label: "Book an appointment", note: "Pick a counselor, date and time" },
    { to: "/guidance/appointments", icon: CalendarCheck2, label: "My appointments", note: "Track, reschedule info and cancel" },
];

const ACTIVE = ["Pending", "Confirmed"];
const byWhen = (a, b) => a.date.localeCompare(b.date) || slotToMinutes(a.timeSlot) - slotToMinutes(b.timeSlot);

export default function GuidanceStudentHome() {
    const { me } = useGuidanceMe();

    // Live unread chat count for the Messages card.
    const unreadChats = useUnreadChats("student");

    // The student's next booking. undefined = still loading, null = none.
    const [next, setNext] = useState(undefined);

    useEffect(() => {
        const c = new AbortController();

        guidanceApi
            .getMyAppointments(c.signal)
            .then((items) => {
                const today = todayISO();
                const upcoming = items.filter((a) => ACTIVE.includes(a.status) && a.date >= today).sort(byWhen);
                setNext(upcoming[0] || null);
            })
            .catch((e) => {
                if (e?.name !== "AbortError") setNext(null);
            });

        return () => c.abort();
    }, []);

    const firstName = String(me.fullName || "").split(" ")[0];

    return (
        <div className="relative overflow-x-hidden">
            <style>{`
                @keyframes dashboardReveal {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .dashboard-reveal {
                    animation: dashboardReveal .65s cubic-bezier(.2,.8,.2,1) both;
                }
                .dashboard-delay-1 { animation-delay: .08s; }
                .dashboard-delay-2 { animation-delay: .16s; }
                .dashboard-delay-3 { animation-delay: .24s; }
            `}</style>

            <main className="relative z-10 px-3 pt-3 pb-24 sm:px-5 sm:pt-5">
                {/* HERO */}
                <section className="dashboard-reveal relative mb-5 overflow-hidden rounded-[28px] border border-[#0E3B22]/10 bg-gradient-to-br from-[#10B981] via-[#0E3B22] to-[#052E16] px-5 py-6 shadow-xl shadow-emerald-900/20 sm:px-7 sm:py-8">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-emerald-300/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 right-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
                    <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] bg-[size:32px_32px]" />

                    <div className="relative">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" />
                                <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-200">
                                    Guidance Counseling
                                </span>
                            </div>

                            <HeartHandshake className="text-emerald-200/80" size={26} aria-hidden="true" />
                        </div>

                        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                            Hello,
                            <span className="block bg-gradient-to-r from-emerald-300 to-cyan-200 bg-clip-text text-transparent">
                                {firstName || "Student"}
                            </span>
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
                            How can we support you today?
                        </p>

                        <p className="mt-4 text-xs uppercase tracking-[.14em] text-white/35">
                            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </p>
                    </div>
                </section>

                {/* SIGNED IN */}
                <section className="dashboard-reveal dashboard-delay-1 mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <Avatar name={me.fullName} size="lg" accent="green" />

                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-slate-400">Signed in as</p>
                        <p className="truncate text-base font-semibold text-slate-800">{me.fullName}</p>
                        <p className="truncate text-xs text-slate-500">
                            {personDetails(me)}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                        <RoleBadge role={me.role} />
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                        </span>
                    </div>
                </section>

                {/* NEXT APPOINTMENT */}
                <div className="dashboard-reveal dashboard-delay-2 mb-5">
                    <div className="mb-3 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#106A2E]/60">
                                Schedule
                            </p>
                            <h2 className="mt-1 text-lg font-semibold text-slate-800 sm:text-xl">
                                Next Appointment
                            </h2>
                        </div>
                    </div>

                    {next === undefined ? (
                        <div
                            role="status"
                            aria-busy="true"
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <span className="sr-only">Loading your next appointment...</span>
                            <Skeleton className="h-14 w-12 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3.5 w-1/2" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        </div>
                    ) : next ? (
                        <Link
                            to="/guidance/appointments"
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99]"
                        >
                            <DateBadge date={next.date} accent="green" />

                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#106A2E]">
                                    Upcoming
                                </p>
                                <p className="truncate text-sm font-semibold text-slate-800">
                                    {formatYMD(next.date)} · {next.timeSlot}
                                </p>
                                <p className="truncate text-xs text-slate-500">{next.counselorName || "Counselor"}</p>
                            </div>

                            <StatusBadge status={next.status} />
                        </Link>
                    ) : (
                        <Link
                            to="/guidance/book"
                            className="flex items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-white p-4 transition active:scale-[0.99]"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#106A2E]">
                                <CalendarPlus size={20} aria-hidden="true" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">No upcoming appointment</p>
                                <p className="text-xs text-slate-500">Book a session with a counselor.</p>
                            </div>

                            <ChevronRight size={18} className="text-[#106A2E]" aria-hidden="true" />
                        </Link>
                    )}
                </div>

                {/* WHERE TO GO */}
                <section className="dashboard-reveal dashboard-delay-3">
                    <div className="mb-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#106A2E]/60">
                            OneServe Modules
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-800 sm:text-xl">
                            What would you like to do?
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {ACTIONS.map(({ to, icon: Icon, label, note }) => (
                            <Link
                                key={to}
                                to={to}
                                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                            >
                                <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-emerald-200/20 opacity-0 blur-2xl transition group-hover:opacity-100" />

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-emerald-50 text-[#106A2E] transition duration-300 group-hover:scale-110">
                                    <Icon size={19} aria-hidden="true" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                                    <p className="truncate text-xs text-slate-400">{note}</p>
                                </div>

                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition group-hover:text-slate-700">
                                    →
                                </span>
                            </Link>
                        ))}

                        <Link
                            to="/guidance/chat"
                            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99]"
                        >
                            <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-emerald-200/20 opacity-0 blur-2xl transition group-hover:opacity-100" />

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-emerald-50 text-[#106A2E]">
                                <MessageCircle size={19} aria-hidden="true" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">Messages</p>
                                <p className="truncate text-xs text-slate-400">Chat with your counselor</p>
                            </div>

                            {unreadChats > 0 && (
                                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#D9578F] px-1.5 text-[10px] font-bold text-white" aria-label={`${unreadChats} unread messages`}>
                                    {unreadChats > 9 ? "9+" : unreadChats}
                                </span>
                            )}

                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition group-hover:text-slate-700">
                                →
                            </span>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}