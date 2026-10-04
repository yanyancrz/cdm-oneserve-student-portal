import { Eye, BookMarked, History } from "lucide-react";

import StatusBadge from "../common/StatusBadge";
import { accountTone } from "../students/StudentTable";

const iconBtn = "rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-[#106A2E]";

export default function FacultyTable({ faculty, onOpen }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                    <tr className="text-xs uppercase tracking-wide text-gray-400">
                        <th className="px-5 py-3 font-medium">Faculty</th>
                        <th className="px-3 py-3 font-medium">Employee ID</th>
                        <th className="px-3 py-3 font-medium">Institute / Dept.</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-3 py-3 text-right font-medium">Active loans</th>
                        <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-black/[0.04]">
                    {faculty.map((f) => (
                        <tr key={f.userId} className="hover:bg-gray-50/60">
                            <td className="px-5 py-3">
                                <p className="max-w-[240px] truncate font-medium text-[#1F1F1F]">{f.fullName}</p>
                                <p className="max-w-[240px] truncate text-xs text-gray-400">{f.email || "—"}</p>
                            </td>
                            <td className="px-3 py-3 text-gray-600">{f.idNumber || "—"}</td>
                            <td className="px-3 py-3 text-gray-600">{f.department || "—"}</td>
                            <td className="px-3 py-3">
                                <StatusBadge tone={accountTone(f.accountStatus)}>
                                    {f.accountStatus || "Unknown"}
                                </StatusBadge>
                            </td>
                            <td className="px-3 py-3 text-right">
                                <span className="text-gray-700">{f.activeLoans}</span>
                                {f.overdueLoans > 0 && (
                                    <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                                        {f.overdueLoans} overdue
                                    </span>
                                )}
                            </td>
                            <td className="px-5 py-3">
                                <div className="flex justify-end gap-1">
                                    <button type="button" className={iconBtn} onClick={() => onOpen(f, "profile")} aria-label={`View ${f.fullName}`}>
                                        <Eye size={16} />
                                    </button>
                                    <button type="button" className={iconBtn} onClick={() => onOpen(f, "loans")} aria-label={`Active loans of ${f.fullName}`}>
                                        <BookMarked size={16} />
                                    </button>
                                    <button type="button" className={iconBtn} onClick={() => onOpen(f, "history")} aria-label={`History of ${f.fullName}`}>
                                        <History size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}