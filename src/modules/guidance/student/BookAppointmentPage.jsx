import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarCheck2, CalendarDays, CalendarX2, CheckCircle2, Loader2 } from "lucide-react";

import PageHeader from "../components/PageHeader";
import { ErrorBox, Note, Skeleton } from "../components/GuidanceStates";
import { useGuidanceMe } from "../components/GuidanceGate";
import { ACCENTS, Avatar, StepLabel, fieldClass } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";
import { CONCERN_TYPES } from "../utils/concernTypes";
import { formatYMD, isPastSlot, todayISO } from "../utils/dateTime";

const A = ACCENTS.green;

const draftKey = (userId) => `gp_book_draft_${userId}`;

const readDraft = (userId) => {
    try {
        return JSON.parse(localStorage.getItem(draftKey(userId)) || "null");
    } catch {
        return null;
    }
};

export default function BookAppointmentPage() {
    const { me } = useGuidanceMe();
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const [counselors, setCounselors] = useState([]);
    const [loadingC, setLoadingC] = useState(true);
    const [loadError, setLoadError] = useState("");

    // Booking rules from Guidance Head > Settings (same-day allowed? date range?).
    // null = still loading. Treated as "allowed" until it arrives so the form
    // never blinks off for a hiccup.
    const [rules, setRules] = useState(null);

    const [counselorId, setCounselorId] = useState(params.get("counselorId") || "");
    const [date, setDate] = useState("");
    const [slot, setSlot] = useState("");
    const [concern, setConcern] = useState("");
    const [notes, setNotes] = useState("");

    const [day, setDay] = useState(null); // { offDay, allSlots, availableSlots, bookedSlots }
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotError, setSlotError] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [, setTick] = useState(0);

    const restored = useRef(false);

    // counselors
    const loadCounselors = useCallback(async () => {
        setLoadError("");
        setLoadingC(true);
        try {
            setCounselors(await guidanceApi.getCounselors());
        } catch (e) {
            setLoadError(e.message || "Could not load counselors.");
        } finally {
            setLoadingC(false);
        }
    }, []);
    // Deferred so the effect body itself never sets state synchronously.
    useEffect(() => { queueMicrotask(loadCounselors); }, [loadCounselors]);

    // booking rules (same-day bookable? how far ahead?) - one call, no retry loop
    useEffect(() => {
        const c = new AbortController();
        guidanceApi
            .getBookingRules(c.signal)
            .then((r) => { if (!c.signal.aborted) setRules(r); })
            .catch(() => { /* keep the permissive default */ });
        return () => c.abort();
    }, []);

    // restore the saved draft once (a counselor chosen from the Counselors page wins)
    useEffect(() => {
        if (restored.current) return;
        restored.current = true;

        // Read NOW: the auto-save effect below would otherwise clear it first.
        const d = readDraft(me.userId);
        if (!d) return;

        // Applying the values is deferred so this effect never sets state
        // synchronously.
        queueMicrotask(() => {
            if (!params.get("counselorId") && d.counselorId) setCounselorId(d.counselorId);
            if (d.date && d.date >= todayISO()) setDate(d.date);
            if (d.concern) setConcern(d.concern);
            if (d.notes) setNotes(d.notes);
        });
    }, [me.userId, params]);

    // auto-save the draft
    useEffect(() => {
        if (!restored.current || success) return;
        try {
            if (counselorId || date || concern || notes)
                localStorage.setItem(draftKey(me.userId), JSON.stringify({ counselorId, date, concern, notes }));
            else localStorage.removeItem(draftKey(me.userId));
        } catch { /* storage unavailable */ }
    }, [counselorId, date, concern, notes, me.userId, success]);

    // re-evaluate "past" slots every minute
    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), 60000);
        return () => clearInterval(t);
    }, []);

    // slots for counselor + date
    const loadSlots = useCallback(async (cId, d, signal) => {
        setLoadingSlots(true);
        setSlotError("");
        try {
            setDay(await guidanceApi.getAvailability(cId, d, signal));
        } catch (e) {
            if (e?.name === "AbortError") return;
            setDay(null);
            setSlotError(e.message || "Could not check the schedule.");
        } finally {
            setLoadingSlots(false);
        }
    }, []);

    useEffect(() => {
        const c = new AbortController();

        // Deferred so the effect body never sets state synchronously.
        queueMicrotask(() => {
            if (c.signal.aborted) return;
            if (!counselorId || !date) {
                setDay(null);
                return;
            }
            loadSlots(counselorId, date, c.signal);
        });

        return () => c.abort();
    }, [counselorId, date, loadSlots]);

    // drop a selected slot that became invalid
    useEffect(() => {
        if (!slot || !day) return;
        if (day.offDay || day.bookedSlots.includes(slot) || !day.allSlots.includes(slot) || isPastSlot(date, slot))
            queueMicrotask(() => setSlot(""));
    }, [day, slot, date]);

    const clearDraft = () => {
        try { localStorage.removeItem(draftKey(me.userId)); } catch { /* ignore */ }
        setCounselorId(""); setDate(""); setSlot(""); setConcern(""); setNotes("");
        setDay(null); setError("");
    };

    const submit = async () => {
        setError("");
        if (!counselorId) return setError("Please select a counselor.");
        if (!date) return setError("Please select a date.");
        if (sameDayBlocked) {
            setSlot("");
            return setError("Same-day appointments are currently turned off. Please choose a later date.");
        }
        if (!slot) return setError("Please select a time slot.");
        if (!concern) return setError("Please select a concern type.");
        if (isPastSlot(date, slot)) {
            setSlot("");
            return setError("That time has already passed. Please choose a later time.");
        }

        setSubmitting(true);
        try {
            await guidanceApi.bookAppointment({
                counselorId: Number(counselorId),
                date,
                timeSlot: slot,
                concernType: concern,
                notes: notes.trim() || null,
            });
            try { localStorage.removeItem(draftKey(me.userId)); } catch { /* ignore */ }
            setSuccess("Appointment booked! Awaiting counselor confirmation.");
            setTimeout(() => navigate("/guidance/appointments"), 1500);
        } catch (e) {
            setError(e.message || "Something went wrong. Please try again.");
            loadSlots(counselorId, date); // somebody may have just taken the slot
        } finally {
            setSubmitting(false);
        }
    };

    const selected = counselors.find((c) => String(c.id) === String(counselorId));
    const allSlots = day ? [...day.allSlots] : [];
    const free = day ? day.availableSlots.filter((s) => !isPastSlot(date, s)) : [];
    const today = todayISO();

    // Same-day bookings turned off by the Guidance Head and this date is today
    // -> replace the whole form with a warning instead of letting them fill it in.
    const sameDayBlocked = Boolean(rules) && rules.allowSameDay === false && date === today;

    return (
        <>
            <PageHeader title="Book an Appointment" subtitle="Choose a counselor, date and time for your session." />

            <main className="space-y-4 px-4 pt-4">
                {loadError && <ErrorBox message={loadError} onRetry={loadCounselors} />}

                {success && (
                    <div
                        role="status"
                        className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-green-600">
                            <CheckCircle2 size={22} aria-hidden="true" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold">Request sent!</p>
                            <p className="text-xs">{success}</p>
                        </div>
                    </div>
                )}

                {sameDayBlocked ? (
                    /* Same-day bookings are off and this date is today: show ONLY
                       the warning - the form stays hidden until another date is picked. */
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                        <div role="alert" className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                                <CalendarX2 size={22} aria-hidden="true" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-amber-900">
                                    Hindi po pwede magpa-appoint ngayong araw.
                                </p>

                                <p className="mt-1 text-xs leading-5 text-amber-800">
                                    Naka-off ang same-day appointments ngayon, kaya hindi tinatanggap ang
                                    booking para sa <strong>{formatYMD(today)}</strong>. Pumili ng mas
                                    malayong petsa.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setDate("");
                                        setSlot("");
                                        setDay(null);
                                        setError("");
                                    }}
                                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-amber-800 shadow-sm transition active:scale-95"
                                >
                                    <CalendarDays size={14} aria-hidden="true" /> Pumili ng ibang petsa
                                </button>
                            </div>
                        </div>
                    </section>
                ) : (
                <section className="space-y-5 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    {/* 1. COUNSELOR */}
                    <div>
                        <StepLabel n={1}>Counselor</StepLabel>

                        {loadingC ? (
                            <Skeleton className="mt-2 h-11 w-full rounded-xl" />
                        ) : (
                            <select
                                aria-label="Counselor"
                                value={counselorId}
                                onChange={(e) => { setCounselorId(e.target.value); setSlot(""); }}
                                className={fieldClass("green")}
                            >
                                <option value="">Select a counselor…</option>
                                {counselors.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.fullName}{c.department ? ` — ${c.department}` : ""}
                                    </option>
                                ))}
                            </select>
                        )}

                        {selected && (
                            <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-emerald-50/60 p-2.5">
                                <Avatar name={selected.fullName} size="sm" />

                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-slate-700">{selected.fullName}</p>
                                    {selected.room && (
                                        <p className="truncate text-[11px] text-slate-500">{selected.room}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. DATE */}
                    <div>
                        <StepLabel
                            n={2}
                            hint={rules && !rules.allowSameDay ? "no same-day bookings" : undefined}
                        >
                            Preferred date
                        </StepLabel>

                        <input
                            type="date"
                            aria-label="Preferred date"
                            min={today}
                            max={rules?.latestDate || undefined}
                            value={date}
                            onChange={(e) => { setDate(e.target.value); setSlot(""); }}
                            className={fieldClass("green")}
                        />
                    </div>

                    {/* 3. TIME SLOT */}
                    <div>
                        <StepLabel n={3} hint={loadingSlots ? "checking schedule…" : undefined}>
                            Time slot
                        </StepLabel>

                        <div className="mt-2">
                            {!counselorId || !date ? (
                                <p className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-400">
                                    Select a counselor and date to see available slots.
                                </p>
                            ) : loadingSlots && !day ? (
                                <div role="status" aria-busy="true" className="grid grid-cols-3 gap-2">
                                    <span className="sr-only">Loading slots...</span>
                                    {Array.from({ length: 6 }, (_, n) => (
                                        <Skeleton key={n} className="h-10 rounded-xl" />
                                    ))}
                                </div>
                            ) : slotError ? (
                                <ErrorBox message={slotError} onRetry={() => loadSlots(counselorId, date)} />
                            ) : day?.offDay ? (
                                <Note>This counselor is not scheduled on that day. Please choose a different date.</Note>
                            ) : day && allSlots.length === 0 ? (
                                <Note>No time slots for this date. Please try another date.</Note>
                            ) : day && free.length === 0 ? (
                                <Note tone="error">
                                    All slots are fully booked{date === today ? " or have already passed" : ""} for this date.
                                </Note>
                            ) : day ? (
                                <>
                                    <div className="grid grid-cols-3 gap-2">
                                        {allSlots.map((s) => {
                                            const taken = day.bookedSlots.includes(s);
                                            const past = isPastSlot(date, s);
                                            const disabled = taken || past;
                                            const on = slot === s;
                                            return (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    disabled={disabled}
                                                    aria-pressed={on}
                                                    onClick={() => setSlot(s)}
                                                    className={`rounded-xl border px-1 py-2.5 text-xs font-semibold transition active:scale-95 ${
                                                        on
                                                            ? A.slotOn
                                                            : disabled
                                                              ? "border-slate-100 bg-slate-50 text-slate-300"
                                                              : "border-slate-200 bg-white text-slate-700 hover:border-[#106A2E]/50"
                                                    }`}
                                                >
                                                    {s}
                                                    {disabled && (
                                                        <span className="block text-[9px] font-bold">{taken ? "TAKEN" : "PAST"}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <p className="mt-2 text-[11px] text-slate-400">
                                        {free.length} of {allSlots.length} slots available
                                    </p>
                                </>
                            ) : null}
                        </div>
                    </div>

                    {/* 4. CONCERN */}
                    <div>
                        <StepLabel n={4}>Concern type</StepLabel>

                        <div role="radiogroup" aria-label="Concern type" className="mt-2 flex flex-wrap gap-2">
                            {CONCERN_TYPES.map((t) => {
                                const on = concern === t;
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        role="radio"
                                        aria-checked={on}
                                        onClick={() => setConcern(t)}
                                        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                                            on ? A.chipOn : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 5. NOTES */}
                    <div>
                        <StepLabel n={5} hint="optional">Notes</StepLabel>

                        <textarea
                            rows={3}
                            maxLength={1000}
                            aria-label="Notes (optional)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Anything you'd like your counselor to know beforehand"
                            className={`${fieldClass("green")} resize-none`}
                        />

                        <p className="mt-1 text-right text-[10px] text-slate-400">{notes.length}/1000</p>
                    </div>

                    {slot && date && selected && (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#106A2E] shadow-sm">
                                <CalendarCheck2 size={18} aria-hidden="true" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0E3B22]">Your booking</p>
                                <p className="truncate text-sm font-semibold text-slate-800">{selected.fullName}</p>
                                <p className="text-xs text-slate-600">{formatYMD(date)} · {slot}</p>
                            </div>
                        </div>
                    )}

                    {error && <Note tone="error">{error}</Note>}

                    <button
                        type="button"
                        onClick={submit}
                        disabled={submitting || !!success}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#106A2E] py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
                    >
                        {submitting && <Loader2 className="animate-spin" size={16} aria-hidden="true" />}
                        {submitting ? "Booking…" : "Book appointment"}
                    </button>

                    {(counselorId || date || concern || notes) && !success && (
                        <button type="button" onClick={clearDraft} className="w-full text-xs font-medium text-slate-400 underline">
                            Clear form
                        </button>
                    )}
                </section>
                )}
            </main>
        </>
    );
}
