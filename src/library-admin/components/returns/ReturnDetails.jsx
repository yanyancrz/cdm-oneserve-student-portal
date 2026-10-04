import { formatDate } from "../../utils/dateUtils";

function Row({ label, value }) {
    return (
        <div>
            <dt className="text-xs text-gray-400">{label}</dt>
            <dd className="mt-0.5 text-sm text-gray-800">{value || "—"}</dd>
        </div>
    );
}

export default function ReturnDetails({ loan }) {
    return (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Row label="Transaction" value={`#${loan.transactionId}`} />
            <Row label="Patron" value={`${loan.patronName} (${loan.patronType || "—"})`} />
            <Row label="ID number" value={loan.patronId} />
            <Row label="Book" value={loan.bookTitle} />
            <Row label="Author" value={loan.author} />
            <Row label="Call number" value={loan.callNo} />
            <Row label="Borrowed" value={formatDate(loan.borrowDate)} />
            <Row label="Due" value={formatDate(loan.dueDate)} />
        </dl>
    );
}