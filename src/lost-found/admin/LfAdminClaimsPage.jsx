import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, HandHelping } from "lucide-react";

import { lfAdminApi } from "../services/lfApi";
import {
    formatDateTime,
} from "../config/lfTheme";
import {
    LfEmpty,
    LfNotice,
    LfSearchInput,
    LfSkeleton,
    LfStatusChip,
    LfTypeTag,
} from "../components/lfUi";

// =====================================================
// Every claim. The row only opens the item's detail view -
// approving or rejecting happens there, after the admin
// has seen the item, the evidence and the other claims.
// =====================================================

export default function LfAdminClaimsPage() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

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
    }, []);

    const visible = claims.filter(
        (claim) =>
            !search ||
            (claim.itemName || "").toLowerCase().includes(search.toLowerCase()) ||
            (claim.claimantName || "")
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            (claim.finderName || "")
                .toLowerCase()
                .includes(search.toLowerCase())
    );

    if (loading) return <LfSkeleton rows={5} />;

    if (error) return <LfNotice tone="bad">{error}</LfNotice>;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                    {claims.length} claims ·{" "}
                    {claims.filter((c) => c.status === "Processing").length} awaiting a decision
                </p>
                <div className="w-full sm:w-72">
                    <LfSearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Filter by item, claimant or finder…"
                    />
                </div>
            </div>

            {visible.length === 0 ? (
                <LfEmpty
                    icon={HandHelping}
                    title="No claims"
                    message="When a student claims a found item, it appears here for the finder's decision."
                />
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full min-w-[900px] text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                                <th className="px-4 py-3 font-semibold">Item</th>
                                <th className="px-4 py-3 font-semibold">Claimant</th>
                                <th className="px-4 py-3 font-semibold">Finder</th>
                                <th className="px-4 py-3 font-semibold">Evidence</th>
                                <th className="px-4 py-3 font-semibold">Claim date</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 text-right font-semibold">
                                    Detail
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visible.map((claim) => (
                                <tr
                                    key={claim.claimId}
                                    className="transition hover:bg-slate-50/70"
                                >
                                    <td className="px-4 py-3">
                                        <span className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-800">
                                            <span className="rounded-md bg-[#10231B] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white ring-1 ring-white/30">
                                                #{String(claim.reportId ?? 0).padStart(3, "0")}
                                            </span>
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
                                        <span className="mt-0.5">
                                            <LfTypeTag type={claim.reportType} />
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="block font-medium text-slate-700">
                                            {claim.claimantName || "—"}
                                        </span>
                                        <span className="block text-[10px] text-slate-400">
                                            {claim.claimantEmail}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="block font-medium text-slate-700">
                                            {claim.finderName || "—"}
                                        </span>
                                        <span className="block text-[10px] text-slate-400">
                                            {claim.finderEmail}
                                        </span>
                                    </td>
                                    <td className="max-w-[240px] px-4 py-3">
                                        {claim.verificationNotes ? (
                                            <p className="line-clamp-3 italic leading-5 text-slate-600">
                                                “{claim.verificationNotes}”
                                            </p>
                                        ) : (
                                            <span className="text-slate-300">
                                                No notes
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                        {formatDateTime(claim.claimDate)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <LfStatusChip status={claim.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            to={`/lost-found/admin/reports/${claim.reportId}`}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#106A2E] px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-[#0E3B22]"
                                        >
                                            <Eye size={13} aria-hidden="true" />
                                            View detail
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
