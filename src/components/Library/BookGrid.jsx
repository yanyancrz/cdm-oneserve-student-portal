    import BookCard from "./BookCard";
    import EmptyState from "./EmptyState";

    export default function BookGrid({
        books,
        emptyMessage = "No books found.",
        onBookClick,
        isFavorite,
        onToggleFavorite,
    }) {

        if (!books || books.length === 0) {
            return (
                <EmptyState
                    title="No books found"
                    message={emptyMessage}
                />
            );
        }

        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {books.map((book) => (
                    <BookCard
                        key={book.bookId}
                        book={book}
                        onClick={
                            onBookClick
                                ? () => onBookClick(book)
                                : undefined
                        }
                        isFavorite={isFavorite ? isFavorite(book.bookId) : false}
                        onToggleFavorite={onToggleFavorite}
                    />
                ))}
            </div>
        );
    }