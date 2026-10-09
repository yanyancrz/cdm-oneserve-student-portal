import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, HandHelping, X } from "lucide-react";
import toast from "react-hot-toast";

import { lfAdminApi } from "../services/lfApi";
import {
    formatDateTime,
    formatStatus,
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
// Every claim, with the finder's decision:
// approve opens a pickup schedule and notifies
// the claimant; reject closes the claim and
// cancels any schedule.
//
// Approval is limited to pending claims - the
// API enforces the same rule.
// =====================================================

export default function LfAdminClaimsPage() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [acting, setActing] = useState(null);

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

    const onDecide = async (claim, status) => {
        const verb = status === "Approved" ? "approve" : "reject";

        if (
            !window.confirm(
                `${status === "Approved" ? "Approve" : "Reject"} this claim by ${claim.claimantName || "this student"}?` +
                    (status === "Approved"
                        ? " A pickup schedule opens automatically."
                        : "")
            )
        )
            return;

        setActing(claim.claimId);

        try {
            const response = await lfAdminApi.updateClaimStatus(
                claim.claimId,
                status
            );

            toast.success(response.message || `Claim ${verb}ed.`);
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActing(null);
        }
    };

    const visible = claims.filter(
        (claim) =>
            !search ||
            claim.itemName.toLowerCase().includes(search.toLowerCase()) ||
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
                    {claims.filter((c) => c.status === "Pending").length} awaiting a decision
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
                                <th className="px-4 py-3 font-semibold">Claimed</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 text-right font-semibold">
                                    Decision
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
                                        <Link
                                            to={`/lost-found/report/${claim.reportId}`}
                                            className="font-semibold text-slate-800 hover:text-[#106A2E]"
                                        >
                                            {claim.itemName}
                                        </Link>
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
                                    <td className="px-4 py-3">
                                        {claim.status === "Pending" ? (
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDecide(claim, "Approved")
                                                    }
                                                    disabled={acting === claim.claimId}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                                    title="Approve - opens a pickup schedule"
                                                    aria-label={`Approve claim by ${claim.claimantName}`}
                                                >
                                                    <Check size={13} aria-hidden="true" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDecide(claim, "Rejected")
                                                    }
                                                    disabled={acting === claim.claimId}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600 transition hover:bg-red-200 disabled:opacity-50"
                                                    title="Reject"
                                                    aria-label={`Reject claim by ${claim.claimantName}`}
                                                >
                                                    <X size={13} aria-hidden="true" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-right text-[10px] text-slate-400">
                                                {formatStatus(claim.status)}
                                            </span>
                                        )}
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
