import { useMemo, useState } from "react";

import PageHeader from "../../components/Library/PageHeader";
import SearchBar from "../../components/Library/SearchBar";
import CategoryTabs from "../../components/Library/CategoryTabs";
import FilterChips from "../../components/Library/FilterChips";
import BookGrid from "../../components/Library/BookGrid";


import useLibrary from "../../hooks/useLibrary";

const STATUS_FILTERS = [ "All", "Available", "Unavailable", "Maintenance" ];

export default function BrowseBooks() {

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedFilter, setSelectedFilter] = useState("All");

    const { books, loading, error, categories, isFavorite, toggleFavorite } = useLibrary();


    const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return books.filter((book) => {
        const matchesQuery =
            query === "" ||
            (book.title ?? "").toLowerCase().includes(query) ||
            (book.author ?? "").toLowerCase().includes(query) ||
            (book.isbn ?? "").toLowerCase().includes(query) ||
            (book.category ?? "").toLowerCase().includes(query);

        const matchesCategory =
            selectedCategory === "All" ||
            book.category === selectedCategory;

        const matchesFilter =
            selectedFilter === "All" ||
            book.status === selectedFilter;

        return matchesQuery && matchesCategory && matchesFilter;
    });
}, [books, searchQuery, selectedCategory, selectedFilter]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-gray-600">Loading books...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (

        <div
            className="min-h-screen pb-24"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)"
            }}
        >

            <div className="max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto p-4 sm:p-6">

                <PageHeader title="Browse Books" subtitle={`${filteredBooks.length} books found`} />

                <div className="mb-4">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search by title, author, ISBN, or category..."
                    />
                </div>

                <div className="mb-4">
                    <CategoryTabs
                        categories={categories}
                        selected={selectedCategory}
                        onSelect={setSelectedCategory}
                    />
                </div>

                <div className="mb-6">
                    <FilterChips
                        options={STATUS_FILTERS}
                        selected={selectedFilter}
                        onSelect={setSelectedFilter}
                    />
                </div>

                <BookGrid
                    books={filteredBooks}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                    emptyMessage={
                        searchQuery
                            ? `No books match "${searchQuery}"`
                            : "No books match these filters"
                    }
                />

            </div>

        </div>

    );

}