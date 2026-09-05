import { API_URL } from "../../config/api";
import noCover from "../../assets/images/no-cover.png";

export default function ReservationCard({ reservation, onCancel }) {

    const statusConfig = {
    Pending: {
        label: "Pending",
        bg: "#FAEEDA",
        color: "#633806",
    },
    Approved: {
        label: "Ready for Pickup",
        bg: "#DCFCE7",
        color: "#106A2E",
    },
    Cancelled: {
        label: "Cancelled",
        bg: "#F3F4F6",
        color: "#6B7280",
    },
    Rejected: {
        label: "Rejected",
        bg: "#FEE2E2",
        color: "#B91C1C",
    },
    Expired: {
        label: "Expired",
        bg: "#F3F4F6",
        color: "#6B7280",
    },
    Claimed: {
        label: "Claimed",
        bg: "#E1F5EE",
        color: "#106A2E",
    },
};

const status =
    statusConfig[reservation.status] ??
    statusConfig.Pending;

const canCancel = reservation.status === "Pending";

    return (
        <div className="bg-white/90 rounded-2xl shadow-sm p-4 flex gap-4">

            <img
                src={
                    reservation.coverImage
                        ? `${API_URL}/${reservation.coverImage}`
                        : noCover
                }
                onError={(e) => {
                    e.currentTarget.src = noCover;
                }}
                alt={`Cover of ${reservation.bookTitle}`}
                className="w-16 rounded-lg flex-shrink-0 object-cover"
                style={{ height: "5.5rem" }}
            />

            <div className="flex-1 min-w-0">

                <div className="flex items-start justify-between gap-2 mb-1.5">

                    <h3 className="text-sm font-semibold text-[#1F1F1F] leading-snug truncate">
                        {reservation.bookTitle}
                    </h3>

                    <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                            background: status.bg,
                            color: status.color
                        }}
                    >
                        {status.label}
                    </span>

                </div>

                <p className="text-xs text-gray-500 mb-1">
                    Reserved:{" "}
                    {new Date(reservation.reservationAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </p>

                <p className="text-xs text-gray-400 mb-2">
                    Expires:{" "}
                    {new Date(reservation.expirationDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </p>

                {reservation.status === "Approved" && (
                    <p className="text-xs font-semibold text-[#106A2E] mb-2">
                        This book is ready for pickup at the library.
                    </p>
                )}

                {reservation.status === "Expired" && (
                    <p className="text-xs text-red-500 mb-2">
                        This reservation has expired.
                    </p>
                )}

                {canCancel && (
                    <button
                        onClick={() =>
                            onCancel(reservation.reservationId)
                        }
                        className="
                            text-xs font-semibold text-[#712B13]
                            hover:underline
                        "
                    >
                        Cancel Reservation
                    </button>
                )}

            </div>

        </div>
    );
}