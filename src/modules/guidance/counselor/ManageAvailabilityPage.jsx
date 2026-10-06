import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

import { CardListSkeleton, Empty, ErrorBox, Note } from "../components/GuidanceStates";
import { ACCENTS, fieldClass } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";

const DAYS = [
    { idx: 1, label: "Monday" },
    { idx: 2, label: "Tuesday" },
    { idx: 3, label: "Wednesday" },
    { idx: 4, label: "Thursday" },
    { idx: 5, label: "Friday" },
];

// 7:00 AM - 8:00 PM in 30-minute steps. value = "HH:mm:ss"
const TIME_OPTIONS = [];
for (let h = 7; h <= 20; h++) {
    for (const m of ["00", "30"]) {
        if (h === 20 && m === "30") break;
        TIME_OPTIONS.push({
            value: `${String(h).padStart(2, "0")}:${m}:00`,
            label: `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`,
        });
    }
}

const fmt = (t) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export default function ManageAvailabilityPage() {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [addingDay, setAddingDay] = useState(null);
    const [start, setStart] = useState("09:00:00");
    const [end, setEnd] = useState("12:00:00");
    const [addError, setAddError] = useState("");
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async (signal) => {
        setError("");
        setLoading(true);
        try {
            setSlots(await guidanceApi.getMyAvailability(signal));
        } catch (e) {
            if (e?.name !== "AbortError") setError(e.message || "Could not load your schedule.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const c = new AbortController();
        load(c.signal);
        return () => c.abort();
    }, [load]);

    const add = async () => {
        setAddError("");
        if (end <= start) return setAddError("End time must be after start time.");
        setSaving(true);
        try {
            await guidanceApi.addAvailability({ dayOfWeek: addingDay, startTime: start, endTime: end });
            toast.success("Schedule block added.");
            setAddingDay(null);
            await load();
        } catch (e) {
            setAddError(e.message || "Could not add the block.");
        } finally {
            setSaving(false);
        }
    };

    const toggle = async (s) => {
        setBusyId(s.id);
        try {
            await guidanceApi.updateAvailability(s.id, { isActive: !s.isActive });
            setSlots((prev) => prev.map((x) => (x.id === s.id ? { ...x, isActive: !x.isActive } : x)));
            toast.success(s.isActive ? "Block deactivated." : "Block activated.");
        } catch (e) {
            toast.error(e.message || "Could not update.");
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (s) => {
        if (!window.confirm("Remove this block? Students will no longer see it as available.")) return;
        setBusyId(s.id);
        try {
            await guidanceApi.deleteAvailability(s.id);
            setSlots((prev) => prev.filter((x) => x.id !== s.id));
            toast.success("Schedule block removed.");
        } catch (e) {
            toast.error(e.message || "Could not remove.");
        } finally {
            setBusyId(null);
        }
    };

    const activeDays = new Set(slots.filter((s) => s.isActive).map((s) => s.dayOfWeek)).size;

    const dayIsOn = (idx) => slots.some((s) => s.dayOfWeek === idx && s.isActive);

    return (
        <main className="space-y-3 p-4">
            {/* SUMMARY */}
            <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${ACCENTS.green.gradient} p-4 text-white shadow-sm`}>
                <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />

                <div className="relative flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                        <CalendarClock size={20} aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-semibold">
                            {activeDays} active day{activeDays === 1 ? "" : "s"}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-white/80">
                            Students book 30-minute slots inside these blocks, Monday to Friday.
                        </p>
                    </div>
                </div>

                <div className="relative mt-3 flex gap-1.5" aria-hidden="true">
                    {DAYS.map(({ idx, label }) => (
                        <span
                            key={idx}
                            className={`flex-1 rounded-lg py-1 text-center text-[10px] font-bold ${
                                dayIsOn(idx) ? "bg-white text-[#106A2E]" : "bg-white/15 text-white/70"
                            }`}
                        >
                            {label.slice(0, 3)}
                        </span>
                    ))}
                </div>
            </section>

            {loading && slots.length === 0 && <CardListSkeleton rows={3} label="Loading schedule..." />}
            {error && <ErrorBox message={error} onRetry={() => load()} />}
            {!loading && !error && slots.length === 0 && (
                <Empty
                    icon={CalendarClock}
                    title="No schedule yet"
                    note="Add a block under a day so students can book you."
                />
            )}

            {DAYS.map(({ idx, label }) => {
                const blocks = slots.filter((s) => s.dayOfWeek === idx);
                const adding = addingDay === idx;

                return (
                    <section
                        key={idx}
                        className={`rounded-2xl border bg-white p-4 shadow-sm ${
                            dayIsOn(idx) ? "border-green-200" : "border-black/[0.05]"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-sm font-bold text-slate-700">{label}</h2>
                                <p className="text-[11px] text-slate-400">
                                    {blocks.length === 0 ? "Not available" : `${blocks.length} block${blocks.length === 1 ? "" : "s"}`}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => { setAddingDay(adding ? null : idx); setAddError(""); }}
                                aria-expanded={adding}
                                className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-[#106A2E] transition active:scale-95"
                            >
                                <Plus size={13} aria-hidden="true" /> Add
                            </button>
                        </div>

                        {blocks.map((s) => (
                            <div key={s.id} className="mt-2.5 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                <p className={`flex-1 text-sm font-semibold ${s.isActive ? "text-slate-800" : "text-slate-400 line-through"}`}>
                                    {fmt(s.startTime)} – {fmt(s.endTime)}
                                </p>

                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={s.isActive}
                                    aria-label={s.isActive ? "Deactivate block" : "Activate block"}
                                    disabled={busyId === s.id}
                                    onClick={() => toggle(s)}
                                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${s.isActive ? "bg-[#106A2E]" : "bg-slate-300"}`}
                                >
                                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.isActive ? "left-[22px]" : "left-0.5"}`} />
                                </button>

                                <button
                                    type="button"
                                    disabled={busyId === s.id}
                                    onClick={() => remove(s)}
                                    aria-label="Remove block"
                                    className="rounded-full p-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-60"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}

                        {adding && (
                            <div className="mt-3 space-y-3 rounded-xl border border-green-200 bg-green-50/50 p-3">
                                <div className="flex gap-2">
                                    <label className="flex-1 text-[11px] font-semibold text-slate-500">
                                        From
                                        <select value={start} onChange={(e) => setStart(e.target.value)} className={fieldClass("green")}>
                                            {TIME_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </label>

                                    <label className="flex-1 text-[11px] font-semibold text-slate-500">
                                        To
                                        <select value={end} onChange={(e) => setEnd(e.target.value)} className={fieldClass("green")}>
                                            {TIME_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </label>
                                </div>

                                {addError && <Note tone="error">{addError}</Note>}

                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setAddingDay(null)} className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 transition active:scale-95">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={add} disabled={saving} className="flex-1 rounded-lg bg-[#106A2E] py-2 text-xs font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-60">
                                        {saving ? "Saving…" : "Save block"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                );
            })}
        </main>
    );
}