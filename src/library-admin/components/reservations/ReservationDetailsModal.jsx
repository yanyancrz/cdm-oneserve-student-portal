import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

import Modal from "../common/Modal";
import { fileUrl } from "../../services/bookService";
import { reservationService } from "../../services/reservationService";
import ReservationStatusBadge from "./ReservationStatusBadge";
import {
    ACTION_LABELS,
    availableActions,
    describeExpiry,
    formatDateTime,
    primaryAction,
} from "../../utils/reservationUtils";

function Info({ label, children }) {
    return (
        <div className="min-w-0">
            <dt className="mb-0.5 text-xs text-gray-400">{label}</dt>
            <dd className="truncate text-sm font-medium text-[#1F1F1F]" title={typeof children === "string" ? children : undefined}>
                {children || "—"}
            </dd>
        </div>
    );
}

function Block({ title, children }) {
    return (
        <section className="border-t border-black/[0.06] pt-5 first:border-t-0 first:pt-0">
            <h3 className="mb-3 text-sm font-semibold text-[#1F1F1F]">{title}</h3>
            {children}
        </section>
    );
}

function Skeleton() {
    return (
        <div className="space-y-4" aria-busy="true" aria-label="Loading reservation">
            {[0, 1, 2].map((n) => (
                <div key={n} className="h-24 animate-pulse rounded-lg bg-gray-100" />
            ))}
        </div>
    );
}

const EXPIRY_TONE = {
    muted: "text-gray-500",
    normal: "text-gray-700",
    warn: "text-amber-700",
    danger: "font-medium text-red-600",
};

export default function ReservationDetailsModal({ reservationId, canHead, onAction, onClose }) {
    const [details, setDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        setDetails(null);
        setError(null);

        reservationService
            .get(reservationId, { signal: controller.signal })
            .then(setDetails)
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load this reservation.");
            });

        return () => controller.abort();
    }, [reservationId]);

    const actions = details ? availableActions(details, canHead) : [];
    const primary = details ? primaryAction(details, canHead) : null;
    const coverSrc = details ? fileUrl(details.coverImage) : "";
    const expiry = details ? describeExpiry(details) : null;

    const footer = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
                Close
            </button>

            {actions.map((type) => {
                const isPrimary = type === primary;
                const danger = type === "reject" || type === "cancel";

                return (
                    <button
                        key={type}
                        type="button"
                        onClick={() => onAction(type, details)}
                        className={
                            isPrimary
                                ? "rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                                : danger
                                ? "rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                : "rounded-lg border border-black/[0.12] px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        }
                    >
                        {ACTION_LABELS[type]}
                    </button>
                );
            })}
        </>
    );

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            title={details ? `Reservation #${details.reservationId}` : "Reservation"}
            footer={footer}
        >
            {error ? (
                <p className="py-8 text-center text-sm text-gray-500">{error}</p>
            ) : !details ? (
                <Skeleton />
            ) : (
                <div className="space-y-5">
                    {details.borrowBlockReason && (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            This patron cannot borrow right now. {details.borrowBlockReason}
                        </p>
                    )}

                    <Block title="Reservation">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
                            <div>
                                <dt className="mb-1 text-xs text-gray-400">Status</dt>
                                <dd><ReservationStatusBadge status={details.displayStatus} /></dd>
                            </div>
                            <Info label="Reserved on">{formatDateTime(details.reservationAt)}</Info>
                            <div className="min-w-0">
                                <dt className="mb-0.5 text-xs text-gray-400">Expires</dt>
                                <dd className="text-sm">
                                    <span className={EXPIRY_TONE[expiry.tone]}>{expiry.text}</span>
                                    <span className="block truncate text-xs text-gray-400">
                                        {formatDateTime(details.expirationDate)}
                                    </span>
                                </dd>
                            </div>
                            <Info label="Copy set aside">{details.holdsCopy ? "Yes" : "No"}</Info>
                        </dl>

                        {details.remarks && (
                            <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                {details.remarks}
                            </p>
                        )}
                    </Block>

                    <Block title="Patron">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
                            <Info label="Name">{details.patronName}</Info>
                            <Info label="ID number">{details.patronId}</Info>
                            <Info label="Type">{details.patronType}</Info>
                            <Info label="Institute">{details.institute}</Info>
                            <Info label="Email">{details.patronEmail}</Info>
                            <Info label="Course">{details.course}</Info>
                            <Info label="Year level">{details.yearLevel}</Info>
                            <Info label="Account">{details.accountStatus}</Info>
                            <Info label="Borrowing">
                                {details.borrowLimit > 0 ? `${details.activeLoans} of ${details.borrowLimit} books` : ""}
                            </Info>
                        </dl>
                    </Block>

                    <Block title="Book">
                        <div className="flex gap-4">
                            {coverSrc ? (
                                <img src={coverSrc} alt="" className="h-28 w-20 shrink-0 rounded-md object-cover" />
                            ) : (
                                <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-md bg-[#E1F0E4] text-[#106A2E]">
                                    <BookOpen size={22} />
                                </div>
                            )}

                            <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3">
                                <div className="col-span-2 min-w-0 md:col-span-3">
                                    <dt className="mb-0.5 text-xs text-gray-400">Title</dt>
                                    <dd className="text-sm font-medium text-[#1F1F1F]">{details.bookTitle}</dd>
                                </div>
                                <Info label="Author">{details.author}</Info>
                                <Info label="ISBN">{details.isbn}</Info>
                                <Info label="Call number">{details.callNo}</Info>
                                <Info label="Shelf">{details.shelfLocation}</Info>
                                <Info label="On the shelf">
                                    {`${details.availableCopies} of ${details.totalCopies} copies`}
                                </Info>
                            </dl>
                        </div>
                    </Block>
                </div>
            )}
        </Modal>
    );
}