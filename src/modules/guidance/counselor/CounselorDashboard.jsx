import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarCheck2, CheckCircle2, Clock, Users } from "lucide-react";

import { useGuidanceMe } from "../components/GuidanceGate";
import { ErrorBox, Loading } from "../components/GuidanceStates";
import RoleBadge from "../components/RoleBadge";
import ProfileSheet from "./ProfileSheet";
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
    const [profileOpen, setProfileOpen] = useState(false);
    const [profile, setProfile] = useState(p);

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
        { icon: Users, label: "Clients", value: stats.totalStudents, tone: "text-purple-700 bg-purple-50" },
    ];

    return (
        <main className="space-y-4 p-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{profile?.title || "Guidance Counselor"}</p>
                        <p className="text-xs text-slate-500">{[profile?.department, profile?.room].filter(Boolean).join(" • ") || me.email}</p>
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
                        todays.map((a) => (
                            <article key={a.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="rounded-xl bg-green-50 px-2.5 py-1.5 text-xs font-bold text-green-700">{a.timeSlot}</div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">{a.studentName}</p>
                                    <p className="truncate text-xs text-slate-500">{a.concernType}</p>
                                </div>
                            </article>
                        ))
                    )}
                </section>
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