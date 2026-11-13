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
        totalUsers: null,
        totalStudents: null,
        totalFaculty: null,
        modules: [],
    });

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [period, setPeriod] = useState("weekly");

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

                const dashboardResponse = await fetch(
                    `${API_URL}/api/admin/dashboard?period=${period}`,
                    {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {},
                    }
                );

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

                // Show every module the API reports. A module is no longer
                // hidden just because it has no active service head - the
                // usage counts are real activity, so Clinic must stay visible
                // even when it has no OneServe admin account yet.
                setDashboard({
                    ...data,
                    totalUsers: data.totalUsers ?? null,
                    totalStudents: data.totalStudents ?? null,
                    totalFaculty: data.totalFaculty ?? null,
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
                    totalUsers: null,
                    totalStudents: null,
                    totalFaculty: null,
                    modules: [],
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboard();
    }, [period]);

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

    const metricValue = (value) =>
        value === null || value === undefined ? "Unavailable" : value;

    const overviewStats = [
        ...stats,
        { label: "Active Users", value: dashboard.activeUsers, description: "Active accounts" },
        { label: "Inactive Users", value: dashboard.inactiveUsers, description: "Inactive accounts" },
        { label: "Total Administrators", value: dashboard.totalAdministrators ?? dashboard.totalAdmins, description: "Administrator accounts" },
        { label: "Pending Requests", value: dashboard.pendingRequests, description: "Accounts awaiting approval" },
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

                                Welcome, {adminName}

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

                                    <span className="text-[10px] font-semibold text-amber-300">
                                        ADMIN DASHBOARD

                                    </span>

                                </div>


                                <div className="mb-4 flex items-center justify-between">

                                    <div>

                                        <p className="text-sm font-semibold text-white">
                                            {dashboard.activeUsers == null ? "Status unavailable" : `${dashboard.activeUsers} active users`}
                                        </p>

                                        <p className="mt-0.5 text-[11px] text-white/50">
                                            Reported by the admin dashboard API
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
                                            {metricValue(dashboard.totalUsers)}
                                        </p>

                                    </div>


                                    <div className="rounded-xl border border-white/10 bg-black/10 p-3">

                                        <p className="text-[9px] uppercase tracking-wider text-white/40">
                                            Students
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-white">
                                            {metricValue(dashboard.totalStudents)}
                                        </p>

                                    </div>


                                    <div className="rounded-xl border border-white/10 bg-black/10 p-3">

                                        <p className="text-[9px] uppercase tracking-wider text-white/40">
                                            Faculty
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-white">
                                            {metricValue(dashboard.totalFaculty)}
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                <div className="mx-auto w-full max-w-[1500px] pt-6">

                    {loadError && (
                        <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            Dashboard data could not be refreshed: {loadError}
                        </div>
                    )}

                    <section aria-labelledby="admin-overview-heading" className="mb-8">
                        <div className="mb-4">
                            <h2 id="admin-overview-heading" className="font-display text-xl text-[#1F1F1F]">System overview</h2>
                            <p className="mt-1 text-xs text-gray-500">Values are supplied by the OneServe admin dashboard API.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {overviewStats.map((item) => (
                                <article key={item.label} className="rounded-2xl border border-[#1F1F1F]/[0.06] bg-white p-4 shadow-sm">
                                    <p className="text-xs font-medium text-gray-500">{item.label}</p>
                                    <p className="mt-2 text-2xl font-semibold text-[#1F1F1F]">{isLoading ? "…" : metricValue(item.value)}</p>
                                    <p className="mt-1 text-[11px] text-gray-400">{item.description}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <div className="mb-8 grid gap-5 xl:grid-cols-2">
                        <section aria-labelledby="registration-trends-heading" className="rounded-2xl border border-[#1F1F1F]/[0.06] bg-white p-5 shadow-sm">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 id="registration-trends-heading" className="font-display text-lg text-[#1F1F1F]">User registrations</h2>
                                    <p className="mt-1 text-xs text-gray-500">Counts grouped from account creation dates.</p>
                                </div>
                                <label className="text-xs font-medium text-gray-600">
                                    Period{" "}
                                    <select value={period} onChange={(event) => setPeriod(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </label>
                            </div>
                            {Array.isArray(dashboard.registrationTrends) && dashboard.registrationTrends.length ? (
                                <div className="flex h-44 items-end gap-1.5 overflow-x-auto border-b border-slate-100 pb-1">
                                    {dashboard.registrationTrends.map((point) => {
                                        const max = Math.max(1, ...dashboard.registrationTrends.map((entry) => entry.registrations || 0));
                                        const height = Math.max(4, ((point.registrations || 0) / max) * 132);
                                        return (
                                            <div key={point.label} title={`${point.label}: ${point.registrations} registrations`} className="flex h-full min-w-5 flex-1 flex-col items-center justify-end gap-1">
                                                <div className="w-full max-w-8 rounded-t-md bg-[#106A2E]" style={{ height }} />
                                                <span className="text-[9px] text-gray-400">{point.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="py-12 text-center text-sm text-gray-400">Registration trend data is unavailable.</p>
                            )}
                        </section>

                        <section aria-labelledby="system-health-heading" className="rounded-2xl border border-[#1F1F1F]/[0.06] bg-white p-5 shadow-sm">
                            <div className="mb-4">
                                <h2 id="system-health-heading" className="font-display text-lg text-[#1F1F1F]">System health</h2>
                                <p className="mt-1 text-xs text-gray-500">Live checks returned by the API.</p>
                            </div>
                            {dashboard.systemHealth?.components?.length ? (
                                <div className="space-y-2">
                                    {dashboard.systemHealth.components.map((component) => {
                                        const healthy = ["online", "enabled"].includes(String(component.status).toLowerCase());
                                        return (
                                            <div key={component.component} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                                <span className="text-sm text-slate-700">{component.name || component.component}</span>
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${healthy ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                                    {component.status || "Unavailable"}{component.latencyMs == null ? "" : ` · ${component.latencyMs} ms`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="py-12 text-center text-sm text-gray-400">Health check data is unavailable.</p>
                            )}
                        </section>
                    </div>

                    <section aria-labelledby="recent-activity-heading" className="mb-8 rounded-2xl border border-[#1F1F1F]/[0.06] bg-white p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 id="recent-activity-heading" className="font-display text-lg text-[#1F1F1F]">Recent administrator activities</h2>
                            <p className="mt-1 text-xs text-gray-500">Recent actions from the central audit log.</p>
                        </div>
                        {dashboard.recentActivities?.length ? (
                            <div className="divide-y divide-slate-100">
                                {dashboard.recentActivities.map((activity) => (
                                    <article key={activity.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{activity.action}</p>
                                            <p className="mt-1 text-xs text-slate-500">{activity.actorName || "Administrator"}{activity.actorRole ? ` · ${activity.actorRole}` : ""}{activity.module ? ` · ${activity.module}` : ""}</p>
                                        </div>
                                        <time className="text-xs text-slate-400">{activity.timestamp ? new Date(activity.timestamp).toLocaleString() : ""}</time>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="py-6 text-center text-sm text-gray-400">No administrator activity is available.</p>
                        )}
                    </section>

                    {/* ==================================================
                        MODULE MONITORING
                    ================================================== */}

                    <section>

                        <div className="mb-4 flex items-center justify-between">

                            <div>
                                <h2 className="font-display text-xl text-[#1F1F1F]">
                                    Service usage
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    Current student and Clinic integration activity reported by each module
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
                                {dashboard.modules?.length ? "Module data available" : "Module data unavailable"}
                            </span>

                        </div>

                        {dashboard.modules && dashboard.modules.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {dashboard.modules.map((module, index) => {
                                    const accent =
                                        MODULE_ACCENTS[module.name] ||
                                        DEFAULT_ACCENT;

                                    const hasCount =
                                        typeof module.studentCount === "number" || typeof module.activityCount === "number";
                                    const status = String(module.status || "Unavailable");
                                    const statusStyle = ["disabled", "offline", "degraded", "unknown"].some((value) => status.toLowerCase().includes(value))
                                        ? "bg-amber-100 text-amber-800"
                                        : status === "Unavailable"
                                            ? "bg-slate-100 text-slate-500"
                                            : "bg-[#E1F0E4] text-[#106A2E]";

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

                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyle}`}>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    {status}
                                                </span>

                                            </div>

                                            <p className="relative mt-4 text-sm font-medium text-[#1F1F1F]">
                                                {module.name}
                                            </p>

                                            <div className="relative mt-1 flex items-end gap-1.5">

                                                <span className="text-4xl font-semibold tracking-tight text-[#1F1F1F]">
                                                    {typeof module.studentCount === "number" ? module.studentCount : typeof module.activityCount === "number" ? module.activityCount : "—"}
                                                </span>

                                                <span className="mb-1 text-xs font-medium text-gray-400">
                                                    {hasCount
                                                        ? typeof module.studentCount === "number"
                                                            ? module.studentCount === 1
                                                            ? "student"
                                                            : "students"
                                                            : "CMS calls (24h)"
                                                        : "N/A"}
                                                </span>

                                            </div>

                                            <p className="relative mt-2 text-[11px] leading-4 text-gray-400">
                                                {module.usageNote || "No usage note supplied by the dashboard API."}
                                            </p>

                                            {module.path || ({ Library: "/admin/library", Guidance: "/admin/guidance", "Lost & Found": "/lost-found/admin" }[module.name]) ? (
                                                <button type="button" onClick={() => navigate(module.path || ({ Library: "/admin/library", Guidance: "/admin/guidance", "Lost & Found": "/lost-found/admin" }[module.name]))} className="relative mt-4 text-xs font-semibold text-[#106A2E] hover:underline">
                                                    Open service console →
                                                </button>
                                            ) : (
                                                <p className="relative mt-4 text-xs text-gray-400">The integration management page is not available here yet.</p>
                                            )}

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
