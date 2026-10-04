import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState({
        totalUsers: 0,
        pendingPhysicalId: 0,
        verifiedPhysicalId: 0,
        rejectedPhysicalId: 0,
        recentActivity: [],
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
        {
            name: "Lost & Found",
            icon: "🔎",
            status: "Online",
        },
        {
            name: "Business Hub",
            icon: "🏪",
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
                    pendingPhysicalId: data.pendingPhysicalId ?? 0,
                    verifiedPhysicalId: data.verifiedPhysicalId ?? 0,
                    rejectedPhysicalId: data.rejectedPhysicalId ?? 0,
                    recentActivity: data.recentActivity ?? [],
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
                    pendingPhysicalId: 0,
                    verifiedPhysicalId: 0,
                    rejectedPhysicalId: 0,
                    recentActivity: [],
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
            label: "Pending Physical ID",
            value: dashboard.pendingPhysicalId,
            description: "Needs verification",
            icon: "clock",
            bg: "#FCEFCB",
            color: "#A16207",
        },
        {
            label: "Verified Physical ID",
            value: dashboard.verifiedPhysicalId,
            description: "Successfully verified",
            icon: "check",
            bg: "#E1F0E4",
            color: "#106A2E",
        },
        {
            label: "Rejected ID",
            value: dashboard.rejectedPhysicalId,
            description: "Verification rejected",
            icon: "x",
            bg: "#F6E3E1",
            color: "#9F3434",
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
    // LOADING SCREEN
    // --------------------------------------------------

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F5EF]">
                <main className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">

                    {/* TOP BAR */}
                    <div className="flex items-center justify-between mb-9">
                        <div>
                            <Bone className="w-28 h-3 mb-3" />
                            <Bone className="w-60 h-8" />
                        </div>

                        <Bone className="w-10 h-10 rounded-full" />
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-8">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="bg-white rounded-2xl p-5 border border-[#1F1F1F]/[0.05]"
                            >
                                <Bone className="w-28 h-3 mb-4" />
                                <Bone className="w-16 h-8 mb-3" />
                                <Bone className="w-32 h-3" />
                            </div>
                        ))}
                    </div>

                    {/* PHYSICAL ID */}
                    <div className="bg-white rounded-2xl p-6 mb-8">
                        <Bone className="w-52 h-5 mb-4" />
                        <Bone className="w-full h-3 mb-2" />
                        <Bone className="w-2/3 h-3 mb-5" />
                        <Bone className="w-40 h-10 rounded-full" />
                    </div>

                    {/* LOWER GRID */}
                    <div className="grid lg:grid-cols-2 gap-6">

                        <div className="bg-white rounded-2xl p-6">
                            <Bone className="w-40 h-5 mb-6" />

                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-3 mb-5"
                                >
                                    <Bone className="w-9 h-9 rounded-full" />

                                    <div className="flex-1">
                                        <Bone className="w-40 h-3 mb-2" />
                                        <Bone className="w-28 h-2.5" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl p-6">
                            <Bone className="w-32 h-5 mb-6" />

                            {[1, 2, 3, 4, 5].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center justify-between mb-5"
                                >
                                    <div className="flex items-center gap-3">
                                        <Bone className="w-9 h-9 rounded-xl" />
                                        <Bone className="w-28 h-3" />
                                    </div>

                                    <Bone className="w-16 h-3" />
                                </div>
                            ))}
                        </div>

                    </div>
                </main>
            </div>
        );
    }

    // --------------------------------------------------
    // MAIN DASHBOARD
    // --------------------------------------------------

    return (
        <div className="min-h-screen bg-[#F7F5EF] text-[#1F1F1F] overflow-x-hidden">

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

                .font-display {
                    font-family: 'Fraunces', serif;
                }
            `}</style>

            <main className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">

                {/* ==================================================
                    TOP BAR
                ================================================== */}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-9">

                    <div>

                        <h1 className="font-display text-2xl lg:text-3xl text-[#1F1F1F]">
                            Good morning, {adminName}
                        </h1>

                        <p className="text-sm text-gray-500 mt-1">
                            Here's what's happening across CDM OneServe.
                        </p>
                    </div>
                </div>

                {/* ==================================================
                    LOAD ERROR
                ================================================== */}

                {loadError && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm flex items-center justify-between gap-4">
                        <span>{loadError}</span>

                        <button
                            onClick={() => window.location.reload()}
                            className="font-semibold underline whitespace-nowrap"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ==================================================
                    SYSTEM OVERVIEW
                ================================================== */}

                <section className="mb-8">

                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-display text-xl text-[#1F1F1F]">
                                System Overview
                            </h2>

                            <p className="text-xs text-gray-500 mt-1">
                                Current CDM OneServe account and verification status
                            </p>
                        </div>
                    </div>

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
                </section>

                {/* ==================================================
                    PHYSICAL ID VERIFICATION
                ================================================== */}

                <section className="mb-8">

                    <div
                        className="
                            bg-white
                            rounded-2xl
                            border
                            border-[#1F1F1F]/[0.05]
                            overflow-hidden
                        "
                    >

                        <div className="p-6 lg:p-7">

                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                                <div className="flex items-start gap-4">

                                    <div
                                        className="
                                            w-12
                                            h-12
                                            rounded-2xl
                                            flex
                                            items-center
                                            justify-center
                                            flex-shrink-0
                                        "
                                        style={{
                                            background: "#FCEFCB",
                                            color: "#A16207",
                                        }}
                                    >
                                        <Icon type="shield" size={24} />
                                    </div>

                                    <div>

                                        <p className="text-xs uppercase tracking-[0.15em] text-[#A16207] font-semibold mb-1">
                                            Verification Center
                                        </p>

                                        <h2 className="font-display text-2xl text-[#1F1F1F]">
                                            Physical ID Verification
                                        </h2>

                                        <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                            Review submitted physical IDs and verify
                                            student and faculty accounts.
                                        </p>

                                    </div>

                                </div>

                                <button
                                    onClick={() =>
                                        navigate(
                                            "/admin/verification"
                                        )
                                    }
                                    className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        px-5
                                        py-2.5
                                        rounded-full
                                        text-sm
                                        font-medium
                                        text-white
                                        transition
                                        hover:opacity-90
                                        whitespace-nowrap
                                    "
                                    style={{
                                        background: "#106A2E",
                                    }}
                                >
                                    Review Physical IDs
                                    <Icon type="arrow" size={15} />
                                </button>

                            </div>

                            {/* VERIFICATION SUMMARY */}

                            <div className="grid grid-cols-3 gap-3 mt-7">

                                <div className="bg-[#F7F5EF] rounded-xl p-4">
                                    <p className="text-xs text-gray-500 mb-1">
                                        Pending
                                    </p>

                                    <p className="font-display text-2xl text-[#A16207]">
                                        {dashboard.pendingPhysicalId}
                                    </p>
                                </div>

                                <div className="bg-[#F7F5EF] rounded-xl p-4">
                                    <p className="text-xs text-gray-500 mb-1">
                                        Verified
                                    </p>

                                    <p className="font-display text-2xl text-[#106A2E]">
                                        {dashboard.verifiedPhysicalId}
                                    </p>
                                </div>

                                <div className="bg-[#F7F5EF] rounded-xl p-4">
                                    <p className="text-xs text-gray-500 mb-1">
                                        Rejected
                                    </p>

                                    <p className="font-display text-2xl text-[#9F3434]">
                                        {dashboard.rejectedPhysicalId}
                                    </p>
                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* ==================================================
                    LOWER CONTENT
                ================================================== */}

                <div className="grid lg:grid-cols-2 gap-6">

                    {/* ==================================================
                        RECENT ACTIVITY
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
                                    Recent Activity
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    Latest system actions
                                </p>
                            </div>

                            <div
                                className="
                                    w-9
                                    h-9
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                "
                                style={{
                                    background: "#E1F0E4",
                                    color: "#106A2E",
                                }}
                            >
                                <Icon type="activity" size={18} />
                            </div>

                        </div>

                        <div className="px-5 sm:px-6 pb-5 max-h-[420px] overflow-y-auto">

                            {dashboard.recentActivity.length > 0 ? (
                                dashboard.recentActivity
                                    .slice(0, 20)
                                    .map((activity, index) => (
                                        <div
                                            key={activity.id || index}
                                            className="
                                                flex
                                                items-start
                                                gap-3
                                                py-4
                                                border-b
                                                border-[#1F1F1F]/[0.05]
                                                last:border-0
                                            "
                                        >

                                            <div
                                                className="
                                                    w-9
                                                    h-9
                                                    rounded-full
                                                    flex
                                                    items-center
                                                    justify-center
                                                    text-xs
                                                    flex-shrink-0
                                                "
                                                style={{
                                                    background: "#E1F0E4",
                                                    color: "#106A2E",
                                                }}
                                            >
                                                ✓
                                            </div>

                                            <div className="min-w-0 flex-1">

                                                <p className="text-sm font-medium text-[#1F1F1F]">
                                                    {activity.title ||
                                                        activity.action ||
                                                        "System activity"}
                                                </p>

                                                <p className="text-xs text-gray-500 mt-1">
                                                    {activity.description ||
                                                        activity.message ||
                                                        ""}
                                                </p>

                                                {activity.createdAt && (
                                                    <p className="text-[11px] text-gray-400 mt-1">
                                                        {new Date(
                                                            activity.createdAt
                                                        ).toLocaleString(
                                                            "en-US",
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                                hour: "numeric",
                                                                minute: "2-digit",
                                                            }
                                                        )}
                                                    </p>
                                                )}

                                            </div>

                                        </div>
                                    ))
                            ) : (
                                <div className="py-12 text-center">

                                    <div className="text-3xl mb-3">
                                        📋
                                    </div>

                                    <p className="text-sm font-medium text-gray-500">
                                        No recent activity
                                    </p>

                                    <p className="text-xs text-gray-400 mt-1">
                                        System activities will appear here.
                                    </p>

                                </div>
                            )}

                        </div>

                    </section>

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

                                const isOnline =
                                    module.status?.toLowerCase() ===
                                    "online";

                                return (
                                    <div
                                        key={module.name || index}
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            py-3.5
                                            border-b
                                            border-[#1F1F1F]/[0.05]
                                            last:border-0
                                        "
                                    >

                                        <div className="flex items-center gap-3">

                                            <div
                                                className="
                                                    w-9
                                                    h-9
                                                    rounded-xl
                                                    bg-[#F7F5EF]
                                                    flex
                                                    items-center
                                                    justify-center
                                                    text-base
                                                "
                                            >
                                                {module.icon || "•"}
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-[#1F1F1F]">
                                                    {module.name}
                                                </p>

                                                <p className="text-[11px] text-gray-400">
                                                    Campus service module
                                                </p>
                                            </div>

                                        </div>

                                        <div className="flex items-center gap-2">

                                            <span
                                                className={`w-2 h-2 rounded-full ${
                                                    isOnline
                                                        ? "bg-[#106A2E]"
                                                        : "bg-[#9F3434]"
                                                }`}
                                            />

                                            <span
                                                className={`text-xs font-medium ${
                                                    isOnline
                                                        ? "text-[#106A2E]"
                                                        : "text-[#9F3434]"
                                                }`}
                                            >
                                                {module.status || "Unknown"}
                                            </span>

                                        </div>

                                    </div>
                                );
                            })}

                        </div>

                    </section>

                </div>

                {/* ==================================================
                    QUICK ACTIONS
                ================================================== */}

                <section className="mt-6">

                    <h2 className="font-display text-xl text-[#1F1F1F] mb-4">
                        Quick Actions
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                        <button
                            onClick={() =>
                                navigate("/admin/verification")
                            }
                            className="
                                bg-white
                                rounded-2xl
                                border
                                border-[#1F1F1F]/[0.05]
                                p-5
                                text-left
                                hover:shadow-md
                                hover:-translate-y-0.5
                                transition-all
                            "
                        >
                            <div
                                className="
                                    w-10
                                    h-10
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                    mb-4
                                "
                                style={{
                                    background: "#FCEFCB",
                                    color: "#A16207",
                                }}
                            >
                                <Icon type="shield" size={19} />
                            </div>

                            <p className="font-medium text-sm">
                                Physical ID Verification
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                                Review pending submissions
                            </p>
                        </button>

                        <button
                            onClick={() => navigate("/admin/users")}
                            className="
                                bg-white
                                rounded-2xl
                                border
                                border-[#1F1F1F]/[0.05]
                                p-5
                                text-left
                                hover:shadow-md
                                hover:-translate-y-0.5
                                transition-all
                            "
                        >
                            <div
                                className="
                                    w-10
                                    h-10
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                    mb-4
                                "
                                style={{
                                    background: "#ECE9E2",
                                    color: "#1F1F1F",
                                }}
                            >
                                <Icon type="users" size={19} />
                            </div>

                            <p className="font-medium text-sm">
                                User Management
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                                Manage student and faculty accounts
                            </p>
                        </button>

                        <button
                            onClick={() => navigate("/admin/school-records")}
                            className="
                                bg-white
                                rounded-2xl
                                border
                                border-[#1F1F1F]/[0.05]
                                p-5
                                text-left
                                hover:shadow-md
                                hover:-translate-y-0.5
                                transition-all
                            "
                        >
                            <div
                                className="
                                    w-10
                                    h-10
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                    mb-4
                                "
                                style={{
                                    background: "#E1F0E4",
                                    color: "#106A2E",
                                }}
                            >
                                🏫
                            </div>

                            <p className="font-medium text-sm">
                                School Records
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                                View and manage school information
                            </p>
                        </button>

                    </div>

                </section>

                {/* ==================================================
                    FOOTER
                ================================================== */}

                <div className="py-8 text-center">

                    <p className="text-xs text-gray-400">
                        CDM OneServe • Admin Panel
                    </p>

                </div>

            </main>
        </div>
    );
}