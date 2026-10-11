import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    CalendarClock,
    ChevronLeft,
    HandHelping,
    LayoutDashboard,
    LogOut,
    Menu,
    SearchCheck,
    X,
} from "lucide-react";

import { logout } from "../session";
import { FIND_LOGO_SRC } from "../components/lfBrand";

// =====================================================
// LOST & FOUND admin shell
//
// The module owner's console: review reports, decide
// claims, run the pickup windows and record handovers.
// Desktop only - the route tree wraps it in a desktop
// restriction.
//
// The same NAV array drives the desktop sidebar and the
// mobile drawer, so a route can never exist in one and
// be missing from the other.
// =====================================================

const NAV = [
    {
        to: "/lost-found/admin",
        label: "Overview",
        icon: LayoutDashboard,
        end: true,
    },
    { to: "/lost-found/admin/reports", label: "Reports", icon: SearchCheck },
    { to: "/lost-found/admin/claims", label: "Claims", icon: HandHelping },
    {
        to: "/lost-found/admin/schedules",
        label: "Pickups",
        icon: CalendarClock,
    },
];

export default function LfAdminLayout() {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // This shell is separate from the OneServe AdminLayout,
    // so it needs its own way out. Signs them out of
    // OneServe entirely, which is where they signed in from.
    const handleLogout = () => {
        logout();
        window.location.replace("/");
    };

    return (
        <div className="min-h-screen bg-[#F7F5EF]">
            {/* =====================================================
                HEADER
            ===================================================== */}
            <header className="sticky top-0 z-30 border-b border-[#0E3B22]/10 bg-[#106A2E] px-4 py-3 text-white shadow-sm sm:px-6">
                <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {/* Mobile menu - opens the same nav as the sidebar */}
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Open navigation"
                            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 md:hidden"
                        >
                            <Menu size={18} aria-hidden="true" />
                        </button>

                        <img
                            src={FIND_LOGO_SRC}
                            alt="FIND - Found Item & Notification Desk"
                            onError={(event) => {
                                event.currentTarget.style.display = "none";
                            }}
                            className="h-10 w-10 shrink-0 rounded-xl bg-black/40 object-contain p-1 ring-1 ring-white/20"
                        />
                        <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-amber-300/80">
                                FIND · Found Item &amp; Notification Desk
                            </p>
                            <h1 className="truncate text-base font-semibold sm:text-lg">
                                Lost &amp; Found Console
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate("/lost-found")}
                            className="rounded-xl border border-white/20 px-3 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-white/10"
                        >
                            Report board
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            aria-label="Log out"
                            title="Log out"
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40"
                        >
                            <LogOut size={14} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6">
                {/* =====================================================
                    SIDEBAR (desktop) - collapsible, all routes kept
                ===================================================== */}
                <aside
                    className={`sticky top-[86px] hidden shrink-0 self-start transition-[width] duration-300 md:block ${
                        collapsed ? "w-[76px]" : "w-60"
                    }`}
                >
                    <nav aria-label="Lost & Found console navigation" className="space-y-1">
                        {NAV.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    title={collapsed ? item.label : undefined}
                                    className={({ isActive }) =>
                                        `group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[#106A2E]/40 ${
                                            isActive
                                                ? "bg-white text-[#106A2E] shadow-sm ring-1 ring-[#106A2E]/15"
                                                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <Icon
                                                size={18}
                                                aria-hidden="true"
                                                className={`shrink-0 ${isActive ? "text-[#106A2E]" : "text-slate-400 group-hover:text-slate-600"}`}
                                            />
                                            {!collapsed && <span className="truncate">{item.label}</span>}
                                            {isActive && (
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#106A2E]"
                                                />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>

                    <button
                        type="button"
                        onClick={() => setCollapsed((value) => !value)}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-semibold text-slate-500 transition hover:text-slate-700"
                    >
                        <ChevronLeft
                            size={14}
                            aria-hidden="true"
                            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
                        />
                        {!collapsed && "Collapse"}
                    </button>
                </aside>

                {/* =====================================================
                    MAIN
                ===================================================== */}
                <main className="min-w-0 flex-1">
                    <Outlet />
                </main>
            </div>

            {/* =====================================================
                DRAWER (mobile) - the same routes
            ===================================================== */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setDrawerOpen(false)}
                        className="absolute inset-0 bg-black/40"
                    />

                    <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#F7F5EF] shadow-2xl">
                        <div className="flex items-center justify-between gap-2 bg-[#106A2E] px-4 py-3 text-white">
                            <p className="text-sm font-semibold">Lost &amp; Found Console</p>
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                aria-label="Close navigation"
                                className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <nav aria-label="Lost & Found console navigation" className="space-y-1 p-3">
                            {NAV.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        onClick={() => setDrawerOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
                                                isActive
                                                    ? "bg-white text-[#106A2E] shadow-sm ring-1 ring-[#106A2E]/15"
                                                    : "text-slate-600 hover:bg-white/70"
                                            }`
                                        }
                                    >
                                        <Icon size={18} aria-hidden="true" />
                                        {item.label}
                                    </NavLink>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}
