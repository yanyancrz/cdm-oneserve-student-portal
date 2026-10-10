import { useEffect, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";

import { adminApi } from "../services/marketApi";
import { formatDate, formatPeso } from "../utils/format";
import {
    AdminEmpty,
    AdminNotice,
    AdminPanel,
    AdminSkeleton,
    adminSelectClass,
    AdminStat,
} from "../components/marketAdminUi";
import { AdminPageHeader } from "./MarketAdminLayout";

/**
 * Sales analytics for the Admin.
 *
 * Completed orders only - the same rule as the overview and the staff dashboard,
 * so a cancelled order never inflates a chart.
 *
 * The window is a request parameter, clamped server-side to 1..365 days.
 */
export default function MarketAdminAnalytics() {
    const [days, setDays] = useState(30);
    const [workspaceId, setWorkspaceId] = useState("");
    const [workspaces, setWorkspaces] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        adminApi
            .workspaces()
            .then((response) => setWorkspaces(response.data || []))
            .catch(() => {
                // The charts work without the filter; it just hides.
            });
    }, []);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await adminApi.analytics(
                    days,
                    workspaceId || undefined
                );
                if (cancelled) return;

                setData(response.data);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [days, workspaceId]);

    // Bar height is relative to the busiest day in the window, so the chart reads
    // correctly whatever the absolute numbers are.
    const peak = Math.max(1, ...(data?.overTime || []).map((row) => row.amountCentavos));

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Analytics"
                subtitle="Sales by day, category and account type"
                action={
                    <div className="flex gap-2">
                        {workspaces.length > 0 && (
                            <select
                                value={workspaceId}
                                onChange={(event) => setWorkspaceId(event.target.value)}
                                className={adminSelectClass}
                            >
                                <option value="">All stalls</option>
                                {workspaces.map((workspace) => (
                                    <option key={workspace.workspaceId} value={workspace.workspaceId}>
                                        {workspace.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <select
                            value={days}
                            onChange={(event) => setDays(Number(event.target.value))}
                            className={adminSelectClass}
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                            <option value={365}>Last 365 days</option>
                        </select>
                    </div>
                }
            />

            {error && (
                <AdminNotice tone="error" title="Could not load analytics">
                    {error}
                </AdminNotice>
            )}

            {loading ? (
                <AdminPanel>
                    <AdminSkeleton rows={6} />
                </AdminPanel>
            ) : !data ? (
                <AdminPanel>
                    <AdminEmpty
                        icon={<BarChart3 size={20} />}
                        title="No analytics yet"
                        hint="Charts appear once orders start completing."
                    />
                </AdminPanel>
            ) : (
                <>
                    <AdminPanel>
                        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                            <AdminStat
                                label={`Sales (${days}d)`}
                                value={formatPeso(data.totalSalesCentavos)}
                                tone="good"
                            />
                            <AdminStat
                                label="Days with sales"
                                value={data.overTime.length}
                            />
                            <AdminStat
                                label="Orders"
                                value={data.overTime.reduce(
                                    (sum, row) => sum + row.orders,
                                    0
                                )}
                            />
                            <AdminStat
                                label="Best sellers"
                                value={data.bestSellers.length}
                            />
                        </div>
                    </AdminPanel>

                    {/* Over time */}
                    <AdminPanel
                        title="Sales over time"
                        subtitle="Completed orders per day"
                    >
                        {data.overTime.length === 0 ? (
                            <AdminEmpty
                                icon={<TrendingUp size={18} />}
                                title="No completed orders"
                                hint="Nothing to plot in this window."
                            />
                        ) : (
                            <div className="flex h-44 items-end gap-1 overflow-x-auto p-4">
                                {data.overTime.map((row) => (
                                    <div
                                        key={row.day}
                                        className="group relative flex min-w-[10px] flex-1 flex-col items-center justify-end"
                                        title={`${formatDate(row.day)}: ${formatPeso(row.amountCentavos)}`}
                                    >
                                        <div
                                            className="w-full rounded-t bg-[#106A2E]/70 transition group-hover:bg-[#106A2E]"
                                            style={{
                                                height: `${Math.max(
                                                    4,
                                                    Math.round(
                                                        (row.amountCentavos / peak) * 130
                                                    )
                                                )}px`,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </AdminPanel>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <AdminPanel title="By category">
                            <GroupList groups={data.byCategory} />
                        </AdminPanel>

                        <AdminPanel title="By account type">
                            <GroupList groups={data.byAccountType} />
                        </AdminPanel>
                    </div>

                    <AdminPanel title="Best sellers">
                        {data.bestSellers.length === 0 ? (
                            <AdminEmpty
                                icon={<TrendingUp size={18} />}
                                title="No sales yet"
                                hint="Best sellers appear once items are sold."
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-black/[0.05] bg-gray-50/70 text-[9px] uppercase tracking-wider text-gray-400">
                                            <th className="px-4 py-2.5 font-semibold">
                                                Item
                                            </th>
                                            <th className="px-4 py-2.5 font-semibold">
                                                Category
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-semibold">
                                                Units
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-semibold">
                                                Sales
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/[0.04]">
                                        {data.bestSellers.map((row) => (
                                            <tr key={row.name}>
                                                <td className="px-4 py-2.5 font-semibold text-gray-800">
                                                    {row.name}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-500">
                                                    {row.category}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-gray-600">
                                                    {row.unitsSold}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-semibold text-[#106A2E]">
                                                    {formatPeso(row.amountCentavos)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </AdminPanel>
                </>
            )}
        </div>
    );
}

function GroupList({ groups }) {
    if (!groups || groups.length === 0) {
        return (
            <AdminEmpty
                title="Nothing yet"
                hint="This breakdown fills in as orders complete."
            />
        );
    }

    const peak = Math.max(1, ...groups.map((group) => group.amountCentavos));

    return (
        <ul className="space-y-2.5 p-4">
            {groups.map((group) => (
                <li key={group.label}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="font-medium text-gray-700">
                            {group.label}
                        </span>
                        <span className="font-semibold text-gray-700">
                            {formatPeso(group.amountCentavos)}
                            <span className="ml-1.5 font-normal text-gray-400">
                                {group.orders} order{group.orders === 1 ? "" : "s"}
                            </span>
                        </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className="h-full rounded-full bg-[#106A2E]/70"
                            style={{
                                width: `${Math.round(
                                    (group.amountCentavos / peak) * 100
                                )}%`,
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}