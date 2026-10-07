import { useLayoutEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    Bell,
    CalendarCheck2,
    LayoutDashboard,
    MessageCircle,
    UserRound,
} from "lucide-react";

import { useGuidanceMe } from "../components/GuidanceGate";
import { AlertsSheet, useGuidanceNotifications } from "../components/GuidanceAlerts";
import { ACCENTS } from "../components/GuidanceUi";
import { useGuidanceRealtime } from "../hooks/useGuidanceRealtime";
import { useUnreadChats } from "../hooks/useUnreadChats";

// The counselor bottom bar: Dashboard, Appointments, Messages,
// Alerts, Profile. (Sign out lives inside the Profile tab.)
const TABS = [
    { to: "/guidance/counselor", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/guidance/counselor/appointments", label: "Appointments", icon: CalendarCheck2 },
    { to: "/guidance/counselor/chat", label: "Messages", icon: MessageCircle },
];

// Where a tapped alert goes: new / cancelled requests are all handled in Appointments.
const ALERT_DESTINATION = "/guidance/counselor/appointments";

const A = ACCENTS.green;

// Counselor shell. Counselors have no OneServe dashboard, so the
// Profile tab carries the sign-out action.
export default function CounselorLayout() {
    const { me } = useGuidanceMe();
    const navigate = useNavigate();

    // Measure the real header + nav heights so full-height pages
    // (the chat thread) can sit exactly on top of the bottom nav
    // instead of leaving a gap under the composer.
    const rootRef = useRef(null);
    const headerRef = useRef(null);
    const navRef = useRef(null);

    useLayoutEffect(() => {
        const root = rootRef.current;
        const nav = navRef.current;
        if (!root || !nav) return undefined;

        const sync = () => {
            root.style.setProperty("--guidance-nav-h", `${nav.offsetHeight}px`);
            root.style.setProperty(
                "--guidance-header-h",
                `${headerRef.current?.offsetHeight ?? 0}px`
            );
        };

        sync();

        const ro = new ResizeObserver(sync);
        ro.observe(nav);
        if (headerRef.current) ro.observe(headerRef.current);

        return () => ro.disconnect();
    }, []);

    // Real-time channel (chat + notification pushes).
    useGuidanceRealtime();

    const alerts = useGuidanceNotifications();
    const unreadChats = useUnreadChats("counselor");

    const [alertsOpen, setAlertsOpen] = useState(false);

    // --guidance-nav-h / --guidance-header-h let full-height pages
    // (the chat thread) sit exactly on top of the bottom nav, instead
    // of leaving a fixed gap under the composer.
    return (
        <div
            ref={rootRef}
            className="min-h-dvh bg-[#F7F5EF]"
            style={{
                "--guidance-nav-h": "4rem",
                "--guidance-header-h": "0px",
                paddingBottom: "var(--guidance-nav-h)",
            }}
        >
            <div className="mx-auto w-full max-w-xl">
                <header
                    ref={headerRef}
                    className={`relative overflow-hidden rounded-b-[28px] bg-gradient-to-br ${A.gradient} px-4 pb-6 text-white shadow-sm`}
                    style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}
                >
                    <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
                    <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-8 h-32 w-32 rounded-full bg-white/5" />

                    <div className="relative flex items-center gap-3">
                        <div
                            aria-hidden="true"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold"
                        >
                            {me.fullName?.slice(0, 2).toUpperCase() || "C"}
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs text-white/80">Guidance Counselor</p>
                            <h1 className="truncate text-base font-semibold tracking-tight">{me.fullName}</h1>
                        </div>
                    </div>
                </header>

                <Outlet />
            </div>

            <nav
                ref={navRef}
                aria-label="Counselor"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/95 backdrop-blur"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="mx-auto flex max-w-xl px-2">
                    {TABS.map(({ to, label, icon: Icon, end }) => {
                        // Unread mark on the Messages icon.
                        const badge = to === "/guidance/counselor/chat" ? unreadChats : 0;

                        return (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                aria-label={
                                    badge > 0 ? `${label}, ${badge} unread` : label
                                }
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

                    {/* ALERTS: new appointment requests and cancellations */}
                    <button
                        type="button"
                        onClick={() => setAlertsOpen((open) => !open)}
                        aria-expanded={alertsOpen}
                        aria-label={
                            alerts.unreadCount > 0 ? `Alerts, ${alerts.unreadCount} unread` : "Alerts"
                        }
                        className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition ${
                            alertsOpen ? A.tabOn : "text-slate-400"
                        }`}
                    >
                        <span
                            className={`relative flex h-7 w-12 items-center justify-center rounded-full transition ${
                                alertsOpen ? A.tabPill : ""
                            }`}
                        >
                            <Bell size={20} aria-hidden="true" />

                            {alerts.unreadCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D9578F] px-1 text-[9px] font-bold text-white ring-2 ring-white">
                                    {alerts.unreadCount > 9 ? "9+" : alerts.unreadCount}
                                </span>
                            )}
                        </span>
                        Alerts
                    </button>

                    {/* PROFILE (sign out lives here) */}
                    <NavLink
                        to="/guidance/counselor/profile"
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
                                    <UserRound size={20} aria-hidden="true" />
                                </span>
                                Profile
                            </>
                        )}
                    </NavLink>
                </div>
            </nav>

            <AlertsSheet
                open={alertsOpen}
                onClose={() => setAlertsOpen(false)}
                alerts={alerts}
                onOpenItem={() => navigate(ALERT_DESTINATION)}
            />
        </div>
    );
}
