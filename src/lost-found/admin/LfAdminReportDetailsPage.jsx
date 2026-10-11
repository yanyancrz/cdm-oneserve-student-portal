import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Check,
    GitCompare,
    HandHelping,
    PackageSearch,
    UserRound,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import { lfAdminApi } from "../services/lfApi";
import {
    formatDate,
    formatDateTime,
    formatItemId,
    formatStatus,
} from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfButton,
    LfEmpty,
    LfImage,
    LfNotice,
    LfPanel,
    LfSkeleton,
    LfStatusChip,
    LfTypeTag,
} from "../components/lfUi";

// =====================================================
// One item's full console view: large photo and every
// field, the reporter, the review action, every claim
// with its decision, the recovery and every match.
// Opened by clicking an item in the reports, claims
// or pickups list.
// =====================================================

export default function LfAdminReportDetailsPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();

    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [acting, setActing] = useState(null);

    const load = useCallback(async () => {
        try {
            setError("");
            const response = await lfAdminApi.reportDetail(reportId);
            setDetail(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [reportId]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!cancelled) await load();
        })();

        return () => {
            cancelled = true;
        };
    }, [load]);

    const onReviewReport = async (status) => {
        const verb = status === "Published" ? "publish" : "reject";
        if (
            !window.confirm(
                `${status === "Published" ? "Publish" : "Reject"} this report? It will ${
                    verb === "publish"
                        ? "appear on the public board"
                        : "be removed from the review queue"
                }.`
            )
        )
            return;

        setActing(`report:${status}`);
        try {
            const response = await lfAdminApi.updateReportStatus(reportId, status);
            toast.success(response.message || `Report ${verb}ed.`);
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActing(null);
        }
    };

    const onDecideClaim = async (claim, status) => {
        const verb = status === "Awaiting Pickup" ? "approve" : "reject";
        if (
            !window.confirm(
                `${status === "Awaiting Pickup" ? "Approve" : "Reject"} this claim by ${
                    claim.claimantName || "this student"
                }?`
            )
        )
            return;

        setActing(`claim:${claim.claimId}`);
        try {
            const response = await lfAdminApi.updateClaimStatus(claim.claimId, status);
            toast.success(response.message || `Claim ${verb}d.`);
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActing(null);
        }
    };

    if (loading) return <LfSkeleton rows={5} />;
    if (error) return <LfNotice tone="bad">{error}</LfNotice>;
    if (!detail) return <LfNotice tone="bad">Report not found.</LfNotice>;

    const { report, claims = [], recovery, matches = [] } = detail;
    const image = lfImageUrl(report.imagePath);
    const itemId = formatItemId(report.reportId);

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#106A2E]"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                Back to list
            </button>

            {/* ---------- ITEM ---------- */}
            <LfPanel>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[#10231B] px-3 py-1.5 text-base font-black tracking-wider text-white shadow-md ring-2 ring-[#F4D35E]">
                        {itemId}
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                        {report.itemName}
                    </h2>
                    <LfTypeTag type={report.reportType} />
                    <LfStatusChip status={report.status} />
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
                    <LfImage
                        src={image}
                        alt={report.itemName}
                        className="aspect-square w-full rounded-2xl border border-slate-100"
                    />

                    <div className="min-w-0 space-y-4">
                        <div>
                            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Description
                            </h3>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {report.description || "No description provided."}
                            </p>
                        </div>

                        <dl className="grid gap-3 text-xs sm:grid-cols-2">
                            <DetailRow label="Category" value={report.category || "Uncategorized"} />
                            <DetailRow label="Location" value={report.location || "—"} />
                            <DetailRow label="Date lost / found" value={formatDate(report.dateLostFound)} />
                            <DetailRow label="Reported" value={formatDateTime(report.createdAt)} />
                            <DetailRow label="Custody" value={formatStatus(report.itemCustody)} />
                            <DetailRow label="Status" value={formatStatus(report.status)} />
                        </dl>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                <UserRound size={12} aria-hidden="true" />
                                Reported by
                            </h3>
                            <p className="mt-1.5 text-sm font-semibold text-slate-800">
                                {detail.reporterName || `User #${report.userId}`}
                            </p>
                            {detail.reporterEmail && (
                                <p className="text-xs text-slate-500">{detail.reporterEmail}</p>
                            )}
                            {detail.reporterIdNumber && (
                                <p className="text-xs text-slate-500">ID: {detail.reporterIdNumber}</p>
                            )}
                        </div>

                        {report.status === "Pending" && (
                            <div className="flex flex-wrap gap-2">
                                <LfButton
                                    onClick={() => onReviewReport("Published")}
                                    loading={acting === "report:Published"}
                                >
                                    <Check size={14} aria-hidden="true" />
                                    Publish to board
                                </LfButton>
                                <LfButton
                                    variant="secondary"
                                    onClick={() => onReviewReport("Rejected")}
                                    loading={acting === "report:Rejected"}
                                >
                                    <X size={14} aria-hidden="true" />
                                    Reject
                                </LfButton>
                            </div>
                        )}
                    </div>
                </div>
            </LfPanel>

            {/* ---------- CLAIMS ---------- */}
            <LfPanel
                title={`Claims (${claims.length})`}
                subtitle="Everyone asking for this item, with the decision"
            >
                {claims.length === 0 ? (
                    <LfEmpty
                        icon={HandHelping}
                        title="No claims"
                        message="When someone claims this item, it appears here."
                    />
                ) : (
                    <ul className="space-y-3">
                        {claims.map((claim) => (
                            <li
                                key={claim.claimId}
                                className="rounded-2xl border border-slate-200 bg-white p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {claim.claimantName || "—"}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {claim.claimantEmail}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            Claimed {formatDateTime(claim.claimDate)}
                                        </p>
                                        {claim.verificationNotes && (
                                            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] italic leading-5 text-slate-600">
                                                “{claim.verificationNotes}”
                                            </p>
                                        )}
                                    </div>
                                    <LfStatusChip status={claim.status} />
                                </div>

                                {claim.status === "Processing" && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            disabled={acting === `claim:${claim.claimId}`}
                                            onClick={() => onDecideClaim(claim, "Awaiting Pickup")}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            <Check size={13} aria-hidden="true" />
                                            Approve for pickup
                                        </button>
                                        <button
                                            type="button"
                                            disabled={acting === `claim:${claim.claimId}`}
                                            onClick={() => onDecideClaim(claim, "Rejected")}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                        >
                                            <X size={13} aria-hidden="true" />
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </LfPanel>

            {/* ---------- RECOVERY ---------- */}
            {recovery && (
                <LfPanel title="Recovery" subtitle="Found-item report on this loss">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#106A2E]/10 text-[#106A2E]">
                            <PackageSearch size={17} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                                Reported by {recovery.finderName || "another student"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {formatDateTime(recovery.createdAt)} ·{" "}
                                {formatStatus(recovery.status)} · at the OneServe
                                Student Affairs Office
                            </p>
                            {recovery.message && (
                                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] italic leading-5 text-slate-600">
                                    “{recovery.message}”
                                </p>
                            )}
                        </div>
                    </div>
                </LfPanel>
            )}

            {/* ---------- MATCHES ---------- */}
            {matches.length > 0 && (
                <LfPanel
                    title={`Possible matches (${matches.length})`}
                    subtitle="Board reports that look like this item"
                >
                    <ul className="space-y-2">
                        {matches.map((match) => {
                            const otherIsLost =
                                match.lostReportId !== report.reportId;
                            const otherName = otherIsLost
                                ? match.lostItemName
                                : match.foundItemName;
                            const otherId = otherIsLost
                                ? match.lostReportId
                                : match.foundReportId;

                            return (
                                <li key={match.matchRecordId}>
                                    <Link
                                        to={`/lost-found/admin/reports/${otherId}`}
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:shadow-sm"
                                    >
                                        <GitCompare
                                            size={15}
                                            className="shrink-0 text-[#106A2E]"
                                            aria-hidden="true"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-xs font-semibold text-slate-700">
                                                {otherName || "—"}
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {formatItemId(otherId)} ·{" "}
                                                {match.matchPercentage}% match ·{" "}
                                                {match.isConfirmed ? "Confirmed" : "Unconfirmed"}
                                            </span>
                                        </span>
                                        <LfImage
                                            src={lfImageUrl(match.imagePath)}
                                            alt={otherName}
                                            className="h-10 w-10 shrink-0 rounded-lg"
                                        />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </LfPanel>
            )}
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </dt>
            <dd className="mt-0.5 text-xs font-medium text-slate-700">{value}</dd>
        </div>
    );
}
