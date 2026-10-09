import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, HandHelping } from "lucide-react";
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
    LfSkeleton,
    LfStatusChip,
} from "../components/lfUi";
// =====================================================
// The caller's claims, with the pickup state front
// and center.
//
// A claim moves Pending -> Approved -> Scheduled ->
// Completed. An approved claim is where the pickup
// button lives; a scheduled one shows the slot.
// =====================================================

export default function LfMyClaimsPage() {
    const navigate = useNavigate();

    const [claims, setClaims] = useState([]);
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
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const onCancel = async (claim) => {
        if (
            !window.confirm(
                "Withdraw this claim? The finder will be notified and any pickup slot is released."
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
            )}
        </div>
    );
}

function ClaimCard({ claim, cancelling, onOpen, onPickup, onCancel }) {
    const image = lfImageUrl(claim.imagePath);
    const canPickup =
        claim.status === "Approved" ||
        claim.status === "Awaiting Pickup";
    const canCancel =
        claim.status === "Pending" ||
        claim.status === "Approved" ||
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
                    <LfButton
                        variant="accent"
                        onClick={onPickup}
                    >
                        <CalendarClock size={14} aria-hidden="true" />
                        {claim.status === "Approved"
                            ? "Choose a pickup slot"
                            : "Pickup slot"}
                    </LfButton>
                )}

                {claim.status === "Scheduled" && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F4D35E]/20 px-3 py-2 text-[11px] font-semibold text-[#1F1F1F]">
                        <CalendarClock size={13} aria-hidden="true" />
                        See your slot below
                    </span>
                )}

                {claim.status === "Completed" && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                        Handover complete
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
                Pickup slot
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {formatDateTime(schedule.scheduledDateTime)}
            </p>
            <p className="text-xs text-slate-600">{schedule.pickupLocation}</p>
        </div>
    );
}
