import { CheckCircle2 } from "lucide-react";

import { formatDate } from "../../utils/dateUtils";
import { formatPeso } from "../../utils/currencyUtils";

function Row({ label, value }) {
    return (
        <div className="flex justify-between gap-4 py-1.5 text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-right font-medium text-gray-800">{value || "—"}</dd>
        </div>
    );
}

export default function BorrowReceipt({ receipt, onBorrowAnother, onDone }) {
    return (
        <div className="rounded-2xl border border-[#106A2E]/20 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
                <CheckCircle2 size={40} className="text-[#106A2E]" />
                <h2 className="mt-2 text-lg font-semibold text-[#1F1F1F]">Book issued</h2>
                <p className="text-xs text-gray-500">Transaction #{receipt.transactionId}</p>
            </div>

            <dl className="mt-5 divide-y divide-black/[0.05] border-y border-black/[0.05]">
                <Row label="Patron" value={`${receipt.patronName} (${receipt.patronId || "no ID"})`} />
                <Row label="Type" value={receipt.patronType} />
                <Row label="Book" value={receipt.bookTitle} />
                <Row label="Author" value={receipt.author} />
                <Row label="ISBN" value={receipt.isbn} />
                <Row label="Call no." value={receipt.callNo} />
                <Row label="Borrowed" value={formatDate(receipt.borrowDate)} />
                <Row label="Due date" value={formatDate(receipt.dueDate)} />
                <Row label="Overdue fine" value={`${formatPeso(receipt.finePerDay)} per day`} />
                <Row label="Slots left" value={String(receipt.remainingSlots)} />
                <Row label="Processed by" value={receipt.processedBy} />
            </dl>

            <div className="mt-5 flex gap-2">
                <button
                    type="button"
                    onClick={onBorrowAnother}
                    className="flex-1 rounded-lg bg-[#106A2E] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                    Borrow another book
                </button>
                <button
                    type="button"
                    onClick={onDone}
                    className="flex-1 rounded-lg border border-black/[0.1] px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    Done
                </button>
            </div>
        </div>
    );
}