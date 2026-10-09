import { Outlet } from "react-router-dom";
import {
    Boxes,
    ClipboardList,
    LayoutDashboard,
    MapPin,
    MessageCircle,
    Package,
    Receipt,
    Settings,
    Truck,
    Users,
} from "lucide-react";

import { useIsMarketHead } from "./MarketStaffGate";
import ModuleBottomNav from "../../components/BottomNavigation/ModuleBottomNav";

// =====================================================
// CAMPUSMARKET staff shell
//
// Any device - a phone at the counter, a desktop for the inventory list.
//
// ONE portal serves both marketplace roles, the same way the Library portal
// serves both Library Admin and Library Staff:
//
//   OPERATOR  a staff account. Everything below except Staff Accounts.
//   HEAD      the Marketplace Head (Admin > Users > Add Head). A superset of
//             staff: everything below, plus Staff Accounts.
//
// Staff Accounts is filtered out for an operator, so the Head-only screen is
// never even rendered for someone who cannot use it.
//
// The CDM OneServe Admin has no link into this portal: they monitor from
// /marketplace/admin instead.
//
// NAVIGATION - the same shared <ModuleBottomNav> the guidance user page, the
// Library, and the marketplace buyer store use: a floating pill on mobile, a
// fixed top bar on desktop, a "Portal" tab that leaves the module. It
// previously had its own desktop sidebar plus a green mobile header and a
// scrolling strip - one module, so one bar.
// =====================================================

const NAV = [
    // The first three stay as pill tabs on mobile; the rest go behind "More".
    { to: "/marketplace/staff", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/marketplace/staff/orders", label: "Orders", icon: ClipboardList },
    { to: "/marketplace/staff/products", label: "Products", icon: Package },
    // Overflow
    { to: "/marketplace/staff/deliveries", label: "Deliveries", icon: Truck },
    { to: "/marketplace/staff/inventory", label: "Inventory", icon: Boxes },
    { to: "/marketplace/staff/locations", label: "Locations", icon: MapPin },
    { to: "/marketplace/staff/chat", label: "Chat", icon: MessageCircle },
    { to: "/marketplace/staff/transactions", label: "Transactions", icon: Receipt },
    { to: "/marketplace/staff/settings", label: "Settings", icon: Settings },
    // Head only.
    { to: "/marketplace/staff/accounts", label: "Staff Accounts", icon: Users, headOnly: true },
];

/** Drops the Head-only entries when the caller is an operator. */
function useVisibleNav() {
    const isHead = useIsMarketHead();
    return NAV.filter((item) => !item.headOnly || isHead);
}

export default function MarketStaffLayout() {
    const nav = useVisibleNav();

    const items = nav.map((item) => ({
        label: item.label,
        path: item.to,
        icon: item.icon,
        end: item.end,
    }));

    return (
        <div className="relative min-h-screen bg-[#F7F5EF]">
            <ModuleBottomNav
                items={items}
                brandIcon={Package}
                brandTitle="CDM OneServe"
                brandSubtitle="Staff"
                homePath="/marketplace/staff"
            />

            {/* pb-28 clears the floating pill on mobile; md:pt-24 clears the
                fixed top bar on desktop. Same spacing the Library, guidance and
                buyer store pages use. */}
            <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-24 lg:px-8">
                <Outlet />
            </main>
        </div>
    );
}

export function StaffPageHeader({ title, subtitle, action }) {
    return (
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
                <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-[#106A2E]/50">
                    CampusMarket Staff
                </p>
                <h1 className="mt-0.5 text-lg font-semibold text-slate-800 sm:text-xl">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>
                )}
            </div>

            {action}
        </header>
    );
}