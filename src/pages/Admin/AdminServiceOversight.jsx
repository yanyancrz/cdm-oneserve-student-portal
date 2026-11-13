import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, ClipboardList, FileDown, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../../config/api";

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
        activity: data => data.recentActivity || [],
    },
    guidance: {
        title: "Guidance monitoring", endpoint: "guidance", dataKey: "guidance",
        description: "Service statistics only. Counseling details, narrative contents and private chat messages are not shown.",
        note: "Aggregate monitoring only. Student counseling histories, narrative text, private notes and chat contents remain private to authorized Guidance staff.",
        cards: (data, view) => {
            const all = {
                overview: [["Counselors", data.totalCounselors, Users], ["Active counselors", data.activeCounselors, Users], ["Appointments", data.totalAppointments, ClipboardList], ["Pending appointments", data.pendingAppointments, Activity], ["Completed appointments", data.completedAppointments, ClipboardList]],
                appointments: Object.entries(data.appointmentStatuses || {}).map(([status, count]) => [status, count, ClipboardList]),
                counselors: [["Total counselors", data.totalCounselors, Users], ["Active counselors", data.activeCounselors, Users]],
                systems: [["Chat conversations", data.chatConversations, Activity], ["Chat messages · week", data.chatMessagesThisWeek, Activity], ["Narrative reports", data.narrativeReports, ShieldCheck], ["Finalized reports", data.finalizedNarrativeReports, ShieldCheck]],
            };
            return all[view] || all.overview;
        },
        activity: data => data.recentActivity || [],
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
        activity: data => data.recentReports || [],
    },
};

const featureLabels = {
    library: { overview: "Overview", inventory: "Inventory", circulation: "Circulation", reservations: "Reservations", activity: "Recent activity" },
    guidance: { overview: "Overview", appointments: "Appointments", counselors: "Counselor activity", systems: "Chat & report statistics" },
    "lost-found": { overview: "Overview", reports: "Reports", claims: "Claims", pickups: "Pickups", activity: "Recent activity" },
};

export default function AdminServiceOversight({ module }) {
    const config = configByModule[module] || configByModule.library;
    const [searchParams] = useSearchParams();
    const view = searchParams.get("view") || "overview";
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_URL}/api/admin/services/${config.endpoint}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.message || "Service overview is unavailable.");
            setResult(body);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [config.endpoint]);

    useEffect(() => { load(); }, [load]);

    const data = result?.[config.dataKey];
    const cards = useMemo(() => data ? config.cards(data, view) : [], [data, view, config]);
    const activity = data ? config.activity(data) : [];
    const showActivity = view === "activity" || (module === "lost-found" && view === "reports") || (module === "guidance" && view === "counselors");
    const isLostFound = module === "lost-found";
    const upcomingAppointments = module === "guidance" && view === "appointments" ? data?.upcomingAppointments || [] : [];

    return <main className="admin-service-report mx-auto max-w-6xl space-y-5 p-4 sm:p-7">
        <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
                <h1 className="text-3xl font-semibold text-[#1F1F1F]">{config.title}</h1>
                <p className="mt-1 text-sm text-gray-500">{config.description}</p>
            </div>
            <div className="admin-no-print flex gap-2">
                <button onClick={() => window.print()} disabled={loading || !data} className="inline-flex items-center gap-2 rounded-xl bg-[#0E3B22] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    <FileDown size={15} />Generate PDF report
                </button>
                <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                    <RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh
                </button>
            </div>
        </header>

        <p className="admin-print-meta text-xs text-gray-500">CDM OneServe · Service monitoring report · Generated {new Date().toLocaleString()}</p>

        <div className="flex flex-wrap gap-2" aria-label={`${config.title} features`}>
            {Object.entries(featureLabels[module] || featureLabels.library).map(([key, label]) => (
                <span key={key} className={`rounded-full px-3 py-1.5 text-xs font-medium ${view === key ? "bg-[#0E3B22] text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}>{label}</span>
            ))}
        </div>

        {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        {result && <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-4 text-sm">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{result.enabled ? "Service enabled" : "Service disabled"}</span>
            <span className="text-xs text-gray-500">Statistics updated {formatDate(data?.generatedAt)}</span>
            <span className="ml-auto text-xs text-gray-500">Monitoring only</span>
        </div>}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(([label, value, Icon]) => <article key={label} className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between text-xs text-gray-500"><span>{label}</span><Icon size={16} /></div>
                <p className="mt-2 text-2xl font-semibold">{loading ? "…" : value ?? "—"}</p>
            </article>)}
        </section>

        {module === "guidance" && view === "appointments" && <section className="overflow-hidden rounded-2xl border bg-white">
            <h2 className="border-b p-4 font-semibold">Upcoming appointment schedule</h2>
            <div className="overflow-x-auto"><table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500"><tr>{["Date", "Time", "Status"].map(x => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead>
                <tbody>{upcomingAppointments.map(item => <tr key={item.id} className="border-t"><td className="px-3 py-2">{item.date}</td><td className="px-3 py-2">{item.timeSlot}</td><td className="px-3 py-2">{item.status}</td></tr>)}
                    {!upcomingAppointments.length && <tr><td colSpan="3" className="px-3 py-8 text-center text-gray-400">{loading ? "Loading schedule…" : "No upcoming appointments."}</td></tr>}
                </tbody>
            </table></div>
        </section>}

        {showActivity && <section className="overflow-hidden rounded-2xl border bg-white">
            <h2 className="border-b p-4 font-semibold">{isLostFound ? "Recent reports" : "Recent counselor activity"}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500"><tr>{isLostFound ? ["Item", "Category", "Type", "Status", "Reported"].map(x => <th key={x} className="px-3 py-2">{x}</th>) : ["Activity", "Details", "Actor", "Time"].map(x => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead>
                    <tbody>
                        {activity.map((item, index) => isLostFound
                            ? <tr key={item.reportId} className="border-t"><td className="px-3 py-2">{item.itemName}</td><td className="px-3 py-2">{item.category}</td><td className="px-3 py-2">{item.reportType}</td><td className="px-3 py-2">{item.status}</td><td className="px-3 py-2">{formatDate(item.createdAt)}</td></tr>
                            : <tr key={`${item.type}-${item.at}-${index}`} className="border-t"><td className="px-3 py-2">{item.type}</td><td className="px-3 py-2">{item.title || "—"}</td><td className="px-3 py-2">{item.actor || "—"}</td><td className="px-3 py-2">{formatDate(item.at)}</td></tr>
                        )}
                        {!activity.length && <tr><td colSpan="5" className="px-3 py-8 text-center text-gray-400">{loading ? "Loading activity…" : "No recorded activity."}</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>}

        <aside className="flex gap-3 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-900"><ShieldCheck className="mt-0.5 shrink-0" size={17} /><p>{result?.note || config.note}</p></aside>
    </main>;
}
