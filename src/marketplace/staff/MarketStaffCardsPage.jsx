import { useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    CreditCard,
    RotateCcw,
    Search,
    ShieldOff,
    Undo2,
    Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import { campusStaffApi } from "../services/marketApi";
import {
    MarketButton,
    MarketField,
    MarketNotice,
    MarketPanel,
    marketInputClass,
} from "../components/marketUi";
import {
    CARD_STATUS,
    cardStatusLabel,
    cardTransactionTone,
} from "../config/marketVocabulary";
import { formatDateTime, formatPeso, formatPesoSigned } from "../utils/format";

/**
 * The campus card counter.
 *
 * Staff search by the printed card number or the owner's ID number - whichever
 * the person in front of them can produce - then load it.
 *
 * A load is a mutation and therefore needs an open operator session; the server
 * records the operator name on the ledger row, so the "who added this money and
 * when" question always has an answer. Without a session the server refuses,
 * so the notice below says so plainly rather than letting the button fail.
 *
 * Nothing here computes a balance. The figure shown is the stored balance the
 * server owns.
 */
export default function MarketStaffCardsPage() {
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");

    const [card, setCard] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [ledgerError, setLedgerError] = useState("");

    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState("");

    const reset = () => {
        setQuery("");
        setCard(null);
        setLedger([]);
        setAmount("");
        setNotes("");
        setSearchError("");
        setLoadError("");
        setLedgerError("");
    };

    const search = async (event) => {
        event?.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        setSearchError("");
        setLoadError("");

        try {
            const response = await campusStaffApi.searchCard(query.trim());
            setCard(response.data);

            // The ledger is supporting detail, so a failure here must not lose
            // the card the staff just found.
            try {
                const ledgerResponse = await campusStaffApi.cardLedger(response.data.cardId);
                setLedger(ledgerResponse.data || []);
                setLedgerError("");
            } catch (err) {
                setLedger([]);
                setLedgerError(err.message);
            }
        } catch (err) {
            setCard(null);
            setSearchError(err.message);
        } finally {
            setSearching(false);
        }
    };

    const load = async () => {
        const centavos = Math.round((Number(amount) || 0) * 100);
        if (centavos <= 0) {
            setLoadError("Enter how much to load.");
            return;
        }

        setSaving(true);
        setLoadError("");

        try {
            const response = await campusStaffApi.loadCard(card.userId, {
                amountCentavos: centavos,
                notes: notes.trim() || null,
            });

            toast.success(response.message || "Card loaded.");

            setAmount("");
            setNotes("");

            // Re-read rather than patching the local figure: the balance is the
            // server's, and the response is the authoritative one.
            const fresh = await campusStaffApi.searchCard(query.trim());
            setCard(fresh.data);

            try {
                const ledgerResponse = await campusStaffApi.cardLedger(fresh.data.cardId);
                setLedger(ledgerResponse.data || []);
            } catch {
                // Leave the previous ledger in place rather than blanking it.
            }
        } catch (err) {
            setLoadError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const setStatus = async (status) => {
        setSaving(true);
        setLoadError("");

        try {
            const response = await campusStaffApi.setCardStatus(card.cardId, { status });
            toast.success(response.message || `Card ${cardStatusLabel(status).toLowerCase()}.`);
            setCard(response.data);
        } catch (err) {
            setLoadError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const blocked = card?.status === CARD_STATUS.BLOCKED;

    return (
        <div className="space-y-4">
            <MarketPanel title="Find a campus card" subtitle="Card number or the owner's ID number.">
                <form onSubmit={search} className="space-y-3 p-4">
                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Card number or ID number
                        </span>
                        <div className="relative">
                            <Search
                                size={14}
                                className="pointer-events-none absolute bottom-3 left-3 text-slate-400"
                            />
                            <input
                                className={`${marketInputClass} pl-8`}
                                value={query}
                                autoComplete="off"
                                placeholder="CDM-000123 or 2024-00123"
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setSearchError("");
                                }}
                            />
                        </div>
                    </label>

                    <div className="flex flex-wrap gap-2">
                        <MarketButton type="submit" disabled={searching || !query.trim()}>
                            {searching ? "Searching..." : "Find card"}
                        </MarketButton>

                        {card || searchError ? (
                            <MarketButton type="button" variant="secondary" onClick={reset}>
                                <Undo2 size={14} />
                                Clear
                            </MarketButton>
                        ) : null}
                    </div>
                </form>
            </MarketPanel>

            {searchError ? (
                <MarketNotice tone="error" title="No card found">
                    {searchError}
                </MarketNotice>
            ) : null}

            {loadError ? (
                <MarketNotice tone="error" title="Could not complete that">
                    {loadError}
                </MarketNotice>
            ) : null}

            {card ? (
                <>
                    <MarketPanel
                        title={card.cardNumber}
                        subtitle={`${card.fullName || "Unknown"} · ${card.accountType || ""} · ${card.idNumber || ""}`}
                        action={
                            <MarketButton
                                size="sm"
                                variant={blocked ? "secondary" : "danger"}
                                onClick={() => setStatus(blocked ? CARD_STATUS.ACTIVE : CARD_STATUS.BLOCKED)}
                                disabled={saving}
                            >
                                {blocked ? (
                                    <>
                                        <CreditCard size={13} />
                                        Unblock
                                    </>
                                ) : (
                                    <>
                                        <ShieldOff size={13} />
                                        Block card
                                    </>
                                )}
                            </MarketButton>
                        }
                    >
                        <div className="p-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div>
                                    <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400">
                                        Balance
                                    </p>
                                    <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-800">
                                        {formatPeso(card.balanceCentavos)}
                                    </p>
                                </div>

                                <span
                                    className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
                                        blocked
                                            ? "bg-rose-50 text-rose-700 border-rose-200"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    }`}
                                >
                                    {cardStatusLabel(card.status)}
                                </span>

                                {card.lastLoadedAt ? (
                                    <p className="text-[10px] text-slate-400">
                                        Last loaded {formatDateTime(card.lastLoadedAt)}
                                    </p>
                                ) : null}
                            </div>

                            {/* Loading is refused while blocked, so the control is
                                disabled rather than failing after the fact. */}
                            <div className="mt-4 border-t border-slate-100 pt-4">
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                    Load the card
                                </p>

                                {blocked ? (
                                    <MarketNotice tone="warn" title="This card is blocked">
                                        Unblock it before loading. The balance is safe either way.
                                    </MarketNotice>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                                            <MarketField label="Amount (PHP)">
                                                <input
                                                    className={marketInputClass}
                                                    type="number"
                                                    min="1"
                                                    step="0.01"
                                                    inputMode="decimal"
                                                    value={amount}
                                                    placeholder="100.00"
                                                    onChange={(event) => setAmount(event.target.value)}
                                                />
                                            </MarketField>

                                            <MarketField label="Note (optional)">
                                                <input
                                                    className={marketInputClass}
                                                    value={notes}
                                                    maxLength={300}
                                                    placeholder="Walk-in load"
                                                    onChange={(event) => setNotes(event.target.value)}
                                                />
                                            </MarketField>
                                        </div>

                                        <MarketButton
                                            onClick={load}
                                            disabled={saving || !amount}
                                        >
                                            <Wallet size={14} />
                                            {saving ? "Loading..." : "Load card"}
                                        </MarketButton>

                                        <p className="text-[10px] leading-4 text-slate-400">
                                            Needs an open operator session. Your operator name is recorded on
                                            the ledger row.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </MarketPanel>

                    <MarketPanel title="Ledger" subtitle="Newest first.">
                        <div className="p-4">
                            {ledgerError ? (
                                <MarketNotice tone="warn" title="Ledger unavailable">
                                    {ledgerError}
                                </MarketNotice>
                            ) : ledger.length === 0 ? (
                                <p className="py-4 text-center text-[11px] text-slate-400">
                                    No movements on this card yet.
                                </p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {ledger.map((row) => {
                                        const isDebit = row.type === "Debit";
                                        const Icon = isDebit
                                            ? ArrowUpRight
                                            : row.type === "Credit"
                                              ? ArrowDownLeft
                                              : RotateCcw;

                                        return (
                                            <li
                                                key={row.transactionId}
                                                className="flex items-start justify-between gap-3 py-2.5"
                                            >
                                                <div className="flex min-w-0 items-start gap-2.5">
                                                    <span
                                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                                            isDebit
                                                                ? "bg-rose-50 text-rose-600"
                                                                : "bg-emerald-50 text-emerald-600"
                                                        }`}
                                                    >
                                                        <Icon size={13} />
                                                    </span>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-[11px] font-semibold text-slate-700">
                                                            {row.typeLabel || row.type}
                                                        </p>
                                                        <p className="truncate text-[10px] text-slate-400">
                                                            {formatDateTime(row.createdAt)}
                                                            {row.orderReference
                                                                ? ` · ${row.orderReference}`
                                                                : ""}
                                                            {row.operatorName
                                                                ? ` · ${row.operatorName}`
                                                                : ""}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    <p
                                                        className={`text-[11px] font-semibold ${cardTransactionTone(row.type)}`}
                                                    >
                                                        {formatPesoSigned(row.signedAmountCentavos)}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400">
                                                        bal{" "}
                                                        {formatPeso(row.balanceAfterCentavos, {
                                                            withSymbol: false,
                                                        })}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </MarketPanel>
                </>
            ) : null}

            {!card && !searchError ? (
                <MarketNotice tone="info" title="How this works">
                    Loads are recorded with your operator name against the ledger, so the balance can
                    always be explained. A blocked card keeps its balance but cannot be used to pay.
                </MarketNotice>
            ) : null}
        </div>
    );
}
