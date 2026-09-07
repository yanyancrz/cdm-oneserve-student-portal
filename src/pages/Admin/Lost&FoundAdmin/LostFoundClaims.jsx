import React, { useEffect, useState } from "react";
import {
    getAdminClaims,
    approveAdminClaim,
    rejectAdminClaim,
} from "../../../services/lostFoundAdminService";

import AdminClaimDetailsModal from "../../../components/LostFound/Admin/AdminClaimDetailsModal";

const LostFoundClaims = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [selectedClaim, setSelectedClaim] = useState(null);

    const loadClaims = async () => {
        try {
            setLoading(true);

            const data = await getAdminClaims();

            setClaims(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load claims:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClaims();
    }, []);

    // =========================
    // APPROVE CLAIM
    // =========================
    const handleApprove = async (id) => {
        const adminUserId = localStorage.getItem("userId");

        if (!adminUserId) {
            alert("Librarian user ID not found.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to approve this claim?"
        );

        if (!confirmed) return;

        try {
            await approveAdminClaim(id, adminUserId);

            alert("Claim approved successfully.");

            await loadClaims();
        } catch (error) {
            console.error("Approve claim error:", error);

            alert(
                error.message ||
                    "Failed to approve the claim."
            );
        }
    };

    // =========================
    // REJECT CLAIM
    // =========================
    const handleReject = async (id) => {
        const adminUserId = localStorage.getItem("userId");

        if (!adminUserId) {
            alert("Librarian user ID not found.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to reject this claim?"
        );

        if (!confirmed) return;

        try {
            await rejectAdminClaim(id, adminUserId);

            alert("Claim rejected successfully.");

            await loadClaims();
        } catch (error) {
            console.error("Reject claim error:", error);

            alert(
                error.message ||
                    "Failed to reject the claim."
            );
        }
    };

    // =========================
    // STATUS BADGE
    // =========================
    const getStatusClass = (status) => {
        switch (String(status).toLowerCase()) {
            case "approved":
                return "bg-green-100 text-green-700";

            case "rejected":
                return "bg-red-100 text-red-700";

            case "pending":
            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };

    // =========================
    // FILTER CLAIMS
    // =========================
    const filteredClaims = claims.filter((claim) => {
        const item = claim.item || {};
        const claimant = claim.claimantUser || {};

        const searchText = search.toLowerCase().trim();

        const matchesSearch =
            String(claim.id || "")
                .toLowerCase()
                .includes(searchText) ||

            String(item.itemName || "")
                .toLowerCase()
                .includes(searchText) ||

            String(claimant.fullName || "")
                .toLowerCase()
                .includes(searchText) ||

            String(claimant.idNumber || "")
                .toLowerCase()
                .includes(searchText);

        const matchesStatus =
            statusFilter === "All" ||
            String(claim.status || "").toLowerCase() ===
                statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6">

            {/* =========================
                PAGE HEADER
            ========================= */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Lost & Found Claims
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Review and manage item claims submitted by students
                    and faculty.
                </p>
            </div>

            {/* =========================
                FILTER BAR
            ========================= */}
            <div className="mb-5 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">

                {/* Search */}
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Search claims..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                >
                    <option value="All">
                        All Status
                    </option>

                    <option value="Pending">
                        Pending
                    </option>

                    <option value="Approved">
                        Approved
                    </option>

                    <option value="Rejected">
                        Rejected
                    </option>
                </select>
            </div>

            {/* =========================
                CLAIMS TABLE
            ========================= */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px] text-left text-sm">

                        {/* TABLE HEADER */}
                        <thead className="bg-gray-100 text-gray-600">

                            <tr>
                                <th className="px-5 py-4 font-semibold">
                                    Claim ID
                                </th>

                                <th className="px-5 py-4 font-semibold">
                                    Item
                                </th>

                                <th className="px-5 py-4 font-semibold">
                                    Claimant
                                </th>

                                <th className="px-5 py-4 font-semibold">
                                    Date Submitted
                                </th>

                                <th className="px-5 py-4 font-semibold">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-center font-semibold">
                                    Actions
                                </th>
                            </tr>

                        </thead>

                        {/* TABLE BODY */}
                        <tbody>

                            {/* =========================
                                LOADING SKELETON
                            ========================= */}
                            {loading &&
                                Array.from({ length: 5 }).map(
                                    (_, index) => (
                                        <tr
                                            key={index}
                                            className="border-t"
                                        >
                                            <td className="px-5 py-5">
                                                <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                                            </td>

                                            <td className="px-5 py-5">
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                                                    <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                                                </div>
                                            </td>

                                            <td className="px-5 py-5">
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                                                    <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                                                </div>
                                            </td>

                                            <td className="px-5 py-5">
                                                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                                            </td>

                                            <td className="px-5 py-5">
                                                <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                                            </td>

                                            <td className="px-5 py-5">
                                                <div className="mx-auto h-8 w-32 animate-pulse rounded bg-gray-200" />
                                            </td>
                                        </tr>
                                    )
                                )}

                            {/* =========================
                                EMPTY STATE
                            ========================= */}
                            {!loading &&
                                filteredClaims.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-5 py-14 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center">

                                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth="1.5"
                                                        stroke="currentColor"
                                                        className="h-6 w-6"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                        />
                                                    </svg>
                                                </div>

                                                <p className="font-medium text-gray-700">
                                                    No claims found
                                                </p>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    There are no claims
                                                    matching your search.
                                                </p>

                                            </div>
                                        </td>
                                    </tr>
                                )}

                            {/* =========================
                                CLAIM DATA
                            ========================= */}
                            {!loading &&
                                filteredClaims.map((claim) => {

                                    const item =
                                        claim.item || {};

                                    const claimant =
                                        claim.claimantUser || {};

                                    return (
                                        <tr
                                            key={claim.id}
                                            className="border-t transition hover:bg-gray-50"
                                        >

                                            {/* Claim ID */}
                                            <td className="px-5 py-4">
                                                <span className="font-semibold text-gray-700">
                                                    #{claim.id}
                                                </span>
                                            </td>

                                            {/* Item */}
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-gray-800">
                                                    {item.itemName ||
                                                        "Unknown"}
                                                </div>

                                                <div className="mt-1 text-xs text-gray-500">
                                                    {item.category ||
                                                        "—"}
                                                </div>
                                            </td>

                                            {/* Claimant */}
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-gray-800">
                                                    {claimant.fullName ||
                                                        "Unknown"}
                                                </div>

                                                <div className="mt-1 text-xs text-gray-500">
                                                    {claimant.idNumber ||
                                                        "—"}
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-4 text-gray-600">
                                                {claim.createdAt
                                                    ? new Date(
                                                          claim.createdAt
                                                      ).toLocaleDateString(
                                                          "en-PH",
                                                          {
                                                              year: "numeric",
                                                              month: "short",
                                                              day: "numeric",
                                                          }
                                                      )
                                                    : "—"}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">

                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                        claim.status
                                                    )}`}
                                                >
                                                    {claim.status ||
                                                        "Pending"}
                                                </span>

                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">

                                                <div className="flex items-center justify-center gap-2">

                                                    {/* View */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedClaim(
                                                                claim
                                                            )
                                                        }
                                                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                                                    >
                                                        View
                                                    </button>

                                                    {/* Pending actions */}
                                                    {String(
                                                        claim.status
                                                    ).toLowerCase() ===
                                                        "pending" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        claim.id
                                                                    )
                                                                }
                                                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-green-700"
                                                            >
                                                                Approve
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleReject(
                                                                        claim.id
                                                                    )
                                                                }
                                                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                </div>

                                            </td>

                                        </tr>
                                    );
                                })}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* =========================
                CLAIM DETAILS MODAL
            ========================= */}
            {selectedClaim && (
                <AdminClaimDetailsModal
                    claim={selectedClaim}
                    onClose={() =>
                        setSelectedClaim(null)
                    }
                />
            )}

        </div>
    );
};

export default LostFoundClaims;