import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import noCover from "../../assets/images/no-cover.png";

import PageHeader from "../../components/Library/PageHeader";
import SearchBar from "../../components/Library/SearchBar";
import BookGrid from "../../components/Library/BookGrid";
import BookCard from "../../components/Library/BookCard";

import { mockBooks } from "../../data/mockLibraryData";

const LOAN_PERIOD_DAYS = 14;

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date) {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function BorrowBook() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedId = searchParams.get("bookId");

    const [selectedBookId, setSelectedBookId] = useState(preselectedId || null);
    const [step, setStep] = useState(preselectedId ? "confirm" : "select");
    const [searchQuery, setSearchQuery] = useState("");

    const availableBooks = useMemo(
        () => mockBooks.filter((book) => book.availableCopies > 0),
        []
    );

    const filteredBooks = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return availableBooks;
        return availableBooks.filter(
            (book) =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
        );
    }, [availableBooks, searchQuery]);

    const selectedBook = mockBooks.find((b) => b.id === selectedBookId);

    const handleSelect = (bookId) => {
        setSelectedBookId(bookId);
        setStep("confirm");
    };

    const handleConfirm = () => {
        // Placeholder only — no backend call yet. libraryService.borrowBook()
        // will replace this once that file exists.
        setStep("success");
        toast.success("Book borrowed successfully");
    };

    const borrowDate = new Date();
    const dueDate = addDays(borrowDate, LOAN_PERIOD_DAYS);

    return (

        <div
            className="min-h-screen pb-24"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)"
            }}
        >

            <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto p-4 sm:p-6">

                <PageHeader
                    title="Borrow Book"
                    subtitle={
                        step === "select"
                            ? "Choose an available book"
                            : step === "confirm"
                            ? "Confirm your borrow request"
                            : undefined
                    }
                />

                {/* STEP 1 — SELECT A BOOK */}

                {step === "select" && (
                    <>
                        <div className="mb-5">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search available books..."
                            />
                        </div>

                        <div onClick={(e) => {
                            const card = e.target.closest("[data-book-id]");
                            if (card) handleSelect(card.getAttribute("data-book-id"));
                        }}>
                            {/* BookGrid navigates on click by default (BookCard -> /library/book/:id);
                                here we intercept via a data attribute wrapper instead so selecting
                                a book keeps the user inside the borrow flow. */}
                            <BookGrid
                                books={filteredBooks}
                                emptyMessage={`No available books match "${searchQuery}"`}
                                onBookClick={(book) => handleSelect(book.id)}
                            />
                            {filteredBooks.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-10">
                                    No available books match "{searchQuery}"
                                </p>
                            )}
                        </div>
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
                                <p className="text-[11px] text-gray-400 mb-1">Borrow Date</p>
                                <p className="text-sm font-semibold text-[#1F1F1F]">{formatDate(borrowDate)}</p>
                            </div>
                            <div className="bg-[#F7FAF8] rounded-xl p-3.5">
                                <p className="text-[11px] text-gray-400 mb-1">Due Date</p>
                                <p className="text-sm font-semibold text-[#1F1F1F]">{formatDate(dueDate)}</p>
                            </div>
                        </div>

                        {/* QR VERIFICATION PLACEHOLDER */}
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-center mb-6">
                            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                    <path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z" />
                                </svg>
                            </div>
                            <p className="text-xs text-gray-500 max-w-[220px]">
                                Present your Digital Student ID QR code at the circulation desk to verify this borrow.
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
                                onClick={handleConfirm}
                                className="p-3.5 rounded-xl font-semibold text-sm text-white bg-[#106A2E] hover:brightness-105 active:scale-[0.99] transition-all"
                            >
                                Confirm Borrow
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
                            Book Borrowed
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            "{selectedBook.title}" is due back on {formatDate(dueDate)}.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                to="/library/borrow-history"
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