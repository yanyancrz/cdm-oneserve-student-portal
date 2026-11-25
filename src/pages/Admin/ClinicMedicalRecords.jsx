import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Download, Loader2, RefreshCw, Search, Stethoscope, Users, X } from "lucide-react";
import { loadClinicRecords as load } from "../../services/adminClinicRecordsService";
import { validateMedicalRecords, collectClinicVisits, medicalRecordsCsv, studentVisitsCsv } from "./clinicRecordExport";
import ExportFormatSelect from "./ExportFormatSelect";
import { exportReport } from "./reportExport";
import { formatDate, formatDateTime } from "../../components/Clinic/clinicFormat";

const initials = name => String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";

const painTone = scale => {
    if (scale == null) return "";
    if (scale >= 7) return "bg-red-50 text-red-700 ring-red-200";
    if (scale >= 4) return "bg-amber-50 text-amber-800 ring-amber-200";
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
};

export default function ClinicMedicalRecords() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [students, setStudents] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [student, setStudent] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [error, setError] = useState("");
    const [recordsError, setRecordsError] = useState("");
    const [studentsRetry, setStudentsRetry] = useState(0);
    const [recordsRetry, setRecordsRetry] = useState(0);
    const [studentFormat, setStudentFormat] = useState("pdf");
    const [visitFormat, setVisitFormat] = useState("pdf");
    const [studentExporting, setStudentExporting] = useState(false);
    const [studentExportError, setStudentExportError] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState("");
    const [exportError, setExportError] = useState("");
    const [showExport, setShowExport] = useState(false);
    const exportController = useRef(null);
    useEffect(() => () => exportController.current?.abort(), []);

    const exportPanelOpen = showExport || exporting;

    const exportStudent = async () => {
        if (!student || recordsLoading || recordsError || !records.length) return;
        const filename = String(student.idNumber || student.id).replace(/[^a-zA-Z0-9_-]/g, "_");
        setStudentExporting(true);
        setStudentExportError("");
        try {
            await exportReport({ csv: medicalRecordsCsv(student, records), filename: `clinic-records-${filename}`, title: "Patient medical records", subtitle: `${student.fullName} | ${student.idNumber}`, format: studentFormat, clinicPdf: "student" });
        } catch (e) { setStudentExportError(`Export failed. ${e.message}`); }
        finally { setStudentExporting(false); }
    };

    const exportVisits = async event => {
        event.preventDefault();
        if (exportController.current) return;
        setExportError("");
        setExportMessage("");
        if (from && to && from > to) {
            setExportError("From date must be on or before To date.");
            return;
        }
        const controller = new AbortController();
        exportController.current = controller;
        setExporting(true);
        try {
            const results = await collectClinicVisits(load, {
                signal: controller.signal,
                onProgress: ({ checked, total }) => setExportMessage(`Checking clinic visits: ${checked} of ${total} patients`),
            });
            controller.signal.throwIfAborted();
            const report = studentVisitsCsv(results, { from, to });
            if (!report.visitCount) {
                setExportMessage("");
                setExportError("No clinic visits found for the selected date range.");
                return;
            }
            await exportReport({ csv: report.csv, filename: `clinic-visit-history-${from || "start"}-to-${to || "latest"}`, title: "Clinic visit history", subtitle: `Visit dates: ${from || "Start"} to ${to || "Latest"}`, format: visitFormat, clinicPdf: "visits", signal: controller.signal });
            setExportMessage(`Exported ${report.visitCount} clinic visit(s).`);
        } catch (e) {
            controller.abort();
            setExportMessage("");
            if (e.name !== "AbortError") setExportError(`Export could not be completed. ${e.message}`);
        } finally {
            exportController.current = null;
            setExporting(false);
        }
    };
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            setError("");
            try {
                const data = await load(`/students?search=${encodeURIComponent(search)}&page=${page}`, controller.signal);
                if (controller.signal.aborted) return;
                setStudents(data.items || []);
                setHasMore(data.hasMore);
            } catch (e) {
                if (e.name !== "AbortError") { setError(e.message); setStudents([]); }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [search, page, studentsRetry]);

    useEffect(() => {
        if (!student) return;
        const controller = new AbortController();
        async function fetchRecords() {
            setRecordsLoading(true);
            setRecordsError("");
            setRecords([]);
            try {
                const data = await load(`/${student.id}`, controller.signal);
                if (controller.signal.aborted) return;
                const medicalRecords = validateMedicalRecords(data);
                setRecords([...medicalRecords].sort((a, b) =>
                    (Date.parse(b.visitDate ?? b.createdAt) || 0) - (Date.parse(a.visitDate ?? a.createdAt) || 0)));
            } catch (e) {
                if (e.name !== "AbortError") setRecordsError(e.message);
            } finally {
                if (!controller.signal.aborted) setRecordsLoading(false);
            }
        }
        fetchRecords();
        return () => controller.abort();
    }, [student, recordsRetry]);

    const changeSearch = value => { setSearch(value); setPage(1); setLoading(true); setStudents([]); };

    return <section className="space-y-5" aria-labelledby="clinic-medical-records-heading">
        <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0E3B22] text-white"><Stethoscope size={20} aria-hidden="true" /></span>
            <div>
                <h2 id="clinic-medical-records-heading" className="text-xl font-semibold text-gray-900">Patient medical records</h2>
                <p className="mt-0.5 text-sm text-gray-500">Select a patient to view and export their medical records and consultation history.</p>
            </div>
        </div>

        <form onSubmit={exportVisits} className="admin-no-print overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#0E3B22]"><ClipboardList size={18} aria-hidden="true" /></span>
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900">Export clinic visit history</h3>
                        <p className="mt-0.5 text-xs text-gray-500">Includes patients with clinic visits, one row per visit. Filter by visit date; leave dates blank for all history.</p>
                    </div>
                </div>
                <button type="button" disabled={exporting} onClick={() => setShowExport(v => !v)} aria-expanded={exportPanelOpen} aria-controls="clinic-export-panel" className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">
                    {exportPanelOpen ? "Hide options" : "Show options"}
                    <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${exportPanelOpen ? "rotate-180" : ""}`} />
                </button>
            </div>
            {exportPanelOpen && <div id="clinic-export-panel" className="flex flex-wrap items-end gap-3 border-t border-gray-100 bg-gray-50/60 px-4 py-4">
                <label className="text-xs font-medium text-gray-600">From<input type="date" value={from} max={to || undefined} disabled={exporting} onChange={e => setFrom(e.target.value)} className="mt-1 block rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20" /></label>
                <label className="text-xs font-medium text-gray-600">To<input type="date" value={to} min={from || undefined} disabled={exporting} onChange={e => setTo(e.target.value)} className="mt-1 block rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20" /></label>
                <ExportFormatSelect value={visitFormat} onChange={setVisitFormat} disabled={exporting} />
                <button disabled={exporting} className="inline-flex items-center gap-2 rounded-xl bg-[#0E3B22] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#145a33] disabled:opacity-40">{exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}{exporting ? "Exporting..." : "Export visit history"}</button>
                {exporting && <button type="button" onClick={() => exportController.current?.abort()} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm transition hover:bg-gray-50">Cancel</button>}
            </div>}
            {(exportError || exportMessage) && <div className="border-t border-gray-100 px-4 py-3">
                {exportError && <p role="alert" className="text-sm text-red-700">{exportError}</p>}
                {exportMessage && <p role="status" className="text-sm text-emerald-800">{exportMessage}</p>}
            </div>}
        </form>

        <div className="grid items-start gap-5 lg:grid-cols-[300px_1fr]">
            <aside className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:sticky lg:top-4">
                <div className="space-y-2 border-b border-gray-100 p-3">
                    <label htmlFor="clinic-student-search" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"><Users size={14} aria-hidden="true" />Find a patient</label>
                    <div className="relative">
                        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input id="clinic-student-search" value={search} onChange={e => changeSearch(e.target.value)} placeholder="Search by patient name or ID number" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-9 text-sm transition focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20" />
                        {search && <button type="button" onClick={() => changeSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"><X size={14} /></button>}
                    </div>
                </div>

                {error && <div role="alert" className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800">{error} <button onClick={() => setStudentsRetry(v => v + 1)} className="font-medium underline">Retry</button></div>}

                <div className="max-h-[22rem] min-h-[12rem] overflow-y-auto p-2 lg:max-h-[calc(100vh-20rem)]">
                    {loading ? <div role="status" aria-label="Loading patients" className="space-y-1.5">
                        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex animate-pulse items-center gap-2.5 rounded-xl p-2">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200" />
                            <div className="flex-1 space-y-1.5"><div className="h-3 w-3/4 rounded bg-gray-200" /><div className="h-2.5 w-1/2 rounded bg-gray-100" /></div>
                        </div>)}
                    </div> : <div className="space-y-0.5">
                        {students.map(item => {
                            const active = student?.id === item.id;
                            return <button key={item.id} onClick={() => { if (student?.id === item.id) return; setRecords([]); setRecordsError(""); setRecordsLoading(true); setStudent(item); setStudentExportError(""); }} aria-pressed={active} className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${active ? "bg-emerald-50 ring-1 ring-emerald-600" : "hover:bg-gray-50"}`}>
                                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${active ? "bg-[#0E3B22] text-white" : "bg-gray-100 text-gray-600"}`}>{initials(item.fullName)}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-gray-900">{item.fullName}</span>
                                    <span className="block truncate text-xs text-gray-500">{item.idNumber} · {item.course || "Course unavailable"}</span>
                                </span>
                            </button>;
                        })}
                        {!students.length && !error && <div className="px-3 py-8 text-center">
                            <Search size={20} aria-hidden="true" className="mx-auto text-gray-300" />
                            <p className="mt-2 text-sm text-gray-500">No patients found.</p>
                        </div>}
                    </div>}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/60 px-3 py-2 text-xs">
                    <button disabled={loading || page === 1} onClick={() => { setLoading(true); setPage(v => v - 1); }} aria-label="Previous page" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 transition hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={14} />Prev</button>
                    <span className="text-gray-500">Page {page}{!loading && students.length ? ` · ${students.length} shown` : ""}</span>
                    <button disabled={loading || !hasMore} onClick={() => { setLoading(true); setPage(v => v + 1); }} aria-label="Next page" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 transition hover:bg-gray-50 disabled:opacity-40">Next<ChevronRight size={14} /></button>
                </div>
            </aside>

            <div className="min-w-0 space-y-3">
                {!student ? <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-[#0E3B22]"><Stethoscope size={22} aria-hidden="true" /></span>
                    <p className="mt-3 text-sm font-medium text-gray-800">No patient selected</p>
                    <p className="mt-1 text-sm text-gray-500">Choose a patient to view medical records.</p>
                </div> : <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0E3B22] text-sm font-semibold text-white">{initials(student.fullName)}</span>
                            <div className="min-w-0">
                                <h3 className="truncate font-semibold text-gray-900">{student.fullName}</h3>
                                <p className="truncate text-xs text-gray-500">{student.idNumber}{student.course ? ` · ${student.course}` : ""}</p>
                            </div>
                            {!recordsLoading && !recordsError && <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">{records.length} medical record{records.length === 1 ? "" : "s"}</span>}
                        </div>
                        <div className="admin-no-print flex flex-wrap items-center gap-2">
                            <ExportFormatSelect value={studentFormat} onChange={setStudentFormat} disabled={studentExporting} />
                            <button type="button" disabled={studentExporting || recordsLoading || Boolean(recordsError) || !records.length} onClick={exportStudent} className="inline-flex items-center gap-2 rounded-lg bg-[#0E3B22] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#145a33] disabled:opacity-40">{studentExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}{studentExporting ? "Exporting..." : "Export clinic records"}</button>
                            <button disabled={recordsLoading} onClick={() => setRecordsRetry(v => v + 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs transition hover:bg-gray-50 disabled:opacity-40"><RefreshCw size={13} className={recordsLoading ? "animate-spin" : ""} />Refresh records</button>
                        </div>
                    </div>
                    {studentExportError && <p role="alert" className="text-sm text-red-700">{studentExportError}</p>}
                    {recordsLoading && <div role="status" className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" />Loading medical records...</div>}
                    {recordsError && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">{recordsError} <button onClick={() => setRecordsRetry(v => v + 1)} className="font-medium underline">Retry</button></div>}
                    {!recordsLoading && !recordsError && !records.length && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900"><p className="font-semibold">No medical records found.</p><p className="mt-1">No clinic visits are on file for this patient.</p></div>}
                    {!recordsLoading && records.map((record, index) => <details key={record.medicalRecordId ?? index} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition open:ring-1 open:ring-emerald-600/30" open={records.length === 1 ? true : undefined}>
                        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 transition hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#0E3B22]"><Stethoscope size={16} aria-hidden="true" /></span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate font-semibold text-gray-900">{record.chiefComplaint || "Clinic consultation"}</span>
                                <span className="mt-0.5 block truncate text-xs text-gray-500">{formatDate(record.visitDate)} · {record.diagnosis || "No diagnosis recorded"}</span>
                            </span>
                            {record.painScale != null && <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 sm:inline-block ${painTone(record.painScale)}`}>Pain {record.painScale}/10</span>}
                            <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                        </summary>
                        <dl className="grid gap-x-6 gap-y-4 border-t border-gray-100 bg-gray-50/40 p-5 sm:grid-cols-2">
                            {[
                                ["Visit date", formatDate(record.visitDate)], ["Chief complaint", record.chiefComplaint],
                                ["Pain scale", record.painScale == null ? null : `${record.painScale} / 10`],
                                ["Diagnosis", record.diagnosis], ["Medications", record.medications],
                                ["Allergies", record.allergies], ["Clinical notes", record.clinicalNotes],
                                ["Created", formatDateTime(record.createdAt)], ["Last updated", formatDateTime(record.updatedAt)],
                            ].map(([label, value]) => <div key={label} className={label === "Clinical notes" ? "sm:col-span-2" : ""}>
                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
                                <dd className={`mt-1 whitespace-pre-wrap break-words text-sm ${value === null || value === undefined || value === "" ? "italic text-gray-400" : "text-gray-800"} ${label === "Clinical notes" ? "rounded-xl border border-gray-200 bg-white p-3" : ""}`}>{value === null || value === undefined || value === "" ? "Not recorded" : String(value)}</dd>
                            </div>)}
                        </dl>
                    </details>)}
                </>}
            </div>
        </div>
    </section>;
}