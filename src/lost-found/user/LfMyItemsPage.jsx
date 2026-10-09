import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import { formatDate } from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfButton,
    LfEmpty,
    LfImage,
    LfNotice,
    LfSkeleton,
    LfStatusChip,
    LfTypeTag,
} from "../components/lfUi";

// =====================================================
// The caller's own reports - including the ones
// still pending review, which never appear on the
// public board.
// =====================================================

export default function LfMyItemsPage() {
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const response = await lfApi.myReports();
                if (cancelled) return;
                setReports(response.data || []);
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                    {reports.length} {reports.length === 1 ? "report" : "reports"}
                </p>
                <LfButton
                    onClick={() => navigate(`${LOST_FOUND_HOME_ROUTE}/report/new`)}
                >
                    <Plus size={14} aria-hidden="true" />
                    New report
                </LfButton>
            </div>

            {loading ? (
                <LfSkeleton rows={3} />
            ) : error ? (
                <LfNotice tone="bad">{error}</LfNotice>
            ) : reports.length === 0 ? (
                <LfEmpty
                    icon={ClipboardList}
                    title="No reports yet"
                    message="Report a lost or found item so the campus can see it."
                    action={
                        <LfButton
                            onClick={() => navigate(`${LOST_FOUND_HOME_ROUTE}/report/new`)}
                        >
                            <Plus size={14} aria-hidden="true" />
                            Report an item
                        </LfButton>
                    }
                />
            ) : (
                <ul className="space-y-3">
                    {reports.map((report) => {
                        const image = lfImageUrl(report.imagePath);

                        return (
                            <li key={report.reportId}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `${LOST_FOUND_HOME_ROUTE}/report/${report.reportId}`
                                        )
                                    }
                                    className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md"
                                >
                                    <LfImage
                                        src={image}
                                        alt={report.itemName}
                                        className="h-14 w-14 shrink-0 rounded-xl"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex flex-wrap items-center gap-2">
                                            <span className="truncate text-sm font-semibold text-slate-800">
                                                {report.itemName}
                                            </span>
                                            <LfTypeTag type={report.reportType} />
                                        </span>
                                        <span className="mt-1 block truncate text-xs text-slate-500">
                                            {report.category || "Uncategorized"}
                                            {report.location ? ` · ${report.location}` : ""}
                                        </span>
                                        <span className="mt-1 block text-[11px] text-slate-400">
                                            {report.reportType === "Found" ? "Found" : "Lost"} on{" "}
                                            {formatDate(report.dateLostFound)}
                                        </span>
                                    </span>
                                    <span className="shrink-0">
                                        <LfStatusChip status={report.status} />
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
