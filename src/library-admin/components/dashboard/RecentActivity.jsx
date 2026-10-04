import { Activity } from "lucide-react";

import { timeAgo } from "../../utils/dateUtils";

export default function RecentActivity({
    items = [],
    loading = false,
    canViewAll = false,
    scope = "mine",
    onScopeChange,
}) {
    return (
        <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-black/[0.05] px-5 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-[#1F1F1F]">Recent Activity</h2>
                    <p className="text-xs text-gray-500">
                        {scope === "all" ? "Actions by the library team." : "Your latest actions."}
                    </p>
                </div>

                {canViewAll && (
                    <div className="flex shrink-0 rounded-lg bg-gray-100 p-0.5 text-xs font-medium">
                        {[
                            { key: "mine", label: "Mine" },
                            { key: "all", label: "Team" },
                        ].map((opt) => (
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
                )}
            </div>

            {loading ? (
                <div className="space-y-3 p-5">
                    {[0, 1, 2, 3, 4].map((n) => (
                        <div key={n} className="h-10 animate-pulse rounded-lg bg-gray-100" />
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
                <ul className="divide-y divide-black/[0.04]">
                    {items.map((item) => (
                        <li key={item.id} className="flex items-start justify-between gap-3 px-5 py-3">
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold text-[#1F1F1F]">
                                    {item.isMine ? "You" : item.actorName}
                                </span>{" "}
                                {item.message || item.code}
                            </p>
                            <span className="shrink-0 text-xs text-gray-400">
                                {timeAgo(item.createdAt)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}