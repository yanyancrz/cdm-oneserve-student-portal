import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import { PushNotificationCard } from "../../push/PushNotificationCard";
import { signOutEverywhere } from "../../session/deviceSession";
import {
    AlertTriangle,
    Clock3,
    LogOut,
    MapPin,
    MonitorSmartphone,
} from "lucide-react";

// Module scope on purpose: the purity lint forbids Date.now() inside the
// component, so the login-time helpers live out here like the dashboard's.

const formatLoginDate = (value) => {

    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString(undefined, {
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

export default function Profile() {

    const navigate = useNavigate();

    const [student, setStudent] = useState(null);

    const [logoutLoading, setLogoutLoading] = useState(false);

    // "Log out on all devices" confirmation + in-flight flag.
    const [showEverywhereConfirm, setShowEverywhereConfirm] = useState(false);
    const [everywhereLoading, setEverywhereLoading] = useState(false);

    // Login history modal: device, network address and times per login.
    const [showLogins, setShowLogins] = useState(false);
    const [logins, setLogins] = useState([]);
    const [loginsLoading, setLoginsLoading] = useState(false);


    // ==========================================
    // LOAD PROFILE
    // ==========================================

    useEffect(() => {

        const loadProfile = async () => {

            try {

                const email =
                    localStorage.getItem("userEmail");

                if (!email) {
                    toast.error("User email not found.");
                    return;
                }

                const response =
                    await fetch(
                        `${API_URL}/api/profile/${encodeURIComponent(email)}`
                    );


                if (!response.ok) {

                    throw new Error(
                        "Failed to load profile"
                    );

                }


                const data =
                    await response.json();


                setStudent(data);

            }
            catch (error) {

                console.error(error);

                toast.error(
                    "Unable to load profile."
                );

            }

        };


        loadProfile();

    }, []);


    // ==========================================
    // ROLE
    // ==========================================

    const isFaculty =
        student?.role?.toLowerCase() === "faculty";


    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {

        setLogoutLoading(true);


        toast.success(
            "Logged out successfully"
        );


        setTimeout(() => {

            localStorage.clear();

            navigate("/", {
                replace: true
            });

        }, 1000);

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

            setEverywhereLoading(false);
        }
    };


    // ==========================================
    // RECENT LOGINS
    // ==========================================

    // Device, network address and times of each login. The address is the
    // network the login came from (an IP), not a GPS pin.

    const openLogins = async () => {

        setShowLogins(true);
        setLoginsLoading(true);

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
                throw new Error("Unable to load recent logins.");
            }

            const body = await response.json();

            setLogins(
                Array.isArray(body?.logins)
                    ? body.logins
                    : []
            );
        }
        catch (error) {

            console.error(error);

            toast.error(
                error.message ||
                "Unable to load recent logins."
            );
        }
        finally {

            setLoginsLoading(false);
        }
    };

    // Login history modal: device, network address and times per login.
    // Formatting helpers are module scope (above), next to the imports.
    // Small reusable pulsing block for skeleton state
    const Bone = ({ className = "" }) => (
        <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />
    );


    // ==========================================
    // SHARED BACKGROUND (decorative blurs + grid)
    // ==========================================

    const PageBackground = () => (
        <>
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="absolute right-[-140px] top-[30%] h-[32rem] w-[32rem] rounded-full bg-cyan-300/10 blur-3xl" />
                <div className="absolute bottom-[-120px] left-[30%] h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />
                <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(16,106,46,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,106,46,.35)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <style>{`
                @keyframes profileReveal {
                    from {
                        opacity: 0;
                        transform: translateY(15px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .profile-reveal {
                    animation: profileReveal .65s cubic-bezier(.2,.8,.2,1) both;
                }
            `}</style>
        </>
    );


    // ==========================================
    // LOADING — skeleton shaped like the real profile page
    // ==========================================

    if (!student) {

        return (

            <div
                className="
                    relative
                    min-h-screen
                    overflow-hidden
                    bg-[#F7F5EF]
                    p-4
                    pb-24
                    md:pt-24
                "
            >

                <PageBackground />

                <div
                    className="
                        max-w-md
                        mx-auto
                        relative
                        z-10
                    "
                >

                    {/* PAGE TITLE */}

                    <h1
                        className="
                            text-lg
                            font-semibold
                            text-slate-800
                            pt-4
                            mb-4
                        "
                    >
                        My Profile
                    </h1>

                    {/* PROFILE CARD */}

                    <div
                        className="
                            bg-white
                            rounded-[24px]
                            shadow-sm
                            border
                            border-slate-200
                            overflow-hidden
                        "
                    >

                        {/* Green Header */}

                        <div
                            className="
                                h-20
                                bg-gradient-to-r
                                from-[#106A2E]
                                to-[#0E3B22]
                            "
                        />

                        <div
                            className="
                                flex
                                flex-col
                                items-center
                                -mt-12
                                px-6
                                pb-6
                            "
                        >

                            <Bone className="w-24 h-24 rounded-full border-4 border-white shadow-md !bg-slate-200" />

                            <Bone className="h-5 w-40 mt-4" />

                            <Bone className="h-3.5 w-24 mt-2" />

                            <Bone className="h-6 w-28 rounded-full mt-3" />

                        </div>

                    </div>

                    {/* DETAILS */}

                    <div
                        className="
                            bg-white
                            rounded-[24px]
                            shadow-sm
                            border
                            border-slate-200
                            p-6
                            mt-4
                        "
                    >

                        <Bone className="h-3.5 w-36 mb-5" />

                        <div className="space-y-4">

                            {
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={`profile-skeleton-row-${i}`} className="flex items-center gap-3">
                                        <Bone className="w-9 h-9 rounded-lg flex-shrink-0" />
                                        <div className="flex-1">
                                            <Bone className="h-2.5 w-16 mb-1.5" />
                                            <Bone className="h-3.5 w-32" />
                                        </div>
                                    </div>
                                ))
                            }

                        </div>

                    </div>

                    {/* BUTTONS */}

                    <Bone className="h-11 w-full rounded-xl mt-4" />

                    <Bone className="h-11 w-full rounded-xl mt-4" />

                </div>

            </div>

        );

    }


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <div
            className="
                relative
                min-h-screen
                overflow-hidden
                bg-[#F7F5EF]
                p-4
                pb-24
                md:pt-24
            "
        >

            <PageBackground />


            <div
                className="
                    profile-reveal
                    max-w-md
                    mx-auto
                    relative
                    z-10
                "
            >


                {/* ==========================================
                    PAGE TITLE
                ========================================== */}

                <h1
                    className="
                        text-lg
                        font-semibold
                        text-slate-800
                        pt-4
                        mb-4
                    "
                >
                    My Profile
                </h1>


                {/* ==========================================
                    PROFILE CARD
                ========================================== */}

                <div
                    className="
                        bg-white
                        rounded-[24px]
                        shadow-sm
                        border
                        border-slate-200
                        overflow-hidden
                    "
                >

                    {/* Green Header */}

                    <div
                        className="
                            h-20
                            bg-gradient-to-r
                            from-[#106A2E]
                            to-[#0E3B22]
                        "
                    />


                    {/* Profile Information */}

                    <div
                        className="
                            flex
                            flex-col
                            items-center
                            -mt-12
                            px-6
                            pb-6
                        "
                    >

                        {/* PROFILE PICTURE */}

                        <img
                            src={
                                student.profilePicture
                                    ? `${API_URL}${student.profilePicture}`
                                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                            }
                            alt={student.fullName}
                            className="
                                w-24
                                h-24
                                rounded-full
                                object-cover
                                border-4
                                border-white
                                shadow-md
                            "
                        />


                        {/* FULL NAME */}

                        <h2
                            className="
                                text-xl
                                font-semibold
                                text-slate-800
                                mt-3
                            "
                        >
                            {student.fullName}
                        </h2>


                        {/* ID NUMBER */}

                        <p
                            className="
                                text-sm
                                text-slate-400
                                mt-0.5
                            "
                        >
                            {student.idNumber || "No ID Number"}
                        </p>


                        {/* ROLE STATUS */}

                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                bg-emerald-50
                                text-[#106A2E]
                                text-xs
                                font-medium
                                px-3
                                py-1
                                rounded-full
                                mt-3
                            "
                        >

                            <span
                                className="
                                    w-1.5
                                    h-1.5
                                    rounded-full
                                    bg-emerald-500
                                "
                            />

                            {isFaculty
                                ? "Active Faculty"
                                : "Active Student"}

                        </span>

                    </div>

                </div>


                {/* ==========================================
                    DETAILS
                ========================================== */}

                <div
                    className="
                        bg-white
                        rounded-[24px]
                        shadow-sm
                        border
                        border-slate-200
                        p-6
                        mt-4
                    "
                >


                    {/* SECTION TITLE */}

                    <h3
                        className="
                            text-sm
                            font-semibold
                            text-slate-800
                            mb-4
                        "
                    >
                        {isFaculty
                            ? "Faculty Information"
                            : "Student Information"}
                    </h3>


                    <div className="space-y-4">


                        {/* ==========================================
                            EMAIL
                        ========================================== */}

                        <div
                            className="
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <div
                                className="
                                    w-9
                                    h-9
                                    rounded-lg
                                    bg-emerald-50
                                    flex
                                    items-center
                                    justify-center
                                    flex-shrink-0
                                "
                            >

                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#106A2E"
                                    strokeWidth="2"
                                >

                                    <rect
                                        x="2"
                                        y="4"
                                        width="20"
                                        height="16"
                                        rx="2"
                                    />

                                    <path
                                        d="m22 7-10 6L2 7"
                                    />

                                </svg>

                            </div>


                            <div>

                                <p className="text-xs text-slate-400">
                                    Email
                                </p>

                                <p
                                    className="
                                        text-sm
                                        font-medium
                                        text-slate-800
                                    "
                                >
                                    {student.email || "Not Set"}
                                </p>

                            </div>

                        </div>


                        {/* ==========================================
                            FACULTY → INSTITUTE
                            STUDENT → PROGRAM
                        ========================================== */}

                        <div
                            className="
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <div
                                className="
                                    w-9
                                    h-9
                                    rounded-lg
                                    bg-emerald-50
                                    flex
                                    items-center
                                    justify-center
                                    flex-shrink-0
                                "
                            >

                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#106A2E"
                                    strokeWidth="2"
                                >

                                    <path d="M22 10v6" />

                                    <path
                                        d="
                                            M2 10
                                            l10-5
                                            10 5
                                            -10 5
                                            z
                                        "
                                    />

                                    <path
                                        d="
                                            M6 12
                                            v5
                                            c3 3
                                            9 3
                                            12 0
                                            v-5
                                        "
                                    />

                                </svg>

                            </div>


                            <div>

                                <p className="text-xs text-slate-400">
                                    {isFaculty
                                        ? "Institute"
                                        : "Program"}
                                </p>


                                <p
                                    className="
                                        text-sm
                                        font-medium
                                        text-slate-800
                                    "
                                >

                                    {isFaculty
                                        ? (
                                            student.institute ||
                                            "Not Set"
                                        )
                                        : (
                                            student.course ||
                                            "Not Set"
                                        )}

                                </p>

                            </div>

                        </div>


                        {/* ==========================================
                            STUDENT ONLY → YEAR LEVEL
                        ========================================== */}

                        {!isFaculty && (

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >

                                <div
                                    className="
                                        w-9
                                        h-9
                                        rounded-lg
                                        bg-emerald-50
                                        flex
                                        items-center
                                        justify-center
                                        flex-shrink-0
                                    "
                                >

                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#106A2E"
                                        strokeWidth="2"
                                    >

                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="18"
                                            rx="2"
                                        />

                                        <path
                                            d="
                                                M16 2v4
                                                M8 2v4
                                                M3 10h18
                                            "
                                        />

                                    </svg>

                                </div>


                                <div>

                                    <p className="text-xs text-slate-400">
                                        Year Level
                                    </p>


                                    <p
                                        className="
                                            text-sm
                                            font-medium
                                            text-slate-800
                                        "
                                    >
                                        {student.yearLevel ||
                                            "Not Set"}
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* ==========================================
                            STUDENT ONLY → STUDENT STATUS
                        ========================================== */}

                        {!isFaculty && (

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >

                                <div
                                    className="
                                        w-9
                                        h-9
                                        rounded-lg
                                        bg-emerald-50
                                        flex
                                        items-center
                                        justify-center
                                        flex-shrink-0
                                    "
                                >

                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#106A2E"
                                        strokeWidth="2"
                                    >

                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                        />

                                        <path
                                            d="m8 12 2.5 2.5L16 9"
                                        />

                                    </svg>

                                </div>


                                <div>

                                    <p className="text-xs text-slate-400">
                                        Student Status
                                    </p>


                                    <p
                                        className="
                                            text-sm
                                            font-medium
                                            text-slate-800
                                        "
                                    >
                                        {student.studentStatus ||
                                            "Not Set"}
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* ==========================================
                            FACULTY ONLY → FACULTY POSITION
                        ========================================== */}

                        {isFaculty && (

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >

                                <div
                                    className="
                                        w-9
                                        h-9
                                        rounded-lg
                                        bg-emerald-50
                                        flex
                                        items-center
                                        justify-center
                                        flex-shrink-0
                                    "
                                >

                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#106A2E"
                                        strokeWidth="2"
                                    >

                                        <path
                                            d="
                                                M20 7
                                                h-4
                                                V5
                                                a2 2 0 0 0-2-2
                                                h-4
                                                a2 2 0 0 0-2 2
                                                v2
                                                H4
                                                a2 2 0 0 0-2 2
                                                v9
                                                a2 2 0 0 0 2 2
                                                h16
                                                a2 2 0 0 0 2-2
                                                V9
                                                a2 2 0 0 0-2-2Z
                                            "
                                        />

                                        <path
                                            d="
                                                M8 7
                                                V5
                                                h8
                                                v2
                                            "
                                        />

                                        <path
                                            d="
                                                M12 12
                                                v4
                                            "
                                        />

                                    </svg>

                                </div>


                                <div>

                                    <p className="text-xs text-slate-400">
                                        Faculty Position
                                    </p>


                                    <p
                                        className="
                                            text-sm
                                            font-medium
                                            text-slate-800
                                        "
                                    >
                                        {student.position ||
                                            "Not Set"}
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* ==========================================
                            CONTACT NUMBER
                        ========================================== */}

                        <div
                            className="
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <div
                                className="
                                    w-9
                                    h-9
                                    rounded-lg
                                    bg-emerald-50
                                    flex
                                    items-center
                                    justify-center
                                    flex-shrink-0
                                "
                            >

                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#106A2E"
                                    strokeWidth="2"
                                >

                                    <path
                                        d="
                                            M22 16.92
                                            v3
                                            a2 2 0 0 1-2.18 2
                                            19.79 19.79 0 0 1-8.63-3.07
                                            19.5 19.5 0 0 1-6-6
                                            A19.79 19.79 0 0 1 2.08 4.18
                                            2 2 0 0 1 4.06 2
                                            h3
                                            a2 2 0 0 1 2 1.72
                                        "
                                    />

                                </svg>

                            </div>


                            <div>

                                <p className="text-xs text-slate-400">
                                    Contact Number
                                </p>


                                <p
                                    className="
                                        text-sm
                                        font-medium
                                        text-slate-800
                                    "
                                >
                                    {student.contactNumber ||
                                        "Not Set"}
                                </p>

                            </div>

                        </div>


                    </div>

                </div>


                {/* ==========================================
                    PUSH NOTIFICATIONS
                    ========================================== */}

                <PushNotificationCard />


                {/* ==========================================
                    EDIT PROFILE BUTTON
                ========================================== */}

                <button
                    onClick={() =>
                        navigate("/edit-profile")
                    }
                    className="
                        w-full
                        mt-4
                        bg-gradient-to-br
                        from-[#106A2E]
                        to-[#0E3B22]
                        hover:opacity-90
                        active:scale-[0.98]
                        text-white
                        p-3
                        rounded-xl
                        font-semibold
                        transition-all
                        shadow-lg
                        shadow-emerald-900/20
                    "
                >
                    Edit Profile
                </button>


                {/* ==========================================
                    LOGOUT
                ========================================== */}

                <button
                    onClick={handleLogout}
                    disabled={logoutLoading || everywhereLoading}
                    className="
                        w-full
                        mt-4
                        bg-white
                        hover:bg-red-50
                        text-red-600
                        border
                        border-red-200
                        p-3
                        rounded-xl
                        font-semibold
                        transition-all
                        disabled:opacity-70
                    "
                >

                    {logoutLoading
                        ? "Logging Out..."
                        : "Logout"}

                </button>


                {/* ==========================================
                    LOG OUT ON ALL DEVICES
                ========================================== */}

                <button
                    onClick={() => setShowEverywhereConfirm(true)}
                    disabled={logoutLoading || everywhereLoading}
                    className="
                        w-full
                        mt-3
                        bg-white
                        hover:bg-slate-50
                        text-slate-700
                        border
                        border-slate-200
                        p-3
                        rounded-xl
                        font-semibold
                        transition-all
                        disabled:opacity-70
                    "
                >

                    {everywhereLoading
                        ? "Signing Out Everywhere..."
                        : "Log Out on All Devices"}

                </button>

                <p className="mt-2 text-center text-xs text-slate-400">
                    Ends the session on every phone, tablet and browser
                    signed in to this account, including this one.
                </p>


                {/* ==========================================
                    RECENT LOGINS
                ========================================== */}

                <button
                    onClick={openLogins}
                    disabled={logoutLoading || everywhereLoading || loginsLoading}
                    className="
                        w-full
                        mt-3
                        flex
                        items-center
                        justify-center
                        gap-2
                        bg-white
                        hover:bg-slate-50
                        text-slate-700
                        border
                        border-slate-200
                        p-3
                        rounded-xl
                        font-semibold
                        transition-all
                        disabled:opacity-70
                    "
                >

                    <MonitorSmartphone size={16} />

                    {loginsLoading
                        ? "Loading Logins..."
                        : "Recent Logins"}

                </button>

                <p className="mt-2 text-center text-xs text-slate-400">
                    See every device signed in to this account, with its
                    network address and login time.
                </p>


            </div>


            {/* ==========================================
                LOG OUT EVERYWHERE CONFIRMATION
            ========================================== */}

            {showEverywhereConfirm && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
                            <AlertTriangle size={22} />
                        </div>

                        <h2 className="mt-4 text-center text-lg font-semibold text-slate-900">
                            Log out on all devices?
                        </h2>

                        <p className="mt-2 text-center text-sm leading-6 text-slate-500">
                            Every phone, tablet and browser signed in to this
                            account will be signed out, <strong>including
                            this one</strong>. You will need to log in again
                            everywhere.
                        </p>

                        <div className="mt-6 flex flex-col gap-2">

                            <button
                                onClick={confirmSignOutEverywhere}
                                disabled={everywhereLoading}
                                className="
                                    w-full
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    bg-red-600
                                    hover:bg-red-700
                                    text-white
                                    p-3
                                    rounded-xl
                                    font-semibold
                                    transition-all
                                    disabled:opacity-70
                                "
                            >

                                <LogOut size={16} />

                                {everywhereLoading
                                    ? "Signing Out..."
                                    : "Log Out Everywhere"}

                            </button>

                            <button
                                onClick={() => setShowEverywhereConfirm(false)}
                                disabled={everywhereLoading}
                                className="
                                    w-full
                                    bg-white
                                    hover:bg-slate-50
                                    text-slate-600
                                    border
                                    border-slate-200
                                    p-3
                                    rounded-xl
                                    font-semibold
                                    transition-all
                                    disabled:opacity-70
                                "
                            >

                                Cancel

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* ==========================================
                RECENT LOGINS
            ========================================== */}

            {showLogins && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

                    <div className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl bg-white p-6 shadow-xl">

                        <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#106A2E]">
                            <MonitorSmartphone size={22} />
                        </div>

                        <h2 className="mt-4 text-center text-lg font-semibold text-slate-900">
                            Recent Logins
                        </h2>

                        <p className="mt-1 text-center text-xs leading-5 text-slate-500">
                            Every device signed in to this account. The address
                            is the network it connected from, not a GPS location.
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
                            ) : logins.length === 0 ? (
                                <p className="py-8 text-center text-sm text-slate-400">
                                    No recent logins found.
                                </p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {logins.map((item, index) => (
                                        <li
                                            key={`${item.loggedInAt}-${index}`}
                                            className="flex items-start gap-3 py-3"
                                        >
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                                <MonitorSmartphone size={17} />
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-800">
                                                    <span className="truncate">
                                                        {item.device || "Unknown device"}
                                                    </span>

                                                    {item.isCurrent && (
                                                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                                                            This device
                                                        </span>
                                                    )}
                                                </p>

                                                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                                    <MapPin size={11} className="shrink-0" />
                                                    <span className="truncate">
                                                        {item.ipAddress || "Address unavailable"}
                                                    </span>
                                                </p>

                                                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                                    <Clock3 size={11} className="shrink-0" />
                                                    <span>
                                                        {formatLoginDate(item.loggedInAt)}
                                                        {item.lastSeenAt && item.lastSeenAt !== item.loggedInAt
                                                            ? ` · seen ${formatLoginAgo(item.lastSeenAt)}`
                                                            : ""}
                                                    </span>
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <button
                            onClick={() => setShowLogins(false)}
                            className="
                                mt-4
                                w-full
                                shrink-0
                                bg-white
                                hover:bg-slate-50
                                text-slate-600
                                border
                                border-slate-200
                                p-3
                                rounded-xl
                                font-semibold
                                transition-all
                            "
                        >

                            Close

                        </button>

                    </div>

                </div>

            )}


        </div>

    );

}