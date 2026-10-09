import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    CalendarClock,
    HandHelping,
    PackageSearch,
    SearchCheck,
} from "lucide-react";

import { lfAdminApi } from "../services/lfApi";
import { LfNotice, LfSkeleton } from "../components/lfUi";

// =====================================================
// The admin overview: the module's health at a
// glance - what needs review, what is in the
// pickup queue.
// =====================================================

export default function LfAdminOverviewPage() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const response = await lfAdminApi.stats();
                if (!cancelled) setStats(response.data);
            } catch (err) {
                if (!cancelled) setError(err.message);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    if (error) return <LfNotice tone="bad">{error}</LfNotice>;
    if (!stats) return <LfSkeleton rows={3} />;

    const reviewQueue = stats.pendingReports + stats.pendingClaims;

    return (
        <div className="space-y-5">
            {reviewQueue > 0 && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
                    <p className="text-sm font-semibold text-amber-900">
                        {reviewQueue} item{reviewQueue === 1 ? "" : "s"} waiting for review
                    </p>
                    <p className="mt-0.5 text-xs text-amber-800">
                        {stats.pendingReports} report{stats.pendingReports === 1 ? "" : "s"} and{" "}
                        {stats.pendingClaims} claim{stats.pendingClaims === 1 ? "" : "s"}
                        {" "}have not been decided yet.
                    </p>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={SearchCheck}
                    label="Reports"
                    value={stats.totalReports}
                    detail={`${stats.approvedReports} approved · ${stats.claimedReports} claimed`}
                    to="/lost-found/admin/reports"
                />
                <StatCard
                    icon={HandHelping}
                    label="Claims"
                    value={stats.totalClaims}
                    detail={`${stats.pendingClaims} pending · ${stats.completedClaims} completed`}
                    to="/lost-found/admin/claims"
                />
                <StatCard
                    icon={CalendarClock}
                    label="Pickups"
                    value={stats.scheduledPickups}
                    detail={`${stats.completedPickups} completed handovers`}
                    to="/lost-found/admin/schedules"
                />
                <StatCard
                    icon={PackageSearch}
                    label="Recovery"
                    value={stats.totalRecovery}
                    detail={`${stats.atAdminOfficeRecovery} at the office`}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <StatusBreakdown
                    title="Report statuses"
                    rows={[
                        ["Pending review", stats.pendingReports],
                        ["Approved", stats.approvedReports],
                        ["Rejected", stats.rejectedReports],
                        ["Claimed", stats.claimedReports],
                    ]}
                />
                <StatusBreakdown
                    title="Claim statuses"
                    rows={[
                        ["Pending", stats.pendingClaims],
                        ["Approved", stats.approvedClaims],
                        ["Rejected", stats.rejectedClaims],
                        ["Completed", stats.completedClaims],
                    ]}
                />
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, detail, to }) {
    const inner = (
        <>
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#106A2E]/5 text-[#106A2E]">
                    <Icon size={17} aria-hidden="true" />
                </span>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
                {value}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                {detail}
                {to && (
                    <>
                        ·
                        <span className="inline-flex items-center gap-0.5 font-semibold text-[#106A2E]">
                            Open <ArrowRight size={11} aria-hidden="true" />
                        </span>
                    </>
                )}
            </p>
        </>
    );

    if (!to) {
        return (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {inner}
            </section>
        );
    }

    return (
        <Link
            to={to}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
            {inner}
        </Link>
    );
}

function StatusBreakdown({ title, rows }) {
    const max = Math.max(...rows.map(([, value]) => value), 1);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            <div className="mt-4 space-y-3">
                {rows.map(([label, value]) => (
                    <div key={label}>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">{label}</span>
                            <span className="font-semibold text-slate-800">{value}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-[#106A2E]"
                                style={{ width: `${(value / max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
