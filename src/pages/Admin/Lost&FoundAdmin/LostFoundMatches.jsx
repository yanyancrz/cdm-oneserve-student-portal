import { useEffect, useState } from "react";
import { Search, Eye, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import {
    getAdminMatches,
    confirmAdminMatch,
    rejectAdminMatch,
} from "../../../services/lostFoundAdminService";

import AdminMatchDetailsModal from "../../../components/LostFound/Admin/AdminMatchDetailsModal";

function LostFoundMatches() {
    const [matches, setMatches] = useState([]);
    const [filteredMatches, setFilteredMatches] = useState([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [selectedMatch, setSelectedMatch] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        loadMatches();
    }, []);

    useEffect(() => {
        filterMatches();
    }, [matches, searchTerm, statusFilter]);

    // ==========================================
    // LOAD MATCHES
    // ==========================================

    const loadMatches = async () => {
        try {
            setLoading(true);

            const data = await getAdminMatches();

            setMatches(data || []);
        } catch (error) {
            console.error("Error loading matches:", error);

            toast.error(
                error?.message ||
                    "Failed to load Lost & Found matches."
            );
        } finally {
            setLoading(false);
        }
    };


    // ==========================================
    // FILTER MATCHES
    // ==========================================

    const filterMatches = () => {
        let result = [...matches];

        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();

            result = result.filter((match) => {
                const lostItem = match.lostItem || {};
                const foundItem = match.foundItem || {};

                const searchableValues = [
                    lostItem.itemName,
                    lostItem.category,
                    lostItem.description,
                    lostItem.location,
                    lostItem.fullName,
                    lostItem.idNumber,

                    foundItem.itemName,
                    foundItem.category,
                    foundItem.description,
                    foundItem.location,
                    foundItem.fullName,
                    foundItem.idNumber,

                    match.status,
                    match.matchScore,
                ];

                return searchableValues
                    .filter(Boolean)
                    .some((value) =>
                        String(value)
                            .toLowerCase()
                            .includes(search)
                    );
            });
        }

        if (statusFilter !== "All") {
            result = result.filter(
                (match) =>
                    String(match.status || "").toLowerCase() ===
                    statusFilter.toLowerCase()
            );
        }

        setFilteredMatches(result);
    };


    // ==========================================
    // CONFIRM MATCH
    // ==========================================

    const handleConfirm = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to confirm this match?"
        );

        if (!confirmed) return;

        try {
            await confirmAdminMatch(id);

            toast.success(
                "Match confirmed successfully."
            );

            await loadMatches();
        } catch (error) {
            console.error(
                "Error confirming match:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to confirm match."
            );
        }
    };


    // ==========================================
    // REJECT MATCH
    // ==========================================

    const handleReject = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to reject this match?"
        );

        if (!confirmed) return;

        try {
            await rejectAdminMatch(id);

            toast.success(
                "Match rejected successfully."
            );

            await loadMatches();
        } catch (error) {
            console.error(
                "Error rejecting match:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to reject match."
            );
        }
    };


    // ==========================================
    // VIEW DETAILS
    // ==========================================

    const openDetails = (match) => {
        setSelectedMatch(match);
        setShowDetailsModal(true);
    };


    const closeDetails = () => {
        setSelectedMatch(null);
        setShowDetailsModal(false);
    };


    // ==========================================
    // STATUS STYLE
    // ==========================================

    const getStatusClass = (status) => {
        switch (String(status || "").toLowerCase()) {
            case "confirmed":
                return "bg-green-100 text-green-700";

            case "rejected":
                return "bg-red-100 text-red-700";

            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };


    // ==========================================
    // FORMAT MATCH SCORE
    // ==========================================

    const formatScore = (score) => {
        if (
            score === null ||
            score === undefined
        ) {
            return "—";
        }

        return `${Number(score).toFixed(0)}%`;
    };


    return (
        <div className="p-6">

            {/* ==========================================
                HEADER
            ========================================== */}

            <div className="mb-6">

                <h1 className="text-2xl font-bold text-gray-800">
                    Lost & Found Matches
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Review and manage possible matches between
                    lost and found items.
                </p>

            </div>


            {/* ==========================================
                FILTERS
            ========================================== */}

            <div className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center">

                {/* SEARCH */}

                <div className="relative flex-1">

                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        placeholder="Search matches..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />

                </div>


                {/* STATUS */}

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }
                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-green-500"
                >

                    <option value="All">
                        All Status
                    </option>

                    <option value="Pending">
                        Pending
                    </option>

                    <option value="Confirmed">
                        Confirmed
                    </option>

                    <option value="Rejected">
                        Rejected
                    </option>

                </select>

            </div>


            {/* ==========================================
                MATCHES TABLE
            ========================================== */}

            <div className="overflow-hidden rounded-xl bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1000px] text-left">

                        <thead className="border-b bg-gray-50">

                            <tr>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Lost Item
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Found Item
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Category
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Match Score
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody className="divide-y divide-gray-100">

                            {/* LOADING */}

                            {loading ? (

                                [...Array(5)].map((_, index) => (

                                    <tr key={index}>

                                        {[...Array(6)].map(
                                            (__, cellIndex) => (

                                                <td
                                                    key={cellIndex}
                                                    className="px-5 py-5"
                                                >

                                                    <div className="h-4 w-full max-w-[150px] animate-pulse rounded bg-gray-200" />

                                                </td>

                                            )
                                        )}

                                    </tr>

                                ))

                            ) : filteredMatches.length === 0 ? (

                                /* EMPTY */

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="px-5 py-12 text-center text-sm text-gray-500"
                                    >
                                        No matches found.
                                    </td>

                                </tr>

                            ) : (

                                /* DATA */

                                filteredMatches.map((match) => {

                                    const lostItem =
                                        match.lostItem || {};

                                    const foundItem =
                                        match.foundItem || {};

                                    return (

                                        <tr
                                            key={match.id}
                                            className="transition hover:bg-gray-50"
                                        >

                                            {/* LOST ITEM */}

                                            <td className="px-5 py-4">

                                                <div className="font-medium text-gray-800">
                                                    {lostItem.itemName ||
                                                        "—"}
                                                </div>

                                                <div className="text-xs text-gray-500">
                                                    {lostItem.fullName ||
                                                        "Unknown"}
                                                </div>

                                            </td>


                                            {/* FOUND ITEM */}

                                            <td className="px-5 py-4">

                                                <div className="font-medium text-gray-800">
                                                    {foundItem.itemName ||
                                                        "—"}
                                                </div>

                                                <div className="text-xs text-gray-500">
                                                    {foundItem.fullName ||
                                                        "Unknown"}
                                                </div>

                                            </td>


                                            {/* CATEGORY */}

                                            <td className="px-5 py-4 text-sm text-gray-600">

                                                {lostItem.category ||
                                                    foundItem.category ||
                                                    "—"}

                                            </td>


                                            {/* SCORE */}

                                            <td className="px-5 py-4">

                                                <span className="font-semibold text-gray-800">

                                                    {formatScore(
                                                        match.matchScore
                                                    )}

                                                </span>

                                            </td>


                                            {/* STATUS */}

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                        match.status
                                                    )}`}
                                                >

                                                    {match.status ||
                                                        "Pending"}

                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td className="px-5 py-4">

                                                <div className="flex items-center justify-center gap-2">

                                                    {/* VIEW */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDetails(
                                                                match
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                                                        title="View Details"
                                                    >

                                                        <Eye size={18} />

                                                    </button>


                                                    {/* CONFIRM / REJECT */}

                                                    {String(
                                                        match.status || ""
                                                    ).toLowerCase() ===
                                                        "pending" && (

                                                        <>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleConfirm(
                                                                        match.id
                                                                    )
                                                                }
                                                                className="rounded-lg p-2 text-green-600 transition hover:bg-green-50"
                                                                title="Confirm Match"
                                                            >

                                                                <CheckCircle
                                                                    size={18}
                                                                />

                                                            </button>


                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleReject(
                                                                        match.id
                                                                    )
                                                                }
                                                                className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                                                title="Reject Match"
                                                            >

                                                                <XCircle
                                                                    size={18}
                                                                />

                                                            </button>

                                                        </>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    );

                                })

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* ==========================================
                MATCH DETAILS MODAL
            ========================================== */}

            {showDetailsModal &&
                selectedMatch && (

                    <AdminMatchDetailsModal
                        match={selectedMatch}
                        onClose={closeDetails}
                    />

                )}

        </div>
    );
}

export default LostFoundMatches;