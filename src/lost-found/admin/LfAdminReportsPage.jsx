import { usePhilippineDay } from "../components/usePhilippineDay.js";
import { MissingDuration, RecordPagination, SortHeader, TableFilters } from "../components/LfRecords";
import { useRecordTable } from "../components/useRecordTable.js";
import { reportCategories } from "../components/recordTable.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, SearchCheck } from "lucide-react";

import { lfAdminApi } from "../services/lfApi";
import {
    formatDate,
    formatDateTime,
    formatItemId,
    lfAttribution,
} from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfEmpty,
    LfImage,
    LfNotice,
    LfSkeleton,
    LfStatusChip,
    LfTableShell,
    LfTypeTag,
    lfTdClass,
    lfThClass,
    lfTrClass,
} from "../components/lfUi";

export default function LfAdminReportsPage() {
    const philippineDay = usePhilippineDay();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
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
    }, [philippineDay]);

    const table = useRecordTable(reports,
        ["itemName", "reporterName", "reporterIdNumber", "category", "location", "description", "status", "lifecycleStatus"],
        {
            ...reportCategories,
            "Pending review": (report) => report.status === "Pending",
            Published: (report) => report.status === "Published",
            Rejected: (report) => report.status === "Rejected",
        }, "createdAt");
    const visible = table.rows;

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
            <TableFilters table={table} />
            {reports.length === 0 ? (
                <LfEmpty
                    icon={SearchCheck}
                    title="No reports yet"
                    message="Reports submitted by students and faculty appear here for review."
                />
            ) : visible.length === 0 ? (
                <p className="text-sm text-slate-500">No matching records.</p>
            ) : (
                <LfTableShell>
                    <thead>
                        <tr className="border-b border-slate-100">
                            <SortHeader table={table} field="itemName" className={lfThClass}>Item name</SortHeader>
                            <SortHeader table={table} field="reportId" className={lfThClass}>Item ID</SortHeader>
                            <SortHeader table={table} field="reportType" className={lfThClass}>Type</SortHeader>
                            <SortHeader table={table} field="reporterName" className={lfThClass}>Student name</SortHeader>
                            <SortHeader table={table} field="createdAt" className={lfThClass}>Reported</SortHeader>
                            <SortHeader table={table} field="lifecycleStatus" className={lfThClass}>Status</SortHeader>
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
                                                    <Link
                                                        to={`/lost-found/admin/reports/${report.reportId}`}
                                                        className="block truncate font-semibold text-slate-800 hover:text-[#106A2E]"
                                                    >
                                                        {report.itemName}
                                                    </Link>
                                                </span>
                                                <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                                                    {report.category || "Uncategorized"}
                                                    {report.location ? ` Â· ${report.location}` : ""}
                                                </span>
                                                <span className="mt-0.5 block max-w-[280px] truncate text-[10px] italic text-slate-400">
                                                    {report.description}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={lfTdClass}>{formatItemId(report.reportId)}</td>
                                    <td className={lfTdClass}>
                                        <LfTypeTag type={report.reportType} />
                                    </td>
                                    <td className={lfTdClass}>{report.reporterName}</td>
                                    <td className={`${lfTdClass} whitespace-nowrap text-slate-500`}>
                                        {formatDateTime(report.createdAt)}
                                        {report.dateLostFound && <span className="block text-[10px]">
                                            {report.reportType} on {formatDate(report.dateLostFound)}
                                        </span>}
                                    </td>
                                    <td className={lfTdClass}>
                                        <MissingDuration item={report} />
                                        <div className="flex flex-wrap gap-1">
                                            <LfStatusChip status={report.lifecycleStatus || report.reportType} />
                                            <LfStatusChip status={report.status} />
                                        </div>
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
            <RecordPagination {...table.pagination} />
        </div>
    );
}
