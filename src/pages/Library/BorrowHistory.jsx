import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../../components/Library/PageHeader";
import EmptyState from "../../components/Library/EmptyState";

import { getBorrowHistory } from "../../services/libraryService";
import { formatDate, getLoanStatus } from "../../utils/libraryHelpers";
import { API_URL } from "../../config/api";
import noCover from "../../assets/images/no-cover.png";

const FILTERS = ["All", "Ongoing", "Overdue", "Returned"];

const STATUS_STYLES = {
    Ongoing: { bg: "#E1F5EE", color: "#106A2E", dot: "#106A2E" },
    Overdue: { bg: "#FEE2E2", color: "#B91C1C", dot: "#DC2626" },
    Returned: { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" },
};


export default function BorrowHistory() {

    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState("All");

    const [borrowHistory, setBorrowHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const loadBorrowHistory = async () => {

            const userId = Number(localStorage.getItem("userId"));

            if (!userId) {

                setLoading(false);
                return;

            }

            try {

                const response = await getBorrowHistory(userId);

                console.log(response);

                setBorrowHistory(response.data ?? response);

            }
            catch (err) {

                console.error(err);

                setError("Failed to load borrow history.");

            }
            finally {

                setLoading(false);

            }

        };

        loadBorrowHistory();

    }, []);

    // Compute live status per entry (self-corrects Ongoing -> Overdue over time)
    // rather than trusting the static `status` field in the mock data.
   const historyWithLiveStatus = useMemo(
        () =>
            borrowHistory
                .map((entry) => ({
                    ...entry,
                    liveStatus: getLoanStatus(entry),
                }))
                .sort(
                    (a, b) =>
                        new Date(b.borrowDate) -
                        new Date(a.borrowDate)
                ),
        [borrowHistory]
    );

    const filteredHistory = useMemo(() => {
        if (activeFilter === "All") return historyWithLiveStatus;
        return historyWithLiveStatus.filter((entry) => entry.liveStatus === activeFilter);
        
    }, [historyWithLiveStatus, activeFilter]);

    if (loading) {

    return (

        <div className="min-h-screen flex items-center justify-center">

            <p className="text-gray-600">
                Loading borrow history...
            </p>

        </div>

    );

}

if (error) {

    return (

        <div className="min-h-screen flex items-center justify-center">

            <p className="text-red-600">
                {error}
            </p>

        </div>

    );

}

    return (

        <div
            className="min-h-screen pb-24"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
            }}
        >

            <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto p-4 sm:p-6">

                <PageHeader
                    title="Borrow History"
                    subtitle="A timeline of everything you've borrowed"
                />

                {/* FILTER CHIPS */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`
                                flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all
                                ${activeFilter === filter
                                    ? "bg-[#106A2E] text-white"
                                    : "bg-white/80 text-gray-600 hover:bg-white"
                                }
                            `}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {filteredHistory.length === 0 ? (
                    <EmptyState
                        title="No history here"
                        message={`You have no ${activeFilter === "All" ? "" : activeFilter.toLowerCase() + " "}borrow records yet.`}
                        actionLabel="Browse Books"
                        onAction={() => navigate("/library/books")}
                    />
                ) : (
                    <div className="relative pl-8">

                        {/* Vertical timeline line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-200" />

                        <div className="space-y-5">
                            {filteredHistory.map((entry) => {
                                const style = STATUS_STYLES[entry.liveStatus] ?? STATUS_STYLES.Returned;

                                return (
                                    <div key={entry.borrowId} className="relative">

                                        {/* Timeline dot */}
                                        <div
                                            className="absolute -left-8 top-5 w-[10px] h-[10px] rounded-full ring-4 ring-[#f4f7f2]"
                                            style={{ background: style.dot }}
                                        />

                                        <div className="bg-white/90 rounded-2xl shadow-sm p-4 flex gap-4">
                                            <img
                                                src={
                                                    entry.coverImage
                                                        ? `${API_URL}/${entry.coverImage}`
                                                        : noCover
                                                }
                                                onError={(e) => {
                                                    e.currentTarget.src = noCover;
                                                }}
                                                alt={`Cover of ${entry.bookTitle}`}
                                                className="w-16 h-20 rounded-lg object-cover flex-shrink-0"
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                                    <h3 className="text-sm font-semibold text-[#1F1F1F] leading-snug truncate">
                                                        {entry.bookTitle}
                                                    </h3>
                                                    <span
                                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                                        style={{ background: style.bg, color: style.color }}
                                                    >
                                                        {entry.liveStatus}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 mb-2">
                                                    <span>
                                                        Borrowed: <span className="font-semibold text-[#1F1F1F]">{formatDate(entry.borrowDate)}</span>
                                                    </span>
                                                    <span>
                                                        {entry.returnDate ? "Returned" : "Due"}:{" "}
                                                        <span className="font-semibold text-[#1F1F1F]">
                                                            {formatDate(entry.returnDate || entry.dueDate)}
                                                        </span>
                                                    </span>
                                                </div>

                                                {entry.fine > 0 && (
                                                    <span className="inline-block text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                                                        Fine: ₱{entry.fine.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link
                        to="/library"
                        className="text-sm font-semibold text-[#106A2E] hover:underline"
                    >
                        Back to Library
                    </Link>
                </div>

            </div>

        </div>

    );

}