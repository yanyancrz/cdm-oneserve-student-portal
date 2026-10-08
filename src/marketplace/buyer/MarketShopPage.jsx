import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PackageSearch, Search, ShoppingBag } from "lucide-react";
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

/**
 * The marketplace shop.
 *
 * Two things are decided here and nowhere else:
 *   1. delivery is on campus only - the pickup/delivery choice and the campus
 *      location picker live on the Checkout page, never as a free address field;
 *   2. stock is shown honestly. An out-of-stock item stays visible with the Add
 *      button disabled rather than silently disappearing.
 */
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

    // Changing the category resets the subcategory: a subcategory from another
    // category would return nothing and look like an empty catalog.
    const onCategoryChange = (value) => {
        setCategory(value);
        setSubCategory("");
    };

    const visible = useMemo(() => {
        if (!category) return products;
        return products.filter((product) => product.category === category);
    }, [products, category]);

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

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search food, uniforms, merchandise..."
                    className={`${marketInputClass} pl-9`}
                />
            </div>

            {/* Category tabs. Uniforms and the rest are the spec's fixed
                three; there is no free "all categories" server filter. */}
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

            {error && (
                <MarketNotice tone="error" title="Could not load the catalog">
                    {error}
                </MarketNotice>
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
                            search || category || subCategory
                                ? "No item matches this filter."
                                : "Marketplace Staff has not added any item yet."
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
// product card
// =====================================================

function ProductCard({ product, onOpen, onAdd, adding }) {
    const soldOut = !product.isAvailable;

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#0E3B22]/10 bg-white shadow-sm">
            <button
                type="button"
                onClick={onOpen}
                className="block w-full"
            >
                <MarketImage
                    src={product.imageUrl}
                    alt={product.name}
                    initials={initials(product.name)}
                    className="aspect-[4/3] w-full"
                    rounded="rounded-none"
                />
            </button>

            <div className="flex flex-1 flex-col p-2.5">
                <p className="text-[9px] uppercase tracking-wider text-[#106A2E]/50">
                    {product.subCategory || product.category}
                </p>

                <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-4 text-slate-800">
                    {product.name}
                </p>

                <p className="mt-1 text-sm font-semibold text-[#106A2E]">
                    {formatPeso(product.priceCentavos)}
                </p>

                {product.hasVariants ? (
                    <p className="mt-0.5 text-[10px] text-slate-400">
                        {product.variants.length} size
                        {product.variants.length === 1 ? "" : "s"} &middot; pick one
                    </p>
                ) : isLowStock(product.availableQuantity) ? (
                    /* Honest urgency: the number is real stock, not a countdown
                       timer pretending to be one. It also explains an item that
                       reads as available and then fails at checkout. */
                    <p className="mt-0.5 text-[10px] font-medium text-amber-600">
                        Only {product.availableQuantity} left
                    </p>
                ) : null}

                <div className="mt-2 flex-1" />

                {soldOut ? (
                    <span className="rounded-xl border border-rose-200 bg-rose-50 py-2 text-center text-[11px] font-semibold text-rose-600">
                        Out of stock
                    </span>
                ) : (
                    <MarketButton
                        size="sm"
                        className="w-full"
                        onClick={onAdd}
                        disabled={adding}
                    >
                        <ShoppingBag size={12} />
                        {product.hasVariants ? "Pick size" : "Add"}
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
                className="text-xs font-medium text-[#106A2E]/70"
            >
                &larr; Back to shop
            </button>

            <MarketPanel className="overflow-hidden">
                <MarketImage
                    src={product.imageUrl}
                    alt={product.name}
                    initials={initials(product.name)}
                    className="aspect-[16/9] w-full"
                    rounded="rounded-none"
                />

                <div className="p-4">
                    <p className="text-[10px] uppercase tracking-[.16em] text-[#106A2E]/50">
                        {product.category} &middot; {product.subCategory}
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-slate-800">
                        {product.name}
                    </h2>

                    {product.description && (
                        <p className="mt-1.5 text-xs leading-5 text-slate-500">
                            {product.description}
                        </p>
                    )}

                    <p className="mt-3 text-xl font-semibold text-[#106A2E]">
                        {formatPeso(price)}
                        {selected?.priceAdjustmentCentavos > 0 && (
                            <span className="ml-1.5 text-[11px] font-medium text-slate-400">
                                includes size adjustment
                            </span>
                        )}
                    </p>

                    {product.hasVariants && (
                        <div className="mt-4">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
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
                                            onClick={() =>
                                                setSelectedVariantId(
                                                    variant.variantId
                                                )
                                            }
                                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                                                out
                                                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through"
                                                    : isSelected
                                                      ? "border-[#106A2E] bg-[#106A2E] text-white"
                                                      : "border-slate-200 bg-white text-slate-600 hover:border-[#106A2E]/40"
                                            }`}
                                        >
                                            {variant.variantValue}
                                        </button>
                                    );
                                })}
                            </div>

                            {selected && (
                                <p
                                    className={`mt-2 text-[11px] ${
                                        selectedSoldOut
                                            ? "text-rose-600"
                                            : "text-slate-400"
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
                            className={`mt-3 text-[11px] ${
                                isLowStock(product.availableQuantity)
                                    ? "font-medium text-amber-600"
                                    : "text-slate-400"
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
                        className="mt-4 w-full"
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
            </MarketPanel>
        </div>
    );
}

function CategoryChip({ label, active, onClick, small = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`shrink-0 rounded-full border font-semibold transition ${
                small ? "px-2.5 py-1 text-[10px]" : "px-3.5 py-1.5 text-xs"
            } ${
                active
                    ? "border-[#106A2E] bg-[#106A2E] text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-[#106A2E]/30"
            }`}
        >
            {label}
        </button>
    );
}