import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, Check, Copy, IdCard, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import { campusApi } from "../services/marketApi";
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
    ID_CLAIM_TYPES,
    idClaimStatusLabel,
    idClaimStatusTone,
    idClaimTypeLabel,
    isOpenClaim,
} from "../config/marketVocabulary";
import { formatDateTime } from "../utils/format";

const REASON_MAX = 500;

/** Filed -> Ready for claim -> Collected. Only open claims are shown here, so "Collected" is always ahead. */
const STEPS = ["Filed", "Ready for claim", "Collected"];

function StatusBadge({ status }) {
    return (
        <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${idClaimStatusTone(status)}`}
        >
            {idClaimStatusLabel(status)}
        </span>
    );
}

function ClaimProgress({ status }) {
    const current = status === ID_CLAIM_STATUS.READY_FOR_CLAIM ? 1 : 0;

    return (
        <ol className="flex items-start" aria-label="Claim progress">
            {STEPS.map((label, index) => {
                const done = index < current;
                const active = index === current;
                const isLast = index === STEPS.length - 1;

                return (
                    <li
                        key={label}
                        className={`flex flex-col ${
                            isLast ? "flex-none items-end text-right" : "flex-1 items-start text-left"
                        }`}
                    >
                        <div className={`flex w-full items-center ${isLast ? "justify-end" : ""}`}>
                            <span
                                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                                    done
                                        ? "bg-violet-600 text-white"
                                        : active
                                          ? "border-2 border-violet-600 bg-white text-violet-700"
                                          : "border border-slate-200 bg-white text-slate-400"
                                }`}
                                aria-current={active ? "step" : undefined}
                            >
                                {done ? <Check size={13} /> : index + 1}
                            </span>

                            {index < STEPS.length - 1 ? (
                                <span
                                    className={`mx-1 h-0.5 flex-1 rounded ${done ? "bg-violet-600" : "bg-slate-200"}`}
                                />
                            ) : null}
                        </div>

                        <span
                            className={`mt-1.5 text-[11px] font-medium ${
                                active ? "text-violet-700" : done ? "text-slate-600" : "text-slate-400"
                            }`}
                        >
                            {label}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function ClaimCode({ code }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            toast.success("Claim code copied.");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Could not copy. Please write the code down instead.");
        }
    };

    return (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-violet-600">Claim code</p>
            <p className="mt-1 select-all break-all font-mono text-2xl font-bold tracking-[.2em] text-violet-900 sm:text-3xl">
                {code}
            </p>
            <button
                type="button"
                onClick={copy}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy code"}
            </button>
        </div>
    );
}

/**
 * The buyer's campus ID claims: file one, and follow it to collection.
 *
 * Filing is deliberately a form rather than a link elsewhere - a lost ID is
 * urgent and the person should not have to find the right screen first.
 *
 * Only one claim may be open at a time. The server enforces that with a UNIQUE
 * index, so the "you already have one open" case is a real 409 here, not a
 * client-side guess. When it happens the list is refreshed silently, which
 * swaps the form for the open claim the person should be looking at.
 */
