import { CircleAlert, UserRound } from "lucide-react";

import StatusBadge from "../common/StatusBadge";

export default function PatronCard({ patron, onChange, disabled }) {
    return (
        <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E1F0E4] text-[#106A2E]">
                        <UserRound size={20} />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1F1F1F]">{patron.fullName}</p>
                        <p className="truncate text-xs text-gray-500">
                            {patron.idNumber || "No ID"} &middot; {patron.role}
                            {patron.institute ? ` · ${patron.institute}` : ""}
                            {patron.course ? ` · ${patron.course}` : ""}
                            {patron.yearLevel ? ` · ${patron.yearLevel}` : ""}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onChange}
                    disabled={disabled}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                >
                    Change patron
                </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-gray-50 py-3">
                    <p className="text-lg font-semibold text-[#1F1F1F]">{patron.activeLoans}</p>
                    <p className="text-[11px] text-gray-400">Borrowed</p>
                </div>
                <div className="rounded-xl bg-gray-50 py-3">
                    <p className="text-lg font-semibold text-[#1F1F1F]">{patron.borrowLimit}</p>
                    <p className="text-[11px] text-gray-400">Limit</p>
                </div>
                <div className="rounded-xl bg-gray-50 py-3">
                    <p className={`text-lg font-semibold ${patron.remainingSlots > 0 ? "text-[#106A2E]" : "text-red-600"}`}>
                        {patron.remainingSlots}
                    </p>
                    <p className="text-[11px] text-gray-400">Remaining</p>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge tone={patron.canBorrow ? "green" : "red"}>
                    {patron.canBorrow ? "Cleared to borrow" : "Cannot borrow"}
                </StatusBadge>

                {patron.overdueLoans > 0 && (
                    <StatusBadge tone="amber">{patron.overdueLoans} overdue</StatusBadge>
                )}
            </div>

            {!patron.canBorrow && patron.reason && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    <CircleAlert size={14} className="mt-0.5 shrink-0" />
                    {patron.reason}
                </p>
            )}
        </div>
    );
}