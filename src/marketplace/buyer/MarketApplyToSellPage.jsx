import { useCallback, useEffect, useState } from "react";
// (useNavigate removed)
import { Store as StoreIcon } from "lucide-react";
import toast from "react-hot-toast";

import { sellerApi } from "../services/marketApi";
import {
    APPLICATION_STATUS,
    applicationStatusLabel,
} from "../config/marketVocabulary";
import { formatDateTime } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketField,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";

/**
 * Apply to become a seller.
 *
 * A verified Student or Faculty account expresses the intent to sell. The
 * Marketplace Head reviews and, on approval, creates the storefront and assigns
 * them as owner - so who sells where stays a governance decision rather than a
 * self-serve one.
 *
 * Approval does not itself create a store, because a storefront needs a name,
 * a kind, a workspace and an owner - none of which the applicant decides.
 */
export default function MarketApplyToSellPage() {

    const [businessName, setBusinessName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [mine, setMine] = useState([]);
    const [loadingMine, setLoadingMine] = useState(true);

    const loadMine = useCallback(async () => {
        try {
            setLoadingMine(true);
            const response = await sellerApi.mine();
            setMine(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingMine(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoadingMine(true);
                const response = await sellerApi.mine();
                if (!cancelled) setMine(response.data || []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoadingMine(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const hasPending = mine.some((a) => a.status === APPLICATION_STATUS.PENDING);

    const submit = async (event) => {
        event.preventDefault();

        if (businessName.trim().length < 2) {
            toast.error("Enter a business name (2-100 characters).");
            return;
        }

        setSubmitting(true);

        try {
            const response = await sellerApi.apply({
                businessName: businessName.trim(),
                description: description.trim() || null,
            });

            toast.success(response.message || "Application sent.");
            setBusinessName("");
            setDescription("");
            await loadMine();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <MarketPanel
                title="Sell on campus"
                subtitle="Apply to run a storefront. The Marketplace Head reviews and, on approval, sets the store up for you."
            >
                {hasPending ? (
                    <div className="p-4">
                        <MarketNotice tone="info" title="Application already pending">
                            You already have a seller application waiting for review. You can file
                            another one once this one is decided.
                        </MarketNotice>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-3 p-4">
                        <MarketField
                            label="Business name"
                            hint="The name buyers will see on the storefront."
                        >
                            <input
                                className={marketInputClass}
                                value={businessName}
                                maxLength={100}
                                placeholder="e.g. Aling Nena's Carinderia"
                                onChange={(event) => setBusinessName(event.target.value)}
                            />
                        </MarketField>

                        <MarketField
                            label="What you sell"
                            hint="Anything that helps the Head decide. 10-3000 characters."
                        >
                            <textarea
                                className={`${marketInputClass} min-h-[100px] resize-y`}
                                value={description}
                                maxLength={3000}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </MarketField>

                        {error ? (
                            <MarketNotice tone="error" title="Could not load your applications">
                                {error}
                            </MarketNotice>
                        ) : null}

                        <MarketButton type="submit" disabled={submitting}>
                            {submitting ? "Sending..." : "Apply to sell"}
                        </MarketButton>
                    </form>
                )}
            </MarketPanel>

            <MarketPanel title="Your applications" subtitle="Everything you have filed.">
                {loadingMine ? (
                    <MarketSkeleton rows={3} />
                ) : mine.length === 0 ? (
                    <MarketEmpty
                        icon={<StoreIcon size={20} />}
                        title="No applications yet"
                        hint="File one above if you would like to run a storefront."
                    />
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {mine.map((application) => (
                            <li key={application.applicationId} className="flex items-start justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-700">
                                        {application.businessName}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                        Filed {formatDateTime(application.createdAt)}
                                        {application.reviewedAt
                                            ? ` · Reviewed ${formatDateTime(application.reviewedAt)}`
                                            : ""}
                                    </p>
                                    {application.reviewNote ? (
                                        <p className="mt-1.5 rounded-lg bg-slate-50 p-2 text-[10px] leading-4 text-slate-600">
                                            <span className="font-semibold">Note: </span>
                                            {application.reviewNote}
                                        </p>
                                    ) : null}
                                </div>

                                <span
                                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
                                        application.status === APPLICATION_STATUS.APPROVED
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : application.status === APPLICATION_STATUS.REJECTED
                                              ? "bg-rose-50 text-rose-700 border-rose-200"
                                              : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                >
                                    {applicationStatusLabel(application.status)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </MarketPanel>
        </div>
    );
}
