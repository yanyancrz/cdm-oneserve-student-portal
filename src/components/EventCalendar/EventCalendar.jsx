import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, X, RotateCw, Ban } from "lucide-react";

/* ---------- date helpers (local time, no timezone shifting) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const cleanKey = (v) => String(v).slice(0, 10); // "2026-10-05T00:00:00Z" -> "2026-10-05"
const keyToDate = (k) => {
    const [y, m, d] = cleanKey(k).split("-").map(Number);
    return new Date(y, m - 1, d);
};
const dateToKey = (dt) => toKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
const dayDiff = (a, b) => Math.round((keyToDate(b) - keyToDate(a)) / 86400000);

const expandRange = (start, end) => {
    const out = [];
    const e = keyToDate(end);
    for (let d = keyToDate(start), i = 0; d <= e && i < 366; d.setDate(d.getDate() + 1), i++) {
        out.push(dateToKey(d));
    }
    return out;
};

// Exact selected dates. Falls back to the old eventDate..endDate range for events saved before eventDates existed.
const getEventDates = (ev) => {
    let dates = [];
    if (Array.isArray(ev.eventDates) && ev.eventDates.length > 0) {
        dates = ev.eventDates.map(cleanKey);
    } else if (ev.eventDate) {
        const start = cleanKey(ev.eventDate);
        dates = ev.endDate ? expandRange(start, cleanKey(ev.endDate)) : [start];
    }
    return [...new Set(dates)].sort();
};

// ["08-17","08-18","08-19","08-25"] -> [["08-17","08-19"],["08-25","08-25"]]
const toRuns = (dates) => {
    const runs = [];
    dates.forEach((k) => {
        const last = runs[runs.length - 1];
        if (last && dayDiff(last[1], k) === 1) last[1] = k;
        else runs.push([k, k]);
    });
    return runs;
};

const formatRun = ([a, b], todayYear) => {
    const da = keyToDate(a);
    const db = keyToDate(b);
    const mon = (d) => d.toLocaleDateString("en-US", { month: "short" });
    const yearSuffix = db.getFullYear() !== todayYear ? `, ${db.getFullYear()}` : "";
    if (a === b) return `${mon(da)} ${da.getDate()}${yearSuffix}`;
    if (da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()) {
        return `${mon(da)} ${da.getDate()} – ${db.getDate()}${yearSuffix}`;
    }
    return `${mon(da)} ${da.getDate()} – ${mon(db)} ${db.getDate()}${yearSuffix}`;
};

const formatDates = (dates, todayYear) => toRuns(dates).map((r) => formatRun(r, todayYear)).join(", ");

const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = String(t).slice(0, 5).split(":").map(Number);
    if (Number.isNaN(h)) return "";
    return `${h % 12 || 12}:${pad(m || 0)} ${h >= 12 ? "PM" : "AM"}`;
};

const timeRange = (ev) => {
    if (!ev.startTime) return "";
    const s = formatTime(ev.startTime);
    return ev.endTime ? `${s} – ${formatTime(ev.endTime)}` : s;
};

// Events that mean "walang pasok" (holidays, breaks, suspensions). Based on the title/description text.
const NO_CLASS_RE = /\b(no classes|holiday|break|suspen|walang pasok)/i;
const isNoClass = (ev) => NO_CLASS_RE.test(`${ev.title || ""} ${ev.description || ""}`);

const TAG_LABELS = {
    CAMPUS: "Campus",
    LIBRARY: "Library",
    GUIDANCE: "Guidance",
    LOSTFOUND: "Lost & Found",
    CLINIC: "Clinic",
};
const tagLabel = (t) => TAG_LABELS[String(t || "").toUpperCase()] || (t ? String(t) : "Campus");

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function EventCalendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const n = new Date();
        return new Date(n.getFullYear(), n.getMonth(), 1);
    });
    const [selectedKey, setSelectedKey] = useState(null); // clicked day
    const [activeEventId, setActiveEventId] = useState(null); // clicked event -> highlights its dates
    const [tagFilter, setTagFilter] = useState("ALL");

    const loadEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const response = await fetch(`${API_URL}/api/events`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            setEvents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load events:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = new Date(year, month, 1).getDay();
    const monthPrefix = `${year}-${pad(month + 1)}-`;
    const today = new Date();
    const todayKey = dateToKey(today);
    const todayYear = today.getFullYear();

    // categories that actually exist in the data -> filter chips
    const tags = useMemo(() => {
        const set = new Set();
        events.forEach((ev) => set.add(String(ev.tag || "CAMPUS").toUpperCase()));
        return [...set].sort();
    }, [events]);

    // if the chosen category disappears after a reload, fall back to All
    const activeFilter = tagFilter === "ALL" || tags.includes(tagFilter) ? tagFilter : "ALL";

    const withDates = useMemo(
        () =>
            events
                .filter((ev) => activeFilter === "ALL" || String(ev.tag || "CAMPUS").toUpperCase() === activeFilter)
                .map((ev) => ({ ev, dates: getEventDates(ev) }))
                .filter((x) => x.dates.length > 0),
        [events, activeFilter]
    );

    // "YYYY-MM-DD" -> events happening that day (only for the visible month)
    const eventsByKey = useMemo(() => {
        const map = {};
        withDates.forEach(({ ev, dates }) => {
            dates.forEach((k) => {
                if (k.startsWith(monthPrefix)) (map[k] = map[k] || []).push(ev);
            });
        });
        return map;
    }, [withDates, monthPrefix]);

    // events in the visible month: `monthDates` = days inside this month, `dates` = the full schedule
    const monthEvents = useMemo(
        () =>
            withDates
                .map(({ ev, dates }) => ({ ev, dates, monthDates: dates.filter((k) => k.startsWith(monthPrefix)) }))
                .filter((x) => x.monthDates.length > 0)
                .sort((a, b) => a.monthDates[0].localeCompare(b.monthDates[0]) || a.ev.title.localeCompare(b.ev.title)),
        [withDates, monthPrefix]
    );

    // next event that starts on/after today (used when the viewed month is empty)
    const nextEvent = useMemo(() => {
        const upcoming = withDates
            .map(({ ev, dates }) => ({ ev, dates, next: dates.find((k) => k >= todayKey) }))
            .filter((x) => x.next)
            .sort((a, b) => a.next.localeCompare(b.next));
        return upcoming[0] || null;
    }, [withDates, todayKey]);

    const activeDates = useMemo(() => {
        if (!activeEventId) return new Set();
        const found = withDates.find(({ ev }) => ev.id === activeEventId);
        return new Set(found ? found.dates : []);
    }, [withDates, activeEventId]);

    const changeMonth = (delta) => {
        setCurrentMonth(new Date(year, month + delta, 1));
        setSelectedKey(null);
        setActiveEventId(null);
    };

    const goToday = () => {
        setCurrentMonth(new Date(todayYear, today.getMonth(), 1));
        setSelectedKey(todayKey);
        setActiveEventId(null);
    };

    const goToKey = (key) => {
        const d = keyToDate(key);
        setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        setSelectedKey(null);
        setActiveEventId(null);
    };

    const selectDay = (key) => {
        setActiveEventId(null);
        setSelectedKey((prev) => (prev === key ? null : key));
    };

    const toggleEvent = (id) => {
        setSelectedKey(null);
        setActiveEventId((prev) => (prev === id ? null : id));
    };

    const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const cells = [
        ...Array(startDayOfWeek).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    // what the list below the calendar shows
    const listItems = selectedKey
        ? monthEvents.filter(({ dates }) => dates.includes(selectedKey))
        : monthEvents;

    const listTitle = selectedKey
        ? keyToDate(selectedKey).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
        : `Events in ${currentMonth.toLocaleDateString("en-US", { month: "long" })}`;

    if (loading) {
        return (
            <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 h-6 w-40 rounded bg-slate-200" />
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="h-9 rounded-lg bg-slate-100" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <p className="text-sm font-medium text-slate-700">Couldn't load events.</p>
                <button
                    onClick={loadEvents}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                    <RotateCw size={12} /> Try again
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-[#106A2E]" />
                    <h3 className="text-sm font-semibold text-slate-800">{monthName}</h3>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={goToday}
                        className="mr-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Today
                    </button>
                    <button onClick={() => changeMonth(-1)} aria-label="Previous month" className="rounded-lg p-1.5 transition hover:bg-slate-100">
                        <ChevronLeft size={16} className="text-slate-600" />
                    </button>
                    <button onClick={() => changeMonth(1)} aria-label="Next month" className="rounded-lg p-1.5 transition hover:bg-slate-100">
                        <ChevronRight size={16} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Category filter (only when there is more than one category) */}
            {tags.length > 1 && (
                <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by category">
                    {["ALL", ...tags].map((t) => {
                        const on = activeFilter === t;
                        return (
                            <button
                                key={t}
                                onClick={() => {
                                    setTagFilter(t);
                                    setActiveEventId(null);
                                }}
                                aria-pressed={on}
                                className={[
                                    "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]",
                                    on
                                        ? "border-[#106A2E] bg-[#106A2E] text-white"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                                ].join(" ")}
                            >
                                {t === "ALL" ? "All" : tagLabel(t)}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Weekdays */}
            <div className="mb-1 grid grid-cols-7">
                {WEEKDAYS.map((d) => (
                    <div key={d} className="py-1 text-center text-[11px] font-medium text-slate-400">
                        {d}
                    </div>
                ))}
            </div>

            {/* Days */}
            <div className="mb-2 grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                    if (d === null) return <div key={`e${i}`} />;
                    const key = toKey(year, month, d);
                    const dayEvents = eventsByKey[key] || [];
                    const hasEvents = dayEvents.length > 0;
                    const noClass = dayEvents.some(isNoClass);
                    const isToday = key === todayKey;
                    const isSelected = key === selectedKey;
                    const isActive = activeDates.has(key);

                    const label = hasEvents
                        ? `${key}, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}: ${dayEvents.map((e) => e.title).join(", ")}${noClass ? " (no classes)" : ""}`
                        : key;

                    return (
                        <button
                            key={key}
                            onClick={() => selectDay(key)}
                            aria-label={label}
                            aria-pressed={isSelected}
                            title={hasEvents ? dayEvents.map((e) => e.title).join("\n") : undefined}
                            className={[
                                "relative flex h-9 items-center justify-center rounded-lg text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]",
                                isSelected
                                    ? "bg-[#106A2E] font-semibold text-white"
                                    : isActive
                                    ? "bg-emerald-100 font-semibold text-[#0E3B22] ring-2 ring-[#106A2E]"
                                    : noClass
                                    ? "bg-rose-50 font-semibold text-rose-700 hover:bg-rose-100"
                                    : hasEvents
                                    ? "bg-slate-50 font-semibold text-slate-800 hover:bg-emerald-50"
                                    : "text-slate-500 hover:bg-slate-50",
                                isToday && !isSelected ? "ring-1 ring-[#106A2E]" : "",
                            ].join(" ")}
                        >
                            {d}
                            {hasEvents && (
                                <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                                    {dayEvents.slice(0, 3).map((ev, idx) => (
                                        <span
                                            key={idx}
                                            className="h-1 w-1 rounded-full ring-1 ring-white"
                                            style={{ background: ev.accent || "#F4D35E" }}
                                        />
                                    ))}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-rose-100 ring-1 ring-rose-200" /> No classes
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-slate-100 ring-1 ring-slate-200" /> Has event
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded ring-1 ring-[#106A2E]" /> Today
                </span>
            </div>

            {/* List */}
            <div className="border-t border-slate-100 pt-3">
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">{listTitle}</p>
                    {(selectedKey || activeEventId) && (
                        <button
                            onClick={() => { setSelectedKey(null); setActiveEventId(null); }}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100"
                        >
                            <X size={11} /> Show all
                        </button>
                    )}
                </div>

                {listItems.length === 0 ? (
                    <div className="py-3 text-center">
                        <p className="text-xs text-slate-400">
                            {selectedKey ? "No events on this day." : "No events this month."}
                        </p>
                        {!selectedKey && nextEvent && (
                            <button
                                onClick={() => goToKey(nextEvent.next)}
                                className="mt-2 inline-flex max-w-full items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                <span className="truncate">Next: {nextEvent.ev.title} · {formatDates([nextEvent.next], todayYear)}</span>
                                <ChevronRight size={12} className="shrink-0" />
                            </button>
                        )}
                    </div>
                ) : (
                    <ul className="space-y-1.5">
                        {listItems.map(({ ev, dates }) => {
                            const isActive = activeEventId === ev.id;
                            const isPast = dates[dates.length - 1] < todayKey;
                            const isOngoing = !isPast && dates[0] <= todayKey && dates.includes(todayKey);
                            const noClass = isNoClass(ev);
                            const time = timeRange(ev);
                            return (
                                <li key={ev.id}>
                                    <button
                                        onClick={() => toggleEvent(ev.id)}
                                        aria-pressed={isActive}
                                        className={[
                                            "flex w-full items-stretch gap-3 rounded-xl border p-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]",
                                            isActive ? "border-[#106A2E] bg-emerald-50/60" : "border-transparent hover:bg-slate-50",
                                            isPast ? "opacity-60" : "",
                                        ].join(" ")}
                                    >
                                        <span className="w-1 shrink-0 rounded-full" style={{ background: ev.accent || "#F4D35E" }} />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-start justify-between gap-2">
                                                <span className="block text-xs font-semibold text-slate-800">{ev.title}</span>
                                                <span className="flex shrink-0 items-center gap-1">
                                                    {isOngoing && (
                                                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#106A2E]">
                                                            Ongoing
                                                        </span>
                                                    )}
                                                    {noClass && (
                                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                                                            <Ban size={9} /> No classes
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                            <span className="mt-0.5 block text-[11px] text-slate-500">
                                                {selectedKey && dates.length === 1
                                                    ? tagLabel(ev.tag)
                                                    : `${formatDates(dates, todayYear)} · ${tagLabel(ev.tag)}`}
                                            </span>
                                            {(time || ev.location) && (
                                                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                                                    {time && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock size={11} /> {time}
                                                        </span>
                                                    )}
                                                    {ev.location && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin size={11} /> {ev.location}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                            {isActive && ev.description && (
                                                <span className="mt-1.5 block text-[11px] leading-relaxed text-slate-600">{ev.description}</span>
                                            )}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}