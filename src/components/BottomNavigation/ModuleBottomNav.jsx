import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { useState } from "react";

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
 * @param {Array} props.items       route items: `{ label, path, icon, end?, badge? }`
 *   action items: `{ label, icon, onClick, active?, badge? }` - for tabs that
 *   open an in-page sheet instead of navigating (the counselor's Alerts). The
 *   caller owns what `active` means; for a route item the URL decides.
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

    // ---- Mobile crowding ----
    // A module with ten tabs (the staff console) cannot fit in one pill:
    // five tappable slots, each with ancora icon, tekstong 10px, and a
    // glowing dot. So on mobile the first few - the frequent ones, set by
    // the caller's ordering - stay as tabs, the rest go behind a "More"
    // sheet. On desktop there is room in the top bar, so ENERYTHING is
    // shown there. For a module with four or fewer tabs (Library, the
    // market store) there is no overflow and no "More" tab at all.
    const location = useLocation();
    const [moreOpen, setMoreOpen] = useState(false);

    const overflow = items.length > 4;
    const primaryCount = overflow ? 3 : items.length;
    const visibleItems = items.slice(0, primaryCount);
    const overflowItems = items.slice(primaryCount);

    const isOverflowActive = overflowItems.some((item) =>
        item.path
            ? item.end
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path)
            : item.active
    );

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
                            const key = item.path ?? item.label;

                            // A ROUTE item navigates with NavLink and takes its
                            // active state from the URL. An ACTION item (the
                            // counselor's Alerts: opens a sheet, goes nowhere)
                            // is a button and takes its active state from the
                            // caller, which owns the sheet's open state.
                            if (item.onClick) {
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={item.onClick}
                                        aria-expanded={item.active}
                                        className={`
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
                                                item.active
                                                    ? "bg-emerald-50 text-[#106A2E]"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                            }
                                        `}
                                    >
                                        <Icon size={14} />
                                        {item.label}

                                        {item.badge > 0 && (
                                            <span className="rounded-full bg-amber-300 px-1.5 text-[9px] font-bold text-[#0E3B22]">
                                                {item.badge > 99 ? "99+" : item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            }

                            return (
                                <NavLink
                                    key={key}
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
                    {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const key = item.path ?? item.label;

                        if (item.onClick) {
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={item.onClick}
                                    aria-expanded={item.active}
                                    aria-label={
                                        item.badge > 0
                                            ? `${item.label}, ${item.badge} unread`
                                            : item.label
                                    }
                                    className={`
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
                                            item.active
                                                ? "bg-emerald-50 text-[#106A2E]"
                                                : "text-slate-400"
                                        }
                                    `}
                                >
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
                                            {item.badge > 99 ? "99+" : item.badge}
                                        </span>
                                    )}

                                    {item.active && (
                                        <span className="absolute top-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,106,46,.5)]" />
                                    )}
                                </button>
                            );
                        }

                        return (
                            <NavLink
                                key={key}
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

                    {/* MORE - only when there are too many tabs to fit in one
                        pill. Its highlight mirrors whether the user is on a page
                        that lives inside the More sheet. */}
                    {overflow && (
                        <button
                            type="button"
                            onClick={() => setMoreOpen(true)}
                            aria-label="More modules"
                            className={`
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
                                    isOverflowActive || moreOpen
                                        ? "bg-emerald-50 text-[#106A2E]"
                                        : "text-slate-400"
                                }
                            `}
                        >
                            <MoreHorizontal size={18} />
                            <span className="text-[10px] font-semibold">
                                More
                            </span>
                            {isOverflowActive && (
                                <span className="absolute top-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,106,46,.5)]" />
                            )}
                        </button>
                    )}

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

            {/* =====================================================
                MORE SHEET - the tabs that were too many for the pill
                slide up over the bottom sheet backdrop. Action items
                keep their onClick; route items navigate and then the
                sheet closes.
            ===================================================== */}
            <div
                className={`fixed inset-0 z-[60] transition-opacity duration-200 md:hidden ${
                    moreOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                onClick={() => setMoreOpen(false)}
                aria-hidden={!moreOpen}
            />

            <div
                className={`fixed inset-x-3 bottom-3 z-[70] transition-transform duration-200 md:hidden ${
                    moreOpen ? "translate-y-0" : "translate-y-[110%]"
                }`}
            >
                <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl shadow-black/10 backdrop-blur-2xl">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">
                        More {brandSubtitle}
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                        {overflowItems.map((item) => {
                            const Icon = item.icon;

                            if (item.onClick) {
                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => {
                                            setMoreOpen(false);
                                            item.onClick();
                                        }}
                                        className={`flex flex-col items-center gap-1 rounded-xl px-2 py-4 text-center transition active:scale-95 ${
                                            item.active
                                                ? "bg-emerald-50 text-[#106A2E]"
                                                : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <Icon size={18} />
                                        <span className="text-[10px] font-semibold leading-tight">
                                            {item.label}
                                        </span>
                                        {item.badge > 0 && (
                                            <span className="rounded-full bg-amber-300 px-1.5 text-[9px] font-bold text-[#0E3B22]">
                                                {item.badge > 99 ? "99+" : item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            }

                            return (
                                <NavLink
                                    key={item.path ?? item.label}
                                    to={item.path}
                                    end={item.end}
                                    onClick={() => setMoreOpen(false)}
                                    className={({ isActive }) =>
                                        `flex flex-col items-center gap-1 rounded-xl px-2 py-4 text-center transition active:scale-95 ${
                                            isActive
                                                ? "bg-emerald-50 text-[#106A2E]"
                                                : "text-slate-600 hover:bg-slate-50"
                                        }`
                                    }
                                >
                                    <Icon size={18} />
                                    <span className="text-[10px] font-semibold leading-tight">
                                        {item.label}
                                    </span>
                                    {item.badge > 0 && (
                                        <span className="rounded-full bg-amber-300 px-1.5 text-[9px] font-bold text-[#0E3B22]">
                                            {item.badge > 99 ? "99+" : item.badge}
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}