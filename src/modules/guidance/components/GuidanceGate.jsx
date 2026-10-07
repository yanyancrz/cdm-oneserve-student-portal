import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { HeartHandshake, Loader2, ShieldAlert } from "lucide-react";

import { guidanceApi, GUIDANCE_UNAUTHORIZED_EVENT } from "../services/guidanceApi";
import { getToken, getStoredRole, signOut } from "../utils/session";
import { homeRouteForRole, isCounselorRole } from "../config/guidanceRoutes";
import { ACCENTS } from "./GuidanceUi";

const GuidanceContext = createContext(null);

export function useGuidanceMe() {
    const ctx = useContext(GuidanceContext);
    if (!ctx) throw new Error("useGuidanceMe must be used inside <GuidanceGate>.");
    return ctx;
}

// Server-verified route guard. No Guidance login: not signed in -> "/".
// audience="student"   -> Student / Faculty only
// audience="counselor" -> Counselor only
// The wrong role is bounced to its own home (counselor <-> OneServe dashboard).
const loadMe = (audience, signal) =>
    audience === "counselor" ? guidanceApi.getCounselorMe(signal) : guidanceApi.getStudentMe(signal);

export default function GuidanceGate({ audience }) {
    const [state, setState] = useState(() =>
        getToken() ? { status: "loading" } : { status: "unauthenticated" }
    );

    useEffect(() => {
        if (!getToken()) return undefined;

        const controller = new AbortController();

        loadMe(audience, controller.signal)
            .then((me) => setState({ status: "ready", me }))
            .catch((error) => {
                if (error?.name === "AbortError") return;
                if (error?.status === 401) return setState({ status: "unauthenticated" });
                if (error?.status === 403) return setState({ status: "denied", message: error.message });
                setState({ status: "error", message: error?.message });
            });

        const onUnauthorized = () => setState({ status: "unauthenticated" });
        window.addEventListener(GUIDANCE_UNAUTHORIZED_EVENT, onUnauthorized);

        return () => {
            controller.abort();
            window.removeEventListener(GUIDANCE_UNAUTHORIZED_EVENT, onUnauthorized);
        };
    }, [audience]);

    // Re-pulls /me without unmounting the tree (e.g. after an email change).
    const refreshMe = async () => {
        try {
            const me = await loadMe(audience);
            setState({ status: "ready", me });
            return me;
        } catch {
            return null;
        }
    };

    if (state.status === "unauthenticated") return <Navigate to="/" replace />;

    if (state.status === "loading") {
        const accent = audience === "counselor" ? ACCENTS.green : ACCENTS.green;

        return (
            <div
                role="status"
                className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F7F5EF]"
            >
                <div
                    className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${accent.gradient} text-white shadow-lg`}
                >
                    <HeartHandshake size={30} aria-hidden="true" />
                </div>

                <p className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" /> Checking your access...
                </p>
            </div>
        );
    }

    if (state.status === "denied") {
        const role = getStoredRole();
        const wrongSide = isCounselorRole(role) !== (audience === "counselor");

        // Right account, wrong side (e.g. counselor typed /guidance) -> own home.
        if (wrongSide) return <Navigate to={homeRouteForRole(role)} replace />;

        return (
            <Message
                title="Access restricted"
                text={state.message || "Your account cannot open this page."}
                action="Sign out"
                onAction={() => {
                    signOut();
                    window.location.replace("/");
                }}
            />
        );
    }

    if (state.status === "error") {
        return (
            <Message
                title="Can't verify your access"
                text={state.message || "Please try again."}
                action="Retry"
                onAction={() => window.location.reload()}
            />
        );
    }

    return (
        <GuidanceContext.Provider value={{ me: state.me, refreshMe }}>
            <Outlet />
        </GuidanceContext.Provider>
    );
}

function Message({ title, text, action, onAction }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5EF] p-6 text-center">
            <div className="w-full max-w-sm rounded-3xl border border-black/[0.05] bg-white p-6 shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <ShieldAlert size={28} aria-hidden="true" />
                </div>

                <h1 className="mt-4 text-lg font-semibold text-slate-800">{title}</h1>
                <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-slate-500">{text}</p>

                <button
                    type="button"
                    onClick={onAction}
                    className="mt-5 w-full rounded-xl bg-[#106A2E] px-5 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
                >
                    {action}
                </button>
            </div>
        </div>
    );
}