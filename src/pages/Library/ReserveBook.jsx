import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    BookMarked,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    LibraryBig,
    MapPin,
    Minus,
    Plus,
    QrCode,
    Search,
    ShieldAlert,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import { API_URL } from "../../config/api";
import LibraryBottomNav from "../../components/BottomNavigation/LibraryBottomNav";

import { Skeleton, BookGridSkeleton } from "../../components/States";

// Palitan ang path kung nasa ibang folder ang curated_books.json
import curatedBooksList from "./curated_books.json";

// =========================================================
// ENDPOINTS
//
// loans: HULA ko ang path. Palitan kapag alam na ang tunay.
// Kapag mali, "—" lang ang lalabas at hindi mag-e-error.
// =========================================================

const ENDPOINTS = {
    profile: (email) =>
        `${API_URL}/api/profile/${encodeURIComponent(email)}`,
    accessPass: (userId) =>
        `${API_URL}/api/library/access-pass/${userId}`,
    loans: (userId) =>
        `${API_URL}/api/library/borrow/current/${userId}`,
};

const HOLD_HOURS = 48;

// =========================================================
// HELPERS
// =========================================================

const authHeaders = () => {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

    return token ? { Authorization: `Bearer ${token}` } : {};
};

const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
};

const toInstituteCode = (value) => {
    const text = String(value || "").toUpperCase();

    if (text.includes("ICS") || text.includes("COMPUT")) return "ICS";
    if (text.includes("ITE") || text.includes("TEACHER")) return "ITE";
    if (text.includes("IBE") || text.includes("BUSINESS")) return "IBE";

    return "";
};

const normalizeStatus = (value) =>
    String(value || "").trim().toLowerCase();

const isLoanActive = (loan) => {
    if (loan.returnDate || loan.returnedAt) return false;

    return !["returned", "cancelled", "closed"].includes(
        normalizeStatus(loan.status)
    );
};

const isLoanOverdue = (loan) => {
    if (normalizeStatus(loan.status) === "overdue") return true;

    const due = loan.dueDate ? new Date(loan.dueDate) : null;

    return Boolean(due && !Number.isNaN(due.getTime()) && due < new Date());
};

const isHoldExpired = (reservation) =>
    new Date(reservation.pickupBy).getTime() < Date.now();

const formatDateTime = (iso) =>
    new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

const getAvailability = (book) => {
    const available = Number(book.availableCopies ?? 0);
    const total = Number(book.totalCopies ?? 0);

    if (available <= 0) {
        return {
            label: "Unavailable",
            className: "bg-red-50 text-red-600",
        };
    }

    if (total > 0 && available <= Math.ceil(total * 0.25)) {
        return {
            label: `${available} left`,
            className: "bg-amber-50 text-amber-700",
        };
    }

    return {
        label: `${available} available`,
        className: "bg-emerald-50 text-emerald-700",
    };
};

// Grey blocks come from the shared kit.

// =========================================================
// BOOK CARD
// =========================================================

