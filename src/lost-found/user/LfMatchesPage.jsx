import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitCompare } from "lucide-react";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import { formatDate } from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfEmpty,
    LfImage,
    LfNotice,
    LfSkeleton,
} from "../components/lfUi";

// =====================================================
// Possible matches between the caller's reports and
// the rest of the board, strongest first.
//
// A match is a lead, not a verdict: it stays
// unconfirmed until one of its owners verifies it.
// =====================================================

export default function LfMatchesPage() {
    const navigate = useNavigate();

    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const response = await lfApi.myMatches();
                if (cancelled) return;
                setMatches(response.data || []);
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
    }, []);

    if (loading) return <LfSkeleton rows={3} />;

    if (error) return <LfNotice tone="bad">{error}</LfNotice>;

    return (
        <div className="space-y-4">
            {matches.length === 0 ? (
                <LfEmpty
                    icon={GitCompare}
                    title="No matches yet"
                    message="When a lost report and a found report look like the same item, the match appears here."
                />
            ) : (
                <ul className="space-y-3">
                    {matches.map((match) => (
                        <MatchCard
                            key={match.matchRecordId}
                            match={match}
                            onOpen={() =>
                                navigate(
                                    `${LOST_FOUND_HOME_ROUTE}/report/${match.foundReportId}`
                                )
                            }
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

function MatchCard({ match, onOpen }) {
    const image = lfImageUrl(match.imagePath);
    const strength =
        match.matchPercentage >= 75
            ? "Very strong"
            : match.matchPercentage >= 40
              ? "Possible"
              : "Weak";

    return (
        <li>
            <button
                type="button"
                onClick={onOpen}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
            >
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <GitCompare size={14} className="text-[#106A2E]" aria-hidden="true" />
                        Possible match
                    </span>
                    <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                        style={{
                            backgroundColor:
                                match.matchPercentage >= 75
                                    ? "#0D7856"
                                    : match.matchPercentage >= 40
                                      ? "#F4D35E"
                                      : "#F1F1F1",
                            color:
                                match.matchPercentage >= 40 ? "#1F1F1F" : "#64748B",
                        }}
                    >
                        {match.matchPercentage}% · {strength}
                    </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                    <MatchSide
                        label="Lost"
                        name={match.lostItemName}
                        location={match.location}
                    />
                    <MatchSide
                        label="Found"
                        name={match.foundItemName}
                        image={image}
                    />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[11px] text-slate-400">
                        {formatDate(match.createdAt)}
                    </span>
                    {match.isConfirmed ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                            CONFIRMED
                        </span>
                    ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                            UNCONFIRMED
                        </span>
                    )}
                </div>
            </button>
        </li>
    );
}

function MatchSide({ label, name, location, image }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </span>
            <div className="mt-1.5 flex items-center gap-2">
                {image && (
                    <LfImage src={image} alt={name} className="h-9 w-9 rounded-lg" />
                )}
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-700">
                        {name || "—"}
                    </p>
                    {location && (
                        <p className="truncate text-[10px] text-slate-500">{location}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
