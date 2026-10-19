import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import { CalendarDays, Plus, Trash2, X, Pencil } from "lucide-react";

const API_BASE = `${API_URL}/api/admin/events`;
const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("authToken")}`,
});

const EMPTY_FORM = {
    title: "",
    description: "",
    eventDate: "",
    endDate: "",
    location: "",
    tag: "CAMPUS",
    accent: "#F4D35E",
};

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-emerald-100";

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
        setForm({
            title: ev.title || "",
            description: ev.description || "",
            eventDate: ev.eventDate ? ev.eventDate.slice(0, 16) : "",
            endDate: ev.endDate ? ev.endDate.slice(0, 16) : "",
            location: ev.location || "",
            tag: ev.tag || "CAMPUS",
            accent: ev.accent || "#F4D35E",
        });
        setEditingId(ev.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.eventDate) {
            toast.error("Title and event date are required.");
            return;
        }
        setSaving(true);
        try {
            const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
            const method = editingId ? "PUT" : "POST";
            const body = {
                title: form.title.trim(),
                description: form.description || null,
                eventDate: form.eventDate,
                endDate: form.endDate || null,
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
        return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
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
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Start Date/Time *</label>
                                        <input type="datetime-local" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">End Date/Time</label>
                                        <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
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
                                        {formatDate(ev.eventDate)}{ev.location ? ` · ${ev.location}` : ""}
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
