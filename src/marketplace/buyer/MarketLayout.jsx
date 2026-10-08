import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
    ClipboardList,
    HelpCircle,
    Home,
    ShoppingBag,
    ShoppingCart,
} from "lucide-react";

import { MARKET_HOME_ROUTE, isBuyerRole } from "../session";
import { MARKET_UNAUTHORIZED_EVENT } from "../services/marketApi";
import { AmbientBackground } from "../components/marketUi";
import ModuleBottomNav from "../../components/BottomNavigation/ModuleBottomNav";
import { MarketCartProvider, useMarketCart } from "./marketCartCount";

// =====================================================
// CAMPUSMARKET - buyer shell
//
// Mobile, inside the StudentLayout route group so it already has the PWA and
// device guards. StudentLayout hides the OneServe bottom navigation across
// /marketplace, so this shell supplies its own navigation.
//
// NAVIGATION
// Uses the shared <ModuleBottomNav>, the same component the Library uses: a
// floating card on mobile, a fixed top bar on desktop, and a "Portal" tab that
// leaves the module for the OneServe dashboard. It previously had its own dark
// green header plus a full-width tab bar, which made the store the only module
// in OneServe that looked like it belonged to a different system.
//
// LOG OUT
// Lives in the page content rather than the nav. The nav is shared and
// module-agnostic, so a logout control there would have to be threaded through
// every caller; and the OneServe Profile page (where Log out normally lives) is
// unreachable from inside the store because StudentLayout hides its navigation.
// A small control on the shop screen is the least surprising place for it.
// =====================================================

export default function MarketLayout() {
    return (
        <MarketCartProvider>
            <MarketShell />
        </MarketCartProvider>
    );
}

function MarketShell() {
    const navigate = useNavigate();
    const { count } = useMarketCart();

    useEffect(() => {
        const onUnauthorized = () => navigate("/", { replace: true });
        window.addEventListener(MARKET_UNAUTHORIZED_EVENT, onUnauthorized);
        return () =>
            window.removeEventListener(MARKET_UNAUTHORIZED_EVENT, onUnauthorized);
    }, [navigate]);

    // A Student/Faculty account only. This is a UI courtesy - the server refuses
    // every marketplace call from any other role with a 403 anyway.
    useEffect(() => {
        if (!isBuyerRole()) navigate("/", { replace: true });
    }, [navigate]);

    const items = [
        { label: "Shop", path: MARKET_HOME_ROUTE, icon: Home, end: true },
        {
            label: "Cart",
            path: `${MARKET_HOME_ROUTE}/cart`,
            icon: ShoppingCart,
            badge: count,
        },
        { label: "Orders", path: `${MARKET_HOME_ROUTE}/orders`, icon: ClipboardList },
        { label: "Help", path: `${MARKET_HOME_ROUTE}/chat`, icon: HelpCircle },
    ];

    return (
        <div className="relative min-h-screen bg-[#F7F5EF]">
            {/* The ambient orbs + grid, so the store sits on the same surface as
                the Login page rather than on a flat beige field. */}
            <AmbientBackground />

            <ModuleBottomNav
                items={items}
                brandIcon={ShoppingBag}
                brandTitle="CDM OneServe"
                brandSubtitle="Marketplace"
                homePath={MARKET_HOME_ROUTE}
            />

            {/* Identical spacing to the Library pages, for the same reasons:
                pb-28 clears the floating bar on mobile, md:pt-24 clears the fixed
                top bar on desktop, and mobile needs no top padding because the top
                bar is hidden below md. */}
            <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-24 lg:px-8">
                <ShopHeader />
                <Outlet />
            </main>
        </div>
    );
}

/**
 * The one piece of chrome the shared nav does not cover: what this module is.
 *
 * There is deliberately NO Log out button here. Signing out is a OneServe
 * action, so it belongs to OneServe rather than to every module that borrows the
 * session: the "Portal" tab goes back to the OneServe dashboard, whose own bottom
 * navigation has Home and Profile, and Log out is on the Profile page.
 *
 * The marketplace staff and admin portals DO keep a Log out control, because they
 * are separate shells an operator reaches directly and are not sitting under the
 * OneServe student navigation at all.
 */
function ShopHeader() {
    return (
        <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[.22em] text-[#106A2E]/70">
                CampusMarket
            </p>
            <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-slate-800">
                Shop campus essentials
            </h1>
        </div>
    );
}