import { QrCode, Search, X } from "lucide-react";

export default function ReturnSearch({ search, onSearchChange, overdueOnly, onOverdueChange, onScanClick, onReset }) {
    return (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
            <div className="relative min-w-[280px] flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Transaction ID, student/employee ID, name, or book title"
                    className="w-full rounded-lg border border-black/[0.08] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#106A2E]"
                />
            </div>

            <button
                type="button"
                onClick={onScanClick}
                className="inline-flex items-center gap-2 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
                <QrCode size={16} /> Scan QR
            </button>

            <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={overdueOnly} onChange={(e) => onOverdueChange(e.target.checked)} />
                Overdue only
            </label>

            <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-100"
            >
                <X size={14} /> Reset
            </button>
        </div>
    );
}