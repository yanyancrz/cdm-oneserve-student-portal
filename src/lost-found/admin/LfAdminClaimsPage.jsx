import { usePhilippineDay } from "../components/usePhilippineDay.js";
import { MissingDuration, RecordPagination, SortHeader, TableFilters } from "../components/LfRecords";
import { useRecordTable } from "../components/useRecordTable.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, HandHelping } from "lucide-react";

import { lfAdminApi } from "../services/lfApi";
import {
    formatDateTime,
    formatItemId,
    lfAttribution,
} from "../config/lfTheme";
import {
    LfEmpty,
    LfNotice,
    LfSkeleton,
    LfStatusChip,
    LfTableShell,
    LfTypeTag,
    lfTdClass,
    lfThClass,
    lfTrClass,
} from "../components/lfUi";

export default function LfAdminClaimsPage() {
    const philippineDay = usePhilippineDay();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const load = async () => {
        try {
            const response = await lfAdminApi.claims();
            setClaims(response.data || []);
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

    const statuses = [...new Set(["Rejected", "Returned", "Cancelled", ...claims.map((claim) => claim.status)])];
    const categories = {
        Pending: (claim) => ["Processing", "Pending"].includes(claim.status),
        Approved: (claim) => ["Approved", "Scheduled", "Awaiting Pickup"].includes(claim.status),
        ...Object.fromEntries(statuses.filter((status) => !["Pending", "Approved", "Processing"].includes(status))
            .map((status) => [status, (claim) => claim.status === status])),
    };
    const table = useRecordTable(claims,
        ["itemName", "claimantName", "claimantEmail", "finderName", "finderEmail", "status"],
        categories, "claimDate");
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
            {claims.length === 0 ? (
                <LfEmpty
                    icon={HandHelping}
                    title="No claims yet"
                    message="Claims submitted by students appear here for review."
                />
            ) : visible.length === 0 ? (
                <p className="text-sm text-slate-500">No matching records.</p>
            ) : (
                <LfTableShell>
                    <thead>
                        <tr className="border-b border-slate-100">
                            <SortHeader table={table} field="itemName" className={lfThClass}>Item name</SortHeader>
                            <SortHeader table={table} field="reportId" className={lfThClass}>Item ID</SortHeader>
                            <SortHeader table={table} field="claimantName" className={lfThClass}>Claimant</SortHeader>
                            <SortHeader table={table} field="finderName" className={lfThClass}>Finder</SortHeader>
                            <SortHeader table={table} field="verificationNotes" className={lfThClass}>Evidence</SortHeader>
                            <SortHeader table={table} field="claimDate" className={lfThClass}>Claim date</SortHeader>
                            <SortHeader table={table} field="status" className={lfThClass}>Status</SortHeader>
                            <th className={`${lfThClass} text-right`}>Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((claim) => (
                            <tr key={claim.claimId} className={lfTrClass}>
                                <td className={lfTdClass}>
                                    <span className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-800">
                                        <Link
                                            to={`/lost-found/admin/reports/${claim.reportId}`}
                                            className="hover:text-[#106A2E]"
                                        >
                                            {claim.itemName}
                                        </Link>
                                    </span>
                                    <span className="mt-0.5 block text-[10px] text-slate-400">
                                        {claim.category || "Uncategorized"}
                                        {claim.location ? ` · ${claim.location}` : ""}
                                    </span>
                                    <span className="mt-1 inline-block">
                                        <LfTypeTag type={claim.reportType} />
                                    </span>
                                </td>
                                <td className={lfTdClass}>{formatItemId(claim.reportId)}</td>
                                <td className={lfTdClass}>
                                    <span className="block font-medium text-slate-700">
                                        {claim.claimantName || "—"}
                                    </span>
                                    <span className="block text-[10px] text-slate-400">
                                        {claim.claimantEmail}
                                    </span>
                                </td>
                                <td className={lfTdClass}>
                                    <span className="block font-medium text-slate-700">
                                        {claim.finderName || "—"}
                                    </span>
                                    <span className="block text-[10px] text-slate-400">
                                        {claim.finderEmail}
                                    </span>
                                </td>
                                <td className={`${lfTdClass} max-w-[240px]`}>
                                    {claim.verificationNotes ? (
                                        <p className="line-clamp-3 italic leading-5 text-slate-600">
                                            “{claim.verificationNotes}”
                                        </p>
                                    ) : (
                                        <span className="text-slate-300">No notes</span>
                                    )}
                                </td>
                                <td className={`${lfTdClass} whitespace-nowrap text-slate-500`}>
                                    {formatDateTime(claim.claimDate)}
                                </td>
                                <td className={lfTdClass}>
                                    <MissingDuration item={claim} />
                                    <LfStatusChip status={claim.status} />
                                    {claim.decisionByName && (
                                        <span className="mt-1 block max-w-[200px] text-[10px] leading-4 text-slate-500">
                                            {lfAttribution(
                                                claim.decisionByName,
                                                claim.decisionByRole,
                                                claim.status === "Rejected"
                                                    ? "Rejected"
                                                    : claim.status === "Awaiting Pickup" ||
                                                        claim.status === "Returned"
                                                      ? "Approved"
                                                      : "Handled"
                                            )}
                                        </span>
                                    )}
                                </td>
                                <td className={`${lfTdClass} text-right`}>
                                    <Link
                                        to={`/lost-found/admin/reports/${claim.reportId}`}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#106A2E] px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-[#0E3B22] focus-visible:ring-2 focus-visible:ring-[#106A2E]/40"
                                    >
                                        <Eye size={13} aria-hidden="true" />
                                        View detail
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </LfTableShell>
            )}
            <RecordPagination {...table.pagination} />
        </div>
    );
}
