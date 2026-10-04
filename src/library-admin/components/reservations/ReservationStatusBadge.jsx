import { statusLabel } from "../../utils/reservationUtils";

const STYLES = {
    Reserved: "bg-sky-50 text-sky-700",
    Pending: "bg-amber-50 text-amber-700",
    Approved: "bg-indigo-50 text-indigo-700",
    ReadyForPickup: "bg-[#E1F0E4] text-[#106A2E]",
    Claimed: "bg-teal-50 text-teal-700",
    Rejected: "bg-red-50 text-red-700",
    Cancelled: "bg-gray-100 text-gray-500",
    Expired: "bg-orange-50 text-orange-700",
};

export default function ReservationStatusBadge({ status }) {
    return (
        <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                STYLES[status] || "bg-gray-100 text-gray-600"
            }`}
        >
            {statusLabel(status)}
        </span>
    );
}