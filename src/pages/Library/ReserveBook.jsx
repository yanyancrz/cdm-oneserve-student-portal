import { useEffect, useMemo, useState } from "react";
import {
    useNavigate,
    useSearchParams,
    Link,
} from "react-router-dom";
import toast from "react-hot-toast";

import PageHeader from "../../components/Library/PageHeader";
import SearchBar from "../../components/Library/SearchBar";
import BookGrid from "../../components/Library/BookGrid";
import EmptyState from "../../components/Library/EmptyState";
import ReservationCard from "../../components/Library/ReservationCard";

import {
    getBooks,
    getMyReservations,
    reserveBook,
    cancelReservation,
} from "../../services/libraryService";

import { API_URL } from "../../config/api";
import noCover from "../../assets/images/no-cover.png";


export default function ReserveBook() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const preselectedId = searchParams.get("bookId");

    const [reservations, setReservations] = useState([]);
    const [books, setBooks] = useState([]);

    const [selectedBookId, setSelectedBookId] = useState(
        preselectedId || null
    );

    const [step, setStep] = useState(
        preselectedId ? "confirm" : "list"
    );

    const [searchQuery, setSearchQuery] = useState("");

    const [loadingBooks, setLoadingBooks] = useState(true);
    const [loadingReservations, setLoadingReservations] =
        useState(true);


    // =========================================================
    // LOAD BOOKS
    // =========================================================

    useEffect(() => {

        const loadBooks = async () => {

            try {

                const response = await getBooks();

                setBooks(
                    response.data ?? response
                );

            } catch (error) {

                console.error(
                    "Failed to load books:",
                    error
                );

                toast.error(
                    "Failed to load books."
                );

            } finally {

                setLoadingBooks(false);

            }

        };

        loadBooks();

    }, []);


    // =========================================================
    // LOAD MY RESERVATIONS
    // =========================================================

    useEffect(() => {

        const loadReservations = async () => {

            const userId =
                Number(localStorage.getItem("userId"));

            if (!userId) {

                setLoadingReservations(false);
                return;

            }

            try {

                const response =
                    await getMyReservations(userId);

                setReservations(
                    response.data ?? response
                );

            } catch (error) {

                console.error(
                    "Failed to load reservations:",
                    error
                );

                toast.error(
                    "Failed to load reservations."
                );

            } finally {

                setLoadingReservations(false);

            }

        };

        loadReservations();

    }, []);


    // =========================================================
    // ONLY UNAVAILABLE BOOKS CAN BE RESERVED
    // =========================================================

    const unavailableBooks = books.filter(
        (book) =>
            book.availableCopies === 0 &&
            book.status === "Unavailable"
    );


    // =========================================================
    // SEARCH
    // =========================================================

    const filteredBooks = useMemo(() => {

        const query =
            searchQuery.trim().toLowerCase();

        if (!query) {
            return unavailableBooks;
        }

        return unavailableBooks.filter(
            (book) =>
                book.title
                    ?.toLowerCase()
                    .includes(query) ||
                book.author
                    ?.toLowerCase()
                    .includes(query)
        );

    }, [unavailableBooks, searchQuery]);


    // =========================================================
    // SELECTED BOOK
    // =========================================================

    const selectedBook = books.find(
        (book) =>
            book.bookId === Number(selectedBookId)
    );


    // =========================================================
    // BOOK COVER
    // =========================================================

    const getBookCover = (book) => {

        if (!book?.coverImage) {
            return noCover;
        }

        return `${API_URL}/${book.coverImage}`;

    };


    // =========================================================
    // SELECT BOOK
    // =========================================================

    const handleSelect = (bookId) => {

        setSelectedBookId(bookId);

        setStep("confirm");

    };


    // =========================================================
    // CONFIRM RESERVATION
    // =========================================================

    const handleConfirmReservation = async () => {

        const userId =
            Number(localStorage.getItem("userId"));

        if (!userId) {

            toast.error(
                "User not found. Please log in again."
            );

            return;

        }

        if (!selectedBook) {

            toast.error(
                "Please select a book."
            );

            return;

        }

        try {

            const response = await reserveBook(
                userId,
                selectedBook.bookId
            );

            toast.success(
                response.message ||
                "Book reserved successfully."
            );


            // Reload reservations from database
            const updatedReservations =
                await getMyReservations(userId);

            setReservations(
                updatedReservations.data ??
                updatedReservations
            );


            setStep("success");

        } catch (error) {

            console.error(
                "Reservation failed:",
                error
            );

            toast.error(
                error.message ||
                "Failed to reserve book."
            );

        }

    };


    // =========================================================
    // CANCEL RESERVATION
    // =========================================================

    const handleCancelReservation =
        async (reservationId) => {

            try {

                const response =
                    await cancelReservation(
                        reservationId
                    );

                toast.success(
                    response.message ||
                    "Reservation cancelled successfully."
                );


                const userId =
                    Number(
                        localStorage.getItem(
                            "userId"
                        )
                    );


                const updatedReservations =
                    await getMyReservations(
                        userId
                    );


                setReservations(
                    updatedReservations.data ??
                    updatedReservations
                );

            } catch (error) {

                console.error(
                    "Failed to cancel reservation:",
                    error
                );

                toast.error(
                    error.message ||
                    "Failed to cancel reservation."
                );

            }

        };


    // =========================================================
    // VIEW MY RESERVATIONS
    // =========================================================

    const handleViewMyReservations = () => {

        setSelectedBookId(null);

        setSearchQuery("");

        setStep("list");

    };


    return (

        <div
            className="min-h-screen pb-24"
            style={{
                background:
                    "linear-gradient(160deg, #d7e3ea 0%, #cfdfe9 45%, #fcf0c8 100%)",
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

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <PageHeader
                    title={
                        step === "list"
                            ? "My Reservations"
                            : "Reserve Book"
                    }
                    subtitle={
                        step === "list"
                            ? "View and manage your book reservations"
                            : step === "select"
                            ? "Choose an unavailable book"
                            : step === "confirm"
                            ? "Confirm your reservation"
                            : step === "success"
                            ? "Reservation submitted successfully"
                            : undefined
                    }
                />


                {/* =================================================
                    STEP 0 — MY RESERVATIONS
                ================================================= */}

                {step === "list" && (

                    <>

                        <div className="
                            flex
                            items-center
                            justify-between
                            mb-4
                        ">

                            <h3 className="
                                text-sm
                                font-semibold
                                text-[#1F1F1F]
                            ">
                                My Reservations
                            </h3>


                            <button
                                onClick={() =>
                                    setStep("select")
                                }
                                className="
                                    text-xs
                                    font-semibold
                                    text-[#106A2E]
                                    hover:underline
                                "
                            >
                                + New Reservation
                            </button>

                        </div>


                        {loadingReservations ? (

                            <div className="
                                py-10
                                text-center
                            ">
                                <p className="
                                    text-sm
                                    text-gray-500
                                ">
                                    Loading reservations...
                                </p>
                            </div>

                        ) : reservations.length === 0 ? (

                            <EmptyState
                                title="No reservations yet"
                                message="You haven't made any book reservations yet."
                                actionLabel="Browse Unavailable Books"
                                onAction={() =>
                                    setStep("select")
                                }
                            />

                        ) : (

                            <div className="space-y-3">

                                {reservations.map(
                                    (reservation) => (

                                        <ReservationCard
                                            key={
                                                reservation.reservationId
                                            }
                                            reservation={
                                                reservation
                                            }
                                            onCancel={
                                                handleCancelReservation
                                            }
                                        />

                                    )
                                )}

                            </div>

                        )}

                    </>

                )}


                {/* =================================================
                    STEP 1 — SELECT BOOK
                ================================================= */}

                {step === "select" && (

                    <>

                        <div className="mb-5">

                            <SearchBar
                                value={searchQuery}
                                onChange={
                                    setSearchQuery
                                }
                                placeholder="Search unavailable books..."
                            />

                        </div>


                        {loadingBooks ? (

                            <div className="
                                py-10
                                text-center
                            ">

                                <p className="
                                    text-sm
                                    text-gray-500
                                ">
                                    Loading books...
                                </p>

                            </div>

                        ) : (

                            <>

                                <div
                                    onClickCapture={(e) => {

                                        const card =
                                            e.target.closest(
                                                "[data-book-id]"
                                            );

                                        if (card) {

                                            e.preventDefault();

                                            e.stopPropagation();

                                            handleSelect(
                                                card.getAttribute(
                                                    "data-book-id"
                                                )
                                            );

                                        }

                                    }}
                                    className="cursor-pointer"
                                >

                                    <BookGrid
                                        books={
                                            filteredBooks
                                        }
                                    />

                                </div>


                                {filteredBooks.length === 0 && (

                                    <p className="
                                        text-sm
                                        text-gray-500
                                        text-center
                                        py-10
                                    ">
                                        No unavailable books match "{searchQuery}"
                                    </p>

                                )}

                            </>

                        )}


                        <button
                            onClick={() =>
                                setStep("list")
                            }
                            className="
                                mt-5
                                w-full
                                p-3.5
                                rounded-xl
                                font-semibold
                                text-sm
                                text-gray-600
                                bg-gray-100
                                hover:bg-gray-200
                                transition-all
                            "
                        >
                            Back to My Reservations
                        </button>

                    </>

                )}


                {/* =================================================
                    STEP 2 — CONFIRM RESERVATION
                ================================================= */}

                {step === "confirm" && selectedBook && (

                    <div className="
                        bg-white/90
                        rounded-[24px]
                        shadow-sm
                        p-5
                        sm:p-7
                    ">

                        {/* BOOK INFO */}

                        <div className="
                            flex
                            gap-4
                            mb-6
                        ">

                            <img
                                src={
                                    getBookCover(
                                        selectedBook
                                    )
                                }
                                onError={(e) => {
                                    e.currentTarget.src =
                                        noCover;
                                }}
                                alt={`Cover of ${selectedBook.title}`}
                                className="
                                    w-20
                                    h-28
                                    rounded-xl
                                    shadow-sm
                                    object-cover
                                    flex-shrink-0
                                "
                            />


                            <div className="min-w-0">

                                <h2 className="
                                    text-base
                                    font-semibold
                                    text-[#1F1F1F]
                                    leading-snug
                                    mb-1
                                ">
                                    {
                                        selectedBook.title
                                    }
                                </h2>


                                <p className="
                                    text-sm
                                    text-gray-500
                                    mb-1
                                ">
                                    {
                                        selectedBook.author
                                    }
                                </p>


                                <p className="
                                    text-xs
                                    text-gray-400
                                ">
                                    {
                                        selectedBook.shelfLocation
                                    }
                                </p>

                            </div>

                        </div>


                        {/* RESERVATION INFORMATION */}

                        <div className="
                            bg-[#F7FAF8]
                            rounded-xl
                            p-4
                            mb-4
                        ">

                            <p className="
                                text-xs
                                font-semibold
                                text-[#1F1F1F]
                                mb-1
                            ">
                                Reservation Information
                            </p>


                            <p className="
                                text-xs
                                text-gray-500
                                leading-relaxed
                            ">
                                Your reservation will be submitted for review.
                                You can track its status anytime under My Reservations.
                            </p>

                        </div>


                        {/* NOTIFICATION INFO */}

                        <div className="
                            border-2
                            border-dashed
                            border-gray-200
                            rounded-xl
                            p-4
                            text-center
                            mb-6
                        ">

                            <p className="
                                text-xs
                                text-gray-500
                            ">
                                You'll receive a notification when there is an update regarding your reservation.
                            </p>

                        </div>


                        {/* BUTTONS */}

                        <div className="
                            grid
                            grid-cols-2
                            gap-3
                        ">

                            <button
                                onClick={() => {

                                    if (
                                        preselectedId
                                    ) {

                                        navigate(-1);

                                    } else {

                                        setStep(
                                            "select"
                                        );

                                    }

                                }}
                                className="
                                    p-3.5
                                    rounded-xl
                                    font-semibold
                                    text-sm
                                    text-gray-600
                                    bg-gray-100
                                    hover:bg-gray-200
                                    transition-all
                                "
                            >
                                Cancel
                            </button>


                            <button
                                onClick={
                                    handleConfirmReservation
                                }
                                className="
                                    p-3.5
                                    rounded-xl
                                    font-semibold
                                    text-sm
                                    text-white
                                    bg-[#106A2E]
                                    hover:brightness-105
                                    active:scale-[0.99]
                                    transition-all
                                "
                            >
                                Confirm Reservation
                            </button>

                        </div>

                    </div>

                )}


                {/* =================================================
                    STEP 3 — SUCCESS
                ================================================= */}

                {step === "success" && selectedBook && (

                    <div className="
                        bg-white/90
                        rounded-[24px]
                        shadow-sm
                        p-7
                        text-center
                    ">

                        <div className="
                            w-16
                            h-16
                            rounded-2xl
                            bg-[#DCFCE7]
                            text-[#106A2E]
                            flex
                            items-center
                            justify-center
                            mx-auto
                            mb-4
                        ">

                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20 6 9 17l-5-5" />
                            </svg>

                        </div>


                        <h2 className="
                            text-lg
                            font-semibold
                            text-[#1F1F1F]
                            mb-1.5
                        ">
                            Reservation Confirmed
                        </h2>


                        <p className="
                            text-sm
                            text-gray-500
                            mb-6
                            leading-relaxed
                        ">
                            Your reservation for "{selectedBook.title}" has been submitted successfully.
                            You can monitor its status under My Reservations.
                        </p>


                        <div className="
                            grid
                            grid-cols-2
                            gap-3
                        ">

                            <button
                                onClick={
                                    handleViewMyReservations
                                }
                                className="
                                    p-3.5
                                    rounded-xl
                                    font-semibold
                                    text-sm
                                    text-[#106A2E]
                                    bg-[#E1F5EE]
                                    hover:brightness-105
                                    active:scale-[0.99]
                                    transition-all
                                "
                            >
                                View My Reservations
                            </button>


                            <Link
                                to="/library"
                                className="
                                    p-3.5
                                    rounded-xl
                                    font-semibold
                                    text-sm
                                    text-white
                                    bg-[#106A2E]
                                    hover:brightness-105
                                    active:scale-[0.99]
                                    transition-all
                                "
                            >
                                Back to Library
                            </Link>

                        </div>

                    </div>

                )}

            </div>

        </div>

    );

}