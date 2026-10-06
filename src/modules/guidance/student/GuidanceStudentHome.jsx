import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    CalendarCheck2,
    CalendarPlus,
    ChevronRight,
    HeartHandshake,
    MessageCircle,
    Users,
} from "lucide-react";

import { useGuidanceMe } from "../components/GuidanceGate";
import StatusBadge from "../components/StatusBadge";
import { Skeleton } from "../components/GuidanceStates";
import { Avatar, DateBadge } from "../components/GuidanceUi";
import { ONESERVE_STUDENT_HOME } from "../config/guidanceRoutes";
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
    const navigate = useNavigate();

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
        <>
            <header
                className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-[#D9578F] to-[#B13C70] px-4 pb-14 text-white shadow-sm"
                style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}
            >
                <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-6 h-36 w-36 rounded-full bg-white/5" />

                <div className="relative flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(ONESERVE_STUDENT_HOME)}
                        aria-label="Back to OneServe dashboard"
                        className="rounded-full bg-white/20 p-2 transition active:scale-95"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div className="min-w-0">
                        <p className="text-xs text-white/80">CDM OneServe</p>
                        <h1 className="text-lg font-semibold tracking-tight">Guidance Counseling</h1>
                    </div>

                    <HeartHandshake className="ml-auto text-white/80" size={26} aria-hidden="true" />
                </div>

                <p className="relative mt-5 text-2xl font-semibold tracking-tight">
                    Hello{firstName ? `, ${firstName}` : ""}!
                </p>
                <p className="relative mt-0.5 text-xs text-white/85">How can we support you today?</p>
            </header>

            <main className="-mt-8 space-y-4 px-4">
                {/* WHO IS SIGNED IN */}
                <section className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    <Avatar name={me.fullName} size="lg" />

                    <div className="min-w-0">
                        <p className="text-[11px] text-slate-400">Signed in as</p>
                        <p className="truncate text-base font-semibold text-slate-800">{me.fullName}</p>
                        <p className="truncate text-xs text-slate-500">
                            {[me.idNumber, me.course, me.yearLevel].filter(Boolean).join(" • ")}
                        </p>
                    </div>
                </section>

                {/* NEXT APPOINTMENT */}
                <section aria-label="Next appointment">
                    {next === undefined ? (
                        <div
                            role="status"
                            aria-busy="true"
                            className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"
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
                            className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm transition active:scale-[0.99]"
                        >
                            <DateBadge date={next.date} />

                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B13C70]">
                                    Next appointment
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
                            className="flex items-center gap-3 rounded-2xl border border-dashed border-pink-200 bg-pink-50/50 p-4 transition active:scale-[0.99]"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#D9578F] shadow-sm">
                                <CalendarPlus size={20} aria-hidden="true" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">No upcoming appointment</p>
                                <p className="text-xs text-slate-500">Book a session with a counselor.</p>
                            </div>

                            <ChevronRight size={18} className="text-[#D9578F]" aria-hidden="true" />
                        </Link>
                    )}
                </section>

                {/* WHERE TO GO */}
                <section className="space-y-2">
                    {ACTIONS.map(({ to, icon: Icon, label, note }) => (
                        <Link
                            key={to}
                            to={to}
                            className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-3.5 shadow-sm transition active:scale-[0.99]"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-[#D9578F]">
                                <Icon size={19} aria-hidden="true" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">{label}</p>
                                <p className="truncate text-xs text-slate-500">{note}</p>
                            </div>

                            <ChevronRight size={16} className="shrink-0 text-slate-300" aria-hidden="true" />
                        </Link>
                    ))}

                    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-3.5 opacity-60">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-[#D9578F]">
                            <MessageCircle size={19} aria-hidden="true" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">Messages</p>
                            <p className="truncate text-xs text-slate-500">Chat with your counselor</p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            Soon
                        </span>
                    </div>
                </section>
            </main>
        </>
    );
}