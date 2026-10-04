import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus } from "lucide-react";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import BookFilters from "../components/books/BookFilters";
import BookTable from "../components/books/BookTable";
import AddBookModal from "../components/books/AddBookModal";
import EditBookModal from "../components/books/EditBookModal";
import DeleteBookModal from "../components/books/DeleteBookModal";
import BookPreviewModal from "../components/books/BookPreviewModal";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";

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

    return (
        <>
            <LibraryPageHeader title="Books" description="Manage the library catalog and book copies." />

            <div className="space-y-4">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setModal({ type: "add" })}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        <Plus size={16} /> Add Book
                    </button>
                </div>

                <BookFilters
                    search={search}
                    onSearchChange={setSearch}
                    filters={filters}
                    onFilterChange={changeFilter}
                    onReset={resetFilters}
                />

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    {firstLoad ? (
                        <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading books">
                            {[0, 1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                            ))}
                        </div>
                    ) : error && !result ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm font-medium text-gray-700">Unable to load books.</p>
                            <p className="mt-1 text-xs text-gray-400">{error}</p>
                            <button
                                type="button"
                                onClick={reload}
                                className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Try again
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