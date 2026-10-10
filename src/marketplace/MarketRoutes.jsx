import { useEffect, useState } from "react";
import { Navigate, Outlet, Route } from "react-router-dom";

import { Monitor } from "lucide-react";

import PWAInstallGuard from "./../components/PWAInstallGuard/PWAInstallGuard";
import DeviceRestriction from "./../components/DeviceRestriction/DeviceRestriction";

import MarketLayout from "./buyer/MarketLayout";
import MarketShopPage from "./buyer/MarketShopPage";
import MarketCartPage from "./buyer/MarketCartPage";
import MarketCheckoutPage from "./buyer/MarketCheckoutPage";
import MarketOrdersPage from "./buyer/MarketOrdersPage";
import MarketChatPage from "./buyer/MarketChatPage";
import MarketStaffLayout from "./staff/MarketStaffLayout";
import MarketStaffGate from "./staff/MarketStaffGate";
import MarketStaffDashboard from "./staff/MarketStaffDashboard";
import MarketStaffOrdersPage from "./staff/MarketStaffOrdersPage";
import MarketStaffDeliveriesPage from "./staff/MarketStaffDeliveriesPage";
import MarketStaffProductsPage from "./staff/MarketStaffProductsPage";
import MarketStaffInventoryPage from "./staff/MarketStaffInventoryPage";
import MarketStaffLocationsPage from "./staff/MarketStaffLocationsPage";
import MarketStaffChatPage from "./staff/MarketStaffChatPage";
import MarketStaffTransactionsPage from "./staff/MarketStaffTransactionsPage";
import MarketStaffSettingsPage from "./staff/MarketStaffSettingsPage";
import MarketStaffAccountsPage from "./staff/MarketStaffAccountsPage";
import MarketStaffWorkspacesPage from "./staff/MarketStaffWorkspacesPage";
import MarketStaffAuditPage from "./staff/MarketStaffAuditPage";
import { useIsMarketHead } from "./staff/MarketStaffGate";
import MarketAdminGate from "./admin/MarketAdminGate";
import MarketAdminLayout from "./admin/MarketAdminLayout";
import MarketAdminOverview from "./admin/MarketAdminOverview";
import MarketAdminAccounts from "./admin/MarketAdminAccounts";
import MarketAdminTransactions from "./admin/MarketAdminTransactions";
import MarketAdminAnalytics from "./admin/MarketAdminAnalytics";

// =====================================================
// CAMPUSMARKET routes
//
// Three separate portals, kept deliberately apart:
//
//   /marketplace/*        BUYER  - Student / Faculty. Inside StudentLayout, so it
//                                  inherits the PWA + mobile guards and is
//                                  reached from the OneServe dashboard card.
//
//   /marketplace/staff/*  STAFF  - a marketplace operator. ANY DEVICE, because
//                                  the counter is run from a phone. The MARKETPLACE
//                                  HEAD (module owner, Admin > Users "Add Head") uses
//                                  the same portal but is desktop-only, because that
//                                  half is the supervisory console.
//
//   /marketplace/admin/*  MONITOR - the existing CDM OneServe Admin. Desktop.
//                                  Read-only: the marketplace API exposes no admin
//                                  write endpoint at all.
//
// There is no /marketplace/login. The shared "/" login issues the one JWT and
// each portal asks the server who the caller is.
// =====================================================

// ---------- BUYER ----------
// Rendered inside the StudentLayout group in App.jsx, so the OneServe guards and
// background already apply. MarketLayout only guards the role and adds its own
// bottom tabs.

export const marketBuyerRoutes = (
    <Route path="/marketplace" element={<MarketLayout />}>
        <Route index element={<MarketShopPage />} />
        <Route path="product/:productId" element={<MarketShopPage />} />
        <Route path="cart" element={<MarketCartPage />} />
        <Route path="checkout" element={<MarketCheckoutPage />} />
        <Route path="orders" element={<MarketOrdersPage />} />
        <Route path="orders/:orderId" element={<MarketOrdersPage />} />
        <Route path="chat" element={<MarketChatPage />} />
    </Route>
);

// ---------- STAFF ----------
// PWA, then the server check for a marketplace_staff row.
//
// NO DeviceRestriction here on purpose: the ONE Marketplace Staff account works
// on any device. The staff member runs the counter on a phone in the morning and
// the inventory list on a desktop in the afternoon, and locking them to one
// device would block that. MarketStaffLayout is responsive for the same reason -
// a scrolling nav bar on small screens, a sidebar from lg up.

export const marketStaffRoutes = (
    <Route
        element={
            <PWAInstallGuard>
                <MarketStaffGate>
                    <MarketStaffLayout />
                </MarketStaffGate>
            </PWAInstallGuard>
        }
    >
        <Route path="/marketplace/staff" element={<MarketStaffDashboard />} />

        {/* Counter screens: operators only. The Head administers stalls and
            accounts instead (see below), so even a typed URL bounces back. */}
        <Route element={<RequireOperator />}>
            <Route path="/marketplace/staff/orders" element={<MarketStaffOrdersPage />} />
            <Route path="/marketplace/staff/orders/:orderId" element={<MarketStaffOrdersPage />} />
            <Route path="/marketplace/staff/deliveries" element={<MarketStaffDeliveriesPage />} />
            <Route path="/marketplace/staff/products" element={<MarketStaffProductsPage />} />
            <Route path="/marketplace/staff/inventory" element={<MarketStaffInventoryPage />} />
            <Route path="/marketplace/staff/locations" element={<MarketStaffLocationsPage />} />
            <Route path="/marketplace/staff/chat" element={<MarketStaffChatPage />} />
            <Route path="/marketplace/staff/chat/:conversationId" element={<MarketStaffChatPage />} />
            <Route path="/marketplace/staff/transactions" element={<MarketStaffTransactionsPage />} />
            <Route path="/marketplace/staff/settings" element={<MarketStaffSettingsPage />} />
        </Route>

        {/* Head only, and desktop only.
            The wrapper keeps an operator out even if they type the URL, though the
            server refuses every one of these calls with a 403 anyway. */}
        <Route element={<RequireMarketHead />}>
            <Route element={<RequireDesktopForHead />}>
                <Route
                    path="/marketplace/staff/accounts"
                    element={<MarketStaffAccountsPage />}
                />
                <Route
                    path="/marketplace/staff/workspaces"
                    element={<MarketStaffWorkspacesPage />}
                />
                <Route
                    path="/marketplace/staff/audit"
                    element={<MarketStaffAuditPage />}
                />
            </Route>
        </Route>
    </Route>
);

// Keeps an operator out of the Head-only screens.
//
// This is a routing convenience, not the security boundary: the API refuses every
// /api/marketplace/head/* call from a non-Head with a 403, so bypassing this
// component still gets nothing.
function RequireMarketHead() {
    const isHead = useIsMarketHead();

    return isHead ? <Outlet /> : <Navigate to="/marketplace/staff" replace />;
}

// Keeps the Head out of the day-to-day counter screens.
//
// The Head administers (stalls, accounts, operators, audit) and does not run
// inventory, products or orders - those belong to the stall operators. Like
// RequireMarketHead this is a routing convenience: the API is unchanged.
function RequireOperator() {
    const isHead = useIsMarketHead();

    return isHead ? <Navigate to="/marketplace/staff" replace /> : <Outlet />;
}

// The Marketplace Head is a supervisor, and the portal is desktop only for them.
//
// WHY A GUARD INSIDE THE ROUTE rather than DeviceRestriction
// An operator must reach the counter from a phone, so the staff routes cannot be
// wrapped in a desktop restriction. Putting the check here instead lets the two
// roles share one route tree and one layout while still enforcing the device rule
// per role. It also lets the message name the Head, instead of the generic
// "the CDM OneServe admin portal" wording DeviceRestriction shows.
//
// This is UX, not security: every /api/marketplace/head/* call is refused from a
// non-Head with a 403, and a Head on a tablet still gets a working API.
function RequireDesktopForHead() {
    const isHead = useIsMarketHead();
    const [isMobile, setIsMobile] = useState(null);

    useEffect(() => {
        if (import.meta.env.DEV) {
            // Local development has no real device constraint, same as
            // DeviceRestriction does.
            setIsMobile(false);
            return undefined;
        }

        const detect = () => {
            const agent = navigator.userAgent || navigator.vendor || "";
            setIsMobile(/Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(agent));
        };

        detect();
        window.addEventListener("resize", detect);

        return () => window.removeEventListener("resize", detect);
    }, []);

    // Only the Head is restricted. Everyone else falls through untouched.
    if (!isHead || isMobile === false) return <Outlet />;

    if (isMobile === null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#106A2E]/20 border-t-[#106A2E]" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-4">
            <div className="w-full max-w-md rounded-[24px] border border-[#0E3B22]/10 bg-white p-7 text-center shadow-xl shadow-black/5">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-white shadow-lg">
                    <Monitor size={26} />
                </div>

                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#106A2E]/60">
                    CampusMarket
                </p>

                <h1 className="mt-1.5 text-lg font-bold text-slate-800">
                    Desktop Required
                </h1>

                <p className="mt-2.5 text-sm leading-6 text-slate-500">
                    The Marketplace Head console is for desktop and laptop. Use one to
                    manage stalls, stall logins and operators, and to review the
                    activity log.
                </p>

                <div className="mt-5 rounded-2xl bg-[#106A2E]/5 p-4 text-left">
                    <p className="text-sm font-semibold text-slate-800">
                        Two different rules, on purpose
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-500">
                        <li>
                            <span className="font-semibold text-[#106A2E]">
                                Marketplace Head
                            </span>{" "}
                            &mdash; desktop only, because this is the supervisory
                            console.
                        </li>
                        <li>
                            <span className="font-semibold text-[#106A2E]">
                                Marketplace Staff
                            </span>{" "}
                            &mdash; any device, so the counter works from a phone.
                        </li>
                    </ul>
                </div>

                <a
                    href="/"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#106A2E] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0E3B22]"
                >
                    Go to login
                </a>
            </div>
        </div>
    );
}

// ---------- ADMIN MONITORING ----------
// Desktop, PWA, OneServe Admin role, then a shared monitoring shell.

export const marketAdminRoutes = (
    <Route
        element={
            <PWAInstallGuard>
                <DeviceRestriction type="desktop">
                    <MarketAdminGate>
                        <MarketAdminLayout />
                    </MarketAdminGate>
                </DeviceRestriction>
            </PWAInstallGuard>
        }
    >
        <Route path="/marketplace/admin" element={<MarketAdminOverview />} />
        <Route path="/marketplace/admin/accounts" element={<MarketAdminAccounts />} />
        <Route path="/marketplace/admin/transactions" element={<MarketAdminTransactions />} />
        <Route path="/marketplace/admin/analytics" element={<MarketAdminAnalytics />} />
    </Route>
);
