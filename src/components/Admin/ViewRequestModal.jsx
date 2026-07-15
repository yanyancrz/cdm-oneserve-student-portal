import { API_URL } from "../../config/api";

export default function ViewRequestModal({
    request,
    onClose,
    onForApproval,
    onForRejection
}) {

    if (!request) return null;

    const statusStyles = {
        pending: "bg-amber-100 text-amber-700",
        approved: "bg-emerald-100 text-emerald-700",
        rejected: "bg-rose-100 text-rose-700",
    };

    const statusStyle =
        statusStyles[request.status?.toLowerCase()] || "bg-gray-100 text-gray-600";

    const isPending = request.status === "Pending";

    const InfoField = ({ label, value }) => (
        <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
                {label}
            </p>
            <p className="font-semibold text-gray-800 mt-0.5">
                {value || "-"}
            </p>
        </div>
    );

    return (

        <div
            className="
                fixed
                inset-0
                bg-black/60
                backdrop-blur-sm
                flex
                items-center
                justify-center
                z-50
                p-4
            "
        >

            <div
                className="
                    bg-white
                    rounded-3xl
                    shadow-2xl
                    w-full
                    max-w-4xl
                    overflow-hidden
                    animate-[fadeIn_0.15s_ease-out]
                "
            >

                {/* HEADER */}

                <div
                    className="px-8 py-6 flex items-center justify-between"
                    style={{ background: "#0E3B22" }}
                >

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Digital ID Verification
                        </h2>

                        <p className="text-sm text-white/50 mt-1">
                            Request #{request.id}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="
                            text-white/60
                            hover:text-white
                            hover:bg-white/10
                            rounded-full
                            p-2
                            transition
                        "
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>

                </div>

                {/* CONTENT */}

                <div className="grid md:grid-cols-[280px_1fr] gap-8 p-8 max-h-[70vh] overflow-y-auto">

                    {/* LEFT */}

                    <div>

                        <div
                            className="
                                border
                                border-gray-100
                                rounded-3xl
                                overflow-hidden
                                bg-slate-50
                                shadow-sm
                            "
                        >

                            <img
                                src={
                                    request.profilePicture
                                        ? `${API_URL}${request.profilePicture}`
                                        : "/default-avatar.png"
                                }
                                alt="Profile"
                                className="
                                    w-full
                                    h-[320px]
                                    object-cover
                                "
                            />

                        </div>

                        <div className="mt-4 text-center">
                            <p className="font-bold text-gray-800 text-lg">
                                {request.fullName}
                            </p>
                            <p className="text-sm text-gray-400">
                                {request.role}
                            </p>
                        </div>

                    </div>

                    {/* RIGHT */}

                    <div>

                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                Applicant Details
                            </h3>

                            <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusStyle}`}
                            >
                                {request.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-5 gap-x-6 bg-[#F7F5EF] rounded-2xl p-5">

                            <InfoField label="Full Name" value={request.fullName} />
                            <InfoField label="Role" value={request.role} />

                            {request.role === "Student" && (
                                <>
                                    <InfoField label="Student Number" value={request.idNumber} />
                                </>
                            )}

                            {request.role === "Faculty" && (
                                <>
                                    <InfoField label="Faculty ID Number" value={request.facultyidNumber} />
                                    <InfoField label="Position" value={request.position} />
                                </>
                            )}

                            <InfoField label="Institute" value={request.institute} />
                            <InfoField label="Course" value={request.course} />
                            <InfoField label="Year Level" value={request.yearLevel} />

                        </div>

                        <div className="mt-5">

                            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">
                                Address
                            </p>

                            <p className="font-medium text-gray-700 leading-relaxed">
                                {request.address || "-"}
                            </p>

                        </div>

                    </div>

                </div>

                {/* FOOTER */}

                <div
                    className="
                        border-t
                        border-gray-100
                        px-8
                        py-5
                        flex
                        justify-end
                        gap-3
                    "
                >

                    <button
                        onClick={onClose}
                        className="
                            px-5
                            py-2.5
                            rounded-xl
                            text-sm
                            font-medium
                            text-gray-600
                            bg-gray-100
                            hover:bg-gray-200
                            transition
                        "
                    >
                        Close
                    </button>

                    {isPending && (
                        <>
                            <button
                                onClick={() => onForRejection(request.id)}
                                className="
                                    px-5
                                    py-2.5
                                    rounded-xl
                                    text-sm
                                    font-medium
                                    bg-rose-500
                                    text-white
                                    hover:bg-rose-600
                                    transition
                                "
                            >
                                For Rejection
                            </button>

                            <button
                                onClick={() => onForApproval(request.id)}
                                className="
                                    px-5
                                    py-2.5
                                    rounded-xl
                                    text-sm
                                    font-medium
                                    bg-[#0E3B22]
                                    text-white
                                    hover:bg-[#0c3019]
                                    transition
                                "
                            >
                                For Approval
                            </button>
                        </>
                    )}

                </div>

            </div>

        </div>

    );
}