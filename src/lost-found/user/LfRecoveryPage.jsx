import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, PackageSearch } from "lucide-react";
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
// Report a recovery: "I found your lost item."
//
// The item MUST go to the OneServe Student Affairs Office. There is no
// keeping it and no direct handover: no contact details are collected or
// published, the report becomes Found at the office, and a claim is
// auto-created for the owner so the pickup flow runs.
// =====================================================

export default function LfRecoveryPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [message, setMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const response = await lfApi.report(reportId);

                if (cancelled) return;

                const data = response.data;

                if (!data || data.reportType !== "Lost") {
                    setNotFound(true);
                    return;
                }

                setReport(data);
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

        setSubmitting(true);

        try {
            const response = await lfApi.createRecovery({
                reportId: Number(reportId),
                recoveryMethod: "Admin",
                message: message.trim(),
                contactMethod: "",
                contactInfo: "",
            });

            toast.success(
                response.message ||
                    "Recovery reported. The owner has been notified."
            );

            navigate(`${LOST_FOUND_HOME_ROUTE}/my-items`, { replace: true });
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
                title="Not a lost report"
                message="Recovery reports are only for lost items that you found."
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
        <form onSubmit={onSubmit} className="space-y-4">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#106A2E]"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                Back
            </button>

            <LfPanel title="Report a recovery">
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
                    </div>
                </div>

                {/* ---------- handover: office, always ---------- */}
                <div className="mt-4 rounded-xl border border-[#106A2E]/20 bg-[#106A2E]/[0.04] p-3.5 text-xs leading-5 text-slate-600">
                    <span className="font-semibold text-[#106A2E]">
                        Hand it to the office first.
                    </span>{" "}
                    Bring the item to the OneServe Student Affairs Office -
                    that is the only handover. The owner is notified
                    automatically and claims it there.
                </div>

                {lfField("Note to the owner (optional)", {
                    value: message,
                    onChange: (event) => setMessage(event.target.value),
                    placeholder:
                        "e.g. Found it under the bench in the gym locker room.",
                })}
            </LfPanel>

            <div className="flex gap-2">
                <LfButton type="submit" loading={submitting} className="flex-1">
                    <PackageSearch size={14} aria-hidden="true" />
                    Submit recovery
                </LfButton>
                <LfButton type="button" variant="ghost" onClick={() => navigate(-1)}>
                    Cancel
                </LfButton>
            </div>
        </form>
    );
}
