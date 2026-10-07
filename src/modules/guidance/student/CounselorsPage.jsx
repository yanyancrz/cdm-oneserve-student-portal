import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, ChevronDown, ChevronUp, Mail, MapPin, Phone, Users } from "lucide-react";

import PageHeader from "../components/PageHeader";
import { CardListSkeleton, Empty, ErrorBox } from "../components/GuidanceStates";
import { Avatar, SearchBar } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";
import { DAY_NAMES } from "../utils/dateTime";

const TODAY_DOW = new Date().getDay();

function availabilityLabel(schedule) {
    if (!schedule?.length) return { ok: false, text: "No schedule set" };
    if (schedule.some((s) => s.dayOfWeek === TODAY_DOW)) return { ok: true, text: "Available today" };

    const next = schedule
        .map((s) => s.dayOfWeek)
        .sort((a, b) => ((a - TODAY_DOW + 7) % 7) - ((b - TODAY_DOW + 7) % 7))[0];
    return { ok: false, text: `Next: ${DAY_NAMES[next]}` };
}

const hhmm = (t) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

// One line of contact info: an icon in a small tile + the text.
function InfoRow({ icon: Icon, children }) {
    return (
        <p className="flex items-center gap-2.5 text-xs text-slate-600">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                <Icon size={13} aria-hidden="true" />
            </span>
            <span className="min-w-0 break-words">{children}</span>
        </p>
    );
}

export default function CounselorsPage() {
    const navigate = useNavigate();
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(null);

    const load = useCallback(async (signal) => {
        setError("");
        setLoading(true);
        try {
            setCounselors(await guidanceApi.getCounselors(signal));
        } catch (e) {
            if (e?.name !== "AbortError") setError(e.message || "Could not load counselors.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const c = new AbortController();
        load(c.signal);
        return () => c.abort();
    }, [load]);

    const q = search.trim().toLowerCase();
    const filtered = counselors.filter(
        (c) =>
            !q ||
            [c.fullName, c.department, c.title, ...(c.specializations || [])]
                .filter(Boolean)
                .some((v) => v.toLowerCase().includes(q))
    );

    return (
        <>
            <PageHeader title="Counselors" subtitle="Find a counselor and see when they are available." />

            <main className="space-y-3 px-4 pt-4">
                <SearchBar value={search} onChange={setSearch} placeholder="Search by name, department or specialty" />

                {loading && counselors.length === 0 && <CardListSkeleton rows={3} label="Loading counselors..." />}
                {error && <ErrorBox message={error} onRetry={() => load()} />}
                {!loading && !error && filtered.length === 0 && (
                    <Empty
                        icon={Users}
                        title="No counselors found"
                        note={q ? "Try a different search." : "No counselors are set up yet."}
                    />
                )}

                {filtered.map((c) => {
                    const av = availabilityLabel(c.schedule);
                    const expanded = open === c.id;

                    return (
                        <article
                            key={c.id}
                            className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar name={c.fullName} size="lg" />

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-800">{c.fullName}</p>
                                    <p className="truncate text-xs text-slate-500">
                                        {c.title || c.department || "Guidance Counselor"}
                                    </p>

                                    <span
                                        className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                            av.ok ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${av.ok ? "bg-green-500" : "bg-slate-300"}`}
                                        />
                                        {av.text}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setOpen(expanded ? null : c.id)}
                                    aria-expanded={expanded}
                                    aria-label={expanded ? "Hide details" : "Show details"}
                                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-50"
                                >
                                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                            </div>

                            {c.specializations?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {c.specializations.slice(0, expanded ? undefined : 3).map((s) => (
                                        <span
                                            key={s}
                                            className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-[#0E3B22]"
                                        >
                                            {s}
                                        </span>
                                    ))}

                                    {!expanded && c.specializations.length > 3 && (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                            +{c.specializations.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                            {expanded && (
                                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                                    <div className="space-y-2">
                                        {c.room && <InfoRow icon={MapPin}>{c.room}</InfoRow>}
                                        {c.phone && <InfoRow icon={Phone}>{c.phone}</InfoRow>}
                                        <InfoRow icon={Mail}>{c.email}</InfoRow>
                                    </div>

                                    {c.bio && <p className="text-xs leading-5 text-slate-500">{c.bio}</p>}

                                    {c.schedule?.length > 0 && (
                                        <div>
                                            <p className="mb-1.5 text-xs font-semibold text-slate-700">Weekly schedule</p>

                                            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 text-xs">
                                                {c.schedule.map((s, i) => (
                                                    <p
                                                        key={i}
                                                        className={`flex justify-between px-3 py-2 ${
                                                            s.dayOfWeek === TODAY_DOW
                                                                ? "bg-green-50/60 font-semibold text-green-800"
                                                                : "text-slate-600"
                                                        }`}
                                                    >
                                                        <span>{DAY_NAMES[s.dayOfWeek]}</span>
                                                        <span>
                                                            {hhmm(s.startTime)} – {hhmm(s.endTime)}
                                                        </span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="button"
                                disabled={!c.schedule?.length}
                                onClick={() => navigate(`/guidance/book?counselorId=${c.id}`)}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#106A2E] py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                            >
                                <CalendarPlus size={16} aria-hidden="true" />
                                Book appointment
                            </button>
                        </article>
                    );
                })}
            </main>
        </>
    );
}
