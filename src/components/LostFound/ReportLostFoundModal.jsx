import { useEffect, useRef, useState } from "react";
import {
    Camera,
    Image as ImageIcon,
    Upload,
    Trash2,
} from "lucide-react";

import {
    createReport,
    uploadPhoto
} from "../../services/lostFoundService";

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
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");

    const uploadInputRef = useRef(null);
    const cameraInputRef = useRef(null);

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
            setPhotoFile(null);
            setPhotoPreview("");
            setError("");
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    if (!isOpen) {
        return null;
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Photo must be 5 MB or smaller.");
            e.target.value = "";
            return;
        }

        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }

        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        setPhoto("");
        setError("");

        // Allow the same file to be selected again later.
        e.target.value = "";
    };

    const removePhoto = () => {
        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }

        setPhotoFile(null);
        setPhotoPreview("");
        setPhoto("");
    };

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

            let photoPath = photo.trim() || null;

            // Upload the selected/captured image first.
            if (photoFile) {
                photoPath = await uploadPhoto(photoFile);
            }

            const reportData = {
                userId: Number(userId),
                itemName: itemName.trim(),
                category,
                description: description.trim(),
                reportType,
                dateLostFound,
                location: location.trim(),
                photo: photoPath,
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
                            Item Photo
                            <span className="ml-1 font-normal text-gray-400">
                                (Optional)
                            </span>
                        </label>

                        <input
                            ref={uploadInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />

                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />

                        {!photoPreview ? (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-[#F9F9F7] p-5">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#106A2E]/10">
                                        <ImageIcon
                                            size={23}
                                            className="text-[#106A2E]"
                                        />
                                    </div>

                                    <p className="text-sm font-medium text-[#1F1F1F]">
                                        Add a photo of the item
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        JPG, PNG, WEBP • Maximum 5 MB
                                    </p>

                                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                uploadInputRef.current?.click()
                                            }
                                            disabled={loading}
                                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#1F1F1F] transition hover:border-[#106A2E]/30 hover:text-[#106A2E] disabled:opacity-50"
                                        >
                                            <Upload size={16} />
                                            Upload Photo
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                cameraInputRef.current?.click()
                                            }
                                            disabled={loading}
                                            className="inline-flex items-center gap-2 rounded-xl bg-[#106A2E] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
                                        >
                                            <Camera size={16} />
                                            Open Camera
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-[#F9F9F7]">
                                <div className="relative">
                                    <img
                                        src={photoPreview}
                                        alt="Selected item"
                                        className="h-56 w-full object-contain bg-gray-100"
                                    />

                                    <button
                                        type="button"
                                        onClick={removePhoto}
                                        disabled={loading}
                                        title="Remove photo"
                                        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-red-600 shadow-sm transition hover:bg-white disabled:opacity-50"
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-[#1F1F1F]">
                                            {photoFile?.name || "Item photo"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Ready to upload with your report
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            cameraInputRef.current?.click()
                                        }
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#1F1F1F] transition hover:text-[#106A2E] disabled:opacity-50"
                                    >
                                        <Camera size={15} />
                                        Retake
                                    </button>
                                </div>
                            </div>
                        )}
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