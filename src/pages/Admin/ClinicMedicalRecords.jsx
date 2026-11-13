import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { formatDate, formatDateTime } from "../../components/Clinic/clinicFormat";

const BASE = `${API_URL}/api/admin/services/clinic/medical-records`;
async function load(path, signal) {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    const response = await fetch(`${BASE}${path}`, {
        signal, cache: "no-store", headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Unable to load Clinic records.");
    return data;
}

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

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            setError("");
            try {
                const data = await load(`/students?search=${encodeURIComponent(search)}&page=${page}`, controller.signal);
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
                if (!Array.isArray(data.records)) throw new Error("Invalid Clinic records response.");
                setRecords([...data.records].sort((a, b) =>
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
            <p className="mt-1 text-sm text-gray-500">Select a student to view their consultation history from the Clinic CMS.</p>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
            <div className="rounded-2xl border bg-white p-4">
                <label htmlFor="clinic-student-search" className="text-sm font-medium">Find a student</label>
                <input id="clinic-student-search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); setLoading(true); setStudents([]); }} placeholder="Name or student number" className="mt-2 w-full rounded-xl border px-3 py-2 text-sm" />
                {error && <div role="alert" className="mt-3 text-sm text-red-700">{error} <button onClick={() => setRetry(v => v + 1)} className="underline">Retry</button></div>}
                {loading ? <p role="status" className="py-6 text-sm text-gray-500">Loading students...</p> : <div className="mt-3 space-y-1">
                    {students.map(item => <button key={item.id} onClick={() => { if (student?.id === item.id) return; setRecords([]); setRecordsError(""); setRecordsLoading(true); setStudent(item); }} aria-pressed={student?.id === item.id} className={`w-full rounded-xl p-3 text-left ${student?.id === item.id ? "bg-emerald-50 ring-1 ring-emerald-600" : "hover:bg-gray-50"}`}>
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
                    {!recordsLoading && !recordsError && !records.length && <p className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-500">No medical records in the Clinic CMS for this student.</p>}
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
