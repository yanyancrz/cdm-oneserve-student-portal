import { useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
    Bell,
    CalendarCheck2,
    HeartHandshake,
    LayoutDashboard,
    MessageCircle,
    UserRound,
} from "lucide-react";

import { useGuidanceMe } from "../components/GuidanceGate";
import { AlertsSheet, useGuidanceNotifications } from "../components/GuidanceAlerts";
import { signOut } from "../utils/session";
import { ACCENTS } from "../components/GuidanceUi";
import { useGuidanceRealtime } from "../hooks/useGuidanceRealtime";
import { useUnreadChats } from "../hooks/useUnreadChats";
import { useGuidanceChrome } from "../hooks/useGuidanceChrome";
import ModuleBottomNav from "../../../components/BottomNavigation/ModuleBottomNav";

// Dashboard, Appointments, Messages, plus Alerts (a sheet, not a page) and
// Profile (where sign-out lives).
const TABS = [
    { to: "/guidance/counselor", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/guidance/counselor/appointments", label: "Appointments", icon: CalendarCheck2 },
    { to: "/guidance/counselor/chat", label: "Messages", icon: MessageCircle },
];

// Where a tapped alert goes: new / cancelled requests are all handled in Appointments.
const ALERT_DESTINATION = "/guidance/counselor/appointments";

const A = ACCENTS.green;

// Counselor shell. Uses the shared <ModuleBottomNav>, the same bar the
// Library, Marketplace, and the student side of Guidance use: a floating pill
// on mobile, a fixed top bar on desktop, and a "Portal" tab. It previously
// had its own bottom bar, separate from the other modules. Counselors have no
// OneServe dashboard, so sign-out stays inside the Profile tab.
export default function CounselorLayout() {
    const { me } = useGuidanceMe();
    const navigate = useNavigate();

    // Measure the header + the shared nav's two bars so the chat thread sits
    // flush against whichever nav is showing.
    const rootRef = useRef(null);
    const headerRef = useRef(null);
    const navWrapRef = useRef(null);

    useGuidanceChrome({
        rootRef,
        navWrapRef,
        headerRef,
        brandSubtitle: "Counselor",
    });

    // Real-time channel (chat + notification pushes).
    useGuidanceRealtime();

    const alerts = useGuidanceNotifications();
    const unreadChats = useUnreadChats("counselor");

    const [alertsOpen, setAlertsOpen] = useState(false);

    // The counselor's last nav slot ends the session rather than "going back to
    // the portal" - a counselor has no dashboard to return to, so a Portal tab
    // was only ever a dead end. Same handler CounselorProfilePage uses, so both
    // sign-out paths behave identically.
    const handleSignOut = () => {
        signOut();
        window.location.replace("/");
    };

    const items = [
        ...TABS.map((tab) => ({
            label: tab.label,
            path: tab.to,
            icon: tab.icon,
            end: tab.end,
            badge: tab.to === "/guidance/counselor/chat" ? unreadChats : 0,
        })),
        // ALERTS opens a sheet in place, it does not navigate.
        {
            label: "Alerts",
            icon: Bell,
            onClick: () => setAlertsOpen((open) => !open),
            active: alertsOpen,
            badge: alerts.unreadCount,
        },
        // PROFILE (sign-out lives here).
        {
            label: "Profile",
            path: "/guidance/counselor/profile",
            icon: UserRound,
        },
    ];

    return (
        <div
            ref={rootRef}
            className="min-h-dvh bg-[#F7F5EF]"
            style={{
                "--guidance-nav-h": "4rem",
                "--guidance-top-h": "0px",
                "--guidance-header-h": "0px",
                paddingTop: "var(--guidance-top-h, 0px)",
                paddingBottom: "var(--guidance-nav-h, 4rem)",
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

            {/* The two bars ModuleBottomNav renders are found by aria-label
                inside this wrapper by useGuidanceChrome. */}
            <div ref={navWrapRef}>
                <ModuleBottomNav
                    items={items}
                    brandIcon={HeartHandshake}
                    brandTitle="CDM OneServe"
                    brandSubtitle="Counselor"
                    homePath="/guidance/counselor"
                    portalLabel="Sign out"
                    portalOnClick={handleSignOut}
                />
            </div>

            <AlertsSheet
                open={alertsOpen}
                onClose={() => setAlertsOpen(false)}
                alerts={alerts}
                onOpenItem={() => navigate(ALERT_DESTINATION)}
            />
        </div>
    );
}