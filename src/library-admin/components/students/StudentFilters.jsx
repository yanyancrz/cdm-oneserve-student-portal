import { X } from "lucide-react";

import StudentSearch from "./StudentSearch";
import { YEAR_LEVELS } from "../../config/bookOptions";

const select =
    "rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#106A2E]";

const STATUSES = ["Active", "Pending", "Suspended", "Inactive"];

export default function StudentFilters({
    search,
    onSearchChange,
    filters,
    courses = [],
    onFilterChange,
    onReset,
}) {
    const set = (key) => (e) => onFilterChange(key, e.target.value);

    return (
        <div className="space-y-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
            <StudentSearch value={search} onChange={onSearchChange} />

            <div className="flex flex-wrap items-center gap-2">
                <select className={select} value={filters.course} onChange={set("course")} aria-label="Course">
                    <option value="">All courses</option>
                    {courses.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <select className={select} value={filters.yearLevel} onChange={set("yearLevel")} aria-label="Year level">
                    <option value="">All years</option>
                    {YEAR_LEVELS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>

                <select className={select} value={filters.status} onChange={set("status")} aria-label="Account status">
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={onReset}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-100"
                >
                    <X size={14} /> Reset
                </button>
            </div>
        </div>
    );
}