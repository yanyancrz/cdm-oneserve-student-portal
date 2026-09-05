import React from "react";

const ViewLostFoundModal = ({
    isOpen,
    onClose,
    item,
    onClaim,
}) => {
    if (!isOpen || !item) {
        return null;
    }

    const reportType =
        item.reportType?.toLowerCase() || "";

    const status =
        item.status?.toLowerCase() || "";

    const verificationStatus =
        item.verificationStatus?.toLowerCase() || "";

    const isFound = reportType === "found";

    const isMatched = status === "matched";

    const isClaimed = status === "claimed";

    /*
     * User can claim only when:
     * 1. Report type is Found
     * 2. Item is Matched
     * 3. Item is not yet Claimed
     */
    const canClaim =
        isFound &&
        isMatched &&
        !isClaimed;

    const statusClass =
        status === "matched"
            ? "bg-[#E3EEFB] text-[#1D4E89]"
            : status === "claimed"
            ? "bg-[#F1E7FA] text-[#5B2A86]"
            : status === "closed"
            ? "bg-gray-100 text-gray-500"
            : "bg-[#FAEEDA] text-[#633806]";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
            onClick={onClose}
        >
            <div
                className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >

                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-4 flex-shrink-0">

                    <div>
                        <h2 className="text-xl font-semibold text-[#1F1F1F] tracking-tight">
                            Item Details
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Lost & Found Report
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full w-8 h-8 flex items-center justify-center text-xl text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700"
                    >
                        ×
                    </button>

                </div>


                {/* ==========================================
                    CONTENT
                ========================================== */}

                <div
                    className="
                        overflow-y-auto p-6
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-[#106A2E]/25
                        hover:[&::-webkit-scrollbar-thumb]:bg-[#106A2E]/40
                        [scrollbar-width:thin]
                        [scrollbar-color:rgba(16,106,46,0.25)_transparent]
                    "
                >

                    {/* IMAGE */}

                    <div className="mb-6 flex h-64 items-center justify-center overflow-hidden rounded-xl bg-[#F7FAF8]">

                        {item.photo ? (
                            <img
                                src={item.photo}
                                alt={item.itemName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="text-center">

                                <div className="text-6xl">
                                    📦
                                </div>

                                <p className="mt-2 text-sm text-gray-400">
                                    No photo available
                                </p>

                            </div>
                        )}

                    </div>


                    {/* ==========================================
                        BADGES
                    ========================================== */}

                    <div className="mb-4 flex flex-wrap gap-2">

                        {/* LOST / FOUND */}

                        <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                isFound
                                    ? "bg-[#E1F5EE] text-[#085041]"
                                    : "bg-[#FAECE7] text-[#712B13]"
                            }`}
                        >
                            {item.reportType}
                        </span>


                        {/* STATUS */}

                        <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClass}`}
                        >
                            {item.status}
                        </span>


                        {/* VERIFICATION */}

                        {item.verificationStatus && (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                Verification: {item.verificationStatus}
                            </span>
                        )}

                    </div>


                    {/* ==========================================
                        ITEM NAME
                    ========================================== */}

                    <h3 className="text-xl sm:text-2xl font-semibold text-[#1F1F1F] tracking-tight">
                        {item.itemName}
                    </h3>

                    {item.category && (
                        <p className="mt-1 text-sm font-medium text-[#106A2E]">
                            {item.category}
                        </p>
                    )}


                    {/* ==========================================
                        DESCRIPTION
                    ========================================== */}

                    <div className="mt-6">

                        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                            Description
                        </h4>

                        <p className="rounded-xl bg-[#F7FAF8] p-4 text-sm leading-6 text-gray-600">
                            {item.description ||
                                "No description provided."}
                        </p>

                    </div>


                    {/* ==========================================
                        INFORMATION
                    ========================================== */}

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                        {/* LOCATION */}

                        <div className="rounded-xl bg-[#F7FAF8] p-4">

                            <p className="text-[11px] text-gray-400 mb-1">
                                Location
                            </p>

                            <p className="text-sm font-semibold text-[#1F1F1F]">
                                📍 {item.location || "N/A"}
                            </p>

                        </div>


                        {/* DATE */}

                        <div className="rounded-xl bg-[#F7FAF8] p-4">

                            <p className="text-[11px] text-gray-400 mb-1">
                                Date
                            </p>

                            <p className="text-sm font-semibold text-[#1F1F1F]">

                                📅{" "}

                                {item.dateLostFound
                                    ? new Date(
                                          item.dateLostFound
                                      ).toLocaleDateString(
                                          "en-US",
                                          {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                          }
                                      )
                                    : "N/A"}

                            </p>

                        </div>

                    </div>


                    {/* ==========================================
                        REPORTER
                    ========================================== */}

                    <div className="mt-4 rounded-xl bg-[#F7FAF8] p-4">

                        <p className="text-[11px] text-gray-400 mb-1">
                            Reported By
                        </p>

                        <p className="text-sm font-semibold text-[#1F1F1F]">
                            {item.fullName || "Unknown"}
                        </p>

                    </div>


                    {/* ==========================================
                        CLAIM INFORMATION
                    ========================================== */}

                    {canClaim && (
                        <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#E1F5EE] p-4">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-[#085041]">
                                    This item has been matched with a lost
                                    report.
                                </p>

                                <p className="mt-1 text-sm leading-5 text-[#0b5c47]">
                                    If you believe this is your item, you may
                                    submit a claim. Your claim will be reviewed
                                    by the administrator.
                                </p>
                            </div>
                        </div>
                    )}


                    {isClaimed && (
                        <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#F1E7FA] p-4">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B2A86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-[#5B2A86]">
                                    This item has already been claimed.
                                </p>

                                <p className="mt-1 text-sm text-[#6b3a92]">
                                    The item is no longer available for new
                                    claims.
                                </p>
                            </div>
                        </div>
                    )}


                    {/* ==========================================
                        ACTIONS
                    ========================================== */}

                    <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-black/5 pt-5">

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200"
                        >
                            Close
                        </button>


                        {/* CLAIM BUTTON */}

                        {canClaim && (
                            <button
                                type="button"
                                onClick={() => onClaim(item)}
                                className="rounded-xl bg-[#106A2E] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-[0.99]"
                            >
                                Claim This Item
                            </button>
                        )}

                    </div>

                </div>

            </div>
        </div>
    );
};

export default ViewLostFoundModal;