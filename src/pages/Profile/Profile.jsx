import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import ChangePasswordModal from "./ChangePasswordModal";
import { PushNotificationCard } from "../../push/PushNotificationCard";
import { signOutEverywhere } from "../../session/deviceSession";
import {
    AlertTriangle,
    BadgeCheck,
    Briefcase,
    CalendarDays,
    ChevronRight,
    Clock3,
    GraduationCap,
    KeyRound,
    LogOut,
    Mail,
    MapPin,
    MonitorSmartphone,
    Phone,
    RefreshCw,
    ShieldCheck,
} from "lucide-react";

// ==========================================
// MODULE SCOPE
// ==========================================
// Everything below lives outside the component on purpose:
//  - the purity lint forbids Date.now() inside the component, so the
//    login-time helpers sit here like the dashboard's;
//  - components declared inside Profile would be re-created on every render,
//    which remounts them (the background flickered whenever a modal opened).

const formatLoginDate = (value) => {

    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    // The API now sends UTC instants ("...Z"). Render them in Philippine
    // time explicitly, so the result does not depend on the device's zone.
    return date.toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const formatLoginAgo = (value) => {

    if (!value) return "";

    const then = new Date(value).getTime();

    if (Number.isNaN(then)) return "";

    const minutes = Math.floor((Date.now() - then) / 60000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);

    if (days < 30) return `${days}d ago`;

    return formatLoginDate(value);
};

const getInitials = (name) => {

    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) return "?";

    return (
        parts[0][0] +
        (parts.length > 1 ? parts[parts.length - 1][0] : "")
    ).toUpperCase();
};

const focusRing =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/50";

const REVEAL_CSS = `
    @keyframes profileReveal {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: none; }
    }
    .profile-reveal {
        animation: profileReveal .65s cubic-bezier(.2,.8,.2,1) both;
    }
    @media (prefers-reduced-motion: reduce) {
        .profile-reveal { animation: none; }
    }
`;

// Small reusable pulsing block for skeleton state
function Bone({ className = "" }) {
    return (
        <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
    );
}

// Decorative blurs + grid
function PageBackground() {
    return (
        <>
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="absolute right-[-140px] top-[30%] h-[32rem] w-[32rem] rounded-full bg-cyan-300/10 blur-3xl" />
                <div className="absolute bottom-[-120px] left-[30%] h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />
                <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(16,106,46,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,106,46,.35)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <style>{REVEAL_CSS}</style>
        </>
    );
}

// Shared page frame so the skeleton, the error and the real page line up.
function PageShell({ children, reveal = false }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F7F5EF] p-4 pb-24 md:pt-24">
            <PageBackground />

            <div
                className={`relative z-10 mx-auto max-w-md ${reveal ? "profile-reveal" : ""}`}
            >
                <h1 className="mb-4 pt-4 text-lg font-semibold text-slate-800">
                    My Profile
                </h1>

                {children}
            </div>
        </div>
    );
}

function Card({ title, children, className = "" }) {
    return (
        <section
            className={`mt-4 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm ${className}`}
        >
            {title ? (
                <h3 className="mb-4 text-sm font-semibold text-slate-800">{title}</h3>
            ) : null}

            {children}
        </section>
    );
}

// One labelled value. Replaces six copies of the same block with inline SVGs.
function InfoRow({ icon: Icon, label, value }) {
    const missing = !value;

    return (
        <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#106A2E]">
                <Icon size={16} />
            </div>

            <div className="min-w-0">
                <p className="text-xs text-slate-500">{label}</p>

                <p
                    className={`break-words text-sm ${
                        missing ? "text-slate-400" : "font-medium text-slate-800"
                    }`}
                >
                    {missing ? "Not set" : value}
                </p>
            </div>
        </div>
    );
}

// Profile photo, with an initials fallback instead of a third-party image.
function Avatar({ src, name }) {

    const [failed, setFailed] = useState(false);

    if (src && !failed) {
        return (
            <img
                src={src}
                alt={name || "Profile photo"}
                onError={() => setFailed(true)}
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
            />
        );
    }

    return (
        <div
            role="img"
            aria-label={name || "Profile photo"}
            className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-emerald-100 text-2xl font-semibold text-[#106A2E] shadow-md"
        >
            {getInitials(name)}
        </div>
    );
}

// Shared dialog: role/aria, Escape, backdrop click and scroll lock.
function Modal({ labelledBy, onClose, closeDisabled = false, className = "", children }) {

    useEffect(() => {

        const onKeyDown = (event) => {
            if (event.key === "Escape" && !closeDisabled) onClose();
        };

        const previousOverflow = document.body.style.overflow;

        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };

    }, [onClose, closeDisabled]);

    // Portalled to <body> so `fixed` always means "the screen". Inside the page
    // it was positioned against the animated `.profile-reveal` wrapper (a
    // transformed ancestor), so the dialog opened at the top of the page.
    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !closeDisabled) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                className={`w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ${className}`}
            >
                {children}
            </div>
        </div>,
        document.body
    );
}

function ProfileSkeleton() {
    return (
        <PageShell>
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="h-20 bg-gradient-to-r from-[#106A2E] to-[#0E3B22]" />

                <div className="-mt-12 flex flex-col items-center px-6 pb-6">
                    <Bone className="h-24 w-24 rounded-full border-4 border-white shadow-md" />
                    <Bone className="mt-4 h-5 w-40" />
                    <Bone className="mt-2 h-3.5 w-24" />
                    <Bone className="mt-3 h-6 w-28 rounded-full" />
                </div>
            </div>

            <Card>
                <Bone className="mb-5 h-3.5 w-36" />

                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={`profile-skeleton-row-${i}`} className="flex items-center gap-3">
                            <Bone className="h-9 w-9 shrink-0 rounded-lg" />
                            <div className="flex-1">
                                <Bone className="mb-1.5 h-2.5 w-16" />
                                <Bone className="h-3.5 w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Bone className="mt-4 h-11 w-full rounded-xl" />
            <Bone className="mt-4 h-24 w-full rounded-2xl" />
        </PageShell>
    );
}

