import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { buyerApi } from "../services/marketApi";
import { formatPeso } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketImage,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
} from "../components/marketUi";
import { countItems, useMarketCart } from "./marketCartCount";

/**
 * The buyer's cart.
 *
 * Quantities are capped by live availability, and a line that can no longer be
 * ordered is kept visible with the reason rather than silently dropped - the
 * buyer needs to see WHY checkout is blocked.
 *
 * Checkout lives on its own page: the delivery method and campus location are a
 * bigger decision than a cart line.
 */
export default function MarketCartPage() {
    const navigate = useNavigate();
    const { setCount } = useMarketCart();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const response = await buyerApi.cart();
                if (cancelled) return;

                setItems(response.data || []);
                setCount(countItems(response.data));
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
        // setCount is stable (useState setter), so re-running on every render is
        // not a risk here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const subtotal = items.reduce((sum, item) => sum + item.subtotalCentavos, 0);

    // A line is orderable only when the shelf can still cover it.
    const blocked = items.filter((item) => !item.isAvailable);

    const setQuantity = async (item, quantity) => {
        setBusyId(item.cartItemId);

        try {
            await buyerApi.setCartQuantity(item.cartItemId, quantity);

            // Re-read the cart rather than patching local state, so the header
            // badge and the list can never disagree - and so a clamped quantity
            // (the server refuses more than the shelf holds) is reflected.
            const fresh = await buyerApi.cart();
            setItems(fresh.data || []);
            setCount(countItems(fresh.data));
        } catch (err) {
            toast.error(err.message);
            // Availability may have moved; reload so the number is honest.
            const fresh = await buyerApi.cart().catch(() => null);
            if (fresh) {
                setItems(fresh.data || []);
                setCount(countItems(fresh.data));
            }
        } finally {
            setBusyId(null);
        }
    };

    const clearCart = async () => {
        try {
            await buyerApi.clearCart();
            setItems([]);
            setCount(0);
            toast.success("Cart cleared.");
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={4} />
            </MarketPanel>
        );
    }

    if (items.length === 0) {
        return (
            <MarketPanel>
                <MarketEmpty
                    icon={<ShoppingCart size={20} />}
                    title="Your cart is empty"
                    hint="Browse the campus store to add food, uniforms or merchandise."
                    action={
                        <MarketButton onClick={() => navigate("/marketplace")}>
                            Start shopping
                        </MarketButton>
                    }
                />
            </MarketPanel>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <MarketNotice tone="error" title="Could not load your cart">
                    {error}
                </MarketNotice>
            )}

            {blocked.length > 0 && (
                <MarketNotice tone="warn" title="Some items need attention">
                    {blocked.length} item{blocked.length === 1 ? "" : "s"} can no longer
                    be ordered in the quantity requested. Reduce the quantity or remove
                    the line to continue.
                </MarketNotice>
            )}

            <MarketPanel>
                <ul className="divide-y divide-slate-100">
                    {items.map((item) => (
                        <li
                            key={item.cartItemId}
                            className="flex gap-3 p-3.5 sm:p-4"
                        >
                            <MarketImage
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    initials={item.variantName || "•"}
                                    className="h-16 w-16 shrink-0"
                                    rounded="rounded-xl"
                                />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                    {item.productName}
                                </p>

                                {item.variantName && (
                                    <p className="text-[11px] text-slate-400">
                                        Size: {item.variantName}
                                    </p>
                                )}

                                <p className="mt-1 text-xs font-semibold text-[#106A2E]">
                                    {formatPeso(item.subtotalCentavos)}
                                    <span className="ml-1 font-normal text-slate-400">
                                        ({formatPeso(item.unitPriceCentavos)} each)
                                    </span>
                                </p>

                                {!item.isAvailable && (
                                    <p className="mt-1 text-[11px] font-medium text-rose-600">
                                        Only {item.availableQuantity} left in stock.
                                    </p>
                                )}

                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex items-center rounded-xl border border-slate-200">
                                        <button
                                            type="button"
                                            disabled={busyId === item.cartItemId}
                                            onClick={() =>
                                                setQuantity(item, item.quantity - 1)
                                            }
                                            aria-label="Decrease quantity"
                                            className="flex h-7 w-7 items-center justify-center text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                                        >
                                            <Minus size={12} />
                                        </button>

                                        <span className="w-7 text-center text-xs font-semibold text-slate-700">
                                            {item.quantity}
                                        </span>

                                        <button
                                            type="button"
                                            disabled={
                                                busyId === item.cartItemId ||
                                                item.quantity >= item.availableQuantity
                                            }
                                            onClick={() =>
                                                setQuantity(item, item.quantity + 1)
                                            }
                                            aria-label="Increase quantity"
                                            className="flex h-7 w-7 items-center justify-center text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={busyId === item.cartItemId}
                                        onClick={() => setQuantity(item, 0)}
                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-500 transition hover:text-rose-700 disabled:opacity-40"
                                    >
                                        <Trash2 size={11} />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </MarketPanel>

            <MarketPanel>
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            Subtotal
                        </span>
                        <span className="text-base font-semibold text-slate-800">
                            {formatPeso(subtotal)}
                        </span>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-400">
                        The campus delivery fee is added at checkout and is set by
                        Marketplace Staff.
                    </p>

                    <MarketButton
                        size="lg"
                        className="mt-4 w-full"
                        disabled={blocked.length > 0}
                        onClick={() => navigate("/marketplace/checkout")}
                    >
                        {blocked.length > 0
                            ? "Resolve the items above"
                            : "Continue to checkout"}
                    </MarketButton>

                    <MarketButton
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={clearCart}
                    >
                        Clear cart
                    </MarketButton>
                </div>
            </MarketPanel>
        </div>
    );
}