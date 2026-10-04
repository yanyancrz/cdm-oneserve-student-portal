import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import ReturnSearch from "../components/returns/ReturnSearch";
import ReturnConfirmationModal from "../components/returns/ReturnConfirmationModal";
import ScanPatronModal from "../components/borrowing/ScanPatronModal";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";

import { returnService } from "../services/returnService";
import { formatDate } from "../utils/dateUtils";
import { formatPeso } from "../utils/currencyUtils";

const PAGE_SIZE = 10;

export default function ReturnsPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [overdueOnly, setOverdueOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selected, setSelected] = useState(null);
    const [scanOpen, setScanOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    const query = useMemo(
        () => ({
            search: debouncedSearch,
            status: overdueOnly ? "overdue" : "",
            page,
            pageSize: PAGE_SIZE,
        }),
        [debouncedSearch, overdueOnly, page]
    );

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        returnService
            .activeLoans(query, { signal: controller.signal })
            .then(setResult)
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load active loans.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [query, reloadKey]);

    const reload = () => setReloadKey((n) => n + 1);

    const reset = () => {
        setSearch("");
        setOverdueOnly(false);
        setPage(1);
    };

    // A scanned patron fills the search with their ID, so their loans appear.
    const handlePatron = (patron) => {
        setSearch(patron.idNumber || patron.fullName);
    };

    const loans = result?.items || [];
    const firstLoad = loading && !result;
    const hasFilters = Boolean(debouncedSearch) || overdueOnly;

    return (
        <>
            <LibraryPageHeader title="Returns" description="Process returns, book condition, and fines." />

            <div className="space-y-4">
                <ReturnSearch
                    search={search}
                    onSearchChange={setSearch}
                    overdueOnly={overdueOnly}
                    onOverdueChange={(value) => {
                        setOverdueOnly(value);
                        setPage(1);
                    }}
                    onScanClick={() => setScanOpen(true)}
                    onReset={reset}
                />

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    {firstLoad ? (
                        <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading active loans">
                            {[0, 1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                            ))}
                        </div>
                    ) : error && !result ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm font-medium text-gray-700">Unable to load active loans.</p>
                            <p className="mt-1 text-xs text-gray-400">{error}</p>
                            <button
                                type="button"
                                onClick={reload}
                                className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Try again
                            </button>
                        </div>
                    ) : loans.length === 0 ? (
                        <EmptyState
                            icon={RotateCcw}
                            title="No active loans found."
                            description={hasFilters ? "Try a different search or reset the filters." : "Nothing is borrowed right now."}
                        />
                    ) : (
                        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                            {error && (
                                <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-800">
                                    Could not refresh: {error}
                                </p>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[860px] text-left text-sm">
                                    <thead>
                                        <tr className="text-xs uppercase tracking-wide text-gray-400">
                                            <th className="px-5 py-3 font-medium">Txn</th>
                                            <th className="px-3 py-3 font-medium">Patron</th>
                                            <th className="px-3 py-3 font-medium">Book</th>
                                            <th className="px-3 py-3 font-medium">Due</th>
                                            <th className="px-3 py-3 font-medium">Status</th>
                                            <th className="px-3 py-3 text-right font-medium">Fine</th>
                                            <th className="px-5 py-3 text-right font-medium">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-black/[0.04]">
                                        {loans.map((l) => (
                                            <tr key={l.transactionId} className="hover:bg-gray-50/60">
                                                <td className="px-5 py-3 text-gray-500">#{l.transactionId}</td>
                                                <td className="px-3 py-3">
                                                    <p className="max-w-[200px] truncate font-medium text-[#1F1F1F]">{l.patronName}</p>
                                                    <p className="text-xs text-gray-400">{l.patronId || "—"} &middot; {l.patronType}</p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="max-w-[240px] truncate text-gray-800">{l.bookTitle}</p>
                                                    <p className="max-w-[240px] truncate text-xs text-gray-400">{l.author}</p>
                                                </td>
                                                <td className="px-3 py-3 text-gray-600">{formatDate(l.dueDate)}</td>
                                                <td className="px-3 py-3">
                                                    <StatusBadge tone={l.isOverdue ? "red" : "green"}>
                                                        {l.isOverdue ? `${l.overdueDays}d overdue` : "On loan"}
                                                    </StatusBadge>
                                                </td>
                                                <td className="px-3 py-3 text-right text-gray-700">
                                                    {l.fine > 0 ? formatPeso(l.fine) : "—"}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelected(l)}
                                                        className="rounded-lg bg-[#106A2E] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                                                    >
                                                        Return
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                page={result.page}
                                totalPages={result.totalPages}
                                totalItems={result.totalItems}
                                pageSize={result.pageSize}
                                onChange={setPage}
                            />
                        </div>
                    )}
                </section>
            </div>

            {selected && (
                <ReturnConfirmationModal
                    key={selected.transactionId}
                    loan={selected}
                    onClose={() => setSelected(null)}
                    onDone={reload}
                />
            )}

            <ScanPatronModal open={scanOpen} onClose={() => setScanOpen(false)} onPatron={handlePatron} />
        </>
    );
}