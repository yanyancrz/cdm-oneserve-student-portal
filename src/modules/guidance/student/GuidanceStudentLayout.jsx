import { useLayoutEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarCheck2, CalendarPlus, LayoutDashboard, LayoutGrid, MessageCircle, Users } from "lucide-react";

import { ACCENTS } from "../components/GuidanceUi";
import { useGuidanceRealtime } from "../hooks/useGuidanceRealtime";
import { useUnreadChats } from "../hooks/useUnreadChats";
import { ONESERVE_STUDENT_HOME } from "../config/guidanceRoutes";

const TABS = [
    { to: "/guidance", label: "Home", icon: LayoutDashboard, end: true },
    { to: "/guidance/counselors", label: "Counselors", icon: Users },
    { to: "/guidance/book", label: "Book", icon: CalendarPlus },
    { to: "/guidance/appointments", label: "Appointments", icon: CalendarCheck2 },
    { to: "/guidance/chat", label: "Messages", icon: MessageCircle },
];

const A = ACCENTS.green;

// Shell for every student Guidance page: content + bottom tabs.
// On a wide screen the content stays in a phone-width column.
export default function GuidanceStudentLayout() {
    const navigate = useNavigate();

    // Real-time channel: live chat toasts + unread marks.
    useGuidanceRealtime();

    // Unread chat count for the Messages tab.
    const unreadChats = useUnreadChats("student");

    // Measure the real nav height so full-height pages (the chat
    // thread) end exactly at the top of the bottom nav instead of
    // leaving a fixed gap under the composer. The student shell has
    // no header, so its height is 0.
    const rootRef = useRef(null);
    const navRef = useRef(null);

    useLayoutEffect(() => {
        const root = rootRef.current;
        const nav = navRef.current;
        if (!root || !nav) return undefined;

        const sync = () => {
            root.style.setProperty("--guidance-nav-h", `${nav.offsetHeight}px`);
            root.style.setProperty("--guidance-header-h", "0px");
        };

        sync();

        const ro = new ResizeObserver(sync);
        ro.observe(nav);

        return () => ro.disconnect();
    }, []);

    return (
        <div
            ref={rootRef}
            className="relative min-h-dvh bg-[#F7F5EF]"
            style={{
                "--guidance-nav-h": "4rem",
                "--guidance-header-h": "0px",
                paddingBottom: "var(--guidance-nav-h)",
            }}
        >
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="absolute right-[-140px] top-[30%] h-[32rem] w-[32rem] rounded-full bg-cyan-300/10 blur-3xl" />
                <div className="absolute bottom-[-120px] left-[30%] h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />
                <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(16,106,46,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,106,46,.35)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-xl">
                <Outlet />
            </div>

            <nav
                ref={navRef}
                aria-label="Guidance"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/95 backdrop-blur"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="mx-auto flex max-w-xl px-2">
                    {TABS.map(({ to, label, icon: Icon, end }) => {
                        // Unread mark on the Messages icon.
                        const badge = to === "/guidance/chat" ? unreadChats : 0;

                        return (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                aria-label={badge > 0 ? `${label}, ${badge} unread` : label}
                                className={({ isActive }) =>
                                    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition ${
                                        isActive ? A.tabOn : "text-slate-400"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span
                                            className={`relative flex h-7 w-12 items-center justify-center rounded-full transition ${
                                                isActive ? A.tabPill : ""
                                            }`}
                                        >
                                            <Icon size={20} aria-hidden="true" />

                                            {badge > 0 && (
                                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D9578F] px-1 text-[9px] font-bold text-white ring-2 ring-white">
                                                    {badge > 9 ? "9+" : badge}
                                                </span>
                                            )}
                                        </span>
                                        {label}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => navigate(ONESERVE_STUDENT_HOME)}
                        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-slate-400 transition hover:text-[#106A2E]"
                    >
                        <span className="flex h-7 w-12 items-center justify-center rounded-full">
                            <LayoutGrid size={20} aria-hidden="true" />
                        </span>
                        Portal
                    </button>
                </div>
            </nav>
        </div>
    );
}