import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, X, RotateCw } from "lucide-react";

/* ---------- date helpers (local time, no timezone shifting) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const cleanKey = (v) => String(v).slice(0, 10); // "2026-10-05T00:00:00Z" -> "2026-10-05"
const keyToDate = (k) => {
    const [y, m, d] = cleanKey(k).split("-").map(Number);
    return new Date(y, m - 1, d);
};
const dateToKey = (dt) => toKey(dt.getFullYear(), dt.getMonth(), dt.getDate());

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
    const todayKey = dateToKey(new Date());

    const withDates = useMemo(
        () => events.map((ev) => ({ ev, dates: getEventDates(ev) })).filter((x) => x.dates.length > 0),
        [events]
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

    // events in the visible month, each with only its dates in this month
    const monthEvents = useMemo(
        () =>
            withDates
                .map(({ ev, dates }) => ({ ev, dates: dates.filter((k) => k.startsWith(monthPrefix)) }))
                .filter((x) => x.dates.length > 0)
                .sort((a, b) => a.dates[0].localeCompare(b.dates[0])),
        [withDates, monthPrefix]
    );

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
        const n = new Date();
        setCurrentMonth(new Date(n.getFullYear(), n.getMonth(), 1));
        setSelectedKey(todayKey);
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

    const compactDays = (dates) => {
        const mon = currentMonth.toLocaleDateString("en-US", { month: "short" });
        return `${mon} ${dates.map((k) => Number(k.slice(8, 10))).join(", ")}`;
    };

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

            {/* Weekdays */}
            <div className="mb-1 grid grid-cols-7">
                {WEEKDAYS.map((d) => (
                    <div key={d} className="py-1 text-center text-[11px] font-medium text-slate-400">
                        {d}
                    </div>
                ))}
            </div>

            {/* Days */}
            <div className="mb-4 grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                    if (d === null) return <div key={`e${i}`} />;
                    const key = toKey(year, month, d);
                    const dayEvents = eventsByKey[key] || [];
                    const hasEvents = dayEvents.length > 0;
                    const isToday = key === todayKey;
                    const isSelected = key === selectedKey;
                    const isActive = activeDates.has(key);

                    const label = hasEvents
                        ? `${key}, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}: ${dayEvents.map((e) => e.title).join(", ")}`
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
                    <p className="py-3 text-center text-xs text-slate-400">
                        {selectedKey ? "No events on this day." : "No events this month."}
                    </p>
                ) : (
                    <ul className="space-y-1.5">
                        {listItems.map(({ ev, dates }) => {
                            const isActive = activeEventId === ev.id;
                            const isPast = dates[dates.length - 1] < todayKey;
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
                                            <span className="block truncate text-xs font-semibold text-slate-800">{ev.title}</span>
                                            <span className="mt-0.5 block text-[11px] text-slate-500">
                                                {selectedKey ? "" : `${compactDays(dates)}`}
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