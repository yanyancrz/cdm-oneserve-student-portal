import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardList, Store } from "lucide-react";

import { buyerApi, staffApi, setOperatorSessionId } from "../services/marketApi";
import {
    MarketButton,
    MarketNotice,
    MarketPanel,
    marketInputClass,
    marketSelectClass,
} from "../components/marketUi";

/**
 * Operator Session Setup: the screen after a stall login.
 *
 * The account authenticates; the HUMAN is identified here. The entered name
 * is recorded on every inventory update made during the shift - it is
 * attribution, not a credential, and it is never asked for again until the
 * shift ends.
 *
 *   STALL ACCOUNT : the workspace is fixed (shown read-only). Only the name
 *                   is asked.
 *   FLOATING      : Head / legacy personal staff pick the stall or workspace
 *                   they are working, then enter the name.
 */
export default function MarketStaffSessionSetup({ context, onStarted }) {
    const fixed = context?.workspace ?? null;
    const designated = fixed?.operatorName ? fixed : null;

    // When the Head named a designated operator, their name is already
    // filled in - the human on duty just confirms it is really them.
    const [operatorName, setOperatorName] = useState(designated?.operatorName ?? "");
    const [touched, setTouched] = useState(false);
    const [workspaces, setWorkspaces] = useState([]);
    const [workspaceId, setWorkspaceId] = useState("");
    const [loadingLists, setLoadingLists] = useState(!fixed);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (fixed) return undefined;

        let cancelled = false;

        buyerApi
            .workspaces()
            .then((response) => {
                if (cancelled) return;
                setWorkspaces(response.data || []);
            })
            .catch(() => {
                if (!cancelled) setError("Could not load the workspace list.");
            })
            .finally(() => {
                if (!cancelled) setLoadingLists(false);
            });

        return () => {
            cancelled = true;
        };
    }, [fixed]);

    const nameOk = operatorName.trim().length >= 2;
    const workspaceOk = fixed ? true : workspaceId !== "";
    const canContinue = nameOk && workspaceOk && !starting && !loadingLists;

    const start = async () => {
        if (!canContinue) return;

        setStarting(true);
        setError("");

        try {
            const response = await staffApi.startSession({
                operatorName: operatorName.trim(),
                ...(fixed ? {} : { workspaceId: Number(workspaceId) }),
            });

            const session = response.data;
            setOperatorSessionId(session?.sessionId ?? null);
            onStarted(session);
        } catch (err) {
            setError(err.message);
        } finally {
            setStarting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-4 py-10">
            <div className="w-full max-w-md">
                <div className="mb-5 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-white shadow-md">
                        <ClipboardList size={26} aria-hidden="true" />
                    </span>
                    <h1 className="mt-3 text-lg font-bold text-slate-800">
                        Operator Session Setup
                    </h1>
                    <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
                        Signed in. Before the counter opens, say who is on duty -
                        that name is recorded on every stock update this shift.
                    </p>
                </div>

                <MarketPanel>
                    {/* PAALALA - read before the name goes in. What is entered
                        here is stamped on every stock update of this shift. */}
                    <div
                        role="note"
                        className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                            <AlertTriangle size={16} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-amber-900">
                                Paalala bago maglagay ng pangalan
                            </p>
                            <p className="mt-0.5 text-[11px] leading-5 text-amber-800">
                                Ikaw ay naka-login gamit ang stall account. Ilagay
                                ang <strong>buong pangalan ng operator na naka-duty
                                ngayon</strong> - ito ang maitatala sa bawat stock
                                update, benta, at pagsasauli sa shift na ito.
                                Siguraduhing tama ang spelling bago magpatuloy.
                            </p>
                        </div>
                    </div>

                    <label
                        htmlFor="market-operator-name"
                        className="block text-xs font-semibold text-slate-600"
                    >
                        Enter Your Name
                    </label>
                    <input
                        id="market-operator-name"
                        type="text"
                        value={operatorName}
                        onChange={(event) => {
                            setOperatorName(event.target.value);
                            setTouched(true);
                        }}
                        placeholder="Enter the name of the operator on duty"
                        maxLength={120}
                        autoComplete="off"
                        className={`${marketInputClass} mt-1.5`}
                    />

                    {designated && (
                        <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
                            Naka-rehistrong operator dito:{" "}
                            <span className="font-semibold text-slate-700">
                                {designated.operatorName}
                            </span>{" "}
                            <span className="text-slate-400">
                                (ID •••{designated.idLast3})
                            </span>
                            {!touched && (
                                <span className="block text-emerald-700">
                                    Ikaw ba ito? Pindutin na ang Continue. Kung
                                    hindi, palitan ang pangalan sa itaas.
                                </span>
                            )}
                        </p>
                    )}

                    <div className="mt-4">
                        <span className="block text-xs font-semibold text-slate-600">
                            Select Stall or Workspace
                        </span>

                        {fixed ? (
                            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-[#106A2E]/25 bg-[#106A2E]/5 px-3.5 py-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#106A2E] text-white">
                                    <Store size={17} aria-hidden="true" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-bold text-slate-800">
                                        {fixed.name}
                                    </span>
                                    <span className="block text-[11px] text-slate-500">
                                        {fixed.workspaceType === "BusinessHub"
                                            ? "CDM BusinessHub"
                                            : fixed.stallLocationName || "Food stall"}
                                        {" · "}this account operates here only
                                    </span>
                                </span>
                            </div>
                        ) : (
                            <select
                                value={workspaceId}
                                onChange={(event) => setWorkspaceId(event.target.value)}
                                disabled={loadingLists}
                                className={`${marketSelectClass} mt-1.5`}
                            >
                                <option value="">
                                    {loadingLists ? "Loading workspaces..." : "Choose a stall or workspace"}
                                </option>
                                {workspaces.map((workspace) => (
                                    <option key={workspace.workspaceId} value={workspace.workspaceId}>
                                        {workspace.workspaceType === "BusinessHub"
                                            ? workspace.name
                                            : `${workspace.stallLocationName} — ${workspace.name}`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4">
                            <MarketNotice tone="error" title="Could not start the session">
                                {error}
                            </MarketNotice>
                        </div>
                    )}

                    <MarketButton
                        onClick={start}
                        disabled={!canContinue}
                        className="mt-5 w-full justify-center"
                    >
                        {starting ? "Opening workspace..." : "Continue to Workspace"}
                    </MarketButton>

                    <p className="mt-3 text-center text-[11px] leading-4 text-slate-400">
                        The name is an attendance record for this shift, not a
                        second password. End the session to hand over the counter.
                    </p>
                </MarketPanel>
            </div>
        </div>
    );
}
