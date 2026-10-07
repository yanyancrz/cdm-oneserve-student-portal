import { useEffect, useState } from "react";
import { Loader2, Lock, X } from "lucide-react";

import { Note, Skeleton } from "../components/GuidanceStates";
import { StepLabel, fieldClass } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";
import { formatYMD } from "../utils/dateTime";

// Bottom sheet: counselor writes the session summary + confidential private notes
// for a COMPLETED appointment. If a record already exists, it is loaded for editing.
export default function SessionRecordSheet({ appointment, onClose, onDone }) {
    const [concernType, setConcernType] = useState(appointment.concernType || "");
    const [summary, setSummary] = useState("");
    const [privateNotes, setPrivateNotes] = useState("");
    const [confidential, setConfidential] = useState(true);
    const [status, setStatus] = useState("Draft");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const c = new AbortController();
        guidanceApi
            .getSessionRecord(appointment.id, c.signal)
            .then((record) => {
                if (!record) return;
                setConcernType(record.concernType || appointment.concernType || "");
                setSummary(record.sessionSummary || "");
                setPrivateNotes(record.privateNotes || "");
                setConfidential(record.isConfidential ?? true);
                setStatus(record.status || "Draft");
            })
            .catch((e) => {
                if (e?.name !== "AbortError") setError(e.message || "Could not load the session record.");
            })
            .finally(() => setLoading(false));
        return () => c.abort();
    }, [appointment.id, appointment.concernType]);

    const submit = async (target) => {
        setError("");
        setSubmitting(true);
        try {
            await guidanceApi.saveSessionRecord(appointment.id, {
                concernType: concernType.trim() || null,
                sessionSummary: summary.trim() || null,
                privateNotes: privateNotes.trim() || null,
                isConfidential: confidential,
                status: target,
            });
            onDone(target === "Finalized" ? "Session record finalized." : "Session record saved as draft.");
        } catch (e) {
            setError(e.message || "Could not save the session record.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Session notes"
                className="mx-auto max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl"
                style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-slate-200" />

                <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-slate-800">Session notes</h2>
                        <p className="truncate text-xs text-slate-500">
                            {appointment.studentName} · {formatYMD(appointment.date)} · {appointment.timeSlot}
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

                {loading ? (
                    <div role="status" aria-busy="true" className="space-y-3">
                        <span className="sr-only">Loading session record...</span>
                        <Skeleton className="h-10 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                    </div>
                ) : (
                    <>
                        <div>
                            <StepLabel n={1}>Concern / topic</StepLabel>
                            <input
                                aria-label="Concern or topic"
                                value={concernType}
                                onChange={(e) => setConcernType(e.target.value)}
                                className={fieldClass("green")}
                            />
                        </div>

                        <div>
                            <StepLabel n={2} hint="what happened in the session">Session summary</StepLabel>
                            <textarea
                                rows={4}
                                maxLength={4000}
                                aria-label="Session summary"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                className={`${fieldClass("green")} resize-none`}
                            />
                        </div>

                        <div>
                            <StepLabel n={3} hint="only you can see this">Private notes</StepLabel>
                            <textarea
                                rows={4}
                                maxLength={4000}
                                aria-label="Private notes"
                                value={privateNotes}
                                onChange={(e) => setPrivateNotes(e.target.value)}
                                className={`${fieldClass("green")} resize-none`}
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={confidential}
                                onChange={(e) => setConfidential(e.target.checked)}
                                className="h-4 w-4 accent-[#106A2E]"
                            />
                            <Lock size={14} aria-hidden="true" /> Mark this record as confidential
                        </label>

                        <p className="text-[11px] text-slate-400">
                            Current status: <span className="font-semibold text-slate-600">{status}</span>. Save as Draft while you are still writing, or Finalize when done.
                        </p>

                        {error && <Note tone="error">{error}</Note>}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => submit("Draft")}
                                disabled={submitting}
                                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition active:scale-[0.99] disabled:opacity-60"
                            >
                                Save draft
                            </button>

                            <button
                                type="button"
                                onClick={() => submit("Finalized")}
                                disabled={submitting}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#106A2E] py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
                            >
                                {submitting && <Loader2 className="animate-spin" size={16} aria-hidden="true" />}
                                Finalize
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
