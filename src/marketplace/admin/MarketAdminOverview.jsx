import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, MapPin, PackageCheck, Truck, Users } from "lucide-react";

import { adminApi } from "../services/marketApi";
import { FULFILLMENT } from "../config/marketVocabulary";
import { formatPesoShort } from "../utils/format";
import {
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    MarketStat,
} from "../components/marketUi";
import { AdminPageHeader } from "./MarketAdminLayout";

/**
 * Admin monitoring overview.
 *
 * Purely a view. Sales figures count COMPLETED orders only - the same rule the
 * staff dashboard uses, so the two never disagree.
 *
 * Nothing on this screen can change anything. In particular there is no way from
 * here to edit, suspend or delete a Student or Faculty account: that lives in the
 * OneServe admin, and the marketplace only reads the shared user table.
 */
export default function MarketAdminOverview() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await adminApi.overview();
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
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                <AdminPageHeader title="Overview" />
                <MarketPanel>
                    <MarketSkeleton rows={5} />
                </MarketPanel>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <AdminPageHeader title="Overview" />
                <MarketNotice tone="error" title="Could not load the overview">
                    {error}
                </MarketNotice>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Overview"
                subtitle="Marketplace activity, read-only"
            />

            <MarketNotice tone="info" icon={<Eye size={14} />}>
                Monitoring only. The Admin cannot modify Student or Faculty accounts,
                products, stock, orders or chat through the marketplace - those are
                handled by Marketplace Staff.
            </MarketNotice>

            {/* Sales */}
            <MarketPanel title="Sales" subtitle="Completed orders only">
                <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
                    <MarketStat label="Today" value={formatPesoShort(data.todaySalesCentavos)} />
                    <MarketStat label="7 days" value={formatPesoShort(data.weekSalesCentavos)} />
                    <MarketStat label="30 days" value={formatPesoShort(data.monthSalesCentavos)} />
                    <MarketStat
                        label="All time"
                        value={formatPesoShort(data.totalSalesCentavos)}
                        tone="good"
                    />
                </div>
            </MarketPanel>

            {/* Orders */}
            <div className="grid gap-4 lg:grid-cols-2">
                <MarketPanel title="Orders">
                    <div className="grid grid-cols-2 gap-3 p-4">
                        <MarketStat label="Total orders" value={data.totalOrders} />
                        <MarketStat
                            label="Completed"
                            value={data.completedOrders}
                            tone="good"
                        />
                        <MarketStat
                            label="Pending"
                            value={data.pendingOrders}
                            tone="warn"
                        />
                        <MarketStat
                            label="Cancelled"
                            value={data.cancelledOrders}
                            tone="bad"
                        />
                    </div>
                </MarketPanel>

                <MarketPanel title="Fulfillment split">
                    <div className="grid grid-cols-2 gap-3 p-4">
                        <Link
                            to={`/marketplace/admin/transactions?method=${FULFILLMENT.PICKUP}`}
                            className="rounded-xl border border-slate-100 px-3.5 py-3 transition hover:bg-slate-50"
                        >
                            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.14em] text-slate-400">
                                <PackageCheck size={12} />
                                Pick Up
                            </p>
                            <p className="mt-1 text-lg font-semibold text-slate-800">
                                {data.pickupOrders}
                            </p>
                        </Link>

                        <Link
                            to={`/marketplace/admin/transactions?method=${FULFILLMENT.CAMPUS_DELIVERY}`}
                            className="rounded-xl border border-slate-100 px-3.5 py-3 transition hover:bg-slate-50"
                        >
                            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.14em] text-slate-400">
                                <Truck size={12} />
                                Campus Delivery
                            </p>
                            <p className="mt-1 text-lg font-semibold text-slate-800">
                                {data.campusDeliveryOrders}
                            </p>
                        </Link>
                    </div>
                </MarketPanel>
            </div>

            {/* Buyers */}
            <MarketPanel
                title="Buyer accounts"
                subtitle="Student and Faculty members who can order"
                action={
                    <Link
                        to="/marketplace/admin/accounts"
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#106A2E]"
                    >
                        <Users size={11} />
                        View accounts
                    </Link>
                }
            >
                <div className="grid grid-cols-2 gap-3 p-4">
                    <MarketStat label="Students" value={data.studentBuyers} />
                    <MarketStat label="Faculty" value={data.facultyBuyers} />
                </div>
            </MarketPanel>

            <MarketNotice tone="warn" icon={<MapPin size={14} />}>
                Campus Delivery is restricted to approved campus locations managed by
                Marketplace Staff, so buyers cannot ship outside the CDM campus.
            </MarketNotice>
        </div>
    );
}