import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, ClipboardList, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";

const formatDate = value => value ? new Date(value).toLocaleString() : "—";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("authToken");

export default function AdminServiceOversight({ module }) {
    const isGuidance = module === "guidance";
    const config = isGuidance ? {
        title: "Guidance Management", endpoint: "guidance", dataKey: "guidance", console: "/admin/guidance",
        cards: data => [
            ["Total counselors", data.totalCounselors, Users], ["Active counselors", data.activeCounselors, Users],
            ["Total appointments", data.totalAppointments, ClipboardList], ["Pending appointments", data.pendingAppointments, Activity],
            ["Approved appointments", data.approvedAppointments, ClipboardList], ["Completed appointments", data.completedAppointments, ClipboardList],
            ["Cancelled appointments", data.cancelledAppointments, ClipboardList], ["Narrative reports", data.narrativeReports, ShieldCheck],
            ["Chat messages · week", data.chatMessagesThisWeek, Activity],
        ],
    } : {
        title: "Lost & Found Management", endpoint: "lost-found", dataKey: "lostFound", console: "/lost-found/admin",
        cards: data => [
            ["Total reports", data.totalReports, ClipboardList], ["Lost items", data.lostReports, ClipboardList],
            ["Found items", data.foundReports, ClipboardList], ["Pending reports", data.pendingReports, Activity],
            ["Active claims", data.activeClaims, Users], ["Approved claims", data.approvedClaims, ShieldCheck],
            ["Rejected claims", data.rejectedClaims, Activity], ["Pending pickups", data.pendingPickups, ClipboardList],
            ["Completed recoveries", data.completedRecoveries, ShieldCheck],
        ],
    };
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const response = await fetch(`${API_URL}/api/admin/services/${config.endpoint}`, { headers: { Authorization: `Bearer ${getToken()}` } });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.message || "Service overview is unavailable.");
            setResult(body);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [config.endpoint]);
    useEffect(() => { load(); }, [load]);
    const data = result?.[config.dataKey];
    const cards = useMemo(() => data ? config.cards(data) : [], [data, config]);
    const recentItems = isGuidance ? [] : data?.recentReports || [];

    return <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-7">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold text-[#1F1F1F]">{config.title}</h1><p className="mt-1 text-sm text-gray-500">Central service overview from existing {isGuidance ? "Guidance" : "Lost & Found"} records.</p></div><div className="flex flex-wrap gap-2"><button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh</button>{isGuidance && result?.canManage && <Link to="/admin/services/guidance/appointments" className="inline-flex items-center gap-2 rounded-xl border border-[#0E3B22] px-3 py-2 text-sm font-semibold text-[#0E3B22]">Manage appointments</Link>}<Link to={config.console} className="inline-flex items-center gap-2 rounded-xl bg-[#0E3B22] px-3 py-2 text-sm font-semibold text-white">Open service console <ArrowUpRight size={15} /></Link></div></header>
        {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {result && <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-4 text-sm"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{result.enabled ? "Module enabled" : "Module disabled"}</span><span className="text-xs text-gray-500">Updated {formatDate(data?.generatedAt)}</span><span className="ml-auto text-xs text-gray-500">{result.canManage ? "Manage permission available" : "View permission"}</span></div>}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, Icon]) => <article key={label} className="rounded-2xl border bg-white p-4"><div className="flex items-center justify-between text-xs text-gray-500"><span>{label}</span><Icon size={16} /></div><p className="mt-2 text-2xl font-semibold">{loading ? "…" : value ?? "—"}</p></article>)}</section>
        {recentItems.length > 0 && <section className="overflow-hidden rounded-2xl border bg-white"><h2 className="border-b p-4 font-semibold">Recent item reports</h2><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-gray-50 text-gray-500"><tr>{["Item", "Category", "Type", "Status", "Reported"].map(x => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead><tbody>{recentItems.map(item => <tr key={item.reportId} className="border-t"><td className="px-3 py-2">{item.itemName}</td><td className="px-3 py-2">{item.category}</td><td className="px-3 py-2">{item.reportType}</td><td className="px-3 py-2">{item.status}</td><td className="px-3 py-2">{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div></section>}
        <aside className="flex gap-3 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-900"><ShieldCheck className="mt-0.5 shrink-0" size={17} /><p>{result?.note || (isGuidance ? "Aggregate counts only. Individual student histories, counseling narratives, private notes, and chat messages are not included in this central overview." : "Report counts and recent item summaries come from the existing Lost & Found module; proof files stay in its authorized console.")}</p></aside>
    </main>;
}
