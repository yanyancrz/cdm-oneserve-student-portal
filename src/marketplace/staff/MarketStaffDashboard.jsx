import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertTriangle,
    MessageCircle,
    PackageX,
    Truck,
} from "lucide-react";

import { staffApi } from "../services/marketApi";
import { FULFILLMENT, ORDER_STATUS, statusLabel } from "../config/marketVocabulary";
import { formatPesoShort } from "../utils/format";
import { MarketNotice, MarketPanel, MarketSkeleton, MarketStat } from "../components/marketUi";
import { StaffPageHeader } from "./MarketStaffLayout";

/**
 * The single Staff Dashboard.
 *
 * Pick Up and Campus Delivery share this one screen because they share one
 * ordering system - the Fulfillment tile is what splits them, and the Orders and
 * Campus Deliveries screens filter on the same column.
 *
 * Sales figures count COMPLETED orders only: a cancelled or in-flight order is
 * not money in hand. That rule lives on the server, so the numbers here are the
 * real ones.
 */
export default function MarketStaffDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await staffApi.dashboard();
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
            <div>
                <StaffPageHeader title="Dashboard" />
                <MarketPanel>
                    <MarketSkeleton rows={5} />
                </MarketPanel>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <StaffPageHeader title="Dashboard" />
                <MarketNotice tone="error" title="Could not load the dashboard">
                    {error}
                </MarketNotice>
            </div>
        );
    }

    // Both fulfillment paths, side by side. These are the steps staff can act on.
    const pickupSteps = [
        { key: "Pending", label: "Pending", value: data.pendingOrders },
        { key: "Confirmed", label: "Confirmed", value: data.confirmedOrders },
        { key: "Preparing", label: "Preparing", value: data.preparingOrders },
        { key: "ReadyForPickup", label: "Ready for Pickup", value: data.readyForPickupOrders },
    ];

    const deliverySteps = [
        { key: "OutForDelivery", label: "Out for Delivery", value: data.outForDeliveryOrders },
        { key: "Delivered", label: "Delivered", value: data.deliveredOrders },
    ];

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Dashboard"
                subtitle="Pick Up and Campus Delivery at a glance"
            />

            {/* Alerts first: these are the things that need action today. */}
            {(data.outOfStock > 0 || data.lowStock > 0 || data.unreadMessages > 0) && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {data.outOfStock > 0 && (
                        <AlertCard
                            tone="bad"
                            icon={<PackageX size={14} />}
                            title={`${data.outOfStock} out of stock`}
                            hint="Items a buyer can no longer order"
                            to="/marketplace/staff/inventory?state=out_of_stock"
                        />
                    )}

                    {data.lowStock > 0 && (
                        <AlertCard
                            tone="warn"
                            icon={<AlertTriangle size={14} />}
                            title={`${data.lowStock} low on stock`}
                            hint="At or below the low-stock threshold"
                            to="/marketplace/staff/inventory?state=low"
                        />
                    )}

                    {data.unreadMessages > 0 && (
                        <AlertCard
                            tone="info"
                            icon={<MessageCircle size={14} />}
                            title={`${data.unreadMessages} unread message${
                                data.unreadMessages === 1 ? "" : "s"
                            }`}
                            hint="Waiting in Chat / Concerns"
                            to="/marketplace/staff/chat"
                        />
                    )}
                </div>
            )}

            {/* Sales */}
            <MarketPanel title="Sales" subtitle="Completed orders only">
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
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

            {/* Fulfillment split */}
            <MarketPanel
                title="Orders"
                subtitle="Both fulfillment methods run on the same order flow"
            >
                <div className="grid gap-4 p-4 lg:grid-cols-2">
                    <div>
                        <Link
                            to={`/marketplace/staff/orders?method=${FULFILLMENT.PICKUP}`}
                            className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 transition hover:bg-slate-100"
                        >
                            <span className="text-xs font-semibold text-slate-700">
                                Pick Up
                            </span>
                            <span className="text-xs font-semibold text-[#106A2E]">
                                {data.pickupOrders}
                            </span>
                        </Link>

                        <div className="space-y-1.5">
                            {pickupSteps.map((step) => (
                                <StepRow key={step.key} step={step} method={FULFILLMENT.PICKUP} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <Link
                            to="/marketplace/staff/deliveries"
                            className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 transition hover:bg-slate-100"
                        >
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                <Truck size={12} />
                                Campus Delivery
                            </span>
                            <span className="text-xs font-semibold text-[#106A2E]">
                                {data.campusDeliveryOrders}
                            </span>
                        </Link>

                        <div className="space-y-1.5">
                            {/* Delivery shares Pending/Confirmed/Preparing with
                                pickup, so those are not repeated here. */}
                            {deliverySteps.map((step) => (
                                <StepRow key={step.key} step={step} method={FULFILLMENT.CAMPUS_DELIVERY} />
                            ))}

                            <StepRow
                                step={{
                                    key: ORDER_STATUS.Completed,
                                    label: "Completed",
                                    value: data.completedOrders,
                                }}
                                method={FULFILLMENT.CAMPUS_DELIVERY}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-4 sm:grid-cols-4">
                    <MarketStat label="Completed" value={data.completedOrders} tone="good" />
                    <MarketStat label="Cancelled" value={data.cancelledOrders} tone="bad" />
                    <MarketStat label="Products" value={data.totalProducts} />
                    <MarketStat
                        label="Open chats"
                        value={data.openConversations}
                        hint={`${data.unreadMessages} unread`}
                    />
                </div>
            </MarketPanel>
        </div>
    );
}

function StepRow({ step, method }) {
    if (step.value <= 0) return null;

    return (
        <Link
            to={`/marketplace/staff/orders?method=${method}&status=${step.key}`}
            className="flex items-center justify-between rounded-lg px-3 py-1.5 transition hover:bg-slate-50"
        >
            <span className="text-[11px] text-slate-500">
                {statusLabel(step.key)}
            </span>
            <span className="text-xs font-semibold text-slate-700">{step.value}</span>
        </Link>
    );
}

function AlertCard({ tone, icon, title, hint, to }) {
    const tones = {
        bad: "border-rose-200 bg-rose-50 text-rose-700",
        warn: "border-amber-200 bg-amber-50 text-amber-700",
        info: "border-sky-200 bg-sky-50 text-sky-700",
    };

    return (
        <Link to={to} className={`rounded-xl border px-3.5 py-3 transition hover:opacity-80 ${tones[tone]}`}>
            <div className="flex items-center gap-2">
                {icon}
                <p className="text-xs font-semibold">{title}</p>
            </div>
            <p className="mt-0.5 text-[10px] opacity-75">{hint}</p>
        </Link>
    );
}