export default function MarketIdClaimsPage() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [claimType, setClaimType] = useState("Replacement");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reasonError, setReasonError] = useState("");
    const [submitError, setSubmitError] = useState("");

    const mountedRef = useRef(true);
    const formRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    /**
     * One loader for first load and refreshes. `silent` keeps the page on screen
     * (no skeleton flash) so a form error or the new claim never gets wiped out
     * mid-submit.
     */
    const load = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        setError("");

        try {
            const response = await campusApi.myIdClaims();
            if (mountedRef.current) setClaims(response.data || []);
        } catch (err) {
            if (mountedRef.current) setError(err.message);
        } finally {
            if (mountedRef.current && !silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const open = claims.find((claim) => isOpenClaim(claim.status));
    const pastClaims = claims.filter((claim) => claim !== open);
    const selected = ID_CLAIM_TYPES.find((option) => option.value === claimType);
    const needsReason = selected?.needsReason === true;

    const submit = async (event) => {
        event.preventDefault();
        setReasonError("");
        setSubmitError("");

        if (needsReason && !reason.trim()) {
            setReasonError("Please tell us what happened to your ID.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await campusApi.fileIdClaim({
                claimType,
                reason: reason.trim() || null,
            });

            toast.success(response.message || "Your ID claim was filed.");

            setClaimType("Replacement");
            setReason("");
            await load({ silent: true });
        } catch (err) {
            if (err.status === 409) {
                // An open claim already exists. The form is about to be replaced
                // by it, so say so with a toast the person will actually see.
                toast.error(err.message);
                await load({ silent: true });
            } else {
                setSubmitError(err.message);
            }
        } finally {
            if (mountedRef.current) setSubmitting(false);
        }
    };

    const focusForm = () => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        formRef.current?.querySelector("input")?.focus({ preventScroll: true });
    };

    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={4} />
            </MarketPanel>
        );
    }

    return (
        <div className="space-y-4">
            {error ? (
                <MarketNotice tone="error" title="Could not load your ID claims">
                    {error}
                </MarketNotice>
            ) : null}

            {open ? (
                /* One panel for the claim that matters: progress, code, and what to do next. */
                <MarketPanel
                    title="Your current claim"
                    subtitle={`${idClaimTypeLabel(open.claimType)} · filed ${formatDateTime(open.createdAt)}`}
                >
                    <div className="space-y-4 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <StatusBadge status={open.status} />
                        </div>

                        <ClaimProgress status={open.status} />

                        {open.status === ID_CLAIM_STATUS.READY_FOR_CLAIM && open.claimCode ? (
                            <ClaimCode code={open.claimCode} />
                        ) : null}

                        {open.status === ID_CLAIM_STATUS.PENDING ? (
                            <MarketNotice tone="info" title="Waiting for the registrar">
                                Your claim is in the queue. You will get a claim code here once it is
                                released for collection.
                            </MarketNotice>
                        ) : null}

                        {open.status === ID_CLAIM_STATUS.READY_FOR_CLAIM ? (
                            <MarketNotice tone="good" title="Bring this code to collect" icon={<BadgeCheck size={14} />}>
                                Show the code above at the registrar. They will mark the ID as handed
                                over.
                            </MarketNotice>
                        ) : null}

                        {open.reviewNotes ? (
                            <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                                <span className="font-semibold text-slate-700">Note from the registrar: </span>
                                {open.reviewNotes}
                            </p>
                        ) : null}

                        <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                            One claim at a time. You can file a new one once this is collected or
                            rejected.
                        </p>
                    </div>
                </MarketPanel>
            ) : (
                <MarketPanel
                    title="Request a campus ID"
                    subtitle="Replacement, lost, damaged, or your first ID."
                >
                    <form ref={formRef} onSubmit={submit} className="space-y-4 p-4" noValidate>
                        {submitError ? (
                            <MarketNotice tone="error" title="Could not file your claim">
                                {submitError}
                            </MarketNotice>
                        ) : null}

                        <fieldset className="space-y-2">
                            <legend className="mb-1 text-xs font-semibold text-slate-700">
                                What is this for?
                            </legend>

                            <div className="grid gap-2 sm:grid-cols-2">
                                {ID_CLAIM_TYPES.map((option) => {
                                    const checked = option.value === claimType;

                                    return (
                                        <label
                                            key={option.value}
                                            className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                                                checked
                                                    ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="claimType"
                                                value={option.value}
                                                checked={checked}
                                                onChange={() => {
                                                    setClaimType(option.value);
                                                    setReasonError("");
                                                    setSubmitError("");
                                                }}
                                                className="mt-0.5 h-4 w-4 shrink-0 accent-violet-600"
                                            />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-semibold text-slate-800">
                                                    {option.label}
                                                </span>
                                                {option.hint ? (
                                                    <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                                                        {option.hint}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <MarketField
                            label={needsReason ? "What happened?" : "Details (optional)"}
                            hint={
                                needsReason
                                    ? "Required for a lost or damaged ID."
                                    : "Anything that helps the registrar."
                            }
                            error={reasonError}
                        >
                            <div>
                                <textarea
                                    className={`${marketInputClass} min-h-[96px] resize-y`}
                                    value={reason}
                                    maxLength={REASON_MAX}
                                    placeholder={
                                        needsReason ? "Lost it in the canteen last Tuesday." : ""
                                    }
                                    onChange={(event) => {
                                        setReason(event.target.value);
                                        setReasonError("");
                                    }}
                                />
                                <p className="mt-1 text-right text-[11px] tabular-nums text-slate-400">
                                    {reason.length}/{REASON_MAX}
                                </p>
                            </div>
                        </MarketField>

                        <div className="[&>button]:w-full sm:[&>button]:w-auto">
                            <MarketButton type="submit" disabled={submitting}>
                                {submitting ? "Filing..." : "File ID claim"}
                            </MarketButton>
                        </div>
                    </form>
                </MarketPanel>
            )}

            {claims.length === 0 ? (
                <MarketPanel title="Claim history" subtitle="Everything you have filed.">
                    <div className="p-4">
                        <MarketEmpty
                            icon={<IdCard size={20} />}
                            title="No ID claims yet"
                            hint="File one above if you need a replacement or your first ID."
                            action={
                                <MarketButton variant="secondary" onClick={focusForm}>
                                    <IdCard size={13} />
                                    File a claim
                                </MarketButton>
                            }
                        />
                    </div>
                </MarketPanel>
            ) : pastClaims.length > 0 ? (
                <MarketPanel
                    title={open ? "Past claims" : "Claim history"}
                    subtitle={open ? "Earlier claims you have filed." : "Everything you have filed."}
                    action={
                        <MarketButton variant="secondary" onClick={() => load({ silent: true })}>
                            <RefreshCw size={13} />
                            Refresh
                        </MarketButton>
                    }
                >
                    <ul className="divide-y divide-slate-100 px-4">
                        {pastClaims.map((claim) => (
                            <li
                                key={claim.idClaimId}
                                className="flex items-start justify-between gap-3 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-700">
                                        {claim.claimTypeLabel || idClaimTypeLabel(claim.claimType)}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Filed {formatDateTime(claim.createdAt)}
                                        {claim.claimedAt
                                            ? ` · Collected ${formatDateTime(claim.claimedAt)}`
                                            : ""}
                                    </p>
                                    {claim.reviewNotes ? (
                                        <p className="mt-1 text-xs leading-4 text-slate-500">
                                            {claim.reviewNotes}
                                        </p>
                                    ) : null}
                                </div>

                                <StatusBadge status={claim.status} />
                            </li>
                        ))}
                    </ul>
                </MarketPanel>
            ) : null}
        </div>
    );
}