import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    CalendarDays,
    Download,
    Eye,
    FileText,
    Filter,
    Lock,
    Paperclip,
    RefreshCw,
    Search,
    ShieldAlert,
    UserRound,
    X,
} from "lucide-react";

import KpiCard from "../components/dashboard/KpiCard";
import { EmptyState, PageHeader } from "../components/common";
import guidanceHeadService from "../services/guidanceHeadService";
import { saveBlob } from "../services/apiClient";
import { formatDate, formatDateTime, formatNumber } from "../utils/format";

const STATUS_OPTIONS = ["All", "Draft", "Finalized", "Archived"];
const ROLE_OPTIONS = ["All", "Student", "Faculty"];
const PAGE_SIZE = 20;

const statusClasses = (status) =>
    status === "Finalized"
        ? "bg-emerald-50 text-[#106A2E]"
        : status === "Archived"
          ? "bg-gray-100 text-gray-500"
          : "bg-amber-50 text-amber-700";

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClasses(status)}`}>
            {status}
        </span>
    );
}

function ReportDetailModal({ report, loading, error, onClose, onExport, onDownload, busy }) {
    useEffect(() => {
        if (!report && !loading) return undefined;
        const onKey = (event) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [report, loading, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Narrative report"
        >
            <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-5 py-4">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#106A2E]/10 text-[#106A2E]">
                            <FileText size={18} />
                        </span>
                        <div>
                            <h2 className="text-base font-semibold text-[#1F1F1F]">
                                {report?.reportTitle || "Narrative report"}
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-400">
                                {report?.reportNumber || "Draft"} · {report?.counselorName || ""}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {loading && !report && (
                        <div className="space-y-3" aria-busy="true">
                            {[0, 1, 2].map((n) => (
                                <div key={n} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                            ))}
                        </div>
                    )}

                    {error && (
                        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                    )}

                    {report && (
                        <div className="space-y-5">
                            <div className="grid gap-3 rounded-xl bg-gray-50 p-4 text-xs text-gray-600 sm:grid-cols-2">
                                <p>
                                    <span className="text-gray-400">Subject: </span>
                                    <b className="text-gray-800">{report.subjectName}</b> ({report.subjectRole})
                                </p>
                                <p>
                                    <span className="text-gray-400">ID number: </span>
                                    <b className="text-gray-800">{report.subjectIdNumber || "—"}</b>
                                </p>
                                <p>
                                    <span className="text-gray-400">Session date: </span>
                                    <b className="text-gray-800">{formatDate(report.sessionDate)}</b>
                                </p>
                                <p>
                                    <span className="text-gray-400">Concern: </span>
                                    <b className="text-gray-800">{report.concernType || "—"}</b>
                                </p>
                                <p>
                                    <span className="text-gray-400">Status: </span>
                                    <StatusBadge status={report.status} />
                                </p>
                                <p>
                                    <span className="text-gray-400">Version: </span>
                                    <b className="text-gray-800">{report.version}</b>
                                </p>
                            </div>

                            {report.isConfidential && (
                                <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                                    <ShieldAlert size={15} /> Confidential report. Handle with care.
                                </p>
                            )}

                            {[
                                ["Session summary", report.sessionSummary],
                                ["Session objectives", report.sessionObjectives],
                                ["Observations", report.observations],
                                ["Interventions / actions taken", report.interventions],
                                ["Recommendations", report.recommendations],
                                ["Follow-up plan", report.followUpPlan],
                            ].map(([label, value]) => (
                                <section key={label}>
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#106A2E]">
                                        {label}
                                    </h3>
                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                        {value || "—"}
                                    </p>
                                </section>
                            ))}

                            <section className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                                <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                                    <Lock size={12} /> Private notes
                                </h3>
                                <p className="mt-1 text-sm text-amber-900">
                                    {report.privateNotesRedacted
                                        ? "Private notes are withheld from Guidance Head accounts. Only the authoring counselor can read them."
                                        : report.privateNotes || "No private notes."}
                                </p>
                            </section>

                            {report.attachments?.length > 0 && (
                                <section>
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#106A2E]">
                                        Supporting files
                                    </h3>
                                    <ul className="mt-2 divide-y divide-gray-100">
                                        {report.attachments.map((attachment) => (
                                            <li key={attachment.id} className="flex items-center gap-2 py-2">
                                                <Paperclip size={14} className="text-gray-400" />
                                                <span className="min-w-0 flex-1 truncate text-xs text-gray-700">
                                                    {attachment.fileName}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => onDownload(attachment)}
                                                    disabled={busy === `download-${attachment.id}`}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                                    aria-label={`Download ${attachment.fileName}`}
                                                >
                                                    <Download size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            <section>
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#106A2E]">
                                    Audit trail
                                </h3>
                                <ul className="mt-2 space-y-2">
                                    {(report.events || []).map((event) => (
                                        <li key={event.id} className="flex items-start gap-2 text-xs">
                                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#106A2E]" />
                                            <div>
                                                <p className="font-medium text-gray-700">
                                                    {event.action} · {event.actorName} ({event.actorRole})
                                                </p>
                                                <p className="text-gray-400">
                                                    {formatDateTime(event.createdAt)}
                                                    {event.detail ? ` · ${event.detail}` : ""}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                    {!report.events?.length && (
                                        <li className="text-xs text-gray-400">No activity recorded.</li>
                                    )}
                                </ul>
                            </section>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/[0.06] px-5 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => onExport("docx")}
                        disabled={!report || !!busy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <Download size={15} /> DOCX
                    </button>
                    <button
                        type="button"
                        onClick={() => onExport("pdf")}
                        disabled={!report || !!busy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#106A2E] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#0a2c19] disabled:opacity-50"
                    >
                        <Download size={15} /> PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GuidanceNarrativeReportsPage() {
    const [params, setParams] = useSearchParams();

    const [filters, setFilters] = useState({
        search: "",
        status: "All",
        subjectRole: "All",
        studentId: params.get("studentId") || "",
        counselorId: params.get("counselorId") || "",
        from: "",
        to: "",
    });
    const [page, setPage] = useState(1);

    const [data, setData] = useState(null);
    const [stats, setStats] = useState(null);
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const [detailId, setDetailId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [busy, setBusy] = useState("");

    const subjectLabel = params.get("subjectName");
    const counselorLabel = params.get("counselorName");

    useEffect(() => {
        guidanceHeadService
            .listCounselors({ page: 1, pageSize: 100 })
            .then((pageData) => setCounselors(pageData.items || []))
            .catch(() => setCounselors([]));
    }, []);

    const queryParams = useMemo(
        () => ({
            search: filters.search.trim(),
            status: filters.status === "All" ? "" : filters.status,
            subjectRole: filters.subjectRole === "All" ? "" : filters.subjectRole,
            studentId: filters.studentId || "",
            counselorId: filters.counselorId || "",
            from: filters.from,
            to: filters.to,
            page,
            pageSize: PAGE_SIZE,
        }),
        [filters, page]
    );

    useEffect(() => {
        const controller = new AbortController();

        queueMicrotask(() => {
            setLoading(true);
            setError(null);

            Promise.all([
                guidanceHeadService.listNarrativeReports(queryParams, { signal: controller.signal }),
                guidanceHeadService.getNarrativeReportStats({ signal: controller.signal }),
            ])
                .then(([list, overview]) => {
                    setData(list);
                    setStats(overview);
                })
                .catch((err) => {
                    if (err?.name !== "AbortError") setError(err?.message || "Unable to load reports.");
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        });

        return () => controller.abort();
    }, [queryParams, reloadKey]);

    const update = (patch) => {
        setFilters((prev) => ({ ...prev, ...patch }));
        setPage(1);
    };

    const clearPersonFilter = () => {
        setFilters((prev) => ({ ...prev, studentId: "", counselorId: "" }));
        setPage(1);
        setParams({});
    };

    const openReport = async (id) => {
        setDetailId(id);
        setDetail(null);
        setDetailError("");
        setDetailLoading(true);

        try {
            setDetail(await guidanceHeadService.getNarrativeReport(id));
        } catch (err) {
            setDetailError(err?.message || "Unable to open that report.");
        } finally {
            setDetailLoading(false);
        }
    };

    const exportReport = async (format) => {
        if (!detail) return;
        setBusy(`export-${format}`);
        try {
            const { blob, fileName } = await guidanceHeadService.exportNarrativeReport(detail.id, format);
            saveBlob(blob, fileName);
        } catch (err) {
            setDetailError(err?.message || "Export failed.");
        } finally {
            setBusy("");
        }
    };

    const downloadAttachment = async (attachment) => {
        if (!detail) return;
        setBusy(`download-${attachment.id}`);
        try {
            const { blob, fileName } = await guidanceHeadService.downloadNarrativeAttachment(
                detail.id,
                attachment.id
            );
            saveBlob(blob, fileName || attachment.fileName);
        } catch (err) {
            setDetailError(err?.message || "Download failed.");
        } finally {
            setBusy("");
        }
    };

    const items = data?.items || [];
    const totalPages = data?.totalPages || 1;
    const currentPage = data?.page || 1;

    return (
        <>
            <PageHeader
                eyebrow="Insights"
                icon={FileText}
                title="Narrative Reports"
                description="Review every counselor's narrative reports by subject or by counselor. Reports are read-only here; private notes stay with the authoring counselor."
                loading={loading && !data}
                actions={
                    <button
                        type="button"
                        onClick={() => setReloadKey((n) => n + 1)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        <RefreshCw size={15} /> Refresh
                    </button>
                }
            />

            {(filters.studentId || filters.counselorId) && (
                <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-[#106A2E]/20 bg-[#106A2E]/5 px-4 py-3 text-sm text-[#0a2c19]">
                    <Filter size={15} />
                    <span>
                        Showing reports for{" "}
                        <b>{subjectLabel || counselorLabel || (filters.studentId ? "selected person" : "selected counselor")}</b>
                    </span>
                    <button
                        type="button"
                        onClick={clearPersonFilter}
                        className="ml-auto inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-600 shadow-sm"
                    >
                        <X size={12} /> Clear filter
                    </button>
                </div>
            )}

            {error && !data && (
                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {stats && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard icon={FileText} label="Total reports" value={formatNumber(stats.total)} />
                    <KpiCard icon={Eye} label="Drafts" value={formatNumber(stats.draft)} tone="amber" />
                    <KpiCard icon={FileText} label="Finalized" value={formatNumber(stats.finalized)} tone="blue" />
                    <KpiCard icon={UserRound} label="Subjects" value={formatNumber(stats.subjects)} tone="green" />
                </div>
            )}

            <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                <div className="grid gap-3 border-b border-black/[0.06] px-5 py-4 lg:grid-cols-[1fr_auto]">
                    <div className="relative">
                        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(event) => update({ search: event.target.value })}
                            placeholder="Search report no., title, subject, counselor or concern"
                            className="w-full rounded-lg border border-black/[0.08] bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-[#106A2E]"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={filters.status}
                            onChange={(event) => update({ status: event.target.value })}
                            className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700"
                            aria-label="Status filter"
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option === "All" ? "All statuses" : option}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.subjectRole}
                            onChange={(event) => update({ subjectRole: event.target.value })}
                            className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700"
                            aria-label="Subject role filter"
                        >
                            {ROLE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option === "All" ? "Student & Faculty" : option}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.counselorId}
                            onChange={(event) => update({ counselorId: event.target.value })}
                            className="max-w-[190px] rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700"
                            aria-label="Counselor filter"
                        >
                            <option value="">All counselors</option>
                            {counselors.map((counselor) => (
                                <option key={counselor.userId} value={counselor.userId}>
                                    {counselor.fullName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.04] px-5 py-2.5 text-xs text-gray-500">
                    <CalendarDays size={14} className="text-gray-400" />
                    <label className="flex items-center gap-1.5">
                        From
                        <input
                            type="date"
                            value={filters.from}
                            onChange={(event) => update({ from: event.target.value })}
                            className="rounded-md border border-black/[0.08] px-2 py-1 text-xs"
                        />
                    </label>
                    <label className="flex items-center gap-1.5">
                        To
                        <input
                            type="date"
                            value={filters.to}
                            onChange={(event) => update({ to: event.target.value })}
                            className="rounded-md border border-black/[0.08] px-2 py-1 text-xs"
                        />
                    </label>
                    <span className="ml-auto">
                        {data ? `${formatNumber(data.totalItems)} report${data.totalItems === 1 ? "" : "s"}` : ""}
                    </span>
                </div>

                {loading && items.length === 0 ? (
                    <div className="space-y-3 p-5" aria-busy="true">
                        {[0, 1, 2].map((n) => (
                            <div key={n} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No narrative reports found"
                        description="Reports written by counselors will appear here automatically."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-black/[0.06] text-[11px] uppercase tracking-wide text-gray-400">
                                    <th className="px-4 py-3 font-medium">Report</th>
                                    <th className="px-4 py-3 font-medium">Subject</th>
                                    <th className="px-4 py-3 font-medium">Counselor</th>
                                    <th className="px-4 py-3 font-medium">Session date</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-black/[0.04]">
                                {items.map((report) => (
                                    <tr key={report.id} className="transition hover:bg-gray-50/60">
                                        <td className="px-4 py-3">
                                            <p className="max-w-[240px] truncate text-sm font-medium text-gray-800">
                                                {report.reportTitle || "Narrative report"}
                                            </p>
                                            <p className="text-[11px] text-gray-400">
                                                {report.reportNumber || `Draft #${report.id}`}
                                                {report.attachmentCount > 0 ? ` · ${report.attachmentCount} file(s)` : ""}
                                                {report.hasPrivateNotes ? " · private notes" : ""}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    update({ studentId: report.subjectId, counselorId: "" })
                                                }
                                                className="text-sm font-medium text-gray-700 hover:text-[#106A2E]"
                                            >
                                                {report.subjectName}
                                            </button>
                                            <p className="text-[11px] text-gray-400">
                                                {report.subjectIdNumber || "—"} · {report.subjectRole}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    update({ counselorId: report.counselorId, studentId: "" })
                                                }
                                                className="hover:text-[#106A2E]"
                                            >
                                                {report.counselorName}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatDate(report.sessionDate)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={report.status} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => openReport(report.id)}
                                                className="inline-flex items-center gap-1.5 rounded-md border border-black/[0.08] bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-[#106A2E]/40 hover:bg-[#106A2E]/5 hover:text-[#106A2E]"
                                            >
                                                <Eye size={13} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-black/[0.05] px-5 py-3">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <span className="text-xs text-gray-500">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </section>

            {(detailId || detailLoading) && (
                <ReportDetailModal
                    report={detail}
                    loading={detailLoading}
                    error={detailError}
                    busy={busy}
                    onClose={() => {
                        setDetailId(null);
                        setDetail(null);
                        setDetailError("");
                    }}
                    onExport={exportReport}
                    onDownload={downloadAttachment}
                />
            )}
        </>
    );
}
