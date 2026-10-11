import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, HandHelping } from "lucide-react";

import { lfAdminApi } from "../services/lfApi";
import {
    formatDateTime,
    formatItemId,
    isExactItemIdMatch,
} from "../config/lfTheme";
import {
    LfEmpty,
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
// Every claim. The row only opens the item's detail view -
// approving or rejecting happens there, after the admin
// has seen the item, the evidence and the other claims.
//
// SEARCH: exact Item ID only, and it matches the ITEM's
// id (claim.reportId), never the claim id. Several claims
// on the same item all show up for that Item ID.
// =====================================================

export default function LfAdminClaimsPage() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Draft = what is typed. Applied = what the table filters on, set by
    // Enter / Search / Clear.
    const [draft, setDraft] = useState("");
    const [applied, setApplied] = useState("");

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

    const searching = applied.trim().length > 0;

    // EXACT match on the claimed item's Item ID - not the Claim ID.
    const visible = searching
        ? claims.filter((claim) => isExactItemIdMatch(claim.reportId, applied))
        : claims;

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
                    <h2 className="text-sm font-semibold text-slate-700">Claims</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {claims.length} total ·{" "}
                        {claims.filter((c) => c.status === "Processing").length} awaiting a
                        decision · {claims.filter((c) => c.status === "Awaiting Pickup").length}{" "}
                        awaiting pickup
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
            {claims.length === 0 ? (
                <LfEmpty
                    icon={HandHelping}
                    title="No claims yet"
                    message="When a student claims a found item, it appears here for the finder's decision."
                />
            ) : visible.length === 0 ? (
                <LfItemIdEmpty icon={HandHelping} recordNoun="claim" onClear={clearSearch} />
            ) : (
                <LfTableShell>
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className={lfThClass}>Item</th>
                            <th className={lfThClass}>Claimant</th>
                            <th className={lfThClass}>Finder</th>
                            <th className={lfThClass}>Evidence</th>
                            <th className={lfThClass}>Claim date</th>
                            <th className={lfThClass}>Status</th>
                            <th className={`${lfThClass} text-right`}>Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((claim) => (
                            <tr key={claim.claimId} className={lfTrClass}>
                                <td className={lfTdClass}>
                                    <span className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-800">
                                        <span className="rounded-md bg-[#10231B] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-white ring-1 ring-white/30">
                                            {formatItemId(claim.reportId)}
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
                                    <span className="mt-1 inline-block">
                                        <LfTypeTag type={claim.reportType} />
                                    </span>
                                </td>
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
                                    <LfStatusChip status={claim.status} />
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
        </div>
    );
}
