import { useCallback, useEffect, useRef, useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    CreditCard,
    RefreshCw,
    RotateCcw,
    Wallet,
} from "lucide-react";

import { campusApi } from "../services/marketApi";
import {
    MarketButton,
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    MarketStat,
} from "../components/marketUi";
import { cardStatusLabel, cardTransactionTone } from "../config/marketVocabulary";
import { formatDateTime, formatPeso, formatPesoSigned } from "../utils/format";

/**
 * The buyer's campus card: balance and every movement on it.
 *
 * The balance is a stored figure the server keeps, never a figure computed in
 * the browser, so this screen only ever reads it. Top-ups happen at the counter
 * (they need a duty-shift operator session), which is why there is no "load"
 * button here - only a pointer to where to go.
 */
export default function MarketCardPage() {
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloading, setReloading] = useState(false);

    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    /**
     * One loader for the first load and for refreshes. `quiet` keeps the page on
     * screen (a spinning button instead of the skeleton) so a refresh never
     * flashes the whole card away.
     */
    const load = useCallback(async ({ quiet = false } = {}) => {
        if (quiet) setReloading(true);
        else setLoading(true);
        setError("");

        try {
            const response = await campusApi.myCard();
            if (mountedRef.current) setCard(response.data || null);
        } catch (err) {
            if (mountedRef.current) setError(err.message);
        } finally {
            if (mountedRef.current) {
                if (quiet) setReloading(false);
                else setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={4} />
            </MarketPanel>
        );
    }

    if (error && !card) {
        return (
            <MarketNotice tone="error" title="Could not load your campus card">
                {error}
            </MarketNotice>
        );
    }

    if (!card) {
        return (
            <MarketPanel title="Campus Card" subtitle="Your balance and every movement on the card.">
                <div className="p-4">
                    <MarketEmpty
                        icon={<CreditCard size={20} />}
                        title="No campus card yet"
                        hint="Once the registrar issues your card, your balance will show up here."
                    />
                </div>
            </MarketPanel>
        );
    }

    const movements = card.recentTransactions || [];
    // Only blocked once we actually have a card - a missing card is handled above.
    const blocked = card.status !== "Active";

    return (
        <div className="space-y-4">
            {error ? (
                <MarketNotice tone="warn" title="Showing the last loaded balance">
                    {error}
                </MarketNotice>
            ) : null}

            {blocked ? (
                <MarketNotice
                    tone="warn"
                    title="This card cannot be used for payment"
                    icon={<CreditCard size={14} />}
                >
                    Your balance is still here, but payments are refused while the card is blocked. Bring the
                    card to the counter to have it unblocked.
                </MarketNotice>
            ) : null}

            <MarketPanel
                title="Campus Card"
                subtitle="Your balance and every movement on the card."
                action={
                    <MarketButton
                        variant="secondary"
                        size="sm"
                        onClick={() => load({ quiet: true })}
                        disabled={reloading}
                    >
                        <RefreshCw size={13} className={reloading ? "animate-spin" : ""} />
                        {reloading ? "Refreshing..." : "Refresh"}
                    </MarketButton>
                }
            >
                <div className="space-y-4 p-4">
                    {/* The card face. Green while it can pay, muted once blocked. */}
                    <div
                        className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-sm sm:p-6 ${
                            blocked
                                ? "bg-gradient-to-br from-slate-600 to-slate-800"
                                : "bg-gradient-to-br from-[#106A2E] to-[#0E3B22]"
                        }`}
                    >
                        <div
                            aria-hidden="true"
                            className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl"
                        />

                        <div className="relative flex items-start justify-between gap-3">
                            {/* Decorative card chip */}
                            <span
                                aria-hidden="true"
                                className="block h-7 w-10 rounded-md border border-amber-100/40 bg-gradient-to-br from-amber-200/90 to-amber-400/70"
                            />

                            <span className="rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                                {cardStatusLabel(card.status)}
                            </span>
                        </div>

                        <div className="relative mt-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-white/70">
                                Available balance
                            </p>
                            <p className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                                {formatPeso(card.balanceCentavos)}
                            </p>
                        </div>

                        <div className="relative mt-6 flex items-end justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[11px] uppercase tracking-[.16em] text-white/70">
                                    Card number
                                </p>
                                <p className="mt-0.5 break-all font-mono text-sm tracking-[.18em]">
                                    {card.cardNumber || "-"}
                                </p>
                            </div>
                            <CreditCard size={24} className="shrink-0 text-white/50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <MarketStat label="Account type" value={card.accountType || "-"} />
                        <MarketStat label="ID number" value={card.idNumber || "-"} />
                        <MarketStat label="Issued" value={formatDateTime(card.issuedAt) || "-"} />
                        <MarketStat
                            label="Last loaded"
                            value={card.lastLoadedAt ? formatDateTime(card.lastLoadedAt) : "Never"}
                        />
                    </div>

                    {/* Small, always-there pointer instead of a full-width notice. */}
                    <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                        <Wallet size={14} className="mt-0.5 shrink-0 text-slate-400" />
                        <span>
                            <span className="font-semibold text-slate-700">Need to add money? </span>
                            Top-ups are done at the counter so a staff member records who loaded the card and
                            when. Your balance updates here as soon as they do.
                        </span>
                    </p>
                </div>
            </MarketPanel>

            <MarketPanel
                title="Recent movements"
                subtitle={movements.length > 0 ? "Newest first." : undefined}
            >
                {movements.length === 0 ? (
                    <div className="p-4">
                        <MarketEmpty
                            icon={<Wallet size={20} />}
                            title="No movements yet"
                            hint="Loads and purchases will appear here."
                        />
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 px-4">
                        {movements.map((row) => (
                            <MovementRow key={row.transactionId} row={row} />
                        ))}
                    </ul>
                )}
            </MarketPanel>
        </div>
    );
}

/** Icon and tint per movement type. Anything that is not a plain debit/credit is treated as a refund-style reversal. */
function movementStyle(type) {
    if (type === "Debit") {
        return { Icon: ArrowUpRight, box: "bg-rose-50 text-rose-600" };
    }

    if (type === "Credit") {
        return { Icon: ArrowDownLeft, box: "bg-emerald-50 text-emerald-600" };
    }

    return { Icon: RotateCcw, box: "bg-amber-50 text-amber-600" };
}

/**
 * One ledger line.
 *
 * The amount arrives already signed from the server, so this row only picks a
 * colour and an icon from the type - it never decides the sign itself.
 */
function MovementRow({ row }) {
    const { Icon, box } = movementStyle(row.type);

    return (
        <li className="flex items-start justify-between gap-3 py-3">
            <div className="flex min-w-0 items-start gap-3">
                <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${box}`}
                >
                    <Icon size={15} />
                </span>

                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{row.typeLabel || row.type}</p>
                    <p className="mt-0.5 break-words text-xs text-slate-500">
                        {formatDateTime(row.createdAt)}
                        {row.orderReference ? ` · ${row.orderReference}` : ""}
                        {row.operatorName ? ` · ${row.operatorName}` : ""}
                    </p>
                    {row.notes ? (
                        <p className="mt-1 break-words text-xs leading-4 text-slate-500">{row.notes}</p>
                    ) : null}
                </div>
            </div>

            <div className="shrink-0 text-right">
                <p className={`text-sm font-semibold ${cardTransactionTone(row.type)}`}>
                    {formatPesoSigned(row.signedAmountCentavos)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                    Balance {formatPeso(row.balanceAfterCentavos)}
                </p>
            </div>
        </li>
    );
}