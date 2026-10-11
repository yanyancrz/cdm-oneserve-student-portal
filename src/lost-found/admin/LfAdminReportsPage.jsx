import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, SearchCheck } from "lucide-react";

import { lfAdminApi } from "../services/lfApi";
import {
    formatDate,
    formatDateTime,
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
// Every report, newest first. The row only opens the
// detail view - publishing or rejecting happens there,
// after the admin has seen the full item.
// =====================================================

export default function LfAdminReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

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

    const visible = reports.filter(
        (report) =>
            !search ||
            (report.itemName || "").toLowerCase().includes(search.toLowerCase()) ||
            (report.category || "").toLowerCase().includes(search.toLowerCase()) ||
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
                                <th className="px-4 py-3 text-right font-semibold">
                                    Detail
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
                                                    <span className="flex flex-wrap items-center gap-1.5">
                                                        <span className="rounded-md bg-[#10231B] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white ring-1 ring-white/30">
                                                            #{String(report.reportId ?? 0).padStart(3, "0")}
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
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                to={`/lost-found/admin/reports/${report.reportId}`}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#106A2E] px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-[#0E3B22]"
                                            >
                                                <Eye size={13} aria-hidden="true" />
                                                View detail
                                            </Link>
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
