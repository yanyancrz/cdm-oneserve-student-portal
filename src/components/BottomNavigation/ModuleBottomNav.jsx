import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { portalHomeForRole } from "../PortalLink/BackToPortal";

// =====================================================
// Module navigation - the shared shell every module uses
//
// WHY ONE COMPONENT AND NOT A COPY
// The Library bottom nav was the reference: a floating card on mobile, a fixed
// top bar on desktop, and a "Portal" tab that leaves the module entirely. The
// marketplace then grew its own, differently-shaped bar - full-width, flat
// background, dark header above it. Two modules, one system, and no way to tell
// which is the "real" one.
//
// Extracting it here means a change to the bar's shape, spacing or active state
// lands in both modules at once. That is the whole point of doing this.
// =====================================================

/**
 * @param {Array} props.items       `{ label, path, icon, end?, badge? }`
 *   `badge` is a number rendered as a pill on the icon - used by the marketplace
 *   for the cart count. Omit it and the slot renders nothing.
 * @param {Component} props.brandIcon
 * @param {string} props.brandTitle     e.g. "CDM OneServe"
 * @param {string} props.brandSubtitle  e.g. "Library"
 * @param {string} props.homePath       the brand button's own destination
 * @param {string} [props.portalLabel]  defaults to "Portal"
 */
export default function ModuleBottomNav({
    items,
    brandIcon: BrandIcon,
    brandTitle = "CDM OneServe",
    brandSubtitle,
    homePath,
    portalLabel = "Portal",
}) {
    const navigate = useNavigate();

    // Resolved from the stored role, so an Admin leaves for the admin dashboard
    // and everyone else for the student one.
    const portalHome = () => portalHomeForRole(localStorage.getItem("role") || "");

    return (
        <>
            {/* =====================================================
                DESKTOP - FIXED TOP NAV
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
                aria-label={`${brandSubtitle} navigation`}
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
                        onClick={() => navigate(homePath)}
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
                            <BrandIcon
                                size={18}
                                className="text-[#106A2E]"
                            />
                        </div>

                        <div className="text-left">
                            <p className="text-[10px] uppercase tracking-[.22em] text-[#106A2E]/70">
                                {brandTitle}
                            </p>

                            <p className="text-sm text-slate-500">
                                {brandSubtitle}
                            </p>
                        </div>
                    </button>

                    {/* TABS */}

                    <div className="flex items-center gap-1.5">
                        {items.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `
                                        relative
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
                                    {({ isActive }) => (
                                        <>
                                            <Icon size={14} />
                                            {item.label}

                                            {item.badge > 0 && (
                                                <span className="rounded-full bg-amber-300 px-1.5 text-[9px] font-bold text-[#0E3B22]">
                                                    {item.badge > 99
                                                        ? "99+"
                                                        : item.badge}
                                                </span>
                                            )}

                                            {isActive && item.badge > 0 && (
                                                <span className="sr-only">
                                                    , {item.badge} items
                                                </span>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}

                        {/* PORTAL - separated by a rule, because it leaves the
                            module rather than navigating within it. */}

                        <span className="mx-1 h-5 w-px bg-slate-200" />

                        <button
                            type="button"
                            onClick={() => navigate(portalHome())}
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
                            {portalLabel}
                        </button>
                    </div>
                </div>
            </nav>

            {/* =====================================================
                MOBILE - FLOATING BOTTOM NAV
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
                aria-label={`${brandSubtitle} mobile navigation`}
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
                    {items.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                aria-label={
                                    item.badge > 0
                                        ? `${item.label}, ${item.badge} items`
                                        : item.label
                                }
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

                                        {item.badge > 0 && (
                                            <span className="
                                                absolute
                                                right-[18%]
                                                top-1
                                                flex
                                                h-4
                                                min-w-4
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-amber-300
                                                px-1
                                                text-[9px]
                                                font-bold
                                                text-[#0E3B22]
                                            ">
                                                {item.badge > 99
                                                    ? "99+"
                                                    : item.badge}
                                            </span>
                                        )}

                                        {isActive && (
                                            <span className="absolute top-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,106,46,.5)]" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}

                    {/* PORTAL */}

                    <button
                        type="button"
                        onClick={() => navigate(portalHome())}
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
                            {portalLabel}
                        </span>
                    </button>
                </div>
            </nav>
        </>
    );
}