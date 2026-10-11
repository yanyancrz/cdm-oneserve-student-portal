import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, SearchCheck } from "lucide-react";
import toast from "react-hot-toast";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import { LF_COLORS } from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfButton,
    LfEmpty,
    lfField,
    LfNotice,
    LfPanel,
    LfPhotoPicker,
    LfSkeleton,
} from "../components/lfUi";

// =====================================================
// Report form - one component for create and edit.
//
// Edit is only offered while a report is pending
// review; the API enforces the same rule, so a
// deep link to a published report simply fails.
//
// The photo is uploaded FIRST and the returned
// root-relative path is submitted with the form -
// the same upload-then-submit order the marketplace
// uses, so a failed upload never produces a report
// with a broken photo reference.
// =====================================================

/**
 * ISO datetime -> datetime-local input value, read as LOCAL parts.
 *
 * new Date(value).toISOString().slice(0, 16) looks equivalent but shifts a
 * day back in UTC+8: midnight Oct 11 local is Oct 10 16:00 UTC, so the edit
 * form would open showing Oct 10 for an Oct 11 event.
 */
function toInputDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const CATEGORIES = [
    "Electronics",
    "Clothing",
    "Accessories",
    "Books & Supplies",
    "ID & Cards",
    "Keys",
    "Umbrella",
    "Bottle & Container",
    "Sports Gear",
    "Other",
];

