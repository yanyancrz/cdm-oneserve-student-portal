import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, MapPin, Phone, Truck } from "lucide-react";

import { staffApi } from "../services/marketApi";
import { statusLabel, statusTone } from "../config/marketVocabulary";
import { formatDateTime, formatPeso } from "../utils/format";
import {
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
} from "../components/marketUi";
import { StaffPageHeader } from "./MarketStaffLayout";

/**
 * Campus Deliveries only.
 *
 * This is the SAME order table filtered to CampusDelivery - not a second queue
 * with its own state. An order that appears here is in the Orders screen too, and
 * advancing it here advances it there.
 *
 * Grouped by campus location, because that is how a staff member actually works:
 * one building per trip.
 */
export default function MarketStaffDeliveriesPage() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await staffApi.deliveries({ status });
                if (cancelled) return;

                setOrders(response.data || []);
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
    }, [status]);

    // Group by destination, then order each group by how soon it is due.
    const grouped = useMemo(() => {
        const map = new Map();

        for (const order of orders) {
            const key = order.campusLocationName || "Unassigned";
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(order);
        }

        return [...map.entries()]
            .map(([location, rows]) => [location, rows])
            .sort((a, b) => a[0].localeCompare(b[0]));
    }, [orders]);

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Campus Deliveries"
                subtitle="Strictly on campus, grouped by destination"
            />

            <MarketNotice tone="info" icon={<MapPin size={14} />}>
                Every delivery goes to an approved campus location. Buyers choose the
                location, so there is no free-form address to arrive at.
            </MarketNotice>

            <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
            >
                <option value="">All statuses</option>
                {[
                    "Pending",
                    "Confirmed",
                    "Preparing",
                    "OutForDelivery",
                    "Delivered",
                    "Completed",
                    "Cancelled",
                ].map((value) => (
                    <option key={value} value={value}>
                        {statusLabel(value)}
                    </option>
                ))}
            </select>

            {error && (
                <MarketNotice tone="error" title="Could not load deliveries">
                    {error}
                </MarketNotice>
            )}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={5} />
                </MarketPanel>
            ) : grouped.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<Truck size={20} />}
                        title="No campus deliveries"
                        hint="Orders placed with Campus Delivery will appear here, grouped by location."
                    />
                </MarketPanel>
            ) : (
                <div className="space-y-4">
                    {grouped.map(([location, rows]) => (
                        <MarketPanel
                            key={location}
                            title={location}
                            subtitle={`${rows.length} deliver${
                                rows.length === 1 ? "y" : "ies"
                            }`}
                        >
                            <ul className="divide-y divide-slate-100">
                                {rows.map((order) => (
                                    <li key={order.orderId}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/marketplace/staff/orders/${order.orderId}`
                                                )
                                            }
                                            className="flex w-full items-center gap-3 p-3.5 text-left transition hover:bg-slate-50"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-semibold text-slate-800">
                                                        {order.orderReference}
                                                    </span>
                                                    <span
                                                        className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusTone(order.status)}`}
                                                    >
                                                        {statusLabel(order.status)}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-[11px] text-slate-500">
                                                    {order.recipientName} &middot;{" "}
                                                    {order.buyerName}
                                                </p>

                                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                                                    <MapPin size={10} />
                                                    {order.specificLocation ||
                                                        "No specific area"}
                                                </p>

                                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                                                    <Phone size={10} />
                                                    {order.contactNumber}
                                                </p>

                                                <p className="mt-1 text-[10px] text-slate-400">
                                                    {formatDateTime(order.createdAt)}
                                                </p>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-semibold text-[#106A2E]">
                                                    {formatPeso(order.totalCentavos)}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {order.items.length} item
                                                    {order.items.length === 1 ? "" : "s"}
                                                </p>
                                                <ChevronRight
                                                    size={14}
                                                    className="ml-auto mt-1 text-slate-300"
                                                />
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </MarketPanel>
                    ))}
                </div>
            )}
        </div>
    );
}
