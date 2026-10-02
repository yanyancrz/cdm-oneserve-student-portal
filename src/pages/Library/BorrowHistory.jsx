import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, QrCode } from "lucide-react";
import toast from "react-hot-toast";

import LibraryBottomNav from "../../components/BottomNavigation/LibraryBottomNav";

import {
    getBorrowHistory,
    getMyReservations,
    cancelReservation,
} from "../../services/libraryService";
import { formatDate } from "../../utils/libraryHelpers";
import { API_URL } from "../../config/api";
import noCover from "../../assets/images/no-cover.png";

// =========================================================
// FILTERS
//
// Reservations = kasalukuyang naka-reserve (reservations table)
// Claimed      = na-claim na ang pisikal na libro (reservations table)
// Ongoing      = borrowed at may due date (borrowtransactions)
// Overdue      = borrowed pero lampas na ang due date
// Returned     = naibalik na
// =========================================================

const FILTERS = [
    "All",
    "Reservations",
    "Claimed",
    "Ongoing",
    "Returned",
    "Overdue",
];

const STATUS_STYLES = {
    Reservations: {
        badge: "bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
    },
    Claimed: {
        badge: "bg-sky-50 text-sky-700",
        dot: "bg-sky-500",
    },
    Ongoing: {
        badge: "bg-emerald-50 text-emerald-700",
        dot: "bg-[#106A2E]",
    },
    Overdue: {
        badge: "bg-red-50 text-red-600",
        dot: "bg-red-500",
    },
    Returned: {
        badge: "bg-slate-100 text-slate-500",
        dot: "bg-slate-400",
    },
    Expired: {
        badge: "bg-slate-100 text-slate-500",
        dot: "bg-slate-300",
    },
    Cancelled: {
        badge: "bg-slate-100 text-slate-500",
        dot: "bg-slate-300",
    },
};

