import { useState } from "react";
import { BookOpen } from "lucide-react";

import Modal from "../common/Modal";
import StatusBadge from "../common/StatusBadge";
import MarcRecord from "./MarcRecord";
import PdfReader from "./PdfReader";
import { fileUrl } from "../../services/bookService";

const TABS = [
    { key: "overview", label: "Overview" },
    { key: "marc", label: "MARC 21" },
    { key: "reader", label: "Digital Reader" },
];

function Detail({ label, value }) {
    return (
        <div>
            <dt className="text-xs text-gray-400">{label}</dt>
            <dd className="mt-0.5 text-sm text-gray-800">{value || "—"}</dd>
        </div>
    );
}

export default function BookPreviewModal({ book, onClose }) {
    const [tab, setTab] = useState("overview");

    if (!book) return null;

    const cover = fileUrl(book.coverImage);

    const availability =
        book.availableCopies <= 0 ? (
            <StatusBadge tone="red">Unavailable</StatusBadge>
        ) : book.availableCopies < book.totalCopies ? (
            <StatusBadge tone="amber">Some borrowed</StatusBadge>
        ) : (
            <StatusBadge tone="green">Available</StatusBadge>
        );

    return (
        <Modal open onClose={onClose} title={book.title} size="lg">
            <div className="mb-5 flex gap-1 border-b border-black/[0.06]">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                            tab === t.key
                                ? "border-[#106A2E] text-[#106A2E]"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "overview" && (
                <div className="flex flex-col gap-6 md:flex-row">
                    <div className="shrink-0">
                        {cover ? (
                            <img src={cover} alt="" className="h-56 w-40 rounded-xl object-cover shadow-sm" />
                        ) : (
                            <div className="flex h-56 w-40 items-center justify-center rounded-xl bg-[#E1F0E4] text-[#106A2E]">
                                <BookOpen size={36} />
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            {availability}
                            <span className="text-xs text-gray-500">
                                {book.availableCopies} of {book.totalCopies} copies on the shelf
                            </span>
                        </div>

                        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
                            <Detail label="Author" value={book.author} />
                            <Detail label="ISBN" value={book.isbn} />
                            <Detail label="Call number" value={book.callNo} />
                            <Detail label="Category" value={book.category} />
                            <Detail label="Institute" value={book.institute} />
                            <Detail label="Shelf" value={book.shelfLocation} />
                            <Detail label="Year level" value={book.yearLevel} />
                            <Detail label="Semester" value={book.semester} />
                            <Detail label="Times borrowed" value={String(book.borrowCount)} />
                        </dl>

                        {book.description && (
                            <p className="mt-5 text-sm leading-relaxed text-gray-600">{book.description}</p>
                        )}
                    </div>
                </div>
            )}

            {tab === "marc" && <MarcRecord book={book} />}

            {tab === "reader" && <PdfReader pdfFile={book.pdfFile} title={book.title} />}
        </Modal>
    );
}