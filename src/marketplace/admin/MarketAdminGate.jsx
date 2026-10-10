import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

import { adminApi } from "../services/marketApi";
import { getToken } from "../session";
import { AdminNotice } from "../components/marketAdminUi";

/**
 * Confirms the caller is the existing CDM OneServe Admin before the monitoring
 * screens render.
 *
 * The Admin MONITORS. They are not Marketplace Staff and are not a buyer: they
 * cannot order, cannot operate products, stock, orders or chat, and cannot edit
 * or delete any Student/Faculty account through the marketplace. The server has
 * no admin write endpoint in this module at all - this gate only decides which
 * UI to show.
 */
export default function MarketAdminGate({ children }) {
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
                // Any of these endpoints returns 403 for a non-admin, which is
                // exactly the check we need - there is no admin /me in the module.
                await adminApi.overview();
                if (!cancelled) setState("admin");
            } catch (err) {
                if (cancelled) return;

                if (err.status === 401) setState("unauthenticated");
                else if (err.status === 403) setState("forbidden");
                else {
                    // A network or server fault is not a permission decision, so
                    // the screens are shown and will surface their own error.
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
            <div className="flex min-h-screen items-center justify-center bg-[#F4F7F4]">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#106A2E]/20 border-t-[#106A2E]" />
                    <p className="mt-3 text-xs text-gray-400">
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
            <div className="flex min-h-screen items-center justify-center bg-[#F4F7F4] px-4">
                <div className="w-full max-w-md space-y-4">
                    <AdminNotice
                        tone="error"
                        icon={<ShieldAlert size={16} />}
                        title="CDM OneServe Admin access required"
                    >
                        Marketplace monitoring is read-only and available to the OneServe
                        Admin only. Marketplace Staff should use the staff portal, and
                        Student or Faculty accounts should use the store.
                    </AdminNotice>

                    <div className="flex gap-2">
                        <a
                            href="/marketplace/staff"
                            className="flex-1 rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-center text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                        >
                            Staff portal
                        </a>
                        <a
                            href="/admin/dashboard"
                            className="flex-1 rounded-xl bg-[#106A2E] px-4 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-[#0d5a27]"
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