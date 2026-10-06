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
    QrCode,
    Search,
    ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

import { API_URL } from "../../config/api";
import LibraryBottomNav from "../../components/BottomNavigation/LibraryBottomNav";
import BookDetailsModal from "../../components/Library/BookDetailsModal";
import useLibrary from "../../hooks/useLibrary";
import {
    cancelReservation,
    getMyReservations,
} from "../../services/libraryService";

// =========================================================
// ENDPOINTS
// =========================================================

const ENDPOINTS = {
    profile: (email) =>
        `${API_URL}/api/profile/${encodeURIComponent(email)}`,
    accessPass: (userId) =>
        `${API_URL}/api/library/access-pass/${userId}`,
    loans: (userId) =>
        `${API_URL}/api/library/borrow/current/${userId}`,
    expireReservations: `${API_URL}/api/library/reservations/expire`,

    // Library Settings numbers + the Terms & Guidelines written by the Library Head.
    // Response: { success, data: { settings: {...}, terms: [{ id, title, content }] } }
    policy: `${API_URL}/api/library/policy`,
};

// How many terms show before "Show all".
const TERMS_PREVIEW = 3;

// Mga status na binibilang ng backend bilang "active reservation"
const ACTIVE_RESERVATION_STATUSES = ["reserved", "pending", "approved"];

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

const getBookId = (book) => book.id ?? book.bookId ?? book.bookID;

const getCoverSrc = (value) => {
    if (!value) return "";

    const text = String(value);

    if (text.startsWith("http")) return text;

    return `${API_URL}/${text.replace(/^\/+/, "")}`;
};

const isLoanOverdue = (loan) => {
    if (normalizeStatus(loan.status) === "overdue") return true;

    const due = loan.dueDate ? new Date(loan.dueDate) : null;

    return Boolean(due && !Number.isNaN(due.getTime()) && due < new Date());
};

const isReservationExpired = (reservation) => {
    const end = new Date(reservation.expirationDate).getTime();

    return !Number.isNaN(end) && end < Date.now();
};

const formatDateTime = (iso) =>
    new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

const isBookAvailable = (book) =>
    Number(book.availableCopies ?? 0) > 0 &&
    normalizeStatus(book.status) !== "unavailable";

