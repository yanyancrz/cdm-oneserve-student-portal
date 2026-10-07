import { useCallback, useEffect, useState } from "react";
import { CalendarX2 } from "lucide-react";

import { CardListSkeleton, Empty, ErrorBox } from "../components/GuidanceStates";
import { SectionTitle } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";

// Reports & stats for the counselor: totals, follow-ups, top concerns,
// appointments per month, and client breakdown by role.
export default function ReportsPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async (signal) => {
        setError("");
        setLoading(true);
        try {
            setReport(await guidanceApi.getCounselorReport(signal));
        } catch (e) {
            if (e?.name !== "AbortError") setError(e.message || "Could not load reports.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const c = new AbortController();
        load(c.signal);
        return () => c.abort();
    }, [load]);

    if (loading && !report) return <main className="p-4"><CardListSkeleton rows={4} label="Loading reports..." /></main>;
    if (error) return <main className="p-4"><ErrorBox message={error} onRetry={() => load()} /></main>;
    if (!report) return null;

    const stats = [
        { label: "Total appointments", value: report.totalAppointments },
        { label: "Completed", value: report.completed },
        { label: "Clients", value: report.totalClients },
        { label: "Pending", value: report.pending },
    ];

    const maxMonthly = Math.max(1, ...report.monthly.map((m) => m.total));

    return (
        <main className="space-y-4 p-4">
            <section className="grid grid-cols-2 gap-3">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                        <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                ))}
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <SectionTitle>Follow-ups</SectionTitle>

                <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">
                        {report.followUpsPending} pending
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-[#106A2E]">
                        {report.followUpsAccepted} accepted
                    </span>
                    <span className="rounded-full bg-red-50 px-3 py-1.5 font-semibold text-red-600">
                        {report.followUpsDeclined} declined
                    </span>
                </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <SectionTitle>Appointments per month</SectionTitle>

                <div className="flex items-end gap-2" aria-label="Appointments per month">
                    {report.monthly.map((m) => (
                        <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                            <div className="flex h-24 w-full items-end rounded-lg bg-slate-50">
                                <div
                                    className="w-full rounded-lg bg-[#106A2E]/80 transition-all"
                                    style={{ height: `${(m.total / maxMonthly) * 100}%` }}
                                    title={`${m.total} total, ${m.completed} completed`}
                                />
                            </div>
                            <span className="text-[9px] font-semibold text-slate-400">{m.month.slice(5)}</span>
                        </div>
                    ))}
                </div>

                <p className="text-[10px] text-slate-400">Last 6 months · bar height = total appointments</p>
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <SectionTitle>Top concerns</SectionTitle>

                {report.topConcerns.length === 0 ? (
                    <p className="text-xs text-slate-400">No concerns recorded yet.</p>
                ) : (
                    report.topConcerns.map((c) => (
                        <div key={c.concern} className="flex items-center justify-between text-sm">
                            <span className="truncate text-slate-600">{c.concern}</span>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-[#106A2E]">{c.count}</span>
                        </div>
                    ))
                )}
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <SectionTitle>Clients by role</SectionTitle>

                {report.byRole.length === 0 ? (
                    <Empty icon={CalendarX2} title="No clients yet" />
                ) : (
                    report.byRole.map((r) => (
                        <div key={r.role} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{r.role}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{r.clients}</span>
                        </div>
                    ))
                )}
            </section>
        </main>
    );
}
