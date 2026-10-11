import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    HandHelping,
    PackageSearch,
    Pencil,
    Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import { formatDateTime, formatItemId, formatStatus } from "../config/lfTheme";
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
// One report in full.
//
// What you can do here depends on the report and on
// you:
//   - the owner edits while it is pending review;
//   - a found report can be claimed by anyone else;
//   - a lost report can receive a recovery report;
//   - a published found report carries its claim list
//     for its finder.
// =====================================================

export default function LfReportDetailsPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);

    const [userId, setUserId] = useState(null);

    // Recovery on this report, if the viewer may see it (owner, finder or
    // admin - everyone else gets a 403, which simply hides this panel).
    const [recovery, setRecovery] = useState(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setNotFound(false);

            const stored = Number(localStorage.getItem("userId"));
            setUserId(Number.isFinite(stored) && stored > 0 ? stored : null);

            const response = await lfApi.report(reportId);
            setReport(response.data);

            try {
                const recoveryResponse = await lfApi.recoveryForReport(reportId);
                setRecovery(recoveryResponse.data || null);
            } catch {
                setRecovery(null);
            }
        } catch (err) {
            if (err.status === 404) setNotFound(true);
            else setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [reportId]);

    useEffect(() => {
        load();
    }, [load]);

    const isOwner = report && userId && report.userId === userId;
    const isPending = report?.status === "Pending";
    const isFound = report?.reportType === "Found";
    const isLost = report?.reportType === "Lost";
    const canClaim = isFound && report?.status === "Published" && !isOwner;
    const canRecover = isLost && report?.status === "Published" && !isOwner;

    const onDelete = async () => {
        if (!window.confirm("Delete this report? This cannot be undone.")) return;

        try {
            const response = await lfApi.deleteReport(reportId);
            toast.success(response.message || "Report deleted.");
            navigate(`${LOST_FOUND_HOME_ROUTE}/my-items`, { replace: true });
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return <LfSkeleton rows={4} />;

    if (notFound) {
        return (
            <LfEmpty
                icon={PackageSearch}
                title="Report not found"
                message="It may have been removed, or it is still pending review."
                action={
                    <LfButton onClick={() => navigate(LOST_FOUND_HOME_ROUTE)}>
                        Back to home
                    </LfButton>
                }
            />
        );
    }

    if (error) return <LfNotice tone="bad">{error}</LfNotice>;

    const image = lfImageUrl(report.imagePath);

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#106A2E]"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                Back
            </button>

            <LfPanel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-[#10231B] px-2.5 py-1 font-mono text-sm font-bold tracking-wide text-white shadow-md ring-1 ring-white/30">
                                {formatItemId(report.reportId)}
                            </span>
                            <h2 className="text-xl font-semibold text-slate-800">
                                {report.itemName}
                            </h2>
                            <LfTypeTag type={report.reportType} />
                            <LfStatusChip status={report.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            {report.category || "Uncategorized"}
                            {report.location ? ` · ${report.location}` : ""}
                        </p>
                    </div>

                    {isOwner && isPending && (
                        <div className="flex shrink-0 gap-2">
                            <Link
                                to={`${LOST_FOUND_HOME_ROUTE}/report/${reportId}/edit`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#106A2E] px-3 py-2 text-xs font-semibold text-[#106A2E] transition hover:bg-[#106A2E]/5"
                            >
                                <Pencil size={13} aria-hidden="true" />
                                Edit
                            </Link>
                            <button
                                type="button"
                                onClick={onDelete}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                                <Trash2 size={13} aria-hidden="true" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
                    <LfImage
                        src={image}
                        alt={report.itemName}
                        className="aspect-square w-full rounded-2xl border border-slate-100"
                    />

                    <div className="space-y-4">
                        <div>
                            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Description
                            </h3>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {report.description || "No description provided."}
                            </p>
                        </div>

                        <dl className="grid gap-3 text-xs sm:grid-cols-2">
                            <DetailRow label="Status" value={formatStatus(report.status)} />
                            <DetailRow label="Reported" value={formatDateTime(report.createdAt)} />
                        </dl>
                    </div>
                </div>
            </LfPanel>

            {/* ---------- recovery on this report ---------- */}
            {recovery && (
                <LfPanel
                    title="Recovery reported"
                    subtitle={
                        recovery.finderUserId === userId
                            ? "You reported finding this item"
                            : "Someone reported finding this item"
                    }
                >
                    <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#106A2E]/10 text-[#106A2E]">
                            <PackageSearch size={16} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                                {recovery.finderUserId === userId
                                    ? "Reported by you"
                                    : `Reported by ${recovery.finderName || "another student"}`}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {formatDateTime(recovery.createdAt)}
                                {recovery.status
                                    ? ` · ${formatStatus(recovery.status)}`
                                    : ""}
                                {" · "}at the OneServe Student Affairs Office
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

            {/* ---------- actions ---------- */}
            {canClaim && (
                <LfPanel title="Is this yours?" subtitle="Claim this found item and arrange the handover">
                    <div className="flex flex-wrap items-center gap-3">
                        <LfButton
                            onClick={() =>
                                navigate(`${LOST_FOUND_HOME_ROUTE}/report/${reportId}/claim`)
                            }
                        >
                            <HandHelping size={14} aria-hidden="true" />
                            Claim this item
                        </LfButton>
                        <p className="text-xs text-slate-500">
                            The finder verifies your claim before the pickup is scheduled.
                        </p>
                    </div>
                </LfPanel>
            )}

            {canRecover && (
                <LfPanel title="Found this lost item?" subtitle="Report the recovery so the owner is notified">
                    <div className="flex flex-wrap items-center gap-3">
                        <LfButton
                            variant="accent"
                            onClick={() =>
                                navigate(`${LOST_FOUND_HOME_ROUTE}/report/${reportId}/recover`)
                            }
                        >
                            <PackageSearch size={14} aria-hidden="true" />
                            Report recovery
                        </LfButton>
                        <p className="text-xs text-slate-500">
                            Hand it to the OneServe Student Affairs Office - that is the only handover.
                        </p>
                    </div>
                </LfPanel>
            )}

            {isOwner && isFound && report.status === "Published" && (
                <LfPanel
                    title="Claims on this item"
                    subtitle="Students who say they lost this item"
                >
                    <ClaimsList reportId={reportId} />
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

function ClaimsList({ reportId }) {
    const [claims, setClaims] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const response = await lfApi.claimsForReport(reportId);
                if (cancelled) return;
                setClaims(response.data || []);
            } catch (err) {
                if (cancelled) return;
                setError(err.message);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [reportId]);

    if (error) return <LfNotice tone="bad">{error}</LfNotice>;
    if (claims === null) return <LfSkeleton rows={2} />;
    if (claims.length === 0)
        return <p className="text-xs text-slate-500">No claims yet.</p>;

    return (
        <ul className="space-y-2">
            {claims.map((claim) => (
                <li
                    key={claim.claimId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                >
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-700">
                            {claim.claimantName || `User #${claim.claimedByUserId}`}
                        </p>
                        {claim.verificationNotes && (
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                                “{claim.verificationNotes}”
                            </p>
                        )}
                    </div>
                    <LfStatusChip status={claim.status} />
                </li>
            ))}
        </ul>
    );
}
