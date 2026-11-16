import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarClock, X } from "lucide-react";
import toast from "react-hot-toast";
import { guidanceApi } from "../services/guidanceApi";
import { onGuidanceEvent } from "../services/realtime";
import { formatStamp, formatYMD, todayISO } from "../utils/dateTime";
import { fieldClass } from "./GuidanceUi";
import MonthCalendar from "./MonthCalendar";
import { APPOINTMENTS_UPDATED, RescheduleContext } from "./RescheduleContext";

const button = "rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-50";

function Dialog({ title, children, onClose, busy = false }) {
    const panel = useRef(null);
    useEffect(() => {
        const previous = document.activeElement;
        panel.current?.querySelector("button")?.focus();
        const keydown = (event) => {
            if (event.key === "Escape" && !busy) onClose();
            if (event.key === "Tab") {
                const nodes = [...panel.current.querySelectorAll("button:not(:disabled), input:not(:disabled), textarea:not(:disabled)")];
                const first = nodes[0], last = nodes.at(-1);
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }
        };
        document.addEventListener("keydown", keydown);
        return () => { document.removeEventListener("keydown", keydown); previous?.focus(); };
    }, [busy, onClose]);
    return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && onClose()}>
        <section ref={panel} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
            className="max-h-[85dvh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-slate-800">{title}</h2>
                <button type="button" aria-label="Close reschedule dialog" disabled={busy} onClick={onClose} className="rounded-lg p-2 text-slate-500"><X size={18} /></button></div>
            {children}
        </section>
    </div>;
}

function ProposalPicker({ appointment, previous, audience, onClose, onDone }) {
    const [date, setDate] = useState("");
    const [slot, setSlot] = useState("");
    const [reason, setReason] = useState("");
    const [instructions, setInstructions] = useState("");
    const [rules, setRules] = useState(null);
    const [day, setDay] = useState(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        guidanceApi.getRescheduleRules(controller.signal).then(setRules)
            .catch((e) => { if (e.name !== "AbortError") setError(e.message); });
        return () => controller.abort();
    }, []);
    useEffect(() => {
        if (!date) return;
        const controller = new AbortController();
        queueMicrotask(() => {
            if (controller.signal.aborted) return;
            setLoading(true);
            guidanceApi.getProposalAvailability(appointment.id, date, controller.signal)
                .then((value) => { if (!controller.signal.aborted) setDay(value); })
                .catch((e) => { if (!controller.signal.aborted) setError(e.message); })
                .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        });
        return () => controller.abort();
    }, [appointment.id, date]);
    const chooseDate = (value) => { setDate(value); setSlot(""); setDay(null); setError(""); };
    const submit = async () => {
        if (!date || !slot || reason.trim().length < 5) { setError("Choose a date and time, and give a reason of at least 5 characters."); return; }
        setBusy(true); setError("");
        try {
            await guidanceApi.proposeReschedule(appointment.id, { date, timeSlot: slot, reason: reason.trim(), instructions: instructions.trim(), previousProposalId: previous?.id ?? null });
            toast.success("Proposal sent. The official schedule stays unchanged until both parties agree.");
            onDone();
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };
    return <Dialog title={previous ? "Suggest another schedule" : "Request a reschedule"} busy={busy} onClose={onClose}>
        <p className="text-xs text-slate-500">Current appointment: {formatYMD(appointment.date)} at {appointment.timeSlot}.</p>
        {previous && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">You disagree with {formatYMD(previous.proposedDate)} at {previous.proposedTimeSlot}. Select a date and time you can attend.</p>}
        <p className="text-xs text-slate-600">{audience === "student" ? "Choose your availability. Your counselor will check their calendar before accepting. Choose a school-day time from 7 AM to 8 PM." : "Select an open time in your availability calendar. The student must agree before it is confirmed."} Proposed slots are not reserved.</p>
        <fieldset disabled={busy} className="space-y-3">
            {rules ? <MonthCalendar value={date} onSelect={chooseDate} minDate={rules.earliestDate || todayISO()} maxDate={rules.latestDate} dayInfo={(value) => ({ disabled: [0, 6].includes(new Date(`${value}T12:00:00`).getDay()) })} /> : <p className="text-xs text-slate-500">Loading booking rules...</p>}
            {loading && <p role="status" className="text-xs text-slate-500">Checking availability...</p>}
            {day && !loading && <>
                {(day.offDay || day.studentBusy) && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{day.studentBusy ? "You already have another appointment on this date." : day.holiday || day.offReason || "No availability on this date."}</p>}
                <div className="grid grid-cols-3 gap-2">{day.allSlots.map((time) => <button key={time} type="button" disabled={!day.availableSlots.includes(time)} aria-pressed={slot === time}
                    className={`${button} ${slot === time ? "bg-[#106A2E] text-white" : "text-slate-700"}`} onClick={() => setSlot(time)}>{time}</button>)}</div>
                {!day.offDay && !day.studentBusy && !day.availableSlots.length && <p className="text-xs text-amber-700">No available times. Choose another date.</p>}
            </>}
            <label className="block text-xs font-semibold text-slate-600">Reason<textarea aria-label="Rescheduling reason" maxLength={500} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={fieldClass("green")} /></label>
            <label className="block text-xs font-semibold text-slate-600">Additional instructions (optional)<textarea aria-label="Additional instructions" maxLength={1000} rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} className={fieldClass("green")} /></label>
        </fieldset>
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        <button type="button" disabled={busy || loading || !slot} onClick={submit} className={`${button} w-full bg-[#106A2E] text-white`}>{busy ? "Sending..." : "Send proposed schedule"}</button>
    </Dialog>;
}

