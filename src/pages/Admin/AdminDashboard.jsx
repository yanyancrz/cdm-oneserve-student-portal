import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";

// Accent colors for the per-module statistic cards.
const MODULE_ACCENTS = {
    "Lost & Found": { bg: "#FEF3C7", color: "#B45309" },
    Library: { bg: "#DBEAFE", color: "#1D4ED8" },
    Clinic: { bg: "#FFE4E6", color: "#BE123C" },
    Guidance: { bg: "#EDE9FE", color: "#6D28D9" },
};

const DEFAULT_ACCENT = { bg: "#ECE9E2", color: "#1F1F1F" };

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

    // No hardcoded module statuses: rely on the backend's
    // /api/admin/dashboard response. If it has no `modules`,
    // we show an empty state instead of fake "Online" values.

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

                const [dashboardResponse, usersResponse] = await Promise.all([
                    fetch(`${API_URL}/api/admin/dashboard`, {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {},
                    }),
                    fetch(`${API_URL}/api/auth/users`, {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {},
                    }),
                ]);

                if (dashboardResponse.status === 401) {
                    throw new Error(
                        "Session expired. Please log in again."
                    );
                }

                if (dashboardResponse.status === 403) {
                    throw new Error(
                        "Your account doesn't have permission to view the dashboard."
                    );
                }

                if (!dashboardResponse.ok) {
                    throw new Error("Failed to load admin dashboard.");
                }

                const data = await dashboardResponse.json();

                // Only show modules that have an active service head
                // (or admin/super admin) in the database.
                let activeHeadModules = new Set();
                if (usersResponse.ok) {
                    const users = await usersResponse.json();
                    (Array.isArray(users) ? users : []).forEach((u) => {
                        if (u?.accountStatus === "Active" || u?.status === "Active") {
                            if (u?.adminModule) activeHeadModules.add(u.adminModule);
                            if (u?.role === "SuperAdmin" || u?.role === "Admin") {
                                // System-level accounts keep the portal considered active.
                            }
                        }
                    });
                }

                if (Array.isArray(data.modules)) {
                    data.modules = data.modules.filter((m) =>
                        activeHeadModules.has(m?.name)
                    );
                }

                setDashboard({
                    totalUsers: data.totalUsers ?? 0,
                    totalStudents: data.totalStudents ?? 0,
                    totalFaculty: data.totalFaculty ?? 0,
                    modules: Array.isArray(data.modules) ? data.modules : [],
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
                    modules: [],
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
    // SKELETON
    // --------------------------------------------------

    const Bone = ({ className = "" }) => (
        <div
            className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`}
        />
    );

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

                                Welcome, Admin

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

                    <section>

                        <div className="mb-4 flex items-center justify-between">

                            <div>
                                <h2 className="font-display text-xl text-[#1F1F1F]">
                                    Student Usage per Module
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    Active students with activity in each service
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

                        {dashboard.modules && dashboard.modules.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {dashboard.modules.map((module, index) => {
                                    const accent =
                                        MODULE_ACCENTS[module.name] ||
                                        DEFAULT_ACCENT;

                                    const hasCount =
                                        typeof module.studentCount === "number";

                                    return (
                                        <div
                                            key={index}
                                            className="
                                                group
                                                relative
                                                overflow-hidden
                                                rounded-2xl
                                                border
                                                border-[#1F1F1F]/[0.06]
                                                bg-white
                                                p-5
                                                shadow-sm
                                                transition
                                                hover:-translate-y-0.5
                                                hover:shadow-md
                                            "
                                        >
                                            <div
                                                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10"
                                                style={{ background: accent.color }}
                                            />

                                            <div className="relative flex items-start justify-between">

                                                <span
                                                    className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                                                    style={{ background: accent.bg }}
                                                >
                                                    {module.icon}
                                                </span>

                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E1F0E4] px-2.5 py-1 text-[10px] font-semibold text-[#106A2E]">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-[#106A2E]" />
                                                    {module.status}
                                                </span>

                                            </div>

                                            <p className="relative mt-4 text-sm font-medium text-[#1F1F1F]">
                                                {module.name}
                                            </p>

                                            <div className="relative mt-1 flex items-end gap-1.5">

                                                <span className="text-4xl font-semibold tracking-tight text-[#1F1F1F]">
                                                    {hasCount ? module.studentCount : "—"}
                                                </span>

                                                <span className="mb-1 text-xs font-medium text-gray-400">
                                                    {hasCount
                                                        ? module.studentCount === 1
                                                            ? "student"
                                                            : "students"
                                                        : "N/A"}
                                                </span>

                                            </div>

                                            <p className="relative mt-2 text-[11px] leading-4 text-gray-400">
                                                {module.usageNote}
                                            </p>

                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-[#1F1F1F]/10 bg-white px-5 py-8 text-center">
                                <p className="text-sm text-gray-400">
                                    No module usage data available.
                                </p>
                            </div>
                        )}

                    </section>

                </div>

            </div>

        </div>
    );
}