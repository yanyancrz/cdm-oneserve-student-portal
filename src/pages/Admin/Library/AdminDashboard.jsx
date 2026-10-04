import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    BookOpen,
    BookPlus,
    BookMarked,
    CheckCircle2,
    FileBarChart,
    LibraryBig,
    QrCode,
    RotateCcw,
    UserPlus,
    Users,
} from "lucide-react";

import { API_URL } from "../../../config/api";

// =========================================================
// ROUTES — palitan kung iba ang paths ng admin pages mo
// =========================================================

const ROUTES = {
    borrow: "/admin/library/borrow",
    returns: "/admin/library/returns",
    reservations: "/admin/library/reservations",
    addBook: "/admin/library/catalog",
    students: "/admin/library/students",
    reports: "/admin/library/reports",
};

const POLL_MS = 3000;

// =========================================================
// HELPERS
// =========================================================

const authHeaders = () => {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

    return token ? { Authorization: `Bearer ${token}` } : {};
};

const peso = (value) =>
    `₱${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "—";

const timeAgo = (iso) => {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) return "";

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return formatDate(iso);
};

const ACTIVITY_TONE = {
    Reserve: "bg-amber-50 text-amber-600",
    CancelReservation: "bg-slate-100 text-slate-500",
    ClaimReservation: "bg-emerald-50 text-[#106A2E]",
    Borrow: "bg-blue-50 text-blue-600",
    Return: "bg-emerald-50 text-[#106A2E]",
};

const Skeleton = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded-xl bg-slate-200 ${className}`}
    />
);

// =========================================================
// PAGE
// =========================================================

