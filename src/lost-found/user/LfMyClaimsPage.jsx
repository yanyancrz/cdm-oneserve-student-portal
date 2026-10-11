import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, HandHelping, IdCard } from "lucide-react";
import toast from "react-hot-toast";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import {
    formatDateTime,
} from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfButton,
    LfEmpty,
    LfImage,
    LfNotice,
    LfPanel,
    LfSkeleton,
    LfStatusChip,
} from "../components/lfUi";
// =====================================================
// The caller's claims, with the pickup state front
// and center.
//
// A claim moves Processing -> Claimed -> Returned. Claimed items walk in
// during office windows (shown below) - nobody books a slot. Returned
// claims show the handover.
// =====================================================

export default function LfMyClaimsPage() {
    const navigate = useNavigate();

    const [claims, setClaims] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancelling, setCancelling] = useState(null);

    const load = async () => {
        try {
            const response = await lfApi.myClaims();
            setClaims(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (cancelled) return;
            await load();

            // Office windows load on their own: a failure here must never
            // hide the claims list.
            try {
                const windows = await lfApi.availability();
                if (!cancelled) setAvailability(windows.data || []);
            } catch {
                if (!cancelled) setAvailability([]);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const onCancel = async (claim) => {
        if (
            !window.confirm(
                "Withdraw this claim? The office will be notified."
            )
        )
            return;

        setCancelling(claim.claimId);

        try {
            const response = await lfApi.cancelClaim(claim.claimId);
            toast.success(response.message || "Claim cancelled.");
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setCancelling(null);
        }
    };

    if (loading) return <LfSkeleton rows={3} />;

    if (error) return <LfNotice tone="bad">{error}</LfNotice>;

    return (
        <div className="space-y-4">
            {claims.length === 0 ? (
                <LfEmpty
                    icon={HandHelping}
                    title="No claims yet"
                    message="When you claim a found item from the board, it appears here with its pickup status."
                    action={
                        <LfButton
                            onClick={() => navigate(`${LOST_FOUND_HOME_ROUTE}/browse`)}
                        >
                            Browse the board
                        </LfButton>
                    }
                />
            ) : (
                <div className="space-y-4">
            <LfPanel
                title="Office availability"
                subtitle="Come anytime during these windows - no booking needed"
            >
                {availability.length === 0 ? (
                    <p className="text-xs text-slate-500">
                        No pickup windows published yet. Check back later.
                    </p>
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

                <p className="mt-3 flex items-center gap-1.5 rounded-xl border border-[#106A2E]/20 bg-[#106A2E]/[0.04] p-3 text-[11px] font-medium leading-5 text-slate-600">
                    <IdCard size={14} className="shrink-0 text-[#106A2E]" aria-hidden="true" />
                    Bring your student ID when you come - the office checks it before handing anything over.
                </p>
            </LfPanel>

                <ul className="space-y-3">
                    {claims.map((claim) => (
                        <ClaimCard
                            key={claim.claimId}
                            claim={claim}
                            cancelling={cancelling === claim.claimId}
                            onOpen={() =>
                                navigate(
                                    `${LOST_FOUND_HOME_ROUTE}/report/${claim.reportId}`
                                )
                            }
                            onPickup={() =>
                                navigate(
                                    `${LOST_FOUND_HOME_ROUTE}/pickup/${claim.claimId}`
                                )
                            }
                            onCancel={() => onCancel(claim)}
                        />
                    ))}
                </ul>
                </div>
            )}
        </div>
    );
}

function ClaimCard({ claim, cancelling, onOpen, onPickup, onCancel }) {
    const image = lfImageUrl(claim.imagePath);
    const canCancel =
        claim.status === "Processing" ||
        claim.status === "Claimed" ||
        claim.status === "Scheduled" ||
        claim.status === "Awaiting Pickup";
    const canPickup =
        claim.status === "Claimed" ||
        claim.status === "Scheduled" ||
        claim.status === "Awaiting Pickup";

    return (
        <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <LfImage
                    src={image}
                    alt={claim.itemName}
                    className="h-14 w-14 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={onOpen}
                        className="truncate text-sm font-semibold text-slate-800 hover:text-[#106A2E]"
                    >
                        {claim.itemName}
                    </button>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {claim.category || "Uncategorized"}
                        {claim.location ? ` · ${claim.location}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                        Claimed {formatDateTime(claim.claimDate)}
                    </p>

                    {claim.verificationNotes && (
                        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] italic leading-5 text-slate-600">
                            “{claim.verificationNotes}”
                        </p>
                    )}
                </div>
                <LfStatusChip status={claim.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {canPickup && (
                    <button
                        type="button"
                        onClick={onPickup}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#106A2E] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#0E3B22]"
                    >
                        <CalendarClock size={13} aria-hidden="true" />
                        View pickup
                    </button>
                )}

                {claim.status === "Scheduled" && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F4D35E]/20 px-3 py-2 text-[11px] font-semibold text-[#1F1F1F]">
                        <CalendarClock size={13} aria-hidden="true" />
                        Walk in during office hours
                    </span>
                )}

                {claim.status === "Awaiting Pickup" && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F4D35E]/20 px-3 py-2 text-[11px] font-semibold text-[#1F1F1F]">
                        <CalendarClock size={13} aria-hidden="true" />
                        Claimed - walk in during office hours
                    </span>
                )}

                {claim.status === "Claimed" && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                        Claimed - walk in during office hours
                    </span>
                )}

                {claim.status === "Returned" && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                        Returned - handover complete
                    </span>
                )}

                {canCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={cancelling}
                        className="rounded-xl px-3 py-2 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                        {cancelling ? "Cancelling…" : "Withdraw claim"}
                    </button>
                )}

                {claim.status === "Rejected" && (
                    <span className="text-[11px] text-slate-500">
                        The finder rejected this claim. You can claim again with
                        more detail, or ask at the office.
                    </span>
                )}
            </div>

            {claim.status === "Scheduled" && <ClaimScheduleBox claimId={claim.claimId} />}
        </li>
    );
}

/** The booked slot for a scheduled claim, loaded on demand. */
function ClaimScheduleBox({ claimId }) {
    const [schedule, setSchedule] = useState(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const response = await lfApi.scheduleForClaim(claimId);
                if (!cancelled && response.data) setSchedule(response.data);
            } catch {
                // A missing schedule is not an error worth surfacing
                // here - the claim row already says it is scheduled.
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [claimId]);

    if (!schedule) return null;

    return (
        <div className="mt-3 rounded-xl border border-[#0D7856]/20 bg-[#0D7856]/5 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0D7856]">
                Earlier booking
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {formatDateTime(schedule.scheduledDateTime)}
            </p>
            <p className="text-xs text-slate-600">{schedule.pickupLocation}</p>
        </div>
    );
}
