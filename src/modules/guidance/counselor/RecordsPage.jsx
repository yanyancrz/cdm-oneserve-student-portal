import { useCallback, useEffect, useState } from "react";
import { CalendarCheck2, CalendarClock, ChevronDown, Lock, SearchX } from "lucide-react";

import RoleBadge from "../components/RoleBadge";
import { CardListSkeleton, Empty, ErrorBox } from "../components/GuidanceStates";
import { Avatar, SearchBar, SectionTitle } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";
import { personDetails } from "../utils/people";
import { formatYMD } from "../utils/dateTime";

// Student Records & Case Monitoring: one card per client (student/faculty).
// Tapping a card expands it and loads that client's session records + follow-ups.
export default function RecordsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState({});
    const [cases, setCases] = useState({}); // studentId -> loaded case detail
    const [caseError, setCaseError] = useState({});

    const load = useCallback(async (signal) => {
        setError("");
        setLoading(true);
        try {
            setClients(await guidanceApi.getStudentCases(signal));
        } catch (e) {
            if (e?.name !== "AbortError") setError(e.message || "Could not load student records.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const c = new AbortController();
        load(c.signal);
        return () => c.abort();
    }, [load]);

    const toggle = async (studentId) => {
        const willOpen = !open[studentId];
        setOpen((prev) => ({ ...prev, [studentId]: willOpen }));

        // Load the case detail the first time a card is opened.
        if (willOpen && !cases[studentId]) {
            try {
                const detail = await guidanceApi.getStudentCase(studentId);
                setCases((prev) => ({ ...prev, [studentId]: detail }));
                setCaseError((prev) => ({ ...prev, [studentId]: "" }));
            } catch (e) {
                setCaseError((prev) => ({ ...prev, [studentId]: e.message || "Could not load this record." }));
            }
        }
    };

    const q = search.trim().toLowerCase();
    const rows = clients.filter(
        (c) =>
            !q ||
            [c.studentName, c.studentNumber, ...(c.concerns || [])]
                .filter(Boolean)
                .some((v) => v.toLowerCase().includes(q))
    );

    return (
        <main className="space-y-3 p-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search client name, ID or concern" accent="green" />

            {loading && clients.length === 0 && <CardListSkeleton rows={3} label="Loading student records..." />}
            {error && <ErrorBox message={error} onRetry={() => load()} />}
            {!loading && !error && rows.length === 0 && (
                <Empty icon={SearchX} title="No student records yet" note="Records appear here once a student books with you." />
            )}

            {rows.map((c) => {
                const isOpen = !!open[c.studentId];
                const detail = cases[c.studentId];

                return (
                    <section key={c.studentId} className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                        <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => toggle(c.studentId)}
                            className="flex w-full items-center gap-3 p-4 text-left transition active:bg-slate-50"
                        >
                            <Avatar name={c.studentName} accent="green" />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">{c.studentName}</p>
                                <p className="truncate text-xs text-slate-500">{personDetails(c)}</p>
                            </div>

                            <RoleBadge role={c.role} />

                            <ChevronDown
                                size={16}
                                aria-hidden="true"
                                className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        <div className="flex items-center gap-4 border-t border-slate-50 px-4 pb-3 text-[11px] text-slate-500">
                            <span>
                                <b className="text-slate-700">{c.completedSessions}</b> session{c.completedSessions === 1 ? "" : "s"}
                            </span>
                            <span>
                                Last: <b className="text-slate-700">{c.lastSessionDate ? formatYMD(c.lastSessionDate) : "—"}</b>
                            </span>
                            {c.pendingFollowUps > 0 && (
                                <span className="font-semibold text-amber-600">{c.pendingFollowUps} follow-up pending</span>
                            )}
                        </div>

                        {isOpen && (
                            <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-3">
                                {caseError[c.studentId] && <ErrorBox message={caseError[c.studentId]} />}
                                {!detail && !caseError[c.studentId] && (
                                    <p className="py-4 text-center text-xs text-slate-400">Loading case file…</p>
                                )}

                                {detail && (
                                    <>
                                        <SectionTitle>Session records</SectionTitle>

                                        {detail.records.length === 0 && (
                                            <p className="text-xs text-slate-400">No session notes yet. Mark an appointment as Completed to start writing notes.</p>
                                        )}

                                        {detail.records.map((r) => (
                                            <article key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-bold text-slate-700">{formatYMD(r.sessionDate)}{r.concernType ? ` · ${r.concernType}` : ""}</p>
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{r.status}</span>
                                                </div>

                                                {r.sessionSummary && (
                                                    <p className="mt-1.5 text-xs leading-5 text-slate-600">{r.sessionSummary}</p>
                                                )}

                                                {r.privateNotes && (
                                                    <p className="mt-1.5 flex gap-1.5 rounded-lg bg-amber-50 p-2 text-[11px] leading-5 text-amber-800">
                                                        <Lock size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                                                        {r.privateNotes}
                                                    </p>
                                                )}
                                            </article>
                                        ))}

                                        <SectionTitle>Follow-ups</SectionTitle>

                                        {detail.followUps.length === 0 && (
                                            <p className="text-xs text-slate-400">No follow-ups requested.</p>
                                        )}

                                        {detail.followUps.map((f) => (
                                            <article key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                                <div className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-[#106A2E]">
                                                    {formatYMD(f.followUpDate)}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-slate-700">
                                                        {f.reason || "Follow-up"}
                                                    </p>
                                                    <p className="truncate text-[11px] text-slate-500">
                                                        {f.followUpTime ? `${f.followUpTime} · ` : ""}{f.status}
                                                    </p>
                                                </div>

                                                <span className="shrink-0">
                                                    {f.status === "Pending" ? (
                                                        <CalendarClock size={14} className="text-amber-500" aria-hidden="true" />
                                                    ) : (
                                                        <CalendarCheck2 size={14} className="text-slate-300" aria-hidden="true" />
                                                    )}
                                                </span>
                                            </article>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </section>
                );
            })}
        </main>
    );
}
