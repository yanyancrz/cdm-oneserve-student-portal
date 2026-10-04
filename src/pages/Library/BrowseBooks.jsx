import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Heart, Search } from "lucide-react";

import BookDetailsModal from "../../components/Library/BookDetailsModal";
import LibraryBottomNav from "../../components/BottomNavigation/LibraryBottomNav";

import useLibrary from "../../hooks/useLibrary";

import { API_URL } from "../../config/api";

// =========================================================
// CONSTANTS
// =========================================================

const STATUS_FILTERS = [
    { value: "All", label: "All books" },
    { value: "Available", label: "Available now" },
    { value: "Unavailable", label: "Not available" },
];

// =========================================================
// HELPERS
// =========================================================

const getCategoryValue = (category) =>
    typeof category === "string"
        ? category
        : category?.value ??
          category?.name ??
          category?.label ??
          "";

const getBookKey = (book, index) =>
    book.id ??
    book.bookId ??
    `${book.isbn ?? "book"}-${index}`;

// The API stores covers as a relative path ("library/covers/abc.jpg"),
// so it must be loaded from the API server, not from the Vite dev server.
const toApiUrl = (path) => {
    if (!path) return "";

    const value = String(path);

    if (/^(https?:|data:|blob:)/i.test(value)) return value;

    return `${API_URL}/${value.replace(/^\/+/, "")}`;
};

const getCover = (book) =>
    toApiUrl(
        book.coverUrl ??
        book.cover ??
        book.coverImage ??
        book.imageUrl ??
        ""
    );

const isBookAvailable = (book) =>
    Number(book.availableCopies ?? 0) > 0 &&
    String(book.status || "").toLowerCase() !== "unavailable";

const getAvailability = (book) => {
    const available = Number(book.availableCopies ?? 0);
    const total = Number(book.totalCopies ?? 0);

    if (!isBookAvailable(book)) {
        return {
            label: "Unavailable",
            className: "bg-red-50 text-red-600",
        };
    }

    if (
        total > 0 &&
        available <= Math.ceil(total * 0.25)
    ) {
        return {
            label: `${available} left`,
            className: "bg-amber-50 text-amber-700",
        };
    }

    return {
        label: `${available} available`,
        className: "bg-emerald-50 text-emerald-700",
    };
};

const Skeleton = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded-xl bg-slate-200 ${className}`}
    />
);

// =========================================================
// BOOK CARD
// =========================================================

function BrowseBookCard({
    book,
    onOpen,
    favorite,
    onToggleFavorite,
}) {
    const availability = getAvailability(book);
    const cover = getCover(book);

    // Show the placeholder icon if the image fails to load.
    const [coverFailed, setCoverFailed] = useState(false);

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(book)}
            onKeyDown={(event) => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    onOpen(book);
                }
            }}
            className="group w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-emerald-200 hover:shadow-lg active:scale-[0.99]"
        >
            <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                {cover && !coverFailed ? (
                    <img
                        src={cover}
                        alt={book.title}
                        loading="lazy"
                        onError={() => setCoverFailed(true)}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <BookOpen size={42} />
                    </div>
                )}

                <span
                    className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold shadow-sm ${availability.className}`}
                >
                    {availability.label}
                </span>

                {typeof onToggleFavorite === "function" && (
                    <button
                        type="button"
                        aria-label={
                            favorite
                                ? "Remove from favorites"
                                : "Add to favorites"
                        }
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleFavorite(book);
                        }}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
                    >
                        <Heart
                            size={14}
                            className={
                                favorite
                                    ? "fill-red-500 text-red-500"
                                    : "text-slate-400"
                            }
                        />
                    </button>
                )}
            </div>

            <div className="p-3">
                <p className="line-clamp-2 text-xs font-semibold leading-4 text-slate-800">
                    {book.title}
                </p>

                <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">
                    {book.author}
                </p>

                <p className="mt-2 line-clamp-1 text-[10px] font-semibold text-emerald-700">
                    {book.category ||
                        book.institute ||
                        "Library"}
                </p>
            </div>
        </div>
    );
}

// =========================================================
// PAGE
// =========================================================

