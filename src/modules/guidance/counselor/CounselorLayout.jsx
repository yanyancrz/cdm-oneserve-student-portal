import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, CalendarClock, CalendarCheck2, LayoutDashboard, LogOut } from "lucide-react";

import { useGuidanceMe } from "../components/GuidanceGate";
import { AlertsSheet, useGuidanceNotifications } from "../components/GuidanceAlerts";
import { ACCENTS } from "../components/GuidanceUi";
import { signOut } from "../utils/session";
import { initials } from "../utils/dateTime";

const TABS = [
    { to: "/guidance/counselor", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/guidance/counselor/appointments", label: "Appointments", icon: CalendarCheck2 },
    { to: "/guidance/counselor/availability", label: "Availability", icon: CalendarClock },
];

// Where a tapped alert goes: new / cancelled requests are all handled in Appointments.
const ALERT_DESTINATION = "/guidance/counselor/appointments";

const A = ACCENTS.green;

// Counselor shell. Counselors have no OneServe dashboard, so sign-out lives here.
export default function CounselorLayout() {
    const { me } = useGuidanceMe();
    const navigate = useNavigate();

    const alerts = useGuidanceNotifications();
    const [alertsOpen, setAlertsOpen] = useState(false);

    const handleSignOut = () => {
        signOut();
        window.location.replace("/");
    };

    return (
        <div className="min-h-screen bg-[#F7F5EF] pb-24">
            <div className="mx-auto w-full max-w-xl">
                <header
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
                            {initials(me.fullName) || "C"}
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs text-white/80">Guidance Counselor</p>
                            <h1 className="truncate text-base font-semibold tracking-tight">{me.fullName}</h1>
                        </div>

                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="ml-auto flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium transition active:scale-95"
                        >
                            <LogOut size={14} aria-hidden="true" /> Sign out
                        </button>
                    </div>
                </header>

                <Outlet />
            </div>

            <nav
                aria-label="Counselor"
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

                    {/* ALERTS: new appointment requests and cancellations */}
                    <button
                        type="button"
                        onClick={() => setAlertsOpen((open) => !open)}
                        aria-expanded={alertsOpen}
                        aria-label={
                            alerts.unreadCount > 0 ? `Alerts, ${alerts.unreadCount} unread` : "Alerts"
                        }
                        className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition ${
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
                                <span className="absolute right-3 top-0.5 h-2.5 w-2.5 rounded-full bg-[#D9578F] ring-2 ring-white" />
                            )}
                        </span>
                        Alerts
                    </button>
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