import { BookOpen, Eye, FileText, Pencil, Trash2 } from "lucide-react";

import { fileUrl } from "../../services/bookService";
import { Skeleton } from "../common/Skeleton";

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

// =========================================================
// SKELETON (same columns and row height as the real table,
// so nothing jumps when the data arrives)
// =========================================================

// Different widths per row, so it looks like real content.
const TITLE_WIDTHS = ["w-44", "w-36", "w-52", "w-40", "w-48", "w-32"];
const AUTHOR_WIDTHS = ["w-24", "w-28", "w-20", "w-32", "w-24", "w-28"];

function SkeletonRow({ index, actions }) {
    return (
        <tr aria-hidden="true">
            <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-9 shrink-0 rounded-md" />

                    <div className="min-w-0 space-y-2">
                        <Skeleton className={`h-3.5 ${TITLE_WIDTHS[index % TITLE_WIDTHS.length]}`} />
                        <Skeleton className={`h-3 ${AUTHOR_WIDTHS[index % AUTHOR_WIDTHS.length]}`} />
                        <Skeleton className="h-2.5 w-16" />
                    </div>
                </div>
            </td>

            <td className="px-3 py-3">
                <Skeleton className="h-3.5 w-10" />
            </td>

            <td className="px-3 py-3">
                <Skeleton className="ml-auto h-3.5 w-12" />
            </td>

            <td className="px-3 py-3">
                <Skeleton className="h-6 w-20 rounded-full" />
            </td>

            <td className="px-5 py-3">
                <div className="flex justify-end gap-1">
                    {Array.from({ length: actions }, (_, i) => (
                        <Skeleton key={i} className="h-7 w-7 rounded-lg" />
                    ))}
                </div>
            </td>
        </tr>
    );
}

const iconBtn = "rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100";

/**
 * Props:
 *  - books         : rows to show
 *  - canDelete     : show the delete button (Library Head only)
 *  - onView / onEdit / onDelete
 *  - loading       : (optional) show skeleton rows instead of the books
 *  - skeletonRows  : (optional) how many skeleton rows to show. Default 6.
 */
export default function BookTable({
    books = [],
    canDelete,
    onView,
    onEdit,
    onDelete,
    loading = false,
    skeletonRows = 6,
}) {
    return (
        <div className="overflow-x-auto">
            <table
                className="w-full min-w-[720px] table-fixed text-left text-sm"
                aria-busy={loading || undefined}
            >
                {/* Read out by screen readers only */}
                {loading && <caption className="sr-only">Loading books...</caption>}

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
                    {loading
                        ? Array.from({ length: skeletonRows }, (_, n) => (
                              <SkeletonRow key={n} index={n} actions={canDelete ? 3 : 2} />
                          ))
                        : books.map((book) => (
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
                                          <button
                                              type="button"
                                              className={iconBtn}
                                              onClick={() => onView(book)}
                                              aria-label={`View ${book.title}`}
                                          >
                                              <Eye size={16} />
                                          </button>

                                          <button
                                              type="button"
                                              className={iconBtn}
                                              onClick={() => onEdit(book)}
                                              aria-label={`Edit ${book.title}`}
                                          >
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