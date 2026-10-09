import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    CalendarClock,
    CheckCircle2,
    Clock,
    MapPin,
    Plus,
    Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { lfAdminApi } from "../services/lfApi";
import {
    formatDateTime,
} from "../config/lfTheme";
import {
    LfButton,
    LfEmpty,
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
//     Scheduled first), and
//   - the handover itself, which completes the
//     claim, marks the report Claimed and
//     closes every other active claim.
// =====================================================

export default function LfAdminSchedulesPage() {
    const [schedules, setSchedules] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    return (
        <div className="space-y-5">
            <AvailabilityManager
                availability={availability}
                onChanged={load}
            />

            <LfPanel
                title="Pickup queue"
                subtitle="Awaiting pickup first, then scheduled, then completed"
            >
                {schedules.length === 0 ? (
                    <LfEmpty
                        icon={CalendarClock}
                        title="No pickups yet"
                        message="When a claim is approved, its pickup schedule appears here."
                    />
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[960px] text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                                    <th className="px-4 py-3 font-semibold">Item</th>
                                    <th className="px-4 py-3 font-semibold">Claimant</th>
                                    <th className="px-4 py-3 font-semibold">Slot</th>
                                    <th className="px-4 py-3 font-semibold">Custody</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 text-right font-semibold">
                                        Handover
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {schedules.map((schedule) => (
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
            </LfPanel>
        </div>
    );
}

// =====================================================
// Published pickup windows
// =====================================================

function AvailabilityManager({ availability, onChanged }) {
    const [adding, setAdding] = useState(false);
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [saving, setSaving] = useState(false);
    const [retiring, setRetiring] = useState(null);

    const onPublish = async (event) => {
        event.preventDefault();

        if (!date || !startTime || !endTime) {
            toast.error("Choose a date and a start and end time.");
            return;
        }

        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            toast.error("Choose a valid date and time.");
            return;
        }

        if (start >= end) {
            toast.error("The window must end after it starts.");
            return;
        }

        setSaving(true);

        try {
            const response = await lfAdminApi.createAvailability({
                startDateTime: start.toISOString(),
                endDateTime: end.toISOString(),
            });

            toast.success(response.message || "Pickup window published.");
            setAdding(false);
            setDate("");
            setStartTime("");
            setEndTime("");
            await onChanged();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const onRetire = async (window) => {
        if (
            !window.confirm(
                "Retire this pickup window? Booked slots inside it cannot be affected, but no new slot can be chosen from it."
            )
        )
            return;

        setRetiring(window.availabilityId);

        try {
            const response = await lfAdminApi.deleteAvailability(
                window.availabilityId
            );

            toast.success(response.message || "Pickup window retired.");
            await onChanged();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setRetiring(null);
        }
    };

    return (
        <LfPanel
            title="Pickup windows"
            subtitle="When the OneServe Student Affairs Office accepts handovers"
            action={
                !adding ? (
                    <LfButton variant="secondary" onClick={() => setAdding(true)}>
                        <Plus size={14} aria-hidden="true" />
                        Publish window
                    </LfButton>
                ) : undefined
            }
        >
            {adding && (
                <form
                    onSubmit={onPublish}
                    className="mb-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                    <div className="grid gap-4 sm:grid-cols-3">
                        <label className="block">
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Date
                            </span>
                            <input
                                type="date"
                                value={date}
                                onChange={(event) => setDate(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#106A2E]/40 focus:outline-none focus:ring-2 focus:ring-[#106A2E]/15"
                            />
                        </label>
                        {lfField("From", {
                            type: "time",
                            value: startTime,
                            onChange: (event) => setStartTime(event.target.value),
                        })}
                        {lfField("Until", {
                            type: "time",
                            value: endTime,
                            onChange: (event) => setEndTime(event.target.value),
                        })}
                    </div>
                    <div className="mt-3 flex gap-2">
                        <LfButton type="submit" loading={saving}>
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
                    No open windows. Publish one so claimants can book a slot.
                </p>
            ) : (
                <ul className="space-y-2">
                    {availability.map((window) => (
                        <li
                            key={window.availabilityId}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                        >
                            <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                <Clock size={14} className="text-[#106A2E]" aria-hidden="true" />
                                {formatDateTime(window.startDateTime)} –{" "}
                                {new Date(window.endDateTime).toLocaleTimeString("en-PH", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={() => onRetire(window)}
                                disabled={retiring === window.availabilityId}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                                <Trash2 size={12} aria-hidden="true" />
                                {retiring === window.availabilityId ? "Retiring…" : "Retire"}
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
                "Record the handover? The claim completes, the report is marked claimed, and every other active claim on this item is closed."
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
            toast.error(err.message);
        } finally {
            setCompleting(false);
        }
    };

    return (
        <tr className="transition hover:bg-slate-50/70">
            <td className="px-4 py-3">
                <Link
                    to={`/lost-found/report/${schedule.reportId}`}
                    className="font-semibold text-slate-800 hover:text-[#106A2E]"
                >
                    {schedule.itemName}
                </Link>
            </td>
            <td className="px-4 py-3">
                <span className="block font-medium text-slate-700">
                    {schedule.claimantName || "—"}
                </span>
                <span className="block text-[10px] text-slate-400">
                    {schedule.claimantEmail}
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
            <td className="px-4 py-3 text-slate-500">
                {schedule.itemCustody === "AdminOffice"
                    ? "Office"
                    : schedule.itemCustody === "Student"
                      ? "Student"
                      : "—"}
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
                                placeholder: "Name",
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
