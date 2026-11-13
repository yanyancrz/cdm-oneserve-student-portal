import ClinicMedicalRecords from "./ClinicMedicalRecords";
import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, FileDown, RefreshCw, ShieldCheck, Wifi } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { API_URL } from "../../config/api";

const BASE = `${API_URL}/api/admin/services/clinic`;
async function call(path = "", options = {}) {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    const response = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Clinic integration request failed.");
    return data;
}
const fmt = value => value ? new Date(value).toLocaleString() : "—";
const tone = status => status === "online" ? "text-emerald-700 bg-emerald-50" : status === "degraded" ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";

export default function ClinicIntegration() {
    const [searchParams] = useSearchParams();
    const view = searchParams.get("view") || "overview";
    const [data, setData] = useState(null);
    const [logs, setLogs] = useState([]);
    const failuresOnly = view === "errors";
    const viewingRecords = view === "records";
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async (signal) => {
        setLoading(true);
        setError("");
        try {
            const [summary, logResult] = await Promise.all([
                call("", { signal }),
                call(`/logs?page=1&pageSize=25${failuresOnly ? "&failuresOnly=true" : ""}`, { signal }),
            ]);
            setData(summary);
            setLogs(logResult.items || []);
        } catch (e) { if (e.name !== "AbortError") setError(e.message); }
        finally { if (!signal?.aborted) setLoading(false); }
    }, [failuresOnly]);
    useEffect(() => {
        if (viewingRecords) return;
        const controller = new AbortController();
        const timer = setTimeout(() => load(controller.signal), 0);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [load, viewingRecords]);

    const summary = data?.summary;
    const connection = data?.connection;
    const cards = [
        ["Calls · 24h", summary?.calls24h ?? 0, Activity],
        ["Successful", summary?.success24h ?? 0, CheckCircle2],
        ["Failed", summary?.failed24h ?? 0, AlertTriangle],
        ["Average response", summary?.averageLatencyMs == null ? "—" : `${summary.averageLatencyMs} ms`, Clock3],
    ];

    return <main className="admin-service-report mx-auto max-w-6xl space-y-5 p-4 sm:p-7">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold text-[#1F1F1F]">Clinic</h1><p className="mt-1 text-sm text-gray-500">Medical records and service information from the Clinic CMS.</p></div>{!viewingRecords && <div className="admin-no-print flex gap-2"><button onClick={() => window.print()} disabled={loading || !data} className="inline-flex items-center gap-2 rounded-xl bg-[#0E3B22] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><FileDown size={15} />Generate PDF report</button><button onClick={() => load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh</button></div>}</header>
        <p className="admin-print-meta text-xs text-gray-500">CDM OneServe · Clinic integration report · Generated {new Date().toLocaleString()}</p>
        <div className="flex flex-wrap gap-2" aria-label="Clinic monitoring features">{[["overview", "Overview"], ["records", "Medical records"], ["activity", "Integration activity"], ["errors", "Failed requests"]].map(([key, label]) => <Link key={key} to={`?view=${key}`} className={`rounded-full px-3 py-1.5 text-xs font-medium ${view === key ? "bg-[#0E3B22] text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}>{label}</Link>)}</div>
        {!viewingRecords && error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {view === "records" ? <ClinicMedicalRecords /> : <>
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5">
            <div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-full ${tone(connection?.status)}`}><Wifi size={20} /></div><div><p className="font-semibold">Clinic CMS connection</p><p className="text-xs text-gray-500">{connection?.message || "Connection status is not available."}</p></div></div>
            <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone(connection?.status)}`}>{connection?.status || "unknown"}</span></div>
            <div className="w-full border-t pt-3 text-xs text-gray-500">Last checked: {fmt(data?.lastCheckedAt)}{connection?.latencyMs != null ? ` · ${connection.latencyMs} ms` : ""}</div>
        </section>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon]) => <article key={label} className="rounded-2xl border bg-white p-4"><div className="flex items-center justify-between text-xs text-gray-500"><span>{label}</span><Icon size={16} /></div><p className="mt-2 text-2xl font-semibold text-gray-800">{value}</p></article>)}</section>
        <section className="grid gap-3 sm:grid-cols-3"><article className="rounded-2xl border bg-white p-4"><p className="text-xs text-gray-500">Success rate · 24h</p><p className="mt-1 text-xl font-semibold">{summary?.successRate24h == null ? "—" : `${summary.successRate24h}%`}</p></article><article className="rounded-2xl border bg-white p-4"><p className="text-xs text-gray-500">Last successful request</p><p className="mt-1 text-sm font-medium">{fmt(summary?.lastSuccessAt)}</p></article><article className="rounded-2xl border bg-white p-4"><p className="text-xs text-gray-500">Last failed request</p><p className="mt-1 text-sm font-medium">{fmt(summary?.lastFailureAt)}</p></article></section>
        {view !== "overview" && <section className="overflow-hidden rounded-2xl border bg-white"><div className="border-b p-4"><h2 className="font-semibold">{failuresOnly ? "Failed integration requests" : "Integration request activity"}</h2><p className="mt-1 text-xs text-gray-500">Sanitized request metadata; no access tokens or health records.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-gray-50 text-gray-500"><tr>{["Time", "Resource", "Method", "Status", "Duration", "Result", "Error"].map(x => <th key={x} className="px-3 py-2 font-semibold">{x}</th>)}</tr></thead><tbody>{logs.map(log => <tr key={log.id} className="border-t"><td className="whitespace-nowrap px-3 py-2">{fmt(log.createdAt)}</td><td className="px-3 py-2">{log.resource}</td><td className="px-3 py-2">{log.method}</td><td className="px-3 py-2">{log.statusCode ?? "—"}</td><td className="px-3 py-2">{log.durationMs} ms</td><td className="px-3 py-2"><span className={`rounded-full px-2 py-1 ${log.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{log.success ? "Success" : "Failed"}</span></td><td className="max-w-64 truncate px-3 py-2 text-gray-500" title={log.errorMessage || ""}>{log.errorMessage || "—"}</td></tr>)}{!logs.length && <tr><td colSpan="7" className="px-3 py-8 text-center text-gray-400">{loading ? "Loading logs…" : "No integration requests in this view."}</td></tr>}</tbody></table></div></section>}
        </>}
        {view !== "records" && <aside className="flex gap-3 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-900"><ShieldCheck className="mt-0.5 shrink-0" size={17} /><p>{data?.note || "Clinic medical records, vital signs, dental records, referrals and counseling content are not available in this integration console."}</p></aside>}
    </main>;
}
