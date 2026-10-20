import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

export default function Pagination({
    page,
    totalPages,
    totalItems,
    pageSize,
    onChange,
    loading = false,
}) {
    const tp = Math.max(1, Number(totalPages) || 1);
    const cp = Math.min(Math.max(1, Number(page) || 1), tp);
    const items = Number(totalItems) || 0;

    if (!items && !loading) return null;

    const from = items ? (cp - 1) * pageSize + 1 : 0;
    const to = items ? Math.min(cp * pageSize, items) : 0;

    const goTo = (next) => {
        if (loading) return;
        if (next < 1 || next > tp || next === cp) return;
        onChange?.(next);
    };

    // Compact page-number list with ellipses for large page counts.
    const pageNumbers = [];
    if (tp <= 7) {
        for (let i = 1; i <= tp; i++) pageNumbers.push(i);
    } else {
        pageNumbers.push(1);
        const start = Math.max(2, cp - 1);
        const end = Math.min(tp - 1, cp + 1);
        if (start > 2) pageNumbers.push("ellipsis-start");
        for (let i = start; i <= end; i++) pageNumbers.push(i);
        if (end < tp - 1) pageNumbers.push("ellipsis-end");
        pageNumbers.push(tp);
    }

    const btnBase =
        "flex h-8 min-w-[2rem] items-center justify-center rounded-lg border border-black/[0.08] px-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/30";

    const activeBtn =
        "flex h-8 min-w-[2rem] items-center justify-center rounded-lg border border-[#106A2E] bg-[#106A2E] px-2 text-xs font-semibold text-white";

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.05] px-5 py-3">
            <p className="text-xs text-gray-500" aria-live="polite">
                {loading
                    ? "Loading…"
                    : items
                      ? `Showing ${from}–${to} of ${items} record${items === 1 ? "" : "s"}`
                      : "No records"}
            </p>

            <nav
                className="flex flex-wrap items-center gap-1.5"
                aria-label="Pagination"
            >
                <button
                    type="button"
                    className={btnBase}
                    disabled={loading || cp <= 1}
                    onClick={() => goTo(cp - 1)}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} aria-hidden="true" />
                </button>

                {pageNumbers.map((entry) => {
                    if (typeof entry === "string") {
                        return (
                            <span
                                key={entry}
                                className="flex h-8 w-8 items-center justify-center text-gray-400"
                                aria-hidden="true"
                            >
                                <MoreHorizontal size={16} />
                            </span>
                        );
                    }

                    const isActive = entry === cp;
                    return (
                        <button
                            key={entry}
                            type="button"
                            className={isActive ? activeBtn : btnBase}
                            disabled={loading}
                            aria-current={isActive ? "page" : undefined}
                            aria-label={`Page ${entry}`}
                            onClick={() => goTo(entry)}
                        >
                            {entry}
                        </button>
                    );
                })}

                <button
                    type="button"
                    className={btnBase}
                    disabled={loading || cp >= tp}
                    onClick={() => goTo(cp + 1)}
                    aria-label="Next page"
                >
                    <ChevronRight size={16} aria-hidden="true" />
                </button>

                <span className="ml-1 text-xs text-gray-500">
                    Page {cp} of {tp}
                </span>
            </nav>
        </div>
    );
}