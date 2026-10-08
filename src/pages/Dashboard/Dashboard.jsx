import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import toast from "react-hot-toast";

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

    
    const [recentActivity, setRecentActivity] =
        useState([]);

    const [activityLoading, setActivityLoading] =
        useState(true);

    
    useEffect(() => {
        const email =
            localStorage.getItem("userEmail");

        if (!email) {
            navigate("/");
            return;
        }

        const loadProfile = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/api/profile/${encodeURIComponent(
                        email
                    )}`
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

    
    useEffect(() => {
        const email =
            user?.email ||
            localStorage.getItem("userEmail");

        if (!email) {
            return;
        }

        const loadRecentActivity =
            async () => {
                try {
                    setActivityLoading(true);

                    const response =
                        await fetch(
                            `${API_URL}/api/profile/activity/${encodeURIComponent(
                                email
                            )}`
                        );

                    if (!response.ok) {
                        throw new Error(
                            "Unable to load recent activity."
                        );
                    }

                    const data =
                        await response.json();

                    setRecentActivity(
                        Array.isArray(data)
                            ? data
                            : []
                    );
                } catch (error) {
                    console.error(
                        "Recent activity error:",
                        error
                    );

                    setRecentActivity([]);
                } finally {
                    setActivityLoading(
                        false
                    );
                }
            };

        loadRecentActivity();
    }, [user?.email]);

   
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
            url: "https://clinic.cdmoneserve.vercel.app",
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
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
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
        },

        {
            key: "marketplace",
            title: "Marketplace",
            subtitle: "Campus store",
            route: "/marketplace",
            accent: "#173F2C",
            glow: "rgba(23,63,44,.14)",
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
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
            )
        },

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

    const formatRelativeTime = (
        dateValue
    ) => {
        if (!dateValue) {
            return "";
        }

        const date =
            new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        const now = new Date();

        const difference =
            now.getTime() -
            date.getTime();

        const seconds =
            Math.floor(
                difference / 1000
            );

        if (seconds < 60) {
            return "Just now";
        }

        const minutes =
            Math.floor(
                seconds / 60
            );

        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        const hours =
            Math.floor(
                minutes / 60
            );

        if (hours < 24) {
            return `${hours}h ago`;
        }

        const days =
            Math.floor(
                hours / 24
            );

        if (days < 7) {
            return `${days}d ago`;
        }

        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric"
            }
        );
    };


    const accountStatus =
        user?.accountStatus ||
        "Approved";

    const physicalIdStatus =
        user?.physicalIdVerificationStatus ||
        "Verified";

    const profileComplete =
        user?.isProfileComplete;

    const Bone = ({
        className = ""
    }) => (
        <div
            className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`}
        />
    );

    const BoneOnDark = ({
        className = ""
    }) => (
        <div
            className={`animate-pulse rounded-lg bg-white/15 ${className}`}
        />
    );

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#F6F2E6] md:pt-24">

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


                            {/* STATUS */}

                            <div className="w-full lg:w-[310px]">

                                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl">

                                    <div className="mb-3 flex items-center justify-between">

                                        <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/50">
                                            Account Status
                                        </span>

                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-300">

                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />

                                            LIVE

                                        </span>

                                    </div>


                                    <div className="mb-4 flex items-center justify-between">

                                        <div>

                                            {isLoading ? (
                                                <>
                                                    <BoneOnDark className="h-4 w-24" />

                                                    <BoneOnDark className="mt-2 h-3 w-32" />
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-semibold text-white">
                                                        {
                                                            accountStatus
                                                        }
                                                    </p>

                                                    <p className="mt-0.5 text-[11px] text-white/50">
                                                        Physical ID:{" "}
                                                        {
                                                            physicalIdStatus
                                                        }
                                                    </p>
                                                </>
                                            )}

                                        </div>


                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">

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
                                                <path d="M12 3l7 3v5c0 4.8-3 8.2-7 10-4-1.8-7-5.2-7-10V6l7-3z" />
                                                <path d="m9 12 2 2 4-4" />
                                            </svg>

                                        </div>

                                    </div>


                                    <div className="grid grid-cols-2 gap-2">

                                        <div className="rounded-xl border border-white/10 bg-black/10 p-3">

                                            <p className="text-[9px] uppercase tracking-wider text-white/40">
                                                {isStudent
                                                    ? "Enrollment"
                                                    : "Employment"}
                                            </p>

                                            {isLoading ? (
                                                <BoneOnDark className="mt-1.5 h-3 w-14" />
                                            ) : (
                                                <p className="mt-1 text-xs font-semibold text-white">
                                                    {isStudent
                                                        ? "Enrolled"
                                                        : "Active"}
                                                </p>
                                            )}

                                        </div>


                                        <div className="rounded-xl border border-white/10 bg-black/10 p-3">

                                            <p className="text-[9px] uppercase tracking-wider text-white/40">
                                                Profile
                                            </p>

                                            {isLoading ? (
                                                <BoneOnDark className="mt-1.5 h-3 w-14" />
                                            ) : (
                                                <p className="mt-1 text-xs font-semibold text-white">
                                                    {profileComplete
                                                        ? "Complete"
                                                        : "Active"}
                                                </p>
                                            )}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </section>


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
                                        ×
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
                                5 connected services
                            </span>

                        </div>


                        {/* DESKTOP / TABLET */}

                        <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-5">

                            {isLoading ? (
                                Array.from({
                                    length: 5
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
                                            onClick={() => {
                                                if (
                                                    service.route
                                                ) {
                                                    navigate(
                                                        service.route
                                                    );
                                                } else if (
                                                    service.url
                                                ) {
                                                    window.open(
                                                        service.url,
                                                        "_blank",
                                                        "noopener,noreferrer"
                                                    );
                                                }
                                            }}
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
                                                    →
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
                                    length: 5
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
                                            onClick={() => {
                                                if (
                                                    service.route
                                                ) {
                                                    navigate(
                                                        service.route
                                                    );
                                                } else if (
                                                    service.url
                                                ) {
                                                    window.open(
                                                        service.url,
                                                        "_blank",
                                                        "noopener,noreferrer"
                                                    );
                                                }
                                            }}
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
                        LOWER GRID
                    ================================================= */}

                    <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[1.45fr_.8fr]">

                        {/* =================================================
                            LEFT COLUMN
                        ================================================= */}

                        <div className="space-y-5 sm:space-y-6">

                            {/* SCHOOL INFORMATION */}

                            <section className="dashboard-reveal dashboard-delay-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">

                                    <div>

                                        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-700/50">
                                            Connected Record
                                        </p>

                                        <h2 className="mt-1 text-base font-semibold text-slate-800">
                                            My School Information
                                        </h2>

                                    </div>


                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">

                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                                        Synced

                                    </span>

                                </div>


                                {isLoading ? (
                                    <div className="grid grid-cols-2 gap-px bg-slate-100">

                                        {Array.from({
                                            length: 4
                                        }).map(
                                            (_, index) => (
                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className="bg-white p-5"
                                                >

                                                    <Bone className="h-2.5 w-16" />

                                                    <Bone className="mt-3 h-4 w-24" />

                                                </div>
                                            )
                                        )}

                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">

                                        <div className="bg-white p-4">

                                            <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                                {isStudent
                                                    ? "Student ID"
                                                    : "Faculty ID"}
                                            </p>

                                            <p className="mt-1.5 break-all text-sm font-semibold text-slate-800">
                                                {user?.idNumber ||
                                                    "—"}
                                            </p>

                                        </div>


                                        <div className="bg-white p-4">

                                            <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                                {isStudent
                                                    ? "Program"
                                                    : "Institute"}
                                            </p>

                                            <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-slate-800">
                                                {isStudent
                                                    ? user?.course ||
                                                      "—"
                                                    : user?.institute ||
                                                      "—"}
                                            </p>

                                        </div>


                                        <div className="bg-white p-4">

                                            <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                                {isStudent
                                                    ? "Year Level"
                                                    : "Position"}
                                            </p>

                                            <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-slate-800">
                                                {isStudent
                                                    ? user?.yearLevel ||
                                                      "—"
                                                    : user?.position ||
                                                      "—"}
                                            </p>

                                        </div>


                                        <div className="bg-white p-4">

                                            <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                                Status
                                            </p>

                                            <p className="mt-1.5 text-sm font-semibold text-amber-700">
                                                {isStudent
                                                    ? "Enrolled"
                                                    : "Active"}
                                            </p>

                                        </div>

                                    </div>
                                )}

                            </section>


                            {/* RECENT ACTIVITY */}

                            <section className="dashboard-reveal dashboard-delay-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                                <div className="mb-4 flex items-center justify-between">

                                    <div>

                                        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#173F2C]/50">
                                            Account Timeline
                                        </p>

                                        <h2 className="mt-1 text-base font-semibold text-slate-800">
                                            Recent Activity
                                        </h2>

                                    </div>


                                    <span className="text-[10px] uppercase tracking-wider text-slate-300">
                                        LIVE
                                    </span>

                                </div>


                                <div className="divide-y divide-slate-100">

                                    {activityLoading ? (
                                        Array.from({
                                            length: 4
                                        }).map(
                                            (_, index) => (
                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className="flex items-center gap-3 py-3.5"
                                                >

                                                    <Bone className="h-9 w-9 shrink-0 rounded-xl" />


                                                    <div className="min-w-0 flex-1">

                                                        <Bone className="h-3.5 w-40" />

                                                        <Bone className="mt-2 h-2.5 w-24" />

                                                    </div>


                                                    <Bone className="h-2.5 w-10 shrink-0" />

                                                </div>
                                            )
                                        )
                                    ) : recentActivity.length > 0 ? (
                                        recentActivity.map(
                                            (item) => (
                                                <div
                                                    key={
                                                        item.id
                                                    }
                                                    className="flex items-center gap-3 py-3.5"
                                                >

                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600">

                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                                                    </div>


                                                    <div className="min-w-0 flex-1">

                                                        <p className="truncate text-sm font-medium text-slate-800">
                                                            {
                                                                item.label
                                                            }
                                                        </p>


                                                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-400">
                                                            {
                                                                item.description ||
                                                                "Account activity"
                                                            }
                                                        </p>

                                                    </div>


                                                    <span className="shrink-0 text-[10px] text-slate-300">
                                                        {formatRelativeTime(
                                                            item.createdAt
                                                        )}
                                                    </span>

                                                </div>
                                            )
                                        )
                                    ) : (
                                        <div className="py-8 text-center">

                                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-300">

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
                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="9"
                                                    />

                                                    <path d="M12 7v5l3 2" />

                                                </svg>

                                            </div>


                                            <p className="mt-3 text-sm font-medium text-slate-500">
                                                No recent activity
                                            </p>


                                            <p className="mt-1 text-xs text-slate-400">
                                                Your account and profile changes will appear here.
                                            </p>

                                        </div>
                                    )}

                                </div>

                            </section>

                        </div>


                        {/* =================================================
                            RIGHT COLUMN
                        ================================================= */}

                        <aside className="space-y-5 sm:space-y-6">

                            {/* =================================================
                                ANNOUNCEMENTS
                            ================================================= */}

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
                                                        ←
                                                    </button>


                                                    <button
                                                        type="button"
                                                        onClick={
                                                            goToNextAnnouncement
                                                        }
                                                        aria-label="Next announcement"
                                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/45 text-[#10231B] transition hover:bg-white/65"
                                                    >
                                                        →
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

                        </aside>

                    </div>

                </div>

            </main>

        </div>
    );
}
