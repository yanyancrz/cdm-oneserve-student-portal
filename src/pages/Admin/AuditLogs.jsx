import { useCallback, useEffect, useState } from "react";
import { Download, Eye, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { API_URL } from "../../config/api";

const BASE = `${API_URL}/api/admin/audit-logs`;
const authHeaders = () => {
    const value = localStorage.getItem("token") || localStorage.getItem("authToken");
    return value ? { Authorization: `Bearer ${value}` } : {};
};
async function get(path) {
    const response = await fetch(`${BASE}${path}`, { headers: authHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Could not load audit records.");
    return data;
}
const dateLabel = value => value ? new Date(value).toLocaleString() : "—";

export default function AuditLogs() {
    const [facets, setFacets] = useState({ modules: [], categories: [], actions: [] });
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({ module: "", category: "", userId: "", action: "", search: "", from: "", to: "" });
    const [query, setQuery] = useState(filters);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const queryString = (values, pageNumber = 1) => {
        const params = new URLSearchParams({ page: String(pageNumber), pageSize: "25" });
        Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); });
        return params.toString();
    };
    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const [logs, options, userRows] = await Promise.all([
                get(`?${queryString(query, page)}`), get("/facets"),
                fetch(`${API_URL}/api/auth/users`, { headers: authHeaders() }).then(async response => { const body = await response.json().catch(() => []); if (!response.ok) throw new Error(body.message || "User filter could not be loaded."); return body; }),
            ]);
            setItems(logs.items || []); setTotalPages(logs.totalPages || 0); setTotalItems(logs.totalItems || 0); setFacets(options);
            setUsers(Array.isArray(userRows) ? userRows : []);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [query, page]);
    useEffect(() => { load(); }, [load]);

    const exportCsv = async () => {
        try {
            const response = await fetch(`${BASE}/export?${queryString(query)}`, { headers: authHeaders() });
            if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || "Export failed."); }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a"); link.href = url; link.download = "oneserve-audit.csv"; link.click(); URL.revokeObjectURL(url);
        } catch (e) { setError(e.message); }
    };
    const openDetails = async id => {
        try { setSelected(await get(`/${id}`)); }
        catch (e) { setError(e.message); }
    };
    const clear = () => { const empty = { module: "", category: "", userId: "", action: "", search: "", from: "", to: "" }; setFilters(empty); setQuery(empty); setPage(1); };

    return <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-7">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold text-[#1F1F1F]">Central Audit Logs</h1><p className="mt-1 text-sm text-gray-500">Append-only record of OneServe administrator and module activity.</p></div><div className="flex gap-2"><button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh</button><button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl bg-[#0E3B22] px-3 py-2 text-sm font-semibold text-white"><Download size={15} />Export CSV</button></div></header>
        {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <section className="rounded-2xl border bg-white p-4"><form onSubmit={e => { e.preventDefault(); setQuery(filters); setPage(1); }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="relative sm:col-span-2"><span className="sr-only">Search logs</span><Search size={15} className="absolute left-3 top-3 text-gray-400" /><input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Search actor, action, record or details" className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm" /></label>
            <select value={filters.module} onChange={e => setFilters({ ...filters, module: e.target.value })} className="rounded-lg border px-3 py-2 text-sm"><option value="">All modules</option>{(facets.modules || []).map(x => <option key={x} value={x}>{x}</option>)}</select>
            <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="rounded-lg border px-3 py-2 text-sm"><option value="">All categories</option>{(facets.categories || []).map(x => <option key={x} value={x}>{x}</option>)}</select>
            <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })} className="rounded-lg border px-3 py-2 text-sm"><option value="">All actions</option>{(facets.actions || []).map(x => <option key={x} value={x}>{x}</option>)}</select>
            <select value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })} className="rounded-lg border px-3 py-2 text-sm"><option value="">All users</option>{users.map(user => <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>)}</select>
            <label className="text-xs text-gray-500">From<input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-800" /></label>
            <label className="text-xs text-gray-500">To<input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-800" /></label>
            <div className="flex items-end gap-2"><button className="rounded-lg bg-[#0E3B22] px-4 py-2 text-sm font-semibold text-white">Apply filters</button><button type="button" onClick={clear} className="rounded-lg border px-3 py-2 text-sm text-gray-600">Clear</button></div>
        </form></section>
        <section className="overflow-hidden rounded-2xl border bg-white"><div className="flex items-center justify-between border-b px-4 py-3"><p className="text-sm font-semibold">{totalItems.toLocaleString()} audit entries</p><p className="text-xs text-gray-500">Page {page} of {totalPages || 1}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-gray-50 text-gray-500"><tr>{["Time", "User", "Role", "Module", "Action", "Record", "IP", "Details"].map(x => <th key={x} className="px-3 py-3 font-semibold">{x}</th>)}<th className="px-3 py-3" /></tr></thead><tbody>{items.map(row => <tr key={row.id} className="border-t hover:bg-gray-50"><td className="whitespace-nowrap px-3 py-3">{dateLabel(row.createdAt || row.timestamp)}</td><td className="px-3 py-3">{row.actorName || row.userName || row.userId || "System"}</td><td className="px-3 py-3">{row.actorRole || row.userRole || "—"}</td><td className="px-3 py-3">{row.module || "—"}<span className="block text-[10px] text-gray-400">{row.category}</span></td><td className="max-w-64 px-3 py-3">{row.action}</td><td className="px-3 py-3">{row.entityType || "—"}{row.entityId ? ` #${row.entityId}` : ""}</td><td className="px-3 py-3">{row.ipAddress || "—"}</td><td className="max-w-64 truncate px-3 py-3" title={row.details || ""}>{row.details || "—"}</td><td className="px-3 py-3"><button onClick={() => openDetails(row.id)} aria-label="View complete audit activity" className="rounded-lg p-2 hover:bg-gray-100"><Eye size={15} /></button></td></tr>)}{!items.length && <tr><td colSpan="9" className="px-3 py-12 text-center text-sm text-gray-400">{loading ? "Loading audit entries…" : "No audit entries match these filters."}</td></tr>}</tbody></table></div><div className="flex items-center justify-between border-t px-4 py-3"><button disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40">Previous</button><span className="text-xs text-gray-500">Page {page} / {totalPages || 1}</span><button disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40">Next</button></div></section>
        <aside className="flex gap-3 rounded-xl bg-blue-50 p-4 text-xs text-blue-900"><ShieldCheck size={17} className="shrink-0" /><p>Audit entries are read-only here. The API does not provide edit or delete operations for audit records.</p></aside>
        {selected && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Audit entry details" onClick={() => setSelected(null)}><section className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}><header className="flex items-center justify-between"><h2 className="text-lg font-semibold">Audit activity details</h2><button onClick={() => setSelected(null)} aria-label="Close" className="rounded-lg p-2 hover:bg-gray-100"><X size={17} /></button></header><dl className="mt-4 grid gap-3 sm:grid-cols-2">{Object.entries(selected).map(([key, value]) => <div key={key} className="rounded-lg bg-gray-50 p-3"><dt className="text-[10px] font-semibold uppercase text-gray-500">{key.replace(/[A-Z]/g, x => ` ${x}`).replace(/^./, x => x.toUpperCase())}</dt><dd className="mt-1 break-words text-sm">{value == null || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}</dd></div>)}</dl></section></div>}
    </main>;
}
