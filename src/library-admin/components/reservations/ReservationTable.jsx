import { BookOpen, Ban, Eye, X } from "lucide-react";

import { fileUrl } from "../../services/bookService";
import ReservationStatusBadge from "./ReservationStatusBadge";
import {
    ACTION_LABELS,
    availableActions,
    describeExpiry,
    formatDate,
    primaryAction,
} from "../../utils/reservationUtils";

function Cover({ book }) {
    const src = fileUrl(book.coverImage);

    return src ? (
        <img src={src} alt="" className="h-12 w-9 shrink-0 rounded-md object-cover" loading="lazy" />
    ) : (
        <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md bg-[#E1F0E4] text-[#106A2E]">
            <BookOpen size={16} />
        </div>
    );
}

const iconBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#106A2E]";

// The Patron column stays pinned on the left while the rest scrolls sideways.
const stickyPatron = "sticky left-0 z-10 shadow-[1px_0_0_rgba(0,0,0,0.05)]";

const EXPIRY_TONE = {
    muted: "text-gray-400",
    normal: "text-gray-700",
    warn: "text-amber-700",
    danger: "font-medium text-red-600",
};

export default function ReservationTable({ reservations, canHead, onView, onAction }) {
    const now = new Date();

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                    <tr className="whitespace-nowrap text-xs uppercase tracking-wide text-gray-400">
                        <th className={`${stickyPatron} bg-white px-5 py-3 font-medium`}>Patron</th>
                        <th className="px-3 py-3 font-medium">Book</th>
                        <th className="px-3 py-3 font-medium">Reserved on</th>
                        <th className="px-3 py-3 font-medium">Expires</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>

                {/* whitespace-nowrap keeps every row one line tall; long text is cut with a tooltip. */}
                <tbody className="divide-y divide-black/[0.04] whitespace-nowrap">
                    {reservations.map((item) => {
                        const expiry = describeExpiry(item, now);
                        const primary = primaryAction(item, canHead);
                        const actions = availableActions(item, canHead);

                        return (
                            <tr key={item.reservationId} className="group">
                                <td className={`${stickyPatron} bg-white px-5 py-3 group-hover:bg-gray-50`}>
                                    <p
                                        className="max-w-[200px] truncate font-medium text-[#1F1F1F]"
                                        title={item.patronName}
                                    >
                                        {item.patronName}
                                    </p>
                                    <p className="max-w-[200px] truncate text-xs text-gray-400">
                                        {item.patronId || "No ID"} · {item.patronType || "—"}
                                    </p>
                                </td>

                                <td className="px-3 py-3 group-hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <Cover book={item} />

                                        <div className="min-w-0">
                                            <p
                                                className="max-w-[220px] truncate font-medium text-[#1F1F1F]"
                                                title={item.bookTitle}
                                            >
                                                {item.bookTitle}
                                            </p>
                                            <p className="max-w-[220px] truncate text-xs text-gray-400" title={item.author}>
                                                {item.author || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-3 py-3 text-gray-600 group-hover:bg-gray-50">
                                    {formatDate(item.reservationAt)}
                                </td>

                                <td className="px-3 py-3 group-hover:bg-gray-50">
                                    <p className={EXPIRY_TONE[expiry.tone]}>{expiry.text}</p>
                                    {expiry.sub && <p className="text-xs text-gray-400">{expiry.sub}</p>}
                                </td>

                                <td className="px-3 py-3 group-hover:bg-gray-50">
                                    <ReservationStatusBadge status={item.displayStatus} />
                                </td>

                                <td className="px-5 py-3 group-hover:bg-gray-50">
                                    <div className="flex items-center justify-end gap-1">
                                        {primary && (
                                            <button
                                                type="button"
                                                onClick={() => onAction(primary, item)}
                                                className="mr-1 rounded-lg bg-[#106A2E] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                                            >
                                                {ACTION_LABELS[primary]}
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className={`${iconBtn} hover:text-[#106A2E]`}
                                            onClick={() => onView(item)}
                                            aria-label={`View reservation #${item.reservationId}`}
                                            title="View details"
                                        >
                                            <Eye size={17} />
                                        </button>

                                        {actions.includes("reject") && (
                                            <button
                                                type="button"
                                                className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}
                                                onClick={() => onAction("reject", item)}
                                                aria-label={`Reject reservation #${item.reservationId}`}
                                                title="Reject"
                                            >
                                                <X size={17} />
                                            </button>
                                        )}

                                        {actions.includes("cancel") && (
                                            <button
                                                type="button"
                                                className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}
                                                onClick={() => onAction("cancel", item)}
                                                aria-label={`Cancel reservation #${item.reservationId}`}
                                                title="Cancel reservation"
                                            >
                                                <Ban size={17} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}