import { useState } from "react";

import Modal from "../common/Modal";
import { formatDate, formatDateTime } from "../../utils/reservationUtils";

const MAX_REASON = 300;
const LOAN_DAY_OPTIONS = [3, 7, 14];
const DEFAULT_LOAN_DAYS = 7;

const cancelBtn =
    "rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50";
const primaryBtn =
    "rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60";
const dangerBtn =
    "rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60";

function Summary({ item }) {
    return (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <p className="font-medium text-[#1F1F1F]">{item.bookTitle}</p>
            <p className="text-xs text-gray-500">
                {item.patronName}
                {item.patronId ? ` · ${item.patronId}` : ""}
                {item.patronType ? ` · ${item.patronType}` : ""}
            </p>
        </div>
    );
}

// =========================================================
// APPROVE / MARK READY
// =========================================================
const CONFIRM_COPY = {
    approve: {
        title: "Approve reservation",
        button: "Approve",
        message: "The patron will be notified. A copy is set aside later, when you mark it ready for pickup.",
    },
    ready: {
        title: "Mark ready for pickup",
        button: "Mark ready",
        message:
            "One copy is taken off the shelf for this patron and held until the pickup deadline. The patron will be notified.",
    },
};

export function ConfirmReservationModal({ action, item, onConfirm, onClose }) {
    const [saving, setSaving] = useState(false);
    const copy = CONFIRM_COPY[action];

    const submit = async () => {
        setSaving(true);
        const result = await onConfirm();
        setSaving(false);

        if (result?.ok) onClose();
    };

    return (
        <Modal
            open
            onClose={saving ? undefined : onClose}
            size="sm"
            title={copy.title}
            footer={
                <>
                    <button type="button" onClick={onClose} disabled={saving} className={cancelBtn}>
                        Cancel
                    </button>
                    <button type="button" onClick={submit} disabled={saving} className={primaryBtn}>
                        {saving ? "Saving..." : copy.button}
                    </button>
                </>
            }
        >
            <div className="space-y-3">
                <Summary item={item} />
                <p className="text-sm text-gray-600">{copy.message}</p>
            </div>
        </Modal>
    );
}

// =========================================================
// REJECT (reason required) / CANCEL (reason optional)
// =========================================================
const REASON_COPY = {
    reject: {
        title: "Reject reservation",
        button: "Reject reservation",
        label: "Reason for rejecting",
        required: true,
        help: "The patron sees this reason in their notification.",
    },
    cancel: {
        title: "Cancel reservation",
        button: "Cancel reservation",
        label: "Reason for cancelling (optional)",
        required: false,
        help: "If a copy was set aside, it goes back on the shelf.",
    },
};

