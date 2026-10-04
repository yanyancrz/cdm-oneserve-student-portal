import { useEffect, useState } from "react";
import {
    X,
    Bookmark,
    Clock3,
    CheckCircle2,
    FileText,
} from "lucide-react";
import toast from "react-hot-toast";

import noCover from "../../assets/images/no-cover.png";
import { API_URL } from "../../config/api";
import { reserveBook } from "../../services/libraryService";

const HOLD_DAYS = 3;

/**
 * Props:
 *  - book            : ang libro (galing sa API)
 *  - userId          : ID ng naka-login na user
 *  - maxQuantity     : (optional) ilang slot pa ang natitira ng user
 *                      (limit - borrowed - reserved). Kapag 0, limit na.
 *  - alreadyReserved : (optional) true kung may active reservation na
 *                      ang user para sa librong ito
 *  - onClose         : isara ang modal
 *  - onReserved      : tinatawag pagkatapos mag-reserve (para mag-refresh)
 */
export default function BookDetailsModal({
    book,
    userId,
    maxQuantity,
    alreadyReserved = false,
    onClose,
    onReserved,
}) {
    const [isReserving, setIsReserving] = useState(false);

    // Isara gamit ang Escape key
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape" && !isReserving) {
                onClose();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () =>
            window.removeEventListener("keydown", onKeyDown);
    }, [onClose, isReserving]);

    if (!book) return null;

    // =====================================================
    // NORMALIZE BOOK DATA
    // =====================================================

    const bookId =
        book.id ??
        book.bookId ??
        book.bookID;

    const title =
        book.title ||
        book.name ||
        "Untitled Book";

    const author =
        book.author ||
        book.authorName ||
        "Unknown Author";

    const institute =
        book.institute ||
        book.category ||
        "Library";

    const isbn =
        book.isbn ||
        book.ISBN ||
        "N/A";

    const shelfLocation =
        book.shelfLocation ||
        book.shelf ||
        book.location ||
        "N/A";

    const callNumber =
        book.callNumber ||
        book.callNo ||
        book.bookCode ||
        "N/A";

    const description =
        book.description ||
        book.summary ||
        "No description available.";

    const availableCopies = Number(
        book.availableCopies ??
        book.copiesAvailable ??
        book.available ??
        0
    );

    const totalCopies = Number(
        book.totalCopies ??
        book.copies ??
        book.total ??
        availableCopies
    );

    const coverImage =
        book.coverUrl ||
        book.coverImage ||
        book.image ||
        null;

    const coverSrc = coverImage
        ? coverImage.startsWith("http")
            ? coverImage
            : `${API_URL}/${String(coverImage).replace(/^\/+/, "")}`
        : noCover;

    // =====================================================
    // E-BOOK (PDF)
    // pdfFile = "library/ebooks/<file>.pdf", served by the API.
    // Opened in a new tab: phone browsers cannot show PDFs inside a modal.
    // =====================================================

    const pdfFile = book.pdfFile || null;

    const pdfSrc = pdfFile
        ? String(pdfFile).startsWith("http")
            ? pdfFile
            : `${API_URL}/${String(pdfFile).replace(/^\/+/, "")}`
        : null;

    // =====================================================
    // CAN RESERVE?
    // =====================================================

    const limitReached =
        typeof maxQuantity === "number" && maxQuantity <= 0;

    const isUnavailable = availableCopies <= 0;

    const canReserve =
        !alreadyReserved &&
        !limitReached &&
        !isUnavailable;

    // =====================================================
    // RESERVE (1 copy per book)
    // =====================================================

    const handleReserve = async () => {
        if (!userId) {
            toast.error("Please log in again.");
            return;
        }

        if (!bookId) {
            toast.error("Book ID is missing.");
            return;
        }

        if (!canReserve) return;

        setIsReserving(true);

        try {
            await reserveBook(userId, bookId);

            toast.success("Book reserved successfully.");

            if (onReserved) {
                onReserved(book);
            }

            onClose();
        } catch (error) {
            console.error(error);

            toast.error(
                error?.message ||
                    "Unable to reserve this book."
            );
        } finally {
            setIsReserving(false);
        }
    };

    // =====================================================
    // BUTTON LABEL
    // =====================================================

    let buttonLabel = "Reserve book";

    if (isReserving) {
        buttonLabel = "Reserving...";
    } else if (alreadyReserved) {
        buttonLabel = "Already reserved";
    } else if (limitReached) {
        buttonLabel = "Borrowing limit reached";
    } else if (isUnavailable) {
        buttonLabel = "Currently unavailable";
    }

    // =====================================================
    // UI
    // =====================================================

    return (
        <div
            className="
                fixed
                inset-0
                z-[9999]
                flex
                items-center
                justify-center
                bg-slate-900/60
                p-4
                backdrop-blur-sm
            "
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !isReserving) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="
                    relative
                    w-full
                    max-w-md
                    overflow-hidden
                    rounded-[22px]
                    bg-white
                    shadow-2xl
                "
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-slate-100
                        px-4
                        py-3
                    "
                >
                    <p className="text-xs font-medium text-slate-700">
                        Book details
                    </p>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isReserving}
                        className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-100
                            text-slate-500
                            transition
                            hover:bg-slate-200
                            hover:text-slate-800
                            disabled:opacity-40
                        "
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* =================================================
                    BOOK INFORMATION
                ================================================= */}

                <div className="max-h-[70dvh] overflow-y-auto p-4">

                    <div className="flex gap-3">

                        {/* COVER */}

                        <div
                            className="
                                h-[110px]
                                w-[74px]
                                shrink-0
                                overflow-hidden
                                rounded-xl
                                bg-slate-100
                                shadow-sm
                            "
                        >
                            <img
                                src={coverSrc}
                                alt={title}
                                onError={(e) => {
                                    e.currentTarget.src = noCover;
                                }}
                                className="
                                    h-full
                                    w-full
                                    object-cover
                                "
                            />
                        </div>

                        {/* TITLE */}

                        <div className="min-w-0 flex-1">

                            <p
                                className="
                                    text-[10px]
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    text-[#106A2E]
                                "
                            >
                                {institute}
                            </p>

                            <h2
                                className="
                                    mt-1
                                    line-clamp-3
                                    text-sm
                                    font-semibold
                                    leading-5
                                    text-slate-800
                                "
                            >
                                {title}
                            </h2>

                            <p
                                className="
                                    mt-1
                                    line-clamp-2
                                    text-[11px]
                                    text-slate-500
                                "
                            >
                                {author}
                            </p>

                            <p
                                className="
                                    mt-2
                                    text-[10px]
                                    text-slate-400
                                "
                            >
                                ISBN: {isbn}
                            </p>

                        </div>

                    </div>

                    {/* =================================================
                        BOOK DETAILS BOX
                    ================================================= */}

                    <div
                        className="
                            mt-4
                            rounded-xl
                            bg-slate-50
                            p-3
                        "
                    >

                        <div className="grid grid-cols-2 gap-x-5 gap-y-3">

                            <div>
                                <p className="text-[10px] text-slate-400">
                                    Shelf location
                                </p>

                                <p className="mt-0.5 text-[11px] font-semibold text-slate-700">
                                    {shelfLocation}
                                </p>
                            </div>

                            <div>
                                <p className="text-[10px] text-slate-400">
                                    Call number
                                </p>

                                <p className="mt-0.5 text-[11px] font-semibold text-[#106A2E]">
                                    {callNumber}
                                </p>
                            </div>

                            <div className="col-span-2 border-t border-slate-200 pt-3">

                                <p className="text-[10px] text-slate-400">
                                    Copies available
                                </p>

                                <p
                                    className={`
                                        mt-0.5
                                        text-xs
                                        font-semibold
                                        ${
                                            availableCopies > 0
                                                ? "text-[#106A2E]"
                                                : "text-red-600"
                                        }
                                    `}
                                >
                                    {availableCopies} of {totalCopies}
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* =================================================
                        DESCRIPTION
                    ================================================= */}

                    <div className="mt-4">

                        <p className="text-[11px] font-semibold text-slate-700">
                            About this book
                        </p>

                        <p
                            className="
                                mt-1
                                line-clamp-3
                                text-[11px]
                                leading-4
                                text-slate-500
                            "
                        >
                            {description}
                        </p>

                    </div>

                    {/* =================================================
                        ALREADY RESERVED
                    ================================================= */}

                    {alreadyReserved && (
                        <div
                            className="
                                mt-4
                                flex
                                gap-2
                                rounded-xl
                                bg-emerald-50
                                p-3
                                text-[#106A2E]
                            "
                        >
                            <CheckCircle2
                                size={14}
                                className="mt-0.5 shrink-0"
                            />

                            <p className="text-[10px] leading-4">
                                You already have an active reservation
                                for this book.
                            </p>
                        </div>
                    )}

                    {/* =================================================
                        RESERVATION NOTICE
                    ================================================= */}

                    <div
                        className="
                            mt-4
                            flex
                            gap-2
                            rounded-xl
                            bg-amber-50
                            p-3
                            text-amber-700
                        "
                    >
                        <Clock3
                            size={14}
                            className="mt-0.5 shrink-0"
                        />

                        <p className="text-[10px] leading-4">
                            Reserved books are held for {HOLD_DAYS} days.
                            Pick them up at the circulation desk
                            and show your Access Pass. The librarian
                            will confirm the claim.
                        </p>

                    </div>

                </div>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div
                    className="
                        flex
                        flex-col
                        gap-2
                        border-t
                        border-slate-100
                        p-3
                    "
                >

                    {/* E-BOOK (only when a PDF was uploaded) */}

                    {pdfSrc && (
                        <a
                            href={pdfSrc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                                flex
                                h-10
                                w-full
                                items-center
                                justify-center
                                gap-2
                                rounded-lg
                                border
                                border-[#106A2E]/30
                                bg-white
                                px-3
                                text-xs
                                font-bold
                                text-[#106A2E]
                                transition
                                hover:bg-emerald-50
                            "
                        >
                            <FileText size={14} />
                            Read E-Book (PDF)
                        </a>
                    )}

                    <button
                        type="button"
                        onClick={handleReserve}
                        disabled={!canReserve || isReserving}
                        className="
                            flex
                            h-10
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            bg-[#106A2E]
                            px-3
                            text-xs
                            font-bold
                            text-white
                            transition
                            hover:bg-[#0d5a27]
                            disabled:cursor-not-allowed
                            disabled:bg-slate-300
                        "
                    >
                        <Bookmark size={14} />
                        {buttonLabel}
                    </button>

                </div>

            </div>
        </div>
    );
}