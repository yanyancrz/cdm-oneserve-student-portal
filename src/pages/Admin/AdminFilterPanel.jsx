import { useId, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

export default function AdminFilterPanel({ title = "Search and filters", children }) {
    const [open, setOpen] = useState(true);
    const id = useId();
    return <section className="admin-surface mb-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-[#0E3B22]"><SlidersHorizontal size={17} aria-hidden="true" /></span>
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            </div>
            <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls={id} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                {open ? "Hide filters" : "Show filters"}<ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
        </div>
        <div id={id} hidden={!open} className="border-t border-gray-100 bg-gray-50/60 p-4">{children}</div>
    </section>;
}