export default function BrowseBooks() {
    const [searchParams] = useSearchParams();

    // Dashboard ay nagpapadala ng ?q=...&category=...&status=Available
    const [searchQuery, setSearchQuery] = useState(
        searchParams.get("q") || ""
    );

    const [selectedCategory, setSelectedCategory] =
        useState(searchParams.get("category") || "All");

    const [selectedFilter, setSelectedFilter] = useState(
        searchParams.get("status") === "Available"
            ? "Available"
            : "All"
    );

    const [selectedBook, setSelectedBook] =
        useState(null);

    const {
        books,
        loading,
        error,
        categories,
        isFavorite,
        toggleFavorite,
        refetch,
        refresh,
        reload,
    } = useLibrary();

    const userId = localStorage.getItem("userId");

    // =====================================================
    // CATEGORIES
    // =====================================================

    const categoryFilters = useMemo(() => {
        const fromHook = Array.isArray(categories)
            ? categories.map(getCategoryValue)
            : [];

        const fromBooks = (
            Array.isArray(books) ? books : []
        ).map((book) => book.category);

        const unique = Array.from(
            new Set(
                [...fromHook, ...fromBooks].filter(
                    (value) =>
                        value &&
                        value !== "All" &&
                        value !== "ALL"
                )
            )
        );

        return ["All", ...unique];
    }, [categories, books]);

    // =====================================================
    // FILTERED BOOKS
    // =====================================================

    const filteredBooks = useMemo(() => {
        const list = Array.isArray(books) ? books : [];
        const query = searchQuery.trim().toLowerCase();

        return list.filter((book) => {
            const matchesQuery =
                query === "" ||
                (book.title ?? "")
                    .toLowerCase()
                    .includes(query) ||
                (book.author ?? "")
                    .toLowerCase()
                    .includes(query) ||
                (book.isbn ?? "")
                    .toLowerCase()
                    .includes(query) ||
                (book.category ?? "")
                    .toLowerCase()
                    .includes(query);

            const matchesCategory =
                selectedCategory === "All" ||
                book.category === selectedCategory;

            const matchesFilter =
                selectedFilter === "All" ||
                (selectedFilter === "Available" &&
                    isBookAvailable(book)) ||
                (selectedFilter === "Unavailable" &&
                    !isBookAvailable(book));

            return (
                matchesQuery &&
                matchesCategory &&
                matchesFilter
            );
        });
    }, [
        books,
        searchQuery,
        selectedCategory,
        selectedFilter,
    ]);

    const totalBooks = Array.isArray(books)
        ? books.length
        : 0;

    const hasActiveFilters =
        searchQuery.trim() !== "" ||
        selectedCategory !== "All" ||
        selectedFilter !== "All";

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedCategory("All");
        setSelectedFilter("All");
    };

    // =====================================================
    // MODAL
    // =====================================================

    const handleBookClick = (book) => {
        setSelectedBook(book);
    };

    const handleCloseModal = () => {
        setSelectedBook(null);
    };

    const handleReserved = async () => {
        setSelectedBook(null);

        const refreshBooks = refetch || refresh || reload;

        if (typeof refreshBooks === "function") {
            try {
                await refreshBooks();
            } catch (err) {
                console.error(
                    "Failed to refresh books:",
                    err
                );
            }
        }
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="min-h-screen bg-[#F7F8F5] text-slate-800">
            <LibraryBottomNav />

            <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-24 lg:px-8">

                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="mb-5">
                    <p className="text-xs font-medium text-slate-400">
                        CDM Library
                    </p>

                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
                        Browse Books
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {loading
                            ? "Loading catalog..."
                            : `${filteredBooks.length} of ${totalBooks} titles`}
                    </p>
                </section>

                {/* =================================================
                    SEARCH
                ================================================= */}

                <div className="mb-3 flex items-center rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-[#106A2E]">
                    <Search
                        size={18}
                        className="ml-4 shrink-0 text-slate-400"
                    />

                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) =>
                            setSearchQuery(
                                event.target.value
                            )
                        }
                        placeholder="Search title, author, ISBN, or category"
                        className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-slate-400"
                    />

                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() =>
                                setSearchQuery("")
                            }
                            aria-label="Clear search"
                            className="mr-3 text-lg leading-none text-slate-400 hover:text-slate-700"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* =================================================
                    CATEGORY FILTERS
                ================================================= */}

                <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {categoryFilters.map((category) => (
                        <button
                            key={category}
                            type="button"
                            onClick={() =>
                                setSelectedCategory(
                                    category
                                )
                            }
                            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                                selectedCategory ===
                                category
                                    ? "bg-[#106A2E] text-white shadow-sm"
                                    : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-[#106A2E]"
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* =================================================
                    AVAILABILITY FILTERS
                ================================================= */}

                <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {STATUS_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            type="button"
                            onClick={() =>
                                setSelectedFilter(
                                    filter.value
                                )
                            }
                            aria-pressed={
                                selectedFilter ===
                                filter.value
                            }
                            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                                selectedFilter ===
                                filter.value
                                    ? "border border-[#106A2E] bg-emerald-50 text-[#106A2E]"
                                    : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-[#106A2E]"
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* =================================================
                    BOOKS
                ================================================= */}

                {loading ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {Array.from({ length: 12 }).map(
                            (_, index) => (
                                <div
                                    key={index}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                                >
                                    <Skeleton className="aspect-[3/4] rounded-none" />

                                    <div className="p-3">
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="mt-2 h-3 w-2/3" />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center">
                        <p className="text-sm font-semibold text-red-700">
                            Unable to load books
                        </p>

                        <p className="mt-1 text-xs text-red-600/80">
                            {String(error)}
                        </p>
                    </div>
                ) : filteredBooks.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {filteredBooks.map(
                            (book, index) => (
                                <BrowseBookCard
                                    key={getBookKey(
                                        book,
                                        index
                                    )}
                                    book={book}
                                    onOpen={
                                        handleBookClick
                                    }
                                    favorite={
                                        typeof isFavorite ===
                                        "function"
                                            ? isFavorite(
                                                  book.id ??
                                                      book.bookId
                                              )
                                            : false
                                    }
                                    onToggleFavorite={
                                        typeof toggleFavorite ===
                                        "function"
                                            ? (item) =>
                                                  toggleFavorite(
                                                      item.id ??
                                                          item.bookId
                                                  )
                                            : undefined
                                    }
                                />
                            )
                        )}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                        <BookOpen
                            size={32}
                            className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-semibold text-slate-600">
                            {totalBooks === 0
                                ? "No books in the library yet"
                                : searchQuery
                                  ? `No books match "${searchQuery}"`
                                  : "No books match these filters"}
                        </p>

                        {hasActiveFilters &&
                            totalBooks > 0 && (
                                <button
                                    type="button"
                                    onClick={
                                        clearFilters
                                    }
                                    className="mt-2 text-xs font-semibold text-[#106A2E]"
                                >
                                    Clear filters
                                </button>
                            )}
                    </div>
                )}
            </main>

            {/* =====================================================
                BOOK DETAILS MODAL
            ===================================================== */}

            {selectedBook && (
                <BookDetailsModal
                    book={selectedBook}
                    userId={userId}
                    onClose={handleCloseModal}
                    onReserved={handleReserved}
                />
            )}
        </div>
    );
}