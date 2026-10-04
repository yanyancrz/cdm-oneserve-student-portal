import { useEffect, useState } from "react";

import Modal from "../common/Modal";
import StatusBadge from "../common/StatusBadge";
import { librarianService } from "../../services/librarianService";
import { formatDate, timeAgo } from "../../utils/dateUtils";

function Detail({ label, value }) {
    return (
        <div>
            <dt className="text-xs text-gray-400">{label}</dt>
            <dd className="mt-0.5 text-sm text-gray-800">{value || "—"}</dd>
        </div>
    );
}

export default function LibrarianDetailsModal({ librarian, onClose }) {
    const [state, setState] = useState({ data: null, loading: true, error: null });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!librarian) return undefined;

        const controller = new AbortController();

        setState({ data: null, loading: true, error: null });

        librarianService
            .activity(librarian.userId, { signal: controller.signal })
            .then((data) => setState({ data, loading: false, error: null }))
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setState({ data: null, loading: false, error: err?.message || "Unable to load activity." });
            });

        return () => controller.abort();
    }, [librarian, attempt]);

    if (!librarian) return null;

    return (
        <Modal open onClose={onClose} title={librarian.fullName} size="md">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Detail label="Employee ID" value={librarian.idNumber} />
                <Detail label="Email" value={librarian.email} />
                <Detail label="Role" value="Library Staff" />
                <Detail label="Registered" value={formatDate(librarian.createdAt)} />
                <div>
                    <dt className="text-xs text-gray-400">Status</dt>
                    <dd className="mt-1">
                        <StatusBadge tone={librarian.isDisabled ? "red" : "green"}>
                            {librarian.isDisabled ? "Disabled" : "Active"}
                        </StatusBadge>
                    </dd>
                </div>
            </dl>

            <h3 className="mb-2 mt-6 text-sm font-semibold text-[#1F1F1F]">Recent activity</h3>

            {state.loading ? (
                <div className="space-y-2" aria-busy="true">
                    {[0, 1, 2].map((n) => (
                        <div key={n} className="h-9 animate-pulse rounded-lg bg-gray-100" />
                    ))}
                </div>
            ) : state.error ? (
                <div className="py-6 text-center">
                    <p className="text-sm text-gray-600">{state.error}</p>
                    <button
                        type="button"
                        onClick={() => setAttempt((n) => n + 1)}
                        className="mt-3 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                        Try again
                    </button>
                </div>
            ) : state.data.length === 0 ? (
                <p className="rounded-lg bg-gray-50 py-8 text-center text-sm text-gray-500">No activity recorded yet.</p>
            ) : (
                <ul className="divide-y divide-black/[0.05] rounded-xl border border-black/[0.06]">
                    {state.data.map((a) => (
                        <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                            <p className="text-sm text-gray-600">
                                {a.message || a.code}
                            </p>
                            <span className="shrink-0 text-xs text-gray-400">{timeAgo(a.createdAt)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
}