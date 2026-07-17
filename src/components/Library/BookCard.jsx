import { useNavigate } from "react-router-dom";

const STATUS_STYLES = {
    Available: {
        bg: "#E1F5EE",
        color: "#085041",
    },
    Borrowed: {
        bg: "#FAECE7",
        color: "#712B13",
    },
    Reserved: {
        bg: "#FAEEDA",
        color: "#633806",
    },
};

const HEART_OUTLINE = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-6.7-4.35-9.33-8.2C.86 10.28 1.4 6.86 4.1 5.1 6.02 3.86 8.42 4.3 10 6.1c.36.4.68.86.94 1.3.26-.44.58-.9.94-1.3 1.58-1.8 3.98-2.24 5.9-1 2.7 1.76 3.24 5.18 1.43 7.7C18.7 16.65 12 21 12 21Z" />
    </svg>
);

const HEART_FILLED = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21s-6.7-4.35-9.33-8.2C.86 10.28 1.4 6.86 4.1 5.1 6.02 3.86 8.42 4.3 10 6.1c.36.4.68.86.94 1.3.26-.44.58-.9.94-1.3 1.58-1.8 3.98-2.24 5.9-1 2.7 1.76 3.24 5.18 1.43 7.7C18.7 16.65 12 21 12 21Z" />
    </svg>
);

export default function BookCard({

    book,

    onClick,

    className = "",

    isFavorite = false,

    onToggleFavorite,

}) {

    const navigate = useNavigate();

   const status = book.status ?? "Available";

    const statusStyle =
        STATUS_STYLES[status] ??
        STATUS_STYLES.Available;

    const image =
    book.coverImage ||
    "https://placehold.co/300x450?text=No+Cover";

    const handleClick = () => {

        if (onClick) {

            onClick(book);

            return;

        }

        navigate(`/library/book/${book.bookId}`);

    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
        }
    };

    const handleFavoriteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite(book.bookId);
    };

    return (

        <div

            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}

            data-book-id={book.bookId}

            className={`
                group
                relative
                w-full
                bg-white
                rounded-2xl
                overflow-hidden
                shadow-md
                hover:shadow-xl
                hover:-translate-y-1
                active:scale-[0.98]
                transition-all
                duration-300
                cursor-pointer
                text-left
                ${className}
            `}

        >

            {/* BOOK COVER */}

            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">

                <img

                    src={image}

                    alt={book.title}

                    className="
                        w-full
                        h-full
                        object-cover
                        transition-transform
                        duration-300
                        group-hover:scale-105
                    "

                />

                {

                    book.isNewArrival && (

                        <span
                            className="
                                absolute
                                top-2
                                left-2
                                bg-[#F4D35E]
                                text-[#633806]
                                text-[10px]
                                font-bold
                                px-2
                                py-1
                                rounded-full
                                shadow
                            "
                        >

                            NEW

                        </span>

                    )

                }

                {

                    onToggleFavorite && (

                        <button
                            type="button"
                            onClick={handleFavoriteClick}
                            aria-label={isFavorite ? `Remove ${book.title} from favorites` : `Add ${book.title} to favorites`}
                            className={`
                                absolute
                                top-2
                                right-2
                                w-8
                                h-8
                                rounded-full
                                flex
                                items-center
                                justify-center
                                shadow-sm
                                transition-all
                                hover:scale-105
                                active:scale-95
                                ${isFavorite
                                    ? "bg-white/90 text-[#106A2E]"
                                    : "bg-white/70 text-gray-400 hover:text-[#106A2E]"
                                }
                            `}
                        >
                            {isFavorite ? HEART_FILLED : HEART_OUTLINE}
                        </button>

                    )

                }

            </div>

            {/* CONTENT */}

            <div className="p-4">

                <div className="flex justify-between items-center mb-2">

                    <span
                        className="
                            text-xs
                            text-gray-500
                            truncate
                        "
                    >

                        {book.category}

                    </span>

                    <span

                        className="
                            text-[10px]
                            font-semibold
                            px-2
                            py-1
                            rounded-full
                            flex-shrink-0
                        "

                        style={{

                            background: statusStyle.bg,

                            color: statusStyle.color,

                        }}

                    >

                        {status}

                    </span>

                </div>

                <h3
                    className="
                        text-base
                        font-bold
                        text-[#1F1F1F]
                        line-clamp-2
                        min-h-[48px]
                    "
                >

                    {book.title}

                </h3>

                <p
                    className="
                        text-sm
                        text-gray-500
                        mt-2
                        truncate
                    "
                >

                    {book.author}

                </p>

            </div>

        </div>

    );

}