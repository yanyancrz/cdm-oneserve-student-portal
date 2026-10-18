import { useCallback, useEffect, useState } from "react";
import {
    Layers,
    Pencil,
    Plus,
    RefreshCw,
    Save,
    Store as StoreIcon,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import { headApi, storeApi } from "../services/marketApi";
import {
    STORE_KINDS,
    STORE_KIND,
    STORE_STATUS,
    storeKindLabel,
    storeStatusLabel,
    storeStatusTone,
} from "../config/marketVocabulary";
import { formatPeso } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketField,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
    marketSelectClass,
} from "../components/marketUi";

/**
 * Storefront management. Marketplace Head only.
 *
 * WHY THE HEAD OWNS THIS SCREEN
 *   A storefront is a public face plus a team, so getting it wrong is expensive:
 *   the wrong owner means the wrong person can rewrite the catalogue, and the
 *   wrong workspace means orders land in a stall that cannot fulfil them. Both
 *   are deliberate administrative acts, not something a store owner does to
 *   themselves - an owner may pause their own store, nothing more.
 *
 * OWNER IS A USER ID, NOT A PICKER
 *   Store owners are not limited to marketplace staff - a Student or Faculty
 *   account can own a storefront - so there is no sensible short list to offer
 *   in a dropdown. This asks for the numeric id from Admin > Users instead,
 *   which is the same pattern the store Team screen uses.
 *
 * THE WORKSPACE IS THE IMPORTANT FIELD
 *   It is the bridge: a storefront fronts exactly one workspace, and that is
 *   where its products, stock and orders actually live. Getting it wrong sends
 *   orders to a stall that does not hold the items.
 *
 * STATUS IS DELIBERATELY LIMITED TO active/paused here.
 *   banned is an administrative action with consequences (open orders get
 *   suspended and refunded once moderation lands) and deleted is terminal.
 *   The service ignores anything else rather than letting a form reach them.
 */
export default function MarketStaffStoresPage() {
    const [stores, setStores] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [storesResponse, workspacesResponse] = await Promise.all([
                storeApi.manage(),
                headApi.workspaces().catch(() => ({ data: [] })),
            ]);

            setStores(storesResponse.data || []);
            setWorkspaces(workspacesResponse.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const [storesResponse, workspacesResponse] = await Promise.all([
                    storeApi.manage(),
                    headApi.workspaces().catch(() => ({ data: [] })),
                ]);

                if (cancelled) return;
                setStores(storesResponse.data || []);
                setWorkspaces(workspacesResponse.data || []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const startNew = () => {
        setEditing("new");
        setForm(emptyForm());
        setFormError("");
    };

    const startEdit = (store) => {
        setEditing(store.storeId);
        setForm({
            storeId: store.storeId,
            name: store.name || "",
            description: store.description || "",
            kind: store.kind || STORE_KIND.FOOD,
            location: store.location || "",
            photoUrl: store.photoUrl || "",
            bannerUrl: store.bannerUrl || "",
            ownerUserId: store.ownerUserId ?? "",
            workspaceId: store.workspaceId ?? "",
            deliveryEnabled: store.deliveryEnabled === true,
            deliveryFeeCentavos: (store.deliveryFeeCentavos || 0) / 100,
            status: store.status === STORE_STATUS.PAUSED ? STORE_STATUS.PAUSED : STORE_STATUS.ACTIVE,
        });
        setFormError("");
    };

    const cancel = () => {
        setEditing(null);
        setForm(emptyForm());
        setFormError("");
    };

    const save = async (event) => {
        event.preventDefault();

        const name = form.name.trim();
        if (name.length < 2) {
            setFormError("Enter a store name (2-100 characters).");
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            const response = await storeApi.save({
                storeId: editing === "new" ? null : Number(editing),
                name,
                description: form.description.trim() || null,
                kind: form.kind,
                location: form.location.trim() || null,
                photoUrl: form.photoUrl.trim() || null,
                bannerUrl: form.bannerUrl.trim() || null,
                ownerUserId: form.ownerUserId ? Number(form.ownerUserId) : null,
                workspaceId: form.workspaceId ? Number(form.workspaceId) : null,
                deliveryEnabled: form.deliveryEnabled,
                deliveryFeeCentavos: Math.round((Number(form.deliveryFeeCentavos) || 0) * 100),
                status: form.status,
            });

            toast.success(response.message || "Storefront saved.");
            setEditing(null);
            await load();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const set = (key) => (event) =>
        setForm((current) => ({
            ...current,
            [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
        }));

    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={5} />
            </MarketPanel>
        );
    }

    if (error) {
        return (
            <MarketNotice tone="error" title="Only the Marketplace Head can manage storefronts">
                {error}
            </MarketNotice>
        );
    }

    return (
        <div className="space-y-4">
            <MarketPanel
                title="Storefronts"
                subtitle="A storefront is a public face over one workspace, where its products, stock and orders actually live."
                action={
                    <div className="flex gap-1.5">
                        <MarketButton size="sm" variant="secondary" onClick={load}>
                            <RefreshCw size={13} />
                            Refresh
                        </MarketButton>
                        <MarketButton size="sm" onClick={startNew} disabled={editing !== null}>
                            <Plus size={13} />
                            New
                        </MarketButton>
                    </div>
                }
            >
                {stores.length === 0 ? (
                    <MarketEmpty
                        icon={<StoreIcon size={20} />}
                        title="No storefronts yet"
                        hint="Create one to give a stall a public face and a team."
                        action={<MarketButton onClick={startNew}>Create the first storefront</MarketButton>}
                    />
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {stores.map((store) => (
                            <li key={store.storeId} className="px-4 py-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-xs font-semibold text-slate-800">
                                                {store.name}
                                            </p>

                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${storeStatusTone(store.status)}`}
                                            >
                                                {storeStatusLabel(store.status)}
                                            </span>

                                            <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                                                {storeKindLabel(store.kind)}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-[10px] text-slate-400">
                                            {store.ownerName ? (
                                                <>Owner: {store.ownerName} ({store.ownerEmail})</>
                                            ) : (
                                                <span className="text-amber-600">
                                                    No owner yet - nobody can manage its team
                                                </span>
                                            )}
                                        </p>

                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                            {store.workspaceId ? (
                                                <>
                                                    <Layers
                                                        size={9}
                                                        className="mr-1 inline align-middle"
                                                        aria-hidden="true"
                                                    />
                                                    Fulfilled from {store.workspaceName || `workspace ${store.workspaceId}`}
                                                </>
                                            ) : (
                                                <span className="text-amber-600">
                                                    No workspace wired - it cannot take orders
                                                </span>
                                            )}
                                            {" · "}
                                            {store.productCount} item{store.productCount === 1 ? "" : "s"}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        {store.deliveryEnabled ? (
                                            <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                                                Delivery{" "}
                                                {store.deliveryFeeCentavos > 0
                                                    ? formatPeso(store.deliveryFeeCentavos)
                                                    : "free"}
                                            </span>
                                        ) : null}

                                        <MarketButton
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => startEdit(store)}
                                            disabled={editing !== null}
                                        >
                                            <Pencil size={12} />
                                            Edit
                                        </MarketButton>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </MarketPanel>

            {editing !== null ? (
                <MarketPanel
                    title={editing === "new" ? "New storefront" : `Edit ${form.name || "storefront"}`}
                    subtitle="Only active and paused are settable. Banning is a separate administrative action."
                    action={
                        <MarketButton size="sm" variant="ghost" onClick={cancel} disabled={saving}>
                            <X size={13} />
                            Close
                        </MarketButton>
                    }
                >
                    <form onSubmit={save} className="space-y-4 p-4">
                        <MarketField label="Name" hint="Unique across all storefronts.">
                            <input
                                className={marketInputClass}
                                value={form.name}
                                maxLength={100}
                                onChange={set("name")}
                            />
                        </MarketField>

                        <MarketField label="Description" hint="Shown on the storefront page.">
                            <textarea
                                className={`${marketInputClass} min-h-[80px] resize-y`}
                                value={form.description}
                                maxLength={3000}
                                onChange={set("description")}
                            />
                        </MarketField>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <MarketField label="Sells" hint="Drives the browse filter.">
                                <select className={marketSelectClass} value={form.kind} onChange={set("kind")}>
                                    {STORE_KINDS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </MarketField>

                            <MarketField label="Location" hint="Free text, e.g. Main Building.">
                                <input
                                    className={marketInputClass}
                                    value={form.location}
                                    maxLength={200}
                                    onChange={set("location")}
                                />
                            </MarketField>
                        </div>

                        {/* The bridge. Called out because it is the field whose
                            wrong value sends orders to the wrong stall. */}
                        <MarketField
                            label="Fulfilled from workspace"
                            hint="Where this store's products, stock and orders actually live. Leave empty and it cannot take orders."
                        >
                            <select
                                className={marketSelectClass}
                                value={form.workspaceId}
                                onChange={set("workspaceId")}
                            >
                                <option value="">Not wired yet</option>
                                {workspaces.map((workspace) => (
                                    <option
                                        key={workspace.workspaceId}
                                        value={workspace.workspaceId}
                                    >
                                        {workspace.name}
                                        {workspace.isActive === false ? " (inactive)" : ""}
                                    </option>
                                ))}
                            </select>
                        </MarketField>

                        <MarketField
                            label="Owner user id"
                            hint="From Admin > Users. Anyone can own a storefront, so this is an id rather than a list. Leave empty and nobody can manage its team."
                        >
                            <input
                                className={marketInputClass}
                                type="number"
                                min="1"
                                value={form.ownerUserId}
                                onChange={set("ownerUserId")}
                            />
                        </MarketField>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <MarketField label="Status">
                                <select className={marketSelectClass} value={form.status} onChange={set("status")}>
                                    <option value={STORE_STATUS.ACTIVE}>Open</option>
                                    <option value={STORE_STATUS.PAUSED}>Paused</option>
                                </select>
                            </MarketField>

                            <MarketField
                                label="Delivery fee (PHP)"
                                hint={
                                    form.deliveryEnabled
                                        ? "Shown on the storefront. Checkout currently reads the system-wide fee, not this."
                                        : "Only used if delivery is enabled below."
                                }
                            >
                                <input
                                    className={marketInputClass}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.deliveryFeeCentavos}
                                    disabled={!form.deliveryEnabled}
                                    onChange={set("deliveryFeeCentavos")}
                                />
                            </MarketField>
                        </div>

                        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                            <input
                                type="checkbox"
                                checked={form.deliveryEnabled}
                                onChange={set("deliveryEnabled")}
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            Offers campus delivery
                        </label>

                        <MarketField label="Photo URL" hint="Optional. Leave empty and initials are shown instead.">
                            <input
                                className={marketInputClass}
                                value={form.photoUrl}
                                maxLength={255}
                                onChange={set("photoUrl")}
                            />
                        </MarketField>

                        <MarketField label="Banner URL" hint="Optional wide image for the storefront header.">
                            <input
                                className={marketInputClass}
                                value={form.bannerUrl}
                                maxLength={255}
                                onChange={set("bannerUrl")}
                            />
                        </MarketField>

                        {formError ? (
                            <MarketNotice tone="error" title="Could not save">
                                {formError}
                            </MarketNotice>
                        ) : null}

                        <div className="flex gap-2">
                            <MarketButton type="submit" disabled={saving}>
                                <Save size={14} />
                                {saving ? "Saving..." : "Save storefront"}
                            </MarketButton>
                            <MarketButton type="button" variant="ghost" onClick={cancel} disabled={saving}>
                                Cancel
                            </MarketButton>
                        </div>
                    </form>
                </MarketPanel>
            ) : null}
        </div>
    );
}

/** An empty create-form. */
function emptyForm() {
    return {
        storeId: null,
        name: "",
        description: "",
        kind: STORE_KIND.FOOD,
        location: "",
        photoUrl: "",
        bannerUrl: "",
        ownerUserId: "",
        workspaceId: "",
        deliveryEnabled: false,
        deliveryFeeCentavos: 0,
        status: STORE_STATUS.ACTIVE,
    };
}
