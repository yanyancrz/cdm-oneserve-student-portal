import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

// Simple event calendar widget for the dashboard
export default function EventCalendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const response = await fetch(`${API_URL}/api/events`);
                if (response.ok) {
                    const data = await response.json();
                    setEvents(data);
                }
            } catch (error) {
                console.error("Failed to load events:", error);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, []);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const eventsByDay = {};
    events.forEach((ev) => {
        const dates = Array.isArray(ev.eventDates) && ev.eventDates.length > 0
            ? ev.eventDates
            : (ev.eventDate ? [ev.eventDate] : []);
        dates.forEach((dateStr) => {
            const d = new Date(dateStr);
            if (d.getMonth() === month && d.getFullYear() === year) {
                const day = d.getDate();
                if (!eventsByDay[day]) eventsByDay[day] = [];
                eventsByDay[day].push(ev);
            }
        });
    });

    const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(d);
    }

    const today = new Date();
    const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const monthEvents = events
        .filter((ev) => {
            const dates = Array.isArray(ev.eventDates) && ev.eventDates.length > 0
                ? ev.eventDates
                : (ev.eventDate ? [ev.eventDate] : []);
            return dates.some((dateStr) => {
                const d = new Date(dateStr);
                return d.getMonth() === month && d.getFullYear() === year;
            });
        })
        .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    if (loading) {
        return (
            <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
                <div className="h-6 w-32 bg-slate-200 rounded mb-3" />
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="h-8 bg-slate-200 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-[#106A2E]" />
                    <h3 className="text-sm font-semibold text-slate-800">Event Calendar</h3>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-slate-100 transition">
                        <ChevronLeft size={16} className="text-slate-600" />
                    </button>
                    <span className="text-xs font-medium text-slate-700 min-w-[120px] text-center">{monthName}</span>
                    <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-slate-100 transition">
                        <ChevronRight size={16} className="text-slate-600" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 mb-3">
                {days.map((d, i) => (
                    <div
                        key={i}
                        className={`relative h-8 flex items-center justify-center rounded-lg text-xs font-medium transition ${
                            d === null
                                ? ""
                                : isToday(d)
                                ? "bg-[#106A2E] text-white"
                                : eventsByDay[d]
                                ? "bg-amber-100 text-amber-800 cursor-pointer hover:bg-amber-200"
                                : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        {d}
                        {eventsByDay[d] && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-500" />
                        )}
                    </div>
                ))}
            </div>

            {monthEvents.length > 0 ? (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                    {monthEvents.map((ev) => (
                        <div key={ev.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition">
                            <div
                                className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ background: ev.accent || "#F4D35E" }}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 truncate">
                                    {ev.title}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                    {new Date(ev.eventDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                    {ev.startTime ? ` · ${ev.startTime}` : ""}
                                    {ev.endTime ? `–${ev.endTime}` : ""}
                                    {ev.location ? ` · ${ev.location}` : ""}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-slate-400 text-center py-2">No events this month</p>
            )}
        </div>
    );
}
