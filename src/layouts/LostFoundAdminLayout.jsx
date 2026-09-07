import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Logo from "../assets/images/lightlogo.png";
import BackgroundImage from "../assets/images/admin-bg.png";

export default function LostFoundAdminLayout() {

    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        {
            label: "Dashboard",
            path: "/admin/lost-found/dashboard",
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <rect x="3" y="3" width="7" height="9" rx="1.5" />
                    <rect x="14" y="3" width="7" height="5" rx="1.5" />
                    <rect x="14" y="12" width="7" height="9" rx="1.5" />
                    <rect x="3" y="16" width="7" height="5" rx="1.5" />
                </svg>
            ),
        },

        {
            label: "Reports",
            path: "/admin/lost-found/reports",
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <path d="M6 3h9l4 4v14H6z" />
                    <path d="M14 3v5h5" />
                    <path d="M9 13h6" />
                    <path d="M9 17h6" />
                </svg>
            ),
        },

        {
            label: "Matches",
            path: "/admin/lost-found/matches",
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <path d="M8 12h8" />
                    <path d="M12 8l4 4-4 4" />
                    <path d="M5 7h4" />
                    <path d="M15 17h4" />
                    <rect x="3" y="4" width="7" height="16" rx="2" />
                    <rect x="14" y="4" width="7" height="16" rx="2" />
                </svg>
            ),
        },

        {
            label: "Claims",
            path: "/admin/lost-found/claims",
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <path d="M6 3h12v18H6z" />
                    <path d="M9 7h6" />
                    <path d="M9 11h6" />
                    <path d="M9 15h4" />
                </svg>
            ),
        },

        {
            label: "Profile",
            path: "/admin/lost-found/profile",
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>
            ),
        },
    ];

    const currentPage =
        navItems.find((item) => item.path === location.pathname)?.label ||
        "Overview";

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div
            className="min-h-screen flex"
            style={{ background: "#F7F5EF" }}
        >

            {/* SIDEBAR */}
            <aside
                className="w-64 flex flex-col flex-shrink-0"
                style={{ background: "#0E3B22" }}
            >

                {/* LOGO */}
                <div className="p-6 flex flex-col items-center gap-2 border-b border-white/10">

                    <img
                        src={Logo}
                        alt="CDM OneServe"
                        className="h-20 w-auto object-contain"
                    />

                    <p className="text-xs text-white/50 tracking-wide uppercase">
                        Lost & Found Admin
                    </p>

                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 p-4 space-y-1">

                    {navItems.map((item) => {

                        const isActive =
                            location.pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`
                                    w-full
                                    flex
                                    items-center
                                    gap-3
                                    text-left
                                    px-4
                                    py-3
                                    rounded-xl
                                    text-sm
                                    transition-all
                                    ${
                                        isActive
                                            ? "bg-white/10 text-white"
                                            : "text-white/60 hover:text-white hover:bg-white/5"
                                    }
                                `}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        );

                    })}

                </nav>

                {/* LOG OUT */}
                <div className="p-4 border-t border-white/10">

                    <button
                        onClick={() => navigate("/")}
                        className="
                            w-full
                            py-2.5
                            rounded-xl
                            text-white/70
                            hover:text-white
                            hover:bg-white/5
                        "
                    >
                        Log out
                    </button>

                </div>

            </aside>

            {/* PAGE CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* TOP HEADER */}
                <header
                    className="flex items-center justify-between px-8 py-4 border-b"
                    style={{
                        background: "#FFFFFF",
                        borderColor: "#E5E1D8",
                    }}
                >

                    <div>

                        <p className="text-xs text-gray-400">
                            Lost & Found Admin / {currentPage}
                        </p>

                        <h1 className="text-lg font-semibold text-gray-800">
                            {currentPage}
                        </h1>

                    </div>

                    <div className="flex items-center gap-4">

                        <span className="text-sm text-gray-400">
                            {today}
                        </span>

                        <div className="flex items-center gap-2">

                            <div
                                className="
                                    w-8
                                    h-8
                                    rounded-full
                                    flex
                                    items-center
                                    justify-center
                                    text-white
                                    text-sm
                                    font-semibold
                                "
                                style={{ background: "#0E3B22" }}
                            >
                                L
                            </div>

                            <span className="text-sm text-gray-700">
                                Lost & Found Admin
                            </span>

                        </div>

                    </div>

                </header>

                {/* PAGE MAIN */}
                <main
                    className="flex-1 overflow-auto relative"
                    style={{ background: "#F7F5EF" }}
                >

                    {/* BACKGROUND IMAGE */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: `url(${BackgroundImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            opacity: 1,
                        }}
                    />

                    {/* SCRIM */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                "linear-gradient(180deg, rgba(247,245,239,0.92) 0%, rgba(247,245,239,0.96) 100%)",
                        }}
                    />

                    <div className="relative z-10">
                        <Outlet />
                    </div>

                </main>

            </div>

        </div>
    );
}