const getAvailability = (book) => {
    const available = Number(book.availableCopies ?? 0);
    const total = Number(book.totalCopies ?? 0);

    if (!isBookAvailable(book)) {
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

const formatPeso = (value) =>
    Number(value || 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
    });

const Skeleton = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded-xl bg-slate-200 ${className}`}
    />
);

// =========================================================
// BOOK CARD
// =========================================================

function BookCard({ book, isReserved, onOpen }) {
    const availability = getAvailability(book);
    const cover = getCoverSrc(book.coverUrl || book.coverImage);

    return (
        <button
            type="button"
            onClick={() => onOpen(book)}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-emerald-200 hover:shadow-lg"
        >
            <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                {cover ? (
                    <img
                        src={cover}
                        alt={book.title}
                        loading="lazy"
                        onError={(event) => {
                            event.currentTarget.style.display = "none";
                        }}
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

                {isReserved && (
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#106A2E] px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
                        <BookMarked size={11} />
                        Reserved
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

                <p className="mt-2 line-clamp-1 text-[10px] font-semibold text-emerald-700">
                    {book.category || book.institute || "Library"}
                </p>
            </div>
        </button>
    );
}

// =========================================================
// RESERVATIONS SECTION
// =========================================================

function ReservationsSection({
    reservations,
    loading,
    cancellingId,
    onCancel,
    onBrowse,
}) {
    return (
        <section id="reservations" className="mb-8 scroll-mt-24">
            <div className="mb-3">
                <h2 className="text-lg font-semibold text-slate-800">
                    My reservations
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                    Show your Access Pass at the circulation desk to claim.
                </p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                        >
                            <Skeleton className="h-20 w-14 shrink-0" />

                            <div className="flex-1">
                                <Skeleton className="h-3 w-2/3" />
                                <Skeleton className="mt-2 h-3 w-1/3" />
                                <Skeleton className="mt-4 h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : reservations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                    <BookMarked
                        size={28}
                        className="mx-auto text-slate-300"
                    />

                    <p className="mt-2 text-sm font-semibold text-slate-600">
                        No active reservations
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
                        const expired = isReservationExpired(reservation);
                        const cover = getCoverSrc(reservation.coverImage);

                        return (
                            <li
                                key={reservation.reservationId}
                                className={`flex gap-3 rounded-2xl border bg-white p-3 shadow-sm ${
                                    expired
                                        ? "border-slate-200 opacity-75"
                                        : "border-emerald-200"
                                }`}
                            >
                                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                    {cover ? (
                                        <img
                                            src={cover}
                                            alt=""
                                            onError={(event) => {
                                                event.currentTarget.style.display =
                                                    "none";
                                            }}
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
                                                    : "bg-emerald-50 text-emerald-700"
                                            }`}
                                        >
                                            {expired ? "Expired" : "Reserved"}
                                        </span>
                                    </div>

                                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                                        {reservation.author}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-600">
                                        {expired
                                            ? `Hold ended ${formatDateTime(reservation.expirationDate)}`
                                            : `Pick up by ${formatDateTime(reservation.expirationDate)}`}
                                    </p>

                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="font-mono text-[10px] text-slate-400">
                                            #{reservation.reservationId}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onCancel(
                                                    reservation.reservationId
                                                )
                                            }
                                            disabled={
                                                cancellingId ===
                                                reservation.reservationId
                                            }
                                            className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
                                        >
                                            {cancellingId ===
                                            reservation.reservationId
                                                ? "Cancelling..."
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

    // Books galing sa API (totoong BookId)
    const {
        books: libraryBooks,
        loading: booksLoading,
        error: booksError,
        refetch,
        refresh,
        reload,
    } = useLibrary();

    const [user, setUser] = useState(null);
    const [accessPass, setAccessPass] = useState(null);
    const [loans, setLoans] = useState(null);

    // Reservations galing sa database
    const [reservations, setReservations] = useState([]);
    const [reservationsLoading, setReservationsLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);

    const [search, setSearch] = useState("");
    const [selectedInstitute, setSelectedInstitute] = useState("ALL");
    const [availableOnly, setAvailableOnly] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    // Library Settings + Terms & Guidelines (set by the Library Head)
    const [policy, setPolicy] = useState(null);
    const [policyLoading, setPolicyLoading] = useState(true);
    const [showAllTerms, setShowAllTerms] = useState(false);

    // =====================================================
    // LOAD RESERVATIONS (API)
    //
    // Una, i-expire ang mga lampas na ang hold para hindi
    // sila mabilang ng backend bilang active reservation.
    // =====================================================

    const loadReservations = useCallback(async (userId) => {
        if (!userId) {
            setReservationsLoading(false);
            return;
        }

        try {
            try {
                await fetch(ENDPOINTS.expireReservations, {
                    method: "PUT",
                    headers: authHeaders(),
                });
            } catch (expireError) {
                console.warn("Expire reservations failed:", expireError);
            }

            const response = await getMyReservations(userId);

            setReservations(toArray(response));
        } catch (error) {
            console.error("Failed to load reservations:", error);
        } finally {
            setReservationsLoading(false);
        }
    }, []);

    // =====================================================
    // LOAD PROFILE, PASS, LOANS, RESERVATIONS
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
                        loadReservations(profile.id),
                    ]);

                    if (cancelled) return;

                    if (passData?.success) setAccessPass(passData.data);
                    if (loansData) setLoans(toArray(loansData));
                } else {
                    setReservationsLoading(false);
                }
            } catch (error) {
                console.error(error);
                toast.error("Unable to load your library profile.");
                setReservationsLoading(false);
            } finally {
                if (!cancelled) setProfileLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [navigate, loadReservations]);

    // =====================================================
    // LOAD TERMS & GUIDELINES + SETTINGS
    //
    // If this fails, the page falls back to the default rules
    // below, so it never breaks.
    // =====================================================

    useEffect(() => {
        let cancelled = false;

        const loadPolicy = async () => {
            try {
                const response = await fetch(ENDPOINTS.policy, {
                    headers: authHeaders(),
                });

                if (!response.ok) throw new Error("No policy.");

                const payload = await response.json();
                const data = payload?.data ?? payload;

                if (cancelled) return;

                setPolicy({
                    settings: data?.settings ?? null,
                    terms: toArray(data?.terms),
                });
            } catch {
                if (!cancelled) setPolicy(null);
            } finally {
                if (!cancelled) setPolicyLoading(false);
            }
        };

        loadPolicy();

        return () => {
            cancelled = true;
        };
    }, []);

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

    // The numbers follow the Library Settings. 3 / 5 / 7 / 3 are only used
    // until the settings arrive (or if they cannot be loaded).
    const settings = policy?.settings ?? null;
    const isFaculty = role.toLowerCase() === "faculty";

    const borrowLimit = isFaculty
        ? settings?.facultyBorrowLimit ?? 5
        : settings?.studentBorrowLimit ?? 3;

    const loanDays = settings?.defaultLoanDays ?? 7;
    const holdDays = settings?.reservationPickupDays ?? 3;
    const finePerDay = Number(settings?.overdueFinePerDay ?? 0) || 0;

    const terms = policy?.terms ?? [];
    const visibleTerms = showAllTerms ? terms : terms.slice(0, TERMS_PREVIEW);

    // Quick facts (only when the real settings were loaded).
    const ruleFacts = settings
        ? [
              { label: "Borrow limit", value: `${borrowLimit} books` },
              { label: "Loan period", value: `${loanDays} days` },
              { label: "Reservation hold", value: `${holdDays} days` },
              ...(finePerDay > 0
                  ? [{ label: "Overdue fine", value: `${formatPeso(finePerDay)} / day` }]
                  : []),
          ]
        : [];

    // Borrowed lang ang binibilang (hindi ForClaiming)
    const borrowedLoans = useMemo(
        () =>
            loans
                ? loans.filter(
                      (loan) => normalizeStatus(loan.status) === "borrowed"
                  )
                : [],
        [loans]
    );

    const overdueLoans = useMemo(
        () => borrowedLoans.filter(isLoanOverdue),
        [borrowedLoans]
    );

    // Active reservations: kapareho ng tinitingnan ng backend
    const activeReservations = useMemo(
        () =>
            reservations.filter((r) =>
                ACTIVE_RESERVATION_STATUSES.includes(
                    normalizeStatus(r.status)
                )
            ),
        [reservations]
    );

    const reservedBookIds = useMemo(
        () => new Set(activeReservations.map((r) => r.bookId)),
        [activeReservations]
    );

    const slotsLeft = Math.max(
        0,
        borrowLimit - borrowedLoans.length - activeReservations.length
    );

    const isCleared = overdueLoans.length === 0;

    // =====================================================
    // BOOKS
    // =====================================================

    const books = useMemo(
        () => (Array.isArray(libraryBooks) ? libraryBooks : []),
        [libraryBooks]
    );

    const instituteFilters = useMemo(() => {
        const codes = new Set(
            books
                .map((book) => toInstituteCode(book.institute || book.category))
                .filter(Boolean)
        );

        return ["ALL", ...Array.from(codes).sort()];
    }, [books]);

    const filteredBooks = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return books.filter((book) => {
            if (
                selectedInstitute !== "ALL" &&
                toInstituteCode(book.institute || book.category) !==
                    selectedInstitute
            ) {
                return false;
            }

            if (availableOnly && !isBookAvailable(book)) {
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
                    toInstituteCode(book.institute || book.category) ===
                        instituteCode && isBookAvailable(book)
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

    const catalogLoading = booksLoading || profileLoading;

    // =====================================================
    // RESERVATION ACTIONS
    // =====================================================

    const handleReserved = async () => {
        setSelectedBook(null);

        const refreshBooks = refetch || refresh || reload;

        if (typeof refreshBooks === "function") {
            try {
                await refreshBooks();
            } catch (error) {
                console.error("Book refresh failed:", error);
            }
        }

        await loadReservations(user?.id);
    };

    const handleCancel = async (reservationId) => {
        setCancellingId(reservationId);

        try {
            await cancelReservation(reservationId);

            toast.success("Reservation cancelled.");

            await loadReservations(user?.id);
        } catch (error) {
            console.error(error);
            toast.error(error?.message || "Unable to cancel reservation.");
        } finally {
            setCancellingId(null);
        }
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

    // May active reservation na ba ang user sa napiling libro?
    const modalAlreadyReserved = selectedBook
        ? reservedBookIds.has(getBookId(selectedBook))
        : false;

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

                            {profileLoading ? (
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

                {/* METRICS */}

                <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        {
                            label: "Borrowed",
                            value: loans === null ? "–" : borrowedLoans.length,
                            sub: `of ${borrowLimit} limit`,
                            icon: LibraryBig,
                            tone: "bg-blue-50 text-blue-600",
                            onClick: goToLoans,
                        },
                        {
                            label: "Reserved",
                            value: reservationsLoading ? "–" : activeReservations.length,
                            sub: "books on hold",
                            icon: BookMarked,
                            tone: "bg-amber-50 text-amber-600",
                            onClick: scrollToReservations,
                        },
                        {
                            label: "Overdue",
                            value: loans === null ? "–" : overdueLoans.length,
                            sub: overdueLoans.length > 0 ? "return now" : "all good",
                            icon: AlertTriangle,
                            tone:
                                overdueLoans.length > 0
                                    ? "bg-red-50 text-red-600"
                                    : "bg-emerald-50 text-[#106A2E]",
                            onClick: goToLoans,
                        },
                        {
                            label: "Slots left",
                            value: loans === null || reservationsLoading ? "–" : slotsLeft,
                            sub: "can still borrow/reserve",
                            icon: CheckCircle2,
                            tone: "bg-emerald-50 text-[#106A2E]",
                            onClick: goToBooks,
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
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tone}`}
                                >
                                    <Icon size={17} />
                                </div>

                                <p className="mt-3 text-2xl font-bold text-slate-800">
                                    {item.value}
                                </p>

                                <p className="text-xs font-semibold text-slate-600">
                                    {item.label}
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    {item.sub}
                                </p>
                            </button>
                        );
                    })}
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
                    reservations={activeReservations}
                    loading={reservationsLoading}
                    cancellingId={cancellingId}
                    onCancel={handleCancel}
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
                            {recommendedBooks.map((book, index) => (
                                <div
                                    key={getBookId(book) ?? index}
                                    className="w-36 shrink-0 snap-start sm:w-40"
                                >
                                    <BookCard
                                        book={book}
                                        isReserved={reservedBookIds.has(
                                            getBookId(book)
                                        )}
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

                    {catalogLoading ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                                >
                                    <Skeleton className="aspect-[3/4] rounded-none" />

                                    <div className="p-3">
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="mt-2 h-3 w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : booksError ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center">
                            <p className="text-sm font-semibold text-red-700">
                                Unable to load books
                            </p>

                            <p className="mt-1 text-xs text-red-600/80">
                                {String(booksError)}
                            </p>
                        </div>
                    ) : visibleBooks.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                            {visibleBooks.map((book, index) => (
                                <BookCard
                                    key={getBookId(book) ?? index}
                                    book={book}
                                    isReserved={reservedBookIds.has(
                                        getBookId(book)
                                    )}
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
                                {books.length === 0
                                    ? "No books in the library yet"
                                    : "No books match your search"}
                            </p>

                            {books.length > 0 && (
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
                            )}
                        </div>
                    )}
                </section>

                {/* TERMS & GUIDELINES */}

                <section
                    id="terms"
                    className="mt-8 rounded-2xl border border-slate-200 bg-white p-5"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Clock3 size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                                Terms &amp; guidelines
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                                Set by the Library Head. These apply every
                                time you borrow or reserve.
                            </p>

                            {/* QUICK FACTS */}

                            {ruleFacts.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {ruleFacts.map((fact) => (
                                        <div
                                            key={fact.label}
                                            className="rounded-xl bg-slate-50 px-3 py-2"
                                        >
                                            <p className="text-[10px] text-slate-400">
                                                {fact.label}
                                            </p>

                                            <p className="mt-0.5 text-xs font-semibold text-slate-700">
                                                {fact.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TERMS */}

                            {policyLoading ? (
                                <div className="mt-4 space-y-2.5">
                                    <Skeleton className="h-3 w-1/3" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-5/6" />
                                </div>
                            ) : terms.length > 0 ? (
                                <>
                                    <ul className="mt-4 space-y-3">
                                        {visibleTerms.map((term, index) => (
                                            <li
                                                key={term.id ?? index}
                                                className="text-xs leading-5 text-slate-500"
                                            >
                                                {term.title && (
                                                    <p className="text-[13px] font-semibold text-slate-700">
                                                        {term.title}
                                                    </p>
                                                )}

                                                {term.content && (
                                                    <p className="whitespace-pre-line">
                                                        {term.content}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>

                                    {terms.length > TERMS_PREVIEW && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowAllTerms((value) => !value)
                                            }
                                            aria-expanded={showAllTerms}
                                            className="mt-3 text-xs font-semibold text-[#106A2E]"
                                        >
                                            {showAllTerms
                                                ? "Show less"
                                                : `Show all ${terms.length} terms`}
                                        </button>
                                    )}
                                </>
                            ) : (
                                // Nothing from the Library Head yet: default rules.
                                <ul className="mt-3 space-y-1.5 text-xs leading-5 text-slate-500">
                                    <li>
                                        You can borrow and reserve up to{" "}
                                        {borrowLimit} books in total. The loan
                                        period is {loanDays} days.
                                    </li>
                                    <li>
                                        Reserved books are held for {holdDays}{" "}
                                        days at the circulation desk.
                                    </li>
                                    <li>
                                        {finePerDay > 0
                                            ? `Overdue books are charged ${formatPeso(finePerDay)} per day.`
                                            : "There is no daily cash fine."}
                                    </li>
                                    <li>
                                        For a lost or damaged book, bring an
                                        identical replacement copy (same ISBN
                                        and edition).
                                    </li>
                                </ul>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* BOOK DETAILS MODAL */}

            {selectedBook && (
                <BookDetailsModal
                    book={selectedBook}
                    userId={user?.id}
                    maxQuantity={slotsLeft}
                    alreadyReserved={modalAlreadyReserved}
                    onClose={() => setSelectedBook(null)}
                    onReserved={handleReserved}
                />
            )}
        </div>
    );
}