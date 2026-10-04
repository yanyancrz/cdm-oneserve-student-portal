import { CheckCircle2 } from "lucide-react";

import { formatPeso } from "../../utils/currencyUtils";
import { formatDate } from "../../utils/dateUtils";

export default function OverdueTable({ items = [], loading = false }) {
    return (
        <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
            <div className="border-b border-black/[0.05] px-5 py-4">
                <h2 className="text-sm font-semibold text-[#1F1F1F]">Overdue Books</h2>
                <p className="text-xs text-gray-500">Fines are computed by the server.</p>
            </div>

            {loading ? (
                <div className="space-y-3 p-5">
                    {[0, 1, 2, 3].map((n) => (
                        <div key={n} className="h-9 animate-pulse rounded-lg bg-gray-100" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                    <CheckCircle2 size={28} className="text-[#106A2E]" />
                    <p className="text-sm font-medium text-gray-700">No overdue books.</p>
                    <p className="text-xs text-gray-400">Everything borrowed is still within its due date.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
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
                            {items.map((row) => (
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