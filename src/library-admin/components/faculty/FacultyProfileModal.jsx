import { useEffect, useState } from "react";

import Modal from "../common/Modal";
import StatusBadge from "../common/StatusBadge";
import { accountTone } from "../students/StudentTable";
import { Detail, LoansTable, ReservationsTable } from "../students/StudentProfileModal";
import { facultyService } from "../../services/facultyService";

const TABS = [
    { key: "profile", label: "Profile" },
    { key: "loans", label: "Active Loans" },
    { key: "history", label: "History" },
    { key: "reservations", label: "Reservations" },
];

const LOADERS = {
    loans: facultyService.loans,
    history: facultyService.history,
    reservations: facultyService.reservations,
};

export default function FacultyProfileModal({ member, initialTab = "profile", onClose }) {
    const [tab, setTab] = useState(initialTab);
    const [tabs, setTabs] = useState({}); // { loans: { data, loading, error } }

    // A tab loads only when opened. Switching back reuses the loaded data.
    useEffect(() => {
        if (!member || tab === "profile" || tabs[tab]) return undefined;

        const controller = new AbortController();

        setTabs((prev) => ({ ...prev, [tab]: { data: null, loading: true, error: null } }));

        LOADERS[tab](member.userId, { signal: controller.signal })
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
    }, [member, tab]);

    if (!member) return null;

    const current = tabs[tab];

    const retry = () =>
        setTabs((prev) => {
            const next = { ...prev };
            delete next[tab];
            return next;
        });

    return (
        <Modal open onClose={onClose} title={member.fullName} size="lg">
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
                        <Detail label="Employee ID" value={member.idNumber} />
                        <Detail label="Full name" value={member.fullName} />
                        <Detail label="Email" value={member.email} />
                        <Detail label="Institute / Department" value={member.department} />
                        <div>
                            <dt className="text-xs text-gray-400">Account status</dt>
                            <dd className="mt-1">
                                <StatusBadge tone={accountTone(member.accountStatus)}>
                                    {member.accountStatus || "Unknown"}
                                </StatusBadge>
                            </dd>
                        </div>
                        <Detail label="Active loans" value={String(member.activeLoans)} />
                        <Detail label="Overdue loans" value={String(member.overdueLoans)} />
                    </dl>

                    <p className="mt-6 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                        Faculty accounts are managed by CDM OneServe. The library can view this
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