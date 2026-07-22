import BookCard from "./BookCard";

// RecommendedBooks.jsx
//
// Horizontal, swipeable row of BookCard items — same shape as
// RecentlyAddedBooks.jsx, kept as a separate component since the two rows
// are conceptually different feeds (newest additions vs. personalized
// picks) and are likely to diverge later (e.g. a "Why recommended" tag,
// a different empty-state message, or a real recommendation API call).
//
// For now, Dashboard.jsx resolves `books` from mockRecommendedBookIds —
// a hardcoded placeholder list, since there's no real recommendation
// logic yet.

export default function RecommendedBooks({ books }) {

    if (!books || books.length === 0) {
        return (
            <p className="text-sm text-gray-500 py-6 text-center bg-white/60 rounded-2xl">
                No recommendations yet — borrow a few books to get personalized picks.
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
                    <div key={book.bookId} className="flex-shrink-0 w-36 snap-start">
                        <BookCard book={book} />
                    </div>
                ))
            }
        </div>
    );

}