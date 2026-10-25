import { useEffect, useMemo, useRef, useState } from "react";
import {
    BarChart3,
    CalendarCheck2,
    Check,
    CheckCircle2,
    Copy,
    Download,
    ExternalLink,
    FileText,
    FolderOpen,
    Loader2,
    NotebookPen,
    Search,
    Trash2,
    UploadCloud,
    UserRoundX,
    X,
    XCircle,
} from "lucide-react";

import KpiCard from "../components/dashboard/KpiCard";
import { EmptyState, PageHeader } from "../components/common";
import guidanceHeadService from "../services/guidanceHeadService";
import { formatDate, formatNumber } from "../utils/format";

const PERIODS = [
    { days: 7, label: "Last 7 days" },
    { days: 30, label: "Last 30 days" },
    { days: 90, label: "Last 3 months" },
    { days: 365, label: "Last 12 months" },
];

const STATUS_COLORS = {
    Pending: "#E0A400",
    Confirmed: "#2F80ED",
    Completed: "#106A2E",
    Cancelled: "#9CA3AF",
    Rejected: "#DC2626",
    Expired: "#6B7280",
};

const ACCENT = "#106A2E";

// Repository upload rules (validated on the client before sending).
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];
const MAX_FILE_MB = 10;

const EXT_BADGE = {
    ".pdf": "bg-red-50 text-red-600",
    ".doc": "bg-blue-50 text-blue-600",
    ".docx": "bg-blue-50 text-blue-600",
    ".txt": "bg-gray-100 text-gray-600",
};

const getExt = (name = "") => {
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i).toLowerCase() : "";
};

const formatSize = (bytes = 0) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const formatUploaded = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const DOCX_MIME =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Turns the (editable) plain-text narrative into a real Word document.
// `docx` is loaded on demand so it doesn't add to the initial page bundle.
async function buildDocxBlob(text) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } =
        await import("docx");

    const children = text.split("\n").map((raw, index) => {
        const line = raw.trimEnd();

        if (!line.trim()) return new Paragraph({ spacing: { after: 120 } });

        // First line = document title
        if (index === 0) {
            return new Paragraph({
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 },
                children: [new TextRun({ text: line, bold: true, color: "1F1F1F" })],
            });
        }

        // "- item" -> bullet
        if (line.startsWith("- ")) {
            return new Paragraph({
                bullet: { level: 0 },
                children: [new TextRun(line.slice(2))],
            });
        }

        // "Section name:" -> heading
        if (line.endsWith(":")) {
            return new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 160, after: 80 },
                children: [new TextRun({ text: line.slice(0, -1), bold: true, color: "106A2E" })],
            });
        }

        // "Label: value" -> bold label
        const kv = line.match(/^([^:]{1,40}):\s+(.+)$/);
        if (kv) {
            return new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: `${kv[1]}: `, bold: true }), new TextRun(kv[2])],
            });
        }

        return new Paragraph({ children: [new TextRun(line)] });
    });

    const doc = new Document({
        styles: { default: { document: { run: { font: "Calibri", size: 24 } } } },
        sections: [{ children }],
    });

    return Packer.toBlob(doc);
}

