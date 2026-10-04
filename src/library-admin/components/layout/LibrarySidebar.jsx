import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";

import Logo from "../../../assets/images/lightlogo.png";
import { LIBRARY_NAV } from "../../config/navigation";
import { useLibrary } from "../../context/LibraryContext";

export default function LibrarySidebar() {
    const { permissions, logout } = useLibrary();

    // Hide anything the signed-in role can't use, and drop empty groups.
    const groups = LIBRARY_NAV.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.permission || permissions?.[item.permission]),
    })).filter((group) => group.items.length > 0);

    return (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-20 flex-col overflow-y-auto overflow-x-hidden border-r border-white/10 bg-[#0E3B22] lg:w-64">
            {/* Logo */}
            <div className="flex flex-col items-center justify-center gap-2 border-b border-white/10 px-3 py-5 lg:px-6 lg:py-6">
                <img
                    src={Logo}
                    alt="CDM OneServe"
                    className="h-10 w-auto object-contain lg:h-20"
                />

                <p className="hidden text-center text-[11px] font-medium text-white/50 lg:block">
                    Library Administration
                </p>
            </div>

            {/* Navigation */}
            <nav aria-label="Library navigation" className="flex-1 p-2 lg:p-4">
                {groups.map((group, index) => (
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
                                        title={item.label}
                                        className={({ isActive }) =>
                                            `flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/40 lg:justify-start lg:px-4 ${
                                                isActive
                                                    ? "bg-white/10 text-white shadow-sm"
                                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                                            }`
                                        }
                                    >
                                        <Icon size={18} className="shrink-0" />
                                        <span className="hidden truncate lg:block">{item.label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Logout */}
            <div className="border-t border-white/10 p-2 lg:p-4">
                <button
                    type="button"
                    onClick={logout}
                    title="Log out"
                    className="flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none transition hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 lg:justify-start lg:px-4"
                >
                    <LogOut size={18} className="shrink-0" />
                    <span className="hidden lg:block">Log out</span>
                </button>
            </div>
        </aside>
    );
}