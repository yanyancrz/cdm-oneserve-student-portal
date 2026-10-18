import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, IdCard, RefreshCw, Search, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { campusStaffApi } from "../services/marketApi";
import {
    MarketButton,
    MarketEmpty,
    MarketField,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";
import {
    ID_CLAIM_STATUS,
    idClaimStatusLabel,
    idClaimStatusTone,
    idClaimTypeLabel,
    isOpenClaim,
} from "../config/marketVocabulary";
import { formatDateTime } from "../utils/format";

const SEARCH_DEBOUNCE_MS = 300;
const NOTE_MAX = 500;

/**
 * The Student / Faculty ID claim review queue.
 *
 * Open claims come first, oldest at the top - the person who asked longest is
 * the one who has waited longest. Settled claims are shown underneath so the
 * screen doubles as a history, filtered by the same status control.
 *
 * The only two actions are release and reject, and the server decides which are
 * legal for the current status. `canReject` and `nextStatus` come from the API
 * so this screen never offers a move the server would refuse.
 *
 * Releasing issues the claim code the person shows at the counter; approving a
 * released claim marks it handed over. Rejecting requires a note, because a
 * refusal with no reason is not something the person can act on.
 */
export default function MarketStaffIdClaimsPage() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("");

    // The claim currently being decided, and the note typed for it.
    const [deciding, setDeciding] = useState(null);
    const [notes, setNotes] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [noteError, setNoteError] = useState("");
    const [decisionError, setDecisionError] = useState("");

    const mountedRef = useRef(true);
    const requestIdRef = useRef(0);
    const loadedOnceRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Typing should not fire a request per keystroke.
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    /**
     * The one loader. The list is refetched per filter change, not filtered in
     * the browser, so the status filter means what it says even as the queue
     * grows.
     *
     * Each call takes a request id and only the latest one may write state, so a
     * slow response to an old search can never overwrite a newer one. `silent`
     * keeps the list on screen instead of swapping it for the skeleton.
     */
    const load = useCallback(
        async ({ silent = false } = {}) => {
            const requestId = ++requestIdRef.current;
            const isLatest = () => mountedRef.current && requestId === requestIdRef.current;

            if (silent) setRefreshing(true);
            else setLoading(true);
            setError("");

            try {
                const response = await campusStaffApi.idClaims({
                    search: debouncedSearch,
                    status,
                });
                if (isLatest()) setClaims(response.data || []);
            } catch (err) {
                if (isLatest()) setError(err.message);
            } finally {
                if (isLatest()) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [debouncedSearch, status],
    );

    // First load shows the skeleton; later filter changes update in place.
    useEffect(() => {
        load({ silent: loadedOnceRef.current });
        loadedOnceRef.current = true;
    }, [load]);

    const open = claims.filter((claim) => isOpenClaim(claim.status));
    const settled = claims.filter((claim) => !isOpenClaim(claim.status));

    // If the claim being decided drops out of the list (filter change, someone
    // else handled it), close its form instead of leaving it orphaned.
    useEffect(() => {
        if (deciding && !claims.some((claim) => claim.idClaimId === deciding)) {
            setDeciding(null);
            setNotes("");
            setNoteError("");
            setDecisionError("");
        }
    }, [claims, deciding]);

    const startDeciding = (claim) => {
        setDeciding(claim.idClaimId);
        setNotes("");
        setNoteError("");
        setDecisionError("");
    };

    const cancelDeciding = () => {
        setDeciding(null);
        setNotes("");
        setNoteError("");
        setDecisionError("");
    };

    const review = async (claim, approve) => {
        // A rejection with no reason tells the person nothing, so it is caught
        // here rather than relying on the server to say so.
        if (!approve && !notes.trim()) {
            setNoteError("Please say why the claim is being rejected.");
            return;
        }

        setBusyId(claim.idClaimId);
        setNoteError("");
        setDecisionError("");

        try {
            const response = await campusStaffApi.reviewIdClaim(claim.idClaimId, {
                approve,
                notes: notes.trim() || null,
            });

            toast.success(response.message || "ID claim updated.");

            setDeciding(null);
            setNotes("");
            await load({ silent: true });
        } catch (err) {
            if (mountedRef.current) setDecisionError(err.message);
        } finally {
            if (mountedRef.current) setBusyId(null);
        }
    };

    const filtered = Boolean(debouncedSearch || status);

    const rowProps = (claim) => ({
        claim,
        deciding: deciding === claim.idClaimId,
        busy: busyId === claim.idClaimId,
        notes,
        noteError,
        decisionError,
        onNotes: (value) => {
            setNotes(value);
            setNoteError("");
        },
        onDecide: () => startDeciding(claim),
        onCancel: cancelDeciding,
        onApprove: () => review(claim, true),
        onReject: () => review(claim, false),
    });

    return (
        <div className="space-y-4">
            <MarketPanel
                title="ID claim queue"
                subtitle={
                    open.length > 0
                        ? `${open.length} waiting for you.`
                        : "Nothing is waiting for review."
                }
                action={
                    <MarketButton
                        variant="secondary"
                        size="sm"
                        onClick={() => load({ silent: true })}
                        disabled={refreshing || loading}
                    >
                        <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </MarketButton>
                }
            >
                <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
                    <label className="relative block">
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Search
                        </span>
                        <Search
                            size={14}
                            className="pointer-events-none absolute bottom-3 left-3 text-slate-400"
                        />
                        <input
                            className={`${marketInputClass} pl-8`}
                            value={search}
                            placeholder="Name, ID number, email or claim code"
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Status
                        </span>
                        <select
                            className={`${marketInputClass} w-full min-w-[9rem]`}
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="">All</option>
                            {Object.values(ID_CLAIM_STATUS).map((value) => (
                                <option key={value} value={value}>
                                    {idClaimStatusLabel(value)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </MarketPanel>

            {error ? (
                <MarketNotice tone="error" title="Could not load the queue">
                    {error}
                </MarketNotice>
            ) : null}

            {loading ? (
                <MarketPanel>
                    <div className="p-4">
                        <MarketSkeleton rows={4} />
                    </div>
                </MarketPanel>
            ) : claims.length === 0 ? (
                <MarketPanel>
                    <div className="p-4">
                        <MarketEmpty
                            icon={<IdCard size={20} />}
                            title={filtered ? "No claims match" : "No ID claims yet"}
                            hint={
                                filtered
                                    ? "Try a different search or status."
                                    : "Claims filed by students and faculty will appear here."
                            }
                        />
                    </div>
                </MarketPanel>
            ) : (
                <div className={`space-y-4 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
                    {open.length > 0 ? (
                        <MarketPanel
                            title={`Waiting for review · ${open.length}`}
                            subtitle="Oldest first."
                        >
                            <ul className="divide-y divide-slate-100 px-4">
                                {open.map((claim) => (
                                    <ClaimRow key={claim.idClaimId} {...rowProps(claim)} />
                                ))}
                            </ul>
                        </MarketPanel>
                    ) : null}

                    {settled.length > 0 ? (
                        <MarketPanel title="Settled" subtitle="Collected or rejected.">
                            <ul className="divide-y divide-slate-100 px-4">
                                {settled.map((claim) => (
                                    <ClaimRow key={claim.idClaimId} claim={claim} />
                                ))}
                            </ul>
                        </MarketPanel>
                    ) : null}
                </div>
            )}
        </div>
    );
}

/**
 * One claim.
 *
 * `canReject` and `nextStatus` come from the API, so the buttons here mirror
 * exactly what the server will accept - the screen cannot offer a move that
 * comes back as a 400.
 */
function ClaimRow({
    claim,
    deciding = false,
    busy = false,
    notes = "",
    noteError = "",
    decisionError = "",
    onNotes,
    onDecide,
    onCancel,
    onApprove,
    onReject,
}) {
    // Open means it still needs a decision (Pending or ReadyForClaim) - not
    // that it is ready for collection.
    const isOpen = isOpenClaim(claim.status);
    const isReadyForClaim = claim.status === ID_CLAIM_STATUS.READY_FOR_CLAIM;

    // Approving a Pending claim releases it; approving a released claim marks it
    // handed over. The label says which, because the same button does both.
    const approveLabel =
        claim.status === ID_CLAIM_STATUS.PENDING ? "Release for collection" : "Mark as handed over";

    return (
        <li className={`py-3.5 ${isReadyForClaim ? "border-l-2 border-violet-400 pl-3" : ""}`}>
            <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words text-sm font-semibold text-slate-800">
                    {claim.fullName || "-"}
                </p>

                <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${idClaimStatusTone(claim.status)}`}
                >
                    {idClaimStatusLabel(claim.status)}
                </span>
            </div>

            <p className="mt-0.5 break-words text-xs text-slate-500">
                {claim.accountType || "Student"} · {claim.idNumber || "-"}
                {claim.email ? ` · ${claim.email}` : ""}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-600">
                {claim.claimTypeLabel || idClaimTypeLabel(claim.claimType)} · filed{" "}
                {formatDateTime(claim.createdAt)}
            </p>

            {claim.reason ? (
                <p className="mt-2 break-words rounded-lg border-l-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                    {claim.reason}
                </p>
            ) : null}

            {claim.reviewNotes ? (
                <p className="mt-2 break-words text-xs leading-5 text-slate-500">
                    <span className="font-semibold text-slate-600">Your note: </span>
                    {claim.reviewNotes}
                </p>
            ) : null}

            {claim.claimedAt ? (
                <p className="mt-1 text-xs text-slate-500">
                    Collected {formatDateTime(claim.claimedAt)}
                    {claim.reviewedByName ? ` by ${claim.reviewedByName}` : ""}
                </p>
            ) : null}

            {/* The code the person shows at the counter - staff compare it by eye. */}
            {claim.claimCode && isReadyForClaim ? (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[.14em] text-violet-600">
                        Claim code
                    </span>
                    <span className="select-all font-mono text-lg font-bold tracking-[.2em] text-violet-900">
                        {claim.claimCode}
                    </span>
                </div>
            ) : null}

            {isOpen && !deciding ? (
                <div className="mt-3 flex flex-wrap gap-2">
                    <MarketButton size="sm" onClick={onDecide}>
                        Decide
                    </MarketButton>
                </div>
            ) : null}

            {isOpen && deciding ? (
                <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {decisionError ? (
                        <MarketNotice tone="error" title="Could not update the claim">
                            {decisionError}
                        </MarketNotice>
                    ) : null}

                    <MarketField
                        label="Note"
                        hint="Required to reject. Optional when releasing."
                        error={noteError}
                    >
                        <div>
                            <textarea
                                autoFocus
                                className={`${marketInputClass} min-h-[80px] resize-y`}
                                value={notes}
                                maxLength={NOTE_MAX}
                                onChange={(event) => onNotes(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Escape" && !busy) onCancel();
                                }}
                            />
                            <p className="mt-1 text-right text-[11px] tabular-nums text-slate-400">
                                {notes.length}/{NOTE_MAX}
                            </p>
                        </div>
                    </MarketField>

                    <div className="flex flex-wrap gap-2">
                        <MarketButton size="sm" onClick={onApprove} disabled={busy}>
                            <BadgeCheck size={13} />
                            {busy ? "Saving..." : approveLabel}
                        </MarketButton>

                        {claim.canReject ? (
                            <MarketButton
                                size="sm"
                                variant="danger"
                                onClick={onReject}
                                disabled={busy}
                            >
                                <XCircle size={13} />
                                Reject
                            </MarketButton>
                        ) : null}

                        <MarketButton size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
                            Cancel
                        </MarketButton>
                    </div>
                </div>
            ) : null}
        </li>
    );
}