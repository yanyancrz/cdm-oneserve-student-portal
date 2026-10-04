import { BookOpen, Eye, FileText, Pencil, Trash2 } from "lucide-react";

import { fileUrl } from "../../services/bookService";

function Availability({ book }) {
    const out = book.totalCopies - book.availableCopies;

    const base = "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium";

    if (book.availableCopies <= 0) {
        return <span className={`${base} bg-red-50 text-red-600`}>Unavailable</span>;
    }

    if (out > 0) {
        return <span className={`${base} bg-[#FBF1CC] text-[#8A6D00]`}>{out} out</span>;
    }

    return <span className={`${base} bg-[#E1F0E4] text-[#106A2E]`}>Available</span>;
}

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

const iconBtn = "rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100";

export default function BookTable({ books, canDelete, onView, onEdit, onDelete }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed text-left text-sm">
                <colgroup>
                    <col />
                    <col className="w-[90px]" />
                    <col className="w-[90px]" />
                    <col className="w-[110px]" />
                    <col className="w-[120px]" />
                </colgroup>

                <thead>
                    <tr className="text-xs uppercase tracking-wide text-gray-400">
                        <th className="px-5 py-3 font-medium">Book</th>
                        <th className="px-3 py-3 font-medium">Institute</th>
                        <th className="px-3 py-3 text-right font-medium">Copies</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-black/[0.04]">
                    {books.map((book) => (
                        <tr key={book.bookId} className="hover:bg-gray-50/60">
                            <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <Cover book={book} />

                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-[#1F1F1F]" title={book.title}>
                                            {book.title}
                                        </p>

                                        <p className="truncate text-xs text-gray-500">{book.author}</p>

                                        <p className="mt-0.5 flex items-center gap-2 truncate text-[11px] text-gray-400">
                                            <span className="truncate">
                                                {book.callNo || book.isbn || "No call number"}
                                            </span>

                                            {book.pdfFile && (
                                                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-[#E1F0E4] px-1.5 py-0.5 text-[10px] font-medium text-[#106A2E]">
                                                    <FileText size={10} /> PDF
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </td>

                            <td className="px-3 py-3 text-gray-600">{book.institute || "—"}</td>

                            <td
                                className="px-3 py-3 text-right text-gray-700"
                                title={`${book.borrowCount} time${book.borrowCount === 1 ? "" : "s"} borrowed in total`}
                            >
                                {book.availableCopies} / {book.totalCopies}
                            </td>

                            <td className="px-3 py-3">
                                <Availability book={book} />
                            </td>

                            <td className="px-5 py-3">
                                <div className="flex justify-end gap-0.5">
                                    <button type="button" className={iconBtn} onClick={() => onView(book)} aria-label={`View ${book.title}`}>
                                        <Eye size={16} />
                                    </button>

                                    <button type="button" className={iconBtn} onClick={() => onEdit(book)} aria-label={`Edit ${book.title}`}>
                                        <Pencil size={16} />
                                    </button>

                                    {canDelete && (
                                        <button
                                            type="button"
                                            className={`${iconBtn} hover:text-red-600`}
                                            onClick={() => onDelete(book)}
                                            aria-label={`Delete ${book.title}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}