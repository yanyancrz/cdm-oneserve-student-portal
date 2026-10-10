import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, MapPin, PackageCheck, Truck, Users } from "lucide-react";

import { adminApi } from "../services/marketApi";
import { FULFILLMENT } from "../config/marketVocabulary";
import { formatPesoShort } from "../utils/format";
import {
    AdminNotice,
    AdminPanel,
    AdminSkeleton,
    AdminStat,
} from "../components/marketAdminUi";
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
                <AdminPanel>
                    <AdminSkeleton rows={5} />
                </AdminPanel>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <AdminPageHeader title="Overview" />
                <AdminNotice tone="error" title="Could not load the overview">
                    {error}
                </AdminNotice>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Overview"
                subtitle="Marketplace activity, read-only"
            />

            <AdminNotice tone="info" icon={<Eye size={14} />}>
                Monitoring only. The Admin cannot modify Student or Faculty accounts,
                products, stock, orders or chat through the marketplace - those are
                handled by Marketplace Staff.
            </AdminNotice>

            {/* Sales */}
            <AdminPanel title="Sales" subtitle="Completed orders only">
                <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
                    <AdminStat label="Today" value={formatPesoShort(data.todaySalesCentavos)} />
                    <AdminStat label="7 days" value={formatPesoShort(data.weekSalesCentavos)} />
                    <AdminStat label="30 days" value={formatPesoShort(data.monthSalesCentavos)} />
                    <AdminStat
                        label="All time"
                        value={formatPesoShort(data.totalSalesCentavos)}
                        tone="good"
                    />
                </div>
            </AdminPanel>

            {/* Orders */}
            <div className="grid gap-4 lg:grid-cols-2">
                <AdminPanel title="Orders">
                    <div className="grid grid-cols-2 gap-3 p-4">
                        <AdminStat label="Total orders" value={data.totalOrders} />
                        <AdminStat
                            label="Completed"
                            value={data.completedOrders}
                            tone="good"
                        />
                        <AdminStat
                            label="Pending"
                            value={data.pendingOrders}
                            tone="warn"
                        />
                        <AdminStat
                            label="Cancelled"
                            value={data.cancelledOrders}
                            tone="bad"
                        />
                    </div>
                </AdminPanel>

                <AdminPanel title="Fulfillment split">
                    <div className="grid grid-cols-2 gap-3 p-4">
                        <Link
                            to={`/marketplace/admin/transactions?method=${FULFILLMENT.PICKUP}`}
                            className="rounded-xl border border-black/[0.05] bg-white px-3.5 py-3 transition hover:bg-[#F3F8F4]"
                        >
                            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.14em] text-gray-400">
                                <PackageCheck size={12} />
                                Pick Up
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-800">
                                {data.pickupOrders}
                            </p>
                        </Link>

                        <Link
                            to={`/marketplace/admin/transactions?method=${FULFILLMENT.CAMPUS_DELIVERY}`}
                            className="rounded-xl border border-black/[0.05] bg-white px-3.5 py-3 transition hover:bg-[#F3F8F4]"
                        >
                            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.14em] text-gray-400">
                                <Truck size={12} />
                                Campus Delivery
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-800">
                                {data.campusDeliveryOrders}
                            </p>
                        </Link>
                    </div>
                </AdminPanel>
            </div>

            {/* Buyers */}
            <AdminPanel
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
                    <AdminStat label="Students" value={data.studentBuyers} />
                    <AdminStat label="Faculty" value={data.facultyBuyers} />
                </div>
            </AdminPanel>

            <AdminNotice tone="warn" icon={<MapPin size={14} />}>
                Campus Delivery is restricted to approved campus locations managed by
                Marketplace Staff, so buyers cannot ship outside the CDM campus.
            </AdminNotice>
        </div>
    );
}