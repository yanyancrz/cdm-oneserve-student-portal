import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";

import Logo from "../../../assets/images/lightlogo.png";
import { GUIDANCE_HEAD_NAV } from "../../config/navigation";
import { useGuidanceHead } from "../../context/guidanceHeadStore";
import { Skeleton } from "../common";

// Thin, dark scrollbar. The default light one clashes with the green sidebar.
const SIDEBAR_SCROLLBAR = [
    "[scrollbar-width:thin]",
    "[scrollbar-color:rgba(255,255,255,0.18)_transparent]",
    "hover:[scrollbar-color:rgba(255,255,255,0.35)_transparent]",
    "[&::-webkit-scrollbar]:w-1.5",
    "[&::-webkit-scrollbar-track]:bg-transparent",
    "[&::-webkit-scrollbar-thumb]:rounded-full",
    "[&::-webkit-scrollbar-thumb]:bg-white/20",
    "hover:[&::-webkit-scrollbar-thumb]:bg-white/40",
].join(" ");

// Every nav path. Used to find links that are the parent of another link.
const ALL_PATHS = GUIDANCE_HEAD_NAV.flatMap((group) => group.items.map((item) => item.to));

// A parent link (e.g. "/admin/guidance" next to "/admin/guidance/counselors")
// must match exactly. Otherwise it stays highlighted on every child page.
const needsExactMatch = (to) =>
    ALL_PATHS.some((other) => other !== to && other.startsWith(`${to}/`));

// Menu placeholder: the number of items in each group.
const NAV_SKELETON_GROUPS = [1, 2, 1, 1, 1];

function SidebarNavSkeleton() {
    return (
        <div role="status" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading menu...</span>

            {NAV_SKELETON_GROUPS.map((count, g) => (
                <div key={g}>
                    <Skeleton tone="dark" className="mx-4 mb-2 mt-5 hidden h-3 w-16 lg:block" />
                    <div className="mx-3 my-2 border-t border-white/10 lg:hidden" />

                    <div className="space-y-1">
                        {Array.from({ length: count }, (_, n) => (
                            <Skeleton key={n} tone="dark" className="h-10 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Props
//  - loading : (optional) show a skeleton instead of the menu items.
//              The logo and the Log out button always stay.
export default function GuidanceHeadSidebar({ loading = false }) {
    const { permissions, logout } = useGuidanceHead();
    const [loggingOut, setLoggingOut] = useState(false);

    // Hide anything the signed-in role can't use, and drop empty groups.
    const groups = useMemo(
        () =>
            GUIDANCE_HEAD_NAV.map((group) => ({
                ...group,
                items: group.items.filter(
                    (item) => !item.permission || permissions?.[item.permission]
                ),
            })).filter((group) => group.items.length > 0),
        [permissions]
    );

    // Blocks double clicks while the logout is running.
    const handleLogout = async () => {
        if (loggingOut) return;

        setLoggingOut(true);

        try {
            await logout();
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 flex w-20 flex-col overflow-y-auto overflow-x-hidden border-r border-white/10 bg-[#0E3B22] lg:w-64 ${SIDEBAR_SCROLLBAR}`}
        >
            {/* Logo */}
            <div className="flex flex-col items-center justify-center gap-2 border-b border-white/10 px-3 py-5 lg:px-6 lg:py-6">
                <img
                    src={Logo}
                    alt="CDM OneServe"
                    className="h-10 w-auto object-contain lg:h-20"
                />

                <p className="hidden text-center text-[11px] font-medium text-white/50 lg:block">
                    Guidance Administration
                </p>
            </div>

            {/* Navigation */}
            <nav
                aria-label="Guidance Administration navigation"
                aria-busy={loading || undefined}
                className="flex-1 p-2 lg:p-4"
            >
                {loading ? (
                    <SidebarNavSkeleton />
                ) : (
                    groups.map((group, index) => (
                        <div key={group.heading || `group-${index}`}>
                            {group.heading && (
                                <>
                                    <p className="hidden px-4 pb-1 pt-4 text-[11px] font-medium text-white/40 lg:block">
                                        {group.heading}
                                    </p>
                                    <div className="mx-3 my-2 border-t border-white/10 lg:hidden" />
                                </>
                            )}

                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            end={needsExactMatch(item.to)}
                                            title={item.label}
                                            // The text label is hidden on narrow screens,
                                            // so screen readers need this.
                                            aria-label={item.label}
                                            className={({ isActive }) =>
                                                `flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/40 lg:justify-start lg:px-4 ${
                                                    isActive
                                                        ? "bg-white/10 text-white shadow-sm"
                                                        : "text-white/60 hover:bg-white/5 hover:text-white"
                                                }`
                                            }
                                        >
                                            <Icon size={18} aria-hidden="true" className="shrink-0" />
                                            <span className="hidden truncate lg:block">{item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </nav>

            {/* Logout (stays visible even when the menu is taller than the screen) */}
            <div className="sticky bottom-0 border-t border-white/10 bg-[#0E3B22] p-2 lg:p-4">
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    title="Log out"
                    aria-label="Log out"
                    className="flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none transition hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start lg:px-4"
                >
                    <LogOut size={18} aria-hidden="true" className="shrink-0" />
                    <span className="hidden lg:block">
                        {loggingOut ? "Logging out..." : "Log out"}
                    </span>
                </button>
            </div>
        </aside>
    );
}
