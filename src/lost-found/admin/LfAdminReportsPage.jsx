import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, SearchCheck } from "lucide-react";

import { lfAdminApi } from "../services/lfApi";
import {
    formatDate,
    formatDateTime,
    formatItemId,
    isExactItemIdMatch,
    lfAttribution,
} from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfEmpty,
    LfImage,
    LfItemIdEmpty,
    LfItemIdSearch,
    LfNotice,
    LfSkeleton,
    LfStatusChip,
    LfTableShell,
    LfTypeTag,
    lfTdClass,
    lfThClass,
    lfTrClass,
} from "../components/lfUi";

// =====================================================
// Every report, newest first. The row only opens the
// detail view - publishing or rejecting happens there,
// after the admin has seen the full item.
//
// SEARCH: exact Item ID only. The whole report list is
// already loaded from /api/lostfound/admin/reports, so the
// match is an equality check against the report's own id -
// nothing is sent to the server and no LIKE substring
// search is involved.
// =====================================================

export default function LfAdminReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Draft = what is typed. Applied = what the table actually filters on,
    // updated by Enter / Search / Clear so the list never flickers mid-typing.
    const [draft, setDraft] = useState("");
    const [applied, setApplied] = useState("");

    const load = async () => {
        try {
            const response = await lfAdminApi.reports();
            setReports(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!cancelled) await load();
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const searching = applied.trim().length > 0;

    // Exact match only: "1", "001" and "#001" are the same item;
    // "10", "0012" or "LF-2026-001" match nothing.
    const visible = searching
        ? reports.filter((report) => isExactItemIdMatch(report.reportId, applied))
        : reports;

    const clearSearch = () => {
        setDraft("");
        setApplied("");
    };

    if (loading) return <LfSkeleton rows={5} />;

    if (error) {
        return (
            <div className="space-y-4">
                <LfNotice tone="bad">{error}</LfNotice>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* ---------- toolbar: counts + exact Item ID search ---------- */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-slate-700">Reports</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {reports.length} total ·{" "}
                        {reports.filter((r) => r.status === "Pending").length} awaiting review ·{" "}
                        {reports.filter((r) => r.status === "Published").length} on the board
                    </p>
                </div>

                <div className="w-full sm:w-96">
                    <LfItemIdSearch
                        value={draft}
                        onChange={setDraft}
                        onSubmit={setApplied}
                        onClear={clearSearch}
                        loading={loading}
                    />
                </div>
            </div>

            {/* ---------- table ---------- */}
            {reports.length === 0 ? (
                <LfEmpty
                    icon={SearchCheck}
                    title="No reports yet"
                    message="Reports submitted by students and faculty appear here for review."
                />
            ) : visible.length === 0 ? (
                <LfItemIdEmpty icon={SearchCheck} recordNoun="report" onClear={clearSearch} />
            ) : (
                <LfTableShell>
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className={lfThClass}>Item</th>
                            <th className={lfThClass}>Type</th>
                            <th className={lfThClass}>Reported</th>
                            <th className={lfThClass}>Status</th>
                            <th className={`${lfThClass} text-right`}>Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((report) => {
                            const image = lfImageUrl(report.imagePath);

                            return (
                                <tr key={report.reportId} className={lfTrClass}>
                                    <td className={lfTdClass}>
                                        <div className="flex items-center gap-3">
                                            <LfImage
                                                src={image}
                                                alt={report.itemName}
                                                className="h-11 w-11 shrink-0 rounded-lg"
                                            />
                                            <div className="min-w-0">
                                                <span className="flex flex-wrap items-center gap-1.5">
                                                    <span className="rounded-md bg-[#10231B] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-white ring-1 ring-white/30">
                                                        {formatItemId(report.reportId)}
                                                    </span>
                                                    <Link
                                                        to={`/lost-found/admin/reports/${report.reportId}`}
                                                        className="block truncate font-semibold text-slate-800 hover:text-[#106A2E]"
                                                    >
                                                        {report.itemName}
                                                    </Link>
                                                </span>
                                                <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                                                    {report.category || "Uncategorized"}
                                                    {report.location ? ` · ${report.location}` : ""}
                                                </span>
                                                <span className="mt-0.5 block max-w-[280px] truncate text-[10px] italic text-slate-400">
                                                    {report.description}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={lfTdClass}>
                                        <LfTypeTag type={report.reportType} />
                                    </td>
                                    <td className={`${lfTdClass} whitespace-nowrap text-slate-500`}>
                                        {formatDate(report.dateLostFound)}
                                        <span className="block text-[10px] text-slate-400">
                                            {formatDateTime(report.createdAt)}
                                        </span>
                                    </td>
                                    <td className={lfTdClass}>
                                        <LfStatusChip status={report.status} />
                                        {report.reviewedByName && (
                                            <span className="mt-1 block max-w-[220px] text-[10px] leading-4 text-slate-500">
                                                {lfAttribution(
                                                    report.reviewedByName,
                                                    report.reviewedByRole,
                                                    report.status === "Rejected"
                                                        ? "Rejected"
                                                        : "Approved"
                                                )}
                                            </span>
                                        )}
                                    </td>
                                    <td className={`${lfTdClass} text-right`}>
                                        <Link
                                            to={`/lost-found/admin/reports/${report.reportId}`}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#106A2E] px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-[#0E3B22] focus-visible:ring-2 focus-visible:ring-[#106A2E]/40"
                                        >
                                            <Eye size={13} aria-hidden="true" />
                                            View detail
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </LfTableShell>
            )}
        </div>
    );
}
