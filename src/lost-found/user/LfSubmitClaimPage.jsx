import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, HandHelping, PackageSearch } from "lucide-react";
import toast from "react-hot-toast";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import {
    LfButton,
    LfEmpty,
    lfField,
    LfImage,
    LfNotice,
    LfPanel,
    LfSkeleton,
    LfTypeTag,
} from "../components/lfUi";
import { lfImageUrl } from "../config/lfImage";

// =====================================================
// Claim a found item.
//
// The verification notes are the claimant's evidence -
// what the item looks like beyond the photo, where
// they lost it. The finder reads them before
// approving, so the field matters.
// =====================================================

export default function LfSubmitClaimPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [existingClaim, setExistingClaim] = useState(null);
    const [verificationNotes, setVerificationNotes] = useState("");

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
                setExistingClaim(claimResponse?.data || null);
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
    }, [reportId]);

    const onSubmit = async (event) => {
        event.preventDefault();

        if (!verificationNotes.trim()) {
            toast.error(
                "Please describe how you know this item is yours."
            );
            return;
        }

        setSubmitting(true);

        try {
            const response = await lfApi.submitClaim({
                reportId: Number(reportId),
                verificationNotes: verificationNotes.trim(),
            });

            toast.success(response.message || "Claim submitted.");
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

    // A claim already exists for this report - the
    // claim list is the right place to watch it.
    if (existingClaim) {
        return (
            <LfEmpty
                icon={HandHelping}
                title="You already claimed this item"
                message={`Your claim is currently ${existingClaim.status}. Watch it in your claims list.`}
                action={
                    <LfButton onClick={() => navigate(`${LOST_FOUND_HOME_ROUTE}/claims`)}>
                        My claims
                    </LfButton>
                }
            />
        );
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#106A2E]"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                Back
            </button>

            <LfPanel title="Claim this found item">
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-3">
                    <LfImage
                        src={image}
                        alt={report.itemName}
                        className="h-16 w-16 rounded-xl"
                    />
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">
                                {report.itemName}
                            </span>
                            <LfTypeTag type={report.reportType} />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                            {report.category || "Uncategorized"}
                            {report.location ? ` · ${report.location}` : ""}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">
                            {report.description}
                        </p>
                    </div>
                </div>

                <div className="mt-4">
                    {lfField("Why is this yours? *", {
                        value: verificationNotes,
                        onChange: (event) =>
                            setVerificationNotes(event.target.value),
                        placeholder:
                            "e.g. It has my name engraved on the back; I lost it near the gym on Monday.",
                    })}
                    <p className="mt-1.5 text-[11px] text-slate-400">
                        The finder verifies claims before scheduling the handover.
                        Specific details get claims approved faster.
                    </p>
                </div>
            </LfPanel>

            <div className="flex gap-2">
                <LfButton type="submit" loading={submitting} className="flex-1">
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
        </form>
    );
}
