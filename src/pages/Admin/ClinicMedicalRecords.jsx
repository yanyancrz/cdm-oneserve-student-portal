import { useEffect, useRef, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import { loadClinicRecords as load } from "../../services/adminClinicRecordsService";
import {
    NO_MEDICAL_RECORDS, validateMedicalRecords, collectClinicVisits,
    medicalRecordsCsv, studentVisitsCsv, downloadClinicCsv,
} from "./clinicRecordExport";
import { formatDate, formatDateTime } from "../../components/Clinic/clinicFormat";

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
    const [retry, setRetry] = useState(0);
    const [exportType, setExportType] = useState("student");
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState("");
    const [exportError, setExportError] = useState("");
    const exportController = useRef(null);

    useEffect(() => () => exportController.current?.abort(), []);

    const handleExport = async () => {
        setExportError("");
        setExportMessage("");
        if (exportType === "student" && (!student || !records.length)) {
            setExportError(student ? NO_MEDICAL_RECORDS : "Select a student first.");
            return;
        }
        const controller = new AbortController();
        exportController.current = controller;
        setExporting(true);
        try {
            const stamp = new Date().toISOString().slice(0, 10);
            if (exportType === "student") {
                const filename = String(student.idNumber || student.id).replace(/[^a-zA-Z0-9_-]/g, "_");
                downloadClinicCsv(medicalRecordsCsv(student, records), `clinic-medical-records-${filename}-${stamp}.csv`);
                setExportMessage(`Exported ${records.length} medical record(s) for ${student.fullName}.`);
            } else {
                setExportMessage("Preparing student visit history...");
                const results = await collectClinicVisits(load, {
                    signal: controller.signal,
                    onProgress: ({ checked, total }) => setExportMessage(`Checking medical records: ${checked} of ${total} students`),
                });
                controller.signal.throwIfAborted();
                const report = studentVisitsCsv(results);
                if (!report.visitCount) {
                    setExportMessage("");
                    setExportError("No medical records found. No students have recorded clinic visits.");
                    return;
                }
                downloadClinicCsv(report.csv, `clinic-student-visits-${stamp}.csv`);
                setExportMessage(`Exported ${report.visitCount} clinic visit(s).`);
            }
        } catch (e) {
            if (e.name !== "AbortError") {
                controller.abort();
                setExportError(`Export could not be completed. ${e.message}`);
            }
            setExportMessage("");
        } finally {
            if (exportController.current === controller) {
                exportController.current = null;
                setExporting(false);
            }
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
    }, [search, page, retry]);

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
    }, [student, retry]);

    return <section className="space-y-4" aria-labelledby="clinic-medical-records-heading">
        <div>
            <h2 id="clinic-medical-records-heading" className="text-xl font-semibold">Student medical records</h2>
            <p className="mt-1 text-sm text-gray-500">Select a student to view their medical records and consultation history.</p>
        </div>
        <div className="admin-no-print flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4">
            <label className="min-w-56 flex-1 text-xs font-medium text-gray-600">
                Export report
                <select value={exportType} onChange={e => { setExportType(e.target.value); setExportError(""); setExportMessage(""); }} disabled={exporting} className="mt-1.5 block w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-800">
                    <option value="student">Selected student's medical records</option>
                    <option value="visits">All students with clinic visit dates</option>
                </select>
            </label>
            <button type="button" onClick={handleExport} disabled={exporting || (exportType === "student" && (!student || recordsLoading || Boolean(recordsError)))} className="inline-flex items-center gap-2 rounded-xl bg-[#0E3B22] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {exporting ? "Exporting..." : "Export CSV"}
            </button>
            {exporting && <button type="button" onClick={() => exportController.current?.abort()} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2.5 text-sm"><X size={15} />Cancel</button>}
            <p className="w-full text-xs text-gray-500">CSV opens in Excel. The visit-date report includes all students with medical records, with one row per visit.</p>
        </div>
        {exportError && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{exportError}</div>}
        {exportMessage && <p role="status" aria-live="polite" className="text-sm text-emerald-800">{exportMessage}</p>}
        <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
            <div className="rounded-2xl border bg-white p-4">
                <label htmlFor="clinic-student-search" className="text-sm font-medium">Find a student</label>
                <input id="clinic-student-search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); setLoading(true); setStudents([]); }} placeholder="Name or student number" className="mt-2 w-full rounded-xl border px-3 py-2 text-sm" />
                {error && <div role="alert" className="mt-3 text-sm text-red-700">{error} <button onClick={() => setRetry(v => v + 1)} className="underline">Retry</button></div>}
                {loading ? <p role="status" className="py-6 text-sm text-gray-500">Loading students...</p> : <div className="mt-3 space-y-1">
                    {students.map(item => <button key={item.id} onClick={() => { if (student?.id === item.id) return; setRecords([]); setRecordsError(""); setRecordsLoading(true); setStudent(item); setExportError(""); setExportMessage(""); }} aria-pressed={student?.id === item.id} className={`w-full rounded-xl p-3 text-left ${student?.id === item.id ? "bg-emerald-50 ring-1 ring-emerald-600" : "hover:bg-gray-50"}`}>
                        <span className="block text-sm font-semibold">{item.fullName}</span>
                        <span className="mt-1 block text-xs text-gray-500">{item.idNumber} · {item.course || "Course unavailable"}</span>
                    </button>)}
                    {!students.length && !error && <p className="py-5 text-sm text-gray-500">No students found.</p>}
                </div>}
                <div className="mt-4 flex items-center justify-between text-xs">
                    <button disabled={loading || page === 1} onClick={() => { setLoading(true); setPage(v => v - 1); }} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button>
                    <span>Page {page}</span>
                    <button disabled={loading || !hasMore} onClick={() => { setLoading(true); setPage(v => v + 1); }} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button>
                </div>
            </div>
            <div className="min-w-0 space-y-3">
                {!student ? <p className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-500">Choose a student to view medical records.</p> : <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5">
                        <div><h3 className="font-semibold">{student.fullName}</h3><p className="text-xs text-gray-500">{student.idNumber}{!recordsLoading && !recordsError ? ` · ${records.length} medical records` : ""}</p></div>
                        <button disabled={recordsLoading} onClick={() => setRetry(v => v + 1)} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40">Refresh records</button>
                    </div>
                    {recordsLoading && <p role="status" className="rounded-2xl border bg-white p-6 text-sm text-gray-500">Loading medical records...</p>}
                    {recordsError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{recordsError} <button onClick={() => setRetry(v => v + 1)} className="underline">Retry</button></div>}
                    {!recordsLoading && !recordsError && !records.length && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900"><p className="font-semibold">No medical records found.</p><p className="mt-1">The student hasn't been in clinic.</p></div>}
                    {!recordsLoading && records.map((record, index) => <details key={record.medicalRecordId ?? index} className="overflow-hidden rounded-2xl border bg-white" open={records.length === 1 ? true : undefined}>
                        <summary className="cursor-pointer p-5"><span className="font-semibold">{record.chiefComplaint || "Clinic consultation"}</span><span className="mt-1 block text-xs text-gray-500">{formatDate(record.visitDate)} · {record.diagnosis || "No diagnosis recorded"}</span></summary>
                        <dl className="grid gap-4 border-t p-5 sm:grid-cols-2">
                            {[
                                ["Visit date", formatDate(record.visitDate)], ["Chief complaint", record.chiefComplaint],
                                ["Pain scale", record.painScale == null ? null : `${record.painScale} / 10`],
                                ["Diagnosis", record.diagnosis], ["Medications", record.medications],
                                ["Allergies", record.allergies], ["Clinical notes", record.clinicalNotes],
                                ["Created", formatDateTime(record.createdAt)], ["Last updated", formatDateTime(record.updatedAt)],
                            ].map(([label, value]) => <div key={label} className={label === "Clinical notes" ? "sm:col-span-2" : ""}><dt className="text-xs font-medium text-gray-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800">{value === null || value === undefined || value === "" ? "Not recorded" : String(value)}</dd></div>)}
                        </dl>
                    </details>)}
                </>}
            </div>
        </div>
    </section>;
}
