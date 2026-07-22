import Modal from "../../components/Common/Modal";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";

import { getBook, borrowBook } from "../../services/libraryService";
import PageHeader from "../../components/Library/PageHeader";
import EmptyState from "../../components/Library/EmptyState";
import noCover from "../../assets/images/no-cover.png";


export default function BookDetails() {

    const { bookId } = useParams();
    const navigate = useNavigate();

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [borrowing, setBorrowing] = useState(false);
    const [showBorrowModal, setShowBorrowModal] = useState(false);

    useEffect(() => {
        async function loadBook() {
            try {
                setLoading(true);

                const response = await getBook(bookId);

                setBook(response.data);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadBook();
    }, [bookId]);

    if (!book) {
        return (
            <div
                className="min-h-screen pb-24"
                style={{
                    background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)"
                }}
            >
                <div className="max-w-md sm:max-w-2xl mx-auto p-4 sm:p-6">
                    <PageHeader title="Book Details" />
                    <EmptyState
                        title="Book not found"
                        message="This book may have been removed from the catalog."
                        actionLabel="Back to Browse Books"
                        onAction={() => navigate("/library/books")}
                    />
                </div>
            </div>
        );
    }

    const isAvailable = book.availableCopies > 0;
    

    const handleBorrow = () => {

        if (!isAvailable || borrowing) return;

        setShowBorrowModal(true);

    };

    const confirmBorrow = async () => {

        setShowBorrowModal(false);
        setBorrowing(true);

        try {

            const userId = parseInt(localStorage.getItem("userId"), 10);

            const response = await borrowBook(
                userId,
                book.bookId
            );

            toast.success(response.message);

            const updated = await getBook(book.bookId);

            setBook(updated.data);

        } catch (err) {

            toast.error(err.message || "Failed to borrow book.");

        } finally {

            setBorrowing(false);

        }

    };

    const handleReserve = () => {
        if (isAvailable) return;
        navigate(`/library/reserve?bookId=${book.bookId}`);
    };

    const handleToggleFavorite = () => {
        setIsFavorite((prev) => !prev);
        toast(isFavorite ? "Removed from favorites" : "Added to favorites");
    };

    const handleShare = async () => {
        const shareData = {
            title: book.title,
            text: `${book.title} by ${book.author} — available on CDM: OneServe Library`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {
                // user cancelled the share sheet — no action needed
            }
            return;
        }

        try {
            await navigator.clipboard.writeText(window.location.href);
            toast("Link copied to clipboard");
        } catch {
            toast("Couldn't copy link");
        }
    };

    const statusStyles = {
        Available: { bg: "#E1F5EE", color: "#085041" },
        Borrowed: { bg: "#FAECE7", color: "#712B13" },
        Reserved: { bg: "#FAEEDA", color: "#633806" },
    };
    const statusStyle = statusStyles[book.status] ?? statusStyles.Available;

    return (

        <div
            className="min-h-screen pb-28"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)"
            }}
        >

            <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto p-4 sm:p-6">

                <PageHeader title="Book Details" />

                <div className="bg-white/90 rounded-[24px] shadow-sm overflow-hidden sm:flex">

                    {/* COVER */}
                    <div className="sm:w-64 flex-shrink-0 bg-gray-50 flex items-center justify-center p-6 sm:p-8">
                       <img
                            src={
                                book.coverImage
                                    ? `${API_URL}/${book.coverImage}`
                                    : noCover
                            }
                            onError={(e) => {
                                e.currentTarget.src = noCover;
                            }}
                            alt={`Cover of ${book.title}`}
                            className="w-40 sm:w-full rounded-xl shadow-md object-cover"
                        />
                    </div>

                    {/* DETAILS */}
                    <div className="p-5 sm:p-7 flex-1">

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span
                                className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
                                style={{ background: statusStyle.bg, color: statusStyle.color }}
                            >
                                {book.status}
                            </span>
                            {book.isNewArrival && (
                                <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[#F4D35E]/30 text-[#633806]">
                                    New Arrival
                                </span>
                            )}
                            <span className="text-[11px] text-gray-500 px-2.5 py-1 rounded-full bg-gray-100">
                                {book.category}
                            </span>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-semibold text-[#1F1F1F] tracking-tight mb-1">
                            {book.title}
                        </h1>
                        <p className="text-sm text-gray-500 mb-5">
                            by {book.author}
                        </p>

                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-5">
                            <div>
                                <dt className="text-gray-400 text-xs mb-0.5">ISBN</dt>
                                <dd className="text-[#1F1F1F] font-medium">{book.isbn}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 text-xs mb-0.5">Publisher</dt>
                                <dd className="text-[#1F1F1F] font-medium">{book.publisher || "N/A"}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 text-xs mb-0.5">Year</dt>
                                <dd className="text-[#1F1F1F] font-medium">{book.publishYear || "N/A"}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 text-xs mb-0.5">Language</dt>
                                <dd className="text-[#1F1F1F] font-medium">{book.language || "N/A"}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 text-xs mb-0.5">Shelf Location</dt>
                                <dd className="text-[#1F1F1F] font-medium">{book.shelfLocation || "N/A"}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 text-xs mb-0.5">Available Copies</dt>
                                <dd className="text-[#1F1F1F] font-medium">
                                    {book.availableCopies} / {book.totalCopies}
                                </dd>
                            </div>
                        </dl>

                        <div>
                            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1.5">
                                Description
                            </h2>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {book.description || "No description available."}
                            </p>
                        </div>

                    </div>

                </div>

                {/* ACTIONS */}

                <div className="grid grid-cols-2 gap-3 mt-6">

                    <button
                        onClick={handleBorrow}
                        disabled={!isAvailable || borrowing}
                        className="
                            col-span-2 sm:col-span-1
                            bg-[#106A2E] text-white
                            p-3.5 rounded-xl font-semibold text-sm
                            shadow-sm
                            hover:brightness-105 active:scale-[0.99]
                            disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100
                            transition-all
                        "
                    >
                        {borrowing
                            ? "Borrowing..."
                            : isAvailable
                                ? "Borrow Book"
                                : "Not Available"}
                    </button>

                    <button
                        onClick={handleReserve}
                        disabled={isAvailable}
                        className="
                            col-span-2 sm:col-span-1
                            bg-[#F4D35E] text-[#1F1F1F]
                            p-3.5 rounded-xl font-semibold text-sm
                            shadow-sm
                            hover:brightness-105 active:scale-[0.99]
                            disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:active:scale-100
                            transition-all
                        "
                    >
                        {isAvailable ? "Currently Available" : "Reserve Book"}
                    </button>

                    <button
                        onClick={handleToggleFavorite}
                        className="
                            flex items-center justify-center gap-2
                            bg-white/90 text-[#1F1F1F] border border-gray-200
                            p-3 rounded-xl font-medium text-sm
                            hover:bg-white active:scale-[0.99]
                            transition-all
                        "
                    >
                        <svg
                            width="16" height="16" viewBox="0 0 24 24"
                            fill={isFavorite ? "#106A2E" : "none"}
                            stroke={isFavorite ? "#106A2E" : "currentColor"}
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21l7.78-7.55 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {isFavorite ? "Favorited" : "Favorite"}
                    </button>

                    <button
                        onClick={handleShare}
                        className="
                            flex items-center justify-center gap-2
                            bg-white/90 text-[#1F1F1F] border border-gray-200
                            p-3 rounded-xl font-medium text-sm
                            hover:bg-white active:scale-[0.99]
                            transition-all
                        "
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <path d="m8.59 13.51 6.83 3.98M15.41 6.51 8.59 10.49" />
                        </svg>
                        Share
                    </button>

                </div>

            </div>

            <Modal
                isOpen={showBorrowModal}
                type="confirm"
                title="Borrow Book"
                message={`Are you sure you want to borrow "${book.title}"?`}
                confirmText="Borrow"
                cancelText="Cancel"
                onConfirm={confirmBorrow}
                onClose={() => setShowBorrowModal(false)}
            />

            <Modal
                isOpen={borrowing}
                type="loading"
                title="Borrowing Book"
                message="Please wait..."
            />

        </div>

    );

}
