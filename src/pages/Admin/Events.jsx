import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import { CalendarDays, Plus, Trash2, X, Pencil, ChevronLeft, ChevronRight, Clock } from "lucide-react";

const API_BASE = `${API_URL}/api/admin/events`;
const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("authToken")}`,
});

const EMPTY_FORM = {
    title: "",
    description: "",
    dates: [], // array of "YYYY-MM-DD"
    startTime: "",
    endTime: "",
    location: "",
    tag: "CAMPUS",
    accent: "#F4D35E",
};

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-emerald-100";

/* ---------- date helpers (local time, avoids timezone shifting) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const keyToDate = (k) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d);
};
const dateToKey = (dt) => toKey(dt.getFullYear(), dt.getMonth(), dt.getDate());

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const formatShort = (k) =>
    keyToDate(k).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${pad(m)} ${ap}`;
};

// Expands eventDate..endDate into a list of days (fallback for old events without eventDates)
const expandRange = (start, end) => {
    const out = [];
    const s = keyToDate(start);
    const e = keyToDate(end);
    for (let d = new Date(s), i = 0; d <= e && i < 366; d.setDate(d.getDate() + 1), i++) {
        out.push(dateToKey(d));
    }
    return out;
};

/* ---------- Multi-date calendar ---------- */
function MultiDatePicker({ value, onChange }) {
    const initial = value.length ? keyToDate([...value].sort()[0]) : new Date();
    const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });

    const selected = useMemo(() => new Set(value), [value]);
    const todayKey = dateToKey(new Date());

    const firstDay = new Date(view.y, view.m, 1).getDay();
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const cells = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const shiftMonth = (delta) => {
        const d = new Date(view.y, view.m + delta, 1);
        setView({ y: d.getFullYear(), m: d.getMonth() });
    };

    const toggle = (day) => {
        const k = toKey(view.y, view.m, day);
        const next = new Set(selected);
        next.has(k) ? next.delete(k) : next.add(k);
        onChange([...next].sort());
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
                <button type="button" onClick={() => shiftMonth(-1)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Previous month">
                    <ChevronLeft size={16} className="text-slate-600" />
                </button>
                <p className="text-sm font-semibold text-slate-800">
                    {MONTHS[view.m]} {view.y}
                </p>
                <button type="button" onClick={() => shiftMonth(1)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Next month">
                    <ChevronRight size={16} className="text-slate-600" />
                </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-medium text-slate-400">
                {WEEKDAYS.map((w) => (
                    <div key={w} className="py-1">{w}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
                {cells.map((day, i) => {
                    if (!day) return <div key={`e${i}`} />;
                    const k = toKey(view.y, view.m, day);
                    const isSel = selected.has(k);
                    const isToday = k === todayKey;
                    return (
                        <button
                            key={k}
                            type="button"
                            onClick={() => toggle(day)}
                            aria-pressed={isSel}
                            className={[
                                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                                isSel
                                    ? "bg-[#106A2E] font-semibold text-white"
                                    : "text-slate-700 hover:bg-emerald-50",
                                isToday && !isSel ? "ring-1 ring-[#106A2E]" : "",
                            ].join(" ")}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            <div className="mt-3 border-t border-slate-100 pt-2">
                {value.length === 0 ? (
                    <p className="text-xs text-slate-400">Click one or more dates on the calendar.</p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {value.map((k) => (
                            <span key={k} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 py-1 pl-2.5 pr-1.5 text-xs text-[#0E3B22]">
                                {formatShort(k)}
                                <button
                                    type="button"
                                    onClick={() => onChange(value.filter((v) => v !== k))}
                                    className="rounded-full p-0.5 hover:bg-emerald-100"
                                    aria-label={`Remove ${formatShort(k)}`}
                                >
                                    <X size={11} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const loadEvents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(API_BASE, { headers: authHeaders() });
            if (!res.ok) throw new Error("Failed to load events");
            const data = await res.json();
            setEvents(Array.isArray(data) ? data : []);
        } catch (e) {
            toast.error(e.message || "Failed to load events");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
    };

    const openEdit = (ev) => {
        let dates = [];
        if (Array.isArray(ev.eventDates) && ev.eventDates.length) {
            dates = ev.eventDates.map((d) => String(d).slice(0, 10));
        } else if (ev.eventDate) {
            const start = ev.eventDate.slice(0, 10);
            const end = ev.endDate ? ev.endDate.slice(0, 10) : start;
            dates = expandRange(start, end);
        }
        setForm({
            title: ev.title || "",
            description: ev.description || "",
            dates: [...new Set(dates)].sort(),
            startTime: ev.startTime ? ev.startTime.slice(0, 5) : "",
            endTime: ev.endTime ? ev.endTime.slice(0, 5) : "",
            location: ev.location || "",
            tag: ev.tag || "CAMPUS",
            accent: ev.accent || "#F4D35E",
        });
        setEditingId(ev.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || form.dates.length === 0) {
            toast.error("Title and at least one event date are required.");
            return;
        }
        if (form.startTime && form.endTime && form.endTime <= form.startTime) {
            toast.error("End time must be later than start time.");
            return;
        }
        setSaving(true);
        try {
            const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
            const method = editingId ? "PUT" : "POST";
            const sorted = [...form.dates].sort();
            const body = {
                title: form.title.trim(),
                description: form.description || null,
                // kept for backward compatibility with the existing backend
                eventDate: sorted[0],
                endDate: sorted.length > 1 ? sorted[sorted.length - 1] : null,
                // new fields
                eventDates: sorted,
                startTime: form.startTime || null,
                endTime: form.endTime || null,
                location: form.location || null,
                tag: form.tag,
                accent: form.accent,
            };
            if (editingId) body.isActive = true;
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.message || "Failed to save event");
            }
            toast.success(editingId ? "Event updated." : "Event created.");
            resetForm();
            await loadEvents();
        } catch (err) {
            toast.error(err.message || "Failed to save event");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this event?")) return;
        try {
            const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE", headers: authHeaders() });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Event deleted.");
            await loadEvents();
        } catch (err) {
            toast.error(err.message || "Failed to delete event");
        }
    };

    const formatDate = (d) => {
        if (!d) return "—";
        return formatShort(String(d).slice(0, 10));
    };

    const describeDates = (ev) => {
        if (Array.isArray(ev.eventDates) && ev.eventDates.length > 1) {
            const list = [...ev.eventDates].map((d) => String(d).slice(0, 10)).sort();
            return list.length <= 3 ? list.map(formatShort).join(", ") : `${formatShort(list[0])} +${list.length - 1} more dates`;
        }
        if (Array.isArray(ev.eventDates) && ev.eventDates.length === 1) return formatShort(String(ev.eventDates[0]).slice(0, 10));
        if (ev.endDate && ev.endDate.slice(0, 10) !== ev.eventDate?.slice(0, 10)) {
            return `${formatDate(ev.eventDate)} – ${formatDate(ev.endDate)}`;
        }
        return formatDate(ev.eventDate);
    };

    const describeTime = (ev) => {
        if (!ev.startTime) return "";
        const s = formatTime(ev.startTime.slice(0, 5));
        return ev.endTime ? `${s} – ${formatTime(ev.endTime.slice(0, 5))}` : s;
    };

    return (
        <div className="min-h-screen bg-[#F7F5EF] p-4 pb-24 md:pt-24">
            <div className="mx-auto max-w-4xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={20} className="text-[#106A2E]" />
                        <h1 className="text-lg font-semibold text-slate-800">Event Calendar</h1>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-900/20 transition hover:opacity-90"
                    >
                        <Plus size={14} /> New Event
                    </button>
                </div>

                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Edit Event" : "New Event"}</h2>
                                <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-slate-100">
                                    <X size={18} className="text-slate-500" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={3} />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Event Dates * (select one or more)</label>
                                    <MultiDatePicker value={form.dates} onChange={(dates) => setForm({ ...form, dates })} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                                            <Clock size={12} /> Start Time
                                        </label>
                                        <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                                            <Clock size={12} /> End Time (optional)
                                        </label>
                                        <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={inputClass} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
                                    <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Tag</label>
                                        <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className={inputClass}>
                                            <option value="CAMPUS">Campus</option>
                                            <option value="LIBRARY">Library</option>
                                            <option value="GUIDANCE">Guidance</option>
                                            <option value="LOSTFOUND">Lost & Found</option>
                                            <option value="CLINIC">Clinic</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Accent Color</label>
                                        <input type="color" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 cursor-pointer" />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={resetForm} className="flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                                    <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] p-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 hover:opacity-90 disabled:opacity-60">
                                        {saving ? "Saving..." : (editingId ? "Update" : "Create")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-10 text-slate-400">Loading events...</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">No events yet. Click "New Event" to create one.</div>
                ) : (
                    <div className="space-y-3">
                        {events.map((ev) => (
                            <div key={ev.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-start gap-3">
                                <div className="mt-1 h-3 w-3 rounded-full shrink-0" style={{ background: ev.accent || "#F4D35E" }} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-800">{ev.title}</p>
                                    {ev.description && <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>}
                                    <p className="text-xs text-slate-400 mt-1">
                                        {describeDates(ev)}
                                        {describeTime(ev) ? ` · ${describeTime(ev)}` : ""}
                                        {ev.location ? ` · ${ev.location}` : ""}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}