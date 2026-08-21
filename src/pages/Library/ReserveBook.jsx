import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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



function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export default function ReserveBook() {

    useEffect(() => {

    const loadBooks = async () => {

        try {

            const response = await getBooks();

            setBooks(response.data);

        }
        catch (error) {

            console.error(error);

        }

    };

    loadBooks();

}, []);

useEffect(() => {

    const loadReservations = async () => {

        const userId = Number(localStorage.getItem("userId"));

        if (!userId) return;

        try {

            const data = await getMyReservations(userId);

            setReservations(data);

        }
        catch (error) {

            console.error(error);

        }

    };

    loadReservations();

}, []);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedId = searchParams.get("bookId");

    const [reservations, setReservations] = useState([]);
    const [selectedBookId, setSelectedBookId] = useState(preselectedId || null);
    const [step, setStep] = useState(preselectedId ? "confirm" : "list");
    const [searchQuery, setSearchQuery] = useState("");

    // Only books with zero available copies can be reserved.
    const [books, setBooks] = useState([]);

    const unavailableBooks = books.filter(
        (book) =>
            book.availableCopies === 0 &&
            book.status === "Unavailable"
    );

    const filteredBooks = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return unavailableBooks;
        return unavailableBooks.filter(
            (book) =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
        );
    }, [unavailableBooks, searchQuery]);

    const selectedBook = books.find(
        (b) => b.bookId === Number(selectedBookId)
    );

   const activeReservations = reservations.filter(
    (r) =>
        r.status === "Pending" ||
        r.status === "Approved"
);

    // How many active reservations already exist for the selected book.
    const existingQueueForSelected = useMemo(() => {
        if (!selectedBookId) return 0;
        return activeReservations.filter((r) => r.bookId === selectedBookId).length;
    }, [activeReservations, selectedBookId]);

    const queuePosition = existingQueueForSelected + 1;
    const queueLength = existingQueueForSelected + 1;

    // Rough placeholder estimate — one loan period (14 days) per person ahead in queue.
    const estimatedAvailableDate = addDays(new Date(), queuePosition * 14);

    const handleSelect = (bookId) => {
        setSelectedBookId(bookId);
        setStep("confirm");
    };

   const handleConfirmReservation = async () => {

    const userId = Number(localStorage.getItem("userId"));

    if (!userId) {
        toast.error("User not found. Please log in again.");
        return;
    }

    if (!selectedBook) {
        toast.error("Please select a book.");
        return;
    }

    try {

        const response = await reserveBook(
            userId,
            selectedBook.bookId
        );

        toast.success(
            response.message || "Book reserved successfully"
        );

        const updatedReservations =
            await getMyReservations(userId);

        setReservations(
            updatedReservations.data ?? updatedReservations
        );

        setStep("success");

    } catch (error) {

        console.error(error);

        toast.error(
            error.message || "Failed to reserve book."
        );
    }
};

   const handleCancelReservation = async (reservationId) => {

    try {

        const response = await cancelReservation(reservationId);

        toast.success(
            response.message || "Reservation cancelled successfully."
        );

        const userId = Number(localStorage.getItem("userId"));

        const updatedReservations =
            await getMyReservations(userId);

        setReservations(
            updatedReservations.data ?? updatedReservations
        );

    } catch (error) {

        console.error(error);

        toast.error(
            error.message || "Failed to cancel reservation."
        );

    }
};

    return (

        <div
            className="min-h-screen pb-24"
            style={{
                background: "linear-gradient(160deg, #d7e3ea 0%, #cfdfe9 45%, #fcf0c8 100%)",
            }}
        >

            <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto p-4 sm:p-6">

                <PageHeader
                    title={step === "list" ? "My Reservations" : "Reserve Book"}
                    subtitle={
                        step === "list"
                            ? "View and manage your book reservations"
                            : step === "select"
                            ? "Choose an unavailable book"
                            : step === "confirm"
                            ? "Confirm your reservation"
                            : undefined
                    }
                />

                {/* STEP 0 — RESERVATION LIST (default view) */}

                {step === "list" && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[#1F1F1F]">
                                My Reservations
                            </h3>
                            <button
                                onClick={() => setStep("select")}
                                className="text-xs font-semibold text-[#106A2E] hover:underline"
                            >
                                + New Reservation
                            </button>
                        </div>

                        {reservations.length === 0 ? (
                            <EmptyState
                                title="No reservations yet"
                                message="You haven't made any book reservations yet."
                                actionLabel="Browse Unavailable Books"
                                onAction={() => setStep("select")}
                            />
                        ) : (
                            <div className="space-y-3">
                                {reservations.map((reservation) => (
                                    <ReservationCard
                                        key={reservation.reservationId}
                                        reservation={reservation}
                                        onCancel={handleCancelReservation}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* STEP 1 — SELECT A BOOK */}

                {step === "select" && (
                    <>
                        <div className="mb-5">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search unavailable books..."
                            />
                        </div>

                        <div
                            onClickCapture={(e) => {
                                const card = e.target.closest("[data-book-id]");
                                if (card) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSelect(card.getAttribute("data-book-id"));
                                }
                            }}
                            className="cursor-pointer"
                        >
                            <BookGrid books={filteredBooks} />
                        </div>

                        {filteredBooks.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-10">
                                No unavailable books match "{searchQuery}"
                            </p>
                        )}

                        <button
                            onClick={() => setStep("list")}
                            className="mt-5 w-full p-3.5 rounded-xl font-semibold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                        >
                            Back to Reservations
                        </button>
                    </>
                )}

                {/* STEP 2 — CONFIRM */}

                {step === "confirm" && selectedBook && (
                    <div className="bg-white/90 rounded-[24px] shadow-sm p-5 sm:p-7">

                        <div className="flex gap-4 mb-6">
                            <img
                                src={selectedBook.coverUrl}
                                alt={`Cover of ${selectedBook.title}`}
                                className="w-20 rounded-xl shadow-sm object-cover flex-shrink-0"
                            />
                            <div className="min-w-0">
                                <h2 className="text-base font-semibold text-[#1F1F1F] leading-snug mb-1">
                                    {selectedBook.title}
                                </h2>
                                <p className="text-sm text-gray-500 mb-1">{selectedBook.author}</p>
                                <p className="text-xs text-gray-400">{selectedBook.shelfLocation}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-[#F7FAF8] rounded-xl p-3.5">
                                <p className="text-[11px] text-gray-400 mb-1">Queue Position</p>
                                <p className="text-sm font-semibold text-[#1F1F1F]">
                                    {queuePosition} of {queueLength}
                                </p>
                            </div>
                            <div className="bg-[#F7FAF8] rounded-xl p-3.5">
                                <p className="text-[11px] text-gray-400 mb-1">Estimated Availability</p>
                                <p className="text-sm font-semibold text-[#1F1F1F]">
                                    {estimatedAvailableDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </p>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center mb-6">
                            <p className="text-xs text-gray-500">
                                You'll receive a notification as soon as this book becomes available for pickup.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => (preselectedId ? navigate(-1) : setStep("select"))}
                                className="p-3.5 rounded-xl font-semibold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReservation}
                                className="p-3.5 rounded-xl font-semibold text-sm text-white bg-[#106A2E] hover:brightness-105 active:scale-[0.99] transition-all"
                            >
                                Confirm Reservation
                            </button>
                        </div>

                    </div>
                )}

                {/* STEP 3 — SUCCESS */}

                {step === "success" && selectedBook && (
                    <div className="bg-white/90 rounded-[24px] shadow-sm p-7 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#DCFCE7] text-[#106A2E] flex items-center justify-center mx-auto mb-4">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6 9 17l-5-5" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-[#1F1F1F] mb-1.5">
                            Reservation Confirmed
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            "{selectedBook.title}" is #{queuePosition} in queue. Estimated availability: {estimatedAvailableDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                to="/library/history"
                                className="p-3.5 rounded-xl font-semibold text-sm text-[#106A2E] bg-[#E1F5EE] hover:brightness-105 transition-all"
                            >
                                View History
                            </Link>
                            <Link
                                to="/library"
                                className="p-3.5 rounded-xl font-semibold text-sm text-white bg-[#106A2E] hover:brightness-105 transition-all"
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