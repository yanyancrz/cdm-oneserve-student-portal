import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import { ErrorBox, Note, Skeleton } from "../components/GuidanceStates";
import { ACCENTS, StepLabel, fieldClass } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";
import { formatYMD, isPastSlot, todayISO } from "../utils/dateTime";

// Bottom sheet: counselor moves an appointment to another of THEIR real slots.
// Slots come from the same server rule the student booking uses.
export default function RescheduleSheet({ appointment, onClose, onDone }) {
    const [date, setDate] = useState("");
    const [slot, setSlot] = useState("");
    const [reason, setReason] = useState("");
    const [instructions, setInstructions] = useState("");

    const [day, setDay] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotError, setSlotError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!date) {
            setDay(null);
            return undefined;
        }
        const c = new AbortController();
        setLoadingSlots(true);
        setSlotError("");
        setSlot("");
        guidanceApi
            .getRescheduleAvailability(appointment.id, date, c.signal)
            .then(setDay)
            .catch((e) => {
                if (e?.name === "AbortError") return;
                setDay(null);
                setSlotError(e.message || "Could not load times.");
            })
            .finally(() => setLoadingSlots(false));
        return () => c.abort();
    }, [date, appointment.id]);

    const submit = async () => {
        setError("");
        if (!date) return setError("Choose a new date.");
        if (!slot) return setError("Choose a new time.");
        if (reason.trim().length < 5) return setError("Please give a reason (at least 5 characters).");

        setSubmitting(true);
        try {
            await guidanceApi.rescheduleAppointment(appointment.id, {
                date, timeSlot: slot, reason: reason.trim(), instructions: instructions.trim(),
            });
            onDone();
        } catch (e) {
            setError(e.message || "Reschedule failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const free = day ? day.availableSlots.filter((s) => !isPastSlot(date, s)) : [];

    // The nav is a fixed pill (bottom-3 + ~70px tall), so the sheet is lifted
    // clear of it. Without this the last button sits under the pill and cannot
    // be tapped.
    return (
        <div
            className="fixed inset-0 z-50 flex items-end bg-black/40"
            style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Reschedule appointment"
                className="mx-auto max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl"
                style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-slate-200" />

                <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-slate-800">Reschedule</h2>
                        <p className="truncate text-xs text-slate-500">
                            {appointment.studentName} · now {formatYMD(appointment.date)} · {appointment.timeSlot}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div>
                    <StepLabel n={1}>New date</StepLabel>

                    <input
                        type="date"
                        aria-label="New date"
                        min={todayISO()}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={fieldClass("green")}
                    />
                </div>

                <div>
                    <StepLabel n={2}>New time</StepLabel>

                    <div className="mt-2">
                        {!date ? (
                            <p className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-400">
                                Pick a date to see your open times.
                            </p>
                        ) : loadingSlots ? (
                            <div role="status" aria-busy="true" className="grid grid-cols-3 gap-2">
                                <span className="sr-only">Checking your schedule...</span>
                                {Array.from({ length: 6 }, (_, n) => (
                                    <Skeleton key={n} className="h-10 rounded-xl" />
                                ))}
                            </div>
                        ) : slotError ? (
                            <ErrorBox message={slotError} />
                        ) : day?.offDay ? (
                            <Note>You have no availability on that day.</Note>
                        ) : day?.studentBusy ? (
                            <Note tone="error">This student already has another appointment on that date.</Note>
                        ) : day && free.length === 0 ? (
                            <Note tone="error">No open times left on that date.</Note>
                        ) : day ? (
                            <div className="grid grid-cols-3 gap-2">
                                {day.allSlots.map((s) => {
                                    const open = free.includes(s);
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            disabled={!open}
                                            aria-pressed={slot === s}
                                            onClick={() => setSlot(s)}
                                            className={`rounded-xl border px-1 py-2.5 text-xs font-semibold transition active:scale-95 ${
                                                slot === s
                                                    ? ACCENTS.green.slotOn
                                                    : open
                                                      ? "border-slate-200 text-slate-700 hover:border-[#106A2E]/50"
                                                      : "border-slate-100 bg-slate-50 text-slate-300"
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div>
                    <StepLabel n={3} hint="the student will see this">Reason</StepLabel>

                    <textarea
                        rows={2}
                        maxLength={500}
                        aria-label="Reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className={`${fieldClass("green")} resize-none`}
                    />
                </div>

                <div>
                    <StepLabel n={4} hint="optional">Additional instructions</StepLabel>

                    <textarea
                        rows={2}
                        maxLength={1000}
                        aria-label="Additional instructions (optional)"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className={`${fieldClass("green")} resize-none`}
                    />
                </div>

                {appointment.status === "Pending" && (
                    <Note>This request is still pending. Rescheduling will also confirm it for the new time.</Note>
                )}
                {error && <Note tone="error">{error}</Note>}

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition active:scale-[0.99]"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={submit}
                        disabled={submitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#106A2E] py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
                    >
                        {submitting && <Loader2 className="animate-spin" size={16} aria-hidden="true" />}
                        {submitting ? "Saving…" : "Reschedule"}
                    </button>
                </div>
            </div>
        </div>
    );
}