export default function LibraryAdminDashboard() {
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/library/admin/dashboard`,
                { headers: authHeaders() }
            );

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}.`);
            }

            const json = await response.json();

            setData(json?.data ?? null);
            setError("");
        } catch (err) {
            console.error("Admin dashboard error:", err);
            setError(err?.message || "Unable to load dashboard.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load + polling kada 3 segundo + window focus
    useEffect(() => {
        load();

        const timer = setInterval(load, POLL_MS);
        const onFocus = () => load();

        window.addEventListener("focus", onFocus);

        return () => {
            clearInterval(timer);
            window.removeEventListener("focus", onFocus);
        };
    }, [load]);

    const stats = data?.stats;
    const overdue = data?.overdue ?? [];
    const activities = data?.activities ?? [];
    const finePerDay = data?.finePerDay ?? 10;

    const metrics = [
        {
            label: "Total books",
            value: stats?.totalBooks,
            hint: "In the catalog",
            icon: LibraryBig,
            tone: "bg-emerald-50 text-[#106A2E]",
        },
        {
            label: "Active borrowed",
            value: stats?.activeBorrowed,
            hint: "Currently on loan",
            icon: BookOpen,
            tone: "bg-blue-50 text-blue-600",
        },
        {
            label: "Overdue",
            value: stats?.overdueCount,
            hint: "Past due date",
            icon: AlertTriangle,
            tone: "bg-red-50 text-red-600",
            alert: (stats?.overdueCount ?? 0) > 0,
        },
        {
            label: "Active reservations",
            value: stats?.activeReservations,
            hint: "Awaiting pickup",
            icon: BookMarked,
            tone: "bg-amber-50 text-amber-600",
        },
        {
            label: "Registered patrons",
            value: stats?.registeredStudents,
            hint: "Students and faculty",
            icon: Users,
            tone: "bg-emerald-50 text-[#106A2E]",
        },
    ];

    const quickActions = [
        { label: "Scan QR / Borrow", icon: QrCode, to: ROUTES.borrow },
        { label: "Process return", icon: RotateCcw, to: ROUTES.returns },
        { label: "Reservations", icon: BookMarked, to: ROUTES.reservations },
        { label: "Add new book", icon: BookPlus, to: ROUTES.addBook },
        { label: "Register student", icon: UserPlus, to: ROUTES.students },
        { label: "Generate reports", icon: FileBarChart, to: ROUTES.reports },
    ];

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div className="min-h-screen bg-[#F7F8F5] px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                {/* HEADER */}

                <section className="mb-6 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium text-slate-400">
                            {today}
                        </p>

                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
                            Library Dashboard
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Circulation overview for CDM Library
                        </p>
                    </div>

                    <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:inline-flex">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Live
                    </span>
                </section>

                {error && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* METRICS */}

                <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
                    {metrics.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.label}
                                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                                    item.alert
                                        ? "border-red-200"
                                        : "border-slate-200"
                                }`}
                            >
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}
                                >
                                    <Icon size={19} />
                                </div>

                                {loading ? (
                                    <Skeleton className="mt-3 h-7 w-14" />
                                ) : (
                                    <p
                                        className={`mt-3 text-2xl font-semibold ${
                                            item.alert
                                                ? "text-red-600"
                                                : "text-slate-800"
                                        }`}
                                    >
                                        {item.value ?? "—"}
                                    </p>
                                )}

                                <p className="mt-0.5 text-xs font-semibold text-slate-700">
                                    {item.label}
                                </p>

                                <p className="text-[11px] text-slate-400">
                                    {item.hint}
                                </p>
                            </div>
                        );
                    })}
                </section>

                {/* QUICK ACTIONS */}

                <section className="mb-8">
                    <h2 className="mb-3 text-lg font-semibold text-slate-800">
                        Quick actions
                    </h2>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {quickActions.map((action) => {
                            const Icon = action.icon;

                            return (
                                <button
                                    key={action.label}
                                    type="button"
                                    onClick={() => navigate(action.to)}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#106A2E]">
                                        <Icon size={19} />
                                    </div>

                                    <p className="mt-3 text-sm font-semibold text-slate-800">
                                        {action.label}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* OVERDUE + ACTIVITY */}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
                    {/* OVERDUE CENTER */}

                    <section>
                        <div className="mb-3 flex items-end justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Overdue notices
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-400">
                                    Fine rate: {peso(finePerDay)} per day
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate(ROUTES.returns)}
                                className="text-xs font-semibold text-[#106A2E]"
                            >
                                Process returns
                            </button>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full" />
                                ))}
                            </div>
                        ) : overdue.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                                <CheckCircle2
                                    size={30}
                                    className="mx-auto text-emerald-500"
                                />

                                <p className="mt-2 text-sm font-semibold text-slate-600">
                                    No overdue books
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    All borrowed books are within their due date.
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {overdue.map((item) => (
                                    <li
                                        key={item.borrowId}
                                        className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-white p-4 shadow-sm"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                {item.bookTitle}
                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {item.studentName}
                                                {item.studentNumber
                                                    ? ` · ${item.studentNumber}`
                                                    : ""}
                                            </p>

                                            <p className="mt-1 text-[11px] text-slate-400">
                                                Due {formatDate(item.dueDate)}
                                                {item.contactNumber
                                                    ? ` · ${item.contactNumber}`
                                                    : ""}
                                            </p>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                                                {item.daysOverdue}{" "}
                                                {item.daysOverdue === 1
                                                    ? "day"
                                                    : "days"}{" "}
                                                late
                                            </span>

                                            <p className="mt-1.5 text-sm font-semibold text-red-600">
                                                {peso(item.fine)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* RECENT ACTIVITY */}

                    <section>
                        <div className="mb-3">
                            <h2 className="text-lg font-semibold text-slate-800">
                                Recent activity
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-400">
                                Borrows, returns, and reservations
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                            {loading ? (
                                <div className="space-y-2 p-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : activities.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-slate-400">
                                    No recent activity
                                </p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {activities.map((item, index) => (
                                        <li
                                            key={`${item.createdAt}-${index}`}
                                            className="flex items-center gap-3 px-3 py-3"
                                        >
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                    ACTIVITY_TONE[
                                                        item.activityType
                                                    ] ||
                                                    "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-slate-800">
                                                    {item.title}
                                                </p>

                                                <p className="truncate text-[11px] text-slate-400">
                                                    {item.studentName}
                                                    {item.description
                                                        ? ` · ${item.description}`
                                                        : ""}
                                                </p>
                                            </div>

                                            <span className="shrink-0 text-[10px] text-slate-300">
                                                {timeAgo(item.createdAt)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}