import { useEffect, useState } from "react";
import { BarChart3, CalendarCheck2, NotebookPen, UserRoundX } from "lucide-react";

import KpiCard from "../components/dashboard/KpiCard";
import { EmptyState, PageHeader } from "../components/common";
import guidanceHeadService from "../services/guidanceHeadService";
import { formatDate, formatNumber } from "../utils/format";

const PERIODS = [
    { days: 7, label: "Last 7 days" },
    { days: 30, label: "Last 30 days" },
    { days: 90, label: "Last 3 months" },
    { days: 365, label: "Last 12 months" },
];

const STATUS_COLORS = {
    Pending: "#E0A400",
    Confirmed: "#2F80ED",
    Completed: "#106A2E",
    Cancelled: "#9CA3AF",
    Rejected: "#DC2626",
    Expired: "#6B7280",
};

const ACCENT = "#106A2E";

function BarList({ items, color = ACCENT, empty }) {
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
                                background: item.color || color,
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

// Column chart built from plain CSS - no chart library in this project.
function ColumnChart({ items, color = ACCENT }) {
    const max = Math.max(1, ...items.map((i) => i.count));

    if (!items.length) {
        return <p className="px-5 py-8 text-center text-sm text-gray-400">No data in this period.</p>;
    }

    return (
        <div className="px-5 py-5">
            <div className="flex h-40 items-end gap-2">
                {items.map((item) => (
                    <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                        <span className="text-[10px] font-medium text-gray-500">
                            {item.count}
                        </span>

                        <div
                            className="w-full rounded-t-md transition-all"
                            style={{
                                height: `${Math.max(4, Math.round((item.count / max) * 100))}%`,
                                background: color,
                                opacity: item.count === 0 ? 0.25 : 1,
                            }}
                            title={`${item.label}: ${item.count}`}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-2 flex gap-2 border-t border-black/[0.06] pt-2">
                {items.map((item) => (
                    <span
                        key={item.label}
                        className="flex-1 text-center text-[10px] leading-tight text-gray-400"
                    >
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function GuidanceReportsPage() {
    const [days, setDays] = useState(30);
    const [report, setReport] = useState(null);
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
                .getReports(days, { signal: controller.signal })
                .then(setReport)
                .catch((err) => {
                    if (err?.name === "AbortError") return;
                    setError(err?.message || "Unable to load the report.");
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        });

        return () => controller.abort();
    }, [days, reloadKey]);

    const appointmentsTotal = (report?.appointmentsByStatus || []).reduce(
        (sum, i) => sum + i.count,
        0
    );
    const completed = report?.appointmentsByStatus?.find((i) => i.label === "Completed")?.count ?? 0;
    const sessionsTotal = (report?.sessionsByMonth || []).reduce((sum, i) => sum + i.count, 0);
    const neverSignedIn = report?.accounts
        ? report.accounts.neverSignedInStudents + report.accounts.neverSignedInCounselors
        : 0;

    return (
        <>
            <PageHeader
                eyebrow="Insights"
                icon={BarChart3}
                title="Reports"
                description="How the Guidance module is being used over a chosen period."
                loading={loading && !report}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            aria-label="Reporting period"
                            className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#106A2E]"
                        >
                            {PERIODS.map((p) => (
                                <option key={p.days} value={p.days}>
                                    {p.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => setReloadKey((n) => n + 1)}
                            className="rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                            Refresh
                        </button>
                    </div>
                }
            />

            {error && !report && (
                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {report && (
                <p className="-mt-4 mb-6 text-xs text-gray-400">
                    {formatDate(report.from)} – {formatDate(report.to)}
                </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    loading={loading && !report}
                    icon={CalendarCheck2}
                    label="Appointments"
                    value={formatNumber(appointmentsTotal)}
                    sub="Booked in this period"
                />
                <KpiCard
                    loading={loading && !report}
                    icon={CalendarCheck2}
                    label="Completed"
                    value={formatNumber(completed)}
                    sub="Sessions that took place"
                    tone="blue"
                />
                <KpiCard
                    loading={loading && !report}
                    icon={NotebookPen}
                    label="Records written"
                    value={formatNumber(sessionsTotal)}
                    sub="Counseling records"
                    tone="amber"
                />
                <KpiCard
                    loading={loading && !report}
                    icon={UserRoundX}
                    label="Never signed in"
                    value={formatNumber(neverSignedIn)}
                    sub="Students and counselors"
                    tone={neverSignedIn > 0 ? "red" : "green"}
                />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    <div className="border-b border-black/[0.06] px-5 py-4">
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">
                            Appointments by status
                        </h2>
                    </div>
                    <BarList
                        items={(report?.appointmentsByStatus || []).map((i) => ({
                            ...i,
                            color: STATUS_COLORS[i.label],
                        }))}
                        empty="No appointments in this period."
                    />
                </section>

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    <div className="border-b border-black/[0.06] px-5 py-4">
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">Top concerns</h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                            Why students book, most common first
                        </p>
                    </div>
                    <BarList
                        items={report?.appointmentsByConcern || []}
                        color="#2F80ED"
                        empty="No concerns recorded in this period."
                    />
                </section>

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    <div className="border-b border-black/[0.06] px-5 py-4">
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">
                            Appointments by month
                        </h2>
                    </div>
                    <ColumnChart items={report?.appointmentsByMonth || []} />
                </section>

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    <div className="border-b border-black/[0.06] px-5 py-4">
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">
                            Counseling records by month
                        </h2>
                    </div>
                    <ColumnChart
                        items={report?.sessionsByMonth || []}
                        color="#2F80ED"
                    />
                </section>
            </div>

            <section className="mt-6 rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                <div className="border-b border-black/[0.06] px-5 py-4">
                    <h2 className="text-sm font-semibold text-[#1F1F1F]">
                        Counselor performance
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-400">
                        Appointments handled and records written in this period
                    </p>
                </div>

                {loading && !report ? (
                    <div className="space-y-3 p-5" aria-busy="true">
                        {[0, 1, 2].map((n) => (
                            <div key={n} className="h-12 animate-pulse rounded-lg bg-gray-100" />
                        ))}
                    </div>
                ) : !report?.counselors?.length ? (
                    <EmptyState
                        icon={BarChart3}
                        title="No counselors yet."
                        description="Add a counselor account to start tracking activity."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-black/[0.06] text-[11px] uppercase tracking-wide text-gray-400">
                                    <th className="px-4 py-3 font-medium">Counselor</th>
                                    <th className="px-4 py-3 font-medium">Appointments</th>
                                    <th className="px-4 py-3 font-medium">Completed</th>
                                    <th className="px-4 py-3 font-medium">Records</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-black/[0.04]">
                                {report.counselors.map((c) => (
                                    <tr key={c.fullName}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                            {c.fullName}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatNumber(c.appointments)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatNumber(c.completed)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatNumber(c.sessions)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {report?.accounts && (
                <section className="mt-6 rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-[#1F1F1F]">Account activity</h2>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            ["Signed in, last 7 days", report.accounts.signedInLast7Days],
                            ["Signed in, last 30 days", report.accounts.signedInLast30Days],
                            ["Students never signed in", report.accounts.neverSignedInStudents],
                            ["Counselors never signed in", report.accounts.neverSignedInCounselors],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="rounded-xl bg-[#FAFAF7] px-4 py-3"
                            >
                                <dt className="text-xs text-gray-500">{label}</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-800">
                                    {formatNumber(value)}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            )}
        </>
    );
}
