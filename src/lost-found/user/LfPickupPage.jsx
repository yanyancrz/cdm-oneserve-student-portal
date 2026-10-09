import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, MapPin } from "lucide-react";
import toast from "react-hot-toast";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import { formatDateTime } from "../config/lfTheme";
import {
    LfButton,
    LfEmpty,
    LfNotice,
    LfPanel,
    LfSkeleton,
} from "../components/lfUi";

// =====================================================
// Choose a pickup slot for an approved claim.
//
// Only slots inside a published availability window
// can be booked, and the API checks custody again:
// office-custody items are booked through the office,
// student-custody items by the report owner.
// =====================================================

export default function LfPickupPage() {
    const { claimId } = useParams();
    const navigate = useNavigate();

    const [availability, setAvailability] = useState([]);
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [availabilityResponse, scheduleResponse] =
                    await Promise.all([
                        lfApi.availability(),
                        lfApi.scheduleForClaim(claimId),
                    ]);

                if (cancelled) return;

                setAvailability(availabilityResponse.data || []);
                setSchedule(scheduleResponse.data || null);
            } catch (err) {
                if (cancelled) return;
                setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [claimId]);

    const onBook = async () => {
        if (!selectedSlot) {
            toast.error("Choose a pickup time first.");
            return;
        }

        setBooking(true);

        try {
            const response = await lfApi.bookSchedule({
                claimId: Number(claimId),
                scheduledDateTime: new Date(selectedSlot).toISOString(),
            });

            toast.success(response.message || "Pickup scheduled.");
            navigate(`${LOST_FOUND_HOME_ROUTE}/claims`, { replace: true });
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBooking(false);
        }
    };

    if (loading) return <LfSkeleton rows={4} />;

    if (error) return <LfNotice tone="bad">{error}</LfNotice>;

    // Already booked - show the slot rather than the picker.
    if (schedule && (schedule.status === "Scheduled" || schedule.status === "Completed")) {
        return (
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#106A2E]"
                >
                    <ArrowLeft size={14} aria-hidden="true" />
                    Back
                </button>

                <LfPanel title="Your pickup">
                    <div className="rounded-xl border border-[#0D7856]/20 bg-[#0D7856]/5 p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <CalendarClock size={16} className="text-[#0D7856]" aria-hidden="true" />
                            {formatDateTime(schedule.scheduledDateTime)}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                            <MapPin size={13} aria-hidden="true" />
                            {schedule.pickupLocation}
                        </p>
                        {schedule.status === "Completed" && (
                            <p className="mt-2 text-xs font-semibold text-emerald-700">
                                Handover completed
                                {schedule.receivedByName ? ` · received by ${schedule.receivedByName}` : ""}
                            </p>
                        )}
                    </div>
                </LfPanel>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#106A2E]"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                Back
            </button>

            <LfPanel
                title="Choose a pickup time"
                subtitle={`Only the published windows below can be booked. Handovers happen at the ${"OneServe Student Affairs Office"}.`}
            >
                {availability.length === 0 ? (
                    <LfEmpty
                        icon={CalendarClock}
                        title="No pickup windows published"
                        message="The Lost & Found admin has not published any pickup windows yet. Check back later."
                    />
                ) : (
                    <div className="space-y-2" role="radiogroup" aria-label="Pickup time">
                        {availability.map((window) => {
                            const starts = new Date(window.startDateTime);
                            const ends = new Date(window.endDateTime);

                            return (
                                <label
                                    key={window.availabilityId}
                                    className="block rounded-xl border border-slate-200 bg-white p-3 transition hover:border-[#106A2E]/40"
                                >
                                    <span className="flex items-center justify-between gap-3">
                                        <span>
                                            <span className="block text-sm font-semibold text-slate-800">
                                                {starts.toLocaleDateString("en-PH", {
                                                    weekday: "long",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-slate-500">
                                                {starts.toLocaleTimeString("en-PH", {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}{" "}
                                                –{" "}
                                                {ends.toLocaleTimeString("en-PH", {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </span>
                                        <input
                                            type="radio"
                                            name="pickup-slot"
                                            value={window.startDateTime}
                                            checked={selectedSlot === window.startDateTime}
                                            onChange={() =>
                                                setSelectedSlot(window.startDateTime)
                                            }
                                            className="h-4 w-4 accent-[#106A2E]"
                                        />
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                )}

                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin size={12} aria-hidden="true" />
                    OneServe Student Affairs Office
                </p>
            </LfPanel>

            <div className="flex gap-2">
                <LfButton
                    variant="accent"
                    onClick={onBook}
                    loading={booking}
                    disabled={!selectedSlot || availability.length === 0}
                    className="flex-1"
                >
                    <CalendarClock size={14} aria-hidden="true" />
                    Book pickup
                </LfButton>
                <LfButton
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(-1)}
                >
                    Cancel
                </LfButton>
            </div>
        </div>
    );
}
