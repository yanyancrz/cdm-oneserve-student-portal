import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Activity,
    BarChart3,
    CalendarCheck2,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock,
    NotebookPen,
    PieChart,
    RefreshCw,
    SearchX,
    TrendingUp,
    Users,
} from "lucide-react";

import { CardListSkeleton, Empty, ErrorBox, Note, StatsSkeleton } from "../components/GuidanceStates";
import { Avatar, FilterChips, SearchBar, SectionTitle } from "../components/GuidanceUi";
import RoleBadge from "../components/RoleBadge";
import StatusBadge from "../components/StatusBadge";
import {
    BarList,
    DistributionBar,
    GroupedColumns,
    InlineStat,
    ProgressBar,
    SectionCard,
    SegmentedTabs,
    StatCard,
} from "../components/ReportWidgets";
import { guidanceApi } from "../services/guidanceApi";
import { formatYMD } from "../utils/dateTime";
import { personDetails } from "../utils/people";
import {
    MONTH_SHORT,
    PERIOD_DAYS,
    PERIOD_OPTIONS,
    buildClients,
    buildTrend,
    concernBreakdown,
    countStatus,
    distinctClients,
    filterByPeriod,
    followUpBreakdown,
    notesBreakdown,
    periodRange,
    recentAppointments,
    roleBreakdown,
    statusBreakdown,
    weekdayBreakdown,
} from "../utils/reportAnalytics";

const TABS = ["Overview", "Breakdown", "Cases", "Students"];

const TREND_SERIES = [
    { label: "Booked", color: "#106A2E" },
    { label: "Completed", color: "#0ea5e9" },
];

const shortDate = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return `${MONTH_SHORT[m - 1]} ${d}, ${y}`;
};

