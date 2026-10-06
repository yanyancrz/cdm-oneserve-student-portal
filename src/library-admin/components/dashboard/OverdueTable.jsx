import { CheckCircle2 } from "lucide-react";

import { formatPeso } from "../../utils/currencyUtils";
import { formatDate } from "../../utils/dateUtils";
import { Skeleton } from "../common/Skeleton";

// How many placeholder rows to show while loading.
const SKELETON_ROWS = 4;

// Different widths per row, so it looks like real content.
const NAME_WIDTHS = ["w-32", "w-40", "w-28", "w-36"];
const BOOK_WIDTHS = ["w-40", "w-32", "w-44", "w-36"];

// Same columns as the real rows, so nothing jumps when the data arrives.
function SkeletonRow({ index }) {
    return (
        <tr aria-hidden="true">
            <td className="px-5 py-3">
                <Skeleton className={`h-3.5 ${NAME_WIDTHS[index % NAME_WIDTHS.length]}`} />
                <Skeleton className="mt-2 h-3 w-14" />
            </td>

            <td className="px-3 py-3">
                <Skeleton className="h-3.5 w-20" />
            </td>

            <td className="px-3 py-3">
                <Skeleton className={`h-3.5 ${BOOK_WIDTHS[index % BOOK_WIDTHS.length]}`} />
            </td>

            <td className="px-3 py-3">
                <Skeleton className="h-3.5 w-20" />
            </td>

            <td className="px-3 py-3">
                <Skeleton className="h-3.5 w-20" />
            </td>

            <td className="px-3 py-3">
                <Skeleton className="ml-auto h-5 w-8 rounded-full" />
            </td>

            <td className="px-5 py-3">
                <Skeleton className="ml-auto h-3.5 w-16" />
            </td>
        </tr>
    );
}

export default function OverdueTable({ items = [], loading = false }) {
    return (
        <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
            <div className="border-b border-black/[0.05] px-5 py-4">
                <h2 className="text-sm font-semibold text-[#1F1F1F]">Overdue Books</h2>
                <p className="text-xs text-gray-500">Fines are computed by the server.</p>
            </div>

            {!loading && items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                    <CheckCircle2 size={28} className="text-[#106A2E]" />
                    <p className="text-sm font-medium text-gray-700">No overdue books.</p>
                    <p className="text-xs text-gray-400">Everything borrowed is still within its due date.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table
                        className="w-full min-w-[760px] text-left text-sm"
                        aria-busy={loading || undefined}
                    >
                        {/* Read out by screen readers only */}
                        {loading && <caption className="sr-only">Loading overdue books...</caption>}

                        <thead>
                            <tr className="text-xs uppercase tracking-wide text-gray-400">
                                <th className="px-5 py-3 font-medium">Patron</th>
                                <th className="px-3 py-3 font-medium">Patron ID</th>
                                <th className="px-3 py-3 font-medium">Book</th>
                                <th className="px-3 py-3 font-medium">Borrowed</th>
                                <th className="px-3 py-3 font-medium">Due</th>
                                <th className="px-3 py-3 text-right font-medium">Days</th>
                                <th className="px-5 py-3 text-right font-medium">Fine</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-black/[0.04]">
                            {loading
                                ? Array.from({ length: SKELETON_ROWS }, (_, n) => (
                                      <SkeletonRow key={n} index={n} />
                                  ))
                                : items.map((row) => (
                                      <tr key={row.transactionId} className="hover:bg-gray-50/60">
                                          <td className="px-5 py-3">
                                              <p className="font-medium text-[#1F1F1F]">{row.patronName}</p>
                                              <p className="text-xs text-gray-400">{row.patronType}</p>
                                          </td>
                                          <td className="px-3 py-3 text-gray-600">{row.patronId}</td>
                                          <td className="max-w-[220px] truncate px-3 py-3 text-gray-700">
                                              {row.bookTitle}
                                          </td>
                                          <td className="px-3 py-3 text-gray-600">{formatDate(row.borrowDate)}</td>
                                          <td className="px-3 py-3 text-gray-600">{formatDate(row.dueDate)}</td>
                                          <td className="px-3 py-3 text-right">
                                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                                                  {row.overdueDays}
                                              </span>
                                          </td>
                                          <td className="px-5 py-3 text-right font-medium text-[#1F1F1F]">
                                              {formatPeso(row.fine)}
                                          </td>
                                      </tr>
                                  ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}