function BarList({ items, color = ACCENT, empty }) {
    const max = Math.max(1, ...items.map((i) => i.count));

    if (!items.length) {
        return <p className="px-5 py-8 text-center text-sm text-gray-400">{empty}</p>;
    }

    return (
        <ul className="space-y-3 px-5 py-5">
            {items.map((item) => (
                <li key={item.label}>
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700">{item.label}</span>
                        <span className="text-gray-500">{item.count}</span>
                    </div>

                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${Math.round((item.count / max) * 100)}%`,
                                background: item.color || color,
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

// Column chart built from plain CSS - no chart library in this project.
function ColumnChart({ items, color = ACCENT }) {
    const max = Math.max(1, ...items.map((i) => i.count));

    if (!items.length) {
        return <p className="px-5 py-8 text-center text-sm text-gray-400">No data in this period.</p>;
    }

    return (
        <div className="px-5 py-5">
            <div className="flex h-40 items-end gap-2">
                {items.map((item) => (
                    <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                        <span className="text-[10px] font-medium text-gray-500">
                            {item.count}
                        </span>

                        <div
                            className="w-full rounded-t-md transition-all"
                            style={{
                                height: `${Math.max(4, Math.round((item.count / max) * 100))}%`,
                                background: color,
                                opacity: item.count === 0 ? 0.25 : 1,
                            }}
                            title={`${item.label}: ${item.count}`}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-2 flex gap-2 border-t border-black/[0.06] pt-2">
                {items.map((item) => (
                    <span
                        key={item.label}
                        className="flex-1 text-center text-[10px] leading-tight text-gray-400"
                    >
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

function NarrativeModal({
    open,
    title,
    subtitle,
    value,
    onChange,
    onClose,
    onDownload,
    onSave,
    saving,
    downloading,
}) {
    const [copied, setCopied] = useState(false);

    // Close on Escape + lock background scroll while the modal is open.
    useEffect(() => {
        if (!open) return undefined;

        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        const previousOverflow = document.body.style.overflow;

        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // Clipboard can be blocked; the textarea is still selectable.
        }
    };

    const hasText = value.trim().length > 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-5 py-4">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#106A2E]/10 text-[#106A2E]">
                            <FileText size={18} />
                        </span>
                        <div>
                            <h2 className="text-base font-semibold text-[#1F1F1F]">{title}</h2>
                            {subtitle && (
                                <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <p className="mb-2 text-xs text-gray-400">
                        Edit the text if needed, then save it to the repository or download it as
                        a Word document (.docx).
                    </p>

                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={14}
                        placeholder="Generated narrative will appear here..."
                        className="w-full resize-y rounded-xl border border-black/[0.08] bg-[#FAFAF7] p-4 font-mono text-[13px] leading-relaxed text-gray-700 outline-none focus:border-[#106A2E]"
                    />
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/[0.06] bg-white px-5 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        onClick={handleCopy}
                        disabled={!hasText}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                        {copied ? "Copied" : "Copy"}
                    </button>

                    <button
                        type="button"
                        onClick={onDownload}
                        disabled={!hasText || downloading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        {downloading ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <Download size={15} />
                        )}
                        Download .docx
                    </button>

                    <button
                        type="button"
                        onClick={onSave}
                        disabled={!hasText || saving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#106A2E] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#0a2c19] disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <FolderOpen size={15} />
                        )}
                        {saving ? "Saving..." : "Save to repository"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GuidanceReportsPage() {
    const [days, setDays] = useState(30);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const [narrative, setNarrative] = useState("");
    const [narrativeMeta, setNarrativeMeta] = useState({
        title: "Narrative report",
        subtitle: "",
        filename: "guidance-narrative-report.docx",
    });
    const [narrativeOpen, setNarrativeOpen] = useState(false);
    const [savingNarrative, setSavingNarrative] = useState(false);
    const [downloadingNarrative, setDownloadingNarrative] = useState(false);

    const [counselorQuery, setCounselorQuery] = useState("");

    // Repository state
    const [repoFiles, setRepoFiles] = useState([]);
    const [repoLoading, setRepoLoading] = useState(true);
    const [repoReloadKey, setRepoReloadKey] = useState(0);
    const [repoQuery, setRepoQuery] = useState("");
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null); // { type: "success" | "error", text }
    const fileInputRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();

        // Deferred so the effect body never sets state synchronously.
        queueMicrotask(() => {
            setLoading(true);
            setError(null);

            guidanceHeadService
                .getReports(days, { signal: controller.signal })
                .then(setReport)
                .catch((err) => {
                    if (err?.name === "AbortError") return;
                    setError(err?.message || "Unable to load the report.");
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        });

        return () => controller.abort();
    }, [days, reloadKey]);

    // Load the repository list (and reload whenever repoReloadKey changes).
    useEffect(() => {
        let cancelled = false;

        guidanceHeadService
            .listNarrativeReports()
            .then((data) => {
                if (!cancelled) setRepoFiles(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (!cancelled) setRepoFiles([]);
            })
            .finally(() => {
                if (!cancelled) setRepoLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [repoReloadKey]);

    // Auto-dismiss the toast.
    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [toast]);

    const appointmentsTotal = (report?.appointmentsByStatus || []).reduce(
        (sum, i) => sum + i.count,
        0
    );
    const completed = report?.appointmentsByStatus?.find((i) => i.label === "Completed")?.count ?? 0;
    const sessionsTotal = (report?.sessionsByMonth || []).reduce((sum, i) => sum + i.count, 0);
    const neverSignedIn = report?.accounts
        ? report.accounts.neverSignedInStudents + report.accounts.neverSignedInCounselors
        : 0;

    const counselors = report?.counselors || [];
    const filteredCounselors = useMemo(() => {
        const q = counselorQuery.trim().toLowerCase();
        if (!q) return counselors;
        return counselors.filter((c) => (c.fullName || "").toLowerCase().includes(q));
    }, [counselors, counselorQuery]);

    const visibleRepoFiles = useMemo(() => {
        const q = repoQuery.trim().toLowerCase();
        return [...repoFiles]
            .filter((f) => !q || (f.name || "").toLowerCase().includes(q))
            .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
    }, [repoFiles, repoQuery]);

    const periodLabel = report
        ? `${formatDate(report.from)} to ${formatDate(report.to)}`
        : "";

    const openNarrative = (text, meta) => {
        setNarrative(text);
        setNarrativeMeta(meta);
        setNarrativeOpen(true);
    };

    const generateNarrative = () => {
        if (!report) return;
        const lines = [];
        lines.push("NARRATIVE REPORT - GUIDANCE COUNSELING MONITORING");
        lines.push(`Period: ${periodLabel}`);
        lines.push("");
        lines.push(`Total appointments: ${appointmentsTotal}`);
        lines.push(`Completed sessions: ${completed}`);
        lines.push(`Counseling records written: ${sessionsTotal}`);
        lines.push(`Never signed in: ${neverSignedIn}`);
        lines.push("");
        lines.push("Appointments by status:");
        (report.appointmentsByStatus || []).forEach((i) => lines.push(`- ${i.label}: ${i.count}`));
        lines.push("");
        lines.push("Top concerns:");
        (report.appointmentsByConcern || []).forEach((i) => lines.push(`- ${i.label}: ${i.count}`));
        lines.push("");
        lines.push("Counselor performance:");
        (report.counselors || []).forEach((c) =>
            lines.push(
                `- ${c.fullName}: ${c.appointments} appointments, ${c.completed} completed, ${c.sessions} records`
            )
        );
        lines.push("");
        lines.push("Account activity:");
        if (report.accounts) {
            lines.push(`- Signed in (last 7 days): ${report.accounts.signedInLast7Days}`);
            lines.push(`- Signed in (last 30 days): ${report.accounts.signedInLast30Days}`);
            lines.push(`- Students never signed in: ${report.accounts.neverSignedInStudents}`);
            lines.push(`- Counselors never signed in: ${report.accounts.neverSignedInCounselors}`);
        }

        openNarrative(lines.join("\n"), {
            title: "Overall narrative report",
            subtitle: periodLabel,
            filename: "guidance-narrative-report.docx",
        });
    };

    const generateCounselorNarrative = (c) => {
        const lines = [];
        lines.push("COUNSELOR NARRATIVE REPORT");
        lines.push(`Counselor: ${c.fullName}`);
        lines.push(`Period: ${periodLabel}`);
        lines.push("");
        lines.push(`Appointments handled: ${c.appointments}`);
        lines.push(`Completed sessions: ${c.completed}`);
        lines.push(`Counseling records written: ${c.sessions}`);

        const slug = (c.fullName || "counselor")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        openNarrative(lines.join("\n"), {
            title: `Narrative report - ${c.fullName}`,
            subtitle: periodLabel,
            filename: `counselor-narrative-${slug || "report"}.docx`,
        });
    };

    const downloadNarrative = async () => {
        if (!narrative.trim() || downloadingNarrative) return;
        setDownloadingNarrative(true);

        try {
            const blob = await buildDocxBlob(narrative);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = narrativeMeta.filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setToast({
                type: "error",
                text: err?.message || "Unable to create the Word document.",
            });
        } finally {
            setDownloadingNarrative(false);
        }
    };

    // Save the generated narrative straight into the repository (same upload endpoint).
    const saveNarrativeToRepository = async () => {
        if (!narrative.trim() || savingNarrative) return;
        setSavingNarrative(true);

        try {
            const blob = await buildDocxBlob(narrative);
            const file = new File([blob], narrativeMeta.filename, { type: DOCX_MIME });
            await guidanceHeadService.uploadNarrativeReport(file);
            setRepoReloadKey((n) => n + 1);
            setNarrativeOpen(false);
            setToast({ type: "success", text: "Narrative saved to the repository." });
        } catch (err) {
            setToast({ type: "error", text: err?.message || "Unable to save the narrative." });
        } finally {
            setSavingNarrative(false);
        }
    };

    // Upload one or more files picked from the button or dropped on the card.
    const processFiles = async (fileList) => {
        const files = Array.from(fileList || []);
        if (!files.length || uploading) return;

        const valid = [];
        const problems = [];

        files.forEach((file) => {
            if (!ALLOWED_EXTENSIONS.includes(getExt(file.name))) {
                problems.push(`${file.name}: only PDF, DOC, DOCX or TXT files are allowed.`);
            } else if (file.size > MAX_FILE_MB * 1024 * 1024) {
                problems.push(`${file.name}: larger than ${MAX_FILE_MB} MB.`);
            } else {
                valid.push(file);
            }
        });

        let uploaded = 0;

        if (valid.length) {
            setUploading(true);

            for (const file of valid) {
                try {
                    await guidanceHeadService.uploadNarrativeReport(file);
                    uploaded += 1;
                } catch (err) {
                    problems.push(`${file.name}: ${err?.message || "upload failed."}`);
                }
            }

            setUploading(false);
            if (uploaded) setRepoReloadKey((n) => n + 1);
        }

        if (problems.length) {
            setToast({
                type: "error",
                text:
                    uploaded > 0
                        ? `${uploaded} uploaded. ${problems[0]}`
                        : problems[0],
            });
        } else {
            setToast({
                type: "success",
                text: uploaded === 1 ? "Report uploaded." : `${uploaded} reports uploaded.`,
            });
        }
    };

    const handlePick = (e) => {
        processFiles(e.target.files);
        e.target.value = "";
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        processFiles(e.dataTransfer?.files);
    };

    const deleteRepoFile = async (id) => {
        setDeletingId(id);
        try {
            await guidanceHeadService.deleteNarrativeReport(id);
            setConfirmDeleteId(null);
            setRepoReloadKey((n) => n + 1);
            setToast({ type: "success", text: "Report deleted." });
        } catch (err) {
            setToast({ type: "error", text: err?.message || "Delete failed." });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <PageHeader
                eyebrow="Insights"
                icon={BarChart3}
                title="Reports"
                description="How the Guidance module is being used over a chosen period."
                loading={loading && !report}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            aria-label="Reporting period"
                            className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#106A2E]"
                        >
                            {PERIODS.map((p) => (
                                <option key={p.days} value={p.days}>
                                    {p.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => setReloadKey((n) => n + 1)}
                            className="rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={generateNarrative}
                            disabled={!report}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#106A2E] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#0a2c19] disabled:opacity-50"
                        >
                            <FileText size={15} />
                            Generate narrative
                        </button>
                    </div>
                }
            />

            {error && !report && (
                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {report && (
                <p className="-mt-4 mb-6 text-xs text-gray-400">
                    {formatDate(report.from)} – {formatDate(report.to)}
                </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    loading={loading && !report}
                    icon={CalendarCheck2}
                    label="Appointments"
                    value={formatNumber(appointmentsTotal)}
                    sub="Booked in this period"
                />
                <KpiCard
                    loading={loading && !report}
                    icon={CalendarCheck2}
                    label="Completed"
                    value={formatNumber(completed)}
                    sub="Sessions that took place"
                    tone="blue"
                />
                <KpiCard
                    loading={loading && !report}
                    icon={NotebookPen}
                    label="Records written"
                    value={formatNumber(sessionsTotal)}
                    sub="Counseling records"
                    tone="amber"
                />
                <KpiCard
                    loading={loading && !report}
                    icon={UserRoundX}
                    label="Never signed in"
                    value={formatNumber(neverSignedIn)}
                    sub="Students and counselors"
                    tone={neverSignedIn > 0 ? "red" : "green"}
                />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    <div className="border-b border-black/[0.06] px-5 py-4">
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">
                            Appointments by status
                        </h2>
                    </div>
                    <BarList
                        items={(report?.appointmentsByStatus || []).map((i) => ({
                            ...i,
                            color: STATUS_COLORS[i.label],
                        }))}
                        empty="No appointments in this period."
                    />
                </section>

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    <div className="border-b border-black/[0.06] px-5 py-4">
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">Top concerns</h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                            Why students book, most common first
                        </p>
                    </div>
                    <BarList
                        items={report?.appointmentsByConcern || []}
                        color="#2F80ED"
                        empty="No concerns recorded in this period."
                    />
                </section>

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    <div className="border-b border-black/[0.06] px-5 py-4">
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">
                            Appointments by month
                        </h2>
                    </div>
                    <ColumnChart items={report?.appointmentsByMonth || []} />
                </section>

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    <div className="border-b border-black/[0.06] px-5 py-4">
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">
                            Counseling records by month
                        </h2>
                    </div>
                    <ColumnChart items={report?.sessionsByMonth || []} color="#2F80ED" />
                </section>
            </div>

            <section className="mt-6 rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
                    <div>
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">
                            Counselor performance
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                            Appointments handled and records written in this period
                        </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search
                            size={15}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            value={counselorQuery}
                            onChange={(e) => setCounselorQuery(e.target.value)}
                            placeholder="Search counselor..."
                            aria-label="Search counselor"
                            className="w-full rounded-lg border border-black/[0.08] bg-white py-2 pl-9 pr-8 text-sm text-gray-700 outline-none focus:border-[#106A2E]"
                        />
                        {counselorQuery && (
                            <button
                                type="button"
                                onClick={() => setCounselorQuery("")}
                                aria-label="Clear search"
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {loading && !report ? (
                    <div className="space-y-3 p-5" aria-busy="true">
                        {[0, 1, 2].map((n) => (
                            <div key={n} className="h-12 animate-pulse rounded-lg bg-gray-100" />
                        ))}
                    </div>
                ) : !counselors.length ? (
                    <EmptyState
                        icon={BarChart3}
                        title="No counselors yet."
                        description="Add a counselor account to start tracking activity."
                    />
                ) : !filteredCounselors.length ? (
                    <p className="px-5 py-10 text-center text-sm text-gray-400">
                        No counselor matches &ldquo;{counselorQuery.trim()}&rdquo;.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-black/[0.06] text-[11px] uppercase tracking-wide text-gray-400">
                                    <th className="px-4 py-3 font-medium">Counselor</th>
                                    <th className="px-4 py-3 font-medium">Appointments</th>
                                    <th className="px-4 py-3 font-medium">Completed</th>
                                    <th className="px-4 py-3 font-medium">Records</th>
                                    <th className="px-4 py-3 text-right font-medium">Narrative</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-black/[0.04]">
                                {filteredCounselors.map((c) => (
                                    <tr key={c.id ?? c.fullName} className="transition hover:bg-gray-50/60">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                            {c.fullName}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatNumber(c.appointments)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatNumber(c.completed)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatNumber(c.sessions)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => generateCounselorNarrative(c)}
                                                className="inline-flex items-center gap-1.5 rounded-md border border-black/[0.08] bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-[#106A2E]/40 hover:bg-[#106A2E]/5 hover:text-[#106A2E]"
                                            >
                                                <FileText size={13} />
                                                Generate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {counselorQuery.trim() && (
                            <p className="border-t border-black/[0.04] px-4 py-2 text-xs text-gray-400">
                                Showing {filteredCounselors.length} of {counselors.length} counselors
                            </p>
                        )}
                    </div>
                )}
            </section>

            {report?.accounts && (
                <section className="mt-6 rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-[#1F1F1F]">Account activity</h2>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            ["Signed in, last 7 days", report.accounts.signedInLast7Days],
                            ["Signed in, last 30 days", report.accounts.signedInLast30Days],
                            ["Students never signed in", report.accounts.neverSignedInStudents],
                            ["Counselors never signed in", report.accounts.neverSignedInCounselors],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-xl bg-[#FAFAF7] px-4 py-3">
                                <dt className="text-xs text-gray-500">{label}</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-800">
                                    {formatNumber(value)}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            )}

            {/* Narrative report - compact card; the editor itself lives in the modal */}
            <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                <div>
                    <h2 className="text-sm font-semibold text-[#1F1F1F]">Narrative report</h2>
                    <p className="mt-0.5 text-xs text-gray-400">
                        Generate a summary from the monitoring data, edit it, then download it or
                        save it to the repository below.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {narrative.trim() && (
                        <button
                            type="button"
                            onClick={() => setNarrativeOpen(true)}
                            className="rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                            Reopen last draft
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={generateNarrative}
                        disabled={!report}
                        className="rounded-lg bg-[#106A2E] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#0a2c19] disabled:opacity-50"
                    >
                        Generate overall narrative
                    </button>
                </div>
            </section>

            {/* Report repository - the only place to upload files */}
            <section
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!dragging) setDragging(true);
                }}
                onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
                }}
                onDrop={handleDrop}
                className={`relative mt-6 rounded-2xl border bg-white shadow-sm transition ${
                    dragging
                        ? "border-[#106A2E] ring-2 ring-[#106A2E]/20"
                        : "border-black/[0.05]"
                }`}
            >
                {dragging && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/90">
                        <UploadCloud size={32} className="text-[#106A2E]" />
                        <p className="text-sm font-medium text-[#106A2E]">
                            Drop files to upload
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1F1F1F]">
                            Report repository
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                                {repoFiles.length}
                            </span>
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                            Saved and uploaded narrative reports. You can also drag files onto this
                            card.
                        </p>
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                        <div className="relative flex-1 sm:w-56 sm:flex-none">
                            <Search
                                size={15}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={repoQuery}
                                onChange={(e) => setRepoQuery(e.target.value)}
                                placeholder="Search files..."
                                aria-label="Search repository"
                                className="w-full rounded-lg border border-black/[0.08] bg-white py-2 pl-9 pr-8 text-sm text-gray-700 outline-none focus:border-[#106A2E]"
                            />
                            {repoQuery && (
                                <button
                                    type="button"
                                    onClick={() => setRepoQuery("")}
                                    aria-label="Clear search"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#106A2E] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#0a2c19] disabled:opacity-60"
                        >
                            {uploading ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <UploadCloud size={15} />
                            )}
                            {uploading ? "Uploading..." : "Upload report"}
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={ALLOWED_EXTENSIONS.join(",")}
                            className="hidden"
                            onChange={handlePick}
                        />
                    </div>
                </div>

                {repoLoading ? (
                    <div className="space-y-3 p-5" aria-busy="true">
                        {[0, 1].map((n) => (
                            <div key={n} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                        ))}
                    </div>
                ) : repoFiles.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#106A2E]/10 text-[#106A2E]">
                            <FolderOpen size={22} />
                        </span>
                        <p className="mt-3 text-sm font-medium text-gray-700">
                            No reports in the repository yet
                        </p>
                        <p className="mt-1 max-w-sm text-xs text-gray-400">
                            Generate a narrative and choose &ldquo;Save to repository&rdquo;, or
                            upload a file. Accepted: PDF, DOC, DOCX, TXT (up to {MAX_FILE_MB} MB).
                        </p>
                    </div>
                ) : visibleRepoFiles.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-gray-400">
                        No file matches &ldquo;{repoQuery.trim()}&rdquo;.
                    </p>
                ) : (
                    <ul className="divide-y divide-black/[0.05]">
                        {visibleRepoFiles.map((f) => {
                            const ext = getExt(f.name);
                            const confirming = confirmDeleteId === f.id;
                            const deleting = deletingId === f.id;

                            return (
                                <li
                                    key={f.id}
                                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-gray-50/60"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase ${
                                                EXT_BADGE[ext] || "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            {ext.replace(".", "") || "file"}
                                        </span>

                                        <div className="min-w-0">
                                            <p
                                                className="truncate text-sm font-medium text-gray-800"
                                                title={f.name}
                                            >
                                                {f.name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatSize(f.size)}
                                                {f.uploadedAt && ` · ${formatUploaded(f.uploadedAt)}`}
                                            </p>
                                        </div>
                                    </div>

                                    {confirming ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">
                                                Delete this file?
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteId(null)}
                                                disabled={deleting}
                                                className="rounded-md border border-black/[0.08] bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteRepoFile(f.id)}
                                                disabled={deleting}
                                                className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                                            >
                                                {deleting && (
                                                    <Loader2 size={12} className="animate-spin" />
                                                )}
                                                Delete
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <a
                                                href={f.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Open"
                                                aria-label={`Open ${f.name}`}
                                                className="rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                            <a
                                                href={f.url}
                                                download={f.name}
                                                title="Download"
                                                aria-label={`Download ${f.name}`}
                                                className="rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                            >
                                                <Download size={16} />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteId(f.id)}
                                                title="Delete"
                                                aria-label={`Delete ${f.name}`}
                                                className="rounded-md p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <NarrativeModal
                open={narrativeOpen}
                title={narrativeMeta.title}
                subtitle={narrativeMeta.subtitle}
                value={narrative}
                onChange={setNarrative}
                onClose={() => setNarrativeOpen(false)}
                onDownload={downloadNarrative}
                onSave={saveNarrativeToRepository}
                saving={savingNarrative}
                downloading={downloadingNarrative}
            />

            {/* Toast */}
            {toast && (
                <div
                    role="status"
                    className={`fixed bottom-4 right-4 z-[60] flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg ${
                        toast.type === "error"
                            ? "border-red-100 bg-red-50 text-red-700"
                            : "border-green-100 bg-white text-gray-700"
                    }`}
                >
                    {toast.type === "error" ? (
                        <XCircle size={18} className="mt-0.5 shrink-0" />
                    ) : (
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#106A2E]" />
                    )}
                    <span className="flex-1">{toast.text}</span>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        aria-label="Dismiss"
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
        </>
    );
}