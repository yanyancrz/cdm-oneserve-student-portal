import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ViewClaimDetailsModal from "./ViewClaimDetailsModal";
import { getUserClaims } from "../../services/lostFoundService";


function MyClaims() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState(null);

    const userId = localStorage.getItem("userId");

    const fetchMyClaims = async () => {
        if (!userId) {
            setLoading(false);
            toast.error("User information not found. Please login again.");
            return;
        }

        try {
            setLoading(true);

            const data = await getUserClaims(userId);

            setClaims(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("My Claims Error:", error);

            toast.error(
                error.message || "Failed to load your claims."
            );

            setClaims([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyClaims();
    }, []);

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "approved":
                return "bg-green-100 text-green-700";

            case "rejected":
                return "bg-red-100 text-red-700";

            case "pending":
            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };

    const formatDate = (date) => {
        if (!date) {
            return "N/A";
        }

        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) {
            return "N/A";
        }

        return parsedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>

                    <p className="mt-3 text-sm text-gray-500">
                        Loading your claims...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">

            {/* ==========================================
                HEADER
            ========================================== */}

            <div>
                <h2 className="text-lg font-bold text-gray-800">
                    My Claims
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Track the status of items you have claimed.
                </p>
            </div>


            {/* ==========================================
                EMPTY STATE
            ========================================== */}

            {claims.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">

                    <div className="text-5xl">
                        📋
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-gray-800">
                        No Claims Yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                        You have not submitted any item claims yet.
                        When you claim a found item, it will appear here.
                    </p>

                </div>
            )}


            {/* ==========================================
                CLAIM LIST
            ========================================== */}

            {claims.length > 0 && (
                <div className="space-y-4">

                    {claims.map((claim) => (
                        <div
                            key={claim.id}
                            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                        >

                            {/* TOP */}

                            <div className="flex flex-wrap items-center justify-between gap-3">

                                <div className="flex items-center gap-3">

                                    <h3 className="text-lg font-bold text-gray-800">
                                        Claim #{claim.id}
                                    </h3>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                            claim.status
                                        )}`}
                                    >
                                        {claim.status || "Pending"}
                                    </span>

                                </div>

                            </div>


                            {/* ITEM INFORMATION */}

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Item
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-700">
                                        {claim.itemName ||
                                            `Item #${claim.itemId}`}
                                    </p>
                                </div>


                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Category
                                    </p>

                                    <p className="mt-1 text-sm text-gray-700">
                                        {claim.category || "N/A"}
                                    </p>
                                </div>


                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Location
                                    </p>

                                    <p className="mt-1 text-sm text-gray-700">
                                        {claim.location
                                            ? `📍 ${claim.location}`
                                            : "N/A"}
                                    </p>
                                </div>


                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Submitted
                                    </p>

                                    <p className="mt-1 text-sm text-gray-700">
                                        {formatDate(
                                            claim.createdAt
                                        )}
                                    </p>
                                </div>

                            </div>


                            {/* CLAIM DESCRIPTION */}

                            <div className="mt-4 rounded-xl bg-gray-50 p-4">

                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Your Claim
                                </p>

                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                    {claim.claimDescription ||
                                        "No claim description provided."}
                                </p>

                            </div>


                            {/* STATUS MESSAGE */}

                            {claim.status?.toLowerCase() ===
                                "pending" && (
                                <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">

                                    <p className="text-sm font-semibold text-yellow-800">
                                        Claim Under Review
                                    </p>

                                    <p className="mt-1 text-sm leading-5 text-yellow-700">
                                        Your claim is currently being
                                        reviewed by the administrator.
                                        Please wait for the verification
                                        result.
                                    </p>

                                </div>
                            )}


                            {claim.status?.toLowerCase() ===
                                "approved" && (
                                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">

                                    <p className="text-sm font-semibold text-green-800">
                                        Claim Approved
                                    </p>

                                    <p className="mt-1 text-sm leading-5 text-green-700">
                                        Your claim has been approved.
                                        Please follow the administrator's
                                        instructions for claiming the item.
                                    </p>

                                </div>
                            )}


                            {claim.status?.toLowerCase() ===
                                "rejected" && (
                                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                                    <p className="text-sm font-semibold text-red-800">
                                        Claim Rejected
                                    </p>

                                    <p className="mt-1 text-sm leading-5 text-red-700">
                                        Your claim was not approved by the
                                        administrator.
                                    </p>

                                </div>
                            )}


                            {/* BUTTON */}

                            <div className="mt-4 flex justify-end">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedClaim(claim)
                                    }
                                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    View Claim Details
                                </button>

                            </div>

                        </div>
                    ))}

                </div>
            )}


           {/* ==========================================
                    CLAIM DETAILS MODAL
                ========================================== */}

                <ViewClaimDetailsModal
                    isOpen={!!selectedClaim}
                    onClose={() => setSelectedClaim(null)}
                    claim={selectedClaim}
                />

        </div>
    );
}

export default MyClaims;