import { Link } from "react-router-dom";
import { KeyRound, Lock, Pencil, Unlock } from "lucide-react";

import { StatusBadge } from "../common";
import { API_URL } from "../../../config/api";
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
                        <th className="px-4 py-3 font-medium">Licensed Number</th>
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
                        const suspended = c.accountStatus === "Suspended";

                        return (
                            <tr key={c.userId} className="transition hover:bg-[#FAFAF7]">
                                <td className={cell}>
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E1F0E4] text-xs font-semibold text-[#106A2E]">
                                            {c.profilePicture ? (
                                                <img
                                                    src={`${API_URL}${c.profilePicture}`}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                initials(c.fullName)
                                            )}
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
                                            title={suspended ? "Activate account" : "Suspend account"}
                                            aria-label={`${suspended ? "Activate" : "Suspend"} ${c.fullName}`}
                                            onClick={() =>
                                                onAction(suspended ? "activate" : "suspend", c)
                                            }
                                            className={`rounded-lg p-2 transition hover:bg-gray-100 ${
                                                suspended ? "text-red-600 hover:bg-red-50" : "text-[#106A2E] hover:bg-emerald-50"
                                            }`}
                                        >
                                            {suspended ? <Lock size={15} /> : <Unlock size={15} />}
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