export default function Profile() {

    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null);

    // "Log out on all devices" confirmation + in-flight flag.
    const [showEverywhereConfirm, setShowEverywhereConfirm] = useState(false);
    const [everywhereLoading, setEverywhereLoading] = useState(false);

    // Login history modal: device, network address and times per login.
    const [showLogins, setShowLogins] = useState(false);
    const [logins, setLogins] = useState([]);
    const [loginsLoading, setLoginsLoading] = useState(false);
    const [loginsError, setLoginsError] = useState("");

    // "Change password" (student number + email -> OTP) dialog.
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showPhoto, setShowPhoto] = useState(false);

    const mountedRef = useRef(true);

    useEffect(() => {

        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };

    }, []);


    // ==========================================
    // LOAD PROFILE
    // ==========================================

    const loadProfile = useCallback(async (signal) => {

        setLoadingProfile(true);
        setProfileError(null);

        const email = localStorage.getItem("userEmail");

        if (!email) {

            setProfileError({
                message: "We couldn't find your account on this device.",
                needsLogin: true,
            });

            setLoadingProfile(false);

            return;
        }

        try {

            const token =
                localStorage.getItem("token") ||
                localStorage.getItem("authToken");

            const response = await fetch(
                `${API_URL}/api/profile/${encodeURIComponent(email)}`,
                {
                    signal,
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {}
                }
            );

            if (!response.ok) {
                throw new Error("Failed to load profile");
            }

            const data = await response.json();

            if (mountedRef.current) setProfile(data);
        }
        catch (error) {

            // The effect cleanup aborts the request; that is not a failure.
            if (error?.name === "AbortError") return;

            console.error(error);

            if (mountedRef.current) {
                setProfileError({
                    message: "Please check your connection and try again.",
                    needsLogin: false,
                });
            }
        }
        finally {

            if (mountedRef.current && !signal?.aborted) {
                setLoadingProfile(false);
            }
        }

    }, []);

    useEffect(() => {

        const controller = new AbortController();

        loadProfile(controller.signal);

        return () => controller.abort();

    }, [loadProfile]);


    // ==========================================
    // ROLE
    // ==========================================

    const isFaculty =
        profile?.role?.toLowerCase() === "faculty";


    // ==========================================
    // LOGOUT
    // ==========================================

    // Clears this device straight away - no fake "logged out" toast followed
    // by a delayed timer.

    const handleLogout = () => {

        localStorage.clear();

        toast.success("Logged out");

        navigate("/", {
            replace: true
        });
    };


    // ==========================================
    // LOG OUT ON ALL DEVICES
    // ==========================================

    // Destroys the session on every device, this one included: the API
    // kills this token too, so the local session has to go immediately.

    const confirmSignOutEverywhere = async () => {

        setEverywhereLoading(true);

        try {

            const result = await signOutEverywhere();

            if (!result.ok) {
                throw new Error(result.error);
            }

            toast.success(
                "Signed out on all devices"
            );

            setShowEverywhereConfirm(false);

            localStorage.clear();

            navigate("/", {
                replace: true
            });
        }
        catch (error) {

            console.error(error);

            toast.error(
                error.message ||
                "Could not sign out on all devices."
            );
        }
        finally {

            if (mountedRef.current) setEverywhereLoading(false);
        }
    };

    const closeEverywhereConfirm = useCallback(
        () => setShowEverywhereConfirm(false),
        []
    );


    // ==========================================
    // WHERE YOU'RE SIGNED IN
    // ==========================================

    // Device, network address and times of each login. The address is the
    // network the login came from (an IP), not a GPS pin.

    const loadLogins = useCallback(async () => {

        setLoginsLoading(true);
        setLoginsError("");

        try {

            const token =
                localStorage.getItem("token") ||
                localStorage.getItem("authToken");

            const sessionKey =
                localStorage.getItem("oneserve:sessionKey") || "";

            const response = await fetch(
                `${API_URL}/api/auth/session/logins`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                        ...(sessionKey
                            ? { "X-Session-Key": sessionKey }
                            : {}),
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Unable to load your devices.");
            }

            const body = await response.json();

            if (mountedRef.current) {
                setLogins(
                    Array.isArray(body?.logins)
                        ? body.logins
                        : []
                );
            }
        }
        catch (error) {

            console.error(error);

            if (mountedRef.current) {
                setLoginsError(
                    error.message ||
                    "Unable to load your devices."
                );
            }
        }
        finally {

            if (mountedRef.current) setLoginsLoading(false);
        }

    }, []);

    const openLogins = () => {

        setShowLogins(true);
        loadLogins();
    };

    const closeLogins = useCallback(() => setShowLogins(false), []);

    // "Don't recognize a device?" jumps straight to the confirmation.
    const startSignOutEverywhere = () => {

        setShowLogins(false);
        setShowEverywhereConfirm(true);
    };

    // This device first, then the order the API sent them in.
    const sortedLogins = [...logins].sort(
        (a, b) => Number(Boolean(b.isCurrent)) - Number(Boolean(a.isCurrent))
    );

    const hasOtherDevices = logins.some((item) => !item.isCurrent);


    // ==========================================
    // LOADING
    // ==========================================

    if (loadingProfile) {
        return <ProfileSkeleton />;
    }


    // ==========================================
    // COULD NOT LOAD
    // ==========================================

    if (profileError || !profile) {

        return (

            <PageShell>

                <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-sm">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <AlertTriangle size={22} />
                    </div>

                    <h2 className="mt-4 text-base font-semibold text-slate-800">
                        We couldn't load your profile
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {profileError?.message || "Something went wrong."}
                    </p>

                    <div className="mt-5 flex flex-col gap-2">

                        {profileError?.needsLogin ? (

                            <button
                                onClick={() => navigate("/", { replace: true })}
                                className={`w-full rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] p-3 font-semibold text-white transition-all hover:opacity-90 ${focusRing}`}
                            >
                                Go to login
                            </button>

                        ) : (

                            <button
                                onClick={() => loadProfile()}
                                className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] p-3 font-semibold text-white transition-all hover:opacity-90 ${focusRing}`}
                            >
                                <RefreshCw size={15} />
                                Try again
                            </button>

                        )}

                    </div>

                </div>

            </PageShell>

        );

    }


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <PageShell reveal>


            {/* ==========================================
                PROFILE CARD
            ========================================== */}

            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

                {/* Green Header */}

                <div className="h-20 bg-gradient-to-r from-[#106A2E] to-[#0E3B22]" />

                <div className="-mt-12 flex flex-col items-center px-6 pb-6">

                    <button
                        type="button"
                        onClick={() => {
                            if (profile.profilePicture) setShowPhoto(true);
                        }}
                        className="rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        aria-label="View profile photo"
                    >
                        <Avatar
                            src={
                                profile.profilePicture
                                    ? `${API_URL}${profile.profilePicture}`
                                    : ""
                            }
                            name={profile.fullName}
                        />
                    </button>

                    <h2 className="mt-3 break-words text-center text-xl font-semibold text-slate-800">
                        {profile.fullName}
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                        {profile.idNumber || "No ID number"}
                    </p>

                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-[#106A2E]">
                        <BadgeCheck size={13} />
                        {isFaculty ? "Faculty" : "Student"}
                    </span>

                </div>

            </div>


            {/* ==========================================
                SCHOOL INFO
            ========================================== */}

            <Card title="School info">

                <div className="space-y-4">

                    {isFaculty ? (
                        <>
                            <InfoRow
                                icon={GraduationCap}
                                label="Institute"
                                value={profile.institute}
                            />

                            <InfoRow
                                icon={Briefcase}
                                label="Position"
                                value={profile.position}
                            />
                        </>
                    ) : (
                        <>
                            <InfoRow
                                icon={GraduationCap}
                                label="Program"
                                value={profile.course}
                            />

                            <InfoRow
                                icon={CalendarDays}
                                label="Year level"
                                value={profile.yearLevel}
                            />

                            <InfoRow
                                icon={BadgeCheck}
                                label="Status"
                                value={profile.studentStatus}
                            />
                        </>
                    )}

                </div>

            </Card>


            {/* ==========================================
                CONTACT
            ========================================== */}

            <Card title="Contact">

                <div className="space-y-4">

                    <InfoRow
                        icon={Mail}
                        label="Email"
                        value={profile.email}
                    />

                    <InfoRow
                        icon={Phone}
                        label="Phone number"
                        value={profile.contactNumber}
                    />

                </div>

            </Card>


            {/* ==========================================
                PUSH NOTIFICATIONS
            ========================================== */}

            <PushNotificationCard />


            {/* ==========================================
                EDIT PROFILE - the one main action
            ========================================== */}

            <button
                onClick={() => navigate("/edit-profile")}
                className={`mt-4 w-full rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] p-3 font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:opacity-90 active:scale-[0.98] ${focusRing}`}
            >
                Edit Profile
            </button>


            {/* ==========================================
                ACCOUNT SECURITY
            ========================================== */}

            <section className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

                <div className="flex items-center gap-2 px-6 pb-2 pt-5">
                    <ShieldCheck size={16} className="text-[#106A2E]" />
                    <h3 className="text-sm font-semibold text-slate-800">
                        Account security
                    </h3>
                </div>

                <div className="divide-y divide-slate-100">

                    <button
                        onClick={() => setShowChangePassword(true)}
                        className={`flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-slate-50 ${focusRing}`}
                    >

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#106A2E]">
                            <KeyRound size={16} />
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800">
                                Change password
                            </span>
                            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                                {profile?.mustChangePassword
                                    ? "You're still using the password we gave you — change it now."
                                    : "Verify your student number and email, then set a new password."}
                            </span>
                        </span>

                        <ChevronRight size={16} className="shrink-0 text-slate-400" />

                    </button>

                    <button
                        onClick={openLogins}
                        disabled={everywhereLoading || loginsLoading}
                        className={`flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-slate-50 disabled:opacity-70 ${focusRing}`}
                    >

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <MonitorSmartphone size={16} />
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800">
                                {loginsLoading
                                    ? "Loading..."
                                    : "Where you're signed in"}
                            </span>
                            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                                See the phones, tablets and browsers logged in to your account.
                            </span>
                        </span>

                        <ChevronRight size={16} className="shrink-0 text-slate-400" />

                    </button>

                    <button
                        onClick={() => setShowEverywhereConfirm(true)}
                        disabled={everywhereLoading}
                        className={`flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-red-50 disabled:opacity-70 ${focusRing}`}
                    >

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                            <LogOut size={16} />
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-red-600">
                                {everywhereLoading
                                    ? "Signing out everywhere..."
                                    : "Log out on all devices"}
                            </span>
                            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                                Signs you out everywhere, including this device.
                            </span>
                        </span>

                    </button>

                </div>

            </section>


            {/* ==========================================
                LOGOUT
            ========================================== */}

            <button
                onClick={handleLogout}
                disabled={everywhereLoading}
                className={`mt-4 w-full rounded-xl border border-red-200 bg-white p-3 font-semibold text-red-600 transition-all hover:bg-red-50 disabled:opacity-70 ${focusRing}`}
            >
                Log out
            </button>


            {/* ==========================================
                LOG OUT EVERYWHERE CONFIRMATION
            ========================================== */}

            {showEverywhereConfirm && (

                <Modal
                    labelledBy="everywhere-title"
                    onClose={closeEverywhereConfirm}
                    closeDisabled={everywhereLoading}
                >

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
                        <AlertTriangle size={22} />
                    </div>

                    <h2
                        id="everywhere-title"
                        className="mt-4 text-center text-lg font-semibold text-slate-900"
                    >
                        Log out on all devices?
                    </h2>

                    <p className="mt-2 text-center text-sm leading-6 text-slate-500">
                        You'll be signed out on every phone, tablet and browser,
                        {" "}<strong>including this one</strong>. You'll need to
                        log in again everywhere.
                    </p>

                    <div className="mt-6 flex flex-col gap-2">

                        <button
                            onClick={confirmSignOutEverywhere}
                            disabled={everywhereLoading}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 p-3 font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-70 ${focusRing}`}
                        >

                            <LogOut size={16} />

                            {everywhereLoading
                                ? "Signing out..."
                                : "Log out everywhere"}

                        </button>

                        {/* Focused first so a stray Enter cancels instead of logging everyone out. */}
                        <button
                            autoFocus
                            onClick={closeEverywhereConfirm}
                            disabled={everywhereLoading}
                            className={`w-full rounded-xl border border-slate-200 bg-white p-3 font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-70 ${focusRing}`}
                        >
                            Cancel
                        </button>

                    </div>

                </Modal>

            )}


            {/* ==========================================
                WHERE YOU'RE SIGNED IN
            ========================================== */}

            {showLogins && (

                <Modal
                    labelledBy="logins-title"
                    onClose={closeLogins}
                    className="flex max-h-[85vh] flex-col"
                >

                    <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#106A2E]">
                        <MonitorSmartphone size={22} />
                    </div>

                    <h2
                        id="logins-title"
                        className="mt-4 text-center text-lg font-semibold text-slate-900"
                    >
                        Where you're signed in
                    </h2>

                    <p className="mt-1 text-center text-xs leading-5 text-slate-500">
                        Devices logged in to your account. The IP address is the
                        network a device connected from, not its exact location.
                    </p>

                    <div className="mt-4 min-h-0 flex-1 overflow-y-auto">

                        {loginsLoading ? (

                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <Bone className="h-10 w-10 shrink-0 rounded-xl" />
                                        <div className="flex-1">
                                            <Bone className="h-3.5 w-2/3" />
                                            <Bone className="mt-1.5 h-2.5 w-1/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                        ) : loginsError ? (

                            <div className="py-6 text-center">

                                <p className="text-sm text-slate-500">
                                    {loginsError}
                                </p>

                                <button
                                    onClick={loadLogins}
                                    className={`mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 ${focusRing}`}
                                >
                                    <RefreshCw size={14} />
                                    Try again
                                </button>

                            </div>

                        ) : sortedLogins.length === 0 ? (

                            <p className="py-8 text-center text-sm text-slate-500">
                                No devices found.
                            </p>

                        ) : (

                            <ul className="divide-y divide-slate-100">
                                {sortedLogins.map((item, index) => (
                                    <li
                                        key={`${item.loggedInAt}-${index}`}
                                        className="flex items-start gap-3 py-3"
                                    >
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                item.isCurrent
                                                    ? "bg-emerald-50 text-[#106A2E]"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            <MonitorSmartphone size={17} />
                                        </span>

                                        <div className="min-w-0 flex-1">

                                            <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-800">
                                                <span className="break-words">
                                                    {item.device || "Unknown device"}
                                                </span>

                                                {item.isCurrent && (
                                                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                        This device
                                                    </span>
                                                )}
                                            </p>

                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                                <Clock3 size={12} className="shrink-0" />
                                                <span>
                                                    Signed in {formatLoginDate(item.loggedInAt)}
                                                </span>
                                            </p>

                                            {item.lastSeenAt && item.lastSeenAt !== item.loggedInAt ? (
                                                <p className="mt-0.5 pl-[18px] text-xs text-slate-500">
                                                    Last active {formatLoginAgo(item.lastSeenAt)}
                                                </p>
                                            ) : null}

                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                                <MapPin size={12} className="shrink-0" />
                                                <span className="break-all">
                                                    IP address: {item.ipAddress || "unavailable"}
                                                </span>
                                            </p>

                                        </div>
                                    </li>
                                ))}
                            </ul>

                        )}

                    </div>

                    {!loginsLoading && !loginsError && hasOtherDevices ? (

                        <p className="mt-3 shrink-0 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                            Don't recognize a device?{" "}
                            <button
                                onClick={startSignOutEverywhere}
                                className={`font-semibold text-red-600 underline underline-offset-2 hover:text-red-700 ${focusRing}`}
                            >
                                Log out on all devices
                            </button>
                        </p>

                    ) : null}

                    <button
                        autoFocus
                        onClick={closeLogins}
                        className={`mt-4 w-full shrink-0 rounded-xl border border-slate-200 bg-white p-3 font-semibold text-slate-600 transition-all hover:bg-slate-50 ${focusRing}`}
                    >
                        Close
                    </button>

                </Modal>

            )}


            {showChangePassword && (
                <ChangePasswordModal
                    idNumber={profile?.idNumber || ""}
                    email={profile?.email || ""}
                    onClose={() => setShowChangePassword(false)}
                    onSuccess={() =>
                        setProfile((previous) =>
                            previous
                                ? { ...previous, mustChangePassword: false }
                                : previous
                        )
                    }
                />
            )}


            {showPhoto && profile?.profilePicture && (
                <Modal labelledBy="photo-title" onClose={() => setShowPhoto(false)}>
                    <h2 id="photo-title" className="sr-only">
                        Profile photo
                    </h2>
                    <div className="flex items-center justify-center">
                        <img
                            src={`${API_URL}${profile.profilePicture}`}
                            alt={profile.fullName || "Profile photo"}
                            className="max-h-[70vh] w-auto rounded-2xl object-contain"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowPhoto(false)}
                        className="mt-4 w-full rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    >
                        Close
                    </button>
                </Modal>
            )}

        </PageShell>

    );

}