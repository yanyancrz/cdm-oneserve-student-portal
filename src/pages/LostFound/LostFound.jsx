import { useEffect, useState } from "react";
import ReportLostFoundModal from "../../components/LostFound/ReportLostFoundModal"; 
import ViewLostFoundModal from "../../components/LostFound/ViewLostFoundModal";
import ClaimModal from "../../components/LostFound/ClaimModal";
import MyClaims from "../../components/LostFound/MyClaims";
import {
    getAllReports,
    getUserReports,
    searchReports,
} from "../../services/lostFoundService";

const LostFound = () => {
    const [activeTab, setActiveTab] = useState("all");

    const [reports, setReports] = useState([]);
    const [myReports, setMyReports] = useState([]);

    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState("");
    const [reportType, setReportType] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const userId = localStorage.getItem("userId");

    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState("");

    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const [showClaimModal, setShowClaimModal] = useState(false);
    const [selectedClaimItem, setSelectedClaimItem] = useState(null);

    // ==========================================
    // LOAD ALL REPORTS
    // ==========================================

    const handleViewDetails = (item) => {
        setSelectedItem(item);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setSelectedItem(null);
        setShowDetailsModal(false);
    };

    const openReportModal = (type) => {
        setSelectedReportType(type);
        setShowReportModal(true);
    };

    const closeReportModal = () => {
        setShowReportModal(false);
        setSelectedReportType("");
    };

    const loadReports = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAllReports();

            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load reports error:", err);
            setError("Unable to load Lost & Found reports.");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LOAD MY REPORTS
    // ==========================================

    const loadMyReports = async () => {
        if (!userId) {
            setMyReports([]);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const data = await getUserReports(Number(userId));

            setMyReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load my reports error:", err);
            setError("Unable to load your reports.");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

   useEffect(() => {
        loadReports();
        loadMyReports();
    }, []);

    // ==========================================
    // SEARCH
    // ==========================================

    const handleSearch = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await searchReports({
                keyword,
                category,
                reportType,
            });

            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Search error:", err);
            setError("Unable to search Lost & Found reports.");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // CLEAR SEARCH
    // ==========================================

    const handleClearSearch = async () => {
        setKeyword("");
        setCategory("");
        setReportType("");

        await loadReports();
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) return "N/A";

        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // ==========================================
    // STATUS BADGE
    // ==========================================

    const getStatusClass = (status) => {
        const value = status?.toLowerCase();

        if (value === "matched") {
            return "bg-[#E3EEFB] text-[#1D4E89]";
        }

        if (value === "claimed") {
            return "bg-[#F1E7FA] text-[#5B2A86]";
        }

        if (value === "closed") {
            return "bg-gray-100 text-gray-500";
        }

        return "bg-[#FAEEDA] text-[#633806]";
    };

    // ==========================================
    // REPORT TYPE BADGE
    // ==========================================

    const getReportTypeClass = (type) => {
        const value = type?.toLowerCase();

        if (value === "lost") {
            return "bg-[#FAECE7] text-[#712B13]";
        }

        return "bg-[#E1F5EE] text-[#085041]";
    };

    // ==========================================
    // CURRENT DATA
    // ==========================================

    const currentData =
        activeTab === "all"
            ? reports
            : myReports;

    return (
        <div
            className="min-h-screen pb-32"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)"
            }}
        >
            <div className="max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto p-4 sm:p-6">

                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-[#1F1F1F] tracking-tight">
                        Lost &amp; Found
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Report, search, and track lost and found items on campus.
                    </p>
                </div>


                {/* ==========================================
                    ACTION BUTTONS
                ========================================== */}

                <div className="mb-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => openReportModal("Lost")}
                        className="rounded-xl bg-[#712B13] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99]"
                    >
                        + Report Lost Item
                    </button>

                    <button
                        type="button"
                        onClick={() => openReportModal("Found")}
                        className="rounded-xl bg-[#106A2E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99]"
                    >
                        + Report Found Item
                    </button>
                </div>


                {/* ==========================================
                    TABS
                ========================================== */}

                <div className="mb-6 flex flex-wrap gap-2 border-b border-black/5">

                    <button
                        type="button"
                        onClick={() => setActiveTab("all")}
                        className={`border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
                            activeTab === "all"
                                ? "border-[#106A2E] text-[#106A2E]"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        All Items
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("myReports")}
                        className={`border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
                            activeTab === "myReports"
                                ? "border-[#106A2E] text-[#106A2E]"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        My Reports
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("myClaims")}
                        className={`border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
                            activeTab === "myClaims"
                                ? "border-[#106A2E] text-[#106A2E]"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        My Claims
                    </button>

                </div>


                {/* ==========================================
                    SEARCH / FILTER
                ========================================== */}

                {activeTab === "all" && (
                    <div className="mb-6 rounded-[24px] bg-white/90 p-4 sm:p-5 shadow-sm">

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

                            {/* Keyword */}

                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSearch();
                                    }
                                }}
                                placeholder="Search item..."
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#106A2E] focus:ring-1 focus:ring-[#106A2E]"
                            />

                            {/* Category */}

                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#106A2E] focus:ring-1 focus:ring-[#106A2E]"
                            >
                                <option value="">
                                    All Categories
                                </option>

                                <option value="Personal Items">
                                    Personal Items
                                </option>

                                <option value="Electronics">
                                    Electronics
                                </option>

                                <option value="Documents">
                                    Documents
                                </option>

                                <option value="Accessories">
                                    Accessories
                                </option>

                                <option value="School Supplies">
                                    School Supplies
                                </option>

                                <option value="Others">
                                    Others
                                </option>
                            </select>

                            {/* Report Type */}

                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#106A2E] focus:ring-1 focus:ring-[#106A2E]"
                            >
                                <option value="">
                                    All Types
                                </option>

                                <option value="Lost">
                                    Lost Items
                                </option>

                                <option value="Found">
                                    Found Items
                                </option>
                            </select>

                            {/* Buttons */}

                            <div className="flex gap-2">

                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    className="flex-1 rounded-xl bg-[#106A2E] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-[0.99]"
                                >
                                    Search
                                </button>

                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                                >
                                    Clear
                                </button>

                            </div>

                        </div>

                    </div>
                )}


                {/* ==========================================
                    ERROR
                ========================================== */}

                {error && (
                    <div className="mb-5 rounded-xl border border-[#712B13]/15 bg-[#FAECE7] px-4 py-3 text-sm text-[#712B13]">
                        {error}
                    </div>
                )}


                {/* ==========================================
                    LOADING
                ========================================== */}

                {loading && (
                    <div className="py-10 text-center text-sm text-gray-500">
                        Loading...
                    </div>
                )}


                {/* ==========================================
                    EMPTY STATE
                ========================================== */}

                {!loading &&
                    activeTab !== "myClaims" &&
                    currentData.length === 0 && (
                        <div className="rounded-[24px] border-2 border-dashed border-gray-200 bg-white/60 px-6 py-12 text-center">

                            <div className="mb-3 text-4xl">
                                🔍
                            </div>

                            <h2 className="text-lg font-semibold text-[#1F1F1F]">
                                No records found
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                There are no Lost & Found records to display.
                            </p>

                        </div>
                )}


                {/* ==========================================
                    REPORTS
                ========================================== */}

                {!loading && activeTab !== "myClaims" && currentData.length > 0 && (

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                        {currentData.map((item) => (

                            <div
                                key={item.id}
                                className="overflow-hidden rounded-[24px] bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >

                                {/* Photo */}

                                {item.photo ? (
                                    <img
                                        src={item.photo}
                                        alt={item.itemName}
                                        className="h-48 w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-48 w-full items-center justify-center bg-[#F7FAF8] text-5xl">
                                        📦
                                    </div>
                                )}

                                <div className="p-5">

                                    {/* Badges */}

                                    <div className="mb-3 flex flex-wrap gap-2">

                                        <span
                                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${getReportTypeClass(
                                                item.reportType
                                            )}`}
                                        >
                                            {item.reportType}
                                        </span>

                                        <span
                                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${getStatusClass(
                                                item.status
                                            )}`}
                                        >
                                            {item.status}
                                        </span>

                                    </div>


                                    {/* Item Name */}

                                    <h2 className="text-base font-semibold text-[#1F1F1F] leading-snug">
                                        {item.itemName}
                                    </h2>


                                    {/* Category */}

                                    <p className="mt-1 text-sm font-medium text-[#106A2E]">
                                        {item.category}
                                    </p>


                                    {/* Description */}

                                    <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                                        {item.description || "No description provided."}
                                    </p>


                                    {/* Information */}

                                    <div className="mt-4 space-y-2 text-sm text-gray-500">

                                        <div className="flex gap-2">
                                            <span>📍</span>
                                            <span>{item.location}</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <span>📅</span>
                                            <span>
                                                {formatDate(item.dateLostFound)}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <span>👤</span>
                                            <span>
                                                {item.fullName || "Unknown user"}
                                            </span>
                                        </div>

                                    </div>


                                    {/* View Button */}

                                    <button
                                        type="button"
                                        onClick={() => handleViewDetails(item)}
                                        className="mt-5 w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200"
                                    >
                                        View Details
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

                {activeTab === "myClaims" && (
                    <MyClaims />
                )}

            </div>

            <ReportLostFoundModal
                isOpen={showReportModal}
                onClose={closeReportModal}
                reportType={selectedReportType}
                onSuccess={async () => {
                    await loadReports();
                    await loadMyReports();
                }}
            />

            <ViewLostFoundModal
                isOpen={showDetailsModal}
                onClose={closeDetailsModal}
                item={selectedItem}
                onClaim={(item) => {
                    setSelectedClaimItem(item);
                    setShowClaimModal(true);
                }}
            />

            {showClaimModal && selectedClaimItem && (
                <ClaimModal
                    item={selectedClaimItem}
                    onClose={() => {
                        setShowClaimModal(false);
                        setSelectedClaimItem(null);
                    }}
                    onSuccess={() => {
                        setShowClaimModal(false);
                        setSelectedClaimItem(null);
                        loadReports();
                    }}
                />
            )}

        </div>
    );
};

export default LostFound;