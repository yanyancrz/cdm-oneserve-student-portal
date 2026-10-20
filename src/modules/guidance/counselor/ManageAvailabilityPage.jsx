import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, CalendarX2, Plus, Trash2 } from "lucide-react";

import { CardListSkeleton, Empty, ErrorBox, Note } from "../components/GuidanceStates";
import { ACCENTS, fieldClass } from "../components/GuidanceUi";
import MonthCalendar from "../components/MonthCalendar";
import { guidanceApi } from "../services/guidanceApi";
import { todayISO } from "../utils/dateTime";
import { getPHHolidays } from "../utils/phHolidays";
import RescheduleSheet from "./RescheduleSheet";

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
    const [resettingDefault, setResettingDefault] = useState(false);

    // One-date day-offs (the weekly blocks repeat on their own, so next
    // week is automatically back to normal).
    const [dayOffs, setDayOffs] = useState([]);
    const [holidays, setHolidays] = useState({});
    const [dayOffDate, setDayOffDate] = useState("");
    const [dayOffReason, setDayOffReason] = useState("");
    const [affected, setAffected] = useState(null); // appointments on the picked date
    const [checkingDay, setCheckingDay] = useState(false);
    const [savingDayOff, setSavingDayOff] = useState(false);
    const [resched, setResched] = useState(null);

    // Default office schedule: Mon-Fri, 8:00 AM - 12:00 NN and
    // 1:00 PM - 5:00 PM. Lunch (12-1) is left with NO block, so it is
    // automatically unavailable for booking. PH holidays are handled
    // separately (see the calendar - holiday dates are blocked there).
    const resetToDefaultSchedule = async () => {
        if (
            !window.confirm(
                "Reset to the default schedule?\n\nMon–Fri: 8:00 AM – 12:00 NN and 1:00 PM – 5:00 PM.\nLunch (12–1) stays unavailable.\n\nThis replaces your current blocks."
            )
        )
            return;

        setResettingDefault(true);
        try {
            await guidanceApi.resetAvailabilityToDefault();
            toast.success("Default schedule restored: Mon–Fri, 8AM–12NN and 1PM–5PM.");
            await load();
        } catch (e) {
            toast.error(e.message || "Could not reset to default schedule.");
            await load();
        } finally {
            setResettingDefault(false);
        }
    };

    const load = useCallback(async (signal) => {
        setError("");
        setLoading(true);
        try {
            const [blocks, offs] = await Promise.all([
                guidanceApi.getMyAvailability(signal),
                guidanceApi.getDayOffs(signal).catch(() => []),
            ]);
            setSlots(blocks);
            setDayOffs(offs);
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

    // PH holidays (server-cached, one call per year). Shown as unavailable on
    // the calendar below so the counselor sees exactly what students see.
    useEffect(() => {
        const c = new AbortController();
        const year = new Date().getFullYear();
        Promise.allSettled([getPHHolidays(year, c.signal), getPHHolidays(year + 1, c.signal)]).then(([a, b]) => {
            if (c.signal.aborted) return;
            setHolidays({
                ...(a.status === "fulfilled" ? a.value : {}),
                ...(b.status === "fulfilled" ? b.value : {}),
            });
        });
        return () => c.abort();
    }, []);

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

    const remove = async (s) => {
        if (!window.confirm("Remove this block? Students will no longer see it as available.")) return;
        try {
            await guidanceApi.deleteAvailability(s.id);
            setSlots((prev) => prev.filter((x) => x.id !== s.id));
            toast.success("Schedule block removed.");
        } catch (e) {
            toast.error(e.message || "Could not remove.");
        }
    };

    // Who has an appointment on the picked day-off date? They must be
    // rescheduled first - setting the day off blocks NEW bookings, but
    // existing appointments stay until moved.
    const checkDay = async (dateArg) => {
        const target = dateArg || dayOffDate;
        if (!target) return toast.error("Pick a date first.");
        if (target < todayISO()) return toast.error("Cannot mark a past date as a day off.");
        setCheckingDay(true);
        try {
            const list = await guidanceApi.getCounselorAppointments({ date: target });
            setAffected(list.filter((a) => ["Pending", "Confirmed", "Arrived"].includes(a.status)));
        } catch (e) {
            toast.error(e.message || "Could not check that date.");
        } finally {
            setCheckingDay(false);
        }
    };

    // Calendar click: remember the date and immediately see who is booked.
    const selectDayOff = (iso) => {
        setDayOffDate(iso);
        setAffected(null);
        checkDay(iso);
    };

    const saveDayOff = async () => {
        if (!dayOffDate) return toast.error("Pick a date first.");
        setSavingDayOff(true);
        try {
            const r = await guidanceApi.addDayOff({ date: dayOffDate, reason: dayOffReason.trim() || null });
            toast.success(r.message || "Day off saved.");
            setDayOffDate("");
            setDayOffReason("");
            setAffected(null);
            await load();
        } catch (e) {
            toast.error(e.message || "Could not save the day off.");
        } finally {
            setSavingDayOff(false);
        }
    };

    const removeDayOff = async (d) => {
        if (!window.confirm(`Remove the day off on ${d.date}? The date follows the weekly schedule again.`)) return;
        try {
            await guidanceApi.deleteDayOff(d.id);
            toast.success("Day off removed.");
            await load();
        } catch (e) {
            toast.error(e.message || "Could not remove.");
        }
    };

    const activeDays = new Set(slots.map((s) => s.dayOfWeek)).size;

    const dayIsOn = (idx) => slots.some((s) => s.dayOfWeek === idx);

    const dayOffByDate = {};
    for (const d of dayOffs) dayOffByDate[d.date] = d;

    // What the calendar cell should show for a date: an existing day off
    // (amber, with the reason), a PH holiday (red), a weekend, or nothing.
    const dayOffDateInfo = (iso) => {
        const off = dayOffByDate[iso];
        if (off) return { leave: off.reason || "On leave", disabled: true, disabledReason: "Already marked as a day off" };
        if (holidays[iso]) return { holiday: holidays[iso], disabled: true, disabledReason: `Holiday: ${holidays[iso]}` };

        const [yy, mm, dd] = iso.split("-").map(Number);
        const dow = new Date(yy, mm - 1, dd).getDay();
        if (dow === 0 || dow === 6) return { weekend: true, disabled: true, disabledReason: "Weekend" };

        return {};
    };

    return (
        <main className="space-y-3 p-4">
            {/* SUMMARY */}
            <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${ACCENTS.green.gradient} p-4 text-white shadow-sm`}>
                <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />

                <div className="relative flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                        <CalendarClock size={20} aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                            {activeDays} day{activeDays === 1 ? "" : "s"} available
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-white/80">
                            Students book 30-minute slots inside these blocks, Monday to Friday.
                            Lunch (12–1 PM), PH holidays and any day off you set are unavailable.
                            Default hours are Mon-Fri 8-12 and 1-5. For one-time leave, use Day off below.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={resetToDefaultSchedule}
                    disabled={resettingDefault}
                    className="relative mt-3 w-full rounded-xl bg-white/15 py-2.5 text-xs font-bold text-white transition hover:bg-white/25 active:scale-[0.99] disabled:opacity-60"
                >
                    {resettingDefault ? "Resetting…" : "Reset to default schedule"}
                </button>

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
                    title="No schedule"
                    note="Add a block under a day, or reset to the default."
                />
            )}

            {DAYS.map(({ idx, label }) => {
                const blocks = slots.filter((s) => s.dayOfWeek === idx);
                const adding = addingDay === idx;

                return (
                    <section
                        key={idx}
                        className={`rounded-2xl border bg-white p-4 shadow-sm ${
                            blocks.length > 0 ? "border-green-200" : "border-black/[0.05]"
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
                                <p className="flex-1 text-sm font-semibold text-slate-800">
                                    {fmt(s.startTime)} – {fmt(s.endTime)}
                                </p>

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

                                <p className="text-[11px] text-slate-400">Each session is 30 minutes.</p>

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

            {/* ---------- DAY-OFFS: one date only, weekly schedule auto-repeats ---------- */}
            <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <CalendarX2 size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-bold text-slate-700">Day off (one date)</h2>
                        <p className="text-[11px] text-slate-400">
                            Pick a date to close it for bookings. Next week is automatically back to the
                            weekly schedule, and your reason is shown to students.
                        </p>
                    </div>
                </div>

                <div className="mt-3">
                    <MonthCalendar
                        value={dayOffDate}
                        onSelect={selectDayOff}
                        minDate={todayISO()}
                        dayInfo={dayOffDateInfo}
                    />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400" /> Day off / leave
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-400" /> Holiday - unavailable
                    </span>
                    {checkingDay && <span className="font-semibold text-[#106A2E]">Checking {dayOffDate}…</span>}
                </div>

                {dayOffDate && (
                    <input
                        aria-label="Day-off reason (optional)"
                        value={dayOffReason}
                        onChange={(e) => setDayOffReason(e.target.value)}
                        placeholder="Reason (optional, e.g. seminar) - students will see this"
                        maxLength={200}
                        className={`${fieldClass("green")} mt-2`}
                    />
                )}

                {affected !== null && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                        {affected.length === 0 ? (
                            <p className="text-xs text-slate-500">
                                No appointments on {dayOffDate}. Safe to mark unavailable.
                            </p>
                        ) : (
                            <>
                                <p className="text-xs font-bold text-amber-800">
                                    {affected.length} appointment{affected.length === 1 ? "" : "s"} on {dayOffDate} - reschedule them first:
                                </p>
                                <ul className="mt-2 space-y-2">
                                    {affected.map((a) => (
                                        <li key={a.id} className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold text-slate-700">
                                                    {a.studentName} · {a.timeSlot}
                                                </p>
                                                <p className="truncate text-[11px] text-slate-400">
                                                    {a.status}{a.concernType ? ` · ${a.concernType}` : ""}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setResched(a)}
                                                className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition active:scale-95"
                                            >
                                                Reschedule
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={saveDayOff}
                            disabled={savingDayOff}
                            className="mt-3 w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
                        >
                            {savingDayOff ? "Saving…" : `Mark ${dayOffDate} unavailable`}
                        </button>
                    </div>
                )}

                {dayOffs.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                        {dayOffs.map((d) => (
                            <li key={d.id} className="flex items-center gap-2 rounded-xl bg-red-50/60 px-3 py-2">
                                <p className="min-w-0 flex-1 text-xs font-semibold text-slate-700">
                                    {d.date}
                                    {d.reason && <span className="font-normal text-slate-500"> · {d.reason}</span>}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => removeDayOff(d)}
                                    aria-label={`Remove day off on ${d.date}`}
                                    className="rounded-full p-1.5 text-red-500 transition hover:bg-red-100"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {resched && (
                <RescheduleSheet
                    appointment={resched}
                    onClose={() => setResched(null)}
                    onDone={() => {
                        setResched(null);
                        toast.success("Appointment rescheduled.");
                        if (dayOffDate) checkDay();
                        load();
                    }}
                />
            )}
        </main>
    );
}