// Reports & analytics for the counselor: period-filtered appointment activity,
// status/concern/case breakdowns and per-client summaries. The lifetime numbers
// and rolling 6-month chart still come from the same GET /counselor/reports
// report as before; the period filter recalculates the rest from the raw
// appointments, follow-ups and counseling records the counselor already owns.
export default function ReportsPage() {
    const [report, setReport] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [followUps, setFollowUps] = useState([]);
    const [records, setRecords] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [period, setPeriod] = useState("30 days");
    const [tab, setTab] = useState("Overview");
    const [search, setSearch] = useState("");

    const load = useCallback(async (signal) => {
        setError("");
        setLoading(true);
        try {
            const [r, a, f, rec] = await Promise.all([
                guidanceApi.getCounselorReport(signal),
                guidanceApi.getCounselorAppointments({}, signal),
                guidanceApi.getCounselorFollowUps(signal),
                guidanceApi.getRecords(undefined, signal),
            ]);
            setReport(r);
            setAppointments(a);
            setFollowUps(f);
            setRecords(rec);
        } catch (e) {
            if (e?.name !== "AbortError") setError(e.message || "Could not load reports.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const c = new AbortController();
        // Deferred so the effect body never calls setState synchronously.
        queueMicrotask(() => load(c.signal));
        return () => c.abort();
    }, [load]);

    const days = PERIOD_DAYS[period];

    // Everything below is derived for the selected period. Appointments are
    // keyed on the session date (the same field the server report uses).
    const periodAppointments = useMemo(
        () => filterByPeriod(appointments, (a) => a.date, days),
        [appointments, days]
    );
    const periodFollowUps = useMemo(
        () => filterByPeriod(followUps, (f) => f.createdAt, days),
        [followUps, days]
    );
    const periodRecords = useMemo(
        () => filterByPeriod(records, (r) => r.sessionDate, days),
        [records, days]
    );

    const total = periodAppointments.length;
    const completed = countStatus(periodAppointments, "Completed");
    const clients = distinctClients(periodAppointments);
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    const notes = notesBreakdown(periodRecords);
    const notesAll = notesBreakdown(records);

    const followUpItems = followUpBreakdown(periodFollowUps);
    const followUpTotal = periodFollowUps.length;
    const followUpPending = countStatus(periodFollowUps, "Pending");
    const followUpAccepted = countStatus(periodFollowUps, "Accepted");
    const followUpDeclined = countStatus(periodFollowUps, "Declined");
    const followUpResolved = countStatus(periodFollowUps, "Accepted") + countStatus(periodFollowUps, "Completed");

    const openFollowUps = followUps.filter((f) => f.status === "Pending");
    const clientsWithOpenCase = new Set(openFollowUps.map((f) => f.studentId)).size;

    const trend = useMemo(
        () => buildTrend(periodAppointments, days, report?.monthly),
        [periodAppointments, days, report]
    );

    const lifetimeTrend = useMemo(
        () => buildTrend([], "all", report?.monthly),
        [report]
    );

    const statusItems = useMemo(() => statusBreakdown(periodAppointments), [periodAppointments]);
    const concernItems = useMemo(() => concernBreakdown(periodAppointments), [periodAppointments]);
    const roleItems = useMemo(() => roleBreakdown(periodAppointments), [periodAppointments]);
    const weekdayItems = useMemo(
        () =>
            weekdayBreakdown(periodAppointments)
                .filter((d) => d.value > 0)
                .sort((a, b) => b.value - a.value),
        [periodAppointments]
    );
    const recent = useMemo(() => recentAppointments(periodAppointments, 6), [periodAppointments]);

    const clientsData = useMemo(() => buildClients(periodAppointments, followUps), [periodAppointments, followUps]);

    const searchedClients = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return clientsData;
        return clientsData.filter((c) =>
            [c.name, c.studentNumber, c.course, c.yearLevel, ...(c.concerns || [])]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [clientsData, search]);

    const followUpQueue = useMemo(
        () =>
            [...followUps]
                .sort((a, b) => {
                    if ((a.status === "Pending") !== (b.status === "Pending")) {
                        return a.status === "Pending" ? -1 : 1;
                    }
                    return String(b.followUpDate).localeCompare(String(a.followUpDate));
                })
                .slice(0, 10),
        [followUps]
    );

    const { from, to } = periodRange(days);
    const rangeLabel = from ? `${shortDate(from)} to ${shortDate(to)}` : "All-time totals";

    const trendSubtitle =
        trend.unit === "day" ? "Daily activity" : trend.unit === "week" ? "Weekly activity" : "Monthly activity";

    const pipeline = report
        ? [
              { label: "Pending", value: report.pending },
              { label: "Confirmed", value: report.confirmed },
              { label: "Completed", value: report.completed },
              { label: "Closed", value: report.cancelled + report.rejected + report.expired },
          ]
        : [];

    // ---- first-load / hard-error states ------------------------------
    if (loading && !report) {
        return (
            <main className="space-y-4 p-4">
                <StatsSkeleton count={4} label="Loading reports..." />
                <CardListSkeleton rows={3} label="Loading reports..." />
            </main>
        );
    }

    if (error && !report) {
        return (
            <main className="p-4">
                <ErrorBox message={error} onRetry={() => load()} />
            </main>
        );
    }

    return (
        <main className="space-y-4 p-4">
            {/* ---------- SUMMARY BANNER ---------- */}
            <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-white shadow-sm">
                        <BarChart3 size={20} aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-base font-bold tracking-tight text-slate-800">Reports &amp; Analytics</h1>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{rangeLabel}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => load()}
                        disabled={loading}
                        aria-label="Refresh report"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition active:scale-95 disabled:opacity-60"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
                    </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                    <InlineStat label="Appointments" value={total} tone="green" />
                    <InlineStat label="Sessions" value={completed} tone="sky" />
                    <InlineStat label="Clients" value={clients} tone="amber" />
                </div>
            </section>

            {error && report && <Note tone="error">{error}</Note>}

            {/* ---------- PERIOD FILTER ---------- */}
            <div className="space-y-2">
                <SectionTitle>Report period</SectionTitle>
                <FilterChips options={PERIOD_OPTIONS} value={period} onChange={setPeriod} accent="green" />
            </div>

            {/* ---------- TABS ---------- */}
            <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />

            {tab === "Overview" && (
                <div className="space-y-4">
                    <section className="grid grid-cols-2 gap-3">
                        <StatCard
                            icon={CalendarCheck2}
                            tone="green"
                            label="Appointments"
                            value={total}
                            sub="Sessions scheduled"
                        />
                        <StatCard
                            icon={CheckCircle2}
                            tone="sky"
                            label="Completed sessions"
                            value={completed}
                            sub={`${completionRate}% of appointments`}
                        />
                        <StatCard
                            icon={NotebookPen}
                            tone="violet"
                            label="Notes finalized"
                            value={notes.finalized}
                            sub={`${notes.draft} draft${notes.draft === 1 ? "" : "s"}`}
                        />
                        <StatCard
                            icon={Users}
                            tone="amber"
                            label="Clients seen"
                            value={clients}
                            sub="Unique students & faculty"
                        />
                    </section>

                    <SectionCard title="Activity over time" subtitle={trendSubtitle} icon={TrendingUp}>
                        <GroupedColumns buckets={trend.buckets} series={TREND_SERIES} />
                    </SectionCard>

                    <SectionCard title="Follow-ups" subtitle="Requested in this period" icon={CalendarClock}>
                        {followUpTotal === 0 ? (
                            <Empty
                                icon={CalendarClock}
                                title="No follow-ups requested"
                                note="Follow-ups you request after a session will be summarised here."
                            />
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">
                                        {followUpPending} pending
                                    </span>
                                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-[#106A2E]">
                                        {followUpAccepted} accepted
                                    </span>
                                    <span className="rounded-full bg-rose-50 px-3 py-1.5 font-semibold text-rose-600">
                                        {followUpDeclined} declined
                                    </span>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                                        <span>Resolved</span>
                                        <span>
                                            {followUpResolved} of {followUpTotal}
                                        </span>
                                    </div>
                                    <ProgressBar
                                        value={followUpResolved}
                                        max={followUpTotal}
                                        tone="green"
                                        label="Resolved follow-ups"
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    {report && (
                        <SectionCard title="Current pipeline" subtitle="Live appointment status" icon={Activity}>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {pipeline.map((item) => (
                                    <div key={item.label} className="rounded-xl border border-black/[0.05] bg-slate-50/70 px-3 py-2.5">
                                        <p className="text-xl font-bold text-slate-800">{item.value}</p>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    <SectionCard title="Recent activity" subtitle="Latest sessions in this period" icon={Clock} bodyClassName="">
                        {recent.length === 0 ? (
                            <p className="px-4 py-8 text-center text-xs text-slate-400">No sessions in this period.</p>
                        ) : (
                            <ul className="divide-y divide-black/[0.05]">
                                {recent.map((a) => (
                                    <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                                        <Avatar name={a.studentName} accent="green" size="sm" />

                                        <div className="min-w-0 flex-1">
                                            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800">
                                                <span className="truncate">{a.studentName}</span>
                                                <RoleBadge role={a.role} />
                                            </p>
                                            <p className="truncate text-[11px] text-slate-500">
                                                {formatYMD(a.date)} · {a.timeSlot}
                                                {a.concernType ? ` · ${a.concernType}` : ""}
                                            </p>
                                        </div>

                                        <StatusBadge status={a.status} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SectionCard>
                </div>
            )}

            {tab === "Breakdown" && (
                <div className="space-y-4">
                    <SectionCard
                        title="Appointment status"
                        subtitle={`${total} session${total === 1 ? "" : "s"} in this period`}
                        icon={PieChart}
                    >
                        <DistributionBar items={statusItems} />
                    </SectionCard>

                    <SectionCard title="Client concerns" subtitle="Why clients booked, most common first" icon={ClipboardList}>
                        <BarList items={concernItems} empty="No concerns recorded in this period." />
                    </SectionCard>

                    <SectionCard title="Clients by role" subtitle="Unique clients in this period" icon={Users}>
                        <BarList items={roleItems} tone="violet" empty="No clients in this period." />
                    </SectionCard>

                    <SectionCard title="Busiest days" subtitle="Appointments by weekday" icon={CalendarDays}>
                        <BarList items={weekdayItems} tone="sky" empty="No appointments in this period." />
                    </SectionCard>

                    <SectionCard title="Six-month trend" subtitle="Booked vs completed sessions" icon={TrendingUp}>
                        <GroupedColumns
                            buckets={lifetimeTrend.buckets}
                            series={TREND_SERIES}
                            emptyLabel="No history yet."
                        />
                    </SectionCard>
                </div>
            )}

            {tab === "Cases" && (
                <div className="space-y-4">
                    <section className="grid grid-cols-2 gap-3">
                        <StatCard
                            icon={Users}
                            tone="green"
                            label="Total clients"
                            value={report?.totalClients ?? clients}
                            sub="Lifetime"
                        />
                        <StatCard
                            icon={CalendarClock}
                            tone="amber"
                            label="Pending follow-ups"
                            value={openFollowUps.length}
                            sub={`${clientsWithOpenCase} client${clientsWithOpenCase === 1 ? "" : "s"} affected`}
                        />
                        <StatCard
                            icon={NotebookPen}
                            tone="violet"
                            label="Notes on file"
                            value={notesAll.finalized}
                            sub={`${notesAll.draft} draft${notesAll.draft === 1 ? "" : "s"}`}
                        />
                        <StatCard
                            icon={CheckCircle2}
                            tone="sky"
                            label="Sessions logged"
                            value={report?.completed ?? completed}
                            sub="Lifetime completed"
                        />
                    </section>

                    <SectionCard
                        title="Follow-up status"
                        subtitle={`${followUpTotal} requested in this period`}
                        icon={CalendarClock}
                    >
                        <DistributionBar items={followUpItems} emptyLabel="No follow-ups requested in this period." />
                    </SectionCard>

                    <SectionCard
                        title="Follow-up queue"
                        subtitle="All follow-ups · pending first"
                        icon={CalendarClock}
                        bodyClassName=""
                    >
                        {followUpQueue.length === 0 ? (
                            <p className="px-4 py-8 text-center text-xs text-slate-400">No follow-ups yet.</p>
                        ) : (
                            <ul className="divide-y divide-black/[0.05]">
                                {followUpQueue.map((f) => (
                                    <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                                        <Avatar name={f.studentName} accent="green" size="sm" />

                                        <div className="min-w-0 flex-1">
                                            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800">
                                                <span className="truncate">{f.studentName}</span>
                                                <RoleBadge role={f.role} />
                                            </p>
                                            <p className="truncate text-[11px] text-slate-500">
                                                {formatYMD(f.followUpDate)}
                                                {f.followUpTime ? ` · ${f.followUpTime}` : ""}
                                                {f.reason ? ` · ${f.reason}` : ""}
                                            </p>
                                        </div>

                                        <StatusBadge status={f.status} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SectionCard>
                </div>
            )}

            {tab === "Students" && (
                <div className="space-y-3">
                    <SearchBar
                        value={search}
                        onChange={setSearch}
                        placeholder="Search client name, ID or concern"
                        accent="green"
                    />

                    <p className="text-[11px] leading-5 text-slate-400">
                        Clients with sessions in the selected period. Appointment counts follow the period; pending
                        follow-ups are current.
                    </p>

                    {searchedClients.length === 0 ? (
                        <Empty
                            icon={SearchX}
                            title="No clients found"
                            note="Try a longer report period, or clear the search."
                        />
                    ) : (
                        <div className="space-y-2.5">
                            {searchedClients.map((c) => (
                                <article
                                    key={c.id}
                                    className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar name={c.name} accent="green" />

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-800">{c.name}</p>
                                            <p className="truncate text-xs text-slate-500">{personDetails(c)}</p>
                                        </div>

                                        <RoleBadge role={c.role} />
                                    </div>

                                    {c.concerns.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {c.concerns.slice(0, 4).map((concern) => (
                                                <span
                                                    key={concern}
                                                    className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#106A2E]"
                                                >
                                                    {concern}
                                                </span>
                                            ))}
                                            {c.concerns.length > 4 && (
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                                    +{c.concerns.length - 4}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-black/[0.05] pt-3 text-[11px] text-slate-500">
                                        <span>
                                            <b className="text-slate-800">{c.total}</b> appointment{c.total === 1 ? "" : "s"}
                                        </span>
                                        <span>
                                            <b className="text-slate-800">{c.completed}</b> completed
                                        </span>
                                        <span>
                                            Last:{" "}
                                            <b className="text-slate-800">
                                                {c.lastSession ? formatYMD(c.lastSession) : "—"}
                                            </b>
                                        </span>
                                        {c.pendingFollowUps > 0 && (
                                            <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                                                {c.pendingFollowUps} follow-up pending
                                            </span>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
