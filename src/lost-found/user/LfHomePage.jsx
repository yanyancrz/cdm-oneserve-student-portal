import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    PackageSearch,
    Plus,
} from "lucide-react";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import {
    formatDate,
    LF_COLORS,
} from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfEmpty,
    LfImage,
    LfNotice,
    LfPanel,
    LfStatusChip,
    LfTypeTag,
} from "../components/lfUi";
import { ModuleLoadingScreen } from "../../components/States";

// =====================================================
// The module home: what is happening right now, and
// the two things a user came to do - report an item,
// or look at the board.
// =====================================================

export default function LfHomePage() {
    const navigate = useNavigate();

    const [recent, setRecent] = useState([]);
    const [recentLost, setRecentLost] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const firstName = (localStorage.getItem("userName") || "Student").split(" ")[0] || "Student";

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [foundResponse, lostResponse] = await Promise.all([
                    lfApi.recentFound(),
                    lfApi.recentLost(),
                ]);
                if (cancelled) return;
                setRecent(foundResponse.data || []);
                setRecentLost(lostResponse.data || []);
            } catch (err) {
                if (cancelled) return;
                setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    // The module-opening splash, same as the Guidance gate: the dashboard
    // card lands here while the first fetch is still in flight. Later
    // visits keep the inline skeleton, because the page is already open.
    if (loading && recent.length === 0 && recentLost.length === 0 && !error) {
        return (
            <ModuleLoadingScreen
                icon={PackageSearch}
                accent="bg-gradient-to-br from-[#7C6CE0] to-[#4A3FA3]"
                label="Opening Lost & Found"
                text="Opening Lost & Found..."
            />
        );
    }

    return (
        <div className="space-y-5">
            <style>{`
                @keyframes lfReveal {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .lf-reveal {
                    animation: lfReveal .65s cubic-bezier(.2,.8,.2,1) both;
                }
            `}</style>

            {/* HERO - same welcome card as the Guidance home */}
            <section className="lf-reveal relative overflow-hidden rounded-[28px] border border-[#0E3B22]/10 bg-gradient-to-br from-[#10B981] via-[#0E3B22] to-[#052E16] px-5 py-6 shadow-xl shadow-emerald-900/20 sm:px-7 sm:py-8">
                <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-emerald-300/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 right-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] bg-[size:32px_32px]" />

                <div className="relative">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" />
                            <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-200">
                                Lost & Found
                            </span>
                        </div>

                        <PackageSearch className="text-emerald-200/80" size={26} aria-hidden="true" />
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                        Hello,
                        <span className="block bg-gradient-to-r from-emerald-300 to-cyan-200 bg-clip-text text-transparent">
                            {firstName}
                        </span>
                    </h1>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
                        Lost something or found something? You are in the right place.
                    </p>

                    <p className="mt-4 text-xs uppercase tracking-[.14em] text-white/35">
                        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                </div>
            </section>

            {/* ---------- quick actions ---------- */}            <div className="grid gap-3 sm:grid-cols-2">
                <Link
                    to={`${LOST_FOUND_HOME_ROUTE}/report/new`}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                    <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${LF_COLORS.primary}1A`, color: LF_COLORS.primary }}
                    >
                        <Plus size={22} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                            Report an item
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                            Lost something? Found something? Tell the campus.
                        </span>
                    </span>
                    <ArrowRight
                        size={16}
                        className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#106A2E]"
                        aria-hidden="true"
                    />
                </Link>

                <Link
                    to={`${LOST_FOUND_HOME_ROUTE}/browse`}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                    <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${LF_COLORS.secondary}1A`, color: LF_COLORS.secondary }}
                    >
                        <PackageSearch size={22} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                            Browse the board
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                            See what was lost and found around campus.
                        </span>
                    </span>
                    <ArrowRight
                        size={16}
                        className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0D7856]"
                        aria-hidden="true"
                    />
                </Link>
            </div>

            {/* ---------- recent lost ---------- */}
            <LfPanel
                title="Recently lost"
                subtitle="The newest items students are looking for"
                action={
                    <Link
                        to={`${LOST_FOUND_HOME_ROUTE}/browse?type=Lost`}
                        className="text-xs font-semibold text-[#106A2E] hover:underline"
                    >
                        View all
                    </Link>
                }
            >
                {loading ? (
                    <RecentRailSkeleton />
                ) : error ? (
                    <LfNotice tone="bad">{error}</LfNotice>
                ) : recentLost.length === 0 ? (
                    <LfEmpty
                        icon={PackageSearch}
                        title="No lost items yet"
                        message="When a student reports a lost item, it shows up here."
                    />
                ) : (
                    <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                        {recentLost.map((report) => (
                            <RecentReportCard
                                key={report.reportId}
                                report={report}
                                onOpen={() =>
                                    navigate(
                                        `${LOST_FOUND_HOME_ROUTE}/report/${report.reportId}`
                                    )
                                }
                            />
                        ))}
                    </ul>
                )}
            </LfPanel>

            {/* ---------- recent found ---------- */}
            <LfPanel
                title="Recently found"
                subtitle="The newest items handed in around campus"
                action={
                    <Link
                        to={`${LOST_FOUND_HOME_ROUTE}/browse?type=Found`}
                        className="text-xs font-semibold text-[#106A2E] hover:underline"
                    >
                        View all
                    </Link>
                }
            >
                {loading ? (
                    <RecentRailSkeleton />
                ) : error ? (
                    <LfNotice tone="bad">{error}</LfNotice>
                ) : recent.length === 0 ? (
                    <LfEmpty
                        icon={PackageSearch}
                        title="No found items yet"
                        message="When a student hands something in, it shows up here."
                    />
                ) : (
                    <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                        {recent.map((report) => (
                            <RecentReportCard
                                key={report.reportId}
                                report={report}
                                onOpen={() =>
                                    navigate(
                                        `${LOST_FOUND_HOME_ROUTE}/report/${report.reportId}`
                                    )
                                }
                            />
                        ))}
                    </ul>
                )}
            </LfPanel>
        </div>
    );
}

function RecentRailSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading"
            className="flex snap-x gap-3 overflow-x-auto pb-2"
        >
            {[0, 1, 2].map((index) => (
                <div
                    key={index}
                    className="w-44 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                    <div className="h-28 animate-pulse bg-slate-200/70" />
                    <div className="space-y-2 p-3">
                        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200/70" />
                        <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-200/70" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function RecentReportCard({ report, onOpen }) {
    const image = lfImageUrl(report.imagePath);
    const itemId = `#${String(report.reportId ?? 0).padStart(3, "0")}`;

    return (
        <li className="w-44 shrink-0 snap-start">
            <button
                type="button"
                onClick={onOpen}
                aria-label={`Item ${itemId}: ${report.itemName}`}
                className="block w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
            >
                <span className="relative block h-28 w-full bg-slate-100">
                    <LfImage
                        src={image}
                        alt={report.itemName}
                        className="h-full w-full rounded-none"
                    />
                    {/* Emphasized Item ID, upper left */}
                    <span className="absolute left-2 top-2 rounded-lg bg-[#10231B] px-2 py-1 text-xs font-bold tracking-wide text-white shadow-md ring-1 ring-white/30">
                        {itemId}
                    </span>
                </span>

                <span className="block p-3">
                    <span className="block truncate text-[13px] font-semibold leading-5 text-slate-800">
                        {report.itemName}
                    </span>

                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <LfTypeTag type={report.reportType} />
                        <LfStatusChip status={report.status} />
                    </span>

                    <span className="mt-1.5 block truncate text-[11px] text-slate-500">
                        {report.category || "Uncategorized"}
                        {report.location ? ` · ${report.location}` : ""}
                    </span>

                    <span className="mt-0.5 block text-[10px] text-slate-400">
                        {formatDate(report.dateLostFound)}
                    </span>
                </span>
            </button>
        </li>
    );
}
