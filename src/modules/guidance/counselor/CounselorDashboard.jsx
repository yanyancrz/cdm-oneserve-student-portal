import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarCheck2, CheckCircle2, Clock, Users } from "lucide-react";

import { API_URL } from "../../../config/api";
import { useGuidanceMe } from "../components/GuidanceGate";
import { ErrorBox, Loading } from "../components/GuidanceStates";
import { Avatar } from "../components/GuidanceUi";
import RoleBadge from "../components/RoleBadge";
import StatusBadge from "../components/StatusBadge";
import MonthCalendar from "../components/MonthCalendar";
import ProfileSheet from "./ProfileSheet";
import { guidanceApi } from "../services/guidanceApi";
import { arrivalWindow, formatYMD, slotToMinutes, todayISO } from "../utils/dateTime";
import { getPHHolidays } from "../utils/phHolidays";
import { personDetails } from "../utils/people";

const byWhen = (a, b) => a.date.localeCompare(b.date) || slotToMinutes(a.timeSlot) - slotToMinutes(b.timeSlot);

export default function CounselorDashboard() {
    const { me } = useGuidanceMe();
    const p = me.counselorProfile;

    const [stats, setStats] = useState(null);
    const [appts, setAppts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [profile, setProfile] = useState(p);
    const [holidays, setHolidays] = useState({});
    const [selectedDay, setSelectedDay] = useState(todayISO());

    // Student photo paths (email -> wwwroot path).
    const [pictures, setPictures] = useState({});

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

        // PH holidays for this year and next (December views) - cached in
        // localStorage, so this is one network call per year at most.
        const year = new Date().getFullYear();
        Promise.allSettled([getPHHolidays(year, c.signal), getPHHolidays(year + 1, c.signal)]).then(
            ([a, b]) => {
                if (c.signal.aborted) return;
                setHolidays({
                    ...(a.status === "fulfilled" ? a.value : {}),
                    ...(b.status === "fulfilled" ? b.value : {}),
                });
            }
        );

        return () => c.abort();
    }, [load]);

    // ── Student profile pictures ─────────────────
    // The counselor appointments payload includes the
    // student's email (StudentEmail) but not their photo.
    // The public GET /api/profile/{email} returns the
    // wwwroot path, so fetch them in parallel and map
    // email -> path for the calendar day list.
    useEffect(() => {
        const emails = [
            ...new Set(
                appts
                    .map((a) => a.studentEmail || a.email)
                    .filter(Boolean)
            ),
        ];

        if (!emails.length) {
            setPictures({});
            return;
        }

        let cancelled = false;

        Promise.all(
            emails.map((email) =>
                fetch(`${API_URL}/api/profile/${encodeURIComponent(email)}`)
                    .then((r) => (r.ok ? r.json() : null))
                    .then((d) => ({
                        email: String(email).toLowerCase(),
                        picture: d?.profilePicture || null,
                    }))
                    .catch(() => null)
                )
        ).then((rows) => {
            if (cancelled) return;

            const map = {};
            for (const row of rows) {
                if (row?.email && row.picture) {
                    map[row.email] = row.picture;
                }
            }
            setPictures(map);
        });

        return () => {
            cancelled = true;
        };
    }, [appts]);

    // Photo for an appointment: direct from the payload
    // (if the backend ever includes it) or fetched by email.
    const pictureFor = (a) =>
        a.profilePicture ||
        pictures[String(a.studentEmail || a.email || "").toLowerCase()] ||
        null;

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

    // Appointments grouped per day for the calendar dots.
    const byDate = {};
    for (const a of appts) {
        if (!["Pending", "Confirmed", "Arrived"].includes(a.status)) continue;
        (byDate[a.date] = byDate[a.date] || []).push(a);
    }

    const dayAppts = (selectedDay ? byDate[selectedDay] || [] : []).sort(byWhen);

    const markAttendance = async (id, status) => {
        if (
            status === "NoShow" &&
            !window.confirm(
                "Mark as no-show now? Sessions with no arrival are terminated as no-show automatically 30 minutes after the start."
            )
        )
            return;
        setBusy(id);
        try {
            await guidanceApi.updateAppointmentStatus(id, status);
            toast.success(status === "Arrived" ? "Marked as arrived." : "Marked as no-show.");
            await load();
        } catch (e) {
            toast.error(e.message || "Action failed.");
            load();
        } finally {
            setBusy(null);
        }
    };

    const cards = stats && [
        { icon: Clock, label: "Pending", value: stats.pending, tone: "text-amber-600 bg-amber-50" },
        { icon: CalendarCheck2, label: "Today", value: stats.today, tone: "text-green-700 bg-green-50" },
        { icon: CheckCircle2, label: "Completed this week", value: stats.completedWeek, tone: "text-sky-700 bg-sky-50" },
        { icon: Users, label: "Clients", value: stats.totalStudents, tone: "text-purple-700 bg-purple-50" },
    ];

    return (
        <main className="space-y-4 p-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                        {me.profilePicture ? (
                            <img
                                src={`${API_URL}${me.profilePicture}`}
                                alt={me.fullName}
                                className="h-11 w-11 shrink-0 rounded-full object-cover"
                            />
                        ) : (
                            <Avatar name={me.fullName} accent="green" size="md" />
                        )}

                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{profile?.title || "Guidance Counselor"}</p>
                            <p className="text-xs text-slate-500">{[profile?.department, profile?.room].filter(Boolean).join(" • ") || me.email}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setProfileOpen(true)}
                        className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition active:scale-95"
                    >
                        Edit profile
                    </button>
                </div>
            </section>

            {loading && !stats && <Loading text="Loading dashboard..." />}
            {error && <ErrorBox message={error} onRetry={() => load()} />}

            {cards && (
                <section className="grid grid-cols-2 gap-3">
                    {cards.map(({ icon: Icon, label, value, tone }) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                                <Icon size={18} />
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{value}</p>
                            <p className="text-xs text-slate-500">{label}</p>
                        </div>
                    ))}
                </section>
            )}

            {stats && (
                <>
                    {/* ---------- CALENDAR: appointments per day ---------- */}
                    <section className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-700">Appointment calendar</h2>

                        <MonthCalendar
                            value={selectedDay}
                            onSelect={setSelectedDay}
                            dayInfo={(iso) => ({
                                dots: (byDate[iso] || []).length,
                                holiday: holidays[iso] || "",
                            })}
                        />

                        <div className="rounded-2xl border border-black/[0.05] bg-white p-3 shadow-sm">
                            <p className="text-xs font-bold text-slate-700">
                                {formatYMD(selectedDay)}
                                {holidays[selectedDay] && (
                                    <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                        {holidays[selectedDay]}
                                    </span>
                                )}
                            </p>

                            {dayAppts.length === 0 ? (
                                <p className="mt-2 text-xs text-slate-400">
                                    No appointments on this day.
                                </p>
                            ) : (
                                <ul className="mt-2 space-y-2">
                                    {dayAppts.map((a) => (
                                        <li key={a.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
                                            {pictureFor(a) ? (
                                                <img
                                                    src={`${API_URL}${pictureFor(a)}`}
                                                    alt={a.studentName}
                                                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                                                />
                                            ) : (
                                                <Avatar name={a.studentName} accent="green" size="sm" />
                                            )}
                                            <div className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-green-700 shadow-sm">
                                                {a.timeSlot}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-slate-800">
                                                    <span className="truncate">{a.studentName}</span>
                                                    <RoleBadge role={a.role} />
                                                </p>
                                                <p className="truncate text-[11px] text-slate-500">
                                                    {personDetails(a)}{a.concernType ? ` · ${a.concernType}` : ""}
                                                </p>
                                            </div>
                                            <StatusBadge status={a.status} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>

                    <section className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700">Needs your response</h2>
                        <Link to="/guidance/counselor/appointments" className="text-xs font-semibold text-[#106A2E]">
                            See all
                        </Link>
                    </div>

                    {pending.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
                            No pending requests.
                        </p>
                    ) : (
                        pending.map((a) => (
                            <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    {pictureFor(a) ? (
                                        <img
                                            src={`${API_URL}${pictureFor(a)}`}
                                            alt={a.studentName}
                                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                                        />
                                    ) : (
                                        <Avatar name={a.studentName} accent="green" size="sm" />
                                    )}
                                    <span className="truncate">{a.studentName}</span>
                                    <RoleBadge role={a.role} />
                                </p>
                                <p className="text-xs text-slate-500">
                                    {formatYMD(a.date)} · {a.timeSlot} · {a.concernType}
                                </p>
                                <div className="mt-2 flex gap-2">
                                    <button
                                        type="button"
                                        disabled={busy === a.id}
                                        onClick={() => respond(a.id, "Confirmed")}
                                        className="flex-1 rounded-lg bg-[#106A2E] py-2 text-xs font-semibold text-white disabled:opacity-60"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy === a.id}
                                        onClick={() => window.confirm("Decline this request?") && respond(a.id, "Rejected")}
                                        className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </article>
                        ))
                    )}

                    <h2 className="pt-2 text-sm font-bold text-slate-700">Today's sessions</h2>
                    {todays.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
                            No confirmed sessions today.
                        </p>
                    ) : (
                        todays.map((a) => {
                            const window = arrivalWindow(a.date, a.timeSlot);
                            const expired = window.state === "expired";
                            const tooEarly = window.state === "upcoming";

                            return (
                                <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <div className="flex items-center gap-3">
                                        {pictureFor(a) ? (
                                            <img
                                                src={`${API_URL}${pictureFor(a)}`}
                                                alt={a.studentName}
                                                className="h-9 w-9 shrink-0 rounded-full object-cover"
                                            />
                                        ) : (
                                            <Avatar name={a.studentName} accent="green" size="sm" />
                                        )}
                                        <div className="rounded-xl bg-green-50 px-2.5 py-1.5 text-xs font-bold text-green-700">{a.timeSlot}</div>
                                        <div className="min-w-0 flex-1">
                                            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800">
                                                <span className="truncate">{a.studentName}</span>
                                                <RoleBadge role={a.role} />
                                            </p>
                                            <p className="truncate text-xs text-slate-500">
                                                {personDetails(a)}{a.concernType ? ` · ${a.concernType}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    {expired ? (
                                        <div className="mt-2">
                                            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-[11px] font-medium leading-5 text-red-700">
                                                No arrival 30 minutes past the start - terminated as no-show automatically.
                                            </p>
                                            <button
                                                type="button"
                                                disabled={busy === a.id}
                                                onClick={() => markAttendance(a.id, "NoShow")}
                                                className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
                                            >
                                                No-show - terminate now
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-2">
                                            <button
                                                type="button"
                                                disabled={busy === a.id || tooEarly}
                                                onClick={() => markAttendance(a.id, "Arrived")}
                                                className="w-full rounded-lg bg-[#106A2E] py-2 text-xs font-semibold text-white disabled:opacity-60"
                                            >
                                                Arrived
                                            </button>
                                            {tooEarly && (
                                                <p className="mt-1.5 text-[11px] text-slate-400">
                                                    Unlocks 30 minutes before the session.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </article>
                            );
                        })
                    )}
                    </section>
                </>
            )}

            {profileOpen && (
                <ProfileSheet
                    profile={profile}
                    email={me.email}
                    onClose={() => setProfileOpen(false)}
                    onDone={() => {
                        setProfileOpen(false);
                        toast.success("Profile updated.");
                        // Refresh the profile from the server so the card updates.
                        guidanceApi.getCounselorMe().then((me) => setProfile(me.counselorProfile ?? null)).catch(() => {});
                        load();
                    }}
                />
            )}
        </main>
    );
}