import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    CalendarClock,
    ChevronRight,
    Clock3,
    HandHelping,
    PackageSearch,
    SearchCheck,
} from "lucide-react";

import { lfAdminApi } from "../services/lfApi";
import { LfNotice, LfSkeleton } from "../components/lfUi";

// =====================================================
// The admin overview - FOUR sections, nothing else:
//
//   1. Reports          2. Claims
//   3. Pickup           4. Admin Availability
//
// Every number comes from the existing endpoints
// (/admin/stats + /admin/availability); nothing is
// invented and nothing is counted differently from the
// management pages. Each section links to the page that
// actually manages it.
// =====================================================

export default function LfAdminOverviewPage() {
    const [stats, setStats] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setError("");
        try {
            const [statsResponse, availabilityResponse] = await Promise.all([
                lfAdminApi.stats(),
                lfAdminApi.availability(),
            ]);
            setStats(statsResponse.data);
            setAvailability(availabilityResponse.data || []);
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

    // The soonest published window, used as the Availability summary.
    const nextWindow = [...availability]
        .filter((slot) => slot.isActive)
        .sort((a, b) =>
            String(a.startDateTime).localeCompare(String(b.startDateTime))
        )[0];

    const sections = [
        {
            key: "reports",
            title: "Reports",
            icon: PackageSearch,
            to: "/lost-found/admin/reports",
            manageLabel: "Manage reports",
            rows: [
                ["Awaiting review", stats.pendingReports, "urgent"],
                ["Published on board", stats.publishedReports, ""],
                ["Rejected", stats.rejectedReports, ""],
                ["Total filed", stats.totalReports, ""],
            ],
        },
        {
            key: "claims",
            title: "Claims",
            icon: HandHelping,
            to: "/lost-found/admin/claims",
            manageLabel: "Manage claims",
            rows: [
                ["Awaiting a decision", stats.processingClaims, "urgent"],
                ["Approved, awaiting pickup", stats.awaitingPickupClaims, ""],
                ["Returned to owners", stats.returnedClaims, ""],
                ["Rejected", stats.rejectedClaims, ""],
            ],
        },
        {
            key: "pickup",
            title: "Pickup",
            icon: SearchCheck,
            to: "/lost-found/admin/schedules",
            manageLabel: "Manage pickups",
            rows: [
                ["Awaiting pickup", stats.awaitingPickupClaims, "urgent"],
                ["Scheduled", stats.scheduledPickups, ""],
                ["Handovers recorded", stats.completedPickups, ""],
            ],
        },
        {
            key: "availability",
            title: "Admin Availability",
            icon: CalendarClock,
            to: "/lost-found/admin/schedules",
            manageLabel: "Manage windows",
            rows: [
                ["Published windows", availability.filter((slot) => slot.isActive).length, ""],
                ["Next pickup window", nextWindow ? formatWindow(nextWindow) : "None published", ""],
            ],
        },
    ];

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

            {/* ---------- the four sections ---------- */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {sections.map((section) => {
                    const Icon = section.icon;

                    return (
                        <section
                            key={section.key}
                            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#106A2E]/10 text-[#106A2E]">
                                    <Icon size={17} aria-hidden="true" />
                                </span>
                                <h3 className="text-sm font-semibold text-slate-800">
                                    {section.title}
                                </h3>
                            </div>

                            <dl className="mt-4 flex-1 space-y-2.5">
                                {section.rows.map(([label, value, tone]) => (
                                    <div
                                        key={label}
                                        className="flex items-center justify-between gap-2 text-xs"
                                    >
                                        <dt className="text-slate-500">{label}</dt>
                                        <dd
                                            className={`font-semibold ${
                                                tone === "urgent" && value > 0
                                                    ? "text-amber-600"
                                                    : "text-slate-800"
                                            }`}
                                        >
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>

                            <Link
                                to={section.to}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#106A2E] px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-[#0E3B22] focus-visible:ring-2 focus-visible:ring-[#106A2E]/40"
                            >
                                {section.manageLabel}
                                <ArrowRight size={13} aria-hidden="true" />
                            </Link>
                        </section>
                    );
                })}
            </div>

            {/* ---------- what needs attention right now ---------- */}
            {stats.pendingReports > 0 || stats.processingClaims > 0 ? (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                        <Clock3 size={17} aria-hidden="true" />
                    </span>
                    <p className="text-xs font-medium text-amber-900">
                        {stats.pendingReports} report
                        {stats.pendingReports === 1 ? "" : "s"} and{" "}
                        {stats.processingClaims} claim
                        {stats.processingClaims === 1 ? "" : "s"} are waiting
                        for your decision.
                    </p>
                    <Link
                        to="/lost-found/admin/reports"
                        className="ml-auto inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                        Open the review queue
                        <ChevronRight size={13} aria-hidden="true" />
                    </Link>
                </div>
            ) : null}
        </div>
    );
}

/** "Mar 5, 2026, 9:00 AM - 12:00 PM" for one availability window. */
function formatWindow(slot) {
    const start = new Date(slot.startDateTime);

    if (Number.isNaN(start.getTime())) return "Unknown";

    const end = slot.endDateTime ? new Date(slot.endDateTime) : null;
    const day = start.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const time = start.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
    });

    return end && !Number.isNaN(end.getTime())
        ? `${day}, ${time} - ${end.toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
          })}`
        : `${day}, ${time}`;
}
