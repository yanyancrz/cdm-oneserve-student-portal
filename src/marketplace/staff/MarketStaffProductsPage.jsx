import { useEffect, useMemo, useRef, useState } from "react";
import { ImageOff, Package, Plus, RotateCcw, Search, Trash2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";

import { staffApi } from "../services/marketApi";
import { marketImageUrl } from "../config/marketImage";
import {
    CATEGORIES,
    STOCK_STATE,
    stockStateTone,
    subCategoriesFor,
} from "../config/marketVocabulary";
import { centavosToPesos, formatPeso, initials, pesosToCentavos } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketImage,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
    marketSelectClass,
} from "../components/marketUi";
import { StaffPageHeader } from "./MarketStaffLayout";

/**
 * Photo upload rules, mirrored from the server so a bad file is rejected here
 * with a clear reason instead of after a slow upload. The server re-checks all
 * of it regardless - this is convenience, not the security boundary.
 */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Staff Products.
 *
 * A product is RETIRED, never deleted: past order lines reference it, so
 * deleting would leave historical orders unreadable. Archiving hides it from
 * buyers while keeping the record intact, and restore puts it back.
 *
 * Category and type are fixed by the spec (Food -> Snacks/Drinks, Uniforms ->
 * eight named types, Merchandise -> PIN/Lace/Jacket). The dropdowns only offer
 * those, and the server validates them again.
 */
export default function MarketStaffProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");

    const [editing, setEditing] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await staffApi.products({ category, search });
            setProducts(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    const visible = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return products;

        return products.filter((product) =>
            `${product.name} ${product.category} ${product.subCategory}`
                .toLowerCase()
                .includes(needle)
        );
    }, [products, search]);

    const setActive = async (product, nextActive) => {
        try {
            const response = nextActive
                ? await staffApi.restoreProduct(product.productId)
                : await staffApi.archiveProduct(product.productId);

            toast.success(response.message || "Updated.");
            load();
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Products"
                subtitle="Food, uniforms and merchandise"
                action={
                    <MarketButton onClick={() => setEditing(blankProduct())}>
                        <Plus size={13} />
                        Add product
                    </MarketButton>
                }
            />

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px] flex-1">
                    <Search
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search products..."
                        className={`${marketInputClass} py-2 pl-8 text-xs`}
                    />
                </div>

                <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                >
                    <option value="">All categories</option>
                    {CATEGORIES.map((item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <MarketNotice tone="error" title="Could not load products">
                    {error}
                </MarketNotice>
            )}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={6} />
                </MarketPanel>
            ) : visible.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<Package size={20} />}
                        title="No products"
                        hint="Add the campus items buyers can order."
                        action={
                            <MarketButton onClick={() => setEditing(blankProduct())}>
                                <Plus size={13} />
                                Add product
                            </MarketButton>
                        }
                    />
                </MarketPanel>
            ) : (
                <MarketPanel>
                    <ul className="divide-y divide-slate-100">
                        {visible.map((product) => (
                            <li
                                key={product.productId}
                                className="flex items-center gap-3 p-3.5"
                            >
                                <MarketImage
                                    src={product.imageUrl}
                                    alt={product.name}
                                    initials={initials(product.name)}
                                    className="h-11 w-11 shrink-0"
                                    rounded="rounded-xl"
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate text-xs font-semibold text-slate-800">
                                            {product.name}
                                        </p>

                                        {!product.isActive && (
                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
                                                Retired
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                        {product.category} &middot; {product.subCategory}
                                        {product.hasVariants
                                            ? ` \u00b7 ${product.variants.length} sizes`
                                            : ""}
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-[#106A2E]">
                                        {formatPeso(product.priceCentavos)}
                                        <span className="ml-2 font-normal text-slate-400">
                                            {product.availableQuantity} available
                                        </span>
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-col items-end gap-1.5">
                                    <span
                                        className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${stockStateTone(
                                            product.availableQuantity <= 0
                                                ? STOCK_STATE.OUT
                                                : product.availableQuantity <= 10
                                                  ? STOCK_STATE.LOW
                                                  : STOCK_STATE.HEALTHY
                                        )}`}
                                    >
                                        {product.availableQuantity <= 0
                                            ? "Out of stock"
                                            : `${product.availableQuantity} left`}
                                    </span>

                                    <div className="flex gap-1">
                                        <MarketButton
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setEditing(toForm(product))}
                                        >
                                            Edit
                                        </MarketButton>
                                        <MarketButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActive(product, !product.isActive)}
                                            aria-label={
                                                product.isActive ? "Retire" : "Restore"
                                            }
                                        >
                                            {product.isActive ? (
                                                <Trash2 size={11} />
                                            ) : (
                                                <RotateCcw size={11} />
                                            )}
                                        </MarketButton>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </MarketPanel>
            )}

            {editing && (
                <ProductModal
                    initial={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function blankProduct() {
    return { productId: null, name: "", description: "", category: "Food", subCategory: "Snacks", pricePesos: "", imageUrl: "", isActive: true, variants: [] };
}

function toForm(product) {
    return {
        productId: product.productId,
        name: product.name,
        description: product.description,
        category: product.category,
        subCategory: product.subCategory,
        pricePesos: centavosToPesos(product.priceCentavos),
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        // Existing sizes come back with their stock blank: stock is a running
        // count changed on the Inventory screen, not overwritten here.
        variants: product.variants.map((variant) => ({
            variantId: variant.variantId,
            variantValue: variant.variantValue,
            priceAdjustmentPesos: centavosToPesos(variant.priceAdjustmentCentavos),
            stockQuantity: "",
            isActive: variant.isActive,
        })),
    };
}

/**
 * The product editor.
 *
 * Sizes live in the same payload as the product, because a uniform's sizes and
 * its stock are managed together. A size's stock field is only meaningful for a
 * NEW size - the server seeds the inventory row on first save and ignores it
 * afterwards, so a restock can never silently wipe a count.
 */
function ProductModal({ initial, onClose, onSaved }) {
    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Photo handling. A staff member picks a photo off their phone or laptop -
    // there is no URL field. A brand new product has no id yet, so its photo can
    // only be uploaded AFTER the first save; the picker says so rather than
    // silently failing.
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingPreview, setPendingPreview] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const fileRef = useRef(null);

    const types = subCategoriesFor(form.category);

    const update = (patch) => setForm((current) => ({ ...current, ...patch }));

    // Preview the chosen photo locally, and release the object URL so the blob
    // is not held for the lifetime of the page.
    useEffect(() => {
        if (!pendingFile) {
            setPendingPreview(null);
            return undefined;
        }

        const url = URL.createObjectURL(pendingFile);
        setPendingPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [pendingFile]);

    const pickPhoto = (event) => {
        const file = event.target.files?.[0] || null;

        if (!file) return;

        // Mirrors the server's own rules so the file is rejected here with a
        // clear reason instead of after a slow upload.
        if (file.size > MAX_PHOTO_BYTES) {
            toast.error(
                `That photo is too large. Maximum is ${MAX_PHOTO_BYTES / 1024 / 1024} MB.`
            );
            event.target.value = "";
            return;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error("Only JPG, PNG, WEBP or GIF photos are accepted.");
            event.target.value = "";
            return;
        }

        setPendingFile(file);
        setRemovePhoto(false);
    };

    const clearPhoto = () => {
        if (fileRef.current) fileRef.current.value = "";
        setPendingFile(null);
        setPendingPreview(null);
    };

    const shownPhoto = removePhoto
        ? null
        : (pendingPreview ?? (form.imageUrl || null));

    // Saves the product first, then uploads the photo against the id it now has.
    const submit = async () => {
        setSaving(true);
        setError("");

        try {
            const response = await staffApi.saveProduct({
                productId: form.productId ?? undefined,
                name: form.name.trim(),
                description: form.description.trim(),
                category: form.category,
                subCategory: form.subCategory,
                priceCentavos: pesosToCentavos(form.pricePesos),
                hasVariants: form.variants.length > 0,
                isActive: form.isActive,
                variants: form.variants
                    .filter((variant) => variant.variantValue.trim())
                    .map((variant) => ({
                        variantId: variant.variantId ?? undefined,
                        variantName: "Size",
                        variantValue: variant.variantValue.trim(),
                        priceAdjustmentCentavos: pesosToCentavos(variant.priceAdjustmentPesos),
                        stockQuantity: variant.stockQuantity
                            ? Number(variant.stockQuantity)
                            : 0,
                        isActive: variant.isActive,
                    })),
            });

            const savedProduct = response.data;
            const productId = savedProduct?.productId ?? form.productId;

            let imageMessage = "";

            if (removePhoto && productId) {
                await staffApi.removeProductImage(productId);
                imageMessage = " Photo removed.";
            } else if (pendingFile && productId) {
                const upload = await staffApi.uploadProductImage(productId, pendingFile);
                savedProduct.imageUrl = upload.data?.imageUrl ?? savedProduct.imageUrl;
                imageMessage = " Photo uploaded.";
            }

            toast.success(`${response.message || "Product saved."}${imageMessage}`);
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const onCategoryChange = (value) => {
        // Switching category resets the type, because a type from another
        // category is not a valid choice.
        setForm((current) => ({
            ...current,
            category: value,
            subCategory: subCategoriesFor(value)[0] || "",
        }));
    };

    const addVariant = () => {
        setForm((current) => ({
            ...current,
            hasVariants: true,
            variants: [
                ...current.variants,
                {
                    variantId: null,
                    variantValue: "",
                    priceAdjustmentPesos: "",
                    stockQuantity: "",
                    isActive: true,
                },
            ],
        }));
    };

    const updateVariant = (index, patch) => {
        setForm((current) => ({
            ...current,
            variants: current.variants.map((variant, i) =>
                i === index ? { ...variant, ...patch } : variant
            ),
        }));
    };

    const removeVariant = (index) => {
        setForm((current) => ({
            ...current,
            variants: current.variants.filter((_, i) => i !== index),
        }));
    };


    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl">
                <header className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-800">
                        {form.productId ? "Edit product" : "Add product"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                    >
                        <X size={15} />
                    </button>
                </header>

                <div className="space-y-3 p-4">
                    {error && (
                        <MarketNotice tone="error" title="Could not save">
                            {error}
                        </MarketNotice>
                    )}

                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Name
                        </span>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(event) => update({ name: event.target.value })}
                            className={marketInputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Description
                        </span>
                        <textarea
                            value={form.description}
                            onChange={(event) => update({ description: event.target.value })}
                            rows={2}
                            className={marketInputClass}
                        />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                Category
                            </span>
                            <select
                                value={form.category}
                                onChange={(event) => onCategoryChange(event.target.value)}
                                className={marketSelectClass}
                            >
                                {CATEGORIES.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                Type
                            </span>
                            <select
                                value={form.subCategory}
                                onChange={(event) =>
                                    update({ subCategory: event.target.value })
                                }
                                className={marketSelectClass}
                            >
                                {types.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                Price (PHP)
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.pricePesos}
                                onChange={(event) => update({ pricePesos: event.target.value })}
                                className={marketInputClass}
                            />
                        </label>
                    </div>

                    {/* PHOTO - a real file upload, not a URL field.
                    A brand new product has no id yet, so the upload runs
                    after the first save. The button says so instead of
                    failing quietly. */}
                    <div>
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Photo
                        </span>

                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                                {shownPhoto ? (
                                    <img
                                        src={marketImageUrl(shownPhoto)}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ImageOff
                                        size={18}
                                        className="text-slate-300"
                                    />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-slate-700">
                                    {pendingFile
                                        ? pendingFile.name
                                        : "No photo chosen"}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    {pendingFile
                                        ? `${(pendingFile.size / 1024).toFixed(0)} KB · uploaded when you save`
                                        : form.productId
                                          ? "JPG, PNG, WEBP or GIF · up to 5 MB"
                                          : "Save the product first, then add its photo"}
                                </p>
                            </div>

                            <input
                                ref={fileRef}
                                type="file"
                                accept={ALLOWED_TYPES.join(",")}
                                onChange={pickPhoto}
                                className="sr-only"
                                tabIndex={-1}
                            />

                            <MarketButton
                                variant="secondary"
                                size="sm"
                                onClick={() => fileRef.current?.click()}
                                disabled={!form.productId}
                            >
                                <Upload size={11} />
                                {pendingFile ? "Change" : "Choose photo"}
                            </MarketButton>

                            {(pendingFile || form.imageUrl) && (
                                <MarketButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (pendingFile) {
                                            clearPhoto();
                                        } else {
                                            // Only a saved photo is really removed -
                                            // the server deletes the file on save.
                                            setRemovePhoto(true);
                                        }
                                    }}
                                    aria-label="Remove photo"
                                >
                                    <X size={12} />
                                </MarketButton>
                            )}
                        </div>
                    </div>

                    {removePhoto && form.imageUrl && (
                        <p className="-mt-2 text-[10px] text-amber-600">
                            The current photo will be deleted when you save.
                        </p>
                    )}

                    <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(event) => update({ isActive: event.target.checked })}
                        />
                        Visible to buyers
                    </label>

                    {/* Sizes */}
                    <div className="rounded-xl border border-slate-200 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-700">
                                    Sizes
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    Each size has its own stock.
                                </p>
                            </div>

                            <MarketButton variant="secondary" size="sm" onClick={addVariant}>
                                <Plus size={11} />
                                Add size
                            </MarketButton>
                        </div>

                        {form.variants.length === 0 ? (
                            <p className="py-2 text-center text-[11px] text-slate-400">
                                No sizes. This is a one-size item.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {form.variants.map((variant, index) => (
                                    <div
                                        key={index}
                                        className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
                                    >
                                        <input
                                            type="text"
                                            value={variant.variantValue}
                                            onChange={(event) =>
                                                updateVariant(index, {
                                                    variantValue: event.target.value,
                                                })
                                            }
                                            placeholder="Size"
                                            className={`${marketInputClass} py-2 text-xs`}
                                        />

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={variant.priceAdjustmentPesos}
                                            onChange={(event) =>
                                                updateVariant(index, {
                                                    priceAdjustmentPesos: event.target.value,
                                                })
                                            }
                                            placeholder="+ PHP"
                                            className={`${marketInputClass} py-2 text-xs`}
                                        />

                                        <input
                                            type="number"
                                            min="0"
                                            value={variant.stockQuantity}
                                            onChange={(event) =>
                                                updateVariant(index, {
                                                    stockQuantity: event.target.value,
                                                })
                                            }
                                            placeholder={
                                                variant.variantId
                                                    ? "In Inventory"
                                                    : "Opening stock"
                                            }
                                            disabled={Boolean(variant.variantId)}
                                            className={`${marketInputClass} py-2 text-xs disabled:bg-slate-50 disabled:text-slate-400`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeVariant(index)}
                                            aria-label="Remove size"
                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <footer className="sticky bottom-0 flex gap-2 border-t border-slate-100 bg-white px-4 py-3">
                    <MarketButton variant="secondary" onClick={onClose} className="flex-1">
                        Cancel
                    </MarketButton>
                    <MarketButton onClick={submit} disabled={saving} className="flex-1">
                        {saving ? "Saving..." : "Save product"}
                    </MarketButton>
                </footer>
            </div>
        </div>
    );
}
