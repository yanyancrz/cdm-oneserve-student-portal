import React from "react";

const AdminClaimDetailsModal = ({ claim, onClose }) => {
    if (!claim) return null;

    const item = claim.item || {};
    const claimant = claim.claimantUser || {};
    const reviewer = claim.reviewer || {};

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusClass = (status) => {
        switch (String(status).toLowerCase()) {
            case "approved":
                return "bg-green-100 text-green-700";

            case "rejected":
                return "bg-red-100 text-red-700";

            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            Claim Details
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Claim #{claim.id}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6 p-6">

                    {/* Claim Status */}
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Claim Status
                            </p>

                            <p className="mt-1 text-sm text-gray-600">
                                Current status of this claim
                            </p>
                        </div>

                        <span
                            className={`rounded-full px-4 py-2 text-xs font-semibold ${getStatusClass(
                                claim.status
                            )}`}
                        >
                            {claim.status || "Pending"}
                        </span>
                    </div>

                    {/* Item Information */}
                    <section>
                        <h3 className="mb-3 text-base font-bold text-gray-800">
                            Item Information
                        </h3>

                        <div className="grid grid-cols-1 gap-4 rounded-xl border p-5 md:grid-cols-2">
                            <div>
                                <p className="text-xs text-gray-500">
                                    Item Name
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {item.itemName || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    Category
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {item.category || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    Report Type
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {item.reportType || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    Location
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {item.location || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    Date Lost / Found
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {item.dateLostFound
                                        ? new Date(
                                              item.dateLostFound
                                          ).toLocaleDateString("en-PH", {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                          })
                                        : "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    Item Status
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {item.status || "—"}
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <p className="text-xs text-gray-500">
                                    Item Description
                                </p>

                                <p className="mt-1 text-sm leading-relaxed text-gray-700">
                                    {item.description || "No description provided."}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Claimant Information */}
                    <section>
                        <h3 className="mb-3 text-base font-bold text-gray-800">
                            Claimant Information
                        </h3>

                        <div className="grid grid-cols-1 gap-4 rounded-xl border p-5 md:grid-cols-2">
                            <div>
                                <p className="text-xs text-gray-500">
                                    Full Name
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {claimant.fullName || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    ID Number
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {claimant.idNumber || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    Email
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {claimant.email || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    User ID
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {claim.claimantUserId || "—"}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Claim Description */}
                    <section>
                        <h3 className="mb-3 text-base font-bold text-gray-800">
                            Claim Description
                        </h3>

                        <div className="rounded-xl border bg-gray-50 p-5">
                            <p className="text-sm leading-relaxed text-gray-700">
                                {claim.claimDescription ||
                                    "No claim description provided."}
                            </p>
                        </div>
                    </section>

                    {/* Review Information */}
                    {(claim.reviewedBy ||
                        claim.reviewedAt ||
                        claim.claimedAt) && (
                        <section>
                            <h3 className="mb-3 text-base font-bold text-gray-800">
                                Review Information
                            </h3>

                            <div className="grid grid-cols-1 gap-4 rounded-xl border p-5 md:grid-cols-2">
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Reviewed By
                                    </p>

                                    <p className="mt-1 font-medium text-gray-800">
                                        {reviewer.fullName ||
                                            claim.reviewedBy ||
                                            "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Reviewed At
                                    </p>

                                    <p className="mt-1 font-medium text-gray-800">
                                        {formatDate(claim.reviewedAt)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Claimed At
                                    </p>

                                    <p className="mt-1 font-medium text-gray-800">
                                        {formatDate(claim.claimedAt)}
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Submitted */}
                    <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">
                            Claim Submitted
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-700">
                            {formatDate(claim.createdAt)}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-900"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminClaimDetailsModal;