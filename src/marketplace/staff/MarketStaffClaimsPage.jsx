import { useCallback, useState } from "react";
import { BadgeCheck, Clock, Search, ShieldCheck, Undo2 } from "lucide-react";
import toast from "react-hot-toast";

import { campusStaffApi } from "../services/marketApi";
import {
    MarketButton,
    MarketNotice,
    MarketPanel,
    marketInputClass,
} from "../components/marketUi";
import { formatClaimCode } from "../config/marketVocabulary";
import { formatDateTime, formatPeso } from "../utils/format";

/**
 * Claim verification at the counter.
 *
 * This is the screen that turns "Ready for pickup" into an item actually handed
 * over. The flow is deliberately two steps:
 *
 *   1. LOOK UP the code - read-only, so staff can confirm it belongs to the
 *      person in front of them BEFORE anything changes.
 *   2. RELEASE it - the mutation, which completes the order and consumes stock.
 *
 * Splitting them is the whole point: one wrong keystroke must not hand over the
 * wrong order.
 *
 * Releasing needs an open operator session, exactly like every other staff
 * write. The server records the operator name on the order, so an audit can say
 * who released what.
 */
export default function MarketStaffClaimsPage() {
    const [code, setCode] = useState("");
    const [looking, setLooking] = useState(false);
    const [releasing, setReleasing] = useState(false);

    const [lookup, setLookup] = useState(null);
    const [lookupError, setLookupError] = useState("");
    const [releaseError, setReleaseError] = useState("");
    const [released, setReleased] = useState(null);

    const reset = useCallback(() => {
        setCode("");
        setLookup(null);
        setLookupError("");
        setReleaseError("");
        setReleased(null);
    }, []);

    const lookUp = async (event) => {
        event?.preventDefault();

        const value = formatClaimCode(code);
        if (!value) return;

        setLooking(true);
        setLookupError("");
        setReleaseError("");
        setReleased(null);
        setLookup(null);

        try {
            const response = await campusStaffApi.lookupClaim(value);

            // A valid code on a cancelled or collected order comes back as a
            // success with found=false, not as an error - staff need to be able
            // to say "that was cancelled" as confidently as "no such code".
            if (!response.data?.found) {
                setLookupError(response.data?.message || "That code cannot be collected right now.");
                return;
            }

            setLookup(response.data.order);
        } catch (err) {
            setLookupError(err.message);
        } finally {
            setLooking(false);
        }
    };

    const release = async () => {
        const value = formatClaimCode(code);
        if (!value || !lookup) return;

        setReleasing(true);
        setReleaseError("");

        try {
            const response = await campusStaffApi.verifyClaim({ claimCode: value });

            toast.success(response.message || "Order released.");
            setReleased(response.data);
            setLookup(null);
        } catch (err) {
            setReleaseError(err.message);
        } finally {
            setReleasing(false);
        }
    };

    return (
        <div className="space-y-4">
            <MarketPanel
                title="Verify a claim"
                subtitle="Type the code the buyer shows, check it, then release."
            >
                <form onSubmit={lookUp} className="space-y-3 p-4">
                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Claim code
                        </span>
                        <input
                            className={`${marketInputClass} font-mono text-lg tracking-[.2em]`}
                            value={code}
                            maxLength={8}
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            placeholder="ABCD2345"
                            onChange={(event) => {
                                setCode(formatClaimCode(event.target.value));
                                setLookupError("");
                                setReleaseError("");
                            }}
                        />
                    </label>

                    <div className="flex flex-wrap gap-2">
                        <MarketButton type="submit" disabled={looking || !code.trim()}>
                            <Search size={14} />
                            {looking ? "Checking..." : "Look up"}
                        </MarketButton>

                        {lookup || released || lookupError ? (
                            <MarketButton type="button" variant="secondary" onClick={reset}>
                                <Undo2 size={14} />
                                Clear
                            </MarketButton>
                        ) : null}
                    </div>
                </form>
            </MarketPanel>

            {lookupError ? (
                <MarketNotice tone="error" title="Not collectable" icon={<ShieldCheck size={14} />}>
                    {lookupError}
                </MarketNotice>
            ) : null}

            {releaseError ? (
                <MarketNotice tone="error" title="Could not release the order">
                    {releaseError}
                </MarketNotice>
            ) : null}

            {released ? (
                <MarketNotice tone="good" title="Order released" icon={<BadgeCheck size={14} />}>
                    {released.orderReference} was marked as collected
                    {released.claimedAt ? ` at ${formatDateTime(released.claimedAt)}` : ""}. The reserved
                    stock has been consumed.
                </MarketNotice>
            ) : null}

            {/* The confirm step. Nothing is mutated until this button is pressed. */}
            {lookup ? (
                <MarketPanel title="Confirm the hand-over" subtitle="Check this matches the person in front of you.">
                    <div className="space-y-4 p-4">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <Fact label="Order" value={lookup.orderReference} />
                            <Fact label="Buyer" value={lookup.buyerName || "-"} />
                            <Fact
                                label="Account type"
                                value={lookup.buyerAccountType || "-"}
                            />
                            <Fact label="Total" value={formatPeso(lookup.totalCentavos)} />
                        </div>

                        {lookup.isPreOrder && lookup.scheduledFor ? (
                            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                                <Clock size={13} className="shrink-0 text-slate-400" />
                                <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                    Booked slot
                                </span>
                                <span className="text-[11px] font-semibold text-slate-700">
                                    {formatDateTime(lookup.scheduledFor)}
                                </span>
                            </div>
                        ) : null}

                        <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                Items
                            </p>
                            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                                {(lookup.items || []).map((item) => (
                                    <li
                                        key={item.orderItemId}
                                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-xs font-semibold text-slate-700">
                                                {item.productName}
                                            </span>
                                            {item.variantName ? (
                                                <span className="text-[10px] text-slate-400">
                                                    {item.variantName}
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="shrink-0 text-xs font-semibold text-slate-700">
                                            &times;{item.quantity}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {lookup.notes ? (
                            <p className="rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
                                <span className="font-semibold">Buyer note: </span>
                                {lookup.notes}
                            </p>
                        ) : null}

                        <MarketButton
                            onClick={release}
                            disabled={releasing}
                            className="w-full"
                        >
                            <BadgeCheck size={15} />
                            {releasing ? "Releasing..." : "Confirm hand-over"}
                        </MarketButton>

                        <p className="text-center text-[10px] leading-4 text-slate-400">
                            This completes the order and consumes the reserved stock. It cannot be undone
                            from this screen.
                        </p>
                    </div>
                </MarketPanel>
            ) : null}

            {!lookup && !released && !lookupError ? (
                <MarketNotice tone="info" title="How this works">
                    Every order paid at the counter, and every pre-order, is given a claim code. The buyer
                    shows it to you, you check it here, and only then do you hand the order over.
                </MarketNotice>
            ) : null}
        </div>
    );
}

/** One label/value pair in the confirm grid. */
function Fact({ label, value }) {
    return (
        <div>
            <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-slate-400">{label}</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">{value}</p>
        </div>
    );
}
