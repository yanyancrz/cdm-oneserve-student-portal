import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
    Bell,
    ClipboardList,
    HandHelping,
    Home,
    SearchCheck,
    UserRound,
} from "lucide-react";

import { LF_UNAUTHORIZED_EVENT, lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE, isLostFoundAdminRole } from "../session";
import { FIND_LOGO_SRC } from "../components/lfBrand";
import LfAssistant from "../components/LfAssistant";
import { AmbientBackground } from "../../components/AmbientBackground";
import ModuleBottomNav from "../../components/BottomNavigation/ModuleBottomNav";

// =====================================================
// LOST & FOUND - user shell
//
// Mobile, inside the StudentLayout route group so it already
// has the PWA and device guards. StudentLayout hides the
// OneServe bottom navigation across /lost-found, so this shell
// supplies its own navigation, exactly like the
// buyer shell does.
//
// The Lost & Found admin is deliberately NOT routed here:
// the console is a desktop surface with its own layout.
// =====================================================

export default function LfLayout() {
    return <LfShell />;
}

function LfShell() {
    const navigate = useNavigate();
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        const onUnauthorized = () => navigate("/", { replace: true });
        window.addEventListener(LF_UNAUTHORIZED_EVENT, onUnauthorized);
        return () =>
            window.removeEventListener(LF_UNAUTHORIZED_EVENT, onUnauthorized);
    }, [navigate]);

    // Unread badge for the Alerts tab. A failure here must never
    // break the shell - the tab simply shows without a count.
    useEffect(() => {
        let cancelled = false;

        const loadUnread = async () => {
            try {
                const response = await lfApi.unreadCount();
                if (!cancelled) setUnread(Number(response.data?.count ?? response.data ?? 0) || 0);
            } catch {
                if (!cancelled) setUnread(0);
            }
        };

        loadUnread();
        const timer = window.setInterval(loadUnread, 60000);
        window.addEventListener("focus", loadUnread);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
            window.removeEventListener("focus", loadUnread);
        };
    }, []);

    // A module owner has their own console; a OneServe admin
    // monitors from the admin console. Both are redirected out
    // of the student surface. This is a UI courtesy - the API
    // refuses anything else on a per-endpoint basis anyway.
    useEffect(() => {
        if (isLostFoundAdminRole()) navigate("/lost-found/admin", { replace: true });
    }, [navigate]);

    const items = [
        { label: "Home", path: LOST_FOUND_HOME_ROUTE, icon: Home, end: true },
        {
            label: "Browse",
            path: `${LOST_FOUND_HOME_ROUTE}/browse`,
            icon: SearchCheck,
        },
        {
            label: "My Items",
            path: `${LOST_FOUND_HOME_ROUTE}/my-items`,
            icon: ClipboardList,
        },
        {
            label: "Claims",
            path: `${LOST_FOUND_HOME_ROUTE}/claims`,
            icon: HandHelping,
        },
        {
            label: "Matches",
            path: `${LOST_FOUND_HOME_ROUTE}/matches`,
            icon: UserRound,
        },
        {
            label: "Alerts",
            path: `${LOST_FOUND_HOME_ROUTE}/notifications`,
            icon: Bell,
            badge: unread,
        },
    ];

    return (
        <div className="relative min-h-screen bg-[#F7F5EF]">
            <AmbientBackground />

            <ModuleBottomNav
                items={items}
                brandIcon={SearchCheck}
                brandImage={FIND_LOGO_SRC}
                brandTitle="CDM OneServe"
                brandSubtitle="Lost & Found"
                homePath={LOST_FOUND_HOME_ROUTE}
            />

            <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-24 lg:px-8">
                <LfHeader />
                <Outlet />
            </main>

            {/* FIND helper on every user page. */}
            <LfAssistant />
        </div>
    );
}

/** What this module is - the FIND mark plus the one-line promise. */
function LfHeader() {
    return (
        <div className="mb-4 flex items-center gap-3">
            <img
                src={FIND_LOGO_SRC}
                alt="FIND - Found Item & Notification Desk"
                onError={(event) => {
                    event.currentTarget.style.display = "none";
                }}
                className="h-12 w-12 shrink-0 rounded-2xl bg-[#0B0B0B] object-contain shadow-sm ring-1 ring-black/10"
            />
            <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[.22em] text-[#106A2E]/70">
                    FIND · Found Item &amp; Notification Desk
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
                    Report, find, and recover campus items
                </h1>
            </div>
        </div>
    );
}
