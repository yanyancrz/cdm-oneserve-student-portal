import { Search, X } from "lucide-react";

import { AVAILABILITY, INSTITUTES, SEMESTERS, SORT_OPTIONS, YEAR_LEVELS } from "../../config/bookOptions";

const select =
    "rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#106A2E]";

export default function BookFilters({ search, onSearchChange, filters, onFilterChange, onReset }) {
    const set = (key) => (e) => onFilterChange(key, e.target.value);

    return (
        <div className="space-y-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                    type="search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search title, author, ISBN, call number, or subject"
                    className="w-full rounded-lg border border-black/[0.08] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#106A2E]"
                />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <select className={select} value={filters.institute} onChange={set("institute")} aria-label="Institute">
                    <option value="">All institutes</option>
                    {INSTITUTES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                <select className={select} value={filters.yearLevel} onChange={set("yearLevel")} aria-label="Year level">
                    <option value="">All years</option>
                    {YEAR_LEVELS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>

                <select className={select} value={filters.semester} onChange={set("semester")} aria-label="Semester">
                    <option value="">All semesters</option>
                    {SEMESTERS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <select className={select} value={filters.availability} onChange={set("availability")} aria-label="Availability">
                    <option value="">All availability</option>
                    {AVAILABILITY.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                <select className={`${select} ml-auto`} value={filters.sortBy} onChange={set("sortBy")} aria-label="Sort by">
                    {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>Sort: {o.label}</option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-100"
                >
                    <X size={14} /> Reset
                </button>
            </div>
        </div>
    );
}