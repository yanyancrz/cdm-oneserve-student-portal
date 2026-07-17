import BookCard from "./BookCard";

// RecentlyAddedBooks.jsx
//
// Horizontal, swipeable row of BookCard items. Purely presentational —
// the parent page decides which books count as "recently added" (see
// Dashboard.jsx, which sorts mockBooks by addedDate and passes the top N).

export default function RecentlyAddedBooks({ books }) {

    if (!books || books.length === 0) {
        return (
            <p className="text-sm text-gray-500 py-6 text-center bg-white/60 rounded-2xl">
                No new books added recently.
            </p>
        );
    }

    return (
        <div
            className="
                flex gap-3
                overflow-x-auto
                pb-2
                -mx-4 px-4 sm:mx-0 sm:px-0
                snap-x snap-mandatory
                scrollbar-hide
            "
            style={{ scrollbarWidth: "none" }}
        >
            {
                books.map((book) => (
                    <div key={book.id} className="flex-shrink-0 w-36 snap-start">
                        <BookCard book={book} />
                    </div>
                ))
            }
        </div>
    );

}