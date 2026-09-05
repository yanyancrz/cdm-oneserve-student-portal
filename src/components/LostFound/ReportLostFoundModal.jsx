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

    const title =
        reportType?.toLowerCase() === "found"
            ? "Report Found Item"
            : "Report Lost Item";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">

            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {title}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Provide accurate information about the item.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full px-3 py-1 text-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                        ×
                    </button>

                </div>


                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 p-6"
                >

                    {/* ERROR */}

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}


                    {/* ITEM NAME */}

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Item Name
                        </label>

                        <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="e.g. Black Wallet"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>


                    {/* CATEGORY */}

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Category
                        </label>

                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Description
                        </label>

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the item, including identifying details."
                            rows={4}
                            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>


                    {/* DATE + LOCATION */}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                Date
                            </label>

                            <input
                                type="date"
                                value={dateLostFound}
                                onChange={(e) =>
                                    setDateLostFound(e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>


                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                Location
                            </label>

                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Library"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>

                    </div>


                    {/* PHOTO */}

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
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
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>


                    {/* ACTIONS */}

                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                reportType?.toLowerCase() === "found"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            {loading
                                ? "Submitting..."
                                : "Submit Report"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
};

export default ReportLostFoundModal;