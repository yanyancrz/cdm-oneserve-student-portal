import { useEffect, useState } from "react";
import {
    CalendarCheck2,
    GraduationCap,
    MessageSquareMore,
    NotebookPen,
    UserRoundX,
    UsersRound,
} from "lucide-react";

import KpiCard from "../components/dashboard/KpiCard";
import { PageHeader, StatusBadge } from "../components/common";
import guidanceHeadService from "../services/guidanceHeadService";
import { formatNumber, formatRelative } from "../utils/format";

const STATUS_COLORS = {
    Pending: "#E0A400",
    Confirmed: "#2F80ED",
    Completed: "#106A2E",
    Cancelled: "#9CA3AF",
    Rejected: "#DC2626",
    Expired: "#6B7280",
};

const ACTIVITY_ICONS = {
    appointment: CalendarCheck2,
    session: NotebookPen,
    account: UsersRound,
    chat: MessageSquareMore,
    "follow-up": NotebookPen,
};

function BarList({ items, empty = "Nothing to show yet." }) {
    const max = Math.max(1, ...items.map((i) => i.count));

    if (!items.length) {
        return <p className="px-5 py-8 text-center text-sm text-gray-400">{empty}</p>;
    }

    return (
        <ul className="space-y-3 px-5 py-5">
            {items.map((item) => (
                <li key={item.label}>
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700">{item.label}</span>
                        <span className="text-gray-500">{item.count}</span>
                    </div>

                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${Math.round((item.count / max) * 100)}%`,
                                background: item.color || "#106A2E",
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

export default function GuidanceDashboardPage() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        // Deferred so the effect body never sets state synchronously.
        queueMicrotask(() => {
            setLoading(true);
            setError(null);

            guidanceHeadService
                .getOverview({ signal: controller.signal })
                .then(setOverview)
                .catch((err) => {
                    if (err?.name === "AbortError") return;
                    setError(err?.message || "Unable to load the dashboard.");
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        });

        return () => controller.abort();
    }, [reloadKey]);

    const stats = overview?.appointments;
    const statusItems = stats
        ? [
              { label: "Pending", count: stats.pending, color: STATUS_COLORS.Pending },
              { label: "Confirmed", count: stats.confirmed, color: STATUS_COLORS.Confirmed },
              { label: "Completed", count: stats.completed, color: STATUS_COLORS.Completed },
              { label: "Cancelled", count: stats.cancelled, color: STATUS_COLORS.Cancelled },
              { label: "Rejected", count: stats.rejected, color: STATUS_COLORS.Rejected },
              { label: "Expired", count: stats.expired, color: STATUS_COLORS.Expired },
          ].filter((i) => i.count > 0)
        : [];

    const neverSignedIn =
        (overview?.students.neverSignedIn ?? 0) + (overview?.counselors.neverSignedIn ?? 0);

    return (
        <>
            <PageHeader
                eyebrow="Guidance"
                icon={CalendarCheck2}
                title="Dashboard"
                description="Appointments, sessions, counseling accounts and chat activity across the Guidance module."
                loading={loading && !overview}
                actions={
                    <button
                        type="button"
                        onClick={() => setReloadKey((n) => n + 1)}
                        className="rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                        Refresh
                    </button>
                }
            />

            {error && !overview && (
                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <KpiCard
                    loading={loading && !overview}
                    icon={UsersRound}
                    label="Counselors"
                    value={formatNumber(overview?.counselors.total)}
                    sub={`${overview?.counselors.active ?? 0} active · ${
                        overview?.counselors.inactive ?? 0
                    } inactive`}
                />
                <KpiCard
                    loading={loading && !overview}
                    icon={GraduationCap}
                    label="Students & Faculty"
                    value={formatNumber(overview?.students.total)}
                    sub={`${overview?.students.newThisMonth ?? 0} joined this month`}
                    tone="blue"
                />
                <KpiCard
                    loading={loading && !overview}
                    icon={CalendarCheck2}
                    label="Appointments"
                    value={formatNumber(overview?.appointments.total)}
                    sub={`${overview?.appointments.pending ?? 0} pending · ${
                        overview?.appointments.today ?? 0
                    } today`}
                    tone="amber"
                />
                <KpiCard
                    loading={loading && !overview}
                    icon={NotebookPen}
                    label="Counseling sessions"
                    value={formatNumber(overview?.sessions.records)}
                    sub={`${overview?.sessions.finalized ?? 0} finalized · ${
                        overview?.sessions.followUpsPending ?? 0
                    } follow-ups pending`}
                />
                <KpiCard
                    loading={loading && !overview}
                    icon={MessageSquareMore}
                    label="Chat messages"
                    value={formatNumber(overview?.chat.messages)}
                    sub={`${overview?.chat.messagesLast24Hours ?? 0} in the last 24h · ${
                        overview?.chat.unreadMessages ?? 0
                    } unread`}
                    tone="blue"
                />
                <KpiCard
                    loading={loading && !overview}
                    icon={UserRoundX}
                    label="Never signed in"
                    value={formatNumber(neverSignedIn)}
                    sub="Accounts that have never opened OneServe"
                    tone={neverSignedIn > 0 ? "red" : "green"}
                />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-5">
                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm lg:col-span-2">
                    <div className="border-b border-black/[0.06] px-5 py-4">
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">
                            Appointments by status
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400">All time</p>
                    </div>

                    <BarList
                        items={statusItems}
                        empty="No appointments recorded yet."
                    />
                </section>

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm lg:col-span-3">
                    <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
                        <div>
                            <h2 className="text-sm font-semibold text-[#1F1F1F]">
                                Recent activity
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-400">
                                Latest sign-ins, bookings, sessions and chat
                            </p>
                        </div>
                    </div>

                    {loading && !overview ? (
                        <div className="space-y-3 p-5" aria-busy="true">
                            {[0, 1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-12 animate-pulse rounded-lg bg-gray-100" />
                            ))}
                        </div>
                    ) : !overview?.recentActivity?.length ? (
                        <p className="px-5 py-10 text-center text-sm text-gray-400">
                            Nothing has happened yet.
                        </p>
                    ) : (
                        <ul className="divide-y divide-black/[0.04]">
                            {overview.recentActivity.map((item, index) => {
                                const Icon = ACTIVITY_ICONS[item.kind] || CalendarCheck2;

                                return (
                                    <li key={`${item.kind}-${index}`} className="flex gap-3 px-5 py-3.5">
                                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E1F0E4] text-[#106A2E]">
                                            <Icon size={15} aria-hidden="true" />
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-medium text-gray-800">
                                                    {item.title}
                                                </p>
                                                <StatusBadge tone="gray">{item.kind}</StatusBadge>
                                            </div>

                                            <p className="truncate text-xs text-gray-500">
                                                {item.detail || "—"}
                                            </p>
                                        </div>

                                        <span
                                            className="shrink-0 text-xs text-gray-400"
                                            title={item.at}
                                        >
                                            {formatRelative(item.at)}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>

            {!loading && !overview && !error && (
                <p className="mt-8 text-center text-sm text-gray-400">
                    No guidance data yet.
                </p>
            )}
        </>
    );
}
