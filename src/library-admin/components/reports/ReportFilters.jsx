import { GRANULARITIES, RANGE_PRESETS, daysAgo, toInputDate } from "../../config/reportOptions";

const field =
    "rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#106A2E]";

export default function ReportFilters({ from, to, granularity, onChange }) {
    const today = toInputDate(new Date());

    return (
        <div className="no-print flex flex-wrap items-end gap-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
            <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">From</span>
                <input
                    type="date"
                    className={field}
                    value={from}
                    max={to || today}
                    onChange={(e) => e.target.value && onChange({ from: e.target.value })}
                />
            </label>

            <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">To</span>
                <input
                    type="date"
                    className={field}
                    value={to}
                    min={from}
                    max={today}
                    onChange={(e) => e.target.value && onChange({ to: e.target.value })}
                />
            </label>

            <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">Group by</span>
                <select
                    className={field}
                    value={granularity}
                    onChange={(e) => onChange({ granularity: e.target.value })}
                >
                    {GRANULARITIES.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                </select>
            </label>

            <div className="ml-auto flex flex-wrap gap-1.5">
                {RANGE_PRESETS.map((p) => (
                    <button
                        key={p.key}
                        type="button"
                        onClick={() => onChange({ from: daysAgo(p.days), to: today })}
                        className="rounded-lg border border-black/[0.08] px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                        {p.label}
                    </button>
                ))}
            </div>
        </div>
    );
}