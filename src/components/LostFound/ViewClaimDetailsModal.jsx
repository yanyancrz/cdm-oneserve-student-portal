import { X, MapPin, CalendarDays, FileText, Package } from "lucide-react";

function ViewClaimDetailsModal({ isOpen, onClose, claim }) {
    if (!isOpen || !claim) {
        return null;
    }

    const status = claim.status?.toLowerCase();

    const getStatusStyle = () => {
        switch (status) {
            case "approved":
                return "bg-[#E1F5EE] text-[#085041]";

            case "rejected":
                return "bg-[#FAECE7] text-[#712B13]";

            default:
                return "bg-[#FAEEDA] text-[#633806]";
        }
    };

    const getStatusTitle = () => {
        switch (status) {
            case "approved":
                return "Claim Approved";

            case "rejected":
                return "Claim Rejected";

            default:
                return "Claim Under Review";
        }
    };

    const getStatusMessage = () => {
        switch (status) {
            case "approved":
                return "Your claim has been approved by the administrator.";

            case "rejected":
                return "Your claim has been rejected by the administrator.";

            default:
                return "Your claim is currently being reviewed by the administrator. Please wait for the verification result.";
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";

        return new Date(date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6"
            onClick={onClose}
        >
            <div
                className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-5">
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                            Claim Details
                        </p>

                        <h2 className="mt-1 text-xl font-semibold text-[#1F1F1F] tracking-tight">
                            Claim #{claim.id}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* CONTENT */}
                <div
                    className="
                        space-y-5 overflow-y-auto px-6 py-6
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-[#106A2E]/25
                        hover:[&::-webkit-scrollbar-thumb]:bg-[#106A2E]/40
                        [scrollbar-width:thin]
                        [scrollbar-color:rgba(16,106,46,0.25)_transparent]
                    "
                >

                    {/* CLAIM STATUS */}
                    <div
                        className={`rounded-xl px-4 py-4 ${getStatusStyle()}`}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold text-sm">
                                    {getStatusTitle()}
                                </p>

                                <p className="mt-1 text-sm">
                                    {getStatusMessage()}
                                </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide capitalize">
                                {claim.status || "Pending"}
                            </span>
                        </div>
                    </div>

                    {/* ITEM INFORMATION */}
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <Package
                                size={18}
                                className="text-[#106A2E]"
                            />

                            <h3 className="font-semibold text-sm text-[#1F1F1F]">
                                Item Information
                            </h3>
                        </div>

                        <div className="rounded-xl bg-[#F7FAF8] p-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div>
                                    <p className="text-[11px] text-gray-400 mb-0.5">
                                        Item
                                    </p>

                                    <p className="text-sm font-semibold text-[#1F1F1F]">
                                        {claim.itemName || "N/A"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-gray-400 mb-0.5">
                                        Category
                                    </p>

                                    <p className="text-sm font-medium text-[#106A2E]">
                                        {claim.category || "N/A"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-gray-400 mb-0.5">
                                        Report Type
                                    </p>

                                    <p className="text-sm font-medium text-gray-700">
                                        {claim.reportType || "Found"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-gray-400 mb-0.5">
                                        Location
                                    </p>

                                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span>
                                            {claim.location || "N/A"}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[11px] text-gray-400 mb-0.5">
                                        Date Lost / Found
                                    </p>

                                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                        <CalendarDays size={14} className="text-gray-400" />
                                        <span>
                                            {formatDate(
                                                claim.dateLostFound
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[11px] text-gray-400 mb-0.5">
                                        Claim Submitted
                                    </p>

                                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                        <CalendarDays size={14} className="text-gray-400" />
                                        <span>
                                            {formatDate(
                                                claim.createdAt
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ITEM DESCRIPTION */}
                    {claim.description && (
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <FileText
                                    size={18}
                                    className="text-[#106A2E]"
                                />

                                <h3 className="font-semibold text-sm text-[#1F1F1F]">
                                    Item Description
                                </h3>
                            </div>

                            <div className="rounded-xl bg-[#F7FAF8] p-4 text-sm leading-6 text-gray-600">
                                {claim.description}
                            </div>
                        </div>
                    )}

                    {/* YOUR CLAIM */}
                    <div>
                        <h3 className="mb-2 font-semibold text-sm text-[#1F1F1F]">
                            Your Claim
                        </h3>

                        <div className="rounded-xl bg-[#F7FAF8] p-4 text-sm leading-6 text-gray-600">
                            {claim.claimDescription || "No claim description provided."}
                        </div>
                    </div>

                    {/* PHOTO */}
                    {claim.photo && (
                        <div>
                            <h3 className="mb-2 font-semibold text-sm text-[#1F1F1F]">
                                Item Photo
                            </h3>

                            <img
                                src={
                                    claim.photo.startsWith("http")
                                        ? claim.photo
                                        : `http://localhost:5212${claim.photo}`
                                }
                                alt={claim.itemName || "Lost and Found item"}
                                className="max-h-72 w-full rounded-xl object-contain bg-[#F7FAF8]"
                            />
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="border-t border-black/5 px-6 py-4 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ViewClaimDetailsModal;