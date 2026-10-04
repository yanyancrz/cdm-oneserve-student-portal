import { Eye, KeyRound, Pencil, UserCheck, UserX } from "lucide-react";

import StatusBadge from "../common/StatusBadge";
import { formatDate } from "../../utils/dateUtils";

const iconBtn = "rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100";

export default function LibrarianTable({ librarians, onAction }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                    <tr className="text-xs uppercase tracking-wide text-gray-400">
                        <th className="px-5 py-3 font-medium">Name</th>
                        <th className="px-3 py-3 font-medium">Employee ID</th>
                        <th className="px-3 py-3 font-medium">Role</th>
                        <th className="px-3 py-3 font-medium">Registered</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-black/[0.04]">
                    {librarians.map((l) => (
                        <tr key={l.userId} className="hover:bg-gray-50/60">
                            <td className="px-5 py-3">
                                <p className="max-w-[240px] truncate font-medium text-[#1F1F1F]">{l.fullName}</p>
                                <p className="max-w-[240px] truncate text-xs text-gray-400">{l.email || "—"}</p>
                            </td>
                            <td className="px-3 py-3 text-gray-600">{l.idNumber || "—"}</td>
                            <td className="px-3 py-3 text-gray-600">Library Staff</td>
                            <td className="px-3 py-3 text-gray-600">{formatDate(l.createdAt)}</td>
                            <td className="px-3 py-3">
                                <StatusBadge tone={l.isDisabled ? "red" : "green"}>
                                    {l.isDisabled ? "Disabled" : "Active"}
                                </StatusBadge>
                            </td>
                            <td className="px-5 py-3">
                                <div className="flex justify-end gap-0.5">
                                    <button type="button" className={iconBtn} onClick={() => onAction("view", l)} aria-label={`View ${l.fullName}`}>
                                        <Eye size={16} />
                                    </button>
                                    <button type="button" className={iconBtn} onClick={() => onAction("edit", l)} aria-label={`Edit ${l.fullName}`}>
                                        <Pencil size={16} />
                                    </button>
                                    <button type="button" className={iconBtn} onClick={() => onAction("reset", l)} aria-label={`Reset password of ${l.fullName}`}>
                                        <KeyRound size={16} />
                                    </button>

                                    {l.isDisabled ? (
                                        <button
                                            type="button"
                                            className={`${iconBtn} hover:text-[#106A2E]`}
                                            onClick={() => onAction("enable", l)}
                                            aria-label={`Enable ${l.fullName}`}
                                        >
                                            <UserCheck size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className={`${iconBtn} hover:text-red-600`}
                                            onClick={() => onAction("disable", l)}
                                            aria-label={`Disable ${l.fullName}`}
                                        >
                                            <UserX size={16} />
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