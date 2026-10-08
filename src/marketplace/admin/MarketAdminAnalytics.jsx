import { useEffect, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";

import { adminApi } from "../services/marketApi";
import { formatDate, formatPeso } from "../utils/format";
import {
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    MarketStat,
} from "../components/marketUi";
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
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await adminApi.analytics(days);
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
    }, [days]);

    // Bar height is relative to the busiest day in the window, so the chart reads
    // correctly whatever the absolute numbers are.
    const peak = Math.max(1, ...(data?.overTime || []).map((row) => row.amountCentavos));

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Analytics"
                subtitle="Sales by day, category and account type"
                action={
                    <select
                        value={days}
                        onChange={(event) => setDays(Number(event.target.value))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={365}>Last 365 days</option>
                    </select>
                }
            />

            {error && (
                <MarketNotice tone="error" title="Could not load analytics">
                    {error}
                </MarketNotice>
            )}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={6} />
                </MarketPanel>
            ) : !data ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<BarChart3 size={20} />}
                        title="No analytics yet"
                        hint="Charts appear once orders start completing."
                    />
                </MarketPanel>
            ) : (
                <>
                    <MarketPanel>
                        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                            <MarketStat
                                label={`Sales (${days}d)`}
                                value={formatPeso(data.totalSalesCentavos)}
                                tone="good"
                            />
                            <MarketStat
                                label="Days with sales"
                                value={data.overTime.length}
                            />
                            <MarketStat
                                label="Orders"
                                value={data.overTime.reduce(
                                    (sum, row) => sum + row.orders,
                                    0
                                )}
                            />
                            <MarketStat
                                label="Best sellers"
                                value={data.bestSellers.length}
                            />
                        </div>
                    </MarketPanel>

                    {/* Over time */}
                    <MarketPanel
                        title="Sales over time"
                        subtitle="Completed orders per day"
                    >
                        {data.overTime.length === 0 ? (
                            <MarketEmpty
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
                    </MarketPanel>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <MarketPanel title="By category">
                            <GroupList groups={data.byCategory} />
                        </MarketPanel>

                        <MarketPanel title="By account type">
                            <GroupList groups={data.byAccountType} />
                        </MarketPanel>
                    </div>

                    <MarketPanel title="Best sellers">
                        {data.bestSellers.length === 0 ? (
                            <MarketEmpty
                                icon={<TrendingUp size={18} />}
                                title="No sales yet"
                                hint="Best sellers appear once items are sold."
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[9px] uppercase tracking-wider text-slate-400">
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
                                    <tbody className="divide-y divide-slate-50">
                                        {data.bestSellers.map((row) => (
                                            <tr key={row.name}>
                                                <td className="px-4 py-2.5 font-semibold text-slate-800">
                                                    {row.name}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-500">
                                                    {row.category}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-slate-600">
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
                    </MarketPanel>
                </>
            )}
        </div>
    );
}

function GroupList({ groups }) {
    if (!groups || groups.length === 0) {
        return (
            <MarketEmpty
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
                        <span className="font-medium text-slate-700">
                            {group.label}
                        </span>
                        <span className="font-semibold text-slate-700">
                            {formatPeso(group.amountCentavos)}
                            <span className="ml-1.5 font-normal text-slate-400">
                                {group.orders} order{group.orders === 1 ? "" : "s"}
                            </span>
                        </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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