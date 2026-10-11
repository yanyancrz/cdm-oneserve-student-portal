import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    FileText,
    HandHelping,
    Image as ImageIcon,
    Paperclip,
    PackageSearch,
    Trash2,
    UploadCloud,
} from "lucide-react";
import toast from "react-hot-toast";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import { formatDate, formatItemId } from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfButton,
    LfEmpty,
    LfImage,
    LfNotice,
    LfPanel,
    LfSkeleton,
    LfTypeTag,
    lfInputClass,
} from "../components/lfUi";

// =====================================================
// Claim a found item.
//
// A claim is the claimant's own statement of ownership.
// A proof attachment is OPTIONAL - plenty of personal
// belongings have no receipt or photo - but without one
// the claimant must say why and describe details that
// can verify the item is theirs. Nothing here decides
// anything: the finder (or the admin) reviews it.
// =====================================================

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_MB = 5;

export default function LfSubmitClaimPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const updateClaimId = Number(params.get("update")) || null;

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [existingClaim, setExistingClaim] = useState(null);

    const [explanation, setExplanation] = useState("");
    const [details, setDetails] = useState("");
    const [noProof, setNoProof] = useState(false);
    const [noProofReason, setNoProofReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);

    // The staged proof: only its server-side reference travels with the
    // claim, so the file itself is never a public URL.
    const [proof, setProof] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [reportResponse, claimResponse] = await Promise.all([
                    lfApi.report(reportId),
                    lfApi.myClaimForReport(reportId).catch(() => null),
                ]);

                if (cancelled) return;

                setReport(reportResponse.data);

                // Editing an existing claim pre-fills what they already wrote.
                const claim = claimResponse?.data || null;
                setExistingClaim(updateClaimId ? null : claim);

                if (updateClaimId && claim?.claimId === updateClaimId) {
                    setExplanation(claim.ownershipExplanation || "");
                    setDetails(claim.identifyingDetails || "");
                    setNoProofReason(claim.noProofReason || "");
                    setNoProof(Boolean(claim.noProofReason));
                }
            } catch (err) {
                if (cancelled) return;
                if (err.status === 404) setNotFound(true);
                else setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [reportId, updateClaimId]);

    const pickFile = async (file) => {
        if (!file) return;

        if (file.size > MAX_MB * 1024 * 1024) {
            toast.error(`Proof must not exceed ${MAX_MB} MB.`);
            return;
        }

        setUploading(true);
        try {
            const response = await lfApi.uploadClaimProof(file);
            setProof(response.data);
            setNoProof(false);
            toast.success("Proof attached.");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const dropProof = () => {
        setProof(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const submit = async () => {
        if (!explanation.trim()) {
            toast.error("Explain why you believe this item is yours.");
            return;
        }

        if (!proof) {
            if (!noProofReason.trim()) {
                toast.error("Explain why you cannot provide proof, or attach one.");
                return;
            }
            if (!details.trim()) {
                toast.error("Describe the identifying details of your item.");
                return;
            }
        }

        setConfirming(false);
        setSubmitting(true);

        const body = {
            reportId: Number(reportId),
            ownershipExplanation: explanation.trim(),
            identifyingDetails: details.trim() || null,
            noProofReason: proof ? null : noProofReason.trim() || null,
            proofAttachmentPath: proof?.storedPath || null,
        };

        try {
            // Updating an existing claim answers a request for more
            // information; a fresh submit opens a new one.
            const response = updateClaimId
                ? await lfApi.updateMyClaim(updateClaimId, body)
                : await lfApi.submitClaim(body);

            toast.success(
                response.message ||
                    (updateClaimId ? "Claim updated." : "Claim submitted.")
            );
            navigate(`${LOST_FOUND_HOME_ROUTE}/claims`, { replace: true });
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LfSkeleton rows={4} />;

    if (notFound || !report) {
        return (
            <LfEmpty
                icon={PackageSearch}
                title="Report not found"
                message="It may have been removed or is still pending review."
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

    // A claim already exists for this report - the claim
    // list is the right place to watch it.
    if (existingClaim) {
        return (
            <LfEmpty
                icon={HandHelping}
                title="You already claimed this item"
                message={`Your claim is currently ${existingClaim.status}. Watch it in your claims list.`}
                action={
                    <LfButton
                        onClick={() => navigate(`${LOST_FOUND_HOME_ROUTE}/claims`)}
                    >
                        My claims
                    </LfButton>
                }
            />
        );
    }

    const proofIsImage = proof?.contentType?.startsWith("image/");

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

            {/* ---------- STEP 1 - the item being claimed ---------- */}
            <LfPanel
                title={updateClaimId ? "Update your claim" : "Claim this found item"}
                subtitle={
                    updateClaimId
                        ? "Add what the reviewer asked for - it goes back to them straight away"
                        : "Check that this is the right item before you file a claim"
                }
            >
                <div className="flex flex-wrap items-start gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-nowrap">
                    <LfImage
                        src={image}
                        alt={report.itemName}
                        className="h-24 w-24 shrink-0 rounded-2xl border border-slate-100"
                    />

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-[#10231B] px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-white ring-1 ring-white/30">
                                {formatItemId(report.reportId)}
                            </span>
                            <span className="text-base font-semibold text-slate-800">
                                {report.itemName}
                            </span>
                            <LfTypeTag type={report.reportType} />
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                            {report.category || "Uncategorized"}
                            {report.location ? ` · ${report.location}` : ""}
                            {report.dateLostFound
                                ? ` · ${formatDate(report.dateLostFound)}`
                                : ""}
                        </p>

                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                            {report.description || "No description provided."}
                        </p>
                    </div>
                </div>
            </LfPanel>

            {/* ---------- STEP 2 - the claim itself ---------- */}
            <LfPanel
                title="Your claim"
                subtitle="Everything here is read by the reviewer before any decision"
            >
                <div className="space-y-4">
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Why do you believe this item is yours? *
                        </span>
                        <textarea
                            rows={4}
                            value={explanation}
                            onChange={(event) => setExplanation(event.target.value)}
                            placeholder="e.g. It is my black umbrella with the blue handle; I left it in the library on Monday afternoon."
                            maxLength={1000}
                            className={`${lfInputClass} resize-none leading-6`}
                        />
                        <span className="mt-1 block text-right text-[10px] text-slate-400">
                            {explanation.length}/1000
                        </span>
                    </label>

                    {/* ---------- optional proof attachment ---------- */}
                    <div>
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Proof of Ownership (Optional)
                        </span>

                        {proof ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                                {proofIsImage ? (
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                                        <ImageIcon size={20} aria-hidden="true" />
                                    </span>
                                ) : (
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                                        <FileText size={20} aria-hidden="true" />
                                    </span>
                                )}

                                <div className="min-w-0 flex-1">
                                    <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-slate-700">
                                        <Paperclip size={12} aria-hidden="true" />
                                        {proof.fileName || "Proof attached"}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        {(proof.fileSizeBytes / 1024).toFixed(0)} KB ·{" "}
                                        {proof.contentType}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={dropProof}
                                    className="shrink-0 rounded-full p-2 text-red-500 transition hover:bg-red-50"
                                    aria-label="Remove the attached proof"
                                >
                                    <Trash2 size={15} aria-hidden="true" />
                                </button>
                            </div>
                        ) : (
                            <label
                                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
                                    uploading
                                        ? "border-slate-200 bg-slate-50"
                                        : "border-slate-300 bg-white hover:border-[#106A2E]/50"
                                }`}
                            >
                                {uploading ? (
                                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#106A2E]" />
                                        Uploading…
                                    </span>
                                ) : (
                                    <>
                                        <UploadCloud
                                            size={24}
                                            className="mb-2 text-[#106A2E]/60"
                                            aria-hidden="true"
                                        />
                                        <span className="text-xs font-semibold text-slate-700">
                                            Attach a photo or PDF (optional)
                                        </span>
                                        <span className="mt-1 text-[10px] text-slate-400">
                                            JPG, PNG, WEBP or PDF · max {MAX_MB} MB
                                        </span>
                                    </>
                                )}
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept={ACCEPT}
                                    className="sr-only"
                                    onChange={(event) =>
                                        pickFile(event.target.files?.[0])
                                    }
                                />
                            </label>
                        )}
                    </div>

                    {/* ---------- identifying details ---------- */}
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Identifying details{" "}
                            <span className="font-normal text-slate-400">
                                {proof ? "(optional)" : "*"}
                            </span>
                        </span>
                        <textarea
                            rows={3}
                            value={details}
                            onChange={(event) => setDetails(event.target.value)}
                            placeholder="Unique marks, contents, serial number, stickers, exact place and day lost…"
                            maxLength={1000}
                            className={`${lfInputClass} resize-none leading-6`}
                        />
                        <span className="mt-1 block text-[11px] text-slate-400">
                            Shared only with the reviewer - never shown in the public listing.
                        </span>
                    </label>

                    {/* ---------- no-proof path ---------- */}
                    {!proof && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                            <label className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={noProof}
                                    onChange={(event) =>
                                        setNoProof(event.target.checked)
                                    }
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#106A2E] focus:ring-[#106A2E]"
                                />
                                <span className="min-w-0">
                                    <span className="block text-xs font-semibold text-amber-900">
                                        I cannot provide proof of ownership
                                    </span>
                                    <span className="mt-1 block text-[11px] leading-5 text-amber-800">
                                        Many personal items have no receipt or
                                        photo. That is fine - just explain below.
                                    </span>
                                </span>
                            </label>

                            {noProof && (
                                <label className="mt-3 block">
                                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                        Why can you not provide proof? *
                                    </span>
                                    <textarea
                                        rows={3}
                                        value={noProofReason}
                                        onChange={(event) =>
                                            setNoProofReason(event.target.value)
                                        }
                                        placeholder="e.g. It was a birthday gift, so I have no receipt, and I never had a chance to photograph it."
                                        maxLength={500}
                                        className={`${lfInputClass} resize-none border-amber-200 leading-6`}
                                    />
                                </label>
                            )}

                            <p className="mt-3 rounded-xl bg-white/70 px-3 py-2.5 text-[11px] leading-5 text-amber-900">
                                You may submit a claim without an attachment.
                                However, you must explain why you cannot provide
                                proof of ownership and provide specific details
                                that can help verify that the item belongs to
                                you. Your claim will be reviewed by the
                                administrator before it can be approved.
                            </p>
                        </div>
                    )}
                </div>
            </LfPanel>

            {/* ---------- actions ---------- */}
            <div className="flex gap-2">
                <LfButton
                    type="button"
                    onClick={() => setConfirming(true)}
                    loading={submitting || uploading}
                    className="flex-1"
                >
                    <HandHelping size={14} aria-hidden="true" />
                    Submit claim
                </LfButton>
                <LfButton
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(-1)}
                >
                    Cancel
                </LfButton>
            </div>

            {/* ---------- confirmation summary ---------- */}
            {confirming && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
                    <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                            <CheckCircle2 size={16} className="text-[#106A2E]" aria-hidden="true" />
                            Confirm your claim
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Please review before submitting. The reviewer decides
                            after this - nothing is released yet.
                        </p>

                        <dl className="mt-4 space-y-2 text-xs">
                            <SummaryRow label="Item" value={`${formatItemId(report.reportId)} · ${report.itemName}`} />
                            <SummaryRow label="Explanation" value={explanation.trim()} />
                            <SummaryRow
                                label="Identifying details"
                                value={details.trim() || "None given"}
                            />
                            <SummaryRow
                                label="Proof attached"
                                value={
                                    proof
                                        ? `${proof.fileName || "file"} (${proof.contentType})`
                                        : "No attachment"
                                }
                            />
                            {!proof && (
                                <SummaryRow
                                    label="Reason for no proof"
                                    value={noProofReason.trim() || "Not given"}
                                    tone="warn"
                                />
                            )}
                        </dl>

                        <div className="mt-5 flex gap-2">
                            <LfButton onClick={submit} loading={submitting} className="flex-1">
                                Submit claim
                            </LfButton>
                            <LfButton variant="ghost" onClick={() => setConfirming(false)}>
                                Back
                            </LfButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryRow({ label, value, tone }) {
    return (
        <div
            className={`rounded-xl px-3 py-2.5 ${
                tone === "warn" ? "bg-amber-50" : "bg-slate-50"
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
