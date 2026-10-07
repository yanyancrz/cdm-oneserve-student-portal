import { Link } from "react-router-dom";
import { KeyRound, Pencil, Power } from "lucide-react";

import { StatusBadge } from "../common";
import { formatDateTime, formatNumber, initials, statusTone } from "../../utils/format";

const cell = "px-4 py-3 text-sm";

// Props
//  - counselors : rows from GET /api/admin/guidance/counselors
//  - onAction   : (type, counselor) with type = "edit" | "reset" | "suspend" | "activate"
export default function CounselorTable({ counselors, onAction }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                    <tr className="border-b border-black/[0.06] text-[11px] uppercase tracking-wide text-gray-400">
                        <th className="px-4 py-3 font-medium">Counselor</th>
                        <th className="px-4 py-3 font-medium">ID</th>
                        <th className="px-4 py-3 font-medium">Assignment</th>
                        <th className="px-4 py-3 font-medium">Availability</th>
                        <th className="px-4 py-3 font-medium">Appts</th>
                        <th className="px-4 py-3 font-medium">Sessions</th>
                        <th className="px-4 py-3 font-medium">Last login</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-black/[0.04]">
                    {counselors.map((c) => {
                        const active = c.accountStatus === "Active";

                        return (
                            <tr key={c.userId} className="transition hover:bg-[#FAFAF7]">
                                <td className={cell}>
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E1F0E4] text-xs font-semibold text-[#106A2E]">
                                            {initials(c.fullName)}
                                        </span>

                                        <div className="min-w-0">
                                            <Link
                                                to={`/admin/guidance/counselors/${c.userId}`}
                                                className="block truncate font-medium text-gray-800 hover:text-[#106A2E] hover:underline"
                                            >
                                                {c.fullName}
                                            </Link>
                                            <p className="truncate text-xs text-gray-400">{c.email}</p>
                                        </div>
                                    </div>
                                </td>

                                <td className={`${cell} whitespace-nowrap text-gray-500`}>
                                    {c.idNumber || "—"}
                                </td>

                                <td className={cell}>
                                    <p className="truncate text-gray-700">{c.title || "—"}</p>
                                    <p className="truncate text-xs text-gray-400">
                                        {c.department || c.room || "—"}
                                    </p>
                                </td>

                                <td className={`${cell} whitespace-nowrap text-gray-500`}>
                                    {c.availabilityDays > 0
                                        ? `${formatNumber(c.availabilityDays)} day${
                                              c.availabilityDays === 1 ? "" : "s"
                                          } / week`
                                        : "Not set"}
                                </td>

                                <td className={`${cell} text-gray-600`}>
                                    {formatNumber(c.appointments)}
                                </td>
                                <td className={`${cell} text-gray-600`}>
                                    {formatNumber(c.completedSessions)}
                                </td>

                                <td className={`${cell} whitespace-nowrap text-gray-500`}>
                                    {formatDateTime(c.lastLoginAt)}
                                </td>

                                <td className={cell}>
                                    <StatusBadge tone={statusTone(c.accountStatus)}>
                                        {c.accountStatus}
                                    </StatusBadge>
                                </td>

                                <td className={cell}>
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            title="Edit counselor"
                                            aria-label={`Edit ${c.fullName}`}
                                            onClick={() => onAction("edit", c)}
                                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-[#106A2E]"
                                        >
                                            <Pencil size={15} />
                                        </button>

                                        <button
                                            type="button"
                                            title="Send password reset code"
                                            aria-label={`Reset password for ${c.fullName}`}
                                            onClick={() => onAction("reset", c)}
                                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-[#106A2E]"
                                        >
                                            <KeyRound size={15} />
                                        </button>

                                        <button
                                            type="button"
                                            title={active ? "Suspend account" : "Activate account"}
                                            aria-label={`${active ? "Suspend" : "Activate"} ${c.fullName}`}
                                            onClick={() =>
                                                onAction(active ? "suspend" : "activate", c)
                                            }
                                            className={`rounded-lg p-2 transition hover:bg-gray-100 ${
                                                active ? "text-gray-400 hover:text-red-600" : "text-gray-400 hover:text-[#106A2E]"
                                            }`}
                                        >
                                            <Power size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
