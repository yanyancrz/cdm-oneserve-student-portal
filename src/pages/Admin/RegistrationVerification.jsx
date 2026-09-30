import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import toast from "react-hot-toast";

export default function RegistrationVerification() {
    const [registrations, setRegistrations] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("Pending");
    const [selectedRegistration, setSelectedRegistration] = useState(null);

    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const [actionModal, setActionModal] = useState(null);
    const [actionReason, setActionReason] = useState("");

    const adminId = localStorage.getItem("userId");

    // =========================================================
    // LOAD REGISTRATIONS
    // =========================================================

    const loadRegistrations = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/admin/registration-verification/all`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Failed to load physical ID submissions."
                );
            }

            setRegistrations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);

            toast.error(
                error.message ||
                    "Unable to load physical ID submissions."
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadRegistrations();
    }, []);

    // =========================================================
    // SEARCH + FILTER
    // =========================================================

    const filteredRegistrations = useMemo(() => {
        const searchValue = search.toLowerCase().trim();

        return registrations.filter((registration) => {
            const matchesSearch =
                !searchValue ||
                registration.fullName
                    ?.toLowerCase()
                    .includes(searchValue) ||
                registration.idNumber
                    ?.toLowerCase()
                    .includes(searchValue) ||
                registration.email
                    ?.toLowerCase()
                    .includes(searchValue);

            const currentStatus =
                registration.physicalIdVerificationStatus ||
                registration.accountStatus ||
                "Pending";

            const normalizedStatus = currentStatus
                .toLowerCase()
                .replace(/\s+/g, "");

            let matchesStatus = true;

            if (statusFilter === "Pending") {
                matchesStatus =
                    normalizedStatus === "pending" ||
                    normalizedStatus === "submitted";
            }

            if (statusFilter === "Approved") {
                matchesStatus =
                    normalizedStatus === "approved" ||
                    normalizedStatus === "verified";
            }

            if (statusFilter === "Rejected") {
                matchesStatus = normalizedStatus === "rejected";
            }

            if (statusFilter === "Re-upload Required") {
                matchesStatus =
                    normalizedStatus === "re-uploadrequired" ||
                    normalizedStatus === "reuploadrequired" ||
                    normalizedStatus === "reupload";
            }

            return matchesSearch && matchesStatus;
        });
    }, [registrations, search, statusFilter]);

    // =========================================================
    // COUNTS
    // =========================================================

    const counts = useMemo(() => {
        let pending = 0;
        let approved = 0;
        let rejected = 0;
        let reupload = 0;

        registrations.forEach((registration) => {
            const status = (
                registration.physicalIdVerificationStatus ||
                registration.accountStatus ||
                "Pending"
            )
                .toLowerCase()
                .replace(/\s+/g, "");

            if (
                status === "pending" ||
                status === "submitted"
            ) {
                pending++;
            } else if (
                status === "approved" ||
                status === "verified"
            ) {
                approved++;
            } else if (status === "rejected") {
                rejected++;
            } else if (
                status === "re-uploadrequired" ||
                status === "reuploadrequired" ||
                status === "reupload"
            ) {
                reupload++;
            }
        });

        return {
            pending,
            approved,
            rejected,
            reupload,
        };
    }, [registrations]);

    // =========================================================
    // DOCUMENT URL
    // =========================================================

    const getDocumentUrl = (path) => {
        if (!path) {
            return null;
        }

        if (path.startsWith("http")) {
            return path;
        }

        return `${API_URL}${path}`;
    };

    // =========================================================
    // VIEW REGISTRATION
    // =========================================================

    const handleView = async (id) => {
        try {
            setDetailsLoading(true);

            const response = await fetch(
                `${API_URL}/api/admin/registration-verification/${id}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Failed to load verification details."
                );
            }

            setSelectedRegistration(data);
        } catch (error) {
            console.error(error);

            toast.error(
                error.message ||
                    "Unable to load verification details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    // =========================================================
    // OPEN ACTION MODAL
    // =========================================================

    const openActionModal = (type, registration) => {
        setActionModal({
            type,
            registration,
        });

        setActionReason("");
    };

    const closeActionModal = () => {
        if (actionLoading) {
            return;
        }

        setActionModal(null);
        setActionReason("");
    };

    // =========================================================
    // APPROVE
    // =========================================================

    const handleApprove = async (id) => {
        if (!adminId) {
            toast.error(
                "Admin ID not found. Please login again."
            );
            return;
        }

        try {
            setActionLoading(`approve-${id}`);

            const response = await fetch(
                `${API_URL}/api/admin/registration-verification/${id}/approve?adminId=${encodeURIComponent(
                    adminId
                )}`,
                {
                    method: "PUT",
                }
            );

            const data = await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Failed to approve physical ID."
                );
            }

            toast.success(
                "Physical ID verified successfully."
            );

            setSelectedRegistration(null);
            closeActionModal();

            await loadRegistrations();
        } catch (error) {
            console.error(error);

            toast.error(
                error.message ||
                    "Unable to approve physical ID."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // =========================================================
    // REJECT
    // =========================================================

    const handleReject = async (id, reason) => {
        if (!adminId) {
            toast.error(
                "Admin ID not found. Please login again."
            );
            return;
        }

        if (!reason.trim()) {
            toast.error(
                "Please provide a reason for rejection."
            );
            return;
        }

        try {
            setActionLoading(`reject-${id}`);

            const response = await fetch(
                `${API_URL}/api/admin/registration-verification/${id}/reject?adminId=${encodeURIComponent(
                    adminId
                )}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        reason: reason.trim(),
                    }),
                }
            );

            const data = await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Failed to reject physical ID."
                );
            }

            toast.success(
                "Physical ID verification rejected."
            );

            setSelectedRegistration(null);
            closeActionModal();

            await loadRegistrations();
        } catch (error) {
            console.error(error);

            toast.error(
                error.message ||
                    "Unable to reject physical ID."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // =========================================================
    // REQUEST RE-UPLOAD
    // =========================================================

    const handleRequestReupload = async (id) => {
        if (!adminId) {
            toast.error(
                "Admin ID not found. Please login again."
            );
            return;
        }


        try {
            setActionLoading(`reupload-${id}`);

            /*
             * IMPORTANT:
             * This endpoint must exist in your backend.
             *
             * If your actual endpoint is different,
             * change only the URL below.
             */

            const response = await fetch(
                `${API_URL}/api/admin/registration-verification/${id}/request-reupload?adminId=${encodeURIComponent(
                    adminId
                )}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({}),
                }
            );

            const data = await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Failed to request physical ID re-upload."
                );
            }

            toast.success(
                "Re-upload request sent successfully."
            );

            setSelectedRegistration(null);
            closeActionModal();

            await loadRegistrations();
        } catch (error) {
            console.error(error);

            toast.error(
                error.message ||
                    "Unable to request re-upload."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // =========================================================
    // STATUS STYLE
    // =========================================================

    const getStatusStyle = (status) => {
        const normalized = (status || "Pending")
            .toLowerCase()
            .replace(/\s+/g, "");

        if (
            normalized === "approved" ||
            normalized === "verified"
        ) {
            return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
        }

        if (normalized === "rejected") {
            return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
        }

        if (
            normalized === "re-uploadrequired" ||
            normalized === "reuploadrequired" ||
            normalized === "reupload"
        ) {
            return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
        }

        return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    };

    const getDisplayStatus = (registration) => {
        return (
            registration.physicalIdVerificationStatus ||
            registration.accountStatus ||
            "Pending"
        );
    };

    // =========================================================
    // INITIALS
    // =========================================================

    const getInitials = (name) => {
        if (!name) {
            return "?";
        }

        return name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    // =========================================================
    // SKELETON
    // =========================================================

    const Bone = ({ className = "" }) => (
        <div
            className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`}
        />
    );

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="min-h-screen bg-[#F8F8F5] text-gray-800">

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

                .font-display {
                    font-family: 'Fraunces', serif;
                }
            `}</style>

            <main className="w-full max-w-[1250px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">

                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#106A2E]/70 font-medium mb-1">
                            Super Admin
                        </p>

                        <h1 className="font-display text-2xl lg:text-3xl text-gray-800">
                            Physical ID Verification
                        </h1>

                        <p className="text-sm text-gray-400 mt-1">
                            Review and verify submitted physical IDs.
                        </p>
                    </div>

                    {/* SEARCH */}

                    <div className="relative w-full lg:w-80">

                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle
                                cx="11"
                                cy="11"
                                r="7"
                            />

                            <path d="M21 21l-4.3-4.3" />
                        </svg>

                        <input
                            type="text"
                            placeholder="Search name, ID number, or email..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            className="
                                w-full
                                border
                                border-gray-200
                                rounded-xl
                                pl-9
                                pr-4
                                py-2.5
                                text-sm
                                bg-white
                                focus:outline-none
                                focus:ring-2
                                focus:ring-[#106A2E]/20
                                focus:border-[#106A2E]
                                transition
                            "
                        />

                    </div>

                </div>

                {/* =====================================================
                    SUMMARY CARDS
                ===================================================== */}

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4 mb-7">

                    {/* PENDING */}

                    <button
                        onClick={() =>
                            setStatusFilter("Pending")
                        }
                        className={`
                            text-left
                            bg-white
                            rounded-2xl
                            border
                            p-5
                            transition
                            hover:shadow-md
                            ${
                                statusFilter === "Pending"
                                    ? "border-[#A16207] ring-2 ring-[#A16207]/10"
                                    : "border-gray-100"
                            }
                        `}
                    >
                        <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                            Pending
                        </p>

                        <p className="font-display text-3xl text-[#A16207] mt-2">
                            {loading ? (
                                <Bone className="w-12 h-8" />
                            ) : (
                                counts.pending
                            )}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                            Awaiting review
                        </p>
                    </button>

                    {/* APPROVED */}

                    <button
                        onClick={() =>
                            setStatusFilter("Approved")
                        }
                        className={`
                            text-left
                            bg-white
                            rounded-2xl
                            border
                            p-5
                            transition
                            hover:shadow-md
                            ${
                                statusFilter === "Approved"
                                    ? "border-[#106A2E] ring-2 ring-[#106A2E]/10"
                                    : "border-gray-100"
                            }
                        `}
                    >
                        <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                            Verified
                        </p>

                        <p className="font-display text-3xl text-[#106A2E] mt-2">
                            {loading ? (
                                <Bone className="w-12 h-8" />
                            ) : (
                                counts.approved
                            )}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                            Successfully verified
                        </p>
                    </button>

                    {/* REJECTED */}

                    <button
                        onClick={() =>
                            setStatusFilter("Rejected")
                        }
                        className={`
                            text-left
                            bg-white
                            rounded-2xl
                            border
                            p-5
                            transition
                            hover:shadow-md
                            ${
                                statusFilter === "Rejected"
                                    ? "border-[#9F3434] ring-2 ring-[#9F3434]/10"
                                    : "border-gray-100"
                            }
                        `}
                    >
                        <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                            Rejected
                        </p>

                        <p className="font-display text-3xl text-[#9F3434] mt-2">
                            {loading ? (
                                <Bone className="w-12 h-8" />
                            ) : (
                                counts.rejected
                            )}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                            Verification rejected
                        </p>
                    </button>

                    {/* REUPLOAD */}

                    <button
                        onClick={() =>
                            setStatusFilter("Re-upload Required")
                        }
                        className={`
                            text-left
                            bg-white
                            rounded-2xl
                            border
                            p-5
                            transition
                            hover:shadow-md
                            ${
                                statusFilter ===
                                "Re-upload Required"
                                    ? "border-blue-500 ring-2 ring-blue-500/10"
                                    : "border-gray-100"
                            }
                        `}
                    >
                        <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                            Re-upload
                        </p>

                        <p className="font-display text-3xl text-blue-600 mt-2">
                            {loading ? (
                                <Bone className="w-12 h-8" />
                            ) : (
                                counts.reupload
                            )}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                            Awaiting new submission
                        </p>
                    </button>

                </div>

                {/* =====================================================
                    TABLE
                ===================================================== */}

                <div className="
                    bg-white
                    rounded-2xl
                    shadow-sm
                    border
                    border-gray-100
                    overflow-hidden
                ">

                    {/* TABLE HEADER */}

                    <div className="
                        px-5
                        sm:px-6
                        py-5
                        border-b
                        border-gray-100
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-center
                        justify-between
                        gap-4
                    ">

                        <div>

                            <h2 className="font-display text-xl text-gray-800">
                                {statusFilter === "Re-upload Required"
                                    ? "Re-upload Required"
                                    : `${statusFilter} Physical IDs`}
                            </h2>

                            <p className="text-xs text-gray-400 mt-1">
                                {filteredRegistrations.length} submission
                                {filteredRegistrations.length !== 1
                                    ? "s"
                                    : ""}{" "}
                                found
                            </p>

                        </div>

                        <button
                            onClick={loadRegistrations}
                            disabled={loading}
                            className="
                                px-4
                                py-2
                                rounded-xl
                                border
                                border-gray-200
                                text-xs
                                font-medium
                                text-gray-600
                                hover:bg-gray-50
                                transition
                                disabled:opacity-50
                            "
                        >
                            {loading ? "Refreshing..." : "↻ Refresh"}
                        </button>

                    </div>

                    {/* FILTER TABS */}

                    <div className="px-5 sm:px-6 py-4 border-b border-gray-100">

                        <div className="flex gap-2 flex-wrap">

                            {[
                                "Pending",
                                "Approved",
                                "Rejected",
                                "Re-upload Required",
                            ].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() =>
                                        setStatusFilter(tab)
                                    }
                                    className={`
                                        px-3.5
                                        py-1.5
                                        rounded-full
                                        text-xs
                                        font-medium
                                        transition
                                        ${
                                            statusFilter === tab
                                                ? "bg-[#106A2E] text-white"
                                                : "bg-[#F7F5EF] text-gray-500 hover:bg-[#ECE9E2]"
                                        }
                                    `}
                                >
                                    {tab}
                                </button>
                            ))}

                        </div>

                    </div>

                    {/* TABLE */}

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[850px]">

                            <thead>

                                <tr className="
                                    bg-[#F7F5EF]
                                    border-b
                                    border-gray-100
                                    text-gray-500
                                    text-xs
                                    uppercase
                                    tracking-wide
                                ">

                                    <th className="p-4 text-left font-medium">
                                        Applicant
                                    </th>

                                    <th className="p-4 text-left font-medium">
                                        ID Number
                                    </th>

                                    <th className="p-4 text-left font-medium">
                                        Account Type
                                    </th>

                                    <th className="p-4 text-left font-medium">
                                        Submitted
                                    </th>

                                    <th className="p-4 text-center font-medium">
                                        Status
                                    </th>

                                    <th className="p-4 text-center font-medium">
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {/* LOADING */}

                                {loading &&
                                    [1, 2, 3, 4].map((item) => (
                                        <tr
                                            key={item}
                                            className="border-b border-gray-100"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <Bone className="w-9 h-9 rounded-full" />

                                                    <div>
                                                        <Bone className="w-36 h-3 mb-2" />
                                                        <Bone className="w-44 h-2.5" />
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <Bone className="w-24 h-3" />
                                            </td>

                                            <td className="p-4">
                                                <Bone className="w-20 h-3" />
                                            </td>

                                            <td className="p-4">
                                                <Bone className="w-20 h-3" />
                                            </td>

                                            <td className="p-4">
                                                <Bone className="w-20 h-6 mx-auto rounded-full" />
                                            </td>

                                            <td className="p-4">
                                                <Bone className="w-16 h-8 mx-auto rounded-lg" />
                                            </td>
                                        </tr>
                                    ))}

                                {/* EMPTY */}

                                {!loading &&
                                    filteredRegistrations.length ===
                                        0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="p-16 text-center"
                                            >
                                                <div className="text-4xl mb-3">
                                                    🪪
                                                </div>

                                                <p className="text-sm font-medium text-gray-600">
                                                    No physical ID submissions found.
                                                </p>

                                                <p className="text-xs text-gray-400 mt-1">
                                                    Try another filter or search term.
                                                </p>
                                            </td>
                                        </tr>
                                    )}

                                {/* DATA */}

                                {!loading &&
                                    filteredRegistrations.map(
                                        (registration) => (
                                            <tr
                                                key={registration.id}
                                                className="
                                                    border-b
                                                    border-gray-100
                                                    last:border-0
                                                    hover:bg-[#F7F5EF]/60
                                                    transition
                                                "
                                            >

                                                {/* APPLICANT */}

                                                <td className="p-4">

                                                    <div className="flex items-center gap-3">

                                                        <div className="
                                                            w-9
                                                            h-9
                                                            rounded-full
                                                            bg-[#E1F0E4]
                                                            text-[#106A2E]
                                                            flex
                                                            items-center
                                                            justify-center
                                                            text-xs
                                                            font-semibold
                                                            flex-shrink-0
                                                        ">
                                                            {getInitials(
                                                                registration.fullName
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="
                                                                font-medium
                                                                text-gray-800
                                                                truncate
                                                                max-w-[220px]
                                                            ">
                                                                {
                                                                    registration.fullName
                                                                }
                                                            </p>

                                                            <p className="
                                                                text-xs
                                                                text-gray-400
                                                                truncate
                                                                max-w-[220px]
                                                            ">
                                                                {
                                                                    registration.email
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* ID */}

                                                <td className="p-4 text-sm text-gray-600">
                                                    {registration.idNumber ||
                                                        "—"}
                                                </td>

                                                {/* ACCOUNT TYPE */}

                                                <td className="p-4">

                                                    <span className="
                                                        inline-flex
                                                        px-3
                                                        py-1
                                                        rounded-full
                                                        bg-gray-100
                                                        text-gray-600
                                                        text-xs
                                                        font-medium
                                                    ">
                                                        {registration.role ||
                                                            "—"}
                                                    </span>

                                                </td>

                                                {/* DATE */}

                                                <td className="p-4 text-sm text-gray-500">

                                                    {registration.createdAt ||
                                                    registration.submittedAt ? (
                                                        new Date(
                                                            registration.createdAt ||
                                                                registration.submittedAt
                                                        ).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            }
                                                        )
                                                    ) : (
                                                        "—"
                                                    )}

                                                </td>

                                                {/* STATUS */}

                                                <td className="p-4 text-center">

                                                    <span
                                                        className={`
                                                            inline-flex
                                                            px-3
                                                            py-1
                                                            rounded-full
                                                            text-xs
                                                            font-medium
                                                            ${getStatusStyle(
                                                                getDisplayStatus(
                                                                    registration
                                                                )
                                                            )}
                                                        `}
                                                    >
                                                        {
                                                            getDisplayStatus(
                                                                registration
                                                            )
                                                        }
                                                    </span>

                                                </td>

                                                {/* ACTION */}

                                                <td className="p-4 text-center">

                                                    <button
                                                        onClick={() =>
                                                            handleView(
                                                                registration.id
                                                            )
                                                        }
                                                        className="
                                                            px-4
                                                            py-1.5
                                                            text-xs
                                                            font-medium
                                                            rounded-lg
                                                            border
                                                            border-[#106A2E]
                                                            text-[#106A2E]
                                                            hover:bg-[#106A2E]
                                                            hover:text-white
                                                            transition
                                                        "
                                                    >
                                                        View
                                                    </button>

                                                </td>

                                            </tr>
                                        )
                                    )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </main>

            {/* =========================================================
                DETAILS MODAL
            ========================================================= */}

            {selectedRegistration && (

                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        bg-black/50
                        backdrop-blur-[2px]
                        flex
                        items-center
                        justify-center
                        p-4
                    "
                    onClick={() =>
                        setSelectedRegistration(null)
                    }
                >

                    <div
                        className="
                            bg-white
                            w-full
                            max-w-4xl
                            max-h-[92vh]
                            overflow-y-auto
                            rounded-3xl
                            shadow-2xl
                        "
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* HEADER */}

                        <div className="
                            flex
                            items-center
                            justify-between
                            px-6
                            py-5
                            border-b
                            border-gray-100
                            sticky
                            top-0
                            bg-white
                            z-10
                        ">

                            <div>

                                <p className="
                                    text-xs
                                    uppercase
                                    tracking-[0.15em]
                                    text-[#106A2E]/70
                                    font-medium
                                ">
                                    Physical ID Verification
                                </p>

                                <h2 className="
                                    font-display
                                    text-xl
                                    text-gray-800
                                    mt-1
                                ">
                                    Review Submission
                                </h2>

                            </div>

                            <button
                                onClick={() =>
                                    setSelectedRegistration(null)
                                }
                                className="
                                    w-9
                                    h-9
                                    rounded-full
                                    bg-gray-100
                                    text-gray-500
                                    flex
                                    items-center
                                    justify-center
                                    text-lg
                                    hover:bg-gray-200
                                    transition
                                "
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>

                        {/* CONTENT */}

                        <div className="p-5 sm:p-6">

                            {detailsLoading ? (

                                <div className="grid md:grid-cols-2 gap-6">

                                    <div className="space-y-5">
                                        <Bone className="w-full h-16" />
                                        <Bone className="w-full h-16" />
                                        <Bone className="w-full h-16" />
                                        <Bone className="w-1/2 h-8" />
                                    </div>

                                    <Bone className="w-full h-[360px]" />

                                </div>

                            ) : (

                                <>

                                    <div className="
                                        grid
                                        grid-cols-1
                                        md:grid-cols-2
                                        gap-7
                                    ">

                                        {/* =================================================
                                            USER INFORMATION
                                        ================================================= */}

                                        <div>

                                            <div className="flex items-center gap-3 mb-6">

                                                <div className="
                                                    w-12
                                                    h-12
                                                    rounded-2xl
                                                    bg-[#E1F0E4]
                                                    text-[#106A2E]
                                                    flex
                                                    items-center
                                                    justify-center
                                                    font-semibold
                                                ">
                                                    {getInitials(
                                                        selectedRegistration.fullName
                                                    )}
                                                </div>

                                                <div>

                                                    <p className="font-semibold text-gray-800">
                                                        {
                                                            selectedRegistration.fullName
                                                        }
                                                    </p>

                                                    <p className="text-xs text-gray-400">
                                                        {
                                                            selectedRegistration.email
                                                        }
                                                    </p>

                                                </div>

                                            </div>

                                            <div className="space-y-5">

                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">
                                                        Full Name
                                                    </p>

                                                    <p className="text-sm font-medium text-gray-800">
                                                        {
                                                            selectedRegistration.fullName ||
                                                                "—"
                                                        }
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">
                                                        ID Number
                                                    </p>

                                                    <p className="text-sm font-medium text-gray-800">
                                                        {
                                                            selectedRegistration.idNumber ||
                                                                "—"
                                                        }
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">
                                                        Email Address
                                                    </p>

                                                    <p className="text-sm font-medium text-gray-800 break-all">
                                                        {
                                                            selectedRegistration.email ||
                                                                "—"
                                                        }
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">
                                                        Account Type
                                                    </p>

                                                    <span className="
                                                        inline-flex
                                                        px-3
                                                        py-1
                                                        rounded-full
                                                        bg-[#106A2E]/10
                                                        text-[#106A2E]
                                                        text-xs
                                                        font-semibold
                                                    ">
                                                        {
                                                            selectedRegistration.role ||
                                                                "—"
                                                        }
                                                    </span>
                                                </div>

                                                {selectedRegistration.program && (
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-1">
                                                            Program
                                                        </p>

                                                        <p className="text-sm font-medium text-gray-800">
                                                            {
                                                                selectedRegistration.program
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {selectedRegistration.department && (
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-1">
                                                            Department
                                                        </p>

                                                        <p className="text-sm font-medium text-gray-800">
                                                            {
                                                                selectedRegistration.department
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                            </div>

                                        </div>

                                        {/* =================================================
                                            PHYSICAL ID PREVIEW
                                        ================================================= */}

                                        <div>

                                            <div className="flex items-center justify-between mb-2">

                                                <p className="
                                                    text-xs
                                                    font-medium
                                                    text-gray-500
                                                ">
                                                    Submitted Physical ID
                                                </p>

                                                <span className="
                                                    text-[11px]
                                                    text-gray-400
                                                ">
                                                    Supporting document
                                                </span>

                                            </div>

                                            {selectedRegistration.physicalIdDocument ? (

                                                <div className="
                                                    border
                                                    border-gray-200
                                                    rounded-2xl
                                                    overflow-hidden
                                                    bg-gray-50
                                                ">

                                                    <img
                                                        src={getDocumentUrl(
                                                            selectedRegistration.physicalIdDocument
                                                        )}
                                                        alt="Submitted physical ID"
                                                        className="
                                                            w-full
                                                            max-h-[400px]
                                                            object-contain
                                                            bg-gray-100
                                                        "
                                                    />

                                                </div>

                                            ) : (

                                                <div className="
                                                    h-[360px]
                                                    rounded-2xl
                                                    border
                                                    border-dashed
                                                    border-gray-300
                                                    bg-gray-50
                                                    flex
                                                    items-center
                                                    justify-center
                                                    text-center
                                                    p-6
                                                ">

                                                    <div>

                                                        <div className="text-4xl mb-3">
                                                            🪪
                                                        </div>

                                                        <p className="
                                                            text-sm
                                                            font-medium
                                                            text-gray-600
                                                        ">
                                                            No physical ID uploaded
                                                        </p>

                                                        <p className="
                                                            text-xs
                                                            text-gray-400
                                                            mt-1
                                                        ">
                                                            The applicant has not submitted a supporting document.
                                                        </p>

                                                    </div>

                                                </div>

                                            )}

                                        </div>

                                    </div>

                                    {/* =================================================
                                        STATUS
                                    ================================================= */}

                                    <div className="
                                        mt-7
                                        p-4
                                        rounded-2xl
                                        bg-[#F7F5EF]
                                        border
                                        border-gray-100
                                    ">

                                        <div className="
                                            flex
                                            flex-col
                                            sm:flex-row
                                            sm:items-center
                                            justify-between
                                            gap-4
                                        ">

                                            <div>

                                                <p className="text-xs text-gray-400 mb-1">
                                                    Current Verification Status
                                                </p>

                                                <span
                                                    className={`
                                                        inline-flex
                                                        px-3
                                                        py-1
                                                        rounded-full
                                                        text-xs
                                                        font-semibold
                                                        ${getStatusStyle(
                                                            getDisplayStatus(
                                                                selectedRegistration
                                                            )
                                                        )}
                                                    `}                                                >
                                                    {getDisplayStatus(selectedRegistration)}
                                                </span>

                                                {getDisplayStatus(selectedRegistration)
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "") === "re-uploadrequired" && (
                                                    <div className="mt-5 pt-4 border-t border-blue-100">
                                                        <p className="text-xs font-semibold text-blue-700 mb-2">
                                                            Re-upload Reason
                                                        </p>

                                                        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                                                            <p className="text-sm text-blue-900 leading-relaxed">
                                                                Please upload a clearer and valid Physical ID.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                            </div>

                                            {selectedRegistration.submittedAt && (
                                                <div className="sm:text-right">

                                                    <p className="text-xs text-gray-400">
                                                        Submitted
                                                    </p>

                                                    <p className="text-sm font-medium text-gray-700 mt-1">
                                                        {new Date(
                                                            selectedRegistration.submittedAt
                                                        ).toLocaleString(
                                                            "en-US",
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                                hour: "numeric",
                                                                minute: "2-digit",
                                                            }
                                                        )}
                                                    </p>

                                                </div>
                                            )}

                                        </div>

                                    </div>

                                </>

                            )}

                        </div>

                        {/* =================================================
                            ACTIONS
                        ================================================= */}

                        {!detailsLoading &&
                            selectedRegistration &&
                            (
                                getDisplayStatus(
                                    selectedRegistration
                                )
                                    .toLowerCase()
                                    .replace(/\s+/g, "") ===
                                    "pending" ||
                                getDisplayStatus(
                                    selectedRegistration
                                )
                                    .toLowerCase()
                                    .replace(/\s+/g, "") ===
                                    "submitted"
                            ) && (

                                <div className="
                                    px-5
                                    py-4
                                    border-t
                                    border-gray-100
                                    flex
                                    flex-col-reverse
                                    sm:flex-row
                                    justify-end
                                    gap-3
                                ">

                                    <button
                                        onClick={() =>
                                            openActionModal(
                                                "reupload",
                                                selectedRegistration
                                            )
                                        }
                                        disabled={actionLoading}
                                        className="
                                            px-5
                                            py-2.5
                                            rounded-xl
                                            bg-blue-50
                                            text-blue-600
                                            border
                                            border-blue-200
                                            text-sm
                                            font-semibold
                                            hover:bg-blue-100
                                            transition
                                            disabled:opacity-50
                                        "
                                    >
                                        Request Re-upload
                                    </button>

                                    <button
                                        onClick={() =>
                                            openActionModal(
                                                "reject",
                                                selectedRegistration
                                            )
                                        }
                                        disabled={actionLoading}
                                        className="
                                            px-5
                                            py-2.5
                                            rounded-xl
                                            bg-rose-50
                                            text-rose-600
                                            border
                                            border-rose-200
                                            text-sm
                                            font-semibold
                                            hover:bg-rose-100
                                            transition
                                            disabled:opacity-50
                                        "
                                    >
                                        Reject
                                    </button>

                                    <button
                                        onClick={() =>
                                            openActionModal(
                                                "approve",
                                                selectedRegistration
                                            )
                                        }
                                        disabled={actionLoading}
                                        className="
                                            px-5
                                            py-2.5
                                            rounded-xl
                                            bg-[#106A2E]
                                            text-white
                                            text-sm
                                            font-semibold
                                            hover:bg-[#0B2F1B]
                                            transition
                                            disabled:opacity-50
                                        "
                                    >
                                        Approve
                                    </button>

                                </div>
                            )}

                    </div>

                </div>

            )}

            {/* =========================================================
                ACTION CONFIRMATION MODAL
            ========================================================= */}

            {actionModal && (

                <div
                    className="
                        fixed
                        inset-0
                        z-[60]
                        bg-black/50
                        backdrop-blur-[2px]
                        flex
                        items-center
                        justify-center
                        p-4
                    "
                    onClick={() => {
                        if (!actionLoading) {
                            closeActionModal();
                        }
                    }}
                >

                    <div
                        className="
                            bg-white
                            w-full
                            max-w-md
                            rounded-3xl
                            shadow-2xl
                            p-6
                        "
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="flex items-start gap-4">

                            <div
                                className={`
                                    w-11
                                    h-11
                                    rounded-2xl
                                    flex
                                    items-center
                                    justify-center
                                    flex-shrink-0
                                    ${
                                        actionModal.type === "approve"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : actionModal.type === "reject"
                                            ? "bg-rose-100 text-rose-700"
                                            : "bg-blue-100 text-blue-700"
                                    }
                                `}
                            >
                                {actionModal.type === "approve"
                                    ? "✓"
                                    : actionModal.type === "reject"
                                    ? "!"
                                    : "↻"}
                            </div>

                            <div>

                                <h3 className="
                                    font-display
                                    text-xl
                                    text-gray-800
                                ">
                                    {actionModal.type === "approve"
                                        ? "Approve Physical ID?"
                                        : actionModal.type === "reject"
                                        ? "Reject Physical ID?"
                                        : "Request Re-upload?"}
                                </h3>

                                <p className="
                                    text-sm
                                    text-gray-500
                                    mt-1
                                ">
                                    {actionModal.type === "approve"
                                        ? `You are about to verify ${actionModal.registration?.fullName}.`
                                        : actionModal.type === "reject"
                                        ? `Please provide a reason for rejecting ${actionModal.registration?.fullName}'s Physical ID.`
                                        : `Please confirm that ${actionModal.registration?.fullName} needs to upload their Physical ID again. The applicant will be asked to submit a clearer and valid Physical ID.`}
                                </p>

                            </div>

                        </div>

                        {/* REASON - REJECT ONLY */}

                        {actionModal.type === "reject" && (

                            <div className="mt-5">

                                <label className="
                                    block
                                    text-xs
                                    font-semibold
                                    text-gray-600
                                    mb-2
                                ">
                                    Rejection Reason
                                </label>

                                <textarea
                                    value={actionReason}
                                    onChange={(e) =>
                                        setActionReason(e.target.value)
                                    }
                                    placeholder="Example: The ID information is unclear or does not match the submitted account details."
                                    rows={4}
                                    className="
                                        w-full
                                        resize-none
                                        border
                                        border-gray-200
                                        rounded-xl
                                        px-4
                                        py-3
                                        text-sm
                                        text-gray-700
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-[#106A2E]/20
                                        focus:border-[#106A2E]
                                    "
                                />

                                <p className="text-[11px] text-gray-400 mt-1">
                                    A rejection reason is required before the registration can be rejected.
                                </p>

                            </div>

                        )}

                        {actionModal.type === "reupload" && (
                            <div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                                <p className="text-xs font-semibold text-blue-700 mb-1">
                                    Re-upload Instruction
                                </p>

                                <p className="text-sm text-blue-900 leading-relaxed">
                                    Please upload a clearer and valid Physical ID.
                                </p>
                            </div>
                        )}

                        {/* BUTTONS */}

                        <div className="
                            flex
                            flex-col-reverse
                            sm:flex-row
                            justify-end
                            gap-3
                            mt-6
                        ">

                            <button
                                onClick={closeActionModal}
                                disabled={!!actionLoading}
                                className="
                                    px-5
                                    py-2.5
                                    rounded-xl
                                    border
                                    border-gray-200
                                    text-sm
                                    font-medium
                                    text-gray-600
                                    hover:bg-gray-50
                                    transition
                                    disabled:opacity-50
                                "
                            >
                                Cancel
                            </button>

                            <button
                                disabled={
                                    !!actionLoading ||
                                    (
                                        actionModal.type === "reject" &&
                                        !actionReason.trim()
                                    )
                                }
                                onClick={() => {

                                    const id =
                                        actionModal.registration.id;

                                    if (
                                        actionModal.type ===
                                        "approve"
                                    ) {
                                        handleApprove(id);
                                    }

                                    if (
                                        actionModal.type ===
                                        "reject"
                                    ) {
                                        handleReject(
                                            id,
                                            actionReason
                                        );
                                    }

                                    if (
                                        actionModal.type ===
                                        "reupload"
                                    ) {
                                        handleRequestReupload(id);
                                    }

                                }}
                                className={`
                                    px-5
                                    py-2.5
                                    rounded-xl
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition
                                    disabled:opacity-50
                                    disabled:cursor-not-allowed
                                    ${
                                        actionModal.type ===
                                        "approve"
                                            ? "bg-[#106A2E] hover:bg-[#0B2F1B]"
                                            : actionModal.type ===
                                              "reject"
                                            ? "bg-[#9F3434] hover:bg-[#842C2C]"
                                            : "bg-blue-600 hover:bg-blue-700"
                                    }
                                `}
                            >
                                {actionLoading
                                    ? "Processing..."
                                    : actionModal.type ===
                                      "approve"
                                    ? "Approve"
                                    : actionModal.type ===
                                      "reject"
                                    ? "Reject"
                                    : "Request Re-upload"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}