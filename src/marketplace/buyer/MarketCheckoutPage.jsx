import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, Clock, CreditCard, MapPin, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import toast from "react-hot-toast";

import { buyerApi, campusApi } from "../services/marketApi";
import {
    FULFILLMENT,
    PAYMENT_METHOD,
    PAYMENT_METHOD_OPTIONS,
    fulfillmentLabel,
    slotLabel,
} from "../config/marketVocabulary";
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

    // Campus services: a booked pickup slot, the campus card, and the card's
    // balance (read to warn before the order is placed, never to charge -
    // the server does that itself).
    const [preOrderOptions, setPreOrderOptions] = useState(null);
    const [card, setCard] = useState(null);
    const [preOrder, setPreOrder] = useState(false);
    const [slot, setSlot] = useState("");
    const [payment, setPayment] = useState(PAYMENT_METHOD.CASH);

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

    // The pre-order window and the card balance. Both are supporting reads, so
    // a failure here must not block checkout - the server re-validates the slot
    // and does the charging anyway.
    useEffect(() => {
        let cancelled = false;

        Promise.all([campusApi.preOrderOptions(), campusApi.myCard()])
            .then(([optionsResponse, cardResponse]) => {
                if (cancelled) return;
                setPreOrderOptions(optionsResponse.data);
                setCard(cardResponse.data);
            })
            .catch(() => {
                // Silent by design: cash on pickup always works, so a failed
                // supporting read only means the extras stay hidden.
            });

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

    // The cart grouped by stall: each stall fulfils its own order, so the
    // buyer sees one total per counter before confirming.
    const groups = useMemo(() => {
        const map = new Map();

        for (const item of cart) {
            const key = item.workspaceId ?? 0;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(item);
        }

        return [...map.entries()].map(([workspaceId, items]) => ({
            workspaceId,
            workspaceName:
                items.find((item) => item.workspaceName)?.workspaceName ||
                "Marketplace",
            items,
            subtotal: items.reduce((sum, item) => sum + item.subtotalCentavos, 0),
        }));
    }, [cart]);

    const subtotal = groups.reduce((sum, group) => sum + group.subtotal, 0);

    const deliveryEnabled = info?.deliveryEnabled !== false;
    const isDelivery = method === FULFILLMENT.CAMPUS_DELIVERY;

    // Pick Up is never charged a delivery fee, whatever the setting says.
    const deliveryFee = isDelivery && deliveryEnabled ? info?.deliveryFeeCentavos || 0 : 0;
    const total = subtotal + deliveryFee;

    const chosenLocation = locations.find(
        (location) => String(location.locationId) === String(locationId)
    );

    const blocked = cart.some((item) => !item.isAvailable);

    // A pre-order is always collected, so booking a slot and asking for campus
    // delivery are mutually exclusive. Switching to delivery turns the slot off
    // rather than silently sending a slot the server will drop.
    const isPreOrder = preOrder && !isDelivery;

    // Slot options come from the server's window and step, so the picker cannot
    // offer a time the server would reject. Capped so a 7-day window does not
    // render 672 identical-looking buttons.
    const slots = useMemo(() => {
        if (!isPreOrder || !preOrderOptions?.earliestSlotUtc) return [];

        const stepMinutes = preOrderOptions.slotStepMinutes || 15;
        const from = new Date(preOrderOptions.earliestSlotUtc).getTime();
        const to = new Date(preOrderOptions.latestSlotUtc).getTime();
        const step = stepMinutes * 60_000;
        const maxSlots = 40;

        const out = [];
        for (let at = from; at <= to && out.length < maxSlots; at += step) {
            out.push(new Date(at).toISOString());
        }

        return out;
    }, [isPreOrder, preOrderOptions]);

    const cardBalance = card?.balanceCentavos || 0;
    const cardBlocked = card?.canPay === false;
    const useCard = payment === PAYMENT_METHOD.CAMPUS_CARD;
    const cardShort = useCard && cardBalance < total;

    const problems = [];
    if (cart.length === 0) problems.push("Your cart is empty.");
    if (blocked) problems.push("Some items exceed the available stock.");
    if (isPreOrder && !slot) problems.push("Choose a pickup slot.");
    if (useCard && !card) problems.push("Your campus card could not be loaded.");
    if (useCard && cardBlocked) problems.push("Your campus card is blocked. Pay cash instead.");
    if (cardShort) {
        problems.push(
            `Your campus card balance (${formatPeso(cardBalance)}) is short of this order (${formatPeso(total)}).`
        );
    }
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
                paymentMethod: payment,
                // Only sent for a real pre-order; the server drops it otherwise,
                // but not sending it keeps the intent unambiguous.
                scheduledFor: isPreOrder ? slot : null,
                recipientName: isDelivery ? recipientName.trim() : null,
                contactNumber: isDelivery ? contactNumber.trim() : null,
                campusLocationId: isDelivery ? Number(locationId) : null,
                specificLocation: isDelivery ? specificLocation.trim() : null,
                deliveryInstructions: isDelivery ? instructions.trim() : null,
                notes: notes.trim() || null,
            });

            const placed = response.data?.orders || [];

            // The cart became order(s), so the header badge is now zero.
            setCount(0);

            if (placed.length === 0) {
                toast.success("Order placed.");
            } else if (placed.length === 1) {
                toast.success(`Order ${placed[0].orderReference} placed.`);
            } else {
                toast.success(
                    `${placed.length} orders placed - one per stall (${placed
                        .map((order) => order.orderReference)
                        .join(", ")}).`
                );
            }

            if (placed.length === 1) {
                navigate(`/marketplace/orders/${placed[0].orderId}`, { replace: true });
            } else {
                navigate("/marketplace/orders", { replace: true });
            }
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

            {/* Pre-ordering. Only offered for Pick Up, because a meal taken to
                a room cannot honour a timed slot. */}
            {!isDelivery && preOrderOptions?.enabled ? (
                <MarketPanel
                    title="Pre-order"
                    subtitle="Book a pickup slot so it is ready when you arrive."
                >
                    <div className="space-y-3 p-3.5">
                        <MethodOption
                            active={isPreOrder}
                            onClick={() => {
                                setPreOrder((current) => !current);
                                setSlot("");
                            }}
                            icon={<Clock size={16} />}
                            title="Pre-order for a specific time"
                            hint="Best for canteen meals between classes."
                        />

                        {isPreOrder ? (
                            <div>
                                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                    Pickup slot
                                </p>

                                {slots.length === 0 ? (
                                    <MarketNotice tone="warn" title="No slots available">
                                        There is nothing bookable right now. Please come in without a
                                        slot, or try again later.
                                    </MarketNotice>
                                ) : (
                                    <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                                        {slots.map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => setSlot(option)}
                                                className={`rounded-xl border px-2 py-2 text-[10px] font-semibold transition ${
                                                    slot === option
                                                        ? "border-[#106A2E] bg-[#106A2E] text-white"
                                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                                }`}
                                            >
                                                {slotLabel(option)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </MarketPanel>
            ) : null}

            {/* Payment. The campus card is debited by the server when the order
                is placed - this screen only reads the balance to warn early. */}
            <MarketPanel title="Payment method">
                <div className="space-y-2 p-3.5">
                    {PAYMENT_METHOD_OPTIONS.map((option) => {
                        const isCardOption = option.value === PAYMENT_METHOD.CAMPUS_CARD;

                        return (
                            <MethodOption
                                key={option.value}
                                active={payment === option.value}
                                // A blocked card stays visible but unselectable,
                                // so the buyer learns why rather than wondering
                                // where the option went.
                                disabled={isCardOption && (cardBlocked || !card)}
                                onClick={() => setPayment(option.value)}
                                icon={
                                    isCardOption ? (
                                        <CreditCard size={16} />
                                    ) : (
                                        <Banknote size={16} />
                                    )
                                }
                                title={option.label}
                                hint={
                                    isCardOption
                                        ? cardBlocked
                                            ? "Your card is blocked"
                                            : card
                                              ? `Balance ${formatPeso(cardBalance)}`
                                              : "Loading your card..."
                                        : option.hint
                                }
                                badge={
                                    isCardOption ? formatPeso(cardBalance) : option.value === "cash" ? "At pickup" : ""
                                }
                            />
                        );
                    })}

                    {cardShort ? (
                        <MarketNotice tone="warn" title="Not enough balance">
                            Top up at the counter, or pay cash on pickup instead.
                        </MarketNotice>
                    ) : null}
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
                    {/* One fulfillment per stall: a cart spanning counters
                        becomes one order each, tracked separately. */}
                    {groups.map((group) => (
                        <div key={group.workspaceId}>
                            {groups.length > 1 && (
                                <p className="mb-1.5 mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#106A2E]/70 first:mt-0">
                                    {group.workspaceName}
                                </p>
                            )}
                            {group.items.map((item) => (
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
                            {groups.length > 1 && (
                                <p className="mt-1 text-right text-[11px] font-semibold text-slate-500">
                                    Stall subtotal: {formatPeso(group.subtotal)}
                                </p>
                            )}
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
                        {isDelivery && groups.length > 1 && deliveryFee > 0 && (
                            <p className="text-[10px] leading-4 text-slate-400">
                                Each stall delivers on its own, so the fee
                                applies once per stall order.
                            </p>
                        )}
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
