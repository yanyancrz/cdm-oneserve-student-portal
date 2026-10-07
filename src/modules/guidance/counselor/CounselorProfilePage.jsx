import { useState } from "react";
import { Link } from "react-router-dom";
import {
    BarChart3,
    CalendarClock,
    ChevronRight,
    FolderOpen,
    KeyRound,
    LogOut,
    Mail,
    Pencil,
    UserRound,
} from "lucide-react";

import { useGuidanceMe } from "../components/GuidanceGate";
import { ACCENTS, Avatar } from "../components/GuidanceUi";
import ProfileSheet from "./ProfileSheet";
import ChangePasswordModal from "./ChangePasswordModal";
import ChangeEmailModal from "./ChangeEmailModal";
import { signOut } from "../utils/session";

// Pages that used to live in the "More" menu.
const QUICK_LINKS = [
    { to: "/guidance/counselor/availability", label: "Availability", icon: CalendarClock, note: "Your weekly schedule" },
    { to: "/guidance/counselor/records", label: "Records", icon: FolderOpen, note: "Session notes & summaries" },
    { to: "/guidance/counselor/reports", label: "Reports", icon: BarChart3, note: "Appointment statistics" },
];

const A = ACCENTS.green;

// Profile tab: account details, quick links, and sign out.
export default function CounselorProfilePage() {
    const { me, refreshMe } = useGuidanceMe();
    const [editing, setEditing] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [changingEmail, setChangingEmail] = useState(false);

    const profile = me?.counselorProfile || {};
    const specializations = profile.specializations || [];

    const handleSignOut = () => {
        signOut();
        window.location.replace("/");
    };

    return (
        <main className="space-y-4 p-4">
            {/* Identity card */}
            <section className="rounded-3xl border border-black/[0.05] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <Avatar name={me.fullName} accent="green" size="lg" />

                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-semibold text-slate-800">
                            {me.fullName}
                        </h2>
                        <p className="truncate text-xs text-slate-500">{me.email}</p>
                        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#106A2E]">
                            <UserRound size={10} aria-hidden="true" /> Guidance Counselor
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        aria-label="Edit profile"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-[#106A2E] hover:text-[#106A2E]"
                    >
                        <Pencil size={15} aria-hidden="true" />
                    </button>
                </div>

                {(profile.title || profile.room || profile.department || profile.phone || profile.bio) && (
                    <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
                        {profile.title && (
                            <Row label="Title" value={profile.title} />
                        )}
                        {profile.room && <Row label="Room" value={profile.room} />}
                        {profile.department && (
                            <Row label="Department" value={profile.department} />
                        )}
                        {profile.phone && <Row label="Phone" value={profile.phone} />}
                        {profile.bio && <Row label="Bio" value={profile.bio} />}
                    </dl>
                )}

                {specializations.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {specializations.map((s) => (
                            <span
                                key={s}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                            >
                                {s}
                            </span>
                        ))}
                    </div>
                )}
            </section>

            {/* Quick links (used to be the "More" menu) */}
            <section>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Counselor tools
                </h3>

                <div className="overflow-hidden rounded-3xl border border-black/[0.05] bg-white shadow-sm">
                    {QUICK_LINKS.map(({ to, label, icon: Icon, note }, i) => (
                        <Link
                            key={to}
                            to={to}
                            className={`flex items-center gap-3 p-4 transition hover:bg-slate-50 ${
                                i > 0 ? "border-t border-slate-100" : ""
                            }`}
                        >
                            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${A.soft}`}>
                                <Icon size={16} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-slate-800">{label}</span>
                                <span className="block truncate text-[11px] text-slate-400">{note}</span>
                            </span>
                            <ChevronRight size={16} className="text-slate-300" aria-hidden="true" />
                        </Link>
                    ))}
                </div>
            </section>

            {/* Account security */}
            <section>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Account security
                </h3>

                <div className="overflow-hidden rounded-3xl border border-black/[0.05] bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setChangingPassword(true)}
                        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50"
                    >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${A.soft}`}>
                            <KeyRound size={16} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800">Change password</span>
                            <span className="block truncate text-[11px] text-slate-400">
                                Update your account password
                            </span>
                        </span>
                        <ChevronRight size={16} className="text-slate-300" aria-hidden="true" />
                    </button>

                    <button
                        type="button"
                        onClick={() => setChangingEmail(true)}
                        className="flex w-full items-center gap-3 border-t border-slate-100 p-4 text-left transition hover:bg-slate-50"
                    >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${A.soft}`}>
                            <Mail size={16} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800">Change email</span>
                            <span className="block truncate text-[11px] text-slate-400">{me.email}</span>
                        </span>
                        <ChevronRight size={16} className="text-slate-300" aria-hidden="true" />
                    </button>
                </div>
            </section>

            {/* Sign out */}
            <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-3.5 text-sm font-semibold text-rose-600 transition active:scale-[0.99]"
            >
                <LogOut size={16} aria-hidden="true" /> Sign out
            </button>

            {editing && (
                <ProfileSheet
                    profile={profile}
                    email={me.email}
                    onClose={() => setEditing(false)}
                    onDone={() => setEditing(false)}
                />
            )}

            {changingPassword && (
                <ChangePasswordModal
                    userId={me.userId}
                    onClose={() => setChangingPassword(false)}
                />
            )}

            {changingEmail && (
                <ChangeEmailModal
                    userId={me.userId}
                    currentEmail={me.email}
                    onClose={() => setChangingEmail(false)}
                    onEmailChanged={() => {
                        setChangingEmail(false);
                        refreshMe?.();
                    }}
                />
            )}
        </main>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-[11px] font-semibold text-slate-400">{label}</dt>
            <dd className="truncate text-right text-xs text-slate-700">{value}</dd>
        </div>
    );
}
