import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    Boxes,
    ClipboardList,
    CreditCard,
    History,
    IdCard,
    LayoutDashboard,
    LayoutGrid,
    MapPin,
    Menu,
    MessageCircle,
    Package,
    Receipt,
    RotateCcw,
    Settings,
    Shield,
    Store,
    Truck,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import Logo from "../../assets/images/cdm-white.png";

import { useIsMarketHead, useMarketSession } from "./MarketStaffGate";
import { logout } from "../session";
import { setOperatorSessionId, staffApi } from "../services/marketApi";

// =====================================================
// NAVIGATION
// =====================================================

const NAV = [
    { to: "/marketplace/staff", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/marketplace/staff/orders", label: "Orders", icon: ClipboardList, operatorOnly: true },
    { to: "/marketplace/staff/claims", label: "Verify Claim", icon: Shield, operatorOnly: true },
    { to: "/marketplace/staff/products", label: "Products", icon: Package, operatorOnly: true },
    { to: "/marketplace/staff/deliveries", label: "Deliveries", icon: Truck, operatorOnly: true },
    { to: "/marketplace/staff/inventory", label: "Inventory", icon: Boxes, operatorOnly: true },
    { to: "/marketplace/staff/locations", label: "Locations", icon: MapPin, operatorOnly: true },
    { to: "/marketplace/staff/chat", label: "Chat", icon: MessageCircle, operatorOnly: true },
    { to: "/marketplace/staff/transactions", label: "Transactions", icon: Receipt, operatorOnly: true },
    { to: "/marketplace/staff/settings", label: "Settings", icon: Settings, operatorOnly: true },
    { to: "/marketplace/staff/cards", label: "Campus Cards", icon: CreditCard, operatorOnly: true },
    { to: "/marketplace/staff/id-claims", label: "ID Claims", icon: IdCard, operatorOnly: true },
    { to: "/marketplace/staff/refunds", label: "Refunds", icon: RotateCcw, operatorOnly: true },
    { to: "/marketplace/staff/accounts", label: "Staff Accounts", icon: Users, headOnly: true },
    { to: "/marketplace/staff/workspaces", label: "Workspaces", icon: Store, headOnly: true },
    { to: "/marketplace/staff/stores", label: "Storefronts", icon: LayoutGrid, headOnly: true },
    { to: "/marketplace/staff/seller-applications", label: "Seller Applications", icon: UserPlus, headOnly: true },
    { to: "/marketplace/staff/moderation", label: "Moderation", icon: Shield, headOnly: true },
    { to: "/marketplace/staff/audit", label: "Activity Log", icon: History, headOnly: true },
];

function useVisibleNav() {
    const isHead = useIsMarketHead();
    return NAV.filter(
        (item) => (!item.headOnly || isHead) && (!item.operatorOnly || !isHead)
    );
}

export default function MarketStaffLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const nav = useVisibleNav();
    const { session, workspace } = useMarketSession();

    const [drawerOpen, setDrawerOpen] = useState(false);

    // Close the drawer whenever the route changes, so a tap on a link does not
    // leave the overlay open over the page the user just navigated to.
    useEffect(() => {
        const close = () => setDrawerOpen(false);
        return close;
    }, []);

    // Lock body scroll while the drawer is open, otherwise the page behind it
    // scrolls when the user swipes.
    useEffect(() => {
        if (!drawerOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [drawerOpen]);

    const handleSignOut = () => {
        logout();
        window.location.replace("/");
    };

    const handleEndShift = async () => {
        if (!window.confirm("End this shift? The next operator will enter their own name.")) {
            return;
        }

        try {
            await staffApi.endSession();
        } catch {
            // The session may already be over - either way the counter closes.
        }

        setOperatorSessionId(null);
        window.location.replace("/marketplace/staff");
    };

    const currentPage =
        nav.find((item) => item.to === location.pathname)?.label || "Dashboard";

    const renderNavItem = (item, onClick) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;

        return (
            <button
                key={item.to}
                type="button"
                onClick={() => {
                    navigate(item.to);
                    if (onClick) onClick();
                }}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`
                    group
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    transition-all
                    duration-200
                    ${
                        isActive
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                    }
                `}
            >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    <Icon size={18} aria-hidden="true" />
                </span>
                <span className="truncate">{item.label}</span>
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-[#F7F5EF]">
            {/* =====================================================
                DESKTOP SIDEBAR (lg and up)
            ===================================================== */}
            <aside
                className="
                    fixed
                    inset-y-0
                    left-0
                    z-50
                    hidden
                    w-64
                    flex-col
                    overflow-y-auto
                    border-r
                    border-white/10
                    bg-[#0E3B22]
                    lg:flex
                "
            >
                {/* LOGO */}
                <div className="flex flex-col items-center justify-center gap-2 border-b border-white/10 px-6 py-6">
                    <img
                        src={Logo}
                        alt="CDM OneServe"
                        className="h-20 w-auto object-contain"
                    />
                    <p className="text-center text-[10px] uppercase tracking-wide text-white/50">
                        Marketplace Staff
                    </p>
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 space-y-1 p-4">
                    {nav.map((item) => renderNavItem(item))}
                </nav>

                {/* DUTY SHIFT + LOGOUT */}
                <div className="space-y-2 border-t border-white/10 p-4">
                    {session && (
                        <div className="rounded-xl bg-white/5 p-3">
                            <p className="truncate text-[11px] font-bold text-white/90">
                                {workspace?.name ?? session.workspaceName}
                            </p>
                            <p className="truncate text-[10px] text-white/50">
                                On duty: {session.operatorName}
                                {session.idLast3 ? ` (ID •••${session.idLast3})` : ""}
                            </p>
                            <button
                                type="button"
                                onClick={handleEndShift}
                                className="mt-2 w-full rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                            >
                                End shift
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleSignOut}
                        title="Log out"
                        className="
                            flex
                            w-full
                            items-center
                            gap-3
                            rounded-xl
                            px-4
                            py-3
                            text-sm
                            text-white/60
                            transition-all
                            duration-200
                            hover:bg-white/5
                            hover:text-white
                        "
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <path d="m16 17 5-5-5-5" />
                            <path d="M21 12H9" />
                        </svg>
                        <span>Log out</span>
                    </button>
                </div>
            </aside>

            {/* =====================================================
                MOBILE TOP BAR + DRAWER
            ===================================================== */}
            <div className="lg:hidden">
                {/* TOP BAR */}
                <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#E5E1D8] bg-white px-4 py-3">
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                        aria-label="Open menu"
                    >
                        <Menu size={20} aria-hidden="true" />
                    </button>

                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                        {currentPage}
                    </p>

                    {session && (
                        <button
                            type="button"
                            onClick={handleEndShift}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            End shift
                        </button>
                    )}
                </header>

                {/* DRAWER BACKDROP */}
                {drawerOpen && (
                    <div
                        className="fixed inset-0 z-50 bg-black/40"
                        onClick={() => setDrawerOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* DRAWER */}
                <aside
                    className={`
                        fixed
                        inset-y-0
                        left-0
                        z-50
                        flex
                        w-72
                        max-w-[85vw]
                        flex-col
                        bg-[#0E3B22]
                        shadow-2xl
                        transition-transform
                        duration-200
                        ease-out
                        ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
                    `}
                >
                    {/* DRAWER HEADER */}
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                        <div className="flex items-center gap-2">
                            <img
                                src={Logo}
                                alt="CDM OneServe"
                                className="h-8 w-auto object-contain"
                            />
                            <p className="text-[10px] uppercase tracking-wide text-white/50">
                                Marketplace Staff
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(false)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
                            aria-label="Close menu"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>

                    {/* DUTY SHIFT (mobile) */}
                    {session && (
                        <div className="border-b border-white/10 px-4 py-3">
                            <p className="truncate text-[11px] font-bold text-white/90">
                                {workspace?.name ?? session.workspaceName}
                            </p>
                            <p className="truncate text-[10px] text-white/50">
                                On duty: {session.operatorName}
                                {session.idLast3 ? ` (ID •••${session.idLast3})` : ""}
                            </p>
                        </div>
                    )}

                    {/* NAVIGATION */}
                    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                        {nav.map((item) => renderNavItem(item, () => setDrawerOpen(false)))}
                    </nav>

                    {/* LOGOUT */}
                    <div className="border-t border-white/10 p-3">
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="
                                flex
                                w-full
                                items-center
                                gap-3
                                rounded-xl
                                px-3
                                py-2.5
                                text-sm
                                text-white/60
                                transition-all
                                duration-200
                                hover:bg-white/5
                                hover:text-white
                            "
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <path d="m16 17 5-5-5-5" />
                                <path d="M21 12H9" />
                            </svg>
                            <span>Log out</span>
                        </button>
                    </div>
                </aside>
            </div>

            {/* =====================================================
                PAGE CONTENT
            ===================================================== */}
            <main className="min-h-screen bg-[#F7F5EF] px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
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