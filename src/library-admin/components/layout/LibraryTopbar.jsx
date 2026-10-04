import { useLocation } from "react-router-dom";

import { findNavItem } from "../../config/navigation";
import { useLibrary } from "../../context/LibraryContext";

function getInitials(name) {
    if (!name || !name.trim()) return "L";

    return name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export default function LibraryTopbar() {
    const { pathname } = useLocation();
    const { user } = useLibrary();

    const currentPage = findNavItem(pathname)?.label || "Library";

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <header className="flex min-h-[72px] items-center justify-between border-b border-[#E5E1D8] bg-white px-4 py-3 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="min-w-0">
                <p className="truncate text-sm text-gray-400">
                    Library Administration
                    <span className="mx-1.5 text-gray-300">/</span>
                    <span className="font-medium text-gray-700">{currentPage}</span>
                </p>
            </nav>

            <div className="flex items-center gap-4">
                <span className="hidden text-sm text-gray-400 md:block">{today}</span>

                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0E3B22] text-sm font-semibold text-white"
                        aria-hidden="true"
                    >
                        {getInitials(user?.fullName)}
                    </div>

                    <div className="hidden min-w-0 sm:block">
                        <p className="truncate text-sm font-medium leading-tight text-gray-800">
                            {user?.fullName || "Library"}
                        </p>
                        <p className="truncate text-xs text-gray-400">{user?.roleLabel}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}