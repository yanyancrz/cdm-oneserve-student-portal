import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, totalItems, pageSize, onChange }) {
    if (!totalItems) return null;

    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalItems);

    const btn =
        "flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.05] px-5 py-3">
            <p className="text-xs text-gray-500">
                Showing {from}-{to} of {totalItems}
            </p>

            <div className="flex items-center gap-2">
                <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
                    <ChevronLeft size={16} />
                </button>

                <span className="text-xs text-gray-600">
                    Page {page} of {Math.max(totalPages, 1)}
                </span>

                <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}