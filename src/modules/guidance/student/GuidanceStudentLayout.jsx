import { useRef } from "react";
import { Outlet } from "react-router-dom";
import {
    CalendarCheck2,
    CalendarPlus,
    HeartHandshake,
    LayoutDashboard,
    MessageCircle,
    Users,
} from "lucide-react";

import { useGuidanceRealtime } from "../hooks/useGuidanceRealtime";
import { useUnreadChats } from "../hooks/useUnreadChats";
import { useGuidanceChrome } from "../hooks/useGuidanceChrome";
import ModuleBottomNav from "../../../components/BottomNavigation/ModuleBottomNav";

const TABS = [
    { to: "/guidance", label: "Home", icon: LayoutDashboard, end: true },
    { to: "/guidance/counselors", label: "Counselors", icon: Users },
    { to: "/guidance/book", label: "Book", icon: CalendarPlus },
    { to: "/guidance/appointments", label: "Appointments", icon: CalendarCheck2 },
    { to: "/guidance/chat", label: "Messages", icon: MessageCircle },
];

// Student Guidance shell. Uses the shared <ModuleBottomNav>, the same bar the
// Library and Marketplace use: a floating pill on mobile, a fixed top bar on
// desktop, and a "Portal" tab that leaves the module for OneServe. It
// previously had its own full-width fixed bottom bar, which put Guidance at
// its own third style - one system, so one bar.
export default function GuidanceStudentLayout() {
    // Real-time channel: live chat toasts + unread marks.
    useGuidanceRealtime();

    // Unread chat count for the Messages tab.
    const unreadChats = useUnreadChats("student");

    // Measure the shared nav's two bars so the chat thread sits flush above
    // whatever is showing, with no dead space.
    const rootRef = useRef(null);
    const navWrapRef = useRef(null);

    useGuidanceChrome({
        rootRef,
        navWrapRef,
        headerRef: null,
        brandSubtitle: "Guidance",
    });

    const items = TABS.map((tab) => ({
        label: tab.label,
        path: tab.to,
        icon: tab.icon,
        end: tab.end,
        // Unread mark on the Messages icon.
        badge: tab.to === "/guidance/chat" ? unreadChats : 0,
    }));

    return (
        <div
            ref={rootRef}
            className="relative min-h-dvh bg-[#F7F5EF]"
            style={{
                "--guidance-nav-h": "4rem",
                "--guidance-top-h": "0px",
                "--guidance-header-h": "0px",
                paddingTop: "var(--guidance-top-h, 0px)",
                paddingBottom: "var(--guidance-nav-h, 4rem)",
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

            {/* The two bars ModuleBottomNav renders are found by aria-label
                inside this wrapper by useGuidanceChrome. */}
            <div ref={navWrapRef}>
                <ModuleBottomNav
                    items={items}
                    brandIcon={HeartHandshake}
                    brandTitle="CDM OneServe"
                    brandSubtitle="Guidance"
                    homePath="/guidance"
                />
            </div>
        </div>
    );
}