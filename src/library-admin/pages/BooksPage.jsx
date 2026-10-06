import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, Loader2, Plus, RefreshCw } from "lucide-react";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import BookFilters from "../components/books/BookFilters";
import BookTable from "../components/books/BookTable";
import AddBookModal from "../components/books/AddBookModal";
import EditBookModal from "../components/books/EditBookModal";
import DeleteBookModal from "../components/books/DeleteBookModal";
import BookPreviewModal from "../components/books/BookPreviewModal";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";
import { SkeletonCountBar, SkeletonPagination } from "../components/common/Skeleton";

import { useLibrary } from "../context/LibraryContext";
import { bookService } from "../services/bookService";

const PAGE_SIZE = 10;

const DEFAULT_FILTERS = {
    institute: "",
    yearLevel: "",
    semester: "",
    availability: "",
    sortBy: "title",
};

export default function BooksPage() {
    const { permissions } = useLibrary();

    // Only the Library Head may delete. The backend enforces this too.
    const canDelete = Boolean(permissions?.canManageStaff);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // modal = { type: "add" | "view" | "edit" | "delete", book? }
    const [modal, setModal] = useState(null);

    // Wait for the user to stop typing before searching.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    const query = useMemo(
        () => ({ ...filters, search: debouncedSearch, page, pageSize: PAGE_SIZE }),
        [filters, debouncedSearch, page]
    );

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        bookService
            .list(query, { signal: controller.signal })
            .then(setResult)
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load books.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [query, reloadKey]);

    const reload = () => setReloadKey((n) => n + 1);

    const changeFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setSearch("");
        setPage(1);
    };

    const handleDeleted = () => {
        // Deleting the last row of a page would leave an empty page.
        if (result?.items?.length === 1 && page > 1) setPage((p) => p - 1);
        reload();
    };

    const closeModal = () => setModal(null);

    const books = result?.items || [];
    const firstLoad = loading && !result;
    const hasFilters = Boolean(debouncedSearch) || Object.entries(filters).some(
        ([key, value]) => key !== "sortBy" && value
    );

    const totalBooks = Number(result?.totalItems ?? books.length);

    // Add Book now lives in the page header (top right).
    const addBookButton = (
        <button
            type="button"
            onClick={() => setModal({ type: "add" })}
            className="inline-flex items-center gap-2 rounded-xl bg-[#106A2E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d5a27] hover:shadow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/40 focus-visible:ring-offset-2"
        >
            <Plus size={16} aria-hidden="true" /> Add Book
        </button>
    );

    return (
        <>
            <LibraryPageHeader
                eyebrow="Catalog"
                icon={BookOpen}
                title="Books"
                description="Manage the library catalog and book copies."
                actions={addBookButton}
            />

            <div className="space-y-5">
                <BookFilters
                    loading={firstLoad}
                    search={search}
                    onSearchChange={setSearch}
                    filters={filters}
                    onFilterChange={changeFilter}
                    onReset={resetFilters}
                />

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    {firstLoad ? (
                        <>
                            <SkeletonCountBar />
                            <BookTable books={[]} canDelete={canDelete} loading />
                            <SkeletonPagination />
                        </>
                    ) : error && !result ? (
                        <div className="flex flex-col items-center px-5 py-14 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                                <AlertCircle size={22} aria-hidden="true" />
                            </div>

                            <p className="mt-4 text-sm font-semibold text-gray-800">Unable to load books</p>
                            <p className="mt-1 max-w-sm text-xs text-gray-500">{error}</p>

                            <button
                                type="button"
                                onClick={reload}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d5a27] active:scale-[0.98]"
                            >
                                <RefreshCw size={14} aria-hidden="true" /> Try again
                            </button>
                        </div>
                    ) : books.length === 0 ? (
                        <EmptyState
                            icon={BookOpen}
                            title="No books found."
                            description={
                                hasFilters
                                    ? "Try a different search or reset the filters."
                                    : "Add the first book to start the catalog."
                            }
                        />
                    ) : (
                        <>
                            {/* Count bar. Stays sharp while the table refreshes. */}
                            <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-sm font-semibold text-gray-800">Catalog</h2>

                                    <span className="rounded-full bg-[#E1F0E4] px-2.5 py-0.5 text-xs font-semibold text-[#106A2E]">
                                        {totalBooks} {totalBooks === 1 ? "book" : "books"}
                                    </span>
                                </div>

                                {loading && (
                                    <span
                                        role="status"
                                        className="inline-flex items-center gap-1.5 text-xs text-gray-400"
                                    >
                                        <Loader2 size={13} aria-hidden="true" className="animate-spin" />
                                        Updating...
                                    </span>
                                )}
                            </div>

                            <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                                {error && (
                                    <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-800">
                                        Could not refresh: {error}
                                    </p>
                                )}

                                <BookTable
                                    books={books}
                                    canDelete={canDelete}
                                    onView={(book) => setModal({ type: "view", book })}
                                    onEdit={(book) => setModal({ type: "edit", book })}
                                    onDelete={(book) => setModal({ type: "delete", book })}
                                />

                                <Pagination
                                    page={result.page}
                                    totalPages={result.totalPages}
                                    totalItems={result.totalItems}
                                    pageSize={result.pageSize}
                                    onChange={setPage}
                                />
                            </div>
                        </>
                    )}
                </section>
            </div>

            <AddBookModal open={modal?.type === "add"} onClose={closeModal} onSaved={reload} />

            {modal?.type === "view" && <BookPreviewModal book={modal.book} onClose={closeModal} />}

            {modal?.type === "edit" && (
                <EditBookModal book={modal.book} onClose={closeModal} onSaved={reload} />
            )}

            {modal?.type === "delete" && (
                <DeleteBookModal book={modal.book} onClose={closeModal} onDeleted={handleDeleted} />
            )}
        </>
    );
}