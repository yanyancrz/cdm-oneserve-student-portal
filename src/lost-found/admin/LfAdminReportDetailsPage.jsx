import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    Check,
    GitCompare,
    HandHelping,
    MessageSquare,
    PackageSearch,
    Paperclip,
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
    lfInputClass,
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

    const onDecideClaim = async (claim, status, reason) => {
        const verb = status === "Awaiting Pickup" ? "approve" : "reject";
        if (
            !window.confirm(
                `${status === "Awaiting Pickup" ? "Approve" : "Reject"} this claim by ${
                    claim.claimantName || "this student"
                }?` +
                    (status === "Awaiting Pickup"
                        ? " It moves straight to awaiting pickup."
                        : reason
                          ? ` Reason: ${reason}`
                          : "")
            )
        )
            return;

        setActing(`claim:${claim.claimId}`);
        try {
            const response = await lfAdminApi.updateClaimStatus(
                claim.claimId,
                status,
                reason
            );
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
                subtitle="Everyone asking for this item, with the evidence the reviewer sees"
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
                            <ClaimReviewCard
                                key={claim.claimId}
                                claim={claim}
                                report={report}
                                acting={acting === `claim:${claim.claimId}`}
                                onDecide={onDecideClaim}
                            />
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

// =====================================================
// One claim as the reviewer sees it: who asked, when,
// what they wrote, whether a proof is attached, and the
// three decisions - approve for pickup, reject with a
// reason, or send back for more information.
// =====================================================

function ClaimReviewCard({ claim, report, acting, onDecide }) {
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const [asking, setAsking] = useState(false);
    const [infoMessage, setInfoMessage] = useState("");

    const decide = (status, note) => {
        setRejecting(false);
        setAsking(false);
        onDecide(claim, status, note);
    };

    const hasProof = claim.hasProof;

    return (
        <li className="rounded-2xl border border-slate-200 bg-white p-4">
            {/* ---------- claimant ---------- */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#10231B] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white ring-1 ring-white/30">
                            Claim #{String(claim.claimId ?? 0).padStart(3, "0")}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                            {claim.claimantName || "—"}
                        </span>
                        <LfStatusChip status={claim.status} />
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {claim.claimantEmail}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                        Item #{String(report.reportId ?? 0).padStart(3, "0")} ·{" "}
                        {report.itemName} · submitted {formatDateTime(claim.claimDate)}
                    </p>
                </div>

                {/* A reviewer sees at a glance whether to expect a file. */}
                {hasProof ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        <Paperclip size={11} aria-hidden="true" />
                        PROOF ATTACHED
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                        <AlertCircle size={11} aria-hidden="true" />
                        NO PROOF ATTACHED
                    </span>
                )}
            </div>

            {/* ---------- what the claimant wrote ---------- */}
            <dl className="mt-3 space-y-2">
                {claim.ownershipExplanation && (
                    <ReviewRow
                        label="Why they believe it is theirs"
                        value={claim.ownershipExplanation}
                    />
                )}
                {claim.identifyingDetails && (
                    <ReviewRow
                        label="Identifying details"
                        value={claim.identifyingDetails}
                        highlight
                    />
                )}
                {!hasProof && claim.noProofReason && (
                    <ReviewRow
                        label="Reason for no proof"
                        value={claim.noProofReason}
                        tone="warn"
                    />
                )}

                {claim.decisionReason && (
                    <ReviewRow
                        label={
                            claim.status === "InformationRequested"
                                ? "What you asked for"
                                : "Decision reason"
                        }
                        value={claim.decisionReason}
                        tone={
                            claim.status === "Rejected" ? "bad" : "info"
                        }
                    />
                )}
            </dl>

            {/* ---------- attachment ---------- */}
            {hasProof ? (
                <ProofAttachment claim={claim} />
            ) : (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-800">
                    No Proof of Ownership Attached. Review the identifying
                    details and the reason no proof was given before deciding.
                </p>
            )}

            {/* ---------- actions ---------- */}
            {claim.status === "Processing" && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        disabled={acting}
                        onClick={() => decide("Awaiting Pickup")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                        <Check size={13} aria-hidden="true" />
                        Approve for pickup
                    </button>

                    <button
                        type="button"
                        disabled={acting}
                        onClick={() => {
                            setReason("");
                            setRejecting(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                        <X size={13} aria-hidden="true" />
                        Reject with reason
                    </button>

                    <button
                        type="button"
                        disabled={acting}
                        onClick={() => {
                            setInfoMessage("");
                            setAsking(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                    >
                        <MessageSquare size={13} aria-hidden="true" />
                        Request information
                    </button>
                </div>
            )}

            {rejecting && (
                <ReasonBox
                    title="Why are you rejecting this claim?"
                    placeholder="e.g. The serial number given does not match the item."
                    value={reason}
                    onChange={setReason}
                    onCancel={() => setRejecting(false)}
                    onSubmit={() => {
                        if (!reason.trim()) {
                            toast.error("Give a reason - the claimant will see it.");
                            return;
                        }
                        decide("Rejected", reason.trim());
                    }}
                />
            )}

            {asking && (
                <ReasonBox
                    title="What do you need from the claimant?"
                    placeholder="e.g. Please describe the sticker on the back or add a photo of your ID."
                    value={infoMessage}
                    onChange={setInfoMessage}
                    tone="warn"
                    onCancel={() => setAsking(false)}
                    onSubmit={() => {
                        if (!infoMessage.trim()) {
                            toast.error("Tell the claimant what to add.");
                            return;
                        }
                        decide("InformationRequested", infoMessage.trim());
                    }}
                />
            )}
        </li>
    );
}

function ReviewRow({ label, value, tone, highlight }) {
    const tones = {
        warn: "bg-amber-50 border-amber-200",
        bad: "bg-red-50 border-red-200",
        info: "bg-sky-50 border-sky-200",
    };

    return (
        <div
            className={`rounded-xl border px-3 py-2.5 ${
                tone ? tones[tone] : highlight ? "bg-slate-100" : "bg-slate-50"
            }`}
        >
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-xs leading-5 text-slate-700">
                {value}
            </dd>
        </div>
    );
}

function ReasonBox({ title, placeholder, value, onChange, onCancel, onSubmit, tone }) {
    return (
        <div
            className={`mt-3 rounded-2xl border p-3 ${
                tone === "warn" ? "border-amber-200 bg-amber-50/60" : "border-red-200 bg-red-50/60"
            }`}
        >
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {title}
            </p>
            <textarea
                rows={3}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                maxLength={500}
                className={`${lfInputClass} resize-none leading-6`}
            />
            <div className="mt-2 flex gap-2">
                <button
                    type="button"
                    onClick={onSubmit}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${
                        tone === "warn"
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                    Confirm
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// =====================================================
// The proof of ownership as the reviewer sees it.
//
// The API serves proofs one at a time through the
// AUTHORIZED /api/lostfound/claims/{id}/proof endpoint -
// it answers with a root-relative URL, and this SPA is
// served from a different origin than the API, so the
// URL is prefixed with API_URL first (exactly like report
// photos, via lfImageUrl). Without the prefix the <img>
// resolves against the frontend host, which serves the
// SPA shell for every path - that is why the file name
// looked fine but the image never appeared.
//
// Access rules are untouched: only the claimant, the
// finder and the Lost & Found console can read the
// endpoint; nothing here is made public.
// =====================================================

function ProofAttachment({ claim }) {
    const [broken, setBroken] = useState(false);
    const [zoomed, setZoomed] = useState(false);

    const src = claim.proofUrl ? lfImageUrl(claim.proofUrl) : null;
    const isImage = Boolean(claim.proofContentType?.startsWith("image/"));

    if (!src) {
        return (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-800">
                The proof file is no longer available on the server. It may
                have been removed during account cleanup - ask the finder to
                re-upload it.
            </p>
        );
    }

    return (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-700">
                    <Paperclip size={13} className="shrink-0 text-[#106A2E]" aria-hidden="true" />
                    <span className="truncate">
                        {claim.proofFileName || "Proof of ownership"}
                    </span>
                    <span className="shrink-0 text-[10px] font-normal text-slate-400">
                        {claim.proofContentType}
                    </span>
                </p>
                <div className="flex shrink-0 gap-1.5">
                    {isImage && !broken && (
                        <button
                            type="button"
                            onClick={() => setZoomed(true)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            View larger
                        </button>
                    )}
                    <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Open
                    </a>
                </div>
            </div>

            {!broken && (
                <div className="mt-3">
                    {isImage ? (
                        <img
                            src={src}
                            alt={`Proof of ownership from ${claim.claimantName || "the claimant"}`}
                            onClick={() => setZoomed(true)}
                            onError={() => setBroken(true)}
                            className="max-h-80 w-full cursor-zoom-in rounded-xl border border-slate-200 bg-white object-contain"
                        />
                    ) : (
                        <iframe
                            src={src}
                            title={`Proof of ownership from ${claim.claimantName || "the claimant"}`}
                            onError={() => setBroken(true)}
                            className="h-96 w-full rounded-xl border border-slate-200 bg-white"
                        />
                    )}
                    <p className="mt-2 text-[10px] text-slate-400">
                        Click the image to view it larger. Served only to you,
                        the claimant and the finder.
                    </p>
                </div>
            )}

            {broken && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-800">
                    The preview could not be loaded in this browser. The file
                    is still stored on the server - use Open to view or
                    download it directly.
                </p>
            )}

            {zoomed && (
                <ProofLightbox
                    src={src}
                    title={claim.proofFileName || "Proof of ownership"}
                    claimant={claim.claimantName}
                    onClose={() => setZoomed(false)}
                />
            )}
        </div>
    );
}

function ProofLightbox({ src, title, claimant, onClose }) {
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return createPortal(
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-5xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-white">
                        {title}
                        {claimant ? (
                            <span className="ml-2 text-xs font-normal text-white/70">
                                from {claimant}
                            </span>
                        ) : null}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                        Close (Esc)
                    </button>
                </div>
                <img
                    src={src}
                    alt={title}
                    className="max-h-[82vh] w-full rounded-2xl border border-white/10 object-contain"
                />
            </div>
        </div>,
        document.body
    );
}
