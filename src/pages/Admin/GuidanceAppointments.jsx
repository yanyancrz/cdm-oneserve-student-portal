import { useCallback, useEffect, useState } from "react";
import { CalendarClock, RefreshCw, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";

const BASE = `${API_URL}/api/admin/services/guidance/appointments`;
const getToken = () => localStorage.getItem("token") || localStorage.getItem("authToken");
async function request(path, options = {}) {
    const token = getToken();
    const response = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Appointment request failed.");
    return data;
}
const formatDate = value => value ? new Date(value).toLocaleDateString() : "—";

export default function GuidanceAppointments() {
    const [items, setItems] = useState([]);
    const [counselors, setCounselors] = useState([]);
    const [filters, setFilters] = useState({ status: "", search: "", from: "", to: "" });
    const [applied, setApplied] = useState(filters);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);

    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: "25" });
            Object.entries(applied).forEach(([key, value]) => { if (value) params.set(key, value); });
            const [result, counselorResponse] = await Promise.all([
                request(`?${params}`),
                fetch(`${API_URL}/api/admin/guidance/counselors?page=1&pageSize=100`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()).catch(() => null),
            ]);
            setItems(result.items || []); setTotalItems(result.totalItems || 0); setTotalPages(result.totalPages || 0);
            const list = counselorResponse?.data?.items || counselorResponse?.data || [];
            setCounselors(Array.isArray(list) ? list : []);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [page, applied]);
    useEffect(() => { load(); }, [load]);

    const submitChange = async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const reason = String(form.get("reason") || "").trim();
        if (!reason) return toast.error("A reason is required for every manual change.");
        setBusy(true);
        try {
            if (selected.action === "reschedule") {
                await request(`/${selected.id}/reschedule`, { method: "PATCH", body: JSON.stringify({ date: form.get("date"), timeSlot: form.get("timeSlot"), counselorId: form.get("counselorId") || null, reason }) });
            } else {
                await request(`/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status: form.get("status"), reason }) });
            }
            toast.success("Appointment updated and activity recorded."); setSelected(null); await load();
        } catch (e) { toast.error(e.message); }
        finally { setBusy(false); }
    };

    return <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-7">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold text-[#1F1F1F]">Guidance Appointments</h1><p className="mt-1 text-sm text-gray-500">Manage schedules and statuses. Counseling concerns, notes and narratives are excluded.</p></div><button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh</button></header>
        {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <form onSubmit={e => { e.preventDefault(); setPage(1); setApplied(filters); }} className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 xl:grid-cols-5"><label className="relative xl:col-span-2"><Search size={15} className="absolute left-3 top-3 text-gray-400" /><input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Search student, counselor or ID" className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm" /></label><select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="rounded-lg border px-3 py-2 text-sm"><option value="">All statuses</option>{["Pending", "Confirmed", "Arrived", "Completed", "Cancelled", "Rejected", "NoShow", "Expired"].map(x => <option key={x}>{x}</option>)}</select><label className="text-xs text-gray-500">From<input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-800" /></label><div className="flex items-end gap-2"><label className="flex-1 text-xs text-gray-500">To<input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-800" /></label><button className="rounded-lg bg-[#0E3B22] px-4 py-2 text-sm font-semibold text-white">Filter</button></div></form>
        <section className="overflow-hidden rounded-2xl border bg-white"><div className="flex items-center justify-between border-b px-4 py-3"><p className="text-sm font-semibold">{totalItems.toLocaleString()} appointments</p><p className="text-xs text-gray-500">Page {page} of {totalPages || 1}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead className="bg-gray-50 text-gray-500"><tr>{["Date", "Time", "Student", "Counselor", "Status", "Last updated", "Actions"].map(x => <th key={x} className="px-3 py-3 font-semibold">{x}</th>)}</tr></thead><tbody>{items.map(item => <tr key={item.id} className="border-t"><td className="px-3 py-3">{item.date}</td><td className="px-3 py-3">{item.timeSlot}</td><td className="px-3 py-3">{item.studentName || `Student #${item.studentId}`}<span className="block text-[10px] text-gray-400">{item.studentEmail}</span></td><td className="px-3 py-3">{item.counselorName || "Unassigned"}</td><td className="px-3 py-3">{item.status}</td><td className="px-3 py-3">{formatDate(item.updatedAt)}</td><td className="whitespace-nowrap px-3 py-3"><button onClick={() => setSelected({ ...item, action: "status" })} className="mr-2 rounded-lg border px-2 py-1.5">Change status</button><button onClick={() => setSelected({ ...item, action: "reschedule" })} className="rounded-lg border px-2 py-1.5"><CalendarClock size={14} /></button></td></tr>)}{!items.length && <tr><td colSpan="7" className="px-3 py-12 text-center text-sm text-gray-400">{loading ? "Loading appointments…" : "No appointments match these filters."}</td></tr>}</tbody></table></div><div className="flex items-center justify-between border-t px-4 py-3"><button disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40">Previous</button><span className="text-xs text-gray-500">Page {page} / {totalPages || 1}</span><button disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40">Next</button></div></section>
        {selected && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Update appointment" onClick={() => !busy && setSelected(null)}><form onSubmit={submitChange} onClick={e => e.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-xl"><header className="flex items-center justify-between"><div><h2 className="font-semibold">{selected.action === "reschedule" ? "Reschedule or reassign" : "Change appointment status"}</h2><p className="text-xs text-gray-500">{selected.studentName} · {selected.date} · {selected.timeSlot}</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Close" className="rounded-lg p-2 hover:bg-gray-100"><X size={17} /></button></header>{selected.action === "reschedule" ? <><label className="block text-xs font-semibold">New date<input required type="date" name="date" min={new Date().toISOString().slice(0, 10)} defaultValue={selected.date} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" /></label><label className="block text-xs font-semibold">New time slot<input required name="timeSlot" defaultValue={selected.timeSlot} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" /></label><label className="block text-xs font-semibold">Counselor<select name="counselorId" defaultValue={selected.counselorId || ""} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"><option value="">Keep existing assignment</option>{counselors.map(c => <option key={c.userId} value={c.userId}>{c.fullName}</option>)}</select></label></> : <label className="block text-xs font-semibold">New status<select name="status" defaultValue={selected.status} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm">{["Confirmed", "Rejected", "Cancelled", "Completed", "Arrived", "NoShow"].map(x => <option key={x}>{x}</option>)}</select></label>}<label className="block text-xs font-semibold">Reason for manual change<textarea name="reason" required maxLength={500} rows={3} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelected(null)} className="rounded-lg border px-3 py-2 text-sm">Cancel</button><button disabled={busy} className="rounded-lg bg-[#0E3B22] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save change"}</button></div></form></div>}
    </main>;
}
