import { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { headApi, setOperatorSessionId, staffApi } from "../services/marketApi";
import { MARKET_STAFF_HOME_ROUTE, getToken } from "../session";
import { MarketNotice } from "../components/marketUi";
import MarketStaffSessionSetup from "./MarketStaffSessionSetup";

/**
 * Who is using the staff portal, so the layout can render the Staff Accounts
 * link for the Head and hide it from an operator. The session is the active
 * duty shift (operator name + workspace), refreshed whenever one starts.
 */
export const MarketStaffRoleContext = createContext({
    isHead: false,
    session: null,
    refreshSession: () => {},
});

export function useIsMarketHead() {
    return useContext(MarketStaffRoleContext).isHead;
}

export function useMarketSession() {
    return useContext(MarketStaffRoleContext);
}

/**
 * Confirms the caller may use the marketplace staff portal.
 *
 * TWO roles get in, matching how the rest of OneServe is organised:
 *
 *   OPERATOR  a staff account (marketplace_staff). Runs products, stock, orders,
 *             deliveries and chat.
 *   HEAD      the Marketplace Head - Role 'MarketplaceAdmin', AdminModule
 *             'Marketplace', created in Admin > Users "Add Head". A SUPERSET of
 *             staff: can operate everything, and is the only role that also sees
 *             the Staff Accounts screen.
 *
 * Neither is a guess. Staff is a row in marketplace_staff and Head is a OneServe
 * role, so the marketplace is asked directly.
 *
 * WHO IS REFUSED
 * The CDM OneServe Admin - they monitor from /marketplace/admin, read-only, and
 * are explicitly not staff. Buyers too: they belong in the store, not the counter.
 */
export default function MarketStaffGate({ children }) {
    const [state, setState] = useState("loading");
    const [isHead, setIsHead] = useState(false);
    const [context, setContext] = useState(null);

    const loadSessionContext = async () => {
        try {
            const response = await staffApi.sessionContext();
            const data = response?.data ?? null;
            setContext(data);

            // The server is the source of truth: a stale id in storage is
            // replaced, and an ended shift drops back to the setup screen.
            setOperatorSessionId(data?.session?.sessionId ?? null);

            if (data?.hasActiveSession) {
                setState("allowed");
            } else {
                setState("setup");
            }
        } catch {
            setState("setup");
        }
    };

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            if (!getToken()) {
                setState("unauthenticated");
                return;
            }

            // Staff first: an operator should not pay for a second round trip
            // just to find out they are not a Head.
            try {
                const response = await staffApi.me();
                if (cancelled) return;

                if (response?.data?.isStaff) {
                    setIsHead(false);
                    await loadSessionContext();
                    return;
                }
            } catch {
                // 403 here only means "not staff" - the Head check decides below.
            }

            try {
                const head = await headApi.me();
                if (cancelled) return;

                if (head?.data?.isHead) {
                    setIsHead(true);
                    await loadSessionContext();
                    return;
                }

                setState("forbidden");
            } catch (error) {
                if (cancelled) return;

                // The API layer has already cleared the session on a 401.
                setState(error?.status === 401 ? "unauthenticated" : "forbidden");
            }
        };

        check();
        return () => {
            cancelled = true;
        };
    }, []);

    if (state === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF]">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#106A2E]/20 border-t-[#106A2E]" />
                    <p className="mt-3 text-xs text-slate-400">
                        Checking marketplace access...
                    </p>
                </div>
            </div>
        );
    }

    if (state === "unauthenticated") {
        return <Navigate to="/" replace />;
    }

    if (state === "forbidden") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-4">
                <div className="w-full max-w-md space-y-4">
                    <MarketNotice
                        tone="error"
                        icon={<ShieldAlert size={16} />}
                        title="Marketplace access required"
                    >
                        This account is not a Marketplace operator. The staff portal is
                        for Marketplace Staff and the Marketplace Head only.
                    </MarketNotice>

                    <div className="flex gap-2">
                        <a
                            href={MARKET_STAFF_HOME_ROUTE}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-semibold text-slate-600"
                        >
                            Try again
                        </a>
                        <a
                            href="/"
                            className="flex-1 rounded-xl bg-[#106A2E] px-4 py-2.5 text-center text-xs font-semibold text-white"
                        >
                            Go to login
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (state === "setup") {
        return (
            <MarketStaffSessionSetup
                context={context}
                onStarted={() => {
                    setState("allowed");
                    loadSessionContext();
                }}
            />
        );
    }

    return (
        <MarketStaffRoleContext.Provider
            value={{
                isHead,
                session: context?.session ?? null,
                workspace: context?.workspace ?? null,
                refreshSession: loadSessionContext,
            }}
        >
            {children}
        </MarketStaffRoleContext.Provider>
    );
}