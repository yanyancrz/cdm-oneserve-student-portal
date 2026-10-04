import { useEffect, useState } from "react";

import Modal from "../common/Modal";
import StatusBadge from "../common/StatusBadge";
import { accountTone } from "./StudentTable";
import { studentService } from "../../services/studentService";
import { formatPeso } from "../../utils/currencyUtils";
import { formatDate } from "../../utils/dateUtils";



const TABS = [
    { key: "profile", label: "Profile" },
    { key: "loans", label: "Active Loans" },
    { key: "history", label: "History" },
    { key: "reservations", label: "Reservations" },
];

const LOADERS = {
    loans: studentService.loans,
    history: studentService.history,
    reservations: studentService.reservations,
};

export function Detail({ label, value })
{
    function Detail({ label, value }) {
        return (
            <div>
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="mt-0.5 text-sm text-gray-800">{value || "—"}</dd>
            </div>
        );
    }
}

function Placeholder({ children }) {
    return <p className="py-10 text-center text-sm text-gray-500">{children}</p>;
}

export function LoansTable({ rows, showStatus }) {
    function LoansTable({ rows, showStatus }) {
        if (rows.length === 0) return <Placeholder>No records.</Placeholder>;

        return (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                        <tr className="text-xs uppercase tracking-wide text-gray-400">
                            <th className="py-2 pr-3 font-medium">Book</th>
                            <th className="px-3 py-2 font-medium">Borrowed</th>
                            <th className="px-3 py-2 font-medium">Due</th>
                            <th className="px-3 py-2 font-medium">Returned</th>
                            {showStatus && <th className="px-3 py-2 font-medium">Status</th>}
                            <th className="py-2 pl-3 text-right font-medium">Fine</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                        {rows.map((r) => (
                            <tr key={r.transactionId}>
                                <td className="py-2.5 pr-3">
                                    <p className="max-w-[220px] truncate font-medium text-[#1F1F1F]">{r.bookTitle}</p>
                                    <p className="max-w-[220px] truncate text-xs text-gray-400">{r.author}</p>
                                </td>
                                <td className="px-3 py-2.5 text-gray-600">{formatDate(r.borrowDate)}</td>
                                <td className="px-3 py-2.5 text-gray-600">
                                    {formatDate(r.dueDate)}
                                    {r.isOverdue && (
                                        <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                                            {r.overdueDays}d overdue
                                        </span>
                                    )}
                                </td>
                                <td className="px-3 py-2.5 text-gray-600">{r.returnDate ? formatDate(r.returnDate) : "—"}</td>
                                {showStatus && (
                                    <td className="px-3 py-2.5">
                                        <StatusBadge tone={r.returnDate ? "gray" : r.isOverdue ? "red" : "green"}>
                                            {r.returnDate ? "Returned" : r.isOverdue ? "Overdue" : "Borrowed"}
                                        </StatusBadge>
                                    </td>
                                )}
                                <td className="py-2.5 pl-3 text-right text-gray-700">
                                    {Number(r.fine) > 0 ? formatPeso(r.fine) : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
}

export function ReservationsTable({ rows })
{ 
    function ReservationsTable({ rows }) {
        if (rows.length === 0) return <Placeholder>No reservations.</Placeholder>;

        const tone = (s) =>
            ["Completed", "Approved", "ReadyForPickup"].includes(s) ? "green" : s === "Pending" ? "amber" : "gray";

        return (
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="text-xs uppercase tracking-wide text-gray-400">
                        <th className="py-2 pr-3 font-medium">Book</th>
                        <th className="px-3 py-2 font-medium">Reserved</th>
                        <th className="px-3 py-2 font-medium">Expires</th>
                        <th className="py-2 pl-3 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                    {rows.map((r) => (
                        <tr key={r.reservationId}>
                            <td className="max-w-[240px] truncate py-2.5 pr-3 font-medium text-[#1F1F1F]">{r.bookTitle}</td>
                            <td className="px-3 py-2.5 text-gray-600">{formatDate(r.reservationAt)}</td>
                            <td className="px-3 py-2.5 text-gray-600">{formatDate(r.expirationDate)}</td>
                            <td className="py-2.5 pl-3"><StatusBadge tone={tone(r.status)}>{r.status}</StatusBadge></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
}

export default function StudentProfileModal({ student, initialTab = "profile", onClose }) {
    const [tab, setTab] = useState(initialTab);
    const [tabs, setTabs] = useState({}); // { loans: { data, loading, error } }

    // Load a tab only when it is opened. Switching back reuses the loaded data.
    useEffect(() => {
        if (!student || tab === "profile" || tabs[tab]) return undefined;

        const controller = new AbortController();

        setTabs((prev) => ({ ...prev, [tab]: { data: null, loading: true, error: null } }));

        LOADERS[tab](student.userId, { signal: controller.signal })
            .then((data) => setTabs((prev) => ({ ...prev, [tab]: { data, loading: false, error: null } })))
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setTabs((prev) => ({
                    ...prev,
                    [tab]: { data: null, loading: false, error: err?.message || "Unable to load." },
                }));
            });

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [student, tab]);

    if (!student) return null;

    const current = tabs[tab];

    const retry = () =>
        setTabs((prev) => {
            const next = { ...prev };
            delete next[tab];
            return next;
        });

    return (
        <Modal open onClose={onClose} title={student.fullName} size="lg">
            <div className="mb-5 flex flex-wrap gap-1 border-b border-black/[0.06]">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                            tab === t.key
                                ? "border-[#106A2E] text-[#106A2E]"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "profile" && (
                <>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
                        <Detail label="Student ID" value={student.idNumber} />
                        <Detail label="Full name" value={student.fullName} />
                        <Detail label="Email" value={student.email} />
                        <Detail label="Course" value={student.course} />
                        <Detail label="Year level" value={student.yearLevel} />
                        <div>
                            <dt className="text-xs text-gray-400">Account status</dt>
                            <dd className="mt-1">
                                <StatusBadge tone={accountTone(student.accountStatus)}>
                                    {student.accountStatus || "Unknown"}
                                </StatusBadge>
                            </dd>
                        </div>
                        <Detail label="Active loans" value={String(student.activeLoans)} />
                        <Detail label="Overdue loans" value={String(student.overdueLoans)} />
                    </dl>

                    <p className="mt-6 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                        Student accounts are managed by CDM OneServe. The library can view this
                        information but cannot change it.
                    </p>
                </>
            )}

            {tab !== "profile" && current?.loading && (
                <div className="space-y-3" aria-busy="true">
                    {[0, 1, 2].map((n) => (
                        <div key={n} className="h-10 animate-pulse rounded-lg bg-gray-100" />
                    ))}
                </div>
            )}

            {tab !== "profile" && current?.error && (
                <div className="py-8 text-center">
                    <p className="text-sm font-medium text-gray-700">Unable to load this section.</p>
                    <p className="mt-1 text-xs text-gray-400">{current.error}</p>
                    <button
                        type="button"
                        onClick={retry}
                        className="mt-3 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                        Try again
                    </button>
                </div>
            )}

            {tab === "loans" && current?.data && <LoansTable rows={current.data} showStatus={false} />}
            {tab === "history" && current?.data && <LoansTable rows={current.data} showStatus />}
            {tab === "reservations" && current?.data && <ReservationsTable rows={current.data} />}
        </Modal>
    );
}