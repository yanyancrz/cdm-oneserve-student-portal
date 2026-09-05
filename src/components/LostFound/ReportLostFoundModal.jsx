import { useEffect, useState } from "react";
import { createReport } from "../../services/lostFoundService";

const ReportLostFoundModal = ({
    isOpen,
    onClose,
    reportType,
    onSuccess,
}) => {
    const [itemName, setItemName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [dateLostFound, setDateLostFound] = useState("");
    const [location, setLocation] = useState("");
    const [photo, setPhoto] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setItemName("");
            setCategory("");
            setDescription("");
            setDateLostFound("");
            setLocation("");
            setPhoto("");
            setError("");
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        const userId = localStorage.getItem("userId");

        if (!userId) {
            setError("User information not found. Please log in again.");
            return;
        }

        if (
            !itemName ||
            !category ||
            !description ||
            !dateLostFound ||
            !location
        ) {
            setError("Please complete all required fields.");
            return;
        }

        try {
            setLoading(true);

            const reportData = {
                userId: Number(userId),
                itemName: itemName.trim(),
                category,
                description: description.trim(),
                reportType,
                dateLostFound,
                location: location.trim(),
                photo: photo.trim() || null,
            };

            await createReport(reportData);

            if (onSuccess) {
                await onSuccess();
            }

            onClose();
        } catch (err) {
            console.error("Create report error:", err);

            setError(
                err.message || "Failed to submit Lost & Found report."
            );
        } finally {
            setLoading(false);
        }
    };

    const isFound = reportType?.toLowerCase() === "found";

    const title = isFound ? "Report Found Item" : "Report Lost Item";

    const accentColor = isFound ? "#106A2E" : "#712B13";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6">

            <div
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-5 flex-shrink-0">

                    <div>
                        <h2 className="text-xl font-semibold text-[#1F1F1F] tracking-tight">
                            {title}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Provide accurate information about the item.
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


                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    id="report-lost-found-form"
                    className="
                        space-y-5 overflow-y-auto p-6
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-[#106A2E]/25
                        hover:[&::-webkit-scrollbar-thumb]:bg-[#106A2E]/40
                        [scrollbar-width:thin]
                        [scrollbar-color:rgba(16,106,46,0.25)_transparent]
                    "
                >

                    {/* ERROR */}

                    {error && (
                        <div className="rounded-xl bg-[#FAECE7] px-4 py-3 text-sm text-[#712B13]">
                            {error}
                        </div>
                    )}


                    {/* ITEM NAME */}

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#1F1F1F]">
                            Item Name
                        </label>

                        <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="e.g. Black Wallet"
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#106A2E] focus:ring-1 focus:ring-[#106A2E]"
                            required
                        />
                    </div>


                    {/* CATEGORY */}

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#1F1F1F]">
                            Category
                        </label>

                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#106A2E] focus:ring-1 focus:ring-[#106A2E]"
                            required
                        >
                            <option value="">
                                Select Category
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
                    </div>


                    {/* DESCRIPTION */}

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#1F1F1F]">
                            Description
                        </label>

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the item, including identifying details."
                            rows={4}
                            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#106A2E] focus:ring-1 focus:ring-[#106A2E]"
                            required
                        />
                    </div>


                    {/* DATE + LOCATION */}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-[#1F1F1F]">
                                Date
                            </label>

                            <input
                                type="date"
                                value={dateLostFound}
                                onChange={(e) =>
                                    setDateLostFound(e.target.value)
                                }
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#106A2E] focus:ring-1 focus:ring-[#106A2E]"
                                required
                            />
                        </div>


                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-[#1F1F1F]">
                                Location
                            </label>

                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Library"
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#106A2E] focus:ring-1 focus:ring-[#106A2E]"
                                required
                            />
                        </div>

                    </div>


                    {/* PHOTO */}

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#1F1F1F]">
                            Photo URL
                            <span className="ml-1 font-normal text-gray-400">
                                (Optional)
                            </span>
                        </label>

                        <input
                            type="text"
                            value={photo}
                            onChange={(e) => setPhoto(e.target.value)}
                            placeholder="Enter photo URL"
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#106A2E] focus:ring-1 focus:ring-[#106A2E]"
                        />
                    </div>

                </form>


                {/* ACTIONS */}

                <div className="flex justify-end gap-3 border-t border-black/5 px-6 py-4 flex-shrink-0">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        form="report-lost-found-form"
                        disabled={loading}
                        style={{ backgroundColor: accentColor }}
                        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "Submitting..."
                            : "Submit Report"}
                    </button>

                </div>

            </div>

        </div>
    );
};

export default ReportLostFoundModal;