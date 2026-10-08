import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    Boxes,
    ClipboardList,
    ArrowLeft,
    LayoutDashboard,
    LogOut,
    MapPin,
    MessageCircle,
    Package,
    Receipt,
    Settings,
    Truck,
    Users,
} from "lucide-react";

import { useIsMarketHead } from "./MarketStaffGate";
import { logout } from "../session";
import { portalHomeForRole } from "../../components/PortalLink/BackToPortal";

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
// =====================================================

const NAV = [
    { to: "/marketplace/staff", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/marketplace/staff/orders", label: "Orders", icon: ClipboardList },
    { to: "/marketplace/staff/deliveries", label: "Campus Deliveries", icon: Truck },
    { to: "/marketplace/staff/products", label: "Products", icon: Package },
    { to: "/marketplace/staff/inventory", label: "Inventory", icon: Boxes },
    { to: "/marketplace/staff/locations", label: "Campus Locations", icon: MapPin },
    { to: "/marketplace/staff/chat", label: "Chat / Concerns", icon: MessageCircle },
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
    const navigate = useNavigate();
    const storedRole = () =>
        localStorage.getItem("role") || localStorage.getItem("userRole") || "";
    const navRef = useRef(null);
    const location = useLocation();

    // Scrolls the active tab into view on the mobile nav strip.
    //
    // With ten destinations in a horizontal strip, the active one is usually off
    // screen after a jump - deep-linking to Transactions, or coming back from an
    // order, left the strip showing unrelated tabs with no indication of where you
    // actually are. scrollIntoView with "nearest" does nothing when it is already
    // visible, so this does not fight a manual scroll.
    useEffect(() => {
        const strip = navRef.current;
        const active = strip?.querySelector('[data-active="true"]');
        active?.scrollIntoView({ block: "nearest", inline: "center" });
    }, [location.pathname]);

    // Signs the user out of the WHOLE of OneServe, not just the marketplace. A
    // marketplace operator has no separate marketplace account, so there is
    // nothing marketplace-specific to preserve - and leaving a shared JWT behind
    // on a shared counter device would be the wrong default.
    const handleLogout = () => {
        logout();
        window.location.replace("/");
    };

    return (
        <div className="flex min-h-screen bg-[#F7F5EF]">
            {/* SIDEBAR - STICKY ON DESKTOP
                h-screen is what makes the sticky work: a flex item stretches to
                the height of the flex line by default, and an element with
                nothing to move inside cannot stick. Pinning it to the viewport
                height leaves room to travel as the page scrolls.

                overflow-y-auto means a long menu scrolls INSIDE the sidebar rather
                than pushing the Log out block off screen - which is also what
                makes that block's own sticky-bottom actually do anything. */}
            <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-[#0E3B22]/10 bg-[#106A2E] lg:flex">
                <div className="px-5 py-6">
                    <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-amber-300/80">
                        CampusMarket
                    </p>
                    <h1 className="mt-1 text-base font-semibold text-white">
                        Staff Portal
                    </h1>
                </div>

                <nav className="flex-1 space-y-0.5 px-3 pb-6">
                    {nav.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                                        isActive
                                            ? "bg-white/15 text-white"
                                            : "text-white/60 hover:bg-white/10 hover:text-white"
                                    }`
                                }
                            >
                                <Icon size={15} />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Logout. Sticky at the bottom so it stays reachable even when the
                    menu is taller than the screen - a staff member must never be
                    stranded in the portal. */}
                <div className="sticky bottom-0 border-t border-white/10 bg-[#106A2E] px-3 py-3">
                    <p className="mb-2 px-1 text-[10px] leading-4 text-white/40">
                        Operator accounts are managed by the Marketplace Head. The
                        CDM OneServe Admin monitors from their own portal.
                    </p>

                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Log out"
                        aria-label="Log out"
                        className="flex w-full items-center justify-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-white/60 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                        <LogOut size={15} className="shrink-0" />
                        Log out
                    </button>
                </div>
            </aside>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Mobile header. The sidebar is hidden below lg, so Log out has to be
                    reachable here too - a phone at the counter must not need a
                    desktop to sign out. */}
                <header className="flex items-center gap-3 border-b border-[#0E3B22]/10 bg-[#106A2E] px-4 py-3 lg:hidden">
                    <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-amber-300/80">
                            CampusMarket
                        </p>
                        <h1 className="truncate text-sm font-semibold text-white">
                            Staff Portal
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        aria-label="Log out"
                        title="Log out"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 outline-none transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                        <LogOut size={15} />
                    </button>
                </header>

                {/* Ten destinations will not fit a phone width, so this scrolls sideways. It is
                    a strip and not a bottom bar because the tabs are text, not
                    icons - the labels are what a counter operator needs, and ten
                    icon-only tabs at that size would be guesswork. The active tab
                    scrolls itself into view (see the effect above), and the fades
                    at each edge show there is more to either side. */}
                <div className="relative lg:hidden">
                    <nav
                        ref={navRef}
                        className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {nav.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
                                        isActive
                                            ? "bg-[#106A2E] text-white shadow-sm"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <span data-active={isActive ? "true" : undefined}>
                                        {item.label}
                                    </span>
                                )}
                            </NavLink>
                        ))}

                        {/* PORTAL - a tab in the strip, not a button in the header.

                        The desktop sidebar has no Back to Portal, so without this
                        a staff member working from a phone would have no way back
                        to OneServe at all: the sidebar is hidden below lg, and the
                        console is a long scroll of orders and stock. As a tab it
                        also matches the shared ModuleBottomNav the buyer store
                        uses, where Portal is likewise the last tab. */}
                        <span className="mx-0.5 w-px shrink-0 self-stretch bg-slate-200" />

                        <button
                            type="button"
                            onClick={() =>
                                navigate(portalHomeForRole(storedRole()))
                            }
                            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        >
                            <ArrowLeft size={12} />
                            Portal
                        </button>
                    </nav>

                    <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
                </div>

                <main className="flex-1 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-6">
                    <Outlet />
                </main>
            </div>
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
