export default function ReservationCard({ reservation, onCancel }) {

    const statusStyles = {
        Waiting: { bg: "#FAEEDA", color: "#633806" },
        "Ready for Pickup": { bg: "#DCFCE7", color: "#106A2E" },
        Cancelled: { bg: "#F3F4F6", color: "#6B7280" },
    };
    const statusStyle = statusStyles[reservation.status] ?? statusStyles.Waiting;

    const isCancelled = reservation.status === "Cancelled";

    return (
        <div className="bg-white/90 rounded-2xl shadow-sm p-4 flex gap-4">

            <img
                src={reservation.coverUrl}
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
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                        {reservation.status}
                    </span>
                </div>

                <p className="text-xs text-gray-500 mb-1">
                    Queue position {reservation.queuePosition} of {reservation.queueLength}
                </p>
                <p className="text-xs text-gray-400 mb-2">
                    Estimated availability: {new Date(reservation.estimatedAvailability).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>

                {!isCancelled && (
                    <button
                        onClick={() => onCancel(reservation.id)}
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