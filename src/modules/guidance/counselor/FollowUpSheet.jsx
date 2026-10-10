import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import { Note } from "../components/GuidanceStates";
import { StepLabel, fieldClass } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";
import { formatYMD, todayISO } from "../utils/dateTime";

// Bottom sheet: counselor requests a follow-up with this student.
// The student will accept or decline it from their My Appointments page.
export default function FollowUpSheet({ appointment, onClose, onDone }) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [recordId, setRecordId] = useState(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Link the follow-up to the session record if one already exists.
    useEffect(() => {
        const c = new AbortController();
        guidanceApi
            .getSessionRecord(appointment.id, c.signal)
            .then((record) => setRecordId(record?.id ?? null))
            .catch(() => {});
        return () => c.abort();
    }, [appointment.id]);

    const submit = async () => {
        setError("");
        if (!date) return setError("Choose a follow-up date.");
        if (!reason.trim()) return setError("Please give a reason for the follow-up.");

        setSubmitting(true);
        try {
            await guidanceApi.createFollowUp({
                studentId: appointment.studentId,
                recordId,
                followUpDate: date,
                followUpTime: time.trim() || null,
                reason: reason.trim(),
                notes: notes.trim() || null,
            });
            onDone();
        } catch (e) {
            setError(e.message || "Could not create the follow-up.");
        } finally {
            setSubmitting(false);
        }
    };

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
                aria-label="Request follow-up"
                className="mx-auto max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl"
                style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-slate-200" />

                <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-slate-800">Request follow-up</h2>
                        <p className="truncate text-xs text-slate-500">
                            {appointment.studentName} · last session {formatYMD(appointment.date)}
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
                    <StepLabel n={1}>Follow-up date</StepLabel>
                    <input
                        type="date"
                        aria-label="Follow-up date"
                        min={todayISO()}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={fieldClass("green")}
                    />
                </div>

                <div>
                    <StepLabel n={2} hint="optional">Preferred time</StepLabel>
                    <input
                        aria-label="Preferred time (optional)"
                        placeholder="e.g. 2:00 PM"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className={fieldClass("green")}
                    />
                </div>

                <div>
                    <StepLabel n={3} hint="the student will see this">Reason</StepLabel>
                    <textarea
                        rows={2}
                        maxLength={1000}
                        aria-label="Reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className={`${fieldClass("green")} resize-none`}
                    />
                </div>

                <div>
                    <StepLabel n={4} hint="optional">Notes for the student</StepLabel>
                    <textarea
                        rows={2}
                        maxLength={1000}
                        aria-label="Notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className={`${fieldClass("green")} resize-none`}
                    />
                </div>

                <Note>The student can accept or decline this follow-up request.</Note>

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
                        Request
                    </button>
                </div>
            </div>
        </div>
    );
}
