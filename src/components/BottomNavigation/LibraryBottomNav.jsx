import { NavLink, useNavigate } from "react-router-dom";
import {
    House,
    BookOpen,
    QrCode,
    LibraryBig,
    ArrowLeft,
} from "lucide-react";

const navItems = [
    {
        label: "Home",
        path: "/library",
        icon: House,
    },
    {
        label: "Books",
        path: "/library/books",
        icon: BookOpen,
    },
    {
        label: "Pass",
        path: "/library/access-pass",
        icon: QrCode,
    },
    {
        label: "Loans",
        path: "/library/loans",
        icon: LibraryBig,
    },
];

export default function LibraryBottomNav() {
    const navigate = useNavigate();

    return (
        <>
            {/* =====================================================
                DESKTOP — FIXED TOP NAV
            ===================================================== */}

            <nav
                className="
                    fixed
                    top-0
                    inset-x-0
                    z-50
                    hidden
                    border-b
                    border-slate-200
                    bg-white/90
                    backdrop-blur-xl
                    md:block
                "
                aria-label="Library navigation"
            >
                <div
                    className="
                        mx-auto
                        flex
                        w-full
                        max-w-[1500px]
                        items-center
                        justify-between
                        gap-4
                        px-6
                        py-3
                        lg:px-8
                    "
                >
                    {/* BRAND */}

                    <button
                        type="button"
                        onClick={() => navigate("/library")}
                        className="flex items-center gap-3"
                    >
                        <div
                            className="
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-2xl
                                border
                                border-emerald-600/15
                                bg-emerald-50
                            "
                        >
                            <LibraryBig
                                size={18}
                                className="text-[#106A2E]"
                            />
                        </div>

                        <div className="text-left">
                            <p className="text-[10px] uppercase tracking-[.22em] text-[#106A2E]/70">
                                CDM OneServe
                            </p>

                            <p className="text-sm text-slate-500">
                                Library
                            </p>
                        </div>
                    </button>

                    {/* TABS */}

                    <div className="flex items-center gap-1.5">
                        {navItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === "/library"}
                                    className={({ isActive }) =>
                                        `
                                        flex
                                        items-center
                                        gap-2
                                        rounded-xl
                                        px-3.5
                                        py-2
                                        text-xs
                                        font-semibold
                                        transition
                                        ${
                                            isActive
                                                ? "bg-emerald-50 text-[#106A2E]"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                        }
                                        `
                                    }
                                >
                                    <Icon size={14} />
                                    {item.label}
                                </NavLink>
                            );
                        })}

                        {/* BACK TO PORTAL */}

                        <span className="mx-1 h-5 w-px bg-slate-200" />

                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="
                                flex
                                items-center
                                gap-2
                                rounded-xl
                                px-3.5
                                py-2
                                text-xs
                                font-semibold
                                text-slate-500
                                transition
                                hover:bg-slate-50
                                hover:text-slate-800
                            "
                        >
                            <ArrowLeft size={14} />
                            Portal
                        </button>
                    </div>
                </div>
            </nav>

            {/* =====================================================
                MOBILE — FLOATING BOTTOM NAV
            ===================================================== */}

            <nav
                className="
                    fixed
                    bottom-3
                    left-3
                    right-3
                    z-50
                    md:hidden
                "
                aria-label="Library mobile navigation"
            >
                <div
                    className="
                        relative
                        mx-auto
                        flex
                        w-full
                        max-w-md
                        items-center
                        justify-around
                        gap-1
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white/95
                        p-1.5
                        shadow-2xl
                        shadow-black/10
                        backdrop-blur-2xl
                    "
                >
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === "/library"}
                                className={({ isActive }) =>
                                    `
                                    relative
                                    flex
                                    min-h-[58px]
                                    flex-1
                                    flex-col
                                    items-center
                                    justify-center
                                    gap-1
                                    rounded-xl
                                    py-2.5
                                    transition-all
                                    duration-200
                                    active:scale-95
                                    ${
                                        isActive
                                            ? "bg-emerald-50 text-[#106A2E]"
                                            : "text-slate-400"
                                    }
                                    `
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon size={18} />

                                        <span className="text-[10px] font-semibold">
                                            {item.label}
                                        </span>

                                        {isActive && (
                                            <span className="absolute top-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,106,46,.5)]" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}

                    {/* BACK TO PORTAL */}

                    <button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        className="
                            relative
                            flex
                            min-h-[58px]
                            flex-1
                            flex-col
                            items-center
                            justify-center
                            gap-1
                            rounded-xl
                            py-2.5
                            text-slate-400
                            transition-all
                            duration-200
                            active:scale-95
                        "
                    >
                        <ArrowLeft size={18} />

                        <span className="text-[10px] font-semibold">
                            Portal
                        </span>
                    </button>
                </div>
            </nav>
        </>
    );
}