import { ChevronDown, RotateCcw, Search, X } from "lucide-react";

import { AVAILABILITY, INSTITUTES, SEMESTERS, SORT_OPTIONS, YEAR_LEVELS } from "../../config/bookOptions";

// =========================================================
// SKELETON (same card, same control heights, so nothing
// jumps when the real filters appear)
// =========================================================

function Bone({ className = "" }) {
    return <div className={`rounded-xl bg-gray-100 motion-safe:animate-pulse ${className}`} />;
}

function FiltersSkeleton() {
    return (
        <div
            role="status"
            aria-busy="true"
            aria-live="polite"
            className="space-y-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"
        >
            <span className="sr-only">Loading filters...</span>

            <Bone className="h-[42px] w-full" />

            <div className="flex flex-wrap items-center gap-2">
                {[0, 1, 2, 3].map((n) => (
                    <Bone key={n} className="h-[38px] w-[9.5rem]" />
                ))}

                <Bone className="ml-auto h-[38px] w-40" />
            </div>
        </div>
    );
}

// =========================================================
// SELECT (custom arrow; turns green when a filter is applied)
// =========================================================

function FilterSelect({ label, value, onChange, active = false, className = "", children }) {
    return (
        <div className={`relative ${className}`}>
            <select
                aria-label={label}
                value={value}
                onChange={onChange}
                className={`h-[38px] w-full appearance-none rounded-xl border pl-3 pr-9 text-sm outline-none transition focus:border-[#106A2E] focus:ring-4 focus:ring-[#106A2E]/10 ${
                    active
                        ? "border-[#106A2E]/40 bg-[#E1F0E4]/60 font-medium text-[#106A2E]"
                        : "border-black/[0.08] bg-white text-gray-700 hover:border-black/[0.16]"
                }`}
            >
                {children}
            </select>

            <ChevronDown
                size={14}
                aria-hidden="true"
                className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
                    active ? "text-[#106A2E]" : "text-gray-400"
                }`}
            />
        </div>
    );
}

/**
 * Props:
 *  - search / onSearchChange
 *  - filters / onFilterChange(key, value) / onReset
 *  - loading : (optional) show a skeleton instead of the controls
 */
export default function BookFilters({
    search,
    onSearchChange,
    filters,
    onFilterChange,
    onReset,
    loading = false,
}) {
    if (loading) return <FiltersSkeleton />;

    const set = (key) => (e) => onFilterChange(key, e.target.value);

    // How many filters are applied (sorting does not count).
    const activeCount =
        [filters.institute, filters.yearLevel, filters.semester, filters.availability].filter(Boolean).length +
        (search.trim() ? 1 : 0);

    return (
        <div className="space-y-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
            {/* SEARCH */}

            <div className="relative">
                <Search
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                    type="search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search title, author, ISBN, call number, or subject"
                    aria-label="Search books"
                    className="h-[42px] w-full rounded-xl border border-black/[0.08] bg-[#F7F5EF]/70 pl-10 pr-10 text-sm outline-none transition placeholder:text-gray-400 hover:border-black/[0.16] focus:border-[#106A2E] focus:bg-white focus:ring-4 focus:ring-[#106A2E]/10 [&::-webkit-search-cancel-button]:appearance-none"
                />

                {search && (
                    <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* FILTERS + SORT */}

            <div className="flex flex-wrap items-center gap-2">
                <FilterSelect
                    label="Institute"
                    value={filters.institute}
                    onChange={set("institute")}
                    active={Boolean(filters.institute)}
                    className="min-w-[9.5rem]"
                >
                    <option value="">All institutes</option>
                    {INSTITUTES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </FilterSelect>

                <FilterSelect
                    label="Year level"
                    value={filters.yearLevel}
                    onChange={set("yearLevel")}
                    active={Boolean(filters.yearLevel)}
                    className="min-w-[9.5rem]"
                >
                    <option value="">All years</option>
                    {YEAR_LEVELS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </FilterSelect>

                <FilterSelect
                    label="Semester"
                    value={filters.semester}
                    onChange={set("semester")}
                    active={Boolean(filters.semester)}
                    className="min-w-[9.5rem]"
                >
                    <option value="">All semesters</option>
                    {SEMESTERS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </FilterSelect>

                <FilterSelect
                    label="Availability"
                    value={filters.availability}
                    onChange={set("availability")}
                    active={Boolean(filters.availability)}
                    className="min-w-[9.5rem]"
                >
                    <option value="">All availability</option>
                    {AVAILABILITY.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </FilterSelect>

                <FilterSelect
                    label="Sort by"
                    value={filters.sortBy}
                    onChange={set("sortBy")}
                    className="ml-auto min-w-[10rem]"
                >
                    {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>Sort: {o.label}</option>
                    ))}
                </FilterSelect>

                <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/30"
                >
                    <RotateCcw size={13} aria-hidden="true" />
                    Reset

                    {activeCount > 0 && (
                        <span className="rounded-full bg-[#106A2E] px-1.5 text-[10px] font-semibold leading-4 text-white">
                            {activeCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}