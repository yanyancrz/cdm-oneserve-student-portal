import { useState } from "react";
import toast from "react-hot-toast";
import { createClaim } from "../../services/lostFoundService";

function ClaimModal({ item, onClose, onSuccess }) {
    const [claimDescription, setClaimDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const userId = localStorage.getItem("userId");

    if (!item) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userId) {
            toast.error("User information not found. Please login again.");
            return;
        }

        if (!claimDescription.trim()) {
            toast.error("Please provide details to support your claim.");
            return;
        }

        if (!item.id) {
            toast.error("Item information is missing.");
            return;
        }

        setLoading(true);

        try {
            const data = await createClaim({
                itemId: item.id,
                claimantUserId: parseInt(userId, 10),
                claimDescription: claimDescription.trim(),
            });

            toast.success(
                "Claim submitted successfully! Please wait for administrator verification."
            );

            setClaimDescription("");

            if (onSuccess) {
                onSuccess(data);
            }

            onClose();
        } catch (error) {
            console.error("Claim Error:", error);

            toast.error(
                error.message ||
                    "Something went wrong while submitting your claim."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4 py-6"
            onClick={() => {
                if (!loading) {
                    onClose();
                }
            }}
        >
            <div
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            Claim Item
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Submit a claim for this found item
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-full px-3 py-1 text-2xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        ×
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit}>
                    <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-6">

                        {/* ITEM INFORMATION */}
                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Found Item
                            </p>

                            <h3 className="mt-1 text-lg font-bold text-gray-800">
                                {item.itemName}
                            </h3>

                            {item.category && (
                                <p className="mt-1 text-sm text-blue-600">
                                    {item.category}
                                </p>
                            )}

                            {item.location && (
                                <p className="mt-2 text-sm text-gray-600">
                                    📍 {item.location}
                                </p>
                            )}

                            {item.description && (
                                <p className="mt-2 text-sm leading-5 text-gray-500">
                                    {item.description}
                                </p>
                            )}
                        </div>

                        {/* CLAIM DESCRIPTION */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Why do you believe this item belongs to you?
                            </label>

                            <textarea
                                value={claimDescription}
                                onChange={(e) =>
                                    setClaimDescription(e.target.value)
                                }
                                rows={5}
                                maxLength={1000}
                                placeholder="Describe identifying details of the item, such as its color, contents, brand, markings, or other information that can help verify your claim."
                                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                                disabled={loading}
                            />

                            <div className="mt-2 flex justify-between">
                                <p className="text-xs text-gray-400">
                                    Provide enough information for the administrator to verify your claim.
                                </p>

                                <p className="text-xs text-gray-400">
                                    {claimDescription.length}/1000
                                </p>
                            </div>
                        </div>

                        {/* NOTICE */}
                        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                            <p className="text-sm leading-relaxed text-yellow-800">
                                Your claim will be reviewed by the
                                administrator. The item will only be released
                                after your claim has been verified and
                                approved.
                            </p>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !claimDescription.trim()
                            }
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Submitting..."
                                : "Submit Claim"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ClaimModal;