export function ReasonReservationModal({ action, item, onConfirm, onClose }) {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const copy = REASON_COPY[action];

    const submit = async (e) => {
        e.preventDefault();

        const text = reason.trim();

        if (copy.required && !text) {
            setError("Enter the reason for rejecting this reservation.");
            return;
        }

        setSaving(true);
        const result = await onConfirm(text);
        setSaving(false);

        if (result?.ok) onClose();
    };

    return (
        <Modal
            open
            onClose={saving ? undefined : onClose}
            size="sm"
            title={copy.title}
            footer={
                <>
                    <button type="button" onClick={onClose} disabled={saving} className={cancelBtn}>
                        Keep reservation
                    </button>
                    <button type="submit" form="reservation-reason-form" disabled={saving} className={dangerBtn}>
                        {saving ? "Saving..." : copy.button}
                    </button>
                </>
            }
        >
            <form id="reservation-reason-form" onSubmit={submit} noValidate className="space-y-3">
                <Summary item={item} />

                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">{copy.label}</span>
                    <textarea
                        rows={4}
                        maxLength={MAX_REASON}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (error) setError("");
                        }}
                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:ring-2 ${
                            error
                                ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
                                : "border-black/[0.12] focus:border-[#106A2E] focus:ring-[#106A2E]/15"
                        }`}
                    />
                    <span className="mt-1 flex justify-between text-[11px]">
                        <span className={error ? "text-red-600" : "text-gray-400"}>{error || copy.help}</span>
                        <span className="tabular-nums text-gray-400">
                            {reason.length}/{MAX_REASON}
                        </span>
                    </span>
                </label>
            </form>
        </Modal>
    );
}

// =========================================================
// CLAIM = issue the reserved book as a loan
// =========================================================
function Receipt({ receipt }) {
    const rows = [
        ["Patron", `${receipt.patronName}${receipt.patronId ? ` · ${receipt.patronId}` : ""}`],
        ["Book", receipt.bookTitle],
        ["Borrowed on", formatDateTime(receipt.borrowDate)],
        [
            "Due date",
            receipt.isInsideLibraryOnly
                ? `${formatDateTime(receipt.dueDate)} (before closing)`
                : formatDate(receipt.dueDate),
        ],
        [
            "Loan period",
            receipt.isInsideLibraryOnly ? "Inside library use only" : `${receipt.loanDays} days`,
        ],
        ["Slots left", String(receipt.remainingSlots)],
        ["Processed by", receipt.processedBy],
    ];

    return (
        <div className="space-y-3">
            <p className="rounded-lg bg-[#E1F0E4] px-4 py-3 text-sm font-medium text-[#106A2E]">
                Book issued. Loan #{receipt.transactionId} was created.
            </p>

            <dl className="divide-y divide-black/[0.05] text-sm">
                {rows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-2">
                        <dt className="text-gray-500">{label}</dt>
                        <dd className="text-right font-medium text-[#1F1F1F]">{value || "—"}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export function ClaimReservationModal({ item, onConfirm, onClose }) {
    const forcedInside = Boolean(item?.willBeInsideUse);
    const [loanDays, setLoanDays] = useState(DEFAULT_LOAN_DAYS);
    const [insideOnly, setInsideOnly] = useState(forcedInside);
    const [accepted, setAccepted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [receipt, setReceipt] = useState(null);

    const inside = forcedInside || insideOnly;

    const dueDate = new Date();

    if (inside) {
        dueDate.setHours(17, 0, 0, 0);
    } else {
        dueDate.setDate(dueDate.getDate() + loanDays);
    }

    const submit = async () => {
        setSaving(true);
        const result = await onConfirm({
            loanDays,
            insideLibraryOnly: inside,
            acceptedTerms: accepted,
        });
        setSaving(false);

        if (result?.ok) setReceipt(result.data);
    };

    return (
        <Modal
            open
            onClose={saving ? undefined : onClose}
            size="sm"
            title={receipt ? "Book issued" : "Claim reserved book"}
            footer={
                receipt ? (
                    <button type="button" onClick={onClose} className={primaryBtn}>
                        Done
                    </button>
                ) : (
                    <>
                        <button type="button" onClick={onClose} disabled={saving} className={cancelBtn}>
                            Cancel
                        </button>
                        <button type="button" onClick={submit} disabled={saving || !accepted} className={primaryBtn}>
                            {saving ? "Issuing..." : "Issue book"}
                        </button>
                    </>
                )
            }
        >
            {receipt ? (
                <Receipt receipt={receipt} />
            ) : (
                <div className="space-y-4">
                    <Summary item={item} />

                    <div
                        className={`rounded-xl border p-3 ${
                            inside
                                ? "border-amber-200 bg-amber-50"
                                : "border-black/[0.08] bg-gray-50"
                        }`}
                    >
                        <label className="flex items-start gap-2 text-xs text-gray-700">
                            <input
                                type="checkbox"
                                checked={inside}
                                disabled={forcedInside || saving}
                                onChange={(e) => setInsideOnly(e.target.checked)}
                                className="mt-0.5"
                            />
                            <span>
                                <span className="font-semibold">Borrowed inside library only</span>
                                <span className="mt-0.5 block text-[11px] leading-4 text-gray-500">
                                    {forcedInside
                                        ? "No other copy is left on the shelf. This copy cannot be brought home and is due back before 5:00 PM today."
                                        : "Use this when the patron will read the book inside the library. It is due back before 5:00 PM today."}
                                </span>
                            </span>
                        </label>
                    </div>

                    <div>
                        {inside ? (
                            <p className="rounded-lg bg-[#FFF7E6] px-3 py-2 text-xs leading-5 text-amber-900">
                                No 3/7/14-day loan period. Due back today at{" "}
                                <span className="font-semibold">5:00 PM</span> (
                                {formatDateTime(dueDate)}). The server confirms the final deadline.
                            </p>
                        ) : (
                            <>
                                <span className="mb-1 block text-xs font-medium text-gray-600">Loan period</span>

                                <div className="flex gap-2" role="group" aria-label="Loan period">
                                    {LOAN_DAY_OPTIONS.map((days) => (
                                        <button
                                            key={days}
                                            type="button"
                                            aria-pressed={loanDays === days}
                                            onClick={() => setLoanDays(days)}
                                            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                                loanDays === days
                                                    ? "border-[#106A2E] bg-[#E1F0E4] text-[#106A2E]"
                                                    : "border-black/[0.12] text-gray-600 hover:bg-gray-50"
                                            }`}
                                        >
                                            {days} days
                                        </button>
                                    ))}
                                </div>

                                <p className="mt-2 text-xs text-gray-500">Due on {formatDate(dueDate)}.</p>
                            </>
                        )}
                    </div>

                    <label className="flex items-start gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#106A2E]"
                        />
                        <span>The patron has been told the borrowing terms: a late return bans borrowing until the end of the current semester, and a lost or damaged book must be replaced with an exact copy.</span>
                    </label>
                </div>
            )}
        </Modal>
    );
}