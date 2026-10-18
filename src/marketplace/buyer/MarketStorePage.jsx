import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ChevronLeft,
    Flag,
    LineChart,
    Mail,
    Package,
    Settings2,
    ShieldOff,
    ShoppingBag,
    Star,
    Truck,
    Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { moderationApi, reviewApi, storeApi } from "../services/marketApi";
import {
    STORE_PERMISSIONS,
    canManageStore,
    ratingLabel,
    storeKindLabel,
    storeStatusLabel,
    storeStatusTone,
} from "../config/marketVocabulary";
import { formatDateTime, formatPeso, formatPesoShort } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketField,
    MarketImage,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";

/**
 * One storefront.
 *
 * Three audiences share this page:
 *   * a BUYER - sees the storefront and can shop it;
 *   * the OWNER - additionally sees the Team button and their permissions;
 *   * a TEAM MEMBER - sees which permissions they hold, and nothing they cannot
 *     use. Nothing is hidden behind a client-side guess: the server decides, and
 *     this page only renders what it was told.
 *
 * "Apply to work here" is for Student and Faculty accounts who want to join the
 * team. Staff accounts are refused by the server, so the button is hidden for
 * anyone whose role is not a buyer role.
 */
export default function MarketStorePage() {
    const { storeId } = useParams();
    const navigate = useNavigate();

    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(null);
    const [loadingReviews, setLoadingReviews] = useState(true);

    const [applying, setApplying] = useState(false);
    const [showApply, setShowApply] = useState(false);
    const [position, setPosition] = useState("");
    const [message, setMessage] = useState("");

    // Moderation: report the storefront, or block it so it stops appearing.
    const [showReport, setShowReport] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [submittingReport, setSubmittingReport] = useState(false);
    const [blocking, setBlocking] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const response = await storeApi.read(storeId);
                if (!cancelled) setStore(response.data);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [storeId]);

    // Reviews are a separate read so a failure here never hides the storefront
    // itself - the page is still useful without them.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoadingReviews(true);

                const [reviewsResponse, ratingResponse] = await Promise.all([
                    reviewApi.forStore(storeId).catch(() => ({ data: [] })),
                    reviewApi.rating(storeId).catch(() => ({ data: null })),
                ]);

                if (cancelled) return;
                setReviews(reviewsResponse.data || []);
                setRating(ratingResponse.data || null);
            } finally {
                if (!cancelled) setLoadingReviews(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [storeId]);

    const apply = async (event) => {
        event.preventDefault();

        if (position.trim().length < 2) {
            toast.error("Say which position you are applying for.");
            return;
        }

        setApplying(true);

        try {
            const response = await storeApi.apply({
                storeId: Number(storeId),
                position: position.trim(),
                message: message.trim() || null,
            });

            toast.success(response.message || "Application sent.");
            setShowApply(false);
            setPosition("");
            setMessage("");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setApplying(false);
        }
    };

    const submitReport = async (event) => {
        event.preventDefault();

        if (reportReason.trim().length < 5) {
            toast.error("Explain what happened (at least 5 characters).");
            return;
        }

        setSubmittingReport(true);

        try {
            const response = await moderationApi.report({
                targetStoreId: Number(storeId),
                reason: reportReason.trim(),
            });

            toast.success(response.message || "Your report has been sent to the administrators.");
            setShowReport(false);
            setReportReason("");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmittingReport(false);
        }
    };

    const blockStore = async () => {
        if (!window.confirm("Block this store? It will stop appearing for you.")) {
            return;
        }

        setBlocking(true);

        try {
            const response = await moderationApi.block({ targetStoreId: Number(storeId) });
            toast.success(response.message || "Store blocked.");
            navigate("/marketplace/stores");
        } catch (err) {
            toast.error(err.message);
            setBlocking(false);
        }
    };

    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={5} />
            </MarketPanel>
        );
    }

    if (error && !store) {
        return (
            <MarketNotice tone="error" title="Could not open this storefront">
                {error}
            </MarketNotice>
        );
    }

    const mine = canManageStore(store);
    const permissions = store?.myPermissions || [];
    // Sales & forecast. The owner holds every permission; a member needs the
    // named one. The server enforces this too - the button is only a shortcut.
    const canSeeInsights = store?.isOwner === true || permissions.includes("analytics");

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => navigate("/marketplace/stores")}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
            >
                <ChevronLeft size={14} aria-hidden="true" />
                All storefronts
            </button>

            {/* Banner + identity */}
            <section className="relative overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.04] shadow-sm">
                {store?.bannerUrl ? (
                    <MarketImage
                        src={store.bannerUrl}
                        alt=""
                        initials=""
                        className="h-32 w-full object-cover sm:h-40"
                        rounded="rounded-none"
                    />
                ) : (
                    <div className="h-32 w-full bg-gradient-to-br from-[#106A2E] to-[#0E3B22] sm:h-40" />
                )}

                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
                    <MarketImage
                        src={store?.photoUrl}
                        alt={store?.name || "Storefront"}
                        initials={store?.name}
                        className="-mt-14 h-20 w-20 shrink-0 rounded-2xl border-4 border-white object-cover shadow-sm sm:-mt-16"
                    />

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg font-semibold tracking-tight text-slate-800">
                                {store?.name}
                            </h1>

                            <span
                                className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${storeStatusTone(store?.status)}`}
                            >
                                {storeStatusLabel(store?.status)}
                            </span>
                        </div>

                        <p className="mt-1 text-[11px] text-slate-400">
                            {storeKindLabel(store?.kind)}
                            {store?.location ? ` · ${store.location}` : ""}
                            {store?.ownerName ? ` · by ${store.ownerName}` : ""}
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                        {mine ? (
                            <MarketButton
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate(`/marketplace/stores/${storeId}/team`)}
                            >
                                <Users size={13} />
                                Team
                            </MarketButton>
                        ) : null}

                        {canSeeInsights ? (
                            <MarketButton
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate(`/marketplace/stores/${storeId}/insights`)}
                            >
                                <LineChart size={13} />
                                Insights
                            </MarketButton>
                        ) : null}

                        <MarketButton
                            size="sm"
                            onClick={() => navigate(`/marketplace?storeId=${storeId}`)}
                            disabled={store?.isOrderable === false}
                        >
                            <ShoppingBag size={13} />
                            {store?.isOrderable === false ? "Paused" : "Browse items"}
                        </MarketButton>
                    </div>
                </div>
            </section>

            {store?.isOrderable === false ? (
                <MarketNotice tone="warn" title="This storefront is paused">
                    It is not taking orders right now. Anything already ordered is unaffected.
                </MarketNotice>
            ) : null}

            {error ? (
                <MarketNotice tone="warn" title="Showing the last loaded details">
                    {error}
                </MarketNotice>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
                <div className="space-y-4">
                    {store?.description ? (
                        <MarketPanel title="About this store">
                            <p className="whitespace-pre-line p-4 text-[12px] leading-6 text-slate-600">
                                {store.description}
                            </p>
                        </MarketPanel>
                    ) : null}

                    {/* Only rendered for the team, and only from the server's list. */}
                    {permissions.length > 0 ? (
                        <MarketPanel
                            title="Your access here"
                            subtitle={
                                store?.isOwner
                                    ? "You own this storefront, so you have every permission."
                                    : "Granted by the store owner."
                            }
                        >
                            <div className="flex flex-wrap gap-1.5 p-4">
                                {STORE_PERMISSIONS.map((permission) => {
                                    const has = permissions.includes(permission.value);

                                    return (
                                        <span
                                            key={permission.value}
                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                                has
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-slate-50 text-slate-400"
                                            }`}
                                        >
                                            {has ? "✓" : "·"} {permission.label}
                                        </span>
                                    );
                                })}
                            </div>
                        </MarketPanel>
                    ) : null}

                    {/* Reviews. Shown to everyone; a store with none invites the
                        first one rather than showing an empty list. */}
                    <MarketPanel
                        title="Reviews"
                        subtitle={
                            rating && rating.reviewCount > 0
                                ? `${rating.rating} / 5 · ${rating.reviewCount} review${
                                      rating.reviewCount === 1 ? "" : "s"
                                  }`
                                : "Be the first to review this storefront."
                        }
                    >
                        {loadingReviews ? (
                            <MarketSkeleton rows={3} />
                        ) : reviews.length === 0 ? (
                            <MarketEmpty
                                icon={<Star size={20} />}
                                title="No reviews yet"
                                hint="Complete an order from this store, then come back and rate it."
                            />
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {reviews.map((review) => (
                                    <li key={review.reviewId} className="py-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-[11px] font-semibold text-slate-700">
                                                {ratingLabel(review.rating)}
                                            </p>
                                            <p className="text-[9px] text-slate-400">
                                                {formatDateTime(review.createdAt)}
                                            </p>
                                        </div>

                                        {review.body ? (
                                            <p className="mt-2 text-[11px] leading-5 text-slate-600">
                                                {review.body}
                                            </p>
                                        ) : null}

                                        {review.photos && review.photos.length > 0 ? (
                                            <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                                                {review.photos.map((photo) => (
                                                    <MarketImage
                                                        key={photo.photoId}
                                                        src={photo.url}
                                                        alt=""
                                                        initials=""
                                                        className="h-16 w-full rounded-lg object-cover"
                                                    />
                                                ))}
                                            </div>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </MarketPanel>

                    {/* Apply to work here - buyer roles only. */}
                    {!mine ? (
                        <MarketPanel
                            title="Work at this store"
                            subtitle="Staff at a storefront can help run its catalogue and orders."
                        >
                            {showApply ? (
                                <form onSubmit={apply} className="space-y-3 p-4">
                                    <MarketField
                                        label="Position"
                                        hint="Which role are you applying for?"
                                    >
                                        <input
                                            className={marketInputClass}
                                            value={position}
                                            maxLength={120}
                                            placeholder="Kitchen, Cashier, Shelf..."
                                            onChange={(event) => setPosition(event.target.value)}
                                        />
                                    </MarketField>

                                    <MarketField label="Message (optional)">
                                        <textarea
                                            className={`${marketInputClass} min-h-[70px] resize-y`}
                                            value={message}
                                            maxLength={1000}
                                            onChange={(event) => setMessage(event.target.value)}
                                        />
                                    </MarketField>

                                    <div className="flex gap-2">
                                        <MarketButton type="submit" disabled={applying}>
                                            {applying ? "Sending..." : "Send application"}
                                        </MarketButton>
                                        <MarketButton
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setShowApply(false)}
                                        >
                                            Cancel
                                        </MarketButton>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-4">
                                    <MarketButton variant="secondary" onClick={() => setShowApply(true)}>
                                        Apply to work here
                                    </MarketButton>
                                </div>
                            )}
                        </MarketPanel>
                    ) : null}
                </div>

                <div className="space-y-4">
                    <MarketPanel title="At a glance">
                        <div className="space-y-3 p-4">
                            <Row
                                icon={<Package size={13} />}
                                label="Items"
                                value={
                                    store?.productCount > 0
                                        ? String(store.productCount)
                                        : "None listed yet"
                                }
                            />
                            <Row
                                icon={<Truck size={13} />}
                                label="Delivery"
                                value={
                                    store?.deliveryEnabled
                                        ? store.deliveryFeeCentavos > 0
                                            ? `${formatPeso(store.deliveryFeeCentavos)}`
                                            : "Free"
                                        : "Pickup only"
                                }
                            />
                            <Row
                                icon={<ShoppingBag size={13} />}
                                label="Sold"
                                value={
                                    store?.soldUnits > 0
                                        ? `${store.soldUnits} · ${formatPesoShort(store.salesCentavos)}`
                                        : "Nothing yet"
                                }
                            />
                            <Row
                                icon={<Mail size={13} />}
                                label="Joined"
                                value={formatDateTime(store?.createdAt) || "—"}
                            />
                        </div>
                    </MarketPanel>

                    {/* Buyer-side hint about the city-wide list, so a store page
                        is not a dead end for someone who wants everything. */}
                    <MarketNotice tone="info" title="Looking for everything at once?" icon={<Settings2 size={14} />}>
                        The Shop tab lists every available item across all storefronts, so you do not
                        have to visit each store.
                    </MarketNotice>

                    {/* Moderation. Buyer only - a team member reporting their own
                        store is not a thing. The server records the caller from
                        the token, so no id is trusted from here. */}
                    {!mine ? (
                        <MarketPanel
                            title="Report or block"
                            subtitle="Reports go to the administrators. A block hides this store from you."
                        >
                            {showReport ? (
                                <form onSubmit={submitReport} className="space-y-3 p-4">
                                    <MarketField
                                        label="Reason for reporting"
                                        hint="Explain what happened (5-2000 characters)."
                                    >
                                        <textarea
                                            className={`${marketInputClass} min-h-[80px] resize-y`}
                                            value={reportReason}
                                            maxLength={2000}
                                            required
                                            onChange={(event) => setReportReason(event.target.value)}
                                        />
                                    </MarketField>

                                    <div className="flex flex-wrap gap-2">
                                        <MarketButton type="submit" disabled={submittingReport}>
                                            {submittingReport ? "Sending..." : "Send report"}
                                        </MarketButton>
                                        <MarketButton
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setShowReport(false)}
                                        >
                                            Cancel
                                        </MarketButton>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex flex-wrap gap-2 p-4">
                                    <MarketButton
                                        variant="secondary"
                                        onClick={() => setShowReport(true)}
                                    >
                                        <Flag size={13} />
                                        Report store
                                    </MarketButton>
                                    <MarketButton
                                        variant="secondary"
                                        onClick={blockStore}
                                        disabled={blocking}
                                    >
                                        <ShieldOff size={13} />
                                        {blocking ? "Blocking..." : "Block store"}
                                    </MarketButton>
                                </div>
                            )}
                        </MarketPanel>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

/** One label/value line in the sidebar. */
function Row({ icon, label, value }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">
                {icon}
                {label}
            </span>
            <span className="text-right text-[11px] font-semibold text-slate-700">{value}</span>
        </div>
    );
}