export default function RescheduleProvider({ audience, children }) {
    const [proposals, setProposals] = useState([]);
    const [review, setReview] = useState(null);
    const [composer, setComposer] = useState(null);
    const [history, setHistory] = useState(null);
    const [confirmation, setConfirmation] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const seen = useRef(new Set());
    const [availability, setAvailability] = useState(null);
    const [availabilityRetry, setAvailabilityRetry] = useState(0);
    useEffect(() => {
        if (!review || audience !== "counselor") return;
        const controller = new AbortController();
        guidanceApi.getProposalAvailability(review.appointmentId, review.proposedDate, controller.signal)
            .then((day) => {
                if (controller.signal.aborted) return;
                setAvailability({ id: review.id, available: !day.offDay && !day.studentBusy && day.availableSlots.includes(review.proposedTimeSlot),
                    reason: day.studentBusy ? "The student already has another appointment on this date." : day.holiday || day.offReason });
            })
            .catch((e) => {
                if (!controller.signal.aborted) setAvailability({ id: review.id, error: e.message });
            });
        return () => controller.abort();
    }, [review, audience, availabilityRetry]);
    const previousSignature = useRef(null);
    const previousStatuses = useRef(new Map());
    const refresh = useCallback(async (signal) => {
        try {
            const rows = await guidanceApi.getRescheduleProposals(signal);
            if (signal?.aborted) return;
            const signature = JSON.stringify(rows.map((p) => [p.id, p.status, p.appointment.status]));
            if (previousSignature.current !== null && previousSignature.current !== signature)
                window.dispatchEvent(new Event(APPOINTMENTS_UPDATED));
            const accepted = rows.find((p) => p.status === "Accepted" && previousStatuses.current.get(p.id) === "Pending");
            if (accepted) setConfirmation(accepted);
            previousStatuses.current = new Map(rows.map((p) => [p.id, p.status]));
            previousSignature.current = signature;
            setReview((current) => current && rows.some((p) => p.id === current.id && p.status === "Pending") ? current : null);
            setProposals(rows); setError("");
        } catch (e) { if (e.name !== "AbortError") setError(e.message || "Could not load reschedule requests."); }
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => { if (!controller.signal.aborted) refresh(controller.signal); });
        const update = () => refresh(controller.signal);
        const off = onGuidanceEvent("Notification", update);
        const timer = setInterval(update, 30000);
        window.addEventListener("focus", update);
        window.addEventListener(APPOINTMENTS_UPDATED, update);
        return () => { controller.abort(); off(); clearInterval(timer); window.removeEventListener("focus", update); window.removeEventListener(APPOINTMENTS_UPDATED, update); };
    }, [refresh]);
    useEffect(() => {
        if (review || composer || history || confirmation) return;
        const next = proposals.find((p) => p.status === "Pending" && p.proposedByRole !== audience && !seen.current.has(p.id));
        if (next) {
            seen.current.add(next.id);
            queueMicrotask(() => setReview(next));
        }
    }, [proposals, audience, review, composer, history, confirmation]);
    const open = (appointment) => {
        const pending = proposals.find((p) => p.appointmentId === appointment.id && p.status === "Pending");
        if (pending?.proposedByRole === audience) setHistory(appointment);
        else if (pending) { seen.current.add(pending.id); setReview(pending); }
        else setComposer({ appointment });
    };
    const changed = () => { setComposer(null); setReview(null); refresh(); window.dispatchEvent(new Event(APPOINTMENTS_UPDATED)); };
    const agree = async () => {
        setBusy(true); setError("");
        try {
            await guidanceApi.acceptReschedule(review.appointmentId, review.id);
            toast.success("Both parties agreed. The new appointment is confirmed.");
            changed();
        } catch (e) {
            setError(e.message);
            setAvailability(null);
            setAvailabilityRetry((value) => value + 1);
        }
        finally { setBusy(false); }
    };
    const pending = proposals.filter((p) => p.status === "Pending");
    const incoming = pending.filter((p) => p.proposedByRole !== audience);
    return <RescheduleContext.Provider value={{ open, proposals, refresh, showHistory: setHistory }}>
        {(pending.length > 0 || error) && <div className="m-4 space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            {pending.length > 0 && <p className="flex items-center gap-2"><CalendarClock size={16} />{incoming.length ? `${incoming.length} reschedule request(s) need your response.` : "Reschedule requested. Waiting for the other party's agreement."}</p>}
            {incoming.map((p) => <button type="button" key={p.id} className={`${button} mr-2 bg-white`} onClick={() => { seen.current.add(p.id); setReview(p); }}>Review {formatYMD(p.proposedDate)} · {p.proposedTimeSlot}</button>)}
            {error && <p role="alert">{error} <button type="button" className="underline" onClick={() => refresh()}>Refresh requests</button></p>}
        </div>}
        {children}
        {confirmation && !review && !composer && !history && <Dialog title="New appointment schedule confirmed" onClose={() => setConfirmation(null)}>
            <p className="text-sm font-semibold text-[#106A2E]">{formatYMD(confirmation.proposedDate)} at {confirmation.proposedTimeSlot}</p>
            <p className="text-xs text-slate-600">Both parties agreed. This is now the official appointment schedule.</p>
            <p className="text-xs text-slate-500">Previous schedule: {formatYMD(confirmation.originalDate)} at {confirmation.originalTimeSlot}.</p>
            <button type="button" className={`${button} w-full bg-[#106A2E] text-white`} onClick={() => setConfirmation(null)}>Done</button>
        </Dialog>}
        {review && <Dialog title="Review proposed appointment" busy={busy} onClose={() => { setReview(null); setError(""); }}>
            <p className="text-xs text-slate-500">{audience === "student" ? review.appointment.counselorName : review.appointment.studentName} proposed:</p>
            <p className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-[#106A2E]">{formatYMD(review.proposedDate)} at {review.proposedTimeSlot}</p>
            <p className="text-xs text-slate-600">Reason: {review.reason}</p>
            {review.instructions && <p className="text-xs text-slate-600">{review.instructions}</p>}
            <p className="text-xs text-slate-500">Agree confirms this exact schedule immediately if it is still available. Disagree lets you select another date and time. Until agreement, the official schedule remains unchanged.</p>
            {audience === "counselor" && <div role="status" className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                {availability?.id !== review.id ? "Checking your availability for the student's proposed schedule..." : availability.error ? <>
                    {availability.error} <button type="button" disabled={busy} className="underline" onClick={() => { setAvailability(null); setAvailabilityRetry((value) => value + 1); }}>Check again</button>
                </> : availability.available ? "This time is open in your availability calendar. Agree to confirm the student's proposed schedule." : <>
                    {availability.reason || "This time is unavailable in your calendar."} Disagree to propose another available date and time.
                </>}
            </div>}
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2"><button type="button" disabled={busy || (audience === "counselor" && (availability?.id !== review.id || !availability.available))} onClick={agree} className={`${button} flex-1 bg-[#106A2E] text-white`}>{busy ? "Confirming..." : "Agree"}</button>
                <button type="button" disabled={busy} onClick={() => { setComposer({ appointment: review.appointment, previous: review }); setReview(null); setError(""); }} className={`${button} flex-1`}>Disagree</button></div>
        </Dialog>}
        {composer && <ProposalPicker key={`${composer.appointment.id}-${composer.previous?.id || "new"}`} {...composer} audience={audience} onClose={() => setComposer(null)} onDone={changed} />}
        {history && <Dialog title="Rescheduling history" onClose={() => setHistory(null)}>
            {proposals.filter((p) => p.appointmentId === history.id).map((p) => <div key={p.id} className="space-y-1 rounded-xl border border-slate-200 p-3 text-xs text-slate-600">
                <p className="font-semibold">{p.status} · Proposed by {p.proposedByRole}</p>
                <p>{formatYMD(p.originalDate)} {p.originalTimeSlot} → {formatYMD(p.proposedDate)} {p.proposedTimeSlot}</p>
                <p>{p.reason}</p><p>{formatStamp(p.createdAt)}{p.respondedAt ? ` · Responded ${formatStamp(p.respondedAt)}` : ""}</p>
            </div>)}
            {!proposals.some((p) => p.appointmentId === history.id) && <p className="text-xs text-slate-500">No reschedule proposals yet.</p>}
        </Dialog>}
    </RescheduleContext.Provider>;
}
