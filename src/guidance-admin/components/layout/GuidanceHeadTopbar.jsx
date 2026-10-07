import { useLocation } from "react-router-dom";
import { CalendarDays, ChevronRight, HeartHandshake } from "lucide-react";

import { findNavItem } from "../../config/navigation";
import { useGuidanceHead } from "../../context/guidanceHeadStore";
import { Skeleton } from "../common";

function getInitials(name) {
    if (!name || !name.trim()) return "G";

    return name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

// Props
//  - loading : (optional) force the account area to show a skeleton.
//              It also shows one by itself while the account is not loaded yet.
export default function GuidanceHeadTopbar({ loading = false }) {
    const { pathname } = useLocation();
    const { user } = useGuidanceHead();

    const userLoading = loading || !user;

    const currentPage = findNavItem(pathname)?.label || "Guidance";

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-[#E5E1D8] bg-white px-4 py-3 shadow-[0_1px_0_rgba(14,59,34,0.03)] sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="min-w-0">
                <ol className="flex min-w-0 items-center gap-2 text-sm">
                    <li className="hidden shrink-0 items-center gap-2 sm:flex">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E1F0E4] text-[#106A2E]">
                            <HeartHandshake size={15} aria-hidden="true" />
                        </span>

                        <span className="text-gray-400">Guidance Administration</span>

                        <ChevronRight size={14} aria-hidden="true" className="text-gray-300" />
                    </li>

                    <li aria-current="page" className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold text-gray-800">
                            {currentPage}
                        </span>
                    </li>
                </ol>
            </nav>

            {/* Date + signed-in user */}
            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                <div className="hidden items-center gap-2 rounded-full bg-[#F7F5EF] px-3.5 py-1.5 text-xs font-medium text-gray-500 md:flex">
                    <CalendarDays size={14} aria-hidden="true" className="text-[#106A2E]" />
                    <span>{today}</span>
                </div>

                <div className="hidden h-8 w-px bg-[#E5E1D8] md:block" aria-hidden="true" />

                {userLoading ? (
                    <div role="status" aria-busy="true" className="flex items-center gap-2.5">
                        <span className="sr-only">Loading account...</span>

                        <Skeleton className="h-10 w-10 rounded-full" />

                        <div className="hidden space-y-2 sm:block">
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2.5">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-sm font-semibold text-white shadow-sm ring-2 ring-[#E1F0E4]"
                            aria-hidden="true"
                        >
                            {getInitials(user?.fullName)}
                        </div>

                        <div className="hidden min-w-0 sm:block">
                            <p
                                title={user?.fullName || undefined}
                                className="max-w-[180px] truncate text-sm font-semibold leading-tight text-gray-800"
                            >
                                {user?.fullName || "Guidance"}
                            </p>

                            {user?.roleLabel && (
                                <p className="truncate text-xs text-gray-400">{user.roleLabel}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