const Skeleton = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded-xl bg-slate-200 ${className}`}
    />
);

// =========================================================
// HELPERS
// =========================================================

const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
};

const norm = (value) => String(value ?? "").trim().toLowerCase();

const getCoverSrc = (value) => {
    if (!value) return noCover;

    const text = String(value);

    if (text.startsWith("http")) return text;

    return `${API_URL}/${text.replace(/^\/+/, "")}`;
};

// =========================================================
// LIVE STATUS
// =========================================================

const getReservationStatus = (r) => {
    const status = norm(r.status);

    if (status === "claimed") return "Claimed";
    if (status === "cancelled") return "Cancelled";
    if (status === "expired") return "Expired";

    // Reserved / Pending / Approved
    if (
        r.expirationDate &&
        new Date(r.expirationDate) < new Date()
    ) {
        return "Expired";
    }

    return "Reservations";
};

const getBorrowStatus = (b) => {
    const status = norm(b.status);

    if (b.returnDate || status === "returned") return "Returned";

    // Lumang rows na "ForClaiming"
    if (status === "forclaiming" || status === "for claiming") {
        return "Reservations";
    }

    if (
        (status === "borrowed" || status === "overdue") &&
        b.dueDate &&
        new Date(b.dueDate) < new Date()
    ) {
        return "Overdue";
    }

    return "Ongoing";
};

export default function BorrowHistory() {
    const navigate = useNavigate();

    const [activeFilter, setActiveFilter] = useState("All");

    const [borrows, setBorrows] = useState([]);
    const [reservations, setReservations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState(null);

    // =========================================================
    // LOAD (borrow history + reservations)
    // =========================================================

    const loadHistory = useCallback(async () => {
        const userId = Number(localStorage.getItem("userId"));

        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const [borrowResult, reservationResult] =
                await Promise.allSettled([
                    getBorrowHistory(userId),
                    getMyReservations(userId),
                ]);

            if (
                borrowResult.status === "rejected" &&
                reservationResult.status === "rejected"
            ) {
                throw borrowResult.reason;
            }

            setBorrows(
                borrowResult.status === "fulfilled"
                    ? toArray(borrowResult.value)
                    : []
            );

            setReservations(
                reservationResult.status === "fulfilled"
                    ? toArray(reservationResult.value)
                    : []
            );

            setError("");
        } catch (err) {
            console.error("Failed to load borrow history:", err);
            setError("Failed to load borrow history.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // =========================================================
    // MERGE INTO ONE TIMELINE
    // =========================================================

    const entries = useMemo(() => {
        const borrowEntries = borrows.map((b) => ({
            key: `borrow-${b.borrowId}`,
            kind: "borrow",
            raw: b,
            bookId: b.bookId,
            bookTitle: b.bookTitle,
            author: b.author,
            coverImage: b.coverImage,
            sortDate: b.borrowDate,
            liveStatus: getBorrowStatus(b),
            hiddenInAll: false,
        }));

        const reservationEntries = reservations.map((r) => {
            const liveStatus = getReservationStatus(r);

            // Kapag Claimed na at may kaukulang BorrowTransaction,
            // ang borrow record na ang ipapakita sa "All"
            // para hindi doble ang libro.
            const hasMatchingBorrow =
                liveStatus === "Claimed" &&
                borrows.some(
                    (b) =>
                        b.bookId === r.bookId &&
                        new Date(b.borrowDate) >=
                            new Date(r.reservationAt).getTime() - 60000
                );

            return {
                key: `reservation-${r.reservationId}`,
                kind: "reservation",
                raw: r,
                bookId: r.bookId,
                bookTitle: r.bookTitle,
                author: r.author,
                coverImage: r.coverImage,
                sortDate: r.reservationAt,
                liveStatus,
                hiddenInAll: hasMatchingBorrow,
            };
        });

        return [...borrowEntries, ...reservationEntries].sort(
            (a, b) => new Date(b.sortDate) - new Date(a.sortDate)
        );
    }, [borrows, reservations]);

    // =========================================================
    // FILTER
    // =========================================================

    const filtered = useMemo(() => {
        if (activeFilter === "All") {
            return entries.filter((e) => !e.hiddenInAll);
        }

        return entries.filter((e) => e.liveStatus === activeFilter);
    }, [entries, activeFilter]);

    const totalVisible = useMemo(
        () => entries.filter((e) => !e.hiddenInAll).length,
        [entries]
    );

    // =========================================================
    // CANCEL RESERVATION
    // =========================================================

    const handleCancel = async (reservationId) => {
        setCancellingId(reservationId);

        try {
            await cancelReservation(reservationId);
            toast.success("Reservation cancelled.");
            await loadHistory();
        } catch (err) {
            console.error(err);
            toast.error(err?.message || "Unable to cancel reservation.");
        } finally {
            setCancellingId(null);
        }
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="min-h-screen bg-[#F7F8F5] text-slate-800">
            <LibraryBottomNav />

            <main className="mx-auto max-w-4xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-24 lg:px-8">

                {/* HEADER */}

                <section className="mb-5">
                    <p className="text-xs font-medium text-slate-400">
                        CDM Library
                    </p>

                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
                        Borrow History
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {loading
                            ? "Loading your records..."
                            : `${filtered.length} of ${totalVisible} records`}
                    </p>
                </section>

                {/* FILTERS */}

                <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => setActiveFilter(filter)}
                            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                                activeFilter === filter
                                    ? "bg-[#106A2E] text-white shadow-sm"
                                    : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-[#106A2E]"
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* CONTENT */}

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                            >
                                <Skeleton className="h-20 w-16 shrink-0" />

                                <div className="flex-1">
                                    <Skeleton className="h-3 w-2/3" />
                                    <Skeleton className="mt-2 h-3 w-1/3" />
                                    <Skeleton className="mt-4 h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center">
                        <p className="text-sm font-semibold text-red-700">
                            Unable to load history
                        </p>

                        <p className="mt-1 text-xs text-red-600/80">
                            {error}
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                        <BookOpen
                            size={32}
                            className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-semibold text-slate-600">
                            {activeFilter === "All"
                                ? "You don't have any records yet"
                                : `You have no ${activeFilter.toLowerCase()} records yet`}
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate("/library/books")}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#106A2E]"
                        >
                            Browse books
                            <ChevronRight size={15} />
                        </button>
                    </div>
                ) : (
                    <div className="relative pl-8">
                        {/* Timeline line */}

                        <div className="absolute bottom-2 left-[11px] top-2 w-[2px] bg-slate-200" />

                        <div className="space-y-4">
                            {filtered.map((entry) => {
                                const style =
                                    STATUS_STYLES[entry.liveStatus] ??
                                    STATUS_STYLES.Ongoing;

                                const raw = entry.raw;
                                const isReservation =
                                    entry.kind === "reservation";

                                return (
                                    <div
                                        key={entry.key}
                                        className="relative"
                                    >
                                        {/* Timeline dot */}

                                        <div
                                            className={`absolute -left-8 top-6 h-[10px] w-[10px] rounded-full ring-4 ring-[#F7F8F5] ${style.dot}`}
                                        />

                                        {/* Card */}

                                        <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
                                            {/* COVER */}

                                            <img
                                                src={getCoverSrc(
                                                    entry.coverImage
                                                )}
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        noCover;
                                                }}
                                                alt={`Cover of ${entry.bookTitle}`}
                                                className="h-20 w-16 shrink-0 rounded-lg bg-slate-100 object-cover"
                                            />

                                            {/* INFO */}

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="min-w-0 truncate text-sm font-semibold leading-snug text-slate-800">
                                                        {entry.bookTitle}
                                                    </h3>

                                                    <span
                                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}
                                                    >
                                                        {entry.liveStatus}
                                                    </span>
                                                </div>

                                                {entry.author && (
                                                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                                        {entry.author}
                                                    </p>
                                                )}

                                                {/* DATES */}

                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                                    {isReservation ? (
                                                        <>
                                                            <span>
                                                                Reserved:{" "}
                                                                <span className="font-semibold text-slate-800">
                                                                    {formatDate(
                                                                        raw.reservationAt
                                                                    )}
                                                                </span>
                                                            </span>

                                                            {entry.liveStatus ===
                                                                "Reservations" && (
                                                                <span>
                                                                    Pick up by:{" "}
                                                                    <span className="font-semibold text-slate-800">
                                                                        {formatDate(
                                                                            raw.expirationDate
                                                                        )}
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {raw.borrowDate && (
                                                                <span>
                                                                    Borrowed:{" "}
                                                                    <span className="font-semibold text-slate-800">
                                                                        {formatDate(
                                                                            raw.borrowDate
                                                                        )}
                                                                    </span>
                                                                </span>
                                                            )}

                                                            {(raw.returnDate ||
                                                                raw.dueDate) && (
                                                                <span>
                                                                    {raw.returnDate
                                                                        ? "Returned"
                                                                        : "Due"}
                                                                    :{" "}
                                                                    <span className="font-semibold text-slate-800">
                                                                        {formatDate(
                                                                            raw.returnDate ||
                                                                                raw.dueDate
                                                                        )}
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* FINE */}

                                                {!isReservation &&
                                                    Number(raw.fine ?? 0) >
                                                        0 && (
                                                        <span className="mt-2 inline-block rounded-lg bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
                                                            Fine: ₱
                                                            {Number(
                                                                raw.fine
                                                            ).toFixed(2)}
                                                        </span>
                                                    )}

                                                {/* RESERVATION ACTIONS */}

                                                {entry.liveStatus ===
                                                    "Reservations" && (
                                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    "/library/access-pass"
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#106A2E] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#0d5927] active:scale-[0.98]"
                                                        >
                                                            <QrCode size={13} />
                                                            Show Access Pass
                                                        </button>

                                                        {isReservation && (
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    cancellingId ===
                                                                    raw.reservationId
                                                                }
                                                                onClick={() =>
                                                                    handleCancel(
                                                                        raw.reservationId
                                                                    )
                                                                }
                                                                className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
                                                            >
                                                                {cancellingId ===
                                                                raw.reservationId
                                                                    ? "Cancelling..."
                                                                    : "Cancel"}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* RETURN REMINDER */}

                                                {(entry.liveStatus ===
                                                    "Ongoing" ||
                                                    entry.liveStatus ===
                                                        "Overdue") && (
                                                    <div className="mt-3 flex items-center justify-between gap-2">
                                                        <p
                                                            className={`text-[11px] ${
                                                                entry.liveStatus ===
                                                                "Overdue"
                                                                    ? "font-semibold text-red-600"
                                                                    : "text-slate-400"
                                                            }`}
                                                        >
                                                            {entry.liveStatus ===
                                                            "Overdue"
                                                                ? "Overdue. Return it to the library now."
                                                                : "Show your Access Pass to staff when returning."}
                                                        </p>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    "/library/access-pass"
                                                                )
                                                            }
                                                            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-semibold text-[#106A2E] transition hover:bg-emerald-50"
                                                        >
                                                            <QrCode size={13} />
                                                            QR
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}