import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";

import LibraryBottomNav from "../../components/BottomNavigation/LibraryBottomNav";

import { getBorrowHistory } from "../../services/libraryService";
import { formatDate } from "../../utils/libraryHelpers";
import { API_URL } from "../../config/api";
import noCover from "../../assets/images/no-cover.png";

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
};

const Skeleton = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded-xl bg-slate-200 ${className}`}
    />
);

// ============================================================
// GET LIVE STATUS
// ============================================================

const getHistoryStatus = (entry) => {
    const status = String(entry.status ?? "")
        .trim()
        .toLowerCase();

    // Reservation waiting for physical claim
    if (
        status === "forclaiming" ||
        status === "for claiming"
    ) {
        return "Reservations";
    }

    // Already physically claimed
    if (status === "claimed") {
        return "Claimed";
    }

    // Already returned
    if (
        entry.returnDate ||
        status === "returned"
    ) {
        return "Returned";
    }

    // Borrowed but already past due date
    if (
        status === "borrowed" &&
        entry.dueDate &&
        new Date(entry.dueDate) < new Date()
    ) {
        return "Overdue";
    }

    // Currently borrowed
    if (status === "borrowed") {
        return "Ongoing";
    }

    return "Ongoing";
};

export default function BorrowHistory() {
    const navigate = useNavigate();

    const [activeFilter, setActiveFilter] =
        useState("All");

    const [borrowHistory, setBorrowHistory] =
        useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // LOAD BORROW HISTORY
    // =========================================================

    useEffect(() => {
        const loadBorrowHistory = async () => {
            const userId = Number(
                localStorage.getItem("userId")
            );

            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                const response =
                    await getBorrowHistory(userId);

                console.log(
                    "Borrow History Response:",
                    response
                );

                setBorrowHistory(
                    response?.data ?? response ?? []
                );
            } catch (err) {
                console.error(
                    "Failed to load borrow history:",
                    err
                );

                setError(
                    "Failed to load borrow history."
                );
            } finally {
                setLoading(false);
            }
        };

        loadBorrowHistory();
    }, []);

    // =========================================================
    // LIVE STATUS
    // =========================================================

    const historyWithLiveStatus = useMemo(() => {
        return borrowHistory
            .map((entry) => ({
                ...entry,
                liveStatus: getHistoryStatus(entry),
            }))
            .sort(
                (a, b) =>
                    new Date(b.borrowDate) -
                    new Date(a.borrowDate)
            );
    }, [borrowHistory]);

    // =========================================================
    // FILTER
    // =========================================================

    const filteredHistory = useMemo(() => {
        if (activeFilter === "All") {
            return historyWithLiveStatus;
        }

        return historyWithLiveStatus.filter(
            (entry) =>
                entry.liveStatus === activeFilter
        );
    }, [historyWithLiveStatus, activeFilter]);

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="min-h-screen bg-[#F7F8F5] text-slate-800">
            <LibraryBottomNav />

            <main className="mx-auto max-w-4xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-24 lg:px-8">

                {/* =================================================
                    HEADER
                ================================================= */}

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
                            : `${filteredHistory.length} of ${historyWithLiveStatus.length} records`}
                    </p>
                </section>

                {/* =================================================
                    FILTERS
                ================================================= */}

                <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() =>
                                setActiveFilter(filter)
                            }
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

                {/* =================================================
                    CONTENT
                ================================================= */}

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map(
                            (_, index) => (
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
                            )
                        )}
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
                ) : filteredHistory.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                        <BookOpen
                            size={32}
                            className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-semibold text-slate-600">
                            {activeFilter === "All"
                                ? "You don't have any borrow records yet"
                                : `You have no ${activeFilter.toLowerCase()} records yet`}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/library/books")
                            }
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#106A2E]"
                        >
                            Browse books
                            <ChevronRight size={15} />
                        </button>
                    </div>
                ) : (
                    /* =============================================
                       TIMELINE
                    ============================================= */

                    <div className="relative pl-8">
                        {/* Timeline line */}

                        <div className="absolute bottom-2 left-[11px] top-2 w-[2px] bg-slate-200" />

                        <div className="space-y-4">
                            {filteredHistory.map((entry) => {
                                const style =
                                    STATUS_STYLES[
                                        entry.liveStatus
                                    ] ??
                                    STATUS_STYLES.Ongoing;

                                return (
                                    <div
                                        key={entry.borrowId}
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
                                                src={
                                                    entry.coverImage
                                                        ? `${API_URL}/${entry.coverImage}`
                                                        : noCover
                                                }
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
                                                    {entry.borrowDate && (
                                                        <span>
                                                            Borrowed:{" "}
                                                            <span className="font-semibold text-slate-800">
                                                                {formatDate(
                                                                    entry.borrowDate
                                                                )}
                                                            </span>
                                                        </span>
                                                    )}

                                                    {(entry.returnDate ||
                                                        entry.dueDate) && (
                                                        <span>
                                                            {entry.returnDate
                                                                ? "Returned"
                                                                : "Due"}
                                                            :{" "}
                                                            <span className="font-semibold text-slate-800">
                                                                {formatDate(
                                                                    entry.returnDate ||
                                                                        entry.dueDate
                                                                )}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>

                                                {/* FINE */}

                                                {Number(
                                                    entry.fine ?? 0
                                                ) > 0 && (
                                                    <span className="mt-2 inline-block rounded-lg bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
                                                        Fine: ₱
                                                        {Number(
                                                            entry.fine
                                                        ).toFixed(2)}
                                                    </span>
                                                )}

                                                {/* CLAIM PASS */}

                                                {entry.liveStatus ===
                                                    "Reservations" && (
                                                    <div className="mt-3">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/library/borrow-pass/${entry.borrowId}`
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-xl bg-[#106A2E] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#0d5927] active:scale-[0.98]"
                                                        >
                                                            View Claim Pass
                                                            <ChevronRight
                                                                size={13}
                                                            />
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