import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    CalendarClock,
    CheckCircle2,
    Clock,
    Eye,
    MapPin,
    Plus,
    Trash2,
    UserRoundCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import { lfAdminApi } from "../services/lfApi";
import {
    formatDateTime,
    formatItemId,
    isExactItemIdMatch,
} from "../config/lfTheme";
import {
    LfButton,
    LfEmpty,
    LfItemIdEmpty,
    LfItemIdSearch,
    lfField,
    LfNotice,
    LfPanel,
    LfSkeleton,
    LfStatusChip,
} from "../components/lfUi";

// =====================================================
// The pickup console:
//
//   - published windows (create / retire),
//   - the pickup queue (Awaiting Pickup and
//     Scheduled first), where the handover is
//     recorded with the ACTUAL receiver's name and
//     Student ID, and
//   - the completed-pickup records: claimant and
//     receiver shown side by side, never assumed to
//     be the same person.
// =====================================================

export default function LfAdminSchedulesPage() {
    const [schedules, setSchedules] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // "queue" = awaiting pickup / scheduled (handover lives here),
    // "completed" = recorded handovers, read-only history.
    const [tab, setTab] = useState("queue");
    const [inspecting, setInspecting] = useState(null);
    // Queue search: exact Item ID, same algorithm as completed pickups.
    const [queueDraft, setQueueDraft] = useState("");
    const [queueApplied, setQueueApplied] = useState("");

    const load = async () => {
        try {
            const [schedulesResponse, availabilityResponse] =
                await Promise.all([
                    lfAdminApi.schedules(),
                    lfAdminApi.availability(),
                ]);

            setSchedules(schedulesResponse.data || []);
            setAvailability(availabilityResponse.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!cancelled) await load();
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) return <LfSkeleton rows={5} />;

    if (error) return <LfNotice tone="bad">{error}</LfNotice>;

    // The queue holds work; completed rows are a record, so they are
    // switched to with a tab instead of mixed into the live table.
    const queue = schedules.filter(
        (schedule) =>
            schedule.status === "Scheduled" ||
            schedule.status === "Awaiting Pickup"
    );
    const completed = schedules.filter(
        (schedule) => schedule.status === "Completed"
    );
    const otherStatuses = schedules.filter(
        (schedule) =>
            schedule.status !== "Completed" &&
            schedule.status !== "Scheduled" &&
            schedule.status !== "Awaiting Pickup"
    );

    const queueSearching = queueApplied.trim().length > 0;
    const visibleQueue = queueSearching
        ? queue.filter((schedule) =>
              isExactItemIdMatch(schedule.reportId, queueApplied)
          )
        : queue;

    const clearQueueSearch = () => {
        setQueueDraft("");
        setQueueApplied("");
    };

    return (
        <div className="space-y-5">
            <AvailabilityManager
                availability={availability}
                onChanged={load}
            />

            {/* ---------- tabs: queue vs recorded handovers ---------- */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setTab("queue")}
                    aria-pressed={tab === "queue"}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                        tab === "queue"
                            ? "bg-[#106A2E] text-white"
                            : "bg-white text-slate-500 hover:bg-slate-100"
                    }`}
                >
                    Pickup queue ({queue.length})
                </button>
                <button
                    type="button"
                    onClick={() => setTab("completed")}
                    aria-pressed={tab === "completed"}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                        tab === "completed"
                            ? "bg-[#106A2E] text-white"
                            : "bg-white text-slate-500 hover:bg-slate-100"
                    }`}
                >
                    Completed pickups ({completed.length})
                </button>
                {otherStatuses.length > 0 && (
                    <span className="ml-auto text-[11px] text-slate-400">
                        {otherStatuses.length} cancelled
                    </span>
                )}
            </div>

            {tab === "queue" ? (
                <LfPanel
                    title="Pickup queue"
                    subtitle="Awaiting pickup first, then scheduled - record the handover here"
                >
                    {queue.length === 0 ? (
                        <LfEmpty
                            icon={CalendarClock}
                            title="No pickups in the queue"
                            message="When a claim is approved for pickup, its schedule appears here."
                        />
                    ) : (
                        <>
                            {/* ---------- toolbar: exact Item ID search ---------- */}
                            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                                <p className="text-xs text-slate-500">
                                    {queue.length} total
                                    {queueSearching
                                        ? ` · ${visibleQueue.length} matching`
                                        : ""}
                                </p>
                                <div className="w-full sm:w-96">
                                    <LfItemIdSearch
                                        value={queueDraft}
                                        onChange={setQueueDraft}
                                        onSubmit={setQueueApplied}
                                        onClear={clearQueueSearch}
                                        loading={false}
                                    />
                                </div>
                            </div>

                            {visibleQueue.length === 0 ? (
                                <LfItemIdEmpty
                                    icon={CalendarClock}
                                    recordNoun="pickup"
                                    onClear={clearQueueSearch}
                                />
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                    <table className="w-full min-w-[960px] text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                                                <th className="px-4 py-3 font-semibold">
                                                    Item
                                                </th>
                                                <th className="px-4 py-3 font-semibold">
                                                    Claimant
                                                </th>
                                                <th className="px-4 py-3 font-semibold">
                                                    Slot
                                                </th>
                                                <th className="px-4 py-3 font-semibold">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-right font-semibold">
                                                    Handover
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {visibleQueue.map((schedule) => (
                                                <ScheduleRow
                                                    key={schedule.scheduleId}
                                                    schedule={schedule}
                                                    onHandover={load}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </LfPanel>
            ) : (
                <CompletedPickups
                    completed={completed}
                    onInspect={setInspecting}
                />
            )}

            {inspecting && (
                <PickupDetailsModal
                    schedule={inspecting}
                    onClose={() => setInspecting(null)}
                />
            )}
        </div>
    );
}

// =====================================================
// Published pickup windows
// =====================================================

function AvailabilityManager({ availability, onChanged }) {
    const today = new Date();
    const [adding, setAdding] = useState(false);
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDates, setSelectedDates] = useState([]);
    const [times, setTimes] = useState([]);
    const [fromInput, setFromInput] = useState("");
    const [toInput, setToInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [retiring, setRetiring] = useState(null);

    const toKey = (year, month, day) =>
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

    const toggleDate = (key) => {
        // Past dates are blocked - the cells are disabled, this is the
        // second lock for programmatic calls.
        if (key < todayKey) return;

        setSelectedDates((current) =>
            current.includes(key)
                ? current.filter((day) => day !== key)
                : [...current, key].sort()
        );
    };

    const shiftMonth = (delta) => {
        const next = new Date(viewYear, viewMonth + delta, 1);
        setViewYear(next.getFullYear());
        setViewMonth(next.getMonth());
    };

    const addTime = () => {
        if (!fromInput || !toInput) {
            toast.error("Choose a start and end time first.");
            return;
        }

        if (fromInput >= toInput) {
            toast.error("The end time must be after the start time.");
            return;
        }

        if (times.some((slot) => slot.from === fromInput && slot.to === toInput)) {
            toast.error("That time is already in the list.");
            return;
        }

        setTimes((current) =>
            [...current, { from: fromInput, to: toInput }].sort((a, b) =>
                a.from < b.from ? -1 : 1
            )
        );
        setFromInput("");
        setToInput("");
    };

    const windowCount = selectedDates.length * times.length;

    const onPublish = async (event) => {
        event.preventDefault();

        if (selectedDates.length === 0) {
            toast.error("Pick at least one date on the calendar.");
            return;
        }

        if (times.length === 0) {
            toast.error("Add at least one time window to the list.");
            return;
        }

        const periods = [];

        for (const day of selectedDates) {
            for (const slot of times) {
                const start = new Date(`${day}T${slot.from}`);
                const end = new Date(`${day}T${slot.to}`);

                if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                    toast.error("A date or time is invalid.");
                    return;
                }

                periods.push({
                    startDateTime: start.toISOString(),
                    endDateTime: end.toISOString(),
                });
            }
        }

        setSaving(true);

        try {
            const response = await lfAdminApi.createAvailabilityBatch({
                availability: periods,
            });

            toast.success(response.message || "Pickup windows published.");
            setAdding(false);
            setSelectedDates([]);
            setTimes([]);
            await onChanged();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const onRetire = async (slot) => {
        if (
            !globalThis.window.confirm(
                "Retire this pickup window? It disappears from the office-hours view. Existing handover records keep their time."
            )
        )
            return;

        setRetiring(slot.availabilityId);

        try {
            const response = await lfAdminApi.deleteAvailability(
                slot.availabilityId
            );

            toast.success(response.message || "Pickup window retired.");
            await onChanged();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setRetiring(null);
        }
    };

    const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
        "en-PH",
        { month: "long", year: "numeric" }
    );
    const leadBlanks = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    return (
        <LfPanel
            title="Pickup windows"
            subtitle="When the OneServe Student Affairs Office accepts handovers"
            action={
                !adding ? (
                    <LfButton variant="secondary" onClick={() => setAdding(true)}>
                        <Plus size={14} aria-hidden="true" />
                        Publish availability
                    </LfButton>
                ) : undefined
            }
        >
            {adding && (
                <form
                    onSubmit={onPublish}
                    className="mb-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                    {/* ---------- dates: pick as many as needed ---------- */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Dates ({selectedDates.length} picked)
                            </span>
                            <span className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => shiftMonth(-1)}
                                    aria-label="Previous month"
                                    className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-slate-200/60"
                                >
                                    ‹
                                </button>
                                <span className="min-w-[130px] text-center text-xs font-semibold text-slate-700">
                                    {monthLabel}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => shiftMonth(1)}
                                    aria-label="Next month"
                                    className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-slate-200/60"
                                >
                                    ›
                                </button>
                            </span>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                                (day) => (
                                    <span key={day} className="py-1">
                                        {day}
                                    </span>
                                )
                            )}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: leadBlanks }).map((_, index) => (
                                <span key={`blank-${index}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, index) => {
                                const day = index + 1;
                                const key = toKey(viewYear, viewMonth, day);
                                const past = key < todayKey;
                                const active = selectedDates.includes(key);

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        disabled={past}
                                        onClick={() => toggleDate(key)}
                                        aria-pressed={active}
                                        aria-label={`${key}${past ? " (past)" : ""}`}
                                        className={`rounded-lg py-2 text-xs font-semibold transition ${
                                            past
                                                ? "cursor-not-allowed text-slate-300"
                                                : active
                                                  ? "bg-[#106A2E] text-white shadow-sm"
                                                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-[#106A2E]/40"
                                        }`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ---------- times: build the list, then publish ---------- */}
                    <div>
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Times ({times.length} in the list)
                        </span>

                        {times.length > 0 && (
                            <ul className="mb-2 space-y-1.5">
                                {times.map((slot) => (
                                    <li
                                        key={`${slot.from}-${slot.to}`}
                                        className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                                    >
                                        <span>
                                            {slot.from} – {slot.to}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setTimes((current) =>
                                                    current.filter(
                                                        (kept) =>
                                                            kept.from !== slot.from ||
                                                            kept.to !== slot.to
                                                    )
                                                )
                                            }
                                            aria-label={`Remove ${slot.from} to ${slot.to}`}
                                            className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 size={13} aria-hidden="true" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="flex gap-2">
                            <label className="flex-1">
                                <span className="sr-only">Start time</span>
                                <input
                                    type="time"
                                    value={fromInput}
                                    onChange={(event) => setFromInput(event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#106A2E]/40 focus:outline-none"
                                />
                            </label>
                            <label className="flex-1">
                                <span className="sr-only">End time</span>
                                <input
                                    type="time"
                                    value={toInput}
                                    onChange={(event) => setToInput(event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#106A2E]/40 focus:outline-none"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={addTime}
                                className="shrink-0 rounded-xl border border-[#106A2E]/40 px-3.5 text-xs font-semibold text-[#106A2E] transition hover:bg-[#106A2E]/5"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {windowCount > 0 && (
                        <p className="text-[11px] text-slate-500">
                            Publishing{" "}
                            <strong>
                                {windowCount} window{windowCount === 1 ? "" : "s"}
                            </strong>{" "}
                            ({selectedDates.length} date
                            {selectedDates.length === 1 ? "" : "s"} ×{" "}
                            {times.length} time{times.length === 1 ? "" : "s"}).
                        </p>
                    )}

                    <div className="flex gap-2">
                        <LfButton
                            type="submit"
                            loading={saving}
                            disabled={windowCount === 0}
                        >
                            Publish
                        </LfButton>
                        <LfButton
                            type="button"
                            variant="ghost"
                            onClick={() => setAdding(false)}
                        >
                            Cancel
                        </LfButton>
                    </div>
                </form>
            )}

            {availability.length === 0 ? (
                <p className="text-xs text-slate-500">
                    No open windows. Pick dates and times above so students know when to come.
                </p>
            ) : (
                <ul className="space-y-2">
                    {availability.map((slot) => (
                        <li
                            key={slot.availabilityId}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                        >
                            <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                <Clock size={14} className="text-[#106A2E]" aria-hidden="true" />
                                {formatDateTime(slot.startDateTime)} –{" "}
                                {new Date(slot.endDateTime).toLocaleTimeString("en-PH", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={() => onRetire(slot)}
                                disabled={retiring === slot.availabilityId}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                                <Trash2 size={12} aria-hidden="true" />
                                {retiring === slot.availabilityId ? "Retiring…" : "Retire"}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </LfPanel>
    );
}

// =====================================================
// One pickup row + the handover form
// =====================================================

function ScheduleRow({ schedule, onHandover }) {
    const [completing, setCompleting] = useState(false);
    const [receivedByName, setReceivedByName] = useState("");
    const [receivedByStudentId, setReceivedByStudentId] = useState("");

    const needsHandover =
        schedule.status === "Scheduled" ||
        schedule.status === "Awaiting Pickup";

    const onComplete = async () => {
        if (!receivedByName.trim()) {
            toast.error("Enter who received the item.");
            return;
        }

        if (!receivedByStudentId.trim()) {
            toast.error("Enter the recipient's student ID.");
            return;
        }

        if (
            !window.confirm(
                "Record the handover with this receiver? The claim completes, the item is marked returned, and every other active claim on this item is closed."
            )
        )
            return;

        setCompleting(true);

        try {
            const response = await lfAdminApi.completeSchedule(
                schedule.scheduleId,
                {
                    receivedByName: receivedByName.trim(),
                    receivedByStudentId: receivedByStudentId.trim(),
                }
            );

            toast.success(response.message || "Handover completed.");
            setReceivedByName("");
            setReceivedByStudentId("");
            await onHandover();
        } catch (err) {
            // The server refuses a second completion of the same record,
            // so a duplicate click can never write two entries.
            toast.error(err.message);
        } finally {
            setCompleting(false);
        }
    };

    return (
        <tr className="transition hover:bg-slate-50/70">
            <td className="px-4 py-3">
                <span className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-800">
                    <span className="rounded-md bg-[#10231B] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-white ring-1 ring-white/30">
                        {formatItemId(schedule.reportId)}
                    </span>
                    <Link
                        to={`/lost-found/admin/reports/${schedule.reportId}`}
                        className="hover:text-[#106A2E]"
                    >
                        {schedule.itemName}
                    </Link>
                </span>
            </td>
            <td className="px-4 py-3">
                <span className="block font-medium text-slate-700">
                    {schedule.claimantName || "—"}
                </span>
                <span className="block text-[10px] text-slate-400">
                    {schedule.accountStudentId || schedule.claimantEmail}
                </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
                {schedule.status === "Awaiting Pickup" ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Clock size={13} aria-hidden="true" />
                        Walk-in pickup
                    </span>
                ) : (
                    <>
                        <span className="block font-medium text-slate-700">
                            {formatDateTime(schedule.scheduledDateTime)}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                            <MapPin size={10} aria-hidden="true" />
                            {schedule.pickupLocation}
                        </span>
                    </>
                )}
            </td>
            <td className="px-4 py-3">
                <LfStatusChip status={schedule.status} />
                {schedule.completedAt && (
                    <span className="mt-1 block text-[10px] text-slate-400">
                        {formatDateTime(schedule.completedAt)}
                    </span>
                )}
                {schedule.receivedByName && (
                    <span className="mt-0.5 block text-[10px] text-slate-500">
                        Received by {schedule.receivedByName}
                        {schedule.receivedByStudentId
                            ? ` · ${schedule.receivedByStudentId}`
                            : ""}
                    </span>
                )}
            </td>
            <td className="px-4 py-3">
                {needsHandover ? (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            onComplete();
                        }}
                        className="flex items-end justify-end gap-1.5"
                    >
                        <div className="w-32">
                            {lfField("Received by *", {
                                value: receivedByName,
                                onChange: (event) =>
                                    setReceivedByName(event.target.value),
                                placeholder: "Full name",
                            })}
                        </div>
                        <div className="w-28">
                            {lfField("Student ID *", {
                                value: receivedByStudentId,
                                onChange: (event) =>
                                    setReceivedByStudentId(event.target.value),
                                placeholder: "2024-0000",
                            })}
                        </div>
                        <LfButton
                            type="submit"
                            variant="accent"
                            loading={completing}
                            className="h-[38px] px-3"
                        >
                            <CheckCircle2 size={14} aria-hidden="true" />
                            Complete
                        </LfButton>
                    </form>
                ) : (
                    <span className="block text-right text-[10px] text-slate-400">
                        {schedule.status === "Completed"
                            ? "Handover recorded"
                            : "—"}
                    </span>
                )}
            </td>
        </tr>
    );
}

// =====================================================
// RECORDED HANDOVERS
//
// The claimant and the person who physically received
// the item are two different facts, so they are always
// shown in their own columns: the admin books who the
// claim belongs to AND who actually took it. They can
// be the same person, but the UI never assumes it.
// =====================================================

function CompletedPickups({ completed, onInspect }) {
    // Draft = what is typed. Applied = what the table filters on, set by
    // Enter / Search / Clear - same exact Item ID algorithm as the admin
    // reports and claims lists.
    const [draft, setDraft] = useState("");
    const [applied, setApplied] = useState("");

    if (completed.length === 0) {
        return (
            <LfPanel
                title="Completed pickups"
                subtitle="Every recorded handover, newest first"
            >
                <LfEmpty
                    icon={UserRoundCheck}
                    title="No completed pickups yet"
                    message="Once you record a handover in the queue, the full record appears here."
                />
            </LfPanel>
        );
    }

    const rows = [...completed].sort((a, b) =>
        String(b.completedAt ?? "").localeCompare(String(a.completedAt ?? ""))
    );

    const searching = applied.trim().length > 0;

    // Exact match only: "1", "001" and "#001" are the same item;
    // "10", "0012" or "LF-2026-001" match nothing.
    const visible = searching
        ? rows.filter((schedule) => isExactItemIdMatch(schedule.reportId, applied))
        : rows;

    const clearSearch = () => {
        setDraft("");
        setApplied("");
    };

    return (
        <LfPanel
            title="Completed pickups"
            subtitle="Every recorded handover, newest first"
        >
            {/* ---------- toolbar: exact Item ID search ---------- */}
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <p className="text-xs text-slate-500">
                    {completed.length} total
                    {searching ? ` · ${visible.length} matching` : ""}
                </p>
                <div className="w-full sm:w-96">
                    <LfItemIdSearch
                        value={draft}
                        onChange={setDraft}
                        onSubmit={setApplied}
                        onClear={clearSearch}
                        loading={false}
                    />
                </div>
            </div>

            {visible.length === 0 ? (
                <LfItemIdEmpty
                    icon={UserRoundCheck}
                    recordNoun="pickup"
                    onClear={clearSearch}
                />
            ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[1020px] text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                            <th className="px-4 py-3 font-semibold">Item</th>
                            <th className="px-4 py-3 font-semibold">
                                Claimant (name · ID)
                            </th>
                            <th className="px-4 py-3 font-semibold">
                                Received by (name · ID)
                            </th>
                            <th className="px-4 py-3 font-semibold">Completed</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 text-right font-semibold">
                                Details
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visible.map((schedule) => (
                            <tr
                                key={schedule.scheduleId}
                                className="transition hover:bg-slate-50/70"
                            >
                                <td className="px-4 py-3">
                                    <span className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-800">
                                        <span className="rounded-md bg-[#10231B] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-white ring-1 ring-white/30">
                                            {formatItemId(schedule.reportId)}
                                        </span>
                                        <Link
                                            to={`/lost-found/admin/reports/${schedule.reportId}`}
                                            className="hover:text-[#106A2E]"
                                        >
                                            {schedule.itemName}
                                        </Link>
                                    </span>
                                </td>

                                {/* ---- claimant: the account that claimed - */}
                                <td className="px-4 py-3">
                                    <span className="block font-medium text-slate-700">
                                        {schedule.claimantName || "—"}
                                    </span>
                                    <span className="block text-[10px] text-slate-400">
                                        {schedule.accountStudentId || "No ID on file"}
                                    </span>
                                </td>

                                {/* ---- receiver: who actually took it ---- */}
                                <td className="px-4 py-3">
                                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                        <UserRoundCheck
                                            size={12}
                                            className="text-[#106A2E]"
                                            aria-hidden="true"
                                        />
                                        {schedule.receivedByName || "—"}
                                    </span>
                                    <span className="block text-[10px] text-slate-400">
                                        {schedule.receivedByStudentId || "No ID recorded"}
                                    </span>
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                    {formatDateTime(schedule.completedAt)}
                                </td>
                                <td className="px-4 py-3">
                                    <LfStatusChip status="Returned" />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        type="button"
                                        onClick={() => onInspect(schedule)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <Eye size={12} aria-hidden="true" />
                                        View details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
        </LfPanel>
    );
}

// =====================================================
// The full record of one recorded handover.
// Read-only: nothing here can be edited after the
// fact, so a completed record can never be rewritten.
// =====================================================

function PickupDetailsModal({ schedule, onClose }) {
    const samePerson =
        (schedule.claimantName || "").trim().toLowerCase() ===
        (schedule.receivedByName || "").trim().toLowerCase();

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Pickup record
                        </p>
                        <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-lg font-bold text-slate-800">
                            <span className="rounded-md bg-[#10231B] px-2 py-1 font-mono text-[11px] font-bold tracking-wide text-white ring-1 ring-white/30">
                                {formatItemId(schedule.reportId)}
                            </span>
                            {schedule.itemName || "Item"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-5 px-6 py-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <DetailBlock
                            label="Claimant"
                            name={schedule.claimantName || "—"}
                            second={schedule.accountStudentId || "No ID on file"}
                            email={schedule.claimantEmail}
                        />
                        <DetailBlock
                            label="Actually received by"
                            name={schedule.receivedByName || "—"}
                            second={schedule.receivedByStudentId || "No ID recorded"}
                            highlight
                        />
                    </div>

                    {samePerson && (
                        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11px] leading-5 text-emerald-800">
                            The claimant received the item in person.
                        </p>
                    )}

                    <dl className="grid gap-3 text-xs sm:grid-cols-2">
                        <DetailRow
                            label="Pickup completed"
                            value={formatDateTime(schedule.completedAt)}
                        />
                        <DetailRow
                            label="Final status"
                            value="Returned to owner"
                        />
                        <DetailRow
                            label="Scheduled slot"
                            value={
                                schedule.status === "Awaiting Pickup"
                                    ? "Walk-in pickup"
                                    : formatDateTime(schedule.scheduledDateTime)
                            }
                        />
                        <DetailRow
                            label="Pickup location"
                            value={schedule.pickupLocation || "—"}
                        />
                        <DetailRow
                            label="Recorded at (admin verification)"
                            value={formatDateTime(schedule.verifiedAt)}
                        />
                        <DetailRow
                            label="Recorded by admin #"
                            value={
                                schedule.verifiedByAdminId
                                    ? String(schedule.verifiedByAdminId)
                                    : "—"
                            }
                        />
                        <DetailRow
                            label="Finder"
                            value={
                                schedule.finderName
                                    ? `${schedule.finderName}${schedule.finderEmail ? ` · ${schedule.finderEmail}` : ""}`
                                    : "—"
                            }
                        />
                    </dl>

                    <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-500">
                        This record is final. The claim is marked returned and
                        no longer appears on the public board.
                    </p>
                </div>
            </div>
        </div>
    );
}

function DetailBlock({ label, name, second, email, highlight }) {
    return (
        <div
            className={`rounded-2xl border p-4 ${
                highlight
                    ? "border-[#106A2E]/30 bg-[#106A2E]/5"
                    : "border-slate-200 bg-slate-50"
            }`}
        >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-slate-800">{name}</p>
            {second && (
                <p className="mt-0.5 text-xs text-slate-500">{second}</p>
            )}
            {email && <p className="mt-0.5 text-xs text-slate-400">{email}</p>}
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </dt>
            <dd className="mt-0.5 text-xs font-medium text-slate-700">{value}</dd>
        </div>
    );
}
