import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";

const Bone = ({ className = "" }) => (
    <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />
);

const BoneOnDark = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded-lg bg-white/15 ${className}`}
    />
);

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState({
        totalUsers: 0,
        totalStudents: 0,
        totalFaculty: 0,
        modules: [],
    });

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const adminName =
        localStorage.getItem("adminName") ||
        localStorage.getItem("userName") ||
        "Admin";

    // --------------------------------------------------
    // DEFAULT MODULE STATUS
    // --------------------------------------------------

    const defaultModules = [
        {
            name: "Lost & Found",
            icon: "🔍",
            status: "Online",
        },
        {
            name: "Library",
            icon: "📚",
            status: "Online",
        },
        {
            name: "Clinic",
            icon: "🏥",
            status: "Online",
        },
        {
            name: "Guidance",
            icon: "💬",
            status: "Online",
        },
    ];

    // --------------------------------------------------
    // LOAD DASHBOARD DATA
    // --------------------------------------------------

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                // Kailangan na ng token dahil may [Authorize]
                // na ang /api/admin/dashboard
                const token =
                    localStorage.getItem("token") ||
                    localStorage.getItem("authToken");

                const response = await fetch(
                    `${API_URL}/api/admin/dashboard`,
                    {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {},
                    }
                );

                if (response.status === 401) {
                    throw new Error(
                        "Session expired. Please log in again."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "Your account doesn't have permission to view the dashboard."
                    );
                }

                if (!response.ok) {
                    throw new Error("Failed to load admin dashboard.");
                }

                const data = await response.json();

                setDashboard({
                    totalUsers: data.totalUsers ?? 0,
                    totalStudents: data.totalStudents ?? 0,
                    totalFaculty: data.totalFaculty ?? 0,
                    modules:
                        data.modules?.length > 0
                            ? data.modules
                            : defaultModules,
                });

                setLoadError("");
            } catch (error) {
                console.error("Admin dashboard error:", error);

                setLoadError(
                    error.message || "Failed to load admin dashboard."
                );

                // Keep dashboard usable even if backend
                // endpoint is not ready yet.
                setDashboard({
                    totalUsers: 0,
                    totalStudents: 0,
                    totalFaculty: 0,
                    modules: defaultModules,
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboard();
    }, []);

    // --------------------------------------------------
    // DATE
    // --------------------------------------------------

    const today = new Date();

    const formattedDate = today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    // --------------------------------------------------
    // STATS
    // --------------------------------------------------

    const stats = [
        {
            label: "Total Users",
            value: dashboard.totalUsers,
            description: "Registered accounts",
            icon: "users",
            bg: "#ECE9E2",
            color: "#1F1F1F",
        },
        {
            label: "Total Students",
            value: dashboard.totalStudents,
            description: "Student accounts",
            icon: "users",
            bg: "#ECE9E2",
            color: "#1F1F1F",
        },
        {
            label: "Total Faculty",
            value: dashboard.totalFaculty,
            description: "Faculty accounts",
            icon: "users",
            bg: "#ECE9E2",
            color: "#1F1F1F",
        },
    ];

    // --------------------------------------------------
    // ICON
    // --------------------------------------------------

    const Icon = ({ type, size = 20 }) => {
        const common = {
            width: size,
            height: size,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.8",
            strokeLinecap: "round",
            strokeLinejoin: "round",
        };

        if (type === "users") {
            return (
                <svg {...common}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            );
        }

        if (type === "clock") {
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                </svg>
            );
        }

        if (type === "check") {
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 12 2.5 2.5L16 9" />
                </svg>
            );
        }

        if (type === "x") {
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="m9 9 6 6" />
                    <path d="m15 9-6 6" />
                </svg>
            );
        }

        if (type === "arrow") {
            return (
                <svg {...common}>
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                </svg>
            );
        }

        if (type === "shield") {
            return (
                <svg {...common}>
                    <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
                    <path d="m9 12 2 2 4-4" />
                </svg>
            );
        }

        if (type === "activity") {
            return (
                <svg {...common}>
                    <path d="M3 12h4l2-7 4 14 2-7h6" />
                </svg>
            );
        }

        return null;
    };

    // --------------------------------------------------
    // SKELETON
    // --------------------------------------------------

    const Bone = ({ className = "" }) => (
        <div
            className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`}
        />
    );

    // --------------------------------------------------
    // LOWER CONTENT
    // --------------------------------------------------

    const lowerContent = (
        <div className="px-5 sm:px-6 pb-5">

            {/* ==================================================
                STATS
            ================================================== */}

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">

                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="
                            bg-white
                            rounded-2xl
                            p-5
                            border
                            border-[#1F1F1F]/[0.05]
                            hover:-translate-y-0.5
                            hover:shadow-md
                            transition-all
                        "
                    >

                        <div className="flex items-start justify-between gap-3">

                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
                                    {stat.label}
                                </p>

                                <p
                                    className="font-display text-3xl"
                                    style={{ color: stat.color }}
                                >
                                    {stat.value}
                                </p>

                                <p className="text-xs text-gray-400 mt-2">
                                    {stat.description}
                                </p>
                            </div>

                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{
                                    background: stat.bg,
                                    color: stat.color,
                                }}
                            >
                                <Icon type={stat.icon} size={19} />
                            </div>

                        </div>

                    </div>
                ))}

            </div>
        </div>
    )

    // --------------------------------------------------
    // MODULE MONITORING
    // --------------------------------------------------

    const modules = dashboard.modules;

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <div className="relative z-10 min-h-screen px-3 py-3 pb-24 sm:px-5 sm:py-5 lg:px-8 lg:py-7">

            <div className="mx-auto w-full max-w-[1500px]">

                <div className="rounded-2xl border border-[#0E2C1E]/10 bg-gradient-to-br from-[#173F2C] via-[#0E2C1E] to-[#0A2818] px-5 py-6 shadow-xl shadow-amber-900/10 sm:px-7 sm:py-8">

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
                                        dashboard.adminName.split(" ")[0]
                                    )}
                                </span>

                            </h1>


                            <p className="mt-2 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
                                Everything you need for
                                your campus, connected in
                                one place.
                            </p>


                        </div>


                        <div className="hidden lg:block lg:w-64">

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

                                        <p className="text-sm font-semibold text-white">
                                            {dashboard.totalUsers > 0 ? (
                                                "Online"
                                            ) : (
                                                "No accounts"
                                            )}
                                        </p>

                                        <p className="mt-0.5 text-[11px] text-white/50">
                                            Total active users
                                        </p>

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
                                            Total Users
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-white">
                                            {dashboard.totalUsers}
                                        </p>

                                    </div>


                                    <div className="rounded-xl border border-white/10 bg-black/10 p-3">

                                        <p className="text-[9px] uppercase tracking-wider text-white/40">
                                            Students
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-white">
                                            {dashboard.totalStudents}
                                        </p>

                                    </div>


                                    <div className="rounded-xl border border-white/10 bg-black/10 p-3">

                                        <p className="text-[9px] uppercase tracking-wider text-white/40">
                                            Faculty
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-white">
                                            {dashboard.totalFaculty}
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                <div className="mx-auto w-full max-w-[1500px] pt-6">

                    {/* ==================================================
                        MODULE MONITORING
                    ================================================== */}

                    <section
                        className="
                            bg-white
                            rounded-2xl
                            border
                            border-[#1F1F1F]/[0.05]
                            overflow-hidden
                        "
                    >

                        <div className="flex items-center justify-between px-5 sm:px-6 pt-6 pb-4">

                            <div>
                                <h2 className="font-display text-xl text-[#1F1F1F]">
                                    Module Monitoring
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    Current service availability
                                </p>
                            </div>

                            <span
                                className="
                                    px-3
                                    py-1.5
                                    rounded-full
                                    text-[11px]
                                    font-medium
                                "
                                style={{
                                    background: "#E1F0E4",
                                    color: "#106A2E",
                                }}
                            >
                                System Active
                            </span>

                        </div>

                        <div className="px-5 sm:px-6 pb-5">

                            {(dashboard.modules?.length
                                ? dashboard.modules
                                : defaultModules
                            ).map((module, index) => {

                                return (

                                    <div
                                        key={index}
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            px-3
                                            py-2
                                        "
                                    >

                                        <div className="flex items-center gap-3">

                                            <Icon type={module.icon} size={20} />

                                            <span className="text-sm font-medium text-[#1F1F1F]">
                                                {module.name}
                                            </span>

                                        </div>

                                        <span className="text-xs text-gray-400">
                                            {module.status}
                                        </span>

                                    </div>

                                );

                            })}

                        </div>

                    </section>

                </div>

            </div>

        </div>
    );
}