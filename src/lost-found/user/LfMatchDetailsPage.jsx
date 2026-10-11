import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GitCompare } from "lucide-react";
import toast from "react-hot-toast";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import { formatDate, formatDateTime, formatItemId } from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfButton,
    LfEmpty,
    LfImage,
    LfNotice,
    LfPanel,
    LfSkeleton,
    LfStatusChip,
    LfTypeTag,
} from "../components/lfUi";

// =====================================================
// One match in full: BOTH items side by side with their
// photos and every field, the score breakdown, and the
// confirm action. Opened by tapping a match anywhere.
// =====================================================

export default function LfMatchDetailsPage() {
    const { matchId } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [confirming, setConfirming] = useState(false);

    const load = useCallback(async () => {
        try {
            setError("");
            const response = await lfApi.match(matchId);
            setMatch(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [matchId]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!cancelled) await load();
        })();

        return () => {
            cancelled = true;
        };
    }, [load]);

    const onConfirm = async () => {
        if (!window.confirm("Confirm this is the same item?")) return;

        setConfirming(true);
        try {
            const response = await lfApi.confirmMatch(matchId);
            toast.success(response.message || "Match confirmed.");
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setConfirming(false);
        }
    };

    if (loading) return <LfSkeleton rows={4} />;
    if (error) return <LfNotice tone="bad">{error}</LfNotice>;
    if (!match) {
        return (
            <LfEmpty
                icon={GitCompare}
                title="Match not found"
                message="It may have been withdrawn."
                action={
                    <LfButton onClick={() => navigate(`${LOST_FOUND_HOME_ROUTE}/matches`)}>
                        Back to matches
                    </LfButton>
                }
            />
        );
    }

    const strong = match.matchPercentage >= 75;
    const lost = match.lostReport || {
        reportId: match.lostReportId,
        itemName: match.lostItemName,
        location: match.location,
    };
    const found = match.foundReport || {
        reportId: match.foundReportId,
        itemName: match.foundItemName,
        imagePath: match.imagePath,
        location: match.location,
    };

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#106A2E]"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                Back
            </button>

            {/* ---------- strength ---------- */}
            <LfPanel>
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <GitCompare size={15} className="text-[#106A2E]" aria-hidden="true" />
                        Possible match
                    </span>
                    <span
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{
                            backgroundColor: strong
                                ? "#0D7856"
                                : match.matchPercentage >= 40
                                  ? "#F4D35E"
                                  : "#F1F1F1",
                            color: match.matchPercentage >= 40 ? "#1F1F1F" : "#64748B",
                        }}
                    >
                        {match.matchPercentage}% ·{" "}
                        {strong ? "Very strong" : match.matchPercentage >= 40 ? "Possible" : "Weak"}
                    </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-center text-[11px] text-slate-500 sm:grid-cols-4">
                    <span>Name <strong className="text-slate-800">{match.nameScore ?? 0}</strong></span>
                    <span>Category <strong className="text-slate-800">{match.categoryScore ?? 0}</strong></span>
                    <span>Location <strong className="text-slate-800">{match.locationScore ?? 0}</strong></span>
                    <span>Date <strong className="text-slate-800">{match.dateScore ?? 0}</strong></span>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">25 points per dimension.</p>
            </LfPanel>

            {/* ---------- BOTH items ---------- */}
            <div className="grid gap-4 md:grid-cols-2">
                <MatchItemCard
                    label="Lost item"
                    report={lost}
                    onOpen={() => navigate(`${LOST_FOUND_HOME_ROUTE}/report/${lost.reportId}`)}
                />
                <MatchItemCard
                    label="Found item"
                    report={found}
                    onOpen={() => navigate(`${LOST_FOUND_HOME_ROUTE}/report/${found.reportId}`)}
                />
            </div>

            {/* ---------- verdict ---------- */}
            <LfPanel>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs text-slate-500">
                            Spotted {formatDateTime(match.createdAt)}
                        </p>
                        {match.isConfirmed ? (
                            <p className="mt-1 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                CONFIRMED
                            </p>
                        ) : (
                            <p className="mt-1 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                                UNCONFIRMED
                            </p>
                        )}
                    </div>

                    {!match.isConfirmed && (
                        <LfButton onClick={onConfirm} loading={confirming}>
                            <GitCompare size={14} aria-hidden="true" />
                            Confirm match
                        </LfButton>
                    )}
                </div>
            </LfPanel>
        </div>
    );
}

function MatchItemCard({ label, report, onOpen }) {
    const image = lfImageUrl(report.imagePath);
    const itemId = formatItemId(report.reportId);

    return (
        <LfPanel>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <button type="button" onClick={onOpen} className="mt-2 block w-full text-left">
                <span className="relative block overflow-hidden rounded-2xl bg-slate-100">
                    <LfImage
                        src={image}
                        alt={report.itemName}
                        className="aspect-[4/3] w-full rounded-none object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded-lg bg-[#10231B] px-2.5 py-1 text-sm font-black tracking-wider text-white shadow-lg ring-2 ring-[#F4D35E]">
                        {itemId}
                    </span>
                </span>

                <span className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="truncate text-base font-bold text-slate-800">
                        {report.itemName || "—"}
                    </span>
                    {report.reportType && <LfTypeTag type={report.reportType} />}
                    {report.status && <LfStatusChip status={report.status} />}
                </span>
            </button>

            <dl className="mt-3 space-y-2 text-xs">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Description
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-wrap leading-5 text-slate-700">
                        {report.description || "No description."}
                    </dd>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-slate-500">
                    <span>{report.category || "Uncategorized"}</span>
                    {report.location && <span>{report.location}</span>}
                    {report.dateLostFound && <span>{formatDate(report.dateLostFound)}</span>}
                </div>
            </dl>
        </LfPanel>
    );
}
