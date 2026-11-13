import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Megaphone, CalendarDays, BarChart3, KeyRound, ScrollText, ChevronDown, LayoutGrid, BookOpen, Stethoscope, Compass, SearchCheck } from "lucide-react";
import Logo from "../assets/images/cdm-white.png";
import BackgroundImage from "../assets/images/admin-bg.png";
import "../styles/admin-service-print.css";

// Route ng Login page. Palitan kung iba ang path.
const LOGIN_PATH = "/";

// Lahat ng keys na sine-save ng Login.jsx (same list as the Library Scanner).
const SESSION_KEYS = [
    "token",
    "authToken",
    "userId",
    "idNumber",
    "userName",
    "userEmail",
    "userRole",
    "role",
    "course",
    "yearLevel",
    "contactNumber",
    "profilePicture",
    "isProfileComplete",
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const serviceGroups = [
        {
            id: "library", label: "Library", icon: <BookOpen size={16} />, path: "/admin/services/library",
            features: [
                ["Overview", "overview"], ["Inventory", "inventory"], ["Circulation", "circulation"],
                ["Reservations", "reservations"], ["Recent activity", "activity"],
            ],
        },
        {
            id: "clinic", label: "Clinic", icon: <Stethoscope size={16} />, path: "/admin/services/clinic",
            features: [["Overview", "overview"], ["Medical records", "records"], ["Integration activity", "activity"], ["Failed requests", "errors"]],
        },
        {
            id: "guidance", label: "Guidance", icon: <Compass size={16} />, path: "/admin/services/guidance",
            features: [["Overview", "overview"], ["Appointments", "appointments"], ["Counselor activity", "counselors"], ["Chat & report statistics", "systems"]],
        },
        {
            id: "lost-found", label: "Lost & Found", icon: <SearchCheck size={16} />, path: "/admin/services/lost-found",
            features: [["Overview", "overview"], ["Reports", "reports"], ["Claims", "claims"], ["Pickups", "pickups"], ["Recent activity", "activity"]],
        },
    ];
    const activeService = serviceGroups.find((group) => location.pathname.startsWith(group.path));
    const [servicesOpen, setServicesOpen] = useState(Boolean(activeService));
    const [openService, setOpenService] = useState(activeService?.id || null);

    useEffect(() => {
        if (activeService) {
            setServicesOpen(true);
            setOpenService(activeService.id);
        }
    }, [activeService?.id]);

    // =====================================================
    // LOGOUT
    // Dati, "/" lang ang pinupuntahan at naiiwan ang token sa
    // localStorage, kaya naka-login pa rin ang admin. Ngayon, binubura
    // muna ang session bago bumalik sa Login.
    // =====================================================

    const handleLogout = () => {
        SESSION_KEYS.forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        // replace: true para hindi makabalik sa admin page gamit ang Back button.
        navigate(LOGIN_PATH, { replace: true });
    };

    const navItems = [
        {
            label: "Dashboard",
            path: "/admin/dashboard",
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect
                        x="3"
                        y="3"
                        width="7"
                        height="9"
                        rx="1.5"
                    />
                    <rect
                        x="14"
                        y="3"
                        width="7"
                        height="5"
                        rx="1.5"
                    />
                    <rect
                        x="14"
                        y="12"
                        width="7"
                        height="9"
                        rx="1.5"
                    />
                    <rect
                        x="3"
                        y="16"
                        width="7"
                        height="5"
                        rx="1.5"
                    />
                </svg>
            ),
        },

        {
            label: "Services",
            group: true,
            icon: <LayoutGrid size={18} />,
        },

        {
            label: "User Management",
            path: "/admin/users",
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>
            ),
        },

        {
            label: "Service Heads",
            path: "/admin/service-heads",
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                </svg>
            ),
        },

        {
            label: "Roles & Permissions",
            path: "/admin/roles-permissions",
            icon: <KeyRound size={18} />,
        },

        {
            label: "Audit Logs",
            path: "/admin/audit-logs",
            icon: <ScrollText size={18} />,
        },

        {
            label: "Reports",
            path: "/admin/reports",
            icon: <BarChart3 size={18} />,
        },

        {
            label: "Announcements",
            path: "/admin/announcements",
            icon: <Megaphone size={18} />,
        },

        {
            label: "Events",
            path: "/admin/events",
            icon: <CalendarDays size={18} />,
        },

        {
            label: "Profile",
            path: "/admin/profile",
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>
            ),
        },
    ];

    const currentFeature = activeService?.features.find(([, view]) =>
        new URLSearchParams(location.search).get("view") === view
    );
    const currentPage = activeService
        ? `${activeService.label} · ${currentFeature?.[0] || "Overview"}`
        : navItems.find((item) => item.path === location.pathname)?.label || "Overview";

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div className="min-h-screen bg-[#F7F5EF]">

            {/* =====================================================
                FIXED SIDEBAR
            ===================================================== */}

            <aside
                className="
                    fixed
                    admin-sidebar
                    inset-y-0
                    left-0
                    z-50
                    flex
                    w-20
                    flex-col
                    overflow-y-auto
                    overflow-x-hidden
                    border-r
                    border-white/10
                    bg-[#0E3B22]
                    lg:w-64
                "
            >

                {/* LOGO */}
                <div
                    className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-2
                        border-b
                        border-white/10
                        px-3
                        py-5
                        lg:px-6
                        lg:py-6
                    "
                >
                    <img
                        src={Logo}
                        alt="CDM OneServe"
                        className="
                            h-10
                            w-auto
                            object-contain
                            lg:h-20
                        "
                    />

                    <p
                        className="
                            hidden
                            text-center
                            text-[10px]
                            uppercase
                            tracking-wide
                            text-white/50
                            lg:block
                        "
                    >
                        Admin Portal
                    </p>
                </div>

                {/* NAVIGATION */}

                <nav className="flex-1 space-y-1 p-2 lg:p-4">

                    {navItems.map((item) => {
                        if (item.group) {
                            const isServicesActive = Boolean(activeService);
                            return (
                                <div key={item.label} className="space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => setServicesOpen((open) => !open)}
                                        title="Services"
                                        aria-expanded={servicesOpen}
                                        className={`group flex w-full items-center justify-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition lg:justify-start lg:px-4 ${isServicesActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                                    >
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
                                        <span className="hidden flex-1 truncate lg:block">Services</span>
                                        <ChevronDown size={15} className={`hidden transition-transform lg:block ${servicesOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {servicesOpen && <div className="space-y-1 lg:pl-2">
                                        {serviceGroups.map((service) => {
                                            const isServiceOpen = openService === service.id;
                                            const isServiceActive = activeService?.id === service.id;
                                            return <div key={service.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenService((open) => open === service.id ? null : service.id)}
                                                    title={service.label}
                                                    aria-expanded={isServiceOpen}
                                                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-left text-xs transition lg:justify-start lg:px-3 ${isServiceActive ? "text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                                                >
                                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">{service.icon}</span>
                                                    <span className="hidden flex-1 truncate lg:block">{service.label}</span>
                                                    <ChevronDown size={13} className={`hidden transition-transform lg:block ${isServiceOpen ? "rotate-180" : ""}`} />
                                                </button>
                                                {isServiceOpen && <div className="space-y-0.5 lg:ml-5 lg:border-l lg:border-white/15 lg:pl-2">
                                                    {service.features.map(([label, view]) => {
                                                        const path = `${service.path}?view=${view}`;
                                                        const isFeatureActive = location.pathname === service.path && (new URLSearchParams(location.search).get("view") || "overview") === view;
                                                        return <button
                                                            key={view}
                                                            type="button"
                                                            onClick={() => navigate(path)}
                                                            title={`${service.label} ${label}`}
                                                            aria-current={isFeatureActive ? "page" : undefined}
                                                            className={`flex w-full items-center justify-center rounded-md px-2 py-2 text-[11px] transition lg:justify-start lg:px-3 ${isFeatureActive ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
                                                        >
                                                            <span className="hidden truncate lg:block">{label}</span>
                                                            <span className="lg:hidden">·</span>
                                                        </button>;
                                                    })}
                                                </div>}
                                            </div>;
                                        })}
                                    </div>}
                                </div>
                            );
                        }

                        const isActive =
                            location.pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() =>
                                    navigate(item.path)
                                }
                                title={item.label}
                                aria-current={
                                    isActive
                                        ? "page"
                                        : undefined
                                }
                                className={`
                                    group
                                    flex
                                    w-full
                                    items-center
                                    justify-center
                                    gap-3
                                    rounded-xl
                                    px-3
                                    py-3
                                    text-left
                                    text-sm
                                    transition-all
                                    duration-200
                                    lg:justify-start
                                    lg:px-4
                                    ${
                                        isActive
                                            ? "bg-white/10 text-white shadow-sm"
                                            : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }
                                `}
                            >
                                <span
                                    className="
                                        relative
                                        flex
                                        h-5
                                        w-5
                                        shrink-0
                                        items-center
                                        justify-center
                                    "
                                >
                                    {item.icon}
                                </span>

                                <span
                                    className="
                                        hidden
                                        truncate
                                        lg:block
                                    "
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}

                </nav>

                {/* LOGOUT */}

                <div
                    className="
                        border-t
                        border-white/10
                        p-2
                        lg:p-4
                    "
                >
                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Log out"
                        className="
                            flex
                            w-full
                            items-center
                            justify-center
                            rounded-xl
                            px-3
                            py-2.5
                            text-sm
                            text-white/60
                            transition
                            hover:bg-white/5
                            hover:text-white
                            lg:px-4
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
                            className="lg:hidden"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <path d="m16 17 5-5-5-5" />
                            <path d="M21 12H9" />
                        </svg>

                        <span className="hidden lg:block">
                            Log out
                        </span>
                    </button>
                </div>

            </aside>

            {/* =====================================================
                RIGHT SIDE
            ===================================================== */}

            <div
                className="
                    admin-layout-main
                    min-h-screen
                    pl-20
                    lg:pl-64
                "
            >

                {/* =====================================================
                    TOP HEADER
                ===================================================== */}

                <header
                    className="
                        admin-topbar
                        flex
                        min-h-[72px]
                        items-center
                        justify-between
                        border-b
                        px-4
                        py-3
                        sm:px-6
                        lg:px-8
                    "
                    style={{
                        background: "#FFFFFF",
                        borderColor: "#E5E1D8",
                    }}
                >

                    {/* PAGE TITLE */}

                    <div className="min-w-0">

                        <p
                            className="
                                truncate
                                text-[10px]
                                text-gray-400
                                sm:text-xs
                            "
                        >
                            Admin Portal / {currentPage}
                        </p>

                        <h1
                            className="
                                truncate
                                text-base
                                font-semibold
                                text-gray-800
                                sm:text-lg
                            "
                        >
                            {currentPage}
                        </h1>

                    </div>

                    {/* ADMIN INFO */}

                    <div className="flex items-center gap-2 sm:gap-4">

                        <span
                            className="
                                hidden
                                text-sm
                                text-gray-400
                                md:block
                            "
                        >
                            {today}
                        </span>

                        <div className="flex items-center gap-2">

                            <div
                                className="
                                    flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-full
                                    text-sm
                                    font-semibold
                                    text-white
                                    sm:h-10
                                    sm:w-10
                                "
                                style={{
                                    background: "#0E3B22",
                                }}
                            >
                                A
                            </div>

                            <span
                                className="
                                    hidden
                                    text-sm
                                    text-gray-700
                                    sm:block
                                "
                            >
                                Admin
                            </span>

                        </div>

                    </div>

                </header>

                {/* =====================================================
                    PAGE CONTENT
                ===================================================== */}

                <main
                    className="
                        relative
                        h-[calc(100vh-72px)]
                        overflow-auto
                    "
                    style={{
                        background: "#F7F5EF",
                    }}
                >

                    {/* BACKGROUND IMAGE */}

                    <div
                        className="
                            pointer-events-none
                            absolute
                            inset-0
                        "
                        style={{
                            backgroundImage: `url(${BackgroundImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundAttachment: "local",
                            opacity: 0.12,
                        }}
                    />

                    {/* SCRIM */}

                    <div
                        className="
                            pointer-events-none
                            absolute
                            inset-0
                        "
                        style={{
                            background:
                                "linear-gradient(180deg, rgba(247,245,239,0.92) 0%, rgba(247,245,239,0.96) 100%)",
                        }}
                    />

                    {/* PAGE */}

                    <div className="relative z-10">

                        <Outlet />

                    </div>

                </main>

            </div>

        </div>
    );
}
