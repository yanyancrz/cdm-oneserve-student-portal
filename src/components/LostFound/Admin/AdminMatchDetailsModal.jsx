import { X, MapPin, CalendarDays, User, Hash } from "lucide-react";

function AdminMatchDetailsModal({ match, onClose }) {
    if (!match) return null;

    const lostItem = match.lostItem || {};
    const foundItem = match.foundItem || {};

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

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

    const DetailRow = ({ icon: Icon, label, value }) => (
        <div className="flex gap-3">
            <div className="mt-0.5 text-gray-400">
                <Icon size={17} />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-medium text-gray-400">
                    {label}
                </p>

                <p className="mt-0.5 break-words text-sm text-gray-700">
                    {value || "—"}
                </p>
            </div>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >

                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">

                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            Match Details
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Review the details of the matched lost and found
                            items.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X size={22} />
                    </button>

                </div>


                {/* ==========================================
                    MATCH SUMMARY
                ========================================== */}

                <div className="border-b bg-gray-50 px-6 py-5">

                    <div className="flex flex-col items-center justify-center gap-4 md:flex-row">

                        {/* LOST */}

                        <div className="w-full rounded-xl border bg-white p-4 md:w-[40%]">

                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500">
                                Lost Item
                            </p>

                            <h3 className="text-lg font-bold text-gray-800">
                                {lostItem.itemName || "—"}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                {lostItem.category || "—"}
                            </p>

                        </div>


                        {/* SCORE */}

                        <div className="flex flex-col items-center">

                            <div className="rounded-full bg-green-100 px-4 py-2">
                                <span className="text-lg font-bold text-green-700">
                                    {Number(
                                        match.matchScore || 0
                                    ).toFixed(0)}
                                    %
                                </span>
                            </div>

                            <span className="mt-1 text-xs text-gray-400">
                                Match Score
                            </span>

                        </div>


                        {/* FOUND */}

                        <div className="w-full rounded-xl border bg-white p-4 md:w-[40%]">

                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-600">
                                Found Item
                            </p>

                            <h3 className="text-lg font-bold text-gray-800">
                                {foundItem.itemName || "—"}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                {foundItem.category || "—"}
                            </p>

                        </div>

                    </div>

                </div>


                {/* ==========================================
                    ITEM DETAILS
                ========================================== */}

                <div className="grid gap-6 p-6 md:grid-cols-2">

                    {/* ==========================================
                        LOST ITEM DETAILS
                    ========================================== */}

                    <div className="rounded-xl border border-red-100 bg-red-50/30 p-5">

                        <div className="mb-5">

                            <h3 className="text-lg font-bold text-gray-800">
                                Lost Item Information
                            </h3>

                            <div className="mt-1 h-1 w-12 rounded-full bg-red-400" />

                        </div>


                        <div className="space-y-4">

                            <DetailRow
                                icon={Hash}
                                label="Item Name"
                                value={lostItem.itemName}
                            />

                            <DetailRow
                                icon={Hash}
                                label="Category"
                                value={lostItem.category}
                            />

                            <DetailRow
                                icon={MapPin}
                                label="Location"
                                value={lostItem.location}
                            />

                            <DetailRow
                                icon={CalendarDays}
                                label="Date Lost"
                                value={formatDate(
                                    lostItem.dateLostFound
                                )}
                            />

                            <DetailRow
                                icon={User}
                                label="Reported By"
                                value={lostItem.fullName}
                            />

                            <DetailRow
                                icon={Hash}
                                label="ID Number"
                                value={lostItem.idNumber}
                            />

                        </div>


                        {/* DESCRIPTION */}

                        <div className="mt-5 border-t border-red-100 pt-4">

                            <p className="text-xs font-medium text-gray-400">
                                Description
                            </p>

                            <p className="mt-1 text-sm leading-relaxed text-gray-700">
                                {lostItem.description || "No description provided."}
                            </p>

                        </div>


                        {/* VERIFICATION / STATUS */}

                        <div className="mt-5 flex flex-wrap gap-2">

                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                Status:{" "}
                                {lostItem.status || "—"}
                            </span>

                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                                Verification:{" "}
                                {lostItem.verificationStatus ||
                                    "—"}
                            </span>

                        </div>

                    </div>


                    {/* ==========================================
                        FOUND ITEM DETAILS
                    ========================================== */}

                    <div className="rounded-xl border border-green-100 bg-green-50/30 p-5">

                        <div className="mb-5">

                            <h3 className="text-lg font-bold text-gray-800">
                                Found Item Information
                            </h3>

                            <div className="mt-1 h-1 w-12 rounded-full bg-green-500" />

                        </div>


                        <div className="space-y-4">

                            <DetailRow
                                icon={Hash}
                                label="Item Name"
                                value={foundItem.itemName}
                            />

                            <DetailRow
                                icon={Hash}
                                label="Category"
                                value={foundItem.category}
                            />

                            <DetailRow
                                icon={MapPin}
                                label="Location"
                                value={foundItem.location}
                            />

                            <DetailRow
                                icon={CalendarDays}
                                label="Date Found"
                                value={formatDate(
                                    foundItem.dateLostFound
                                )}
                            />

                            <DetailRow
                                icon={User}
                                label="Reported By"
                                value={foundItem.fullName}
                            />

                            <DetailRow
                                icon={Hash}
                                label="ID Number"
                                value={foundItem.idNumber}
                            />

                        </div>


                        {/* DESCRIPTION */}

                        <div className="mt-5 border-t border-green-100 pt-4">

                            <p className="text-xs font-medium text-gray-400">
                                Description
                            </p>

                            <p className="mt-1 text-sm leading-relaxed text-gray-700">
                                {foundItem.description || "No description provided."}
                            </p>

                        </div>


                        {/* VERIFICATION / STATUS */}

                        <div className="mt-5 flex flex-wrap gap-2">

                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                Status:{" "}
                                {foundItem.status || "—"}
                            </span>

                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                                Verification:{" "}
                                {foundItem.verificationStatus ||
                                    "—"}
                            </span>

                        </div>

                    </div>

                </div>


                {/* ==========================================
                    MATCH STATUS
                ========================================== */}

                <div className="border-t px-6 py-5">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Match Status
                            </p>

                            <span
                                className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                    match.status
                                )}`}
                            >
                                {match.status || "Pending"}
                            </span>

                        </div>


                        <div className="text-left sm:text-right">

                            <p className="text-xs text-gray-400">
                                Match Created
                            </p>

                            <p className="text-sm font-medium text-gray-700">
                                {formatDate(match.createdAt)}
                            </p>

                        </div>

                    </div>

                </div>


                {/* ==========================================
                    FOOTER
                ========================================== */}

                <div className="flex justify-end border-t bg-gray-50 px-6 py-4">

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                    >
                        Close
                    </button>

                </div>

            </div>
        </div>
    );
}

export default AdminMatchDetailsModal;