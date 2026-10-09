import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
    Bell,
    ClipboardList,
    HandHelping,
    Home,
    SearchCheck,
    UserRound,
} from "lucide-react";

import { LF_UNAUTHORIZED_EVENT } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE, isLostFoundAdminRole } from "../session";
import { AmbientBackground } from "../../marketplace/components/marketUi";
import ModuleBottomNav from "../../components/BottomNavigation/ModuleBottomNav";

// =====================================================
// LOST & FOUND - user shell
//
// Mobile, inside the StudentLayout route group so it already
// has the PWA and device guards. StudentLayout hides the
// OneServe bottom navigation across /lost-found, so this shell
// supplies its own navigation, exactly like the marketplace
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

    useEffect(() => {
        const onUnauthorized = () => navigate("/", { replace: true });
        window.addEventListener(LF_UNAUTHORIZED_EVENT, onUnauthorized);
        return () =>
            window.removeEventListener(LF_UNAUTHORIZED_EVENT, onUnauthorized);
    }, [navigate]);

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
        },
    ];

    return (
        <div className="relative min-h-screen bg-[#F7F5EF]">
            <AmbientBackground />

            <ModuleBottomNav
                items={items}
                brandIcon={SearchCheck}
                brandTitle="CDM OneServe"
                brandSubtitle="Lost & Found"
                homePath={LOST_FOUND_HOME_ROUTE}
            />

            <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-24 lg:px-8">
                <LfHeader />
                <Outlet />
            </main>
        </div>
    );
}

/** What this module is - the one piece of chrome the shared nav does not cover. */
function LfHeader() {
    return (
        <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[.22em] text-[#106A2E]/70">
                Lost &amp; Found
            </p>
            <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-slate-800">
                Report, find, and recover campus items
            </h1>
        </div>
    );
}
