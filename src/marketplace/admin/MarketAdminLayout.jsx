import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    BarChart3,
    LayoutDashboard,
    LogOut,
    Receipt,
    Users,
} from "lucide-react";

import { logout } from "../session";

// =====================================================
// CAMPUSMARKET monitoring shell (CDM OneServe Admin)
//
// READ-ONLY, and the navigation makes that visible: every item here is a view.
// There is no "add", "edit" or "manage" link anywhere in this portal, because
// the marketplace API exposes no admin write endpoint - not for products, stock,
// orders, chat, and above all not for Student/Faculty accounts. Account
// management stays in the OneServe admin, where it already lives.
// =====================================================

const NAV = [
    { to: "/marketplace/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/marketplace/admin/accounts", label: "Buyer Accounts", icon: Users },
    { to: "/marketplace/admin/transactions", label: "Transactions", icon: Receipt },
    { to: "/marketplace/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function MarketAdminLayout() {
    const navigate = useNavigate();

    // This shell is separate from the OneServe AdminLayout, so it needs its own
    // way out - otherwise an Admin who deep-linked into /marketplace/admin would
    // have to edit the URL to sign out. Signs them out of OneServe entirely,
    // which is where they signed in from.
    const handleLogout = () => {
        logout();
        window.location.replace("/");
    };

    return (
        <div className="min-h-screen bg-[#F7F5EF] md:pt-24">
            <header className="border-b border-[#0E3B22]/10 bg-[#106A2E] px-4 py-4 text-white sm:px-6">
                <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4">
                    <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-amber-300/80">
                            CampusMarket
                        </p>
                        <h1 className="mt-0.5 text-base font-semibold sm:text-lg">
                            Marketplace Monitoring
                        </h1>
                        <p className="mt-0.5 text-[10px] text-white/50">
                            Read-only. The Admin watches; Marketplace Staff operates.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate("/marketplace/staff")}
                            className="rounded-xl border border-white/20 px-3 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-white/10"
                        >
                            Staff portal
                        </button>

                        {/* This portal's own way out. Administration pages do not
                            carry the shared "Back to Portal" control - they are
                            OneServe-native and provide their own navigation back to
                            the admin dashboard they were opened from. */}
                        <button
                            type="button"
                            onClick={() => navigate("/admin/dashboard")}
                            className="rounded-xl bg-white/10 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/20"
                        >
                            OneServe admin
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            aria-label="Log out"
                            title="Log out"
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </header>

            <nav className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex w-full max-w-[1500px] gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
                    {NAV.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                        isActive
                                            ? "bg-[#106A2E] text-white"
                                            : "text-slate-500 hover:bg-slate-100"
                                    }`
                                }
                            >
                                <Icon size={13} />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </div>
            </nav>

            <main className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-6 sm:py-6">
                <Outlet />
            </main>
        </div>
    );
}

export function AdminPageHeader({ title, subtitle, action }) {
    return (
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
                <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-[#106A2E]/50">
                    CampusMarket Monitoring
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