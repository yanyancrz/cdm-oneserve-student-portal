import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, LineChart, RefreshCw, TrendingUp } from "lucide-react";

import { storeApi } from "../services/marketApi";
import {
    MarketButton,
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    MarketStat,
} from "../components/marketUi";
import { formatPeso, formatPesoShort } from "../utils/format";

/** "2026-10-17" -> "Sat, Oct 17", read as a plain calendar day (no UTC shift). */
function dayLabel(iso) {
    const [year, month, day] = String(iso || "").split("-").map(Number);
    if (!year || !month || !day) return iso || "";

    return new Date(year, month - 1, day).toLocaleDateString("en-PH", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

/**
 * A storefront's sales and forecast - the owner's figures, or a team member
 * holding the "analytics" permission.
 *
 * READ-ONLY and server-computed. The numbers come from the
 * marketplace_sales_daily view (018_store_analytics.sql), which counts
 * COMPLETED, PAID orders only - never cancelled, never unpaid, never refunded.
 *
 * The forecast is deliberately plain: the average of the previous seven
 * complete days, quiet days counting as zero. The original CampusMarket called
 * it "not AI", and it is not one - one busy Saturday cannot be allowed to run
 * the number up, so it is an average and it says so.
 */
export default function MarketStoreInsightsPage() {
    const { storeId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const load = useCallback(
        async ({ silent = false } = {}) => {
            if (!silent) setLoading(true);
            setError("");

            try {
                const response = await storeApi.analytics(storeId);
                if (mountedRef.current) setData(response.data);
            } catch (err) {
                if (mountedRef.current) setError(err.message);
            } finally {
                if (mountedRef.current && !silent) setLoading(false);
            }
        },
        [storeId]
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={5} />
            </MarketPanel>
        );
    }

    // Oldest first for the tallest-sales scan; the table is shown newest first.
    const series = (data?.salesDaily || []).slice().reverse();
    const peak = series.reduce((max, row) => Math.max(max, row.amountCentavos), 0);
    const hasSales = (data?.sales28dCentavos || 0) > 0;

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => navigate(`/marketplace/stores/${storeId}`)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
            >
                <ChevronLeft size={14} aria-hidden="true" />
                Back to storefront
            </button>

            {error ? (
                <MarketNotice tone="error" title="Could not load these figures">
                    {error}
                </MarketNotice>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
                <MarketStat
                    label="Paid sales · 28 days"
                    value={formatPesoShort(data?.sales28dCentavos)}
                    hint="Completed & paid orders only"
                />
                <MarketStat
                    label="Estimated next 7 days"
                    value={formatPesoShort(data?.forecast7dCentavos)}
                    hint="Average of the previous 7 days"
                    tone="good"
                />
                <MarketStat
                    label="Daily average · previous 7 days"
                    value={formatPesoShort(data?.dailyAverageCentavos)}
                    hint={`${data?.daysWithSales ?? 0} of 7 days had sales`}
                />
            </div>

            <MarketPanel
                title="Sales by day"
                subtitle="The last 28 campus days"
                action={
                    <MarketButton variant="secondary" onClick={() => load({ silent: true })}>
                        <RefreshCw size={13} />
                        Refresh
                    </MarketButton>
                }
            >
                {!hasSales ? (
                    <div className="p-4">
                        <MarketEmpty
                            icon={<LineChart size={20} />}
                            title="No paid sales yet"
                            hint="Figures appear here once orders are completed and paid at the counter."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="text-[9px] uppercase tracking-[.14em] text-slate-400">
                                    <th className="px-4 py-2 font-semibold">Day</th>
                                    <th className="px-4 py-2 font-semibold">Sales</th>
                                    <th className="px-4 py-2 text-right font-semibold">Orders</th>
                                </tr>
                            </thead>

                            <tbody>
                                {series.map((row) => (
                                    <tr key={row.day} className="border-t border-slate-100">
                                        <td className="whitespace-nowrap px-4 py-2 text-[11px] text-slate-600">
                                            {dayLabel(row.day)}
                                        </td>

                                        <td className="w-full px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-1.5 shrink-0 rounded-full bg-[#106A2E]"
                                                    style={{
                                                        width: peak > 0
                                                            ? `${Math.max(4, (row.amountCentavos / peak) * 100)}%`
                                                            : "0",
                                                    }}
                                                    aria-hidden="true"
                                                />
                                                <span className="whitespace-nowrap text-[11px] font-semibold tabular-nums text-slate-700">
                                                    {formatPeso(row.amountCentavos)}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-2 text-right text-[11px] tabular-nums text-slate-500">
                                            {row.orders}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </MarketPanel>

            <MarketNotice tone="info" icon={<TrendingUp size={14} />} title="How the forecast works">
                Sales count completed orders that are already paid, including delivery
                charges and excluding anything refunded. The estimate averages the previous
                seven complete campus days - quiet days count as zero - so it is an
                estimate, not a prediction.
            </MarketNotice>
        </div>
    );
}
