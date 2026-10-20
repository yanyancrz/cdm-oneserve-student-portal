import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import DeviceSessionWarning from "../../components/AccountSecurity/DeviceSessionWarning";
import AIAssistant from "../../components/AIAssistant/AIAssistant";
import EventCalendar from "../../components/EventCalendar/EventCalendar";
import toast from "react-hot-toast";

// Loading placeholders. Purely presentational,
// so they live at module level - defining them
// inside the component would reset their state
// on every render.
const Bone = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`}
    />
);

const BoneOnDark = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded-lg bg-white/15 ${className}`}
    />
);

export default function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [search, setSearch] = useState("");

    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] =
        useState(true);

    const [announcementIndex, setAnnouncementIndex] =
        useState(0);

    const [isAnnouncementPaused, setIsAnnouncementPaused] =
        useState(false);

    const touchStartX = useRef(null);

    useEffect(() => {
        const email =
            localStorage.getItem("userEmail");

        if (!email) {
            navigate("/");
            return;
        }

        const loadProfile = async () => {
            try {
                const token =
                    localStorage.getItem("token") ||
                    localStorage.getItem("authToken");

                const response = await fetch(
                    `${API_URL}/api/profile/${encodeURIComponent(
                        email
                    )}`,
                    {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {}
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Unable to load profile."
                    );
                }

                const data =
                    await response.json();

                setUser(data);
            } catch (error) {
                console.error(error);

                toast.error(
                    "Unable to load your profile."
                );
            }
        };

        loadProfile();
    }, [navigate]);

    useEffect(() => {
        const loadAnnouncements = async () => {
            try {
                setAnnouncementsLoading(true);

                const response = await fetch(
                    `${API_URL}/api/announcements`
                );

                if (!response.ok) {
                    throw new Error(
                        "Unable to load announcements."
                    );
                }

                const data =
                    await response.json();

                const normalized =
                    Array.isArray(data)
                        ? data
                        : [];

                setAnnouncements(
                    normalized
                );

                setAnnouncementIndex(0);
            } catch (error) {
                console.error(
                    "Announcements error:",
                    error
                );

                setAnnouncements([]);
            } finally {
                setAnnouncementsLoading(false);
            }
        };

        loadAnnouncements();
    }, []);

    const isLoading = !user;

    const userName =
        user?.fullName ||
        localStorage.getItem("userName") ||
        "User";

    const todayLabel =
        new Date().toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );

    const userRole =
        user?.role ||
        localStorage.getItem("role") ||
        localStorage.getItem("userRole") ||
        "Student";

    const isStudent =
        userRole.toLowerCase() === "student";

    const services = [
        {
            key: "library",
            title: "Library",
            subtitle: "Books & resources",
            route: "/library",
            accent: "#173F2C",
            glow: "rgba(16,106,46,.16)",
            icon: (
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            )
        },

        {
            key: "clinic",
            title: "Clinic",
            subtitle: "Health services",
            route: "/clinic",
            accent: "#E4574C",
            glow: "rgba(228,87,76,.14)",
            icon: (
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
            )
        },

        {
            key: "lost-found",
            title: "Lost & Found",
            subtitle: "Report items",
            route: "/lost-found",
            accent: "#7C6CE0",
            glow: "rgba(124,108,224,.14)",
            icon: (
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="3"
                    />
                    <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
                </svg>
            )
        },

        {
            key: "guidance",
            title: "Guidance",
            subtitle: "Counseling support",
            route: "/guidance",
            accent: "#D9578F",
            glow: "rgba(217,87,143,.14)",
            icon: (
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21l8.84-8.61a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            )
        }
    ];

    const filteredServices =
        services.filter((service) =>
            `${service.title} ${service.subtitle}`
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                )
        );

    const fallbackAnnouncement = {
        id: "empty-announcement",
        title: "No announcements yet",
        message:
            "There are currently no active campus announcements.",
        tag: "CAMPUS",
        accent: "#F4D35E"
    };

    const currentAnnouncement =
        announcements.length > 0
            ? announcements[
                  Math.min(
                      announcementIndex,
                      announcements.length - 1
                  )
              ]
            : fallbackAnnouncement;

    const goToNextAnnouncement = () => {
        if (announcements.length <= 1) {
            return;
        }

        setAnnouncementIndex(
            (previous) =>
                (previous + 1) %
                announcements.length
        );
    };

    const goToPreviousAnnouncement = () => {
        if (announcements.length <= 1) {
            return;
        }

        setAnnouncementIndex(
            (previous) =>
                (previous - 1 +
                    announcements.length) %
                announcements.length
        );
    };

    useEffect(() => {
        if (
            announcementsLoading ||
            isAnnouncementPaused ||
            announcements.length <= 1
        ) {
            return;
        }

        const timer =
            setInterval(() => {
                setAnnouncementIndex(
                    (previous) =>
                        (previous + 1) %
                        announcements.length
                );
            }, 6000);

        return () =>
            clearInterval(timer);
    }, [
        announcementsLoading,
        isAnnouncementPaused,
        announcements.length
    ]);

    const handleAnnouncementTouchStart = (
        event
    ) => {
        touchStartX.current =
            event.touches[0].clientX;

        setIsAnnouncementPaused(true);
    };

    const handleAnnouncementTouchEnd = (
        event
    ) => {
        if (
            touchStartX.current === null
        ) {
            return;
        }

        const deltaX =
            event.changedTouches[0].clientX -
            touchStartX.current;

        if (Math.abs(deltaX) > 40) {
            if (deltaX < 0) {
                goToNextAnnouncement();
            } else {
                goToPreviousAnnouncement();
            }
        }

        touchStartX.current = null;

        setIsAnnouncementPaused(false);
    };

    const schoolInfo = [
        {
            label: isStudent ? "Student ID" : "Faculty ID",
            value: user?.idNumber || "—"
        },
        {
            label: isStudent ? "Program" : "Institute",
            value: isStudent
                ? user?.course || "—"
                : user?.institute || "—"
        },
        {
            label: isStudent ? "Year Level" : "Position",
            value: isStudent
                ? user?.yearLevel || "—"
                : user?.position || "—"
        },
        {
            label: "Status",
            value: isStudent ? "Enrolled" : "Active"
        }
    ];

    const openService = (service) => {
        if (service.route) {
            navigate(service.route);
        } else if (service.url) {
            window.open(
                service.url,
                "_blank",
                "noopener,noreferrer"
            );
        }
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#F6F2E6] md:pt-24">

            {/* SECURITY WARNING - shown only when the server is certain another
                device signed in after this one. Renders nothing when it cannot
                tell, so there is never a false alarm. */}
            <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
                <DeviceSessionWarning />
            </div>

            <div className="pointer-events-none fixed inset-0 overflow-hidden">

                <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />

                <div className="absolute right-[-140px] top-[30%] h-[32rem] w-[32rem] rounded-full bg-cyan-300/10 blur-3xl" />

                <div className="absolute bottom-[-120px] left-[30%] h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />

                <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(16,106,46,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,106,46,.35)_1px,transparent_1px)] bg-[size:40px_40px]" />

            </div>

            <style>{`

                @keyframes dashboardReveal {
                    from {
                        opacity: 0;
                        transform: translateY(15px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes announcementProgress {
                    from {
                        width: 0%;
                    }

                    to {
                        width: 100%;
                    }
                }

                .dashboard-reveal {
                    animation:
                        dashboardReveal
                        .65s
                        cubic-bezier(.2,.8,.2,1)
                        both;
                }

                .dashboard-delay-1 {
                    animation-delay: .08s;
                }

                .dashboard-delay-2 {
                    animation-delay: .16s;
                }

                .dashboard-delay-3 {
                    animation-delay: .24s;
                }

                .dashboard-delay-4 {
                    animation-delay: .32s;
                }

            `}</style>


            {/* =====================================================
                MAIN
            ===================================================== */}

            <main className="relative z-10 min-h-screen px-3 py-3 pb-24 sm:px-5 sm:py-5 lg:px-8 lg:py-7">

                <div className="mx-auto w-full max-w-[1500px]">

                    {/* =================================================
                        HERO
                    ================================================= */}

                    <section className="dashboard-reveal relative mb-5 overflow-hidden rounded-[28px] border border-[#0E2C1E]/10 bg-gradient-to-br from-[#173F2C] via-[#0E2C1E] to-[#0A2818] px-5 py-6 shadow-xl shadow-amber-900/10 sm:px-7 sm:py-8">

                        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-300/10 blur-3xl" />

                        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-72 w-72 rounded-full bg-cyan-300/5 blur-3xl" />

                        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">

                            <div>

                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5">

                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" />

                                    <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-200">
                                        Welcome!
                                    </span>

                                </div>


                                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">

                                    Good Morning,

                                    <span className="block text-amber-300">

                                        {isLoading ? (
                                            <BoneOnDark className="mt-1 h-9 w-40 sm:h-10 sm:w-52" />
                                        ) : (
                                            userName.split(
                                                " "
                                            )[0]
                                        )}

                                    </span>

                                </h1>


                                <p className="mt-2 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
                                    Everything you need for
                                    your campus, connected in
                                    one place.
                                </p>


                                <p className="mt-4 text-xs uppercase tracking-[.14em] text-white/35">
                                    {todayLabel}
                                </p>

                            </div>


                            {/* SCHOOL INFORMATION */}

                            <div className="w-full lg:w-[340px]">

                                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl">

                                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.16em] text-white/50">
                                        My School Information
                                    </p>

                                    <div className="grid grid-cols-2 gap-2">

                                        {schoolInfo.map((item) => (
                                            <div
                                                key={item.label}
                                                className="rounded-xl border border-white/10 bg-black/10 p-3"
                                            >

                                                <p className="text-[9px] uppercase tracking-wider text-white/40">
                                                    {item.label}
                                                </p>

                                                {isLoading ? (
                                                    <BoneOnDark className="mt-1.5 h-3 w-16" />
                                                ) : (
                                                    <p className="mt-1 line-clamp-2 break-words text-xs font-semibold text-white">
                                                        {item.value}
                                                    </p>
                                                )}

                                            </div>
                                        ))}

                                    </div>

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        DEFAULT PASSWORD ALERT
                        Registration mails a generated password. Until the
                        user changes it, nudge them here.
                    ================================================= */}

                    {user?.mustChangePassword && (
                        <section className="dashboard-reveal dashboard-delay-1 mb-5 overflow-hidden rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300/40 text-amber-700">
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M12 9v4" />
                                        <path d="M12 17h.01" />
                                        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                                    </svg>
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-amber-900">
                                        You're using the default password
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-amber-800/80 sm:text-sm">
                                        Your account still uses the password we
                                        emailed you at registration. Please
                                        change it now to keep your account
                                        secure.
                                    </p>

                                    <button
                                        onClick={() => navigate("/profile")}
                                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-900/20 transition hover:opacity-90 active:scale-[0.98]"
                                    >
                                        Change password
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}


                    {/* =================================================
                        SEARCH
                    ================================================= */}

                    <div className="dashboard-reveal dashboard-delay-1 mb-5">

                        <div className="group relative">

                            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-amber-300/10 blur-xl opacity-0 transition group-focus-within:opacity-100" />

                            <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white shadow-md shadow-black/5">

                                <svg
                                    className="ml-4 shrink-0 text-slate-400"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle
                                        cx="11"
                                        cy="11"
                                        r="7"
                                    />

                                    <path d="m20 20-4-4" />
                                </svg>


                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search campus services..."
                                    className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:py-4"
                                />


                                {search && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSearch("")
                                        }
                                        aria-label="Clear search"
                                        className="mr-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                                    >
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.2"
                                            strokeLinecap="round"
                                        >
                                            <path d="M18 6 6 18M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        SERVICES
                    ================================================= */}

                    <section
                        id="services"
                        className="dashboard-reveal dashboard-delay-2 mb-5"
                    >

                        <div className="mb-3 flex items-end justify-between">

                            <div>

                                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#173F2C]/60">
                                    OneServe Modules
                                </p>

                                <h2 className="mt-1 text-lg font-semibold text-slate-800 sm:text-xl">
                                    Campus Services
                                </h2>

                            </div>


                            <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-medium text-slate-400 sm:inline-flex">
                                Services
                            </span>

                        </div>


                        {/* DESKTOP / TABLET */}

                        <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">

                            {isLoading ? (
                                Array.from({
                                    length: services.length
                                }).map(
                                    (_, index) => (
                                        <div
                                            key={
                                                index
                                            }
                                            className="rounded-2xl border border-slate-200 bg-white p-4"
                                        >
                                            <Bone className="mb-7 h-11 w-11 rounded-xl" />

                                            <Bone className="h-4 w-20" />

                                            <Bone className="mt-2 h-3 w-28" />

                                            <div className="mt-4 flex items-center justify-between">

                                                <Bone className="h-2.5 w-10" />

                                                <Bone className="h-7 w-7 rounded-full" />

                                            </div>

                                        </div>
                                    )
                                )
                            ) : (
                                filteredServices.map(
                                    (service) => (
                                        <button
                                            key={
                                                service.key
                                            }
                                            type="button"
                                            onClick={() =>
                                                openService(
                                                    service
                                                )
                                            }
                                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                        >

                                            <div
                                                className="absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-30 blur-2xl transition group-hover:opacity-60"
                                                style={{
                                                    background:
                                                        service.accent
                                                }}
                                            />


                                            <div
                                                className="mb-7 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 transition duration-300 group-hover:scale-110"
                                                style={{
                                                    background:
                                                        `${service.accent}14`,
                                                    color:
                                                        service.accent
                                                }}
                                            >
                                                {
                                                    service.icon
                                                }
                                            </div>


                                            <div>

                                                <p className="text-sm font-semibold text-slate-800">
                                                    {
                                                        service.title
                                                    }
                                                </p>

                                                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                                                    {
                                                        service.subtitle
                                                    }
                                                </p>

                                            </div>


                                            <div className="mt-4 flex items-center justify-between">

                                                <span className="text-[9px] uppercase tracking-widest text-slate-300">
                                                    Open
                                                </span>

                                                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition group-hover:text-slate-700">
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M5 12h14" />
                                                        <path d="m12 5 7 7-7 7" />
                                                    </svg>
                                                </span>

                                            </div>

                                        </button>
                                    )
                                )
                            )}

                        </div>


                        {/* MOBILE */}

                        <div className="flex gap-3 overflow-x-auto pb-2 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                            {isLoading ? (
                                Array.from({
                                    length: services.length
                                }).map(
                                    (_, index) => (
                                        <div
                                            key={
                                                index
                                            }
                                            className="min-w-[150px] rounded-2xl border border-slate-200 bg-white p-4"
                                        >

                                            <Bone className="h-10 w-10 rounded-xl" />

                                            <Bone className="mt-5 h-4 w-16" />

                                            <Bone className="mt-2 h-3 w-24" />

                                        </div>
                                    )
                                )
                            ) : (
                                filteredServices.map(
                                    (service) => (
                                        <button
                                            key={
                                                service.key
                                            }
                                            type="button"
                                            onClick={() =>
                                                openService(
                                                    service
                                                )
                                            }
                                            className="group min-w-[150px] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-300 active:scale-[0.97]"
                                        >

                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100"
                                                style={{
                                                    background:
                                                        `${service.accent}14`,
                                                    color:
                                                        service.accent
                                                }}
                                            >
                                                {
                                                    service.icon
                                                }
                                            </div>


                                            <p className="mt-5 text-sm font-semibold text-slate-800">
                                                {
                                                    service.title
                                                }
                                            </p>


                                            <p className="mt-1 text-[10px] leading-4 text-slate-400">
                                                {
                                                    service.subtitle
                                                }
                                            </p>

                                        </button>
                                    )
                                )
                            )}

                        </div>


                        {!isLoading &&
                            filteredServices.length ===
                                0 && (
                                <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
                                    No services match "
                                    {search}"
                                </div>
                            )}

                    </section>


                    {/* =================================================
                        ADMIN ANNOUNCEMENT
                    ================================================= */}

                    <div className="mb-5">

                        <div className="dashboard-reveal dashboard-delay-3 mb-3 flex items-end justify-between">

                            <div>

                                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#173F2C]/60">
                                    From the admin office
                                </p>

                                <h2 className="mt-1 text-lg font-semibold text-slate-800 sm:text-xl">
                                    Admin Announcement
                                </h2>

                            </div>

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="m3 11 18-5v12L3 14v-3z" />
                                    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                                </svg>
                                Official
                            </span>

                        </div>

                        <section
                            className="dashboard-reveal dashboard-delay-3 relative overflow-hidden rounded-[24px] p-5 shadow-lg shadow-black/5 sm:p-6"
                            style={{
                                background:
                                    `linear-gradient(135deg, ${
                                        currentAnnouncement.accent ||
                                        "#F4D35E"
                                    }, #FFEAB0)`
                            }}
                            onTouchStart={
                                handleAnnouncementTouchStart
                            }
                            onTouchEnd={
                                handleAnnouncementTouchEnd
                            }
                            onMouseEnter={() =>
                                setIsAnnouncementPaused(
                                    true
                                )
                            }
                            onMouseLeave={() =>
                                setIsAnnouncementPaused(
                                    false
                                )
                            }
                        >

                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.5),transparent_35%)]" />

                            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-white/30" />


                            {announcementsLoading ? (
                                <div className="relative z-10">

                                    <div className="mb-4 flex items-center justify-between">

                                        <div>

                                            <div className="h-2.5 w-24 animate-pulse rounded bg-white/40" />

                                            <div className="mt-2 h-4 w-16 animate-pulse rounded-full bg-white/40" />

                                        </div>


                                        <div className="flex gap-1.5">

                                            {Array.from({
                                                length: 3
                                            }).map(
                                                (_, index) => (
                                                    <div
                                                        key={
                                                            index
                                                        }
                                                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40"
                                                    />
                                                )
                                            )}

                                        </div>

                                    </div>


                                    <div className="h-5 w-3/4 animate-pulse rounded bg-white/40" />

                                    <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/40" />

                                    <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-white/40" />

                                </div>
                            ) : (
                                <div className="relative z-10">

                                    <div className="mb-4 flex items-center justify-between">

                                        <div>

                                            <span className="text-[9px] font-bold uppercase tracking-[.2em] text-[#173026]/60">
                                                Campus Broadcast
                                            </span>


                                            <div className="mt-1.5 inline-flex rounded-full bg-white/45 px-2 py-1 text-[9px] font-bold text-[#173026]/70">
                                                {
                                                    currentAnnouncement.tag
                                                }
                                            </div>

                                        </div>


                                        {announcements.length >
                                            1 && (
                                            <div className="flex gap-1.5">

                                                {announcements.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (
                                                        <button
                                                            type="button"
                                                            key={
                                                                item.id ||
                                                                item.key ||
                                                                index
                                                            }
                                                            onClick={() =>
                                                                setAnnouncementIndex(
                                                                    index
                                                                )
                                                            }
                                                            aria-label={`Announcement ${
                                                                index +
                                                                1
                                                            }`}
                                                            className={`
                                                                h-1.5
                                                                rounded-full
                                                                transition-all
                                                                ${
                                                                    index ===
                                                                    announcementIndex
                                                                        ? "w-5 bg-[#173026]"
                                                                        : "w-1.5 bg-[#173026]/25"
                                                                }
                                                            `}
                                                        />
                                                    )
                                                )}

                                            </div>
                                        )}

                                    </div>


                                    <div className="flex items-end justify-between gap-3">

                                        <div className="min-w-0">

                                            <h2 className="text-xl font-bold leading-tight text-[#10231B]">
                                                {
                                                    currentAnnouncement.title
                                                }
                                            </h2>


                                            <p className="mt-2 text-xs leading-5 text-[#10231B]/70">
                                                {
                                                    currentAnnouncement.message
                                                }
                                            </p>

                                        </div>


                                        {announcements.length >
                                            1 && (
                                            <div className="flex shrink-0 gap-1.5">

                                                <button
                                                    type="button"
                                                    onClick={
                                                        goToPreviousAnnouncement
                                                    }
                                                    aria-label="Previous announcement"
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/45 text-[#10231B] transition hover:bg-white/65"
                                                >
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="m15 18-6-6 6-6" />
                                                    </svg>
                                                </button>


                                                <button
                                                    type="button"
                                                    onClick={
                                                        goToNextAnnouncement
                                                    }
                                                    aria-label="Next announcement"
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/45 text-[#10231B] transition hover:bg-white/65"
                                                >
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="m9 18 6-6-6-6" />
                                                    </svg>
                                                </button>

                                            </div>
                                        )}

                                    </div>


                                    {!isAnnouncementPaused &&
                                        announcements.length >
                                            1 && (
                                            <div className="mt-5 h-1 overflow-hidden rounded-full bg-black/10">

                                                <div
                                                    key={
                                                        announcementIndex
                                                    }
                                                    className="h-full rounded-full bg-[#10231B]/55"
                                                    style={{
                                                        animation:
                                                            "announcementProgress 6s linear forwards"
                                                    }}
                                                />

                                            </div>
                                        )}

                                </div>
                            )}

                        </section>

                    </div>


                    {/* =================================================
                        EVENT CALENDAR
                    ================================================= */}

                    <section className="dashboard-reveal dashboard-delay-4 mb-5">
                        <EventCalendar />
                    </section>


                </div>

            </main>

            {/* OneServe Assistant: campus Q&A, floating over the dashboard. */}
            <AIAssistant />

        </div>
    );
}