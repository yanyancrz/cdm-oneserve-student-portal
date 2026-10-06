import { NavLink, Outlet } from "react-router-dom";
import { CalendarCheck2, CalendarPlus, LayoutDashboard, Users } from "lucide-react";

import { ACCENTS } from "../components/GuidanceUi";

const TABS = [
    { to: "/guidance", label: "Home", icon: LayoutDashboard, end: true },
    { to: "/guidance/counselors", label: "Counselors", icon: Users },
    { to: "/guidance/book", label: "Book", icon: CalendarPlus },
    { to: "/guidance/appointments", label: "Appointments", icon: CalendarCheck2 },
];

const A = ACCENTS.pink;

// Shell for every student Guidance page: content + bottom tabs.
// On a wide screen the content stays in a phone-width column.
export default function GuidanceStudentLayout() {
    return (
        <div className="min-h-screen bg-[#F7F5EF] pb-24">
            <div className="mx-auto w-full max-w-xl">
                <Outlet />
            </div>

            <nav
                aria-label="Guidance"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/95 backdrop-blur"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="mx-auto flex max-w-xl px-2">
                    {TABS.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition ${
                                    isActive ? A.tabOn : "text-slate-400"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                                            isActive ? A.tabPill : ""
                                        }`}
                                    >
                                        <Icon size={20} aria-hidden="true" />
                                    </span>
                                    {label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}