export default function LfReportFormPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(reportId);

    const [loading, setLoading] = useState(isEditing);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [saving, setSaving] = useState(false);

    const [itemName, setItemName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [location, setLocation] = useState("");
    const [dateLostFound, setDateLostFound] = useState("");
    const [reportType, setReportType] = useState("Lost");
    const [imagePath, setImagePath] = useState(null);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (!isEditing) return;

        let cancelled = false;

        const load = async () => {
            try {
                const mine = await lfApi.myReports();
                const existing = (mine.data || []).find(
                    (report) => String(report.reportId) === String(reportId)
                );

                if (cancelled) return;

                if (!existing || existing.status !== "Pending") {
                    setNotFound(true);
                    return;
                }

                setItemName(existing.itemName);
                setDescription(existing.description);
                setCategory(existing.category);
                setLocation(existing.location);
                setDateLostFound(toInputDateTime(existing.dateLostFound));
                setReportType(existing.reportType || "Lost");
                setImagePath(existing.imagePath || null);
                setPreview(lfImageUrl(existing.imagePath));
            } catch (err) {
                if (cancelled) return;
                setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [isEditing, reportId]);

    // A locally chosen file previews instantly; the upload
    // itself happens on submit.
    const onFile = (file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(file);

        setPendingFile(file);
    };

    const [pendingFile, setPendingFile] = useState(null);

    const onSubmit = async (event) => {
        event.preventDefault();

        if (!itemName.trim()) {
            toast.error("Item name is required.");
            return;
        }

        setSaving(true);

        try {
            let imagePathToSend = imagePath;

            if (pendingFile) {
                const upload = await lfApi.uploadReportImage(pendingFile);
                imagePathToSend = upload.data;
            }

            const payload = {
                itemName: itemName.trim(),
                description: description.trim(),
                category: category.trim(),
                location: location.trim(),
                dateLostFound: dateLostFound
                    ? new Date(dateLostFound).toISOString()
                    : new Date().toISOString(),
                reportType,
                itemCustody: "AdminOffice",
                imagePath: imagePathToSend,
            };

            const response = isEditing
                ? await lfApi.updateReport(reportId, payload)
                : await lfApi.createReport(payload);

            toast.success(
                response.message ||
                    (isEditing ? "Report updated." : "Report submitted for review.")
            );

            navigate(
                isEditing
                    ? `${LOST_FOUND_HOME_ROUTE}/report/${reportId}`
                    : `${LOST_FOUND_HOME_ROUTE}/my-items`,
                { replace: true }
            );
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LfSkeleton rows={5} />;

    if (notFound) {
        return (
            <LfEmpty
                icon={SearchCheck}
                title="Report unavailable"
                message="Only your own pending reports can be edited."
                action={
                    <LfButton onClick={() => navigate(`${LOST_FOUND_HOME_ROUTE}/my-items`)}>
                        My items
                    </LfButton>
                }
            />
        );
    }

    if (error) return <LfNotice tone="bad">{error}</LfNotice>;

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

            <LfPanel
                title={isEditing ? "Edit report" : "Report an item"}
                subtitle={
                    isEditing
                        ? "Changes go back into review."
                        : "Reports are reviewed by the Lost & Found admin before they appear on the board."
                }
            >
                <div className="space-y-4">
                    {/* ---------- type ---------- */}
                    <fieldset>
                        <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            I am reporting a…
                        </legend>
                        <div className="grid grid-cols-2 gap-2">
                            {["Lost", "Found"].map((type) => {
                                const active = reportType === type;

                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setReportType(type)}
                                        aria-pressed={active}
                                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                            active
                                                ? "border-transparent text-white"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                        style={
                                            active
                                                ? {
                                                      backgroundColor:
                                                          type === "Found"
                                                              ? LF_COLORS.secondary
                                                              : LF_COLORS.primary,
                                                  }
                                                : undefined
                                        }
                                    >
                                        {type === "Found" ? "Found item" : "Lost item"}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* ---------- details ---------- */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {lfField("Item name *", {
                            value: itemName,
                            onChange: (e) => setItemName(e.target.value),
                            placeholder: "e.g. Blue Yonex racket",
                            maxLength: 255,
                            required: true,
                        })}
                        {lfField("Category", {
                            value: category,
                            onChange: (e) => setCategory(e.target.value),
                            placeholder: "e.g. Sports Gear",
                            list: "lf-categories",
                        })}
                        {lfField("Location", {
                            value: location,
                            onChange: (e) => setLocation(e.target.value),
                            placeholder: "e.g. Library 2nd floor",
                            maxLength: 255,
                        })}
                        <label className="block">
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Date and time {reportType === "Found" ? "found" : "lost"}
                            </span>
                            <input
                                type="datetime-local"
                                value={dateLostFound}
                                onChange={(e) => setDateLostFound(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#106A2E]/40 focus:outline-none focus:ring-2 focus:ring-[#106A2E]/15"
                            />
                        </label>
                    </div>
                    <datalist id="lf-categories">
                        {CATEGORIES.map((categoryOption) => (
                            <option key={categoryOption} value={categoryOption} />
                        ))}
                    </datalist>

                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Description
                        </span>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Color, brand, identifying marks, where exactly it was left…"
                            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#106A2E]/40 focus:outline-none focus:ring-2 focus:ring-[#106A2E]/15"
                        />
                    </label>

                    {/* ---------- handover (found only): office, always ---------- */}
                    {reportType === "Found" && (
                        <div className="rounded-xl border border-[#106A2E]/20 bg-[#106A2E]/[0.04] p-3.5 text-xs leading-5 text-slate-600">
                            <span className="font-semibold text-[#106A2E]">
                                Hand it to the office.
                            </span>{" "}
                            Every found item goes to the OneServe Student
                            Affairs Office - there is no keeping it while the
                            owner is looked for. Mention in the description
                            when you handed it over.
                        </div>
                    )}

                    {/* ---------- photo ---------- */}
                    <div>
                        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <Camera size={12} aria-hidden="true" />
                            Photo (optional)
                        </span>
                        <LfPhotoPicker onFile={onFile} preview={preview} />
                    </div>
                </div>
            </LfPanel>

            <div className="flex gap-2">
                <LfButton type="submit" loading={saving} className="flex-1">
                    {isEditing ? "Save changes" : "Submit report"}
                </LfButton>
                <LfButton type="button" variant="ghost" onClick={() => navigate(-1)}>
                    Cancel
                </LfButton>
            </div>
        </form>
    );
}
