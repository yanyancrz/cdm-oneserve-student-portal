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
// The finder chooses how the handover happens:
//   Student  - finder keeps it and hands it over
//              directly (contact details required);
//   Admin    - finder delivers it to the Student
//              Affairs Office (no contact details
//              published).
//
// Either way the report becomes Found, custody
// moves, and a claim is auto-created for the
// owner so the pickup flow runs.
// =====================================================

const METHODS = [
    {
        value: "Student",
        label: "I have the item",
        text: "I can hand it over directly. The owner contacts me.",
    },
    {
        value: "Admin",
        label: "I gave it to the office",
        text: "I delivered it to the OneServe Student Affairs Office.",
    },
];

const CONTACT_OPTIONS = ["Messenger", "Contact Number", "Instagram", "Email"];

export default function LfRecoveryPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [method, setMethod] = useState("Student");
    const [message, setMessage] = useState("");
    const [contactMethod, setContactMethod] = useState("");
    const [contactInfo, setContactInfo] = useState("");

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

        if (method === "Student") {
            if (!contactMethod) {
                toast.error("Choose a contact method.");
                return;
            }

            if (!contactInfo.trim()) {
                toast.error("Enter your contact information.");
                return;
            }

            if (contactInfo.trim().length > 150) {
                toast.error("Contact information must be 150 characters or fewer.");
                return;
            }
        }

        setSubmitting(true);

        try {
            const response = await lfApi.createRecovery({
                reportId: Number(reportId),
                recoveryMethod: method,
                message: message.trim(),
                contactMethod: method === "Student" ? contactMethod : "",
                contactInfo: method === "Student" ? contactInfo.trim() : "",
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

                {/* ---------- how the handover happens ---------- */}
                <fieldset className="mt-4">
                    <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        How will the owner get it?
                    </legend>
                    <div className="space-y-2">
                        {METHODS.map((option) => {
                            const active = method === option.value;

                            return (
                                <label
                                    key={option.value}
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                                        active
                                            ? "border-[#106A2E]/50 bg-[#106A2E]/5"
                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="recoveryMethod"
                                        value={option.value}
                                        checked={active}
                                        onChange={() => setMethod(option.value)}
                                        className="mt-0.5 h-4 w-4 accent-[#106A2E]"
                                    />
                                    <span>
                                        <span className="block text-xs font-semibold text-slate-800">
                                            {option.label}
                                        </span>
                                        <span className="mt-0.5 block text-[11px] leading-5 text-slate-500">
                                            {option.text}
                                        </span>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </fieldset>

                {/* ---------- finder details ---------- */}
                {method === "Student" && (
                    <div className="mt-4 space-y-4">
                        <div>
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Contact method *
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {CONTACT_OPTIONS.map((option) => {
                                    const active = contactMethod === option;

                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => setContactMethod(option)}
                                            aria-pressed={active}
                                            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                                active
                                                    ? "text-white"
                                                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                            style={
                                                active
                                                    ? { backgroundColor: "#106A2E" }
                                                    : undefined
                                            }
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {lfField("Your contact information *", {
                            value: contactInfo,
                            onChange: (event) =>
                                setContactInfo(event.target.value),
                            placeholder:
                                contactMethod === "Contact Number"
                                    ? "09xx xxx xxxx"
                                    : "Your handle or address",
                            maxLength: 150,
                        })}
                        <p className="text-[11px] text-slate-400">
                            Shown to the item's owner so they can reach you.
                        </p>
                    </div>
                )}

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
