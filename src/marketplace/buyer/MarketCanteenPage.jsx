import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Plus, Search, ShoppingBag, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";

import { buyerApi } from "../services/marketApi";
import { isLowStock, subCategoriesFor } from "../config/marketVocabulary";
import { countItems, useMarketCart } from "./marketCartCount";
import { formatPeso, initials } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketImage,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
} from "../components/marketUi";

/**
 * The campus canteen: today's menu, and the way into pre-ordering.
 *
 * The menu is the Food category, filtered client-side by section. It is a
 * separate screen rather than a filter on the shop so the canteen can say what
 * it does - book a slot, pay with the card - without those being generic
 * marketplace chrome.
 *
 * Pre-ordering itself happens at Checkout. A slot is a property of an order, not
 * of an item, so choosing it while browsing would let a buyer reserve eleven
 * different pickup times before ordering anything. This screen's job is to fill
 * the cart and get there.
 */
export default function MarketCanteenPage() {
    const navigate = useNavigate();
    const { count, setCount } = useMarketCart();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [section, setSection] = useState("");
    const [search, setSearch] = useState("");
    const [adding, setAdding] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const response = await buyerApi.products({ category: "Food" });
                if (cancelled) return;
                setProducts(response.data || []);
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

    const sections = useMemo(
        () => subCategoriesFor("Food").filter((name) => products.some((p) => p.subCategory === name)),
        [products]
    );

    // Search runs in the browser because the whole canteen menu is already in
    // memory - there is no point spending a request per keystroke on a list this
    // size.
    const visible = useMemo(() => {
        const needle = search.trim().toLowerCase();

        return products.filter((product) => {
            if (!product.isActive) return false;
            if (section && product.subCategory !== section) return false;
            if (!needle) return true;
            return (
                product.name.toLowerCase().includes(needle) ||
                (product.description || "").toLowerCase().includes(needle)
            );
        });
    }, [products, section, search]);

    const available = visible.filter((product) => !product.isOutOfStock).length;

    const addToCart = async (product) => {
        setAdding(product.productId);

        try {
            const response = await buyerApi.addToCart({
                productId: product.productId,
                variantId: null,
                quantity: 1,
            });

            toast.success(response.message || `${product.name} added.`);

            const fresh = await buyerApi.cart();
            setCount(countItems(fresh.data));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setAdding(null);
        }
    };

    const goToCheckout = () => {
        if (count === 0) {
            toast("Add something from the menu first.");
            return;
        }
        navigate("/marketplace/checkout");
    };

    return (
        <div className="space-y-4">
            {/* What makes the canteen different from the rest of the shop. */}
            <section
                aria-label="Canteen pre-ordering"
                className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#106A2E] to-[#0E3B22] p-5 text-white shadow-sm"
            >
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10"
                />

                <div className="relative flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-white/80">Campus Canteen</p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight">
                            Skip the lunch queue
                        </p>
                        <p className="mt-1 max-w-md text-xs leading-5 text-white/80">
                            Book a pickup slot at checkout and your order is cooked for the time you
                            pick up, not the time you happen to arrive.
                        </p>
                    </div>

                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                        <UtensilsCrossed size={22} aria-hidden="true" />
                    </span>
                </div>

                <div className="relative mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium">
                        <Clock size={12} aria-hidden="true" />
                        Slots up to 7 days ahead
                    </span>

                    <button
                        type="button"
                        onClick={goToCheckout}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#0E3B22] transition hover:bg-white/90"
                    >
                        <ShoppingBag size={12} aria-hidden="true" />
                        {count > 0 ? `Checkout (${count})` : "Checkout"}
                    </button>
                </div>
            </section>

            {error ? (
                <MarketNotice tone="error" title="Could not load the canteen menu">
                    {error}
                </MarketNotice>
            ) : null}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={4} />
                </MarketPanel>
            ) : products.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<UtensilsCrossed size={20} />}
                        title="The canteen menu is empty"
                        hint="Canteen staff add meals, snacks and drinks from their Products screen."
                    />
                </MarketPanel>
            ) : (
                <>
                    <MarketPanel
                        title="Today's menu"
                        subtitle={
                            available > 0
                                ? `${available} of ${visible.length} available right now.`
                                : undefined
                        }
                    >
                        {/* Section + search. Both filter what is already in memory. */}
                        <div className="space-y-3 p-3.5">
                            {sections.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    <SectionChip
                                        label="All"
                                        active={!section}
                                        onClick={() => setSection("")}
                                    />
                                    {sections.map((name) => (
                                        <SectionChip
                                            key={name}
                                            label={name}
                                            active={section === name}
                                            onClick={() => setSection(name)}
                                        />
                                    ))}
                                </div>
                            ) : null}

                            <div className="relative">
                                <Search
                                    size={16}
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search the menu..."
                                    aria-label="Search the canteen menu"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#106A2E] focus:bg-white"
                                />
                            </div>
                        </div>
                    </MarketPanel>

                    {visible.length === 0 ? (
                        <MarketPanel>
                            <MarketEmpty
                                icon={<Search size={20} />}
                                title="Nothing matches"
                                hint="Try another section or clear the search."
                                action={
                                    <MarketButton
                                        variant="secondary"
                                        onClick={() => {
                                            setSection("");
                                            setSearch("");
                                        }}
                                    >
                                        Clear filters
                                    </MarketButton>
                                }
                            />
                        </MarketPanel>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {visible.map((product) => (
                                <MenuCard
                                    key={product.productId}
                                    product={product}
                                    adding={adding === product.productId}
                                    onAdd={addToCart}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/** One menu item. Out-of-stock items stay visible but cannot be added. */
function MenuCard({ product, adding, onAdd }) {
    const out = product.isOutOfStock === true;

    return (
        <article
            className={`flex flex-col overflow-hidden rounded-[22px] bg-white/90 ring-1 ring-black/[0.04] shadow-sm ${
                out ? "opacity-70" : ""
            }`}
        >
            <div className="relative">
                <MarketImage
                    src={product.imageUrl}
                    alt={product.name}
                    initials={initials(product.name)}
                    className="h-28 w-full object-cover"
                    rounded="rounded-none"
                />

                {out ? (
                    <span className="absolute inset-x-2 top-2 rounded-full bg-rose-600/90 px-2 py-0.5 text-center text-[9px] font-semibold text-white">
                        Out of stock
                    </span>
                ) : isLowStock(product.availableQuantity) ? (
                    <span className="absolute inset-x-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-center text-[9px] font-semibold text-white">
                        Only {product.availableQuantity} left
                    </span>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col p-3">
                {product.subCategory ? (
                    <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-slate-400">
                        {product.subCategory}
                    </p>
                ) : null}

                <h3 className="mt-0.5 line-clamp-2 text-xs font-semibold text-slate-800">
                    {product.name}
                </h3>

                <p className="mt-1 text-sm font-semibold text-[#106A2E]">
                    {formatPeso(product.priceCentavos)}
                </p>

                <div className="mt-2.5 flex-1" />

                <MarketButton
                    size="sm"
                    className="w-full"
                    disabled={out || adding}
                    onClick={() => onAdd(product)}
                >
                    <Plus size={12} />
                    {out ? "Unavailable" : adding ? "Adding..." : "Add"}
                </MarketButton>
            </div>
        </article>
    );
}

/** A filter pill. */
function SectionChip({ label, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                active
                    ? "bg-[#106A2E] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
        >
            {label}
        </button>
    );
}
