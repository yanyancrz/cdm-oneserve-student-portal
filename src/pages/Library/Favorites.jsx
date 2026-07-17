import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../../components/Library/PageHeader";
import EmptyState from "../../components/Library/EmptyState";
import BookCard from "../../components/Library/BookCard";

import { mockBooks } from "../../data/mockLibraryData";
import useLibrary from "../../hooks/useLibrary";

export default function Favorites() {

    const navigate = useNavigate();
    const { favoriteIds, isFavorite, toggleFavorite } = useLibrary();

    const favoriteBooks = useMemo(
        () => mockBooks.filter((book) => favoriteIds.includes(book.id)),
        [favoriteIds]
    );

    return (

        <div
            className="min-h-screen pb-24"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
            }}
        >

            <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto p-4 sm:p-6">

                <PageHeader
                    title="Favorites"
                    subtitle={
                        favoriteBooks.length > 0
                            ? `${favoriteBooks.length} book${favoriteBooks.length === 1 ? "" : "s"} saved`
                            : undefined
                    }
                />

                {favoriteBooks.length === 0 ? (
                    <EmptyState
                        title="No favorites yet"
                        message="Tap the heart on any book to save it here for quick access later."
                        actionLabel="Browse Books"
                        onAction={() => navigate("/library/books")}
                    />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {favoriteBooks.map((book) => (
                            <BookCard
                                key={book.id}
                                book={book}
                                isFavorite={isFavorite(book.id)}
                                onToggleFavorite={toggleFavorite}
                            />
                        ))}
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link
                        to="/library"
                        className="text-sm font-semibold text-[#106A2E] hover:underline"
                    >
                        Back to Library
                    </Link>
                </div>

            </div>

        </div>

    );

}