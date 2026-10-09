import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    CalendarClock,
    HandHelping,
    LayoutDashboard,
    LogOut,
    SearchCheck,
} from "lucide-react";

import { logout } from "../session";

// =====================================================
// LOST & FOUND admin shell
//
// The module owner's console: review reports,
// decide claims, run the pickup windows and
// record handovers. Desktop only - the route
// tree wraps it in a desktop restriction.
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

    // This shell is separate from the OneServe AdminLayout,
    // so it needs its own way out. Signs them out of
    // OneServe entirely, which is where they signed in from.
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
                            CDM OneServe
                        </p>
                        <h1 className="mt-0.5 text-base font-semibold sm:text-lg">
                            Lost &amp; Found Console
                        </h1>
                        <p className="mt-0.5 text-[10px] text-white/50">
                            Review reports, decide claims, run pickups.
                        </p>
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
                                    `inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                                        isActive
                                            ? "bg-[#106A2E] text-white"
                                            : "text-slate-600 hover:bg-slate-100"
                                    }`
                                }
                            >
                                <Icon size={14} aria-hidden="true" />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </div>
            </nav>

            <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6">
                <Outlet />
            </main>
        </div>
    );
}
