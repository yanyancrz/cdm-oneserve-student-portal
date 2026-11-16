import AdminPageHeader from "./AdminPageHeader";
import ExportFormatSelect from "./ExportFormatSelect";
import { exportReport } from "./reportExport";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, ClipboardList, FileDown, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../../config/api";
import { filterRecentRecords, formatServiceStatus, getRecentSection } from "./serviceRecentRecords";
import GuidanceNarrativeReportsPage from "../../guidance-admin/pages/GuidanceNarrativeReportsPage";

const formatDate = value => value ? new Date(value).toLocaleString() : "—";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("authToken");

const configByModule = {
    library: {
        title: "Library monitoring", endpoint: "library", dataKey: "library",
        description: "Read-only counts and activity from the existing Library records.",
        note: "Monitoring view only. Book, loan, reservation and settings changes remain in the Library Head console.",
        cards: (data, view) => {
            const all = {
                overview: [["Titles", data.titles, BookOpen], ["Total copies", data.totalCopies, BookOpen], ["Available copies", data.availableCopies, BookOpen], ["Active loans", data.activeLoans, ClipboardList], ["Overdue loans", data.overdueLoans, Activity]],
                inventory: [["Titles", data.titles, BookOpen], ["Total copies", data.totalCopies, BookOpen], ["Available copies", data.availableCopies, BookOpen], ["Damaged books", data.damagedBooks, Activity], ["Lost books", data.lostBooks, Activity], ["Archived books", data.archivedBooks, BookOpen]],
                circulation: [["Borrowed copies", data.borrowedCopies, ClipboardList], ["Active loans", data.activeLoans, ClipboardList], ["Overdue loans", data.overdueLoans, Activity], ["Returned this week", data.returnedThisWeek, ClipboardList]],
                reservations: Object.entries(data.reservationStatuses || {}).map(([status, count]) => [status, count, ClipboardList]),
                activity: [],
            };
            return all[view] || all.overview;
        },
    },
    guidance: {
        title: "Guidance monitoring", endpoint: "guidance", dataKey: "guidance",
        description: "Service statistics only. Counseling details, narrative contents and private notes are not shown.",
        note: "Aggregate monitoring only. Student counseling histories, narrative text and private notes remain private to authorized Guidance staff.",
        cards: (data, view) => {
            const all = {
                overview: [["Counselors", data.totalCounselors, Users], ["Active counselors", data.activeCounselors, Users], ["Appointments", data.totalAppointments, ClipboardList], ["Pending appointments", data.pendingAppointments, Activity], ["Completed appointments", data.completedAppointments, ClipboardList]],
                appointments: Object.entries(data.appointmentStatuses || {}).map(([status, count]) => [formatServiceStatus(status), count, ClipboardList]),
                counselors: [["Total counselors", data.totalCounselors, Users], ["Active counselors", data.activeCounselors, Users]],
                systems: [["Narrative reports", data.narrativeReports, ShieldCheck], ["Finalized reports", data.finalizedNarrativeReports, ShieldCheck]],
            };
            return all[view] || all.overview;
        },
    },
    "lost-found": {
        title: "Lost & Found monitoring", endpoint: "lost-found", dataKey: "lostFound",
        description: "Read-only report, claim and pickup statistics from the existing service.",
        note: "Monitoring view only. Proof files and claim decisions remain in the Lost & Found administrator console.",
        cards: (data, view) => {
            const all = {
                overview: [["Total reports", data.totalReports, ClipboardList], ["Lost items", data.lostReports, ClipboardList], ["Found items", data.foundReports, ClipboardList], ["Pending reports", data.pendingReports, Activity], ["Active claims", data.activeClaims, Users], ["Pending pickups", data.pendingPickups, Activity]],
                reports: [["Total reports", data.totalReports, ClipboardList], ["Lost items", data.lostReports, ClipboardList], ["Found items", data.foundReports, ClipboardList], ["Pending reports", data.pendingReports, Activity], ["Reports this week", data.reportsThisWeek, Activity]],
                claims: [["Claims", data.claims, ClipboardList], ["Active claims", data.activeClaims, Activity], ["Approved claims", data.approvedClaims, ShieldCheck], ["Rejected claims", data.rejectedClaims, Activity], ...Object.entries(data.claimStatuses || {}).map(([status, count]) => [status, count, ClipboardList])],
                pickups: [["Pending pickups", data.pendingPickups, Activity], ["Completed pickups", data.completedPickups, ClipboardList], ["Completed recoveries", data.completedRecoveries, ShieldCheck], ...Object.entries(data.scheduleStatuses || {}).map(([status, count]) => [status, count, ClipboardList])],
                activity: [],
            };
            return all[view] || all.overview;
        },
    },
};

const featureLabels = {
    library: { overview: "Overview", inventory: "Inventory", circulation: "Circulation", reservations: "Reservations", activity: "Recent activity" },
    guidance: { overview: "Overview", appointments: "Appointments", counselors: "Counselors", systems: "Narrative Reports" },
    "lost-found": { overview: "Overview", reports: "Reports", claims: "Claims", pickups: "Pickups", activity: "Recent activity" },
};

export default function AdminServiceOversight({ module }) {
    const [exportFormat, setExportFormat] = useState("pdf");
    const [exporting, setExporting] = useState(false);
    const config = configByModule[module] || configByModule.library;
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedView = searchParams.get("view") || "overview";
    const view = featureLabels[module]?.[requestedView] ? requestedView : "overview";
    const narrativeView = module === "guidance" && view === "systems";
    const [recordFilter, setRecordFilter] = useState({ key: "", search: "", status: "" });
    const filterKey = `${module}:${view}`;
    const search = recordFilter.key === filterKey ? recordFilter.search : "";
    const status = recordFilter.key === filterKey ? recordFilter.status : "";
    const updateFilter = changes => setRecordFilter({ key: filterKey, search, status, ...changes });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async (signal) => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_URL}/api/admin/services/${config.endpoint}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                signal,
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.message || "Service overview is unavailable.");
            if (!signal?.aborted) setResult({ ...body, endpoint: config.endpoint });
        } catch (e) {
            if (!signal?.aborted) setError(e.message);
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [config.endpoint]);

    useEffect(() => {
        if (narrativeView) return;
        const controller = new AbortController();
        queueMicrotask(() => { if (!controller.signal.aborted) load(controller.signal); });
        return () => controller.abort();
    }, [load, narrativeView]);

    const data = result?.endpoint === config.endpoint ? result[config.dataKey] : null;
    const cards = useMemo(() => data ? config.cards(data, view) : [], [data, view, config]);
    const recent = getRecentSection(module, view, data);
    const recentRows = filterRecentRecords(recent.rows, recent.columns, search, status);
    const statuses = [...new Set(recent.rows.map(row => row.status).filter(Boolean))].sort();
    const upcomingAppointments = module === "guidance" && view === "appointments" ? data?.upcomingAppointments || [] : [];

    const handleExport = async () => {
        if (!data || exporting) return;
        setExporting(true);
        try {
            const rows = [["Section", "Field / reference", "Value / item", "Details / actor", "Status", "Recorded / updated", "Schedule / expiry"]];
            cards.forEach(([label, value]) => rows.push(["Statistics", label, value ?? "", "", ""]));
            rows.push([recent.title, ...recent.columns.map(column => column.label)]);
            recentRows.forEach(item => rows.push([recent.title, ...recent.columns.map(column => column.date ? formatDate(item[column.key]) : formatServiceStatus(item[column.key]) ?? "")]));
            if (upcomingAppointments.length) rows.push(["Upcoming appointments", "Student", "Counselor", "Date", "Time", "Status"]);
            upcomingAppointments.forEach(item => rows.push(["Upcoming appointments", item.studentName || "—", item.counselorName || "Unassigned", item.date, item.timeSlot, formatServiceStatus(item.status)]));
            const columnCount = Math.max(...rows.map(row => row.length));
            while (rows[0].length < columnCount) rows[0].push("Additional details");
            const csv = "\uFEFF" + rows.map(row => Array.from({ length: columnCount }, (_, index) => row[index] ?? "").map(value => {
                let text = String(value ?? "");
                if (/^\s*[=+\-@]/u.test(text)) text = `'${text}`;
                return `"${text.replaceAll('"', '""')}"`;
            }).join(",")).join("\r\n");
            await exportReport({ csv, title: config.title, subtitle: featureLabels[module]?.[view] || view, filename: `${module}-${view}-report`, format: exportFormat });
        } catch (e) { setError(`Export failed. ${e.message}`); }
        finally { setExporting(false); }
    };

    const tabs = <div className="flex flex-wrap gap-2" aria-label={`${config.title} features`}>
        {Object.entries(featureLabels[module] || featureLabels.library).map(([key, label]) => (
            <button type="button" key={key} aria-current={view === key ? "page" : undefined} onClick={() => setSearchParams({ view: key })} className={`rounded-full px-3 py-1.5 text-xs font-medium ${view === key ? "bg-[#0E3B22] text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}>{label}</button>
        ))}
    </div>;
    if (narrativeView) return <main className="admin-page admin-service-report space-y-5">{tabs}<GuidanceNarrativeReportsPage readOnly /></main>;

    return <main className="admin-page admin-service-report space-y-5">
        <AdminPageHeader icon={module} title={config.title} description={config.description}>
            <div className="admin-no-print flex flex-wrap gap-2">
                <ExportFormatSelect value={exportFormat} onChange={setExportFormat} disabled={exporting} />
                <button onClick={handleExport} disabled={loading || !data || exporting} className="inline-flex items-center gap-2 rounded-xl bg-[#0E3B22] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    <FileDown size={15} />Export report
                </button>
                <button onClick={() => load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                    <RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh
                </button>
            </div>
        </AdminPageHeader>

        <p className="admin-print-meta text-xs text-gray-500">CDM OneServe · Service monitoring report · Generated {new Date().toLocaleString()}</p>

        {tabs}

        {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        {data && <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-4 text-sm">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{result.enabled ? "Service enabled" : "Service disabled"}</span>
            <span className="text-xs text-gray-500">Statistics updated {formatDate(data?.generatedAt)}</span>
            <span className="ml-auto text-xs text-gray-500">Monitoring only</span>
        </div>}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(([label, value, Icon]) => <article key={label} className="admin-surface rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs text-gray-500"><span>{label}</span><Icon size={16} /></div>
                <p className="mt-2 text-2xl font-semibold">{loading ? "…" : value ?? "—"}</p>
            </article>)}
        </section>

        {module === "guidance" && view === "appointments" && <section className="admin-surface overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <h2 className="border-b p-4 font-semibold">Upcoming appointment schedule</h2>
            <div className="overflow-x-auto"><table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500"><tr>{["Student", "Counselor", "Date", "Time", "Status"].map(x => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead>
                <tbody>{upcomingAppointments.map(item => <tr key={item.id} className="border-t"><td className="px-3 py-2">{item.studentName || "—"}</td><td className="px-3 py-2">{item.counselorName || "Unassigned"}</td><td className="px-3 py-2">{item.date}</td><td className="px-3 py-2">{item.timeSlot}</td><td className="px-3 py-2">{formatServiceStatus(item.status)}</td></tr>)}
                    {!upcomingAppointments.length && <tr><td colSpan="5" className="px-3 py-8 text-center text-gray-400">{loading ? "Loading schedule…" : "No upcoming appointments."}</td></tr>}
                </tbody>
            </table></div>
        </section>}

        <section className="admin-surface overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div><h2 className="font-semibold">{recent.title}</h2><p className="mt-1 text-xs text-gray-500">{recent.limit ? `Latest ${recent.limit} records` : `${recent.rows.length} counselors`} · {recentRows.length} shown{search || status ? " after filtering" : ""}</p></div>
                <div className="admin-no-print flex flex-wrap gap-2">
                    <input type="search" aria-label={`Search ${recent.title.toLowerCase()}`} placeholder={recent.limit ? "Search recent records..." : "Search counselors..."} value={search} onChange={event => updateFilter({ search: event.target.value })} className="rounded-xl border px-3 py-2 text-xs" />
                    {statuses.length > 0 && <select aria-label="Filter recent records by status" value={status} onChange={event => updateFilter({ status: event.target.value })} className="rounded-xl border bg-white px-3 py-2 text-xs"><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{formatServiceStatus(value)}</option>)}</select>}
                    {(search || status) && <button type="button" onClick={() => updateFilter({ search: "", status: "" })} className="text-xs font-semibold text-[#0E3B22]">Clear filters</button>}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500"><tr>{recent.columns.map(column => <th key={column.key} className="px-3 py-2">{column.label}</th>)}</tr></thead>
                    <tbody>
                        {!loading && recentRows.map((item, index) => <tr key={item.id ?? item.reportId ?? index} className="border-t">{recent.columns.map(column => <td key={column.key} className="px-3 py-2">{column.date ? formatDate(item[column.key]) : formatServiceStatus(item[column.key]) || "—"}</td>)}</tr>)}
                        {(loading || !recentRows.length) && <tr><td colSpan={recent.columns.length} className="px-3 py-8 text-center text-gray-400">{loading ? (recent.limit ? "Loading recent records…" : "Loading counselors…") : search || status ? "No records match your filters." : recent.limit ? "No recent records." : "No counselors found."}</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>

        <aside className="flex gap-3 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-900"><ShieldCheck className="mt-0.5 shrink-0" size={17} /><p>{result?.note || config.note}</p></aside>
    </main>;
}
