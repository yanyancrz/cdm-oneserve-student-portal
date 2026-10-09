import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

import { lfAdminApi } from "../services/lfApi";
import { getToken } from "../session";
import { LfNotice } from "../components/lfUi";

/**
 * Confirms the caller is the Lost & Found admin before the
 * console renders.
 *
 * The check is a real API call: the stats endpoint answers
 * 403 for every role except LostFoundAdmin (and OneServe's
 * built-in Admin / SuperAdmin, who administer every module).
 * A network fault is not a permission decision, so the
 * screens render and surface their own error instead.
 */
export default function LfAdminGate({ children }) {
    const location = useLocation();
    const [state, setState] = useState("loading");

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            if (!getToken()) {
                setState("unauthenticated");
                return;
            }

            try {
                await lfAdminApi.stats();
                if (!cancelled) setState("admin");
            } catch (err) {
                if (cancelled) return;

                if (err.status === 401) setState("unauthenticated");
                else if (err.status === 403) setState("forbidden");
                else {
                    toast.error(err.message);
                    setState("admin");
                }
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
                        Checking admin access...
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
                    <LfNotice tone="bad">
                        <span className="flex items-center gap-2 font-semibold">
                            <ShieldAlert size={16} aria-hidden="true" />
                            Lost &amp; Found admin access required
                        </span>
                        <span className="mt-1 block">
                            The Lost &amp; Found console is for the module owner.
                            The OneServe Admin can also reach it, but Student and
                            Faculty accounts should use the report board.
                        </span>
                    </LfNotice>

                    <div className="flex gap-2">
                        <a
                            href="/lost-found"
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-semibold text-slate-600"
                        >
                            Report board
                        </a>
                        <a
                            href="/admin/dashboard"
                            className="flex-1 rounded-xl bg-[#106A2E] px-4 py-2.5 text-center text-xs font-semibold text-white"
                        >
                            OneServe admin
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return <div key={location.pathname}>{children}</div>;
}
