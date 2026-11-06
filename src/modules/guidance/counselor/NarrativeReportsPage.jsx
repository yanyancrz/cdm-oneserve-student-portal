import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    CalendarDays,
    Download,
    FilePlus2,
    FileText,
    Lock,
    Paperclip,
    RefreshCw,
    Save,
    SearchX,
    ShieldCheck,
    Trash2,
    UploadCloud,
} from "lucide-react";

import { CardListSkeleton, Empty, ErrorBox } from "../components/GuidanceStates";
import { Avatar, FilterChips, SearchBar, SectionTitle, fieldClass } from "../components/GuidanceUi";
import RoleBadge from "../components/RoleBadge";
import { guidanceApi, saveBlob } from "../services/guidanceApi";
import { formatYMD } from "../utils/dateTime";

const STATUS_FILTERS = ["All", "Draft", "Finalized", "Archived"];

const emptyForm = {
    studentId: "",
    sessionDate: new Date().toISOString().slice(0, 10),
    reportTitle: "",
    concernType: "",
    sessionSummary: "",
    sessionObjectives: "",
    observations: "",
    interventions: "",
    recommendations: "",
    followUpPlan: "",
    privateNotes: "",
    isConfidential: false,
};

const detailText = (value) => (value && value.trim() ? value : "—");

function StatusPill({ status }) {
    const tone =
        status === "Finalized"
            ? "bg-emerald-50 text-[#106A2E]"
            : status === "Archived"
              ? "bg-slate-100 text-slate-500"
              : "bg-amber-50 text-amber-700";

    return (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>
            {status}
        </span>
    );
}

export default function NarrativeReportsPage() {
    const [view, setView] = useState("list"); // list | editor | detail
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalItems: 0 });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("All");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const [selected, setSelected] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [busy, setBusy] = useState("");

    // editor state
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [subjects, setSubjects] = useState([]);
    const [subjectSearch, setSubjectSearch] = useState("");
    const [subjectLoading, setSubjectLoading] = useState(false);

    const resetEditor = () => {
        setEditingId(null);
        setForm(emptyForm);
        setSubjectSearch("");
    };

    const load = useCallback(async (signal) => {
        setError("");
        setLoading(true);
        try {
            const [list, s] = await Promise.all([
                guidanceApi.getNarrativeReports(
                    { status: status === "All" ? "" : status, search, page, pageSize: 20 },
                    signal
                ),
                guidanceApi.getNarrativeReportStats(signal),
            ]);
            setItems(list.items || []);
            setMeta({
                page: list.page || 1,
                totalPages: list.totalPages || 1,
                totalItems: list.totalItems || 0,
            });
            setStats(s);
        } catch (e) {
            if (e?.name !== "AbortError") setError(e.message || "Could not load your reports.");
        } finally {
            setLoading(false);
        }
    }, [status, search, page]);

    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => load(controller.signal));
        return () => controller.abort();
    }, [load, reloadKey]);

    // Debounced subject picker search.
    useEffect(() => {
        if (view !== "editor" || editingId) return undefined;

        const controller = new AbortController();
        const timer = setTimeout(() => {
            setSubjectLoading(true);
            guidanceApi
                .getNarrativeSubjects(subjectSearch.trim(), controller.signal)
                .then((rows) => setSubjects(rows))
                .catch(() => setSubjects([]))
                .finally(() => setSubjectLoading(false));
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [view, editingId, subjectSearch]);

    const selectedSubject = useMemo(
        () => subjects.find((s) => String(s.userId) === String(form.studentId)),
        [subjects, form.studentId]
    );

    const refresh = () => setReloadKey((n) => n + 1);

    const openCreate = () => {
        resetEditor();
        setSelected(null);
        setView("editor");
    };

    const openDetail = async (id) => {
        setDetailLoading(true);
        setError("");
        setView("detail");
        try {
            setSelected(await guidanceApi.getNarrativeReport(id));
        } catch (e) {
            setError(e.message || "Could not load that report.");
        } finally {
            setDetailLoading(false);
        }
    };

    const openEdit = async (id) => {
        setDetailLoading(true);
        setView("editor");
        try {
            const report = await guidanceApi.getNarrativeReport(id);
            setEditingId(report.id);
            setSelected(report);
            setSubjects((prev) => {
                if (prev.some((s) => s.userId === report.subjectId)) return prev;
                return [
                    {
                        userId: report.subjectId,
                        fullName: report.subjectName,
                        idNumber: report.subjectIdNumber,
                        role: report.subjectRole,
                    },
                    ...prev,
                ];
            });
            setForm({
                studentId: String(report.subjectId),
                sessionDate: report.sessionDate,
                reportTitle: report.reportTitle || "",
                concernType: report.concernType || "",
                sessionSummary: report.sessionSummary || "",
                sessionObjectives: report.sessionObjectives || "",
                observations: report.observations || "",
                interventions: report.interventions || "",
                recommendations: report.recommendations || "",
                followUpPlan: report.followUpPlan || "",
                privateNotes: report.privateNotes || "",
                isConfidential: !!report.isConfidential,
            });
        } catch (e) {
            setError(e.message || "Could not load that report.");
            setView("list");
        } finally {
            setDetailLoading(false);
        }
    };

    const payload = () => ({
        ...form,
        studentId: Number(form.studentId),
        status: "Draft",
    });

    const saveDraft = async () => {
        if (!form.studentId) {
            setError("Choose the student or faculty member this report is about.");
            return;
        }

        setBusy("save");
        setError("");
        try {
            const result = editingId
                ? await guidanceApi.updateNarrativeReport(editingId, payload())
                : await guidanceApi.createNarrativeReport(payload());

            const report = result.data || result;
            setEditingId(report.id);
            setSelected(report);
            setView("detail");
            refresh();
        } catch (e) {
            setError(e.message || "Could not save the report.");
        } finally {
            setBusy("");
        }
    };

    const runAction = async (action, label) => {
        if (!selected) return;
        setBusy(action);
        setError("");
        try {
            const result = await guidanceApi[action](selected.id);
            setSelected(result.data || result);
            refresh();
        } catch (e) {
            setError(e.message || `Could not ${label}.`);
        } finally {
            setBusy("");
        }
    };

    const removeDraft = async () => {
        if (!selected || busy) return;
        if (!window.confirm("Delete this draft report? This cannot be undone.")) return;

        setBusy("delete");
        try {
            await guidanceApi.deleteNarrativeReport(selected.id);
            setSelected(null);
            setView("list");
            refresh();
        } catch (e) {
            setError(e.message || "Could not delete the draft.");
        } finally {
            setBusy("");
        }
    };

    const exportReport = async (format) => {
        if (!selected) return;
        setBusy(`export-${format}`);
        try {
            const { blob, fileName } = await guidanceApi.exportNarrativeReport(selected.id, format);
            saveBlob(blob, fileName);
        } catch (e) {
            setError(e.message || "Could not export the report.");
        } finally {
            setBusy("");
        }
    };

    const uploadAttachment = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || !selected) return;

        setBusy("attachment");
        try {
            await guidanceApi.uploadNarrativeAttachment(selected.id, file);
            const fresh = await guidanceApi.getNarrativeReport(selected.id);
            setSelected(fresh);
        } catch (e) {
            setError(e.message || "Could not upload the attachment.");
        } finally {
            setBusy("");
        }
    };

    const downloadAttachment = async (attachment) => {
        setBusy(`download-${attachment.id}`);
        try {
            const { blob, fileName } = await guidanceApi.downloadNarrativeAttachment(
                selected.id,
                attachment.id,
                attachment.fileName
            );
            saveBlob(blob, fileName);
        } catch (e) {
            setError(e.message || "Could not download the attachment.");
        } finally {
            setBusy("");
        }
    };

    const removeAttachment = async (attachment) => {
        if (!window.confirm(`Remove ${attachment.fileName}?`)) return;
        setBusy(`remove-${attachment.id}`);
        try {
            await guidanceApi.deleteNarrativeAttachment(selected.id, attachment.id);
            const fresh = await guidanceApi.getNarrativeReport(selected.id);
            setSelected(fresh);
        } catch (e) {
            setError(e.message || "Could not remove the attachment.");
        } finally {
            setBusy("");
        }
    };

    // ------------------------------------------------------------------
    // EDITOR
    // ------------------------------------------------------------------
    if (view === "editor") {
        return (
            <main className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setView(selected ? "detail" : "list");
                            setError("");
                        }}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500"
                        aria-label="Back"
                    >
                        <ArrowLeft size={17} />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-slate-800">
                            {editingId ? "Edit draft report" : "New narrative report"}
                        </h1>
                        <p className="text-xs text-slate-500">
                            {editingId
                                ? "Only a draft can be edited."
                                : "Saved as a draft first, then finalized."}
                        </p>
                    </div>
                </div>

                {error && <ErrorBox message={error} />}

                <section className="space-y-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    <SectionTitle>Subject</SectionTitle>

                    {editingId ? (
                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                            <Avatar name={selected?.subjectName} accent="green" />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                    {selected?.subjectName || selectedSubject?.fullName}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {selected?.subjectIdNumber || selectedSubject?.idNumber || "—"} ·{" "}
                                    {selected?.subjectRole || selectedSubject?.role}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <SearchBar
                                value={subjectSearch}
                                onChange={setSubjectSearch}
                                placeholder="Search student or faculty name / ID"
                                accent="green"
                            />

                            {subjectLoading && (
                                <p className="text-xs text-slate-400">Searching…</p>
                            )}

                            <div className="max-h-64 space-y-1.5 overflow-y-auto">
                                {subjects.map((s) => {
                                    const chosen = String(s.userId) === String(form.studentId);
                                    return (
                                        <button
                                            key={s.userId}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, studentId: String(s.userId) }))}
                                            className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                                                chosen
                                                    ? "border-[#106A2E] bg-emerald-50/60"
                                                    : "border-slate-100 bg-white hover:bg-slate-50"
                                            }`}
                                        >
                                            <Avatar name={s.fullName} accent="green" size="sm" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                    {s.fullName}
                                                </p>
                                                <p className="truncate text-[11px] text-slate-500">
                                                    {s.idNumber} · {s.role}
                                                    {s.course ? ` · ${s.course}` : ""}
                                                </p>
                                            </div>
                                            <RoleBadge role={s.role} />
                                        </button>
                                    );
                                })}

                                {!subjectLoading && subjects.length === 0 && (
                                    <p className="py-3 text-center text-xs text-slate-400">
                                        No matching student or faculty account.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </section>

                <section className="space-y-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    <SectionTitle>Report details</SectionTitle>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block text-xs font-semibold text-slate-600">
                            Session date
                            <input
                                type="date"
                                value={form.sessionDate}
                                max={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))}
                                className={fieldClass("green")}
                            />
                        </label>

                        <label className="block text-xs font-semibold text-slate-600">
                            Concern
                            <input
                                value={form.concernType}
                                onChange={(e) => setForm((f) => ({ ...f, concernType: e.target.value }))}
                                placeholder="e.g. Academic"
                                className={fieldClass("green")}
                            />
                        </label>
                    </div>

                    <label className="block text-xs font-semibold text-slate-600">
                        Report title
                        <input
                            value={form.reportTitle}
                            onChange={(e) => setForm((f) => ({ ...f, reportTitle: e.target.value }))}
                            placeholder="Leave blank to use the subject and date"
                            className={fieldClass("green")}
                        />
                    </label>

                    {[
                        ["sessionSummary", "Session summary"],
                        ["sessionObjectives", "Session objectives"],
                        ["observations", "Observations"],
                        ["interventions", "Interventions / actions taken"],
                        ["recommendations", "Recommendations"],
                        ["followUpPlan", "Follow-up plan"],
                    ].map(([key, label]) => (
                        <label key={key} className="block text-xs font-semibold text-slate-600">
                            {label}
                            <textarea
                                rows={3}
                                value={form[key]}
                                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                className={`${fieldClass("green")} resize-y`}
                            />
                        </label>
                    ))}

                    <label className="block text-xs font-semibold text-amber-700">
                        <span className="flex items-center gap-1">
                            <Lock size={12} /> Private notes (counselor only)
                        </span>
                        <textarea
                            rows={3}
                            value={form.privateNotes}
                            onChange={(e) => setForm((f) => ({ ...f, privateNotes: e.target.value }))}
                            className={`${fieldClass("green")} resize-y`}
                        />
                        <span className="mt-1 block text-[11px] font-normal text-slate-400">
                            Never shown to the Guidance Head, in exports, or to the student.
                        </span>
                    </label>

                    <label className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                        <input
                            type="checkbox"
                            checked={form.isConfidential}
                            onChange={(e) => setForm((f) => ({ ...f, isConfidential: e.target.checked }))}
                            className="mt-0.5"
                        />
                        <span>
                            Mark as confidential. The report is still visible to the Guidance Head for
                            monitoring, with private notes withheld.
                        </span>
                    </label>
                </section>

                <button
                    type="button"
                    onClick={saveDraft}
                    disabled={busy === "save"}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#106A2E] px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
                >
                    <Save size={16} />
                    {busy === "save" ? "Saving…" : "Save draft"}
                </button>
            </main>
        );
    }

    // ------------------------------------------------------------------
    // DETAIL
    // ------------------------------------------------------------------
    if (view === "detail") {
        if (detailLoading && !selected) {
            return (
                <main className="space-y-3 p-4">
                    <CardListSkeleton rows={2} label="Loading report..." />
                </main>
            );
        }

        if (!selected) {
            return (
                <main className="p-4">
                    <ErrorBox message={error || "Report unavailable."} onRetry={() => setView("list")} />
                </main>
            );
        }

        const isDraft = selected.status === "Draft";
        const isFinal = selected.status === "Finalized";

        return (
            <main className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setView("list");
                            setSelected(null);
                            setError("");
                        }}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500"
                        aria-label="Back"
                    >
                        <ArrowLeft size={17} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-base font-bold text-slate-800">
                            {selected.reportTitle || "Narrative report"}
                        </h1>
                        <p className="truncate text-xs text-slate-500">
                            {selected.reportNumber || "Draft"} · {formatYMD(selected.sessionDate)}
                        </p>
                    </div>
                    <StatusPill status={selected.status} />
                </div>

                {error && <ErrorBox message={error} />}

                <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Avatar name={selected.subjectName} accent="green" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                                {selected.subjectName}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                {selected.subjectIdNumber || "—"} · {selected.subjectRole}
                            </p>
                        </div>
                        <RoleBadge role={selected.subjectRole} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                        <span>
                            Counselor: <b className="text-slate-700">{selected.counselorName}</b>
                        </span>
                        <span>
                            Concern: <b className="text-slate-700">{selected.concernType || "—"}</b>
                        </span>
                        <span>
                            Version: <b className="text-slate-700">{selected.version}</b>
                        </span>
                        <span>
                            Finalized:{" "}
                            <b className="text-slate-700">
                                {selected.finalizedAt ? formatYMD(selected.finalizedAt.slice(0, 10)) : "—"}
                            </b>
                        </span>
                    </div>

                    {selected.isConfidential && (
                        <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-800">
                            <ShieldCheck size={13} /> Confidential report
                        </p>
                    )}
                </section>

                {[
                    ["Session summary", selected.sessionSummary],
                    ["Session objectives", selected.sessionObjectives],
                    ["Observations", selected.observations],
                    ["Interventions / actions taken", selected.interventions],
                    ["Recommendations", selected.recommendations],
                    ["Follow-up plan", selected.followUpPlan],
                ].map(([label, value]) => (
                    <section key={label} className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                        <SectionTitle>{label}</SectionTitle>
                        <p className="mt-1.5 whitespace-pre-wrap text-xs leading-6 text-slate-600">
                            {detailText(value)}
                        </p>
                    </section>
                ))}

                <section className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm">
                    <SectionTitle>
                        <span className="flex items-center gap-1">
                            <Lock size={12} /> Private notes
                        </span>
                    </SectionTitle>
                    <p className="mt-1.5 whitespace-pre-wrap text-xs leading-6 text-amber-900">
                        {detailText(selected.privateNotes)}
                    </p>
                </section>

                <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    <SectionTitle
                        right={
                            isDraft ? (
                                <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#106A2E]">
                                    <UploadCloud size={13} />
                                    {busy === "attachment" ? "Uploading…" : "Attach"}
                                    <input
                                        type="file"
                                        className="hidden"
                                        disabled={busy === "attachment"}
                                        onChange={uploadAttachment}
                                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                    />
                                </label>
                            ) : null
                        }
                    >
                        Supporting files
                    </SectionTitle>

                    {selected.attachments?.length ? (
                        <ul className="mt-2 divide-y divide-slate-100">
                            {selected.attachments.map((a) => (
                                <li key={a.id} className="flex items-center gap-2 py-2">
                                    <Paperclip size={14} className="shrink-0 text-slate-400" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-slate-700">{a.fileName}</p>
                                        <p className="text-[10px] text-slate-400">
                                            {Math.max(1, Math.round(a.sizeBytes / 1024))} KB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => downloadAttachment(a)}
                                        disabled={busy === `download-${a.id}`}
                                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                                        aria-label={`Download ${a.fileName}`}
                                    >
                                        <Download size={14} />
                                    </button>
                                    {isDraft && (
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(a)}
                                            disabled={busy === `remove-${a.id}`}
                                            className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50"
                                            aria-label={`Remove ${a.fileName}`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-xs text-slate-400">No files attached.</p>
                    )}
                </section>

                <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    <SectionTitle>Audit trail</SectionTitle>
                    <ul className="mt-2 space-y-2">
                        {(selected.events || []).map((e) => (
                            <li key={e.id} className="flex items-start gap-2 text-[11px]">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#106A2E]" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-700">
                                        {e.action}
                                        {e.actorName ? ` · ${e.actorName}` : ""}
                                    </p>
                                    <p className="text-slate-400">
                                        {new Date(e.createdAt).toLocaleString()}
                                        {e.detail ? ` · ${e.detail}` : ""}
                                    </p>
                                </div>
                            </li>
                        ))}
                        {!selected.events?.length && (
                            <li className="text-xs text-slate-400">No activity recorded yet.</li>
                        )}
                    </ul>
                </section>

                <div className="flex flex-wrap gap-2">
                    {isDraft && (
                        <>
                            <button
                                type="button"
                                onClick={() => openEdit(selected.id)}
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600"
                            >
                                Edit draft
                            </button>
                            <button
                                type="button"
                                onClick={() => runAction("finalizeNarrativeReport", "finalize")}
                                disabled={busy === "finalizeNarrativeReport"}
                                className="flex-1 rounded-xl bg-[#106A2E] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                            >
                                {busy === "finalizeNarrativeReport" ? "Finalizing…" : "Finalize"}
                            </button>
                            <button
                                type="button"
                                onClick={removeDraft}
                                className="rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-xs font-semibold text-rose-600"
                            >
                                Delete
                            </button>
                        </>
                    )}

                    {isFinal && (
                        <button
                            type="button"
                            onClick={() => runAction("archiveNarrativeReport", "archive")}
                            disabled={busy === "archiveNarrativeReport"}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-60"
                        >
                            {busy === "archiveNarrativeReport" ? "Archiving…" : "Archive"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => exportReport("docx")}
                        disabled={!!busy}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-60"
                    >
                        <Download size={14} /> DOCX
                    </button>
                    <button
                        type="button"
                        onClick={() => exportReport("pdf")}
                        disabled={!!busy}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-60"
                    >
                        <Download size={14} /> PDF
                    </button>
                </div>
            </main>
        );
    }

    // ------------------------------------------------------------------
    // LIST
    // ------------------------------------------------------------------
    return (
        <main className="space-y-3 p-4">
            <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-white">
                        <FileText size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base font-bold text-slate-800">Narrative Reports</h1>
                        <p className="text-xs text-slate-500">
                            {meta.totalItems} report{meta.totalItems === 1 ? "" : "s"} · draft, finalize,
                            then export
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={refresh}
                        aria-label="Refresh reports"
                        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>

                {stats && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                        {[
                            ["Total", stats.total],
                            ["Draft", stats.draft],
                            ["Final", stats.finalized],
                            ["Archived", stats.archived],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-xl bg-slate-50 px-2 py-2 text-center">
                                <p className="text-lg font-bold text-slate-800">{value}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    type="button"
                    onClick={openCreate}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#106A2E] px-3 py-2.5 text-sm font-semibold text-white"
                >
                    <FilePlus2 size={16} /> New report
                </button>
            </section>

            <SearchBar
                value={search}
                onChange={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                placeholder="Search title, subject, report no."
                accent="green"
            />

            <FilterChips
                options={STATUS_FILTERS}
                value={status}
                onChange={(value) => {
                    setStatus(value);
                    setPage(1);
                }}
                accent="green"
            />

            {error && <ErrorBox message={error} onRetry={refresh} />}
            {loading && items.length === 0 && (
                <CardListSkeleton rows={3} label="Loading your reports..." />
            )}
            {!loading && !error && items.length === 0 && (
                <Empty
                    icon={SearchX}
                    title="No reports found"
                    note="Create your first narrative report for a student or faculty member."
                />
            )}

            {items.map((report) => (
                <button
                    key={report.id}
                    type="button"
                    onClick={() => openDetail(report.id)}
                    className="w-full rounded-2xl border border-black/[0.05] bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
                >
                    <div className="flex items-start gap-3">
                        <Avatar name={report.subjectName} accent="green" />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                    {report.subjectName}
                                </p>
                                <RoleBadge role={report.subjectRole} />
                            </div>
                            <p className="truncate text-xs text-slate-500">
                                {report.reportTitle || report.reportNumber || "Narrative report"}
                            </p>
                            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                    <CalendarDays size={11} /> {formatYMD(report.sessionDate)}
                                </span>
                                {report.concernType && <span>{report.concernType}</span>}
                                {report.attachmentCount > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                        <Paperclip size={11} /> {report.attachmentCount}
                                    </span>
                                )}
                                {report.hasPrivateNotes && (
                                    <span className="inline-flex items-center gap-1 text-amber-600">
                                        <Lock size={11} /> private
                                    </span>
                                )}
                            </p>
                        </div>
                        <StatusPill status={report.status} />
                    </div>
                </button>
            ))}

            {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-slate-500">
                        Page {meta.page} of {meta.totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                        disabled={page >= meta.totalPages}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </main>
    );
}
