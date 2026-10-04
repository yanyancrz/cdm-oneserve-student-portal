import { Eye, BookMarked, History } from "lucide-react";

import StatusBadge from "../common/StatusBadge";

export function accountTone(status) {
    const s = String(status || "").toLowerCase();
    if (s === "active" || s === "verified") return "green";
    if (s === "pending") return "amber";
    if (!s) return "gray";
    return "red";
}

const iconBtn = "rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-[#106A2E]";

export default function StudentTable({ students, onOpen }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                    <tr className="text-xs uppercase tracking-wide text-gray-400">
                        <th className="px-5 py-3 font-medium">Student</th>
                        <th className="px-3 py-3 font-medium">Student ID</th>
                        <th className="px-3 py-3 font-medium">Course</th>
                        <th className="px-3 py-3 font-medium">Year</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-3 py-3 text-right font-medium">Active loans</th>
                        <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-black/[0.04]">
                    {students.map((s) => (
                        <tr key={s.userId} className="hover:bg-gray-50/60">
                            <td className="px-5 py-3">
                                <p className="max-w-[240px] truncate font-medium text-[#1F1F1F]">{s.fullName}</p>
                                <p className="max-w-[240px] truncate text-xs text-gray-400">{s.email || "—"}</p>
                            </td>
                            <td className="px-3 py-3 text-gray-600">{s.idNumber || "—"}</td>
                            <td className="px-3 py-3 text-gray-600">{s.course || "—"}</td>
                            <td className="px-3 py-3 text-gray-600">{s.yearLevel || "—"}</td>
                            <td className="px-3 py-3">
                                <StatusBadge tone={accountTone(s.accountStatus)}>
                                    {s.accountStatus || "Unknown"}
                                </StatusBadge>
                            </td>
                            <td className="px-3 py-3 text-right">
                                <span className="text-gray-700">{s.activeLoans}</span>
                                {s.overdueLoans > 0 && (
                                    <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                                        {s.overdueLoans} overdue
                                    </span>
                                )}
                            </td>
                            <td className="px-5 py-3">
                                <div className="flex justify-end gap-1">
                                    <button type="button" className={iconBtn} onClick={() => onOpen(s, "profile")} aria-label={`View ${s.fullName}`}>
                                        <Eye size={16} />
                                    </button>
                                    <button type="button" className={iconBtn} onClick={() => onOpen(s, "loans")} aria-label={`Active loans of ${s.fullName}`}>
                                        <BookMarked size={16} />
                                    </button>
                                    <button type="button" className={iconBtn} onClick={() => onOpen(s, "history")} aria-label={`History of ${s.fullName}`}>
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