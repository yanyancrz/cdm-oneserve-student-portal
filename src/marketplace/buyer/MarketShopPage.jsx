import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ChevronDown,
    PackageSearch,
    Search,
    ShoppingBag,
    Sparkles,
    Store,
    UtensilsCrossed,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import { buyerApi } from "../services/marketApi";
import { CATEGORIES, isLowStock, subCategoriesFor } from "../config/marketVocabulary";
import { countItems, useMarketCart } from "./marketCartCount";
import { formatPeso, initials } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketImage,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";
import { ModuleLoadingScreen } from "../../components/States";

/**
 * The marketplace shop.
 *
 * Two things are decided here and nowhere else:
 *   1. delivery is on campus only - the pickup/delivery choice and the campus
 *      location picker live on the Checkout page, never as a free address field;
 *   2. stock is shown honestly. An out-of-stock item stays visible with the Add
 *      button disabled rather than silently disappearing.
 */

const FOODHUB_ALL = "__foodhub__";

// Same card surface as the Guidance and Library pages.
const CARD = "rounded-[22px] bg-white/90 ring-1 ring-black/[0.04] shadow-sm";

export default function MarketShopPage() {
    const navigate = useNavigate();
    const { productId } = useParams();
    const { setCount } = useMarketCart();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [category, setCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [search, setSearch] = useState("");

    // Stall filter: the shop groups the catalog by workspace (BusinessHub vs
    // each food stall). Client-side over the loaded catalog, so switching
    // stalls is instant and never refetches.
    const [workspaces, setWorkspaces] = useState([]);
    const [stallLocations, setStallLocations] = useState([]);
    const [workspaceId, setWorkspaceId] = useState("");

    // Size selection for the tapped product. Uniforms have their own stock per
    // size, so a size must be chosen before anything can be added.
    const [selectedVariantId, setSelectedVariantId] = useState(null);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await buyerApi.products({ search });
                if (cancelled) return;

                setProducts(response.data || []);
            } catch (err) {
                if (cancelled) return;
                setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [search]);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            buyerApi.workspaces().catch(() => ({ data: [] })),
            buyerApi.stallLocations().catch(() => ({ data: [] })),
        ]).then(([wsRes, locRes]) => {
            if (cancelled) return;
            setWorkspaces(wsRes.data || []);
            setStallLocations(locRes.data || []);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    // Changing the category resets the subcategory: a subcategory from another
    // category would return nothing and look like an empty catalog.
    const onCategoryChange = (value) => {
        setCategory(value);
        setSubCategory("");
    };

    const visible = useMemo(() => {
        let list = products;

        if (workspaceId === FOODHUB_ALL) {
            list = list.filter((product) => product.workspaceType === "Stall");
        } else if (workspaceId) {
            list = list.filter(
                (product) => String(product.workspaceId ?? "") === String(workspaceId)
            );
        }

        if (!category) return list;
        return list.filter((product) => product.category === category);
    }, [products, category, workspaceId]);

    const visibleSub = useMemo(() => {
        if (!subCategory) return visible;
        return visible.filter((product) => product.subCategory === subCategory);
    }, [visible, subCategory]);

    const active = useMemo(() => {
        if (!productId) return null;
        return products.find((p) => String(p.productId) === String(productId)) || null;
    }, [productId, products]);

    const addToCart = async (product, variantId) => {
        setAdding(true);

        try {
            const response = await buyerApi.addToCart({
                productId: product.productId,
                variantId: product.hasVariants ? variantId : null,
                quantity: 1,
            });

            toast.success(response.message || "Added to your cart.");
            setSelectedVariantId(null);

            // Bump the header badge straight away rather than making the buyer
            // open the cart to find out the tap worked.
            const fresh = await buyerApi.cart().catch(() => null);
            if (fresh) setCount(countItems(fresh.data));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setAdding(false);
        }
    };

    // Everything that narrows the catalog, so one button can clear it.
    const hasFilters = Boolean(search || category || subCategory || workspaceId);

    const clearFilters = () => {
        setSearch("");
        setCategory("");
        setSubCategory("");
        setWorkspaceId("");
    };

    // ---------------------------------------------------------
    // product detail (the same component, routed with /product/:productId)
    // ---------------------------------------------------------

    if (productId) {
        return (
            <ProductDetail
                product={active}
                loading={loading}
                selectedVariantId={selectedVariantId}
                setSelectedVariantId={setSelectedVariantId}
                adding={adding}
                onAdd={addToCart}
                onBack={() => navigate(`/marketplace`)}
            />
        );
    }

    // ---------------------------------------------------------
    // catalog
    // ---------------------------------------------------------

    // The module-opening splash, same as the Guidance gate: the dashboard
    // card lands here while the first catalog fetch is still in flight.
    // Searching or filtering later keeps the inline skeleton instead,
    // because the page is already open by then.
    if (loading && products.length === 0) {
        return (
            <ModuleLoadingScreen
                icon={Store}
                accent="bg-gradient-to-br from-[#178A45] to-[#0E3B22]"
                label="Opening Marketplace"
                text="Opening Marketplace..."
            />
        );
    }

    return (
        <div className="space-y-4">
            <WelcomeCard />

            {/* Search */}
            <div className="relative">
                <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search food, uniforms, merchandise..."
                    aria-label="Search the marketplace"
                    className={`${marketInputClass} pl-10 pr-10`}
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Category tabs. Uniforms and the rest are the spec's fixed
                three; there is no free "all categories" server filter. */}
            <div
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="tablist"
                aria-label="Category"
            >
                <CategoryChip
                    label="All"
                    active={!category}
                    onClick={() => onCategoryChange("")}
                />
                {CATEGORIES.map((item) => (
                    <CategoryChip
                        key={item.value}
                        label={item.label}
                        active={category === item.value}
                        onClick={() => onCategoryChange(item.value)}
                    />
                ))}
            </div>

            {category && subCategoriesFor(category).length > 0 && (
                <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <CategoryChip
                        label="All types"
                        small
                        active={!subCategory}
                        onClick={() => setSubCategory("")}
                    />
                    {subCategoriesFor(category).map((item) => (
                        <CategoryChip
                            key={item}
                            label={item}
                            small
                            active={subCategory === item}
                            onClick={() => setSubCategory(item)}
                        />
                    ))}
                </div>
            )}

            {/* Shop by store: the BusinessHub, then each FoodHub location
                with its stalls. Tapping a store filters the catalog below;
                checkout still splits by stall whatever is in the cart. */}
            {workspaces.length > 0 && (
                <StoreBrowser
                    workspaces={workspaces}
                    stallLocations={stallLocations}
                    workspaceId={workspaceId}
                    onSelect={setWorkspaceId}
                />
            )}

            {error && (
                <MarketNotice tone="error" title="Could not load the catalog">
                    {error}
                </MarketNotice>
            )}

            {/* Result count + clear */}
            {!loading && !error && (
                <div className="flex items-center justify-between px-0.5">
                    <p className="text-xs text-gray-500">
                        <span className="font-semibold text-[#1F1F1F]">{visibleSub.length}</span>{" "}
                        {visibleSub.length === 1 ? "item" : "items"}
                    </p>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#106A2E] hover:underline"
                        >
                            <X size={12} /> Clear filters
                        </button>
                    )}
                </div>
            )}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={4} />
                </MarketPanel>
            ) : visibleSub.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<PackageSearch size={20} />}
                        title="Nothing here yet"
                        hint={
                            hasFilters
                                ? "No item matches this filter."
                                : "Marketplace Staff has not added any item yet."
                        }
                        action={
                            hasFilters ? (
                                <MarketButton variant="secondary" onClick={clearFilters}>
                                    Clear filters
                                </MarketButton>
                            ) : undefined
                        }
                    />
                </MarketPanel>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {visibleSub.map((product) => (
                        <ProductCard
                            key={product.productId}
                            product={product}
                            onOpen={() =>
                                navigate(`/marketplace/product/${product.productId}`)
                            }
                            onAdd={() => {
                                if (product.hasVariants) {
                                    navigate(
                                        `/marketplace/product/${product.productId}`
                                    );
                                    return;
                                }
                                addToCart(product, null);
                            }}
                            adding={adding}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// =====================================================
// welcome card (same look as the Guidance home)
// =====================================================

function WelcomeCard() {
    const read = (key) => {
        try {
            return localStorage.getItem(key) || "";
        } catch {
            return "";
        }
    };

    const fullName = read("userName");
    const firstName = fullName.split(" ")[0];
    const details = [read("idNumber"), read("course"), read("yearLevel")].filter(Boolean).join(" • ");

    return (
        <section
            aria-label="Welcome"
            className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#106A2E] to-[#0E3B22] p-5 text-white shadow-sm"
        >
            <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-6 h-32 w-32 rounded-full bg-white/5" />
            <span aria-hidden="true" className="pointer-events-none absolute right-24 top-14 h-7 w-7 rounded-full bg-[#F4D35E]/30" />

            <div className="relative flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-white/80">CDM OneServe</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                        Hello{firstName ? `, ${firstName}` : ""}!
                    </p>
                    <p className="mt-0.5 text-xs text-white/85">What would you like to get today?</p>
                </div>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <ShoppingBag size={22} aria-hidden="true" />
                </span>
            </div>

            <div className="relative mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium">
                    <Sparkles size={12} aria-hidden="true" />
                    Pickup or campus delivery
                </span>

                {details && (
                    <span className="max-w-full truncate rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/85">
                        {details}
                    </span>
                )}
            </div>
        </section>
    );
}

// =====================================================
// product card
// =====================================================

function ProductCard({ product, onOpen, onAdd, adding }) {
    const soldOut = !product.isAvailable;

    return (
        <div
            className={`flex flex-col overflow-hidden rounded-[22px] bg-white/90 ring-1 ring-black/[0.04] shadow-sm transition ${
                soldOut ? "opacity-80" : "hover:shadow-md"
            }`}
        >
            <button
                type="button"
                onClick={onOpen}
                aria-label={`View ${product.name}`}
                className="relative block w-full"
            >
                <MarketImage
                    src={product.imageUrl}
                    alt={product.name}
                    initials={initials(product.name)}
                    className={`aspect-[4/3] w-full ${soldOut ? "grayscale" : ""}`}
                    rounded="rounded-none"
                />

                {soldOut && (
                    <span className="absolute left-2 top-2 rounded-full bg-gray-900/75 px-2.5 py-1 text-[10px] font-semibold text-white">
                        Out of stock
                    </span>
                )}
            </button>

            <div className="flex flex-1 flex-col p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#106A2E]/60">
                    {product.subCategory || product.category}
                </p>

                <p className="mt-0.5 line-clamp-2 min-h-[2rem] text-xs font-semibold leading-4 text-[#1F1F1F]">
                    {product.name}
                </p>

                {product.workspaceName && (
                    <p className="mt-0.5 truncate text-[10px] text-gray-400">
                        {product.workspaceName}
                    </p>
                )}

                <p className="mt-1.5 text-base font-semibold text-[#106A2E]">
                    {formatPeso(product.priceCentavos)}
                </p>

                {product.hasVariants ? (
                    <p className="mt-0.5 text-[10px] text-gray-400">
                        {product.variants.length} size
                        {product.variants.length === 1 ? "" : "s"} &middot; pick one
                    </p>
                ) : isLowStock(product.availableQuantity) && !soldOut ? (
                    /* Honest urgency: the number is real stock, not a countdown
                       timer pretending to be one. It also explains an item that
                       reads as available and then fails at checkout. */
                    <p className="mt-0.5 text-[10px] font-medium text-[#633806]">
                        Only {product.availableQuantity} left
                    </p>
                ) : null}

                <div className="mt-2 flex-1" />

                {soldOut ? (
                    <span className="rounded-xl bg-gray-100 py-2 text-center text-[11px] font-semibold text-gray-400">
                        Unavailable
                    </span>
                ) : (
                    <MarketButton
                        size="sm"
                        className="w-full"
                        onClick={onAdd}
                        disabled={adding}
                    >
                        <ShoppingBag size={12} />
                        {product.hasVariants ? "Pick size" : "Add to cart"}
                    </MarketButton>
                )}
            </div>
        </div>
    );
}

// =====================================================
// product detail
// =====================================================

function ProductDetail({
    product,
    loading,
    selectedVariantId,
    setSelectedVariantId,
    adding,
    onAdd,
    onBack,
}) {
    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={5} />
            </MarketPanel>
        );
    }

    if (!product) {
        return (
            <MarketPanel>
                <MarketEmpty
                    icon={<PackageSearch size={20} />}
                    title="Item not available"
                    hint="It may have been removed from the catalog."
                    action={
                        <MarketButton variant="secondary" onClick={onBack}>
                            Back to shop
                        </MarketButton>
                    }
                />
            </MarketPanel>
        );
    }

    const selected = product.variants.find(
        (variant) => variant.variantId === selectedVariantId
    );

    const price = selected
        ? product.priceCentavos + selected.priceAdjustmentCentavos
        : product.priceCentavos;

    // A sized product cannot be added until a size with stock is chosen - each
    // size has its own inventory, so "M is out" must not read as "all sizes out".
    const needsSize = product.hasVariants && !selectedVariantId;
    const selectedSoldOut = selected ? selected.availableQuantity <= 0 : false;

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#106A2E] shadow-sm ring-1 ring-black/[0.04] transition active:scale-95"
            >
                &larr; Back to shop
            </button>

            <div className={`${CARD} overflow-hidden`}>
                <MarketImage
                    src={product.imageUrl}
                    alt={product.name}
                    initials={initials(product.name)}
                    className="aspect-[16/9] w-full"
                    rounded="rounded-none"
                />

                <div className="p-5">
                    <p className="text-[10px] font-medium uppercase tracking-[.16em] text-[#106A2E]/60">
                        {product.category}
                        {product.subCategory ? ` · ${product.subCategory}` : ""}
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-[#1F1F1F]">
                        {product.name}
                    </h2>

                    {product.workspaceName && (
                        <p className="mt-0.5 text-xs text-gray-400">Sold by {product.workspaceName}</p>
                    )}

                    <p className="mt-3 text-2xl font-semibold text-[#106A2E]">
                        {formatPeso(price)}
                        {selected?.priceAdjustmentCentavos > 0 && (
                            <span className="ml-1.5 text-[11px] font-medium text-gray-400">
                                includes size adjustment
                            </span>
                        )}
                    </p>

                    {product.description && (
                        <p className="mt-3 text-sm leading-6 text-gray-500">
                            {product.description}
                        </p>
                    )}

                    {product.hasVariants && (
                        <div className="mt-5">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.14em] text-gray-500">
                                Choose a size
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {product.variants.map((variant) => {
                                    const isSelected =
                                        variant.variantId === selectedVariantId;
                                    const out = variant.availableQuantity <= 0;

                                    return (
                                        <button
                                            key={variant.variantId}
                                            type="button"
                                            disabled={out}
                                            aria-pressed={isSelected}
                                            onClick={() =>
                                                setSelectedVariantId(
                                                    variant.variantId
                                                )
                                            }
                                            className={`min-w-[3rem] rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
                                                out
                                                    ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through"
                                                    : isSelected
                                                      ? "border-[#106A2E] bg-[#106A2E] text-white shadow-sm"
                                                      : "border-gray-200 bg-white text-gray-600 hover:border-[#106A2E]/40"
                                            }`}
                                        >
                                            {variant.variantValue}
                                        </button>
                                    );
                                })}
                            </div>

                            {selected && (
                                <p
                                    className={`mt-2 text-xs ${
                                        selectedSoldOut
                                            ? "text-red-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {selectedSoldOut
                                        ? "This size is out of stock."
                                        : `${selected.availableQuantity} left in this size`}
                                </p>
                            )}
                        </div>
                    )}

                    {!product.hasVariants && (
                        <p
                            className={`mt-4 inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${
                                product.availableQuantity <= 0
                                    ? "bg-gray-100 text-gray-500"
                                    : isLowStock(product.availableQuantity)
                                      ? "bg-[#FAEEDA] text-[#633806]"
                                      : "bg-[#E1F0E4] text-[#106A2E]"
                            }`}
                        >
                            {product.availableQuantity > 0
                                ? isLowStock(product.availableQuantity)
                                    ? `Only ${product.availableQuantity} left`
                                    : `${product.availableQuantity} in stock`
                                : "Out of stock"}
                        </p>
                    )}

                    <MarketButton
                        size="lg"
                        className="mt-5 w-full"
                        onClick={() => onAdd(product, selectedVariantId)}
                        disabled={
                            adding ||
                            !product.isAvailable ||
                            needsSize ||
                            selectedSoldOut
                        }
                    >
                        <ShoppingBag size={14} />
                        {needsSize
                            ? "Choose a size"
                            : !product.isAvailable || selectedSoldOut
                              ? "Out of stock"
                              : "Add to cart"}
                    </MarketButton>
                </div>
            </div>
        </div>
    );
}

function CategoryChip({ label, active, onClick, small = false }) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`shrink-0 rounded-full border font-semibold transition ${
                small ? "px-2.5 py-1 text-[10px]" : "px-4 py-2 text-xs"
            } ${
                active
                    ? "border-[#106A2E] bg-[#106A2E] text-white shadow-sm"
                    : "border-gray-200 bg-white/90 text-gray-600 hover:border-[#106A2E]/30"
            }`}
        >
            {label}
        </button>
    );
}

// =====================================================
// store browser: BusinessHub card, then the FoodHub card with
// an expandable stall dropdown.
//
//   CDM BusinessHub (Canteen)
//   CDM FoodHub -> Main FoodHub (Old Building Lobby), Stall 1, ...
//
// Tapping a card shows it and filters the catalog; tapping the FoodHub
// card also opens the dropdown so one stall can be picked. Tapping the
// same choice again steps back out (stall -> all FoodHub -> everything).
// =====================================================

function StoreBrowser({ workspaces, stallLocations, workspaceId, onSelect }) {
    const [expanded, setExpanded] = useState(false);

    const hubs = workspaces.filter((w) => w.workspaceType === "BusinessHub");
    const stalls = workspaces.filter((w) => w.workspaceType !== "BusinessHub");

    const isActive = (id) => String(workspaceId) === String(id);
    const selectedStall = stalls.find((stall) => isActive(stall.workspaceId));
    const foodHubShowing = workspaceId === FOODHUB_ALL || !!selectedStall;
    const open = expanded || foodHubShowing;

    const toggleHub = (id) => {
        setExpanded(false);
        onSelect(isActive(id) ? "" : String(id));
    };

    const toggleFoodHub = () => {
        if (foodHubShowing) {
            setExpanded(false);
            onSelect("");
        } else {
            setExpanded(true);
            onSelect(FOODHUB_ALL);
        }
    };

    const toggleStall = (id) => {
        setExpanded(true);
        onSelect(isActive(id) ? FOODHUB_ALL : String(id));
    };

    // Stalls grouped under their FoodHub location, in location order.
    // A stall whose location vanished still shows under "Other stalls".
    const orderedLocations = [...stallLocations].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    const stallsByLocation = new Map();
    for (const stall of stalls) {
        const key = stall.stallLocationId ?? 0;
        if (!stallsByLocation.has(key)) stallsByLocation.set(key, []);
        stallsByLocation.get(key).push(stall);
    }
    const orphanStalls = stallsByLocation.get(0) ?? [];

    const storeCard = (selected) =>
        `flex w-full items-center gap-2.5 rounded-[20px] bg-white/90 p-3 text-left shadow-sm transition active:scale-[0.99] ${
            selected
                ? "ring-2 ring-[#106A2E]"
                : "ring-1 ring-black/[0.04] hover:ring-[#106A2E]/30"
        }`;

    return (
        <section aria-label="Shop by store" className="space-y-2.5">
            <p className="px-0.5 text-[11px] font-semibold uppercase tracking-[.14em] text-gray-500">
                Shop by store
            </p>

            <div className={`grid gap-2.5 ${hubs.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
                {hubs.map((hub) => (
                    <button
                        key={hub.workspaceId}
                        type="button"
                        onClick={() => toggleHub(hub.workspaceId)}
                        aria-pressed={isActive(hub.workspaceId)}
                        className={storeCard(isActive(hub.workspaceId))}
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-white">
                            <Store size={18} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-bold text-[#1F1F1F]">
                                {hub.name}
                            </span>
                            <span className="block truncate text-[10px] text-gray-500">
                                {isActive(hub.workspaceId) ? "Showing" : "Uniforms & merchandise"}
                            </span>
                        </span>
                    </button>
                ))}

                <button
                    type="button"
                    onClick={toggleFoodHub}
                    aria-pressed={foodHubShowing}
                    aria-expanded={open}
                    className={storeCard(foodHubShowing)}
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#178A45] to-[#0E3B22] text-white">
                        <UtensilsCrossed size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-[#1F1F1F]">
                            CDM FoodHub
                        </span>
                        <span className="block truncate text-[10px] text-gray-500">
                            {selectedStall
                                ? selectedStall.name
                                : `${stalls.length} stall${stalls.length === 1 ? "" : "s"}`}
                        </span>
                    </span>
                    <ChevronDown
                        size={16}
                        aria-hidden="true"
                        className={`shrink-0 text-gray-400 transition ${open ? "rotate-180" : ""}`}
                    />
                </button>
            </div>

            {open && (
                <div className={`${CARD} p-3.5`}>
                    {orderedLocations.map((location) => {
                        const locationStalls = stallsByLocation.get(location.stallLocationId) ?? [];
                        if (locationStalls.length === 0) return null;

                        return (
                            <div key={location.stallLocationId} className="mt-3 first:mt-0">
                                <p className="text-xs font-semibold text-[#1F1F1F]">
                                    {location.name}
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {locationStalls.map((stall) => (
                                        <CategoryChip
                                            key={stall.workspaceId}
                                            small
                                            label={stall.name}
                                            active={isActive(stall.workspaceId)}
                                            onClick={() => toggleStall(stall.workspaceId)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {orphanStalls.length > 0 && (
                        <div className="mt-3 first:mt-0">
                            <p className="text-xs font-semibold text-[#1F1F1F]">
                                Other stalls
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {orphanStalls.map((stall) => (
                                    <CategoryChip
                                        key={stall.workspaceId}
                                        small
                                        label={stall.name}
                                        active={isActive(stall.workspaceId)}
                                        onClick={() => toggleStall(stall.workspaceId)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {stalls.length === 0 && (
                        <p className="text-[11px] text-gray-400">
                            No food stalls yet.
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}