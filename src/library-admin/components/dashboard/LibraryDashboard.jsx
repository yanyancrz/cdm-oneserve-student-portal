import { useCallback, useEffect, useState } from "react";
import {
    BookCopy,
    BookMarked,
    BookOpen,
    BookPlus,
    BarChart3,
    CalendarClock,
    GraduationCap,
    HandHelping,
    RotateCcw,
    TriangleAlert,
    Users,
    UserRound,
} from "lucide-react";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import StatCard from "../components/dashboard/StatCard";
import QuickActionCard from "../components/dashboard/QuickActionCard";
import OverdueTable from "../components/dashboard/OverdueTable";
import RecentActivity from "../components/dashboard/RecentActivity";
import ReservationAlert from "../components/dashboard/ReservationAlert";

import { LIBRARY_BASE } from "../config/navigation";
import { useLibrary } from "../context/LibraryContext";
import { usePolling } from "../hooks/usePolling";
import { libraryDashboardService } from "../services/libraryDashboardService";

const POLL_INTERVAL_MS = 3000;

const STAT_CARDS = [
    { key: "totalCatalogBooks", label: "Total Catalog Books", icon: BookOpen, tone: "green" },
    { key: "totalPhysicalCopies", label: "Total Physical Copies", icon: BookCopy, tone: "teal" },
    { key: "activeBorrowedBooks", label: "Active Borrowed Books", icon: BookMarked, tone: "green" },
    { key: "overdueBooks", label: "Overdue Books", icon: TriangleAlert, tone: "red" },
    { key: "pendingReservations", label: "Pending Reservations", icon: CalendarClock, tone: "amber" },
    { key: "studentPatrons", label: "Student Patrons", icon: GraduationCap, tone: "teal" },
    { key: "facultyPatrons", label: "Faculty Patrons", icon: UserRound, tone: "gray" },
];

const QUICK_ACTIONS = [
    { label: "Borrow Book", description: "Issue a book to a patron", to: `${LIBRARY_BASE}/borrow`, icon: HandHelping },
    { label: "Process Return", description: "Return a borrowed book", to: `${LIBRARY_BASE}/returns`, icon: RotateCcw },
    { label: "View Reservations", description: "Approve or reject requests", to: `${LIBRARY_BASE}/reservations`, icon: CalendarClock },
    { label: "Add Book", description: "Add a title to the catalog", to: `${LIBRARY_BASE}/books`, icon: BookPlus },
    { label: "Student Directory", description: "Browse student patrons", to: `${LIBRARY_BASE}/students`, icon: GraduationCap },
    { label: "Faculty Directory", description: "Browse faculty patrons", to: `${LIBRARY_BASE}/faculty`, icon: Users },
    { label: "Generate Reports", description: "Circulation and usage", to: `${LIBRARY_BASE}/reports`, icon: BarChart3 },
];

export default function LibraryDashboard() {
    const { permissions } = useLibrary();

    // Only the Library Head can switch to the whole team's activity.
    const canViewAll = Boolean(permissions?.canManageStaff);
    const [scope, setScope] = useState("mine");

    const fetchSnapshot = useCallback(
        (signal) => libraryDashboardService.getSnapshot(signal, scope),
        [scope]
    );

    const { data, error, loading, refresh } = usePolling(fetchSnapshot, {
        interval: POLL_INTERVAL_MS,
    });

    // Refresh right away when the toggle changes instead of waiting 3 seconds.
    useEffect(() => {
        refresh();
    }, [scope, refresh]);

    const stats = data?.stats;
    const hasData = Boolean(data);

    // First load failed and there is nothing to show yet.
    if (!loading && !hasData && error) {
        return (
            <>
                <LibraryPageHeader
                    title="Dashboard"
                    description="Library statistics, overdue books, and recent activity."
                />

                <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
                    <p className="text-sm font-medium text-gray-700">Unable to load the dashboard.</p>
                    <p className="mt-1 text-xs text-gray-400">{error}</p>

                    <button
                        type="button"
                        onClick={refresh}
                        className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        Try again
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <LibraryPageHeader
                title="Dashboard"
                description="Library statistics, overdue books, and recent activity."
            />

            <div className="space-y-6">
                {/* A background refresh failed, but the last good data is still shown. */}
                {hasData && error && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                        Live updates are paused: {error} Showing the last loaded data.
                    </div>
                )}

                <ReservationAlert
                    count={stats?.pendingReservations}
                    to={`${LIBRARY_BASE}/reservations`}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {STAT_CARDS.map((card) => (
                        <StatCard
                            key={card.key}
                            label={card.label}
                            icon={card.icon}
                            tone={card.tone}
                            value={stats?.[card.key]}
                            loading={loading && !hasData}
                        />
                    ))}
                </div>

                <section>
                    <h2 className="mb-3 text-sm font-semibold text-[#1F1F1F]">Quick Actions</h2>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {QUICK_ACTIONS.map((action) => (
                            <QuickActionCard key={action.label} {...action} />
                        ))}
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                        <OverdueTable items={data?.overdue} loading={loading && !hasData} />
                    </div>

                    <RecentActivity
                        items={data?.activity}
                        loading={loading && !hasData}
                        canViewAll={canViewAll}
                        scope={scope}
                        onScopeChange={setScope}
                    />
                </div>
            </div>
        </>
    );
}