import AdminPageHeader from "./AdminPageHeader";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
        <div className="admin-page relative z-10">

            <div className="w-full">

                <AdminPageHeader icon="dashboard" title={`Welcome, ${adminName}`} description="Monitor campus service usage and registered accounts.">
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                        {dashboard.activeUsers == null ? "Account status unavailable" : `${dashboard.activeUsers} active users`}
                    </div>
                </AdminPageHeader>

                <div className="w-full">

                    {loadError && (
                        <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            Dashboard data could not be refreshed: {loadError}
                        </div>
                    )}

                    <section aria-labelledby="admin-overview-heading" className="mb-8">
                        <div className="mb-4">
                            <h2 id="admin-overview-heading" className="font-semibold text-xl text-[#1F1F1F]">System overview</h2>
                            <p className="mt-1 text-xs text-gray-500">Registered accounts across OneServe.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {overviewStats.map((item) => (
                                <article key={item.label} className="admin-surface rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <p className="text-xs font-medium text-gray-500">{item.label}</p>
                                    <p className="mt-2 text-2xl font-semibold text-[#1F1F1F]">{isLoading ? "…" : metricValue(item.value)}</p>
                                    <p className="mt-1 text-[11px] text-gray-400">{item.description}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* ==================================================
                        MODULE MONITORING
                    ================================================== */}

                    <section aria-labelledby="service-usage-heading" className="mb-8">

                        <div className="mb-4 flex items-center justify-between">

                            <div>
                                <h2 id="service-usage-heading" className="font-semibold text-xl text-[#1F1F1F]">
                                    Service usage
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    Unique users per service. Each user is counted once within each service.
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

                                    const userCount = module.userCount;

                                    return (
                                        <div
                                            key={index}
                                            className="
                                                group
                                                relative
                                                overflow-hidden
                                                rounded-2xl
                                                border
                                                border-gray-200
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



                                            </div>

                                            <p className="relative mt-4 text-sm font-medium text-[#1F1F1F]">
                                                {module.name}
                                            </p>

                                            <div className="relative mt-1 flex items-end gap-1.5">

                                                <span className="text-4xl font-semibold tracking-tight text-[#1F1F1F]">
                                                    {isLoading ? "..." : metricValue(userCount)}
                                                </span>

                                                <span className="mb-1 text-xs font-medium text-gray-400">
                                                    {typeof userCount === "number" ? (userCount === 1 ? "user" : "users") : ""}
                                                </span>

                                            </div>

                                            <p className="relative mt-2 text-[11px] leading-4 text-gray-400">
                                                {module.usageNote || "No usage note supplied by the dashboard API."}
                                            </p>
                                            {module.name === "Clinic" && <Link to="/admin/services/clinic?view=records" className="relative mt-4 inline-block text-xs font-semibold text-[#106A2E] hover:underline">View medical records</Link>}



                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="admin-surface rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center">
                                <p className="text-sm text-gray-400">
                                    No module usage data available.
                                </p>
                            </div>
                        )}

                    </section>

                    <div className="mb-8 grid gap-5">
                        <section aria-labelledby="registration-trends-heading" className="admin-surface rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 id="registration-trends-heading" className="font-semibold text-lg text-[#1F1F1F]">User registrations</h2>
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
                                                <div className="w-full max-w-8 rounded-t-md bg-[#0E3B22]" style={{ height }} />
                                                <span className="text-[9px] text-gray-400">{point.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="py-12 text-center text-sm text-gray-400">Registration trend data is unavailable.</p>
                            )}
                        </section>
                    </div>

                </div>

            </div>

        </div>
    );
}
