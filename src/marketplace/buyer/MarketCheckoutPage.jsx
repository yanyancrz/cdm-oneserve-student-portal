import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import toast from "react-hot-toast";

import { buyerApi } from "../services/marketApi";
import { FULFILLMENT, fulfillmentLabel } from "../config/marketVocabulary";
import { formatPeso } from "../utils/format";
import {
    MarketButton,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketSelectClass,
    marketInputClass,
} from "../components/marketUi";
import { useMarketCart } from "./marketCartCount";

/**
 * Checkout: the ONE place the fulfillment method is chosen.
 *
 * Pick Up needs nothing extra. Campus Delivery requires an approved campus
 * location from the staff-managed list - there is deliberately no address input
 * anywhere on this screen, because "delivery is strictly within campus" is only
 * enforceable if an off-campus address cannot be typed at all.
 *
 * The delivery fee comes from marketplace_settings. It is displayed before the
 * order is placed and re-derived by the server, so what is shown here is what is
 * charged.
 */
export default function MarketCheckoutPage() {
    const navigate = useNavigate();
    const { setCount } = useMarketCart();

    const [cart, setCart] = useState([]);
    const [info, setInfo] = useState(null);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [method, setMethod] = useState(FULFILLMENT.PICKUP);
    const [locationId, setLocationId] = useState("");
    const [specificLocation, setSpecificLocation] = useState("");
    const [recipientName, setRecipientName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [instructions, setInstructions] = useState("");
    const [notes, setNotes] = useState("");

    // Stays the same for the whole checkout. If the request is retried - or the
    // tap is double-registered - the server returns the SAME order instead of
    // creating a second one.
    const [requestKey] = useState(
        () =>
            "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0;
                const v = c === "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            })
    );

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);

                const [cartResponse, infoResponse, locationResponse] = await Promise.all([
                    buyerApi.cart(),
                    buyerApi.checkoutInfo(),
                    buyerApi.campusLocations(),
                ]);

                if (cancelled) return;

                setCart(cartResponse.data || []);
                setInfo(infoResponse.data);
                setLocations(locationResponse.data || []);
            } catch (err) {
                if (!cancelled) toast.error(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    // The buyer is who receives the order unless they name somebody else.
    useEffect(() => {
        buyerApi
            .me()
            .then((response) => {
                const buyer = response.data;
                if (!buyer) return;
                setRecipientName((current) => current || buyer.fullName || "");
                setContactNumber((current) => current || buyer.contactNumber || "");
            })
            .catch(() => {
                // Non-blocking: the buyer can still type both by hand.
            });
    }, []);

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.subtotalCentavos, 0),
        [cart]
    );

    const deliveryEnabled = info?.deliveryEnabled !== false;
    const isDelivery = method === FULFILLMENT.CAMPUS_DELIVERY;

    // Pick Up is never charged a delivery fee, whatever the setting says.
    const deliveryFee = isDelivery && deliveryEnabled ? info?.deliveryFeeCentavos || 0 : 0;
    const total = subtotal + deliveryFee;

    const chosenLocation = locations.find(
        (location) => String(location.locationId) === String(locationId)
    );

    const blocked = cart.some((item) => !item.isAvailable);

    const problems = [];
    if (cart.length === 0) problems.push("Your cart is empty.");
    if (blocked) problems.push("Some items exceed the available stock.");
    if (isDelivery) {
        if (!locationId) problems.push("Choose a campus location.");
        if (recipientName.trim().length < 2) problems.push("Enter the recipient name.");
        if (contactNumber.trim().length < 7) problems.push("Enter a contact number.");
        if (chosenLocation?.allowsDetails && specificLocation.trim().length < 2) {
            problems.push(`Add the specific area within ${chosenLocation.locationName}.`);
        }
    }

    const placeOrder = async () => {
        if (problems.length > 0) return;

        setSubmitting(true);

        try {
            const response = await buyerApi.placeOrder({
                requestKey,
                fulfillmentMethod: method,
                paymentMethod: "cash",
                recipientName: isDelivery ? recipientName.trim() : null,
                contactNumber: isDelivery ? contactNumber.trim() : null,
                campusLocationId: isDelivery ? Number(locationId) : null,
                specificLocation: isDelivery ? specificLocation.trim() : null,
                deliveryInstructions: isDelivery ? instructions.trim() : null,
                notes: notes.trim() || null,
            });

            const order = response.data;

            // The cart became an order, so the header badge is now zero.
            setCount(0);

            toast.success(`Order ${order.orderReference} placed.`);

            navigate(`/marketplace/orders/${order.orderId}`, { replace: true });
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={5} />
            </MarketPanel>
        );
    }

    return (
        <div className="space-y-4">
            <MarketPanel title="Fulfillment method">
                <div className="space-y-2 p-3.5">
                    <MethodOption
                        active={!isDelivery}
                        onClick={() => setMethod(FULFILLMENT.PICKUP)}
                        icon={<PackageCheck size={16} />}
                        title="Pick Up"
                        hint={info?.pickupLocation || "Collect at the campus counter"}
                        badge="Free"
                    />

                    <MethodOption
                        active={isDelivery}
                        onClick={() => deliveryEnabled && setMethod(FULFILLMENT.CAMPUS_DELIVERY)}
                        disabled={!deliveryEnabled}
                        icon={<Truck size={16} />}
                        title="Campus Delivery"
                        hint={
                            deliveryEnabled
                                ? "Delivered to an approved campus location"
                                : "Temporarily unavailable"
                        }
                        badge={
                            deliveryEnabled
                                ? info?.deliveryFeeCentavos
                                    ? formatPeso(info.deliveryFeeCentavos)
                                    : "Free"
                                : "Off"
                        }
                    />

                    {isDelivery && info?.deliveryRestrictionNotice && (
                        <MarketNotice tone="info" icon={<MapPin size={14} />}>
                            {info.deliveryRestrictionNotice}
                        </MarketNotice>
                    )}
                </div>
            </MarketPanel>

            {isDelivery && (
                <MarketPanel title="Campus delivery details">
                    <div className="space-y-3 p-3.5">
                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                Campus location
                            </span>
                            <select
                                value={locationId}
                                onChange={(event) => setLocationId(event.target.value)}
                                className={marketSelectClass}
                            >
                                <option value="">Choose a location...</option>
                                {locations.map((location) => (
                                    <option
                                        key={location.locationId}
                                        value={location.locationId}
                                    >
                                        {location.locationName}
                                        {location.description
                                            ? ` - ${location.description}`
                                            : ""}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {chosenLocation?.allowsDetails && (
                            <label className="block">
                                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                    Room / office / area within {chosenLocation.locationName}
                                </span>
                                <input
                                    type="text"
                                    value={specificLocation}
                                    onChange={(event) =>
                                        setSpecificLocation(event.target.value)
                                    }
                                    placeholder="e.g. Room 204"
                                    className={marketInputClass}
                                />
                            </label>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                    Recipient name
                                </span>
                                <input
                                    type="text"
                                    value={recipientName}
                                    onChange={(event) =>
                                        setRecipientName(event.target.value)
                                    }
                                    className={marketInputClass}
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                    Contact number
                                </span>
                                <input
                                    type="tel"
                                    value={contactNumber}
                                    onChange={(event) =>
                                        setContactNumber(event.target.value)
                                    }
                                    placeholder="09XX XXX XXXX"
                                    className={marketInputClass}
                                />
                            </label>
                        </div>

                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                Delivery instructions (optional)
                            </span>
                            <textarea
                                value={instructions}
                                onChange={(event) =>
                                    setInstructions(event.target.value)
                                }
                                rows={2}
                                className={marketInputClass}
                            />
                        </label>
                    </div>
                </MarketPanel>
            )}

            {isDelivery && deliveryEnabled && (
                <MarketPanel title="Where to collect at the counter (Pick Up)">
                    <div className="p-3.5">
                        <p className="text-sm font-medium text-slate-700">
                            {info?.pickupLocation}
                        </p>
                        {info?.pickupInstructions && (
                            <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                {info.pickupInstructions}
                            </p>
                        )}
                    </div>
                </MarketPanel>
            )}

            <MarketPanel title="Order summary">
                <div className="space-y-2.5 p-3.5">
                    {cart.map((item) => (
                        <div
                            key={item.cartItemId}
                            className="flex items-start justify-between gap-3 text-xs"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium text-slate-700">
                                    {item.productName}
                                    {item.variantName
                                        ? ` (${item.variantName})`
                                        : ""}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    {item.quantity} x{" "}
                                    {formatPeso(item.unitPriceCentavos)}
                                </p>
                            </div>
                            <span className="shrink-0 font-semibold text-slate-700">
                                {formatPeso(item.subtotalCentavos)}
                            </span>
                        </div>
                    ))}

                    <div className="border-t border-slate-100 pt-2.5">
                        <Row
                            label="Subtotal"
                            value={formatPeso(subtotal)}
                        />
                        <Row
                            label={`${fulfillmentLabel(method)} fee`}
                            value={deliveryFee === 0 ? "Free" : formatPeso(deliveryFee)}
                        />
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-800">
                                Total
                            </span>
                            <span className="text-lg font-semibold text-[#106A2E]">
                                {formatPeso(total)}
                            </span>
                        </div>
                    </div>

                    <label className="block pt-1">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Note for Marketplace Staff (optional)
                        </span>
                        <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            rows={2}
                            className={marketInputClass}
                        />
                    </label>

                    <p className="text-[10px] leading-4 text-slate-400">
                        Payment is cash on pickup or on campus delivery. The total is
                        calculated by the server when the order is placed.
                    </p>

                    {problems.length > 0 && (
                        <MarketNotice tone="warn" title="Before you place the order">
                            <ul className="list-inside list-disc space-y-0.5">
                                {problems.map((problem) => (
                                    <li key={problem}>{problem}</li>
                                ))}
                            </ul>
                        </MarketNotice>
                    )}

                    <MarketButton
                        size="lg"
                        className="w-full"
                        onClick={placeOrder}
                        disabled={submitting || problems.length > 0}
                    >
                        <ShoppingBag size={14} />
                        {submitting ? "Placing order..." : "Place order"}
                    </MarketButton>
                </div>
            </MarketPanel>
        </div>
    );
}

function MethodOption({ active, onClick, disabled, icon, title, hint, badge }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                disabled
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                    : active
                      ? "border-[#106A2E] bg-[#106A2E]/5"
                      : "border-slate-200 bg-white hover:border-[#106A2E]/30"
            }`}
        >
            <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    active ? "bg-[#106A2E] text-white" : "bg-slate-100 text-slate-500"
                }`}
            >
                {icon}
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-slate-800">
                    {title}
                </span>
                <span className="block text-[10px] text-slate-400">{hint}</span>
            </span>

            <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    active
                        ? "bg-[#106A2E] text-white"
                        : "bg-slate-100 text-slate-500"
                }`}
            >
                {badge}
            </span>
        </button>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-700">{value}</span>
        </div>
    );
}
