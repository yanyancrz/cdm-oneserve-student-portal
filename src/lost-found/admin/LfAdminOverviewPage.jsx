import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    Clock,
    HandHelping,
    PackageSearch,
    SearchCheck,
    Sparkles,
    TrendingUp,
} from "lucide-react";

import { lfAdminApi } from "../services/lfApi";
import { LfNotice, LfSkeleton, LfStatusChip, LfTypeTag } from "../components/lfUi";
import { formatItemId } from "../config/lfTheme";

// =====================================================
// The admin overview: the module's health at a glance -
// what needs review, what is in the pickup queue, and
// what landed most recently.
//
// Every number comes from the existing endpoints
// (/admin/stats + /admin/reports); nothing is invented
// and nothing is calculated differently from before.
// =====================================================

export default function LfAdminOverviewPage() {
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setError("");
        try {
            const [statsResponse, reportsResponse] = await Promise.all([
                lfAdminApi.stats(),
                lfAdminApi.reports(),
            ]);
            setStats(statsResponse.data);
            setReports(reportsResponse.data || []);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (cancelled) return;
            await load();
        })();

        return () => {
            cancelled = true;
        };
    }, [load]);

    if (error) {
        return (
            <div className="space-y-4">
                <LfNotice tone="bad">{error}</LfNotice>
            </div>
        );
    }

    if (!stats) return <LfSkeleton rows={4} />;

    // Lost / found split comes from the real report rows, so the
    // two counts can never disagree with the table below them.
    const lostCount = reports.filter((r) => r.reportType === "Lost").length;
    const foundCount = reports.filter((r) => r.reportType === "Found").length;
    const reviewQueue = stats.pendingReports + stats.processingClaims;

    const cards = [
        {
            label: "Total reports",
            value: stats.totalReports,
            note: `${foundCount} found · ${lostCount} lost`,
            icon: PackageSearch,
            tone: "text-[#106A2E] bg-[#106A2E]/10",
            to: "/lost-found/admin/reports",
        },
        {
            label: "Awaiting review",
            value: reviewQueue,
            note: `${stats.pendingReports} reports · ${stats.processingClaims} claims`,
            icon: Clock,
            tone: "text-amber-600 bg-amber-50",
            to: "/lost-found/admin/reports",
            urgent: reviewQueue > 0,
        },
        {
            label: "On the board",
            value: stats.publishedReports,
            note: `${stats.rejectedReports} rejected so far`,
            icon: SearchCheck,
            tone: "text-[#0D7856] bg-[#0D7856]/10",
            to: "/lost-found/admin/reports",
        },
        {
            label: "Awaiting pickup",
            value: stats.awaitingPickupClaims,
            note: `${stats.totalClaims} claims filed`,
            icon: HandHelping,
            tone: "text-sky-700 bg-sky-50",
            to: "/lost-found/admin/claims",
        },
        {
            label: "Returned to owners",
            value: stats.returnedClaims,
            note: `${stats.completedPickups} handovers recorded`,
            icon: CheckCircle2,
            tone: "text-emerald-700 bg-emerald-50",
            to: "/lost-found/admin/schedules",
        },
        {
            label: "Recovery at office",
            value: stats.atAdminOfficeRecovery,
            note: `${stats.totalRecovery} recovery reports`,
            icon: CalendarClock,
            tone: "text-purple-700 bg-purple-50",
        },
    ];

    const recent = [...reports]
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 6);

    return (
        <div className="space-y-5">
            {/* ---------- page heading ---------- */}
            <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-800">
                    Dashboard
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                    Review reports, decide claims, and run pickups for the FIND desk.
                </p>
            </div>

            {/* ---------- action banner ---------- */}
            {reviewQueue > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                            <Clock size={17} aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-amber-900">
                                {reviewQueue} item{reviewQueue === 1 ? "" : "s"} waiting for review
                            </p>
                            <p className="mt-0.5 text-xs text-amber-800">
                                {stats.pendingReports} report
                                {stats.pendingReports === 1 ? "" : "s"} and{" "}
                                {stats.processingClaims} claim
                                {stats.processingClaims === 1 ? "" : "s"} have not been decided yet.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/lost-found/admin/reports"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
                    >
                        Open reports <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                </div>
            )}

            {/* ---------- KPI grid ---------- */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => {
                    const Icon = card.icon;

                    const body = (
                        <>
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    {card.label}
                                </span>
                                <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.tone}`}
                                >
                                    <Icon size={17} aria-hidden="true" />
                                </span>
                            </div>
                            <p className="mt-2.5 text-3xl font-bold tracking-tight text-slate-800">
                                {card.value}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                {card.note}
                                {card.to && (
                                    <>
                                        <span aria-hidden="true">·</span>
                                        <span className="inline-flex items-center gap-0.5 font-semibold text-[#106A2E]">
                                            Open <ArrowRight size={11} aria-hidden="true" />
                                        </span>
                                    </>
                                )}
                            </p>
                        </>
                    );

                    return card.to ? (
                        <Link
                            key={card.label}
                            to={card.to}
                            className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#106A2E]/40 ${
                                card.urgent ? "border-amber-200" : "border-slate-200"
                            }`}
                        >
                            {body}
                        </Link>
                    ) : (
                        <section
                            key={card.label}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            {body}
                        </section>
                    );
                })}
            </div>

            {/* ---------- breakdowns + recent ---------- */}
            <div className="grid gap-4 xl:grid-cols-3">
                <StatusBreakdown
                    title="Report statuses"
                    rows={[
                        ["Pending review", stats.pendingReports],
                        ["Published", stats.publishedReports],
                        ["Rejected", stats.rejectedReports],
                        ["Returned to owner", stats.returnedReports],
                    ]}
                />
                <StatusBreakdown
                    title="Claim statuses"
                    rows={[
                        ["Processing", stats.processingClaims],
                        ["Awaiting pickup", stats.awaitingPickupClaims],
                        ["Rejected", stats.rejectedClaims],
                        ["Returned", stats.returnedClaims],
                    ]}
                />

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold text-slate-800">
                            Latest reports
                        </h2>
                        <Link
                            to="/lost-found/admin/reports"
                            className="text-xs font-semibold text-[#106A2E] hover:underline"
                        >
                            See all
                        </Link>
                    </div>

                    {recent.length === 0 ? (
                        <p className="mt-4 text-xs text-slate-400">
                            Nothing reported yet.
                        </p>
                    ) : (
                        <ul className="mt-3 space-y-1.5">
                            {recent.map((report) => (
                                <li key={report.reportId}>
                                    <Link
                                        to={`/lost-found/admin/reports/${report.reportId}`}
                                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition hover:bg-slate-50"
                                    >
                                        <span className="rounded-md bg-[#10231B] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white ring-1 ring-white/30">
                                            {formatItemId(report.reportId)}
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                                            {report.itemName}
                                        </span>
                                        <LfTypeTag type={report.reportType} />
                                        <LfStatusChip status={report.status} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {/* ---------- matches + recovery strip ---------- */}
            <div className="grid gap-4 sm:grid-cols-3">
                <MiniStat
                    icon={Sparkles}
                    label="Possible matches"
                    value={stats.totalMatches}
                    note={`${stats.confirmedMatches} confirmed by their owners`}
                />
                <MiniStat
                    icon={TrendingUp}
                    label="Handovers recorded"
                    value={stats.completedPickups}
                    note={`${stats.scheduledPickups} booked for a window`}
                />
                <MiniStat
                    icon={CalendarClock}
                    label="Recovery completed"
                    value={stats.completedRecovery}
                    note={`${stats.pendingRecovery} still pending`}
                />
            </div>
        </div>
    );
}

function StatusBreakdown({ title, rows }) {
    const max = Math.max(...rows.map(([, value]) => value), 1);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            <div className="mt-4 space-y-3.5">
                {rows.map(([label, value]) => (
                    <div key={label}>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">{label}</span>
                            <span className="font-semibold text-slate-800">{value}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#106A2E] to-[#0D7856]"
                                style={{ width: `${(value / max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function MiniStat({ icon: Icon, label, value, note }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                    <Icon size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {label}
                    </p>
                    <p className="text-xl font-bold text-slate-800">{value}</p>
                </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">{note}</p>
        </div>
    );
}