function BookCard({ book, reservedQty, onOpen }) {
    const availability = getAvailability(book);

    return (
        <button
            type="button"
            onClick={() => onOpen(book)}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-emerald-200 hover:shadow-lg"
        >
            <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                {book.coverUrl ? (
                    <img
                        src={book.coverUrl}
                        alt={book.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <BookOpen size={42} />
                    </div>
                )}

                <span
                    className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold shadow-sm ${availability.className}`}
                >
                    {availability.label}
                </span>

                {reservedQty > 0 && (
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#106A2E] px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
                        <BookMarked size={11} />
                        Reserved ×{reservedQty}
                    </span>
                )}
            </div>

            <div className="p-3">
                <p className="line-clamp-2 text-xs font-semibold leading-4 text-slate-800">
                    {book.title}
                </p>

                <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">
                    {book.author}
                </p>

                <p className="mt-2 text-[10px] font-semibold text-emerald-700">
                    {book.institute || book.category || "Library"}
                    {book.yearLevel ? ` · ${book.yearLevel}` : ""}
                </p>
            </div>
        </button>
    );
}

// =========================================================
// BOOK DETAIL SHEET (with Reserve)
// =========================================================

function BookSheet({
    book,
    reservedQty,
    maxQty,
    limitReached,
    borrowLimit,
    onClose,
    onReserve,
}) {
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const available = Number(book.availableCopies ?? 0);
    const canReserve = maxQty >= 1;
    const safeQty = Math.min(Math.max(1, quantity), Math.max(1, maxQty));

    let blockedReason = "";

    if (available <= 0) {
        blockedReason = "All copies are currently reserved or borrowed.";
    } else if (limitReached) {
        blockedReason = `You've reached your limit of ${borrowLimit} books (borrowed plus reserved).`;
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={book.title}
                onClick={(event) => event.stopPropagation()}
                className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                        Book details
                    </p>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-5">
                    <div className="flex gap-4">
                        <div className="h-36 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-md">
                            {book.coverUrl ? (
                                <img
                                    src={book.coverUrl}
                                    alt={book.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-300">
                                    <BookOpen size={30} />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-emerald-700">
                                {[book.institute || book.category, book.program]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </p>

                            <h3 className="mt-1 text-base font-semibold leading-5 text-slate-800">
                                {book.title}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                {book.author}
                            </p>

                            <dl className="mt-3 space-y-0.5 text-[11px] text-slate-500">
                                {book.isbn && (
                                    <div>
                                        <dt className="inline font-semibold">
                                            ISBN:{" "}
                                        </dt>
                                        <dd className="inline">{book.isbn}</dd>
                                    </div>
                                )}

                                {book.publisher && (
                                    <div>
                                        <dt className="inline font-semibold">
                                            Publisher:{" "}
                                        </dt>
                                        <dd className="inline">
                                            {book.publisher}
                                            {book.year ? ` (${book.year})` : ""}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4">
                        <div>
                            <p className="flex items-center gap-1 text-[11px] text-slate-400">
                                <MapPin size={12} />
                                Shelf location
                            </p>

                            <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                {book.shelfLocation || "Ask the librarian"}
                            </p>
                        </div>

                        <div>
                            <p className="text-[11px] text-slate-400">
                                Call number
                            </p>

                            <p className="mt-0.5 text-sm font-semibold text-[#106A2E]">
                                {book.ddc || book.callNo || "—"}
                            </p>
                        </div>

                        <div className="col-span-2 border-t border-slate-200 pt-3">
                            <p className="text-[11px] text-slate-400">
                                Copies available
                            </p>

                            <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                {available}
                                {book.totalCopies
                                    ? ` of ${book.totalCopies}`
                                    : ""}
                            </p>
                        </div>
                    </div>

                    {book.synopsis && (
                        <div className="mt-5">
                            <p className="text-xs font-semibold text-slate-800">
                                About this book
                            </p>

                            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                                {book.synopsis}
                            </p>
                        </div>
                    )}

                    {reservedQty > 0 && (
                        <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-[#106A2E]">
                            <CheckCircle2 size={15} />
                            You already reserved {reservedQty}{" "}
                            {reservedQty === 1 ? "copy" : "copies"} of this
                            book.
                        </p>
                    )}

                    <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                        <Clock3 size={15} className="mt-0.5 shrink-0" />
                        <span>
                            Reserved books are held for {HOLD_HOURS} hours.
                            Pick them up at the circulation desk and show your
                            Access Pass. The librarian will confirm the
                            claim.
                        </span>
                    </p>
                </div>

                <div className="border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {canReserve ? (
                        <div className="flex items-center gap-3">
                            <div
                                className="flex items-center rounded-xl border border-slate-200"
                                role="group"
                                aria-label="Number of copies"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setQuantity(Math.max(1, safeQty - 1))
                                    }
                                    disabled={safeQty <= 1}
                                    aria-label="Fewer copies"
                                    className="flex h-11 w-11 items-center justify-center text-slate-600 disabled:opacity-30"
                                >
                                    <Minus size={16} />
                                </button>

                                <span className="w-8 text-center text-sm font-semibold text-slate-800">
                                    {safeQty}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setQuantity(
                                            Math.min(maxQty, safeQty + 1)
                                        )
                                    }
                                    disabled={safeQty >= maxQty}
                                    aria-label="More copies"
                                    className="flex h-11 w-11 items-center justify-center text-slate-600 disabled:opacity-30"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => onReserve(book, safeQty)}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#106A2E] text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-[#0D5B28] active:scale-[0.98]"
                            >
                                <BookMarked size={17} />
                                Reserve {safeQty === 1 ? "copy" : `${safeQty} copies`}
                            </button>
                        </div>
                    ) : (
                        <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-xs font-medium text-slate-500">
                            {blockedReason}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// =========================================================
// RESERVATIONS SECTION
// =========================================================

function ReservationsSection({ reservations, onCancel, onRemove, onBrowse }) {
    return (
        <section id="reservations" className="mb-8 scroll-mt-24">
            <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                        My reservations
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                        Show your Access Pass at the circulation desk to claim.
                    </p>
                </div>
            </div>

            {reservations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                    <BookMarked
                        size={28}
                        className="mx-auto text-slate-300"
                    />

                    <p className="mt-2 text-sm font-semibold text-slate-600">
                        No reservations yet
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Open any book and tap Reserve to hold a copy.
                    </p>

                    <button
                        type="button"
                        onClick={onBrowse}
                        className="mt-3 text-xs font-semibold text-[#106A2E]"
                    >
                        Browse books
                    </button>
                </div>
            ) : (
                <ul className="space-y-3">
                    {reservations.map((reservation) => {
                        const expired = isHoldExpired(reservation);

                        return (
                            <li
                                key={reservation.id}
                                className={`flex gap-3 rounded-2xl border bg-white p-3 shadow-sm ${
                                    expired
                                        ? "border-slate-200 opacity-75"
                                        : "border-amber-200"
                                }`}
                            >
                                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                    {reservation.coverUrl ? (
                                        <img
                                            src={reservation.coverUrl}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-slate-300">
                                            <BookOpen size={20} />
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="line-clamp-2 text-sm font-semibold leading-4 text-slate-800">
                                            {reservation.bookTitle}
                                        </p>

                                        <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                expired
                                                    ? "bg-slate-100 text-slate-500"
                                                    : "bg-amber-50 text-amber-700"
                                            }`}
                                        >
                                            {expired
                                                ? "Expired"
                                                : "Awaiting pickup"}
                                        </span>
                                    </div>

                                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                                        {reservation.bookAuthor}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-600">
                                        <span className="font-semibold">
                                            {reservation.quantity}
                                        </span>{" "}
                                        {reservation.quantity === 1
                                            ? "copy"
                                            : "copies"}
                                        {" · "}
                                        {expired
                                            ? `Hold ended ${formatDateTime(reservation.pickupBy)}`
                                            : `Pick up by ${formatDateTime(reservation.pickupBy)}`}
                                    </p>

                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="font-mono text-[10px] text-slate-400">
                                            {reservation.id}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                expired
                                                    ? onRemove(reservation.id)
                                                    : onCancel(reservation.id)
                                            }
                                            className="text-[11px] font-semibold text-red-600 hover:underline"
                                        >
                                            {expired
                                                ? "Remove"
                                                : "Cancel reservation"}
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

// =========================================================
// PAGE
// =========================================================

export default function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [accessPass, setAccessPass] = useState(null);
    const [loans, setLoans] = useState(null);

    // Reservations: nasa browser lang muna (walang API pa).
    const [reservations, setReservations] = useState([]);

    const [search, setSearch] = useState("");
    const [selectedInstitute, setSelectedInstitute] = useState("ALL");
    const [availableOnly, setAvailableOnly] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // =====================================================
    // LOAD PROFILE, PASS, LOANS
    // =====================================================

    useEffect(() => {
        const email = localStorage.getItem("userEmail");

        if (!email) {
            navigate("/");
            return;
        }

        let cancelled = false;

        const safeJson = async (url) => {
            try {
                const response = await fetch(url, {
                    headers: authHeaders(),
                });

                if (!response.ok) return null;

                return await response.json();
            } catch {
                return null;
            }
        };

        const load = async () => {
            try {
                const profileResponse = await fetch(
                    ENDPOINTS.profile(email),
                    { headers: authHeaders() }
                );

                if (profileResponse.status === 401) {
                    toast.error("Session expired. Please log in again.");
                    navigate("/");
                    return;
                }

                if (!profileResponse.ok) {
                    throw new Error("Unable to load profile.");
                }

                const profile = await profileResponse.json();

                if (cancelled) return;

                setUser(profile);

                if (profile?.id) {
                    const [passData, loansData] = await Promise.all([
                        safeJson(ENDPOINTS.accessPass(profile.id)),
                        safeJson(ENDPOINTS.loans(profile.id)),
                    ]);

                    if (cancelled) return;

                    if (passData?.success) setAccessPass(passData.data);
                    if (loansData) setLoans(toArray(loansData));
                }
            } catch (error) {
                console.error(error);
                toast.error("Unable to load your library profile.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    // =====================================================
    // RESERVATION STORAGE (browser-only for now)
    // =====================================================

    const storageKey = user?.id ? `libhub:reservations:${user.id}` : null;

    useEffect(() => {
        if (!storageKey) return;

        try {
            const saved = JSON.parse(
                localStorage.getItem(storageKey) || "[]"
            );

            setReservations(Array.isArray(saved) ? saved : []);
        } catch {
            setReservations([]);
        }
    }, [storageKey]);

    const saveReservations = useCallback(
        (next) => {
            setReservations(next);

            if (!storageKey) return;

            try {
                localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
                // Hindi kritikal; mawawala lang sa refresh.
            }
        },
        [storageKey]
    );

    // =====================================================
    // USER DATA
    // =====================================================

    const userName =
        user?.fullName || localStorage.getItem("userName") || "Student";

    const firstName = userName.split(" ")[0] || "Student";

    const role = String(
        user?.role || localStorage.getItem("userRole") || "Student"
    );

    const institute = user?.institute || accessPass?.institute || "";
    const instituteCode = toInstituteCode(institute);
    const program = user?.course || accessPass?.program || "";

    // =====================================================
    // BORROWING + RESERVATION COUNTS
    // =====================================================

    const borrowLimit = role.toLowerCase() === "faculty" ? 5 : 3;

    const activeLoans = useMemo(
        () => (loans ? loans.filter(isLoanActive) : null),
        [loans]
    );

    const overdueLoans = useMemo(
        () => (activeLoans ? activeLoans.filter(isLoanOverdue) : []),
        [activeLoans]
    );

    // Expired holds ay hindi na binibilang at ibinabalik ang kopya.
    const liveReservations = useMemo(
        () => reservations.filter((r) => !isHoldExpired(r)),
        [reservations]
    );

    const reservedCopies = liveReservations.reduce(
        (sum, r) => sum + Number(r.quantity || 0),
        0
    );

    const reservedByBook = useMemo(() => {
        const map = {};

        liveReservations.forEach((r) => {
            map[r.bookId] = (map[r.bookId] || 0) + Number(r.quantity || 0);
        });

        return map;
    }, [liveReservations]);

    const loanCount = activeLoans ? activeLoans.length : 0;

    // Ilang kopya pa ang puwedeng i-reserve (limit - hiram - reserved)
    const slotsLeft = Math.max(0, borrowLimit - loanCount - reservedCopies);

    const isCleared = overdueLoans.length === 0;

    // =====================================================
    // BOOKS (kasama ang local availability)
    // =====================================================

    const books = useMemo(() => {
        const list = Array.isArray(curatedBooksList) ? curatedBooksList : [];

        return list.map((book) => ({
            ...book,
            availableCopies: Math.max(
                0,
                Number(book.availableCopies ?? 0) -
                    (reservedByBook[book.id] || 0)
            ),
        }));
    }, [reservedByBook]);

    const instituteFilters = useMemo(() => {
        const codes = new Set(
            books
                .map((book) => toInstituteCode(book.institute))
                .filter(Boolean)
        );

        return ["ALL", ...Array.from(codes).sort()];
    }, [books]);

    const filteredBooks = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return books.filter((book) => {
            if (
                selectedInstitute !== "ALL" &&
                toInstituteCode(book.institute) !== selectedInstitute
            ) {
                return false;
            }

            if (availableOnly && Number(book.availableCopies ?? 0) <= 0) {
                return false;
            }

            if (!keyword) return true;

            const text = [
                book.title,
                book.author,
                book.category,
                book.institute,
                book.program,
                book.isbn,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(keyword);
        });
    }, [books, search, selectedInstitute, availableOnly]);

    const recommendedBooks = useMemo(() => {
        if (!instituteCode) return [];

        return books
            .filter(
                (book) =>
                    toInstituteCode(book.institute) === instituteCode &&
                    Number(book.availableCopies ?? 0) > 0
            )
            .slice(0, 8);
    }, [books, instituteCode]);

    const isSearching =
        search.trim() !== "" ||
        selectedInstitute !== "ALL" ||
        availableOnly;

    const visibleBooks = isSearching
        ? filteredBooks
        : filteredBooks.slice(0, 8);

    // =====================================================
    // RESERVE ACTIONS
    //
    // Palitan ng API call ang loob ng reserveBook() at
    // cancelReservation() kapag handa na ang backend.
    // =====================================================

    const reserveBook = (book, quantity) => {
        const current = reservations.find(
            (r) => r.bookId === book.id && !isHoldExpired(r)
        );

        let next;

        if (current) {
            // May reservation na: dagdagan lang ang bilang ng kopya.
            next = reservations.map((r) =>
                r.id === current.id
                    ? { ...r, quantity: Number(r.quantity) + quantity }
                    : r
            );
        } else {
            const now = Date.now();

            next = [
                {
                    id: `RES-${now.toString(36).toUpperCase()}`,
                    bookId: book.id,
                    bookTitle: book.title,
                    bookAuthor: book.author,
                    coverUrl: book.coverUrl || "",
                    quantity,
                    reservedAt: new Date(now).toISOString(),
                    pickupBy: new Date(
                        now + HOLD_HOURS * 60 * 60 * 1000
                    ).toISOString(),
                    status: "Pending",
                },
                ...reservations,
            ];
        }

        saveReservations(next);
        setSelectedBook(null);

        toast.success(
            `Reserved ${quantity} ${quantity === 1 ? "copy" : "copies"} of "${book.title}".`
        );
    };

    const cancelReservation = (id) => {
        saveReservations(reservations.filter((r) => r.id !== id));
        toast.success("Reservation cancelled.");
    };

    const removeReservation = (id) => {
        saveReservations(reservations.filter((r) => r.id !== id));
    };

    // =====================================================
    // NAVIGATION
    // =====================================================

    const goToBooks = () => navigate("/library/books");
    const goToPass = () => navigate("/library/access-pass");
    const goToLoans = () => navigate("/library/loans");

    const scrollToReservations = () => {
        document
            .getElementById("reservations")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const scrollToCatalog = () => {
        document
            .getElementById("catalog")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    // Para sa sheet
    const selectedLive = selectedBook
        ? books.find((b) => b.id === selectedBook.id) || selectedBook
        : null;

    const sheetMaxQty = selectedLive
        ? Math.min(Number(selectedLive.availableCopies ?? 0), slotsLeft)
        : 0;

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="min-h-screen bg-[#F7F8F5] text-slate-800">
            <LibraryBottomNav />

            <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-24 lg:px-8">
                {/* GREETING */}

                <section className="mb-5">
                    <p className="text-xs font-medium text-slate-400">
                        {today}
                    </p>

                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
                        Welcome, {firstName}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {[institute, program].filter(Boolean).join(" · ") ||
                            "CDM Library"}
                    </p>
                </section>

                {/* OVERDUE ALERT */}

                {overdueLoans.length > 0 && (
                    <button
                        type="button"
                        onClick={goToLoans}
                        className="mb-5 flex w-full items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-left"
                    >
                        <AlertTriangle
                            size={20}
                            className="mt-0.5 shrink-0 text-red-600"
                        />

                        <div>
                            <p className="text-sm font-semibold text-red-700">
                                {overdueLoans.length} overdue{" "}
                                {overdueLoans.length === 1 ? "book" : "books"}
                            </p>

                            <p className="mt-0.5 text-xs text-red-600/80">
                                Return{" "}
                                {overdueLoans.length === 1 ? "it" : "them"} to
                                the library to clear your account.
                            </p>
                        </div>
                    </button>
                )}

                {/* ACCESS PASS */}

                <section className="relative mb-6 overflow-hidden rounded-[26px] bg-[#106A2E] p-5 shadow-xl shadow-emerald-900/10 sm:p-7">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-medium text-emerald-100/70">
                                Library Access Pass
                            </p>

                            {isLoading ? (
                                <Skeleton className="mt-2 h-6 w-48 bg-white/20" />
                            ) : (
                                <h2 className="mt-1 text-xl font-semibold text-white">
                                    {accessPass?.studentName || userName}
                                </h2>
                            )}

                            <p className="mt-1 font-mono text-xs text-emerald-100/70">
                                {accessPass?.studentNumber ||
                                    user?.idNumber ||
                                    "—"}
                            </p>

                            <span
                                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                                    isCleared
                                        ? "bg-white/15 text-emerald-100"
                                        : "bg-red-500/20 text-red-100"
                                }`}
                            >
                                {isCleared ? (
                                    <CheckCircle2 size={13} />
                                ) : (
                                    <ShieldAlert size={13} />
                                )}
                                {isCleared ? "Clear to borrow" : "Overdue hold"}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={goToPass}
                            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#106A2E] transition hover:bg-emerald-50 sm:self-auto"
                        >
                            <QrCode size={16} />
                            Show QR pass
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </section>

                {/* QUICK ACCESS */}

                <section className="mb-8">
                    <h2 className="mb-3 text-lg font-semibold text-slate-800">
                        Quick access
                    </h2>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            {
                                label: "Browse books",
                                hint: "Search and reserve",
                                icon: BookOpen,
                                onClick: scrollToCatalog,
                                tone: "bg-emerald-50 text-[#106A2E]",
                            },
                            {
                                label: "Access pass",
                                hint: "Show your QR code",
                                icon: QrCode,
                                onClick: goToPass,
                                tone: "bg-emerald-50 text-[#106A2E]",
                            },
                            {
                                label: "My loans",
                                hint: "Borrowed books",
                                icon: LibraryBig,
                                onClick: goToLoans,
                                tone: "bg-blue-50 text-blue-600",
                            },
                            {
                                label: "Reservations",
                                hint: "Books on hold",
                                icon: CalendarDays,
                                onClick: scrollToReservations,
                                tone: "bg-amber-50 text-amber-600",
                            },
                        ].map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={item.onClick}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                                >
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}
                                    >
                                        <Icon size={19} />
                                    </div>

                                    <p className="mt-3 text-sm font-semibold text-slate-800">
                                        {item.label}
                                    </p>

                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        {item.hint}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* RESERVATIONS */}

                <ReservationsSection
                    reservations={reservations}
                    onCancel={cancelReservation}
                    onRemove={removeReservation}
                    onBrowse={scrollToCatalog}
                />

                {/* RECOMMENDED */}

                {recommendedBooks.length > 0 && !isSearching && (
                    <section className="mb-8">
                        <div className="mb-3 flex items-end justify-between gap-3">
                            <h2 className="text-lg font-semibold text-slate-800">
                                Recommended for {instituteCode}
                                {program ? ` · ${program}` : ""}
                            </h2>

                            <button
                                type="button"
                                onClick={goToBooks}
                                className="flex items-center gap-1 text-xs font-semibold text-[#106A2E]"
                            >
                                See all
                                <ChevronRight size={15} />
                            </button>
                        </div>

                        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                            {recommendedBooks.map((book) => (
                                <div
                                    key={book.id}
                                    className="w-36 shrink-0 snap-start sm:w-40"
                                >
                                    <BookCard
                                        book={book}
                                        reservedQty={reservedByBook[book.id] || 0}
                                        onOpen={setSelectedBook}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* CATALOG */}

                <section id="catalog" className="scroll-mt-24">
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">
                                Explore the catalog
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-400">
                                {filteredBooks.length} of {books.length} titles
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={goToBooks}
                            className="flex items-center gap-1 text-xs font-semibold text-[#106A2E]"
                        >
                            Full catalog
                            <ChevronRight size={15} />
                        </button>
                    </div>

                    <div className="mb-3 flex items-center rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-[#106A2E]">
                        <Search
                            size={18}
                            className="ml-4 shrink-0 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search title, author, or ISBN"
                            className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-slate-400"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                                className="mr-3 text-lg leading-none text-slate-400 hover:text-slate-700"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {instituteFilters.map((code) => (
                            <button
                                key={code}
                                type="button"
                                onClick={() => setSelectedInstitute(code)}
                                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                                    selectedInstitute === code
                                        ? "bg-[#106A2E] text-white shadow-sm"
                                        : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-[#106A2E]"
                                }`}
                            >
                                {code === "ALL" ? "All" : code}
                            </button>
                        ))}

                        <span className="mx-1 h-5 w-px shrink-0 bg-slate-200" />

                        <button
                            type="button"
                            onClick={() => setAvailableOnly((v) => !v)}
                            aria-pressed={availableOnly}
                            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                                availableOnly
                                    ? "border border-[#106A2E] bg-emerald-50 text-[#106A2E]"
                                    : "border border-slate-200 bg-white text-slate-500"
                            }`}
                        >
                            Available only
                        </button>
                    </div>

                    {isLoading ? (
                        <BookGridSkeleton count={6} label="Loading books to reserve..." />
                    ) : visibleBooks.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                            {visibleBooks.map((book) => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    reservedQty={reservedByBook[book.id] || 0}
                                    onOpen={setSelectedBook}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                            <BookOpen
                                size={32}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 text-sm font-semibold text-slate-600">
                                No books match your search
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setSelectedInstitute("ALL");
                                    setAvailableOnly(false);
                                }}
                                className="mt-2 text-xs font-semibold text-[#106A2E]"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </section>

                {/* POLICY */}

                <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Clock3 size={18} />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                Borrowing rules
                            </p>

                            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-500">
                                <li>
                                    You can borrow and reserve up to{" "}
                                    {borrowLimit} books in total. The loan
                                    period is 7 days.
                                </li>
                                <li>
                                    Reserved books are held for {HOLD_HOURS}{" "}
                                    hours at the circulation desk.
                                </li>
                                <li>
                                    Overdue books trigger an SMS notice. There
                                    is no daily cash fine.
                                </li>
                                <li>
                                    For a lost or damaged book, bring an
                                    identical replacement copy (same ISBN and
                                    edition).
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>

            {/* BOOK SHEET */}

            {selectedLive && (
                <BookSheet
                    key={selectedLive.id}
                    book={selectedLive}
                    reservedQty={reservedByBook[selectedLive.id] || 0}
                    maxQty={sheetMaxQty}
                    limitReached={slotsLeft <= 0}
                    borrowLimit={borrowLimit}
                    onClose={() => setSelectedBook(null)}
                    onReserve={reserveBook}
                />
            )}
        </div>
    );
}