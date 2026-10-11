import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, IdCard, MapPin } from "lucide-react";

import { lfApi } from "../services/lfApi";
import { formatDateTime } from "../config/lfTheme";
import {
    LfEmpty,
    LfNotice,
    LfPanel,
    LfSkeleton,
} from "../components/lfUi";

// =====================================================
// Office availability for an approved claim. Every handover runs at the
// office - there are no keepers outside it.
//
// Students do NOT pick a time here: they come during any published window
// below. The admin records the handover itself, which completes the claim.
// =====================================================

export default function LfPickupPage() {
    const { claimId } = useParams();
    const navigate = useNavigate();

    const [availability, setAvailability] = useState([]);
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            // Load independently: a missing schedule (404, the normal
            // walk-in case) must never wipe the availability list.
            try {
                const availabilityResponse = await lfApi.availability();
                if (!cancelled) setAvailability(availabilityResponse.data || []);
            } catch (err) {
                if (cancelled) return;
                setError(err.message);
                setLoading(false);
                return;
            }

            try {
                const scheduleResponse = await lfApi.scheduleForClaim(claimId);
                if (!cancelled) setSchedule(scheduleResponse.data || null);
            } catch {
                // No booked slot is the normal walk-in state - keep
                // the availability list visible instead of erroring.
                if (!cancelled) setSchedule(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [claimId]);

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
                title="Office availability"
                subtitle="No need to book - come to the OneServe Student Affairs Office during any window below."
            >
                {availability.length === 0 ? (
                    <LfEmpty
                        icon={CalendarClock}
                        title="No pickup windows published"
                        message="The Lost & Found admin has not published any pickup windows yet. Check back later."
                    />
                ) : (
                    <ul className="space-y-2">
                        {availability.map((window) => {
                            const starts = new Date(window.startDateTime);
                            const ends = new Date(window.endDateTime);

                            return (
                                <li
                                    key={window.availabilityId}
                                    className="rounded-xl border border-slate-200 bg-white p-3"
                                >
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
                                </li>
                            );
                        })}
                    </ul>
                )}

                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin size={12} aria-hidden="true" />
                    OneServe Student Affairs Office
                </p>

                <p className="mt-2 flex items-center gap-1.5 rounded-xl border border-[#106A2E]/20 bg-[#106A2E]/[0.04] p-3 text-[11px] font-medium leading-5 text-slate-600">
                    <IdCard size={14} className="shrink-0 text-[#106A2E]" aria-hidden="true" />
                    Bring your student ID when you come - the office checks it before handing anything over.
                </p>
            </LfPanel>
        </div>
    );
}
