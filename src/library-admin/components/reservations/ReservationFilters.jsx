import { Search, X } from "lucide-react";

const select =
    "h-10 rounded-lg border border-black/[0.12] bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15";

// value is what the API expects in ?status=
// count is the key in the summary (the chip hides when a legacy status has no rows).
const CHIPS = [
    { value: "", label: "All", count: "total" },
    { value: "active", label: "Active", count: "active" },
    { value: "Reserved", label: "Reserved", count: "reserved" },
    { value: "Pending", label: "Pending", count: "pending", hideWhenEmpty: true },
    { value: "Approved", label: "Approved", count: "approved", hideWhenEmpty: true },
    { value: "ReadyForPickup", label: "Ready for pickup", count: "readyForPickup" },
    { value: "Claimed", label: "Claimed", count: "claimed" },
    { value: "Rejected", label: "Rejected", count: "rejected" },
    { value: "Cancelled", label: "Cancelled", count: "cancelled" },
    { value: "Expired", label: "Expired", count: "expired" },
];

export default function ReservationFilters({
    search,
    onSearchChange,
    filters,
    onFilterChange,
    summary,
    onReset,
}) {
    const chips = CHIPS.filter((chip) => !(chip.hideWhenEmpty && !(summary?.[chip.count] > 0)));

    return (
        <div className="space-y-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
                <label className="relative block flex-1">
                    <span className="sr-only">Search reservations</span>
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search patron, ID number, book title, ISBN, or reservation #"
                        className="h-10 w-full rounded-lg border border-black/[0.12] bg-white pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15"
                    />
                </label>

                <select
                    aria-label="Patron type"
                    className={select}
                    value={filters.patronType}
                    onChange={(e) => onFilterChange("patronType", e.target.value)}
                >
                    <option value="">All patrons</option>
                    <option value="Student">Students</option>
                    <option value="Faculty">Faculty</option>
                </select>

                <select
                    aria-label="Sort"
                    className={select}
                    value={filters.sort}
                    onChange={(e) => onFilterChange("sort", e.target.value)}
                >
                    <option value="newest">Sort: Newest</option>
                    <option value="oldest">Sort: Oldest</option>
                    <option value="expiring">Sort: Expiring soon</option>
                </select>

                <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-sm text-gray-500 transition hover:bg-gray-100"
                >
                    <X size={14} /> Reset
                </button>
            </div>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Reservation status">
                {chips.map((chip) => {
                    const selected = filters.status === chip.value;
                    const count = summary?.[chip.count];

                    return (
                        <button
                            key={chip.label}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => onFilterChange("status", chip.value)}
                            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                selected
                                    ? "border-[#106A2E] bg-[#106A2E] text-white"
                                    : "border-black/[0.1] bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            {chip.label}
                            {count != null && (
                                <span
                                    className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                                        selected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}