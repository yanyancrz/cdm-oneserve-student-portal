import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, SearchCheck, X } from "lucide-react";
import toast from "react-hot-toast";

import { lfAdminApi } from "../services/lfApi";
import {
    formatDate,
    formatDateTime,
    formatStatus,
} from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfEmpty,
    LfImage,
    LfNotice,
    LfSearchInput,
    LfSkeleton,
    LfStatusChip,
    LfTypeTag,
} from "../components/lfUi";

// =====================================================
// Every report, newest first, with the review
// action: approve puts a report on the public
// board, reject takes it out of the queue.
// =====================================================

export default function LfAdminReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [acting, setActing] = useState(null);

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

    const onReview = async (report, status) => {
        const verb = status === "Approved" ? "approve" : "reject";

        if (!window.confirm(`${status === "Approved" ? "Approve" : "Reject"} this report? It will ${verb === "approve" ? "appear on the public board" : "be removed from the review queue"}.`))
            return;

        setActing(report.reportId);

        try {
            const response = await lfAdminApi.updateReportStatus(
                report.reportId,
                status
            );

            toast.success(response.message || `Report ${verb}ed.`);
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActing(null);
        }
    };

    const visible = reports.filter(
        (report) =>
            !search ||
            report.itemName.toLowerCase().includes(search.toLowerCase()) ||
            report.category.toLowerCase().includes(search.toLowerCase()) ||
            (report.location || "")
                .toLowerCase()
                .includes(search.toLowerCase())
    );

    if (loading) return <LfSkeleton rows={5} />;

    if (error) return <LfNotice tone="bad">{error}</LfNotice>;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                    {reports.length} reports ·{" "}
                    {reports.filter((r) => r.status === "Pending").length} pending review
                </p>
                <div className="w-full sm:w-72">
                    <LfSearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Filter reports…"
                    />
                </div>
            </div>

            {visible.length === 0 ? (
                <LfEmpty
                    icon={SearchCheck}
                    title="No reports"
                    message="Reports submitted by students and faculty appear here for review."
                />
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full min-w-[820px] text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                                <th className="px-4 py-3 font-semibold">Item</th>
                                <th className="px-4 py-3 font-semibold">Type</th>
                                <th className="px-4 py-3 font-semibold">Reported</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold">Custody</th>
                                <th className="px-4 py-3 text-right font-semibold">
                                    Review
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visible.map((report) => {
                                const image = lfImageUrl(report.imagePath);

                                return (
                                    <tr
                                        key={report.reportId}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <LfImage
                                                    src={image}
                                                    alt={report.itemName}
                                                    className="h-10 w-10 rounded-lg"
                                                />
                                                <div className="min-w-0">
                                                    <Link
                                                        to={`/lost-found/report/${report.reportId}`}
                                                        className="block truncate font-semibold text-slate-800 hover:text-[#106A2E]"
                                                    >
                                                        {report.itemName}
                                                    </Link>
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
                                        <td className="px-4 py-3">
                                            <LfTypeTag type={report.reportType} />
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {formatDate(report.dateLostFound)}
                                            <span className="block text-[10px] text-slate-400">
                                                {formatDateTime(report.createdAt)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <LfStatusChip status={report.status} />
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {report.itemCustody === "AdminOffice"
                                                ? "Office"
                                                : report.itemCustody === "Student"
                                                  ? "Student"
                                                  : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {report.status === "Pending" ? (
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onReview(report, "Approved")
                                                        }
                                                        disabled={acting === report.reportId}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                                        title="Approve - publish to the board"
                                                        aria-label={`Approve ${report.itemName}`}
                                                    >
                                                        <Check size={13} aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onReview(report, "Rejected")
                                                        }
                                                        disabled={acting === report.reportId}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600 transition hover:bg-red-200 disabled:opacity-50"
                                                        title="Reject"
                                                        aria-label={`Reject ${report.itemName}`}
                                                    >
                                                        <X size={13} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-right text-[10px] text-slate-400">
                                                    {formatStatus(report.status)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
