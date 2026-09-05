import Modal from "../../components/Common/Modal";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { API_URL } from "../../config/api";

import {
    getBook,
    borrowBook,
    getCurrentBorrowedBooks,
    toggleFavorite,
} from "../../services/libraryService";

import PageHeader from "../../components/Library/PageHeader";
import EmptyState from "../../components/Library/EmptyState";

import noCover from "../../assets/images/no-cover.png";


const STUDENT_BORROW_LIMIT = 3;
const DEFAULT_LOAN_DAYS = 7;


function addDays(date, days) {

    const result = new Date(date);

    result.setDate(
        result.getDate() + days
    );

    return result;
}


function formatDate(date) {

    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );
}


export default function BookDetails() {

    const { bookId } = useParams();

    const navigate = useNavigate();


    // =========================================================
    // STATE
    // =========================================================

    const [book, setBook] = useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(null);


    const [borrowedBooks, setBorrowedBooks] =
        useState([]);


    const [borrowing, setBorrowing] =
        useState(false);

    const [showBorrowModal, setShowBorrowModal] =
        useState(false);

    const [
        showBorrowSuccessModal,
        setShowBorrowSuccessModal
    ] = useState(false);

    const [borrowResult, setBorrowResult] =
        useState(null);


    const [isFavorite, setIsFavorite] =
        useState(false);

    const [favoriteLoading, setFavoriteLoading] =
        useState(false);


    // =========================================================
    // USER
    // =========================================================

    const userId = Number(
        localStorage.getItem("userId")
    );


    // =========================================================
    // LOAD BOOK
    // =========================================================

    useEffect(() => {

        async function loadBook() {

            try {

                setLoading(true);

                const response =
                    await getBook(bookId);

                setBook(
                    response.data ?? response
                );

            } catch (err) {

                console.error(
                    "Failed to load book:",
                    err
                );

                setError(
                    err.message ||
                    "Failed to load book."
                );

            } finally {

                setLoading(false);

            }

        }

        loadBook();

    }, [bookId]);


    // =========================================================
    // LOAD ACTIVE BORROW / CLAIM TRANSACTIONS
    // =========================================================

    useEffect(() => {

        async function loadBorrowedBooks() {

            if (!userId) {
                return;
            }

            try {

                const response =
                    await getCurrentBorrowedBooks(
                        userId
                    );

                const data =
                    response.data ?? response;

                setBorrowedBooks(
                    Array.isArray(data)
                        ? data
                        : []
                );

            } catch (err) {

                console.error(
                    "Failed to load borrowed books:",
                    err
                );

            }

        }

        loadBorrowedBooks();

    }, [userId]);


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div
                className="
                    min-h-screen
                    flex
                    items-center
                    justify-center
                "
                style={{
                    background:
                        "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
                }}
            >

                <p className="text-sm text-gray-500">
                    Loading book details...
                </p>

            </div>

        );

    }


    // =========================================================
    // ERROR / NOT FOUND
    // =========================================================

    if (error || !book) {

        return (

            <div
                className="min-h-screen pb-24"
                style={{
                    background:
                        "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
                }}
            >

                <div className="
                    max-w-md
                    sm:max-w-2xl
                    mx-auto
                    p-4
                    sm:p-6
                ">

                    <PageHeader
                        title="Book Details"
                    />

                    <EmptyState
                        title="Book not found"
                        message={
                            error ||
                            "This book may have been removed from the catalog."
                        }
                        actionLabel="Back to Browse Books"
                        onAction={() =>
                            navigate(
                                "/library/books"
                            )
                        }
                    />

                </div>

            </div>

        );

    }


    // =========================================================
    // AVAILABILITY
    // =========================================================

    const isAvailable =
        book.availableCopies > 0 &&
        book.status === "Available";


    // =========================================================
    // ACTIVE TRANSACTIONS
    // =========================================================

    const activeBorrowedBooks =
        borrowedBooks.filter(
            (transaction) =>
                transaction.status === "Borrowed" ||
                transaction.status === "ForClaiming"
        );


    const activeBorrowCount =
        activeBorrowedBooks.length;


    // Transaction for THIS book
    const currentBookTransaction =
        activeBorrowedBooks.find(
            (transaction) =>
                Number(transaction.bookId) ===
                Number(book.bookId)
        );


    const isForClaiming =
        currentBookTransaction?.status ===
        "ForClaiming";


    const isActuallyBorrowed =
        currentBookTransaction?.status ===
        "Borrowed";


    const alreadyBorrowed =
        Boolean(
            isForClaiming ||
            isActuallyBorrowed
        );


    const reachedBorrowLimit =
        activeBorrowCount >=
        STUDENT_BORROW_LIMIT;


    const canBorrow =
        isAvailable &&
        !alreadyBorrowed &&
        !reachedBorrowLimit &&
        !borrowing;


    // =========================================================
    // EXPECTED DUE DATE
    // =========================================================

    const expectedDueDate =
        addDays(
            new Date(),
            DEFAULT_LOAN_DAYS
        );


    // =========================================================
    // LEFT BUTTON LABEL
    // =========================================================

    const borrowButtonLabel = (() => {

        if (borrowing) {
            return "Borrowing...";
        }

        if (alreadyBorrowed) {
            return "Already Borrowed";
        }

        if (reachedBorrowLimit) {
            return "Borrow Limit Reached";
        }

        if (!isAvailable) {
            return "Not Available";
        }

        return "Borrow Book";

    })();


    // =========================================================
    // BORROW STATUS LABEL
    // =========================================================

    const transactionStatusLabel = (() => {

        if (isForClaiming) {
            return "For Claiming";
        }

        if (isActuallyBorrowed) {
            return "Currently Borrowed";
        }

        return null;

    })();


    // =========================================================
    // OPEN BORROW CONFIRMATION
    // =========================================================

    const handleBorrow = () => {

        if (!userId) {

            toast.error(
                "User not found. Please log in again."
            );

            return;
        }


        if (alreadyBorrowed) {

            toast.error(
                isForClaiming
                    ? "You already have a claim pass for this book."
                    : "You already borrowed this book."
            );

            return;
        }


        if (reachedBorrowLimit) {

            toast.error(
                `You can only borrow up to ${STUDENT_BORROW_LIMIT} books at a time.`
            );

            return;
        }


        if (!isAvailable || borrowing) {
            return;
        }


        setShowBorrowModal(true);

    };


    // =========================================================
    // CONFIRM BORROW
    // =========================================================

    const confirmBorrow = async () => {

        setShowBorrowModal(false);

        setBorrowing(true);


        try {

            const response =
                await borrowBook(
                    userId,
                    book.bookId
                );


            toast.success(
                response.message ||
                "Borrow request submitted successfully."
            );


            // ---------------------------------
            // Borrow response
            // ---------------------------------

            const borrowData =
                response.data ?? response;


            setBorrowResult({

                borrowId:
                    borrowData.borrowId,

                bookTitle:
                    borrowData.bookTitle ??
                    book.title,

                borrowDate:
                    borrowData.borrowDate ??
                    new Date().toISOString(),

                dueDate:
                    borrowData.dueDate ??
                    expectedDueDate.toISOString(),

            });


            // ---------------------------------
            // Refresh book
            // ---------------------------------

            const updatedBook =
                await getBook(
                    book.bookId
                );


            setBook(
                updatedBook.data ??
                updatedBook
            );


            // ---------------------------------
            // Refresh current transactions
            // ---------------------------------

            const updatedBorrowed =
                await getCurrentBorrowedBooks(
                    userId
                );


            const transactionData =
                updatedBorrowed.data ??
                updatedBorrowed;


            setBorrowedBooks(
                Array.isArray(transactionData)
                    ? transactionData
                    : []
            );


            // ---------------------------------
            // Show Claim Pass modal
            // ---------------------------------

            setShowBorrowSuccessModal(
                true
            );


        } catch (err) {

            console.error(
                "Failed to borrow book:",
                err
            );


            toast.error(
                err.message ||
                "Failed to submit borrow request."
            );


        } finally {

            setBorrowing(false);

        }

    };


    // =========================================================
    // RESERVE
    // =========================================================

    const handleReserve = () => {

        if (isAvailable) {
            return;
        }


        // Existing claim/borrow always takes priority
        if (alreadyBorrowed) {
            return;
        }


        navigate(
            `/library/reserve?bookId=${book.bookId}`
        );

    };


    // =========================================================
    // FAVORITE
    // =========================================================

    const handleToggleFavorite =
        async () => {

            if (!userId) {

                toast.error(
                    "User not found."
                );

                return;
            }


            if (favoriteLoading) {
                return;
            }


            try {

                setFavoriteLoading(true);


                const response =
                    await toggleFavorite(
                        userId,
                        book.bookId
                    );


                setIsFavorite(
                    (prev) => !prev
                );


                toast.success(
                    response.message ||
                    (
                        isFavorite
                            ? "Removed from favorites."
                            : "Added to favorites."
                    )
                );


            } catch (err) {

                console.error(
                    "Failed to update favorite:",
                    err
                );


                toast.error(
                    err.message ||
                    "Failed to update favorite."
                );


            } finally {

                setFavoriteLoading(false);

            }

        };


    // =========================================================
    // SHARE
    // =========================================================

    const handleShare = async () => {

        const shareData = {

            title: book.title,

            text:
                `${book.title} by ${book.author} — available on CDM OneServe Library`,

            url:
                window.location.href,

        };


        if (navigator.share) {

            try {

                await navigator.share(
                    shareData
                );

            } catch {

                // User cancelled share

            }

            return;

        }


        try {

            await navigator.clipboard
                .writeText(
                    window.location.href
                );


            toast.success(
                "Link copied to clipboard."
            );


        } catch {

            toast.error(
                "Couldn't copy link."
            );

        }

    };


    // =========================================================
    // BOOK STATUS STYLE
    // =========================================================

    const statusStyles = {

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

        Unavailable: {
            bg: "#F3F4F6",
            color: "#6B7280",
        },

        Maintenance: {
            bg: "#FEE2E2",
            color: "#B91C1C",
        },

    };


    const statusStyle =
        statusStyles[book.status] ??
        statusStyles.Available;


    // =========================================================
    // UI
    // =========================================================

    return (

        <div
            className="min-h-screen pb-28"
            style={{
                background:
                    "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
            }}
        >

            <div className="
                max-w-md
                sm:max-w-2xl
                lg:max-w-4xl
                mx-auto
                p-4
                sm:p-6
            ">

                <PageHeader
                    title="Book Details"
                />


                {/* =================================================
                    BOOK DETAILS CARD
                ================================================= */}

                <div className="
                    bg-white/90
                    rounded-[24px]
                    shadow-sm
                    overflow-hidden
                    sm:flex
                ">


                    {/* COVER */}

                    <div className="
                        sm:w-64
                        flex-shrink-0
                        bg-gray-50
                        flex
                        items-center
                        justify-center
                        p-6
                        sm:p-8
                    ">

                        <img
                            src={
                                book.coverImage
                                    ? `${API_URL}/${book.coverImage}`
                                    : noCover
                            }
                            onError={(e) => {
                                e.currentTarget.src =
                                    noCover;
                            }}
                            alt={`Cover of ${book.title}`}
                            className="
                                w-40
                                sm:w-full
                                rounded-xl
                                shadow-md
                                object-cover
                            "
                        />

                    </div>


                    {/* BOOK INFO */}

                    <div className="
                        p-5
                        sm:p-7
                        flex-1
                    ">


                        {/* STATUS / CATEGORY */}

                        <div className="
                            flex
                            flex-wrap
                            items-center
                            gap-2
                            mb-3
                        ">

                            <span
                                className="
                                    text-[11px]
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    px-2.5
                                    py-1
                                    rounded-full
                                "
                                style={{
                                    background:
                                        statusStyle.bg,

                                    color:
                                        statusStyle.color,
                                }}
                            >
                                {book.status}
                            </span>


                            {book.isNewArrival && (

                                <span className="
                                    text-[11px]
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    px-2.5
                                    py-1
                                    rounded-full
                                    bg-[#F4D35E]/30
                                    text-[#633806]
                                ">
                                    New Arrival
                                </span>

                            )}


                            <span className="
                                text-[11px]
                                text-gray-500
                                px-2.5
                                py-1
                                rounded-full
                                bg-gray-100
                            ">
                                {book.category}
                            </span>

                        </div>


                        {/* TITLE */}

                        <h1 className="
                            text-xl
                            sm:text-2xl
                            font-semibold
                            text-[#1F1F1F]
                            tracking-tight
                            mb-1
                        ">
                            {book.title}
                        </h1>


                        <p className="
                            text-sm
                            text-gray-500
                            mb-5
                        ">
                            by {book.author}
                        </p>


                        {/* =================================================
                            USER BORROW STATUS
                        ================================================= */}

                        <div className="
                            bg-[#F7FAF8]
                            rounded-xl
                            p-3.5
                            mb-5
                        ">

                            <div className="
                                flex
                                items-center
                                justify-between
                                gap-3
                            ">

                                <div>

                                    <p className="
                                        text-[11px]
                                        text-gray-400
                                        mb-0.5
                                    ">
                                        Your Borrowing
                                    </p>


                                    <p className="
                                        text-sm
                                        font-semibold
                                        text-[#1F1F1F]
                                    ">
                                        {activeBorrowCount} of {STUDENT_BORROW_LIMIT} books
                                    </p>

                                </div>


                                {transactionStatusLabel && (

                                    <span className={`
                                        text-[10px]
                                        font-semibold
                                        px-2.5
                                        py-1
                                        rounded-full

                                        ${
                                            isForClaiming
                                                ? "bg-[#FAEEDA] text-[#633806]"
                                                : "bg-[#E1F5EE] text-[#106A2E]"
                                        }
                                    `}>
                                        {transactionStatusLabel}
                                    </span>

                                )}

                            </div>

                        </div>


                        {/* =================================================
                            BOOK INFORMATION
                        ================================================= */}

                        <dl className="
                            grid
                            grid-cols-2
                            gap-x-4
                            gap-y-3
                            text-sm
                            mb-5
                        ">

                            <div>

                                <dt className="
                                    text-gray-400
                                    text-xs
                                    mb-0.5
                                ">
                                    ISBN
                                </dt>

                                <dd className="
                                    text-[#1F1F1F]
                                    font-medium
                                ">
                                    {book.isbn || "N/A"}
                                </dd>

                            </div>


                            <div>

                                <dt className="
                                    text-gray-400
                                    text-xs
                                    mb-0.5
                                ">
                                    Publisher
                                </dt>

                                <dd className="
                                    text-[#1F1F1F]
                                    font-medium
                                ">
                                    {book.publisher || "N/A"}
                                </dd>

                            </div>


                            <div>

                                <dt className="
                                    text-gray-400
                                    text-xs
                                    mb-0.5
                                ">
                                    Year
                                </dt>

                                <dd className="
                                    text-[#1F1F1F]
                                    font-medium
                                ">
                                    {book.publishYear || "N/A"}
                                </dd>

                            </div>


                            <div>

                                <dt className="
                                    text-gray-400
                                    text-xs
                                    mb-0.5
                                ">
                                    Language
                                </dt>

                                <dd className="
                                    text-[#1F1F1F]
                                    font-medium
                                ">
                                    {book.language || "N/A"}
                                </dd>

                            </div>


                            <div>

                                <dt className="
                                    text-gray-400
                                    text-xs
                                    mb-0.5
                                ">
                                    Shelf Location
                                </dt>

                                <dd className="
                                    text-[#1F1F1F]
                                    font-medium
                                ">
                                    {book.shelfLocation || "N/A"}
                                </dd>

                            </div>


                            <div>

                                <dt className="
                                    text-gray-400
                                    text-xs
                                    mb-0.5
                                ">
                                    Available Copies
                                </dt>

                                <dd className="
                                    text-[#1F1F1F]
                                    font-medium
                                ">
                                    {book.availableCopies} / {book.totalCopies}
                                </dd>

                            </div>

                        </dl>


                        {/* DESCRIPTION */}

                        <div>

                            <h2 className="
                                text-xs
                                font-medium
                                uppercase
                                tracking-wide
                                text-gray-400
                                mb-1.5
                            ">
                                Description
                            </h2>


                            <p className="
                                text-sm
                                text-gray-600
                                leading-relaxed
                            ">
                                {
                                    book.description ||
                                    "No description available."
                                }
                            </p>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    PRIMARY ACTIONS
                ================================================= */}

                <div className="
                    grid
                    grid-cols-2
                    gap-3
                    mt-6
                ">


                    {/* LEFT BUTTON */}

                    <button
                        onClick={handleBorrow}
                        disabled={!canBorrow}
                        className="
                            col-span-2
                            sm:col-span-1

                            bg-[#106A2E]
                            text-white

                            p-3.5
                            rounded-xl

                            font-semibold
                            text-sm

                            shadow-sm

                            hover:brightness-105
                            active:scale-[0.99]

                            disabled:bg-gray-300
                            disabled:text-gray-500
                            disabled:cursor-not-allowed
                            disabled:active:scale-100

                            transition-all
                        "
                    >
                        {borrowButtonLabel}
                    </button>


                    {/* =================================================
                        RIGHT BUTTON PRIORITY:

                        1. ForClaiming
                           → View Claim Pass

                        2. Borrowed
                           → Currently Borrowed

                        3. Available
                           → Currently Available

                        4. Unavailable
                           → Reserve Book
                    ================================================= */}


                    {isForClaiming ? (

                        <button
                            onClick={() =>
                                navigate(
                                    `/library/borrow-pass/${currentBookTransaction.borrowId}`
                                )
                            }
                            className="
                                col-span-2
                                sm:col-span-1

                                bg-[#F4D35E]
                                text-[#1F1F1F]

                                p-3.5
                                rounded-xl

                                font-semibold
                                text-sm

                                shadow-sm

                                hover:brightness-105
                                active:scale-[0.99]

                                transition-all
                            "
                        >
                            View Claim Pass
                        </button>


                    ) : isActuallyBorrowed ? (

                        <button
                            disabled
                            className="
                                col-span-2
                                sm:col-span-1

                                bg-gray-100
                                text-gray-400

                                p-3.5
                                rounded-xl

                                font-semibold
                                text-sm

                                cursor-not-allowed
                            "
                        >
                            Currently Borrowed
                        </button>


                    ) : isAvailable ? (

                        <button
                            disabled
                            className="
                                col-span-2
                                sm:col-span-1

                                bg-gray-100
                                text-gray-400

                                p-3.5
                                rounded-xl

                                font-semibold
                                text-sm

                                cursor-not-allowed
                            "
                        >
                            Currently Available
                        </button>


                    ) : (

                        <button
                            onClick={handleReserve}
                            className="
                                col-span-2
                                sm:col-span-1

                                bg-[#F4D35E]
                                text-[#1F1F1F]

                                p-3.5
                                rounded-xl

                                font-semibold
                                text-sm

                                shadow-sm

                                hover:brightness-105
                                active:scale-[0.99]

                                transition-all
                            "
                        >
                            Reserve Book
                        </button>

                    )}


                    {/* FAVORITE */}

                    <button
                        onClick={
                            handleToggleFavorite
                        }
                        disabled={
                            favoriteLoading
                        }
                        className="
                            flex
                            items-center
                            justify-center
                            gap-2

                            bg-white/90
                            text-[#1F1F1F]

                            border
                            border-gray-200

                            p-3
                            rounded-xl

                            font-medium
                            text-sm

                            hover:bg-white
                            active:scale-[0.99]

                            disabled:opacity-60

                            transition-all
                        "
                    >

                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={
                                isFavorite
                                    ? "#106A2E"
                                    : "none"
                            }
                            stroke={
                                isFavorite
                                    ? "#106A2E"
                                    : "currentColor"
                            }
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21l7.78-7.55 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>


                        {
                            favoriteLoading
                                ? "Saving..."
                                : isFavorite
                                ? "Favorited"
                                : "Favorite"
                        }

                    </button>


                    {/* SHARE */}

                    <button
                        onClick={handleShare}
                        className="
                            flex
                            items-center
                            justify-center
                            gap-2

                            bg-white/90
                            text-[#1F1F1F]

                            border
                            border-gray-200

                            p-3
                            rounded-xl

                            font-medium
                            text-sm

                            hover:bg-white
                            active:scale-[0.99]

                            transition-all
                        "
                    >

                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >

                            <circle
                                cx="18"
                                cy="5"
                                r="3"
                            />

                            <circle
                                cx="6"
                                cy="12"
                                r="3"
                            />

                            <circle
                                cx="18"
                                cy="19"
                                r="3"
                            />

                            <path d="m8.59 13.51 6.83 3.98M15.41 6.51 8.59 10.49" />

                        </svg>

                        Share

                    </button>

                </div>

            </div>


            {/* =========================================================
                BORROW CONFIRM MODAL
            ========================================================= */}

            <Modal
                isOpen={showBorrowModal}
                type="confirm"

                title="Borrow Book"

                message={
                    `Borrow "${book.title}"?\n\n` +
                    `Current borrowing: ${activeBorrowCount} of ${STUDENT_BORROW_LIMIT}\n` +
                    `Expected due date: ${formatDate(expectedDueDate)}`
                }

                confirmText="Borrow"

                cancelText="Cancel"

                onConfirm={
                    confirmBorrow
                }

                onClose={() =>
                    setShowBorrowModal(false)
                }
            />


            {/* =========================================================
                PROCESSING MODAL
            ========================================================= */}

            <Modal
                isOpen={borrowing}
                type="loading"

                title="Submitting Borrow Request"

                message="Please wait while we process your borrow request."
            />


            {/* =========================================================
                SUCCESS MODAL
            ========================================================= */}

            <Modal
                isOpen={
                    showBorrowSuccessModal
                }

                type="success"

                title="Borrow Request Submitted"

                message={
                    borrowResult
                        ? `${borrowResult.bookTitle}\n\nYour claim pass is ready. Present the QR code at the library counter to claim the book.`
                        : "Your borrow claim pass is ready."
                }

                confirmText="View Claim Pass"

                onConfirm={() => {

                    setShowBorrowSuccessModal(
                        false
                    );


                    if (
                        borrowResult?.borrowId
                    ) {

                        navigate(
                            `/library/borrow-pass/${borrowResult.borrowId}`
                        );

                    }

                }}

                onClose={() =>
                    setShowBorrowSuccessModal(
                        false
                    )
                }
            />

        </div>

    );

}