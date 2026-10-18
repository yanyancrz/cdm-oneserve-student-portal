import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackageSearch, Search, Store as StoreIcon, Truck } from "lucide-react";

import { storeApi } from "../services/marketApi";
import {
    STORE_KINDS,
    storeKindLabel,
    storeStatusLabel,
    storeStatusTone,
} from "../config/marketVocabulary";
import { formatPeso, formatPesoShort } from "../utils/format";
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
 * Storefronts.
 *
 * The marketplace now has two axes: browse EVERY product (the Shop screen) or
 * browse by STOREFRONT. This is the second one, and it is the door to a store's
 * own page, team and catalogue.
 *
 * Sorting is by sales, descending, and sales only ever count COMPLETED orders
 * whose payment settled - so the top of this list is a store people actually buy
 * from, not one that merely processed a pile of abandoned carts.
 *
 * A PAUSED storefront stays in the list, clearly marked. Dropping it would make
 * a stall link a buyer followed look broken; showing it says "open again soon",
 * which is the truth.
 */
export default function MarketStoresPage() {
    const navigate = useNavigate();

    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [kind, setKind] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError("");

                const response = await storeApi.browse({ kind: kind || undefined });

                if (cancelled) return;
                setStores(response.data || []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [kind]);

    // Search is client-side: the browse payload is a small bounded page, and
    // spending a request per keystroke on 5-100 rows would be wasteful.
    const needle = search.trim().toLowerCase();
    const visible = needle
        ? stores.filter(
              (store) =>
                  store.name.toLowerCase().includes(needle) ||
                  (store.description || "").toLowerCase().includes(needle) ||
                  (store.location || "").toLowerCase().includes(needle)
          )
        : stores;

    return (
        <div className="space-y-4">
            <MarketPanel
                title="Storefronts"
                subtitle={
                    loading
                        ? undefined
                        : `${visible.length} ${visible.length === 1 ? "storefront" : "storefronts"} on campus.`
                }
            >
                <div className="space-y-3 p-3.5">
                    <div className="flex flex-wrap gap-1.5">
                        <KindChip
                            label="All"
                            active={!kind}
                            onClick={() => setKind("")}
                        />
                        {STORE_KINDS.map((option) => (
                            <KindChip
                                key={option.value}
                                label={option.label}
                                active={kind === option.value}
                                onClick={() => setKind(option.value)}
                            />
                        ))}
                    </div>

                    <div className="relative">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search storefronts..."
                            aria-label="Search storefronts"
                            className={`${marketInputClass} pl-10`}
                        />
                    </div>
                </div>
            </MarketPanel>

            {error ? (
                <MarketNotice tone="error" title="Could not load the storefronts">
                    {error}
                </MarketNotice>
            ) : null}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={4} />
                </MarketPanel>
            ) : visible.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<StoreIcon size={20} />}
                        title={stores.length === 0 ? "No storefronts yet" : "Nothing matches"}
                        hint={
                            stores.length === 0
                                ? "The Marketplace Head creates storefronts from Workspaces."
                                : "Try a different search or category."
                        }
                        action={
                            stores.length > 0 ? (
                                <MarketButton
                                    variant="secondary"
                                    onClick={() => {
                                        setSearch("");
                                        setKind("");
                                    }}
                                >
                                    Clear filters
                                </MarketButton>
                            ) : null
                        }
                    />
                </MarketPanel>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((store) => (
                        <StoreCard
                            key={store.storeId}
                            store={store}
                            onOpen={() => navigate(`/marketplace/stores/${store.storeId}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/** One storefront card. */
function StoreCard({ store, onOpen }) {
    const orderable = store.isOrderable !== false;

    return (
        <button
            type="button"
            onClick={onOpen}
            className="group flex flex-col overflow-hidden rounded-[22px] bg-white/90 text-left ring-1 ring-black/[0.04] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/30"
        >
            {/* Banner, falling back to the photo, then to a plain brand panel. */}
            <div className="relative">
                {store.bannerUrl ? (
                    <MarketImage
                        src={store.bannerUrl}
                        alt={store.name}
                        initials=""
                        className="h-24 w-full object-cover"
                        rounded="rounded-none"
                    />
                ) : (
                    <div className="h-24 w-full bg-gradient-to-br from-[#106A2E] to-[#0E3B22]" />
                )}

                <span
                    className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${storeStatusTone(store.status)}`}
                >
                    {storeStatusLabel(store.status)}
                </span>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start gap-3">
                    <MarketImage
                        src={store.photoUrl}
                        alt={store.name}
                        initials={store.name}
                        className="h-11 w-11 shrink-0 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{store.name}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                            {storeKindLabel(store.kind)}
                            {store.location ? ` · ${store.location}` : ""}
                        </p>
                    </div>
                </div>

                {store.description ? (
                    <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-slate-500">
                        {store.description}
                    </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {store.deliveryEnabled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                            <Truck size={10} aria-hidden="true" />
                            Delivery
                            {store.deliveryFeeCentavos > 0
                                ? ` ${formatPeso(store.deliveryFeeCentavos)}`
                                : " free"}
                        </span>
                    ) : null}

                    {store.productCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                            <PackageSearch size={10} aria-hidden="true" />
                            {store.productCount} item{store.productCount === 1 ? "" : "s"}
                        </span>
                    ) : null}
                </div>

                <div className="mt-3 flex-1" />

                <div className="flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
                    <div>
                        <p className="text-[9px] uppercase tracking-[.14em] text-slate-400">
                            {store.soldUnits > 0 ? "Sold" : "Not selling yet"}
                        </p>
                        <p className="text-xs font-semibold text-slate-700">
                            {store.soldUnits > 0
                                ? `${store.soldUnits} unit${store.soldUnits === 1 ? "" : "s"} · ${formatPesoShort(store.salesCentavos)}`
                                : "—"}
                        </p>
                    </div>

                    <span
                        className={`text-[10px] font-semibold ${
                            orderable ? "text-[#106A2E]" : "text-slate-400"
                        }`}
                    >
                        {orderable ? "Open store" : "Paused"}
                    </span>
                </div>
            </div>
        </button>
    );
}

/** A storefront-category filter pill. */
function KindChip({ label, active, onClick }) {
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
