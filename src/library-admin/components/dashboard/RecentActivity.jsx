import { useState } from "react";
import { Activity, ChevronRight } from "lucide-react";

import { timeAgo } from "../../utils/dateUtils";
import Modal from "../common/Modal";
import { Skeleton } from "../common/Skeleton";

// How many activities the card shows. The rest open in a modal.
const CARD_COUNT = 2;

const SCOPES = [
    { key: "mine", label: "Mine" },
    { key: "all", label: "Team" },
];

// Tooltip with the exact date and time. Skipped if the date is not valid.
const fullDate = (value) => {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? undefined : date.toLocaleString();
};

// Mine / Team switch (Library Head only). Used on the card and inside the modal.
function ScopeToggle({ scope, onScopeChange }) {
    return (
        <div className="flex shrink-0 rounded-lg bg-gray-100 p-0.5 text-xs font-medium">
            {SCOPES.map((opt) => (
                <button
                    key={opt.key}
                    type="button"
                    onClick={() => onScopeChange?.(opt.key)}
                    className={`rounded-md px-3 py-1 transition ${
                        scope === opt.key
                            ? "bg-white text-[#106A2E] shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

function ActivityItem({ item, padding = "px-5 py-3" }) {
    return (
        <li className={`flex items-start justify-between gap-3 ${padding}`}>
            <p className="text-sm text-gray-600">
                <span className="font-semibold text-[#1F1F1F]">
                    {item.isMine ? "You" : item.actorName}
                </span>{" "}
                {item.message || item.code}
            </p>

            <span className="shrink-0 text-xs text-gray-400" title={fullDate(item.createdAt)}>
                {timeAgo(item.createdAt)}
            </span>
        </li>
    );
}

export default function RecentActivity({
    items = [],
    loading = false,
    canViewAll = false,
    scope = "mine",
    onScopeChange,
}) {
    const [modalOpen, setModalOpen] = useState(false);

    const scopeText = scope === "all" ? "Actions by the library team." : "Your latest actions.";

    return (
        <>
            <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3 border-b border-black/[0.05] px-5 py-4">
                    <div>
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">Recent Activity</h2>
                        <p className="text-xs text-gray-500">{scopeText}</p>
                    </div>

                    {canViewAll && <ScopeToggle scope={scope} onScopeChange={onScopeChange} />}
                </div>

                {loading ? (
                    <div
                        role="status"
                        aria-busy="true"
                        aria-live="polite"
                        className="divide-y divide-black/[0.04]"
                    >
                        <span className="sr-only">Loading recent activity...</span>

                        {Array.from({ length: CARD_COUNT }, (_, n) => (
                            <div key={n} className="flex items-start justify-between gap-3 px-5 py-3">
                                <div className="flex h-5 min-w-0 flex-1 items-center">
                                    <Skeleton className={n % 2 === 0 ? "h-3.5 w-3/4" : "h-3.5 w-2/3"} />
                                </div>

                                <div className="flex h-5 shrink-0 items-center">
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                        <Activity size={26} className="text-gray-300" />
                        <p className="text-sm font-medium text-gray-700">No activity yet.</p>
                        <p className="text-xs text-gray-400">
                            Issuing, returning, and approving will show up here.
                        </p>
                    </div>
                ) : (
                    <>
                        <ul className="divide-y divide-black/[0.04]">
                            {items.slice(0, CARD_COUNT).map((item) => (
                                <ActivityItem key={item.id} item={item} />
                            ))}
                        </ul>

                        {items.length > CARD_COUNT && (
                            <button
                                type="button"
                                onClick={() => setModalOpen(true)}
                                aria-haspopup="dialog"
                                className="flex w-full items-center justify-center gap-1.5 rounded-b-2xl border-t border-black/[0.05] px-5 py-3 text-xs font-semibold text-[#106A2E] transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#106A2E]/30"
                            >
                                View all activity ({items.length})
                                <ChevronRight size={14} aria-hidden="true" />
                            </button>
                        )}
                    </>
                )}
            </section>

            {/* Full list. It stays up to date while open, because the dashboard keeps polling. */}
            {modalOpen && (
                <Modal open onClose={() => setModalOpen(false)} title="Recent Activity">
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <p className="text-xs text-gray-500">{scopeText}</p>

                        {canViewAll && <ScopeToggle scope={scope} onScopeChange={onScopeChange} />}
                    </div>

                    {items.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-500">No activity yet.</p>
                    ) : (
                        <ul className="divide-y divide-black/[0.04] rounded-xl border border-black/[0.05]">
                            {items.map((item) => (
                                <ActivityItem key={item.id} item={item} padding="px-4 py-3" />
                            ))}
                        </ul>
                    )}
                </Modal>
            )}
        </>
    );
}