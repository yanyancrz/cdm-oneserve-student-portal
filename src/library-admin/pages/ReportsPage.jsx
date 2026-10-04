import { useCallback, useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import ReportFilters from "../components/reports/ReportFilters";
import ReportKpis from "../components/reports/ReportKpis";
import CirculationChart from "../components/reports/CirculationChart";
import InstituteChart from "../components/reports/InstituteChart";
import TopBooksTable from "../components/reports/TopBooksTable";
import ReportExport from "../components/reports/ReportExport";

import { daysAgo, toInputDate } from "../config/reportOptions";
import { reportService } from "../services/reportService";
import { formatDate } from "../utils/dateUtils";

const PRINT_CSS = `
@media print {
    aside, header, nav, .no-print { display: none !important; }
    main { padding: 0 !important; margin: 0 !important; }
    body { background: #fff !important; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    section { break-inside: avoid; box-shadow: none !important; }
}
`;

export default function ReportsPage() {
    const [range, setRange] = useState(() => ({
        from: daysAgo(30),
        to: toInputDate(new Date()),
        granularity: "daily",
    }));

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const params = useMemo(
        () => ({ from: range.from, to: range.to, granularity: range.granularity }),
        [range]
    );

    useEffect(() => {
        const controller = new AbortController();
        const options = { signal: controller.signal };

        setLoading(true);
        setError(null);

        Promise.all([
            reportService.summary(params, options),
            reportService.circulation(params, options),
            reportService.institutes(params, options),
            reportService.topBooks(params, options),
        ])
            .then(([summary, circulation, institutes, topBooks]) =>
                setData({ summary, circulation, institutes, topBooks })
            )
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load the reports.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [params, reloadKey]);

    const change = useCallback((patch) => setRange((prev) => ({ ...prev, ...patch })), []);

    const firstLoad = loading && !data;

    return (
        <>
            <style>{PRINT_CSS}</style>

            <div className="no-print">
                <LibraryPageHeader title="Analytics & Reports" description="Circulation trends, usage, and exports." />
            </div>

            {/* Print-only header */}
            <div className="mb-6 hidden border-b border-gray-300 pb-4 print:block">
                <p className="text-lg font-bold text-gray-900">Colegio de Montalban</p>
                <p className="text-sm text-gray-700">Integrated Library Management System</p>
                <p className="mt-2 text-base font-semibold text-gray-900">Library Analytics &amp; Circulation Report</p>
                <p className="text-xs text-gray-600">
                    Period: {formatDate(range.from)} to {formatDate(range.to)} &middot; Generated: {formatDate(new Date())}
                </p>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <ReportFilters
                        from={range.from}
                        to={range.to}
                        granularity={range.granularity}
                        onChange={change}
                    />

                    <div className="no-print flex justify-end">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            disabled={!data}
                            className="inline-flex items-center gap-2 rounded-lg border border-black/[0.1] bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                            <Printer size={16} /> Print report
                        </button>
                    </div>
                </div>

                {firstLoad ? (
                    <div className="space-y-4" aria-busy="true" aria-label="Loading reports">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[0, 1, 2, 3].map((n) => (
                                <div key={n} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
                            ))}
                        </div>
                        <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
                    </div>
                ) : error && !data ? (
                    <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
                        <p className="text-sm font-medium text-gray-700">Unable to load the reports.</p>
                        <p className="mt-1 text-xs text-gray-400">{error}</p>
                        <button
                            type="button"
                            onClick={() => setReloadKey((n) => n + 1)}
                            className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <div className={`space-y-6 ${loading ? "opacity-60 transition-opacity" : "transition-opacity"}`}>
                        {error && (
                            <p className="no-print rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                                Could not refresh: {error}
                            </p>
                        )}

                        <ReportKpis summary={data.summary} />

                        <CirculationChart report={data.circulation} />

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <InstituteChart items={data.institutes} />
                            <TopBooksTable books={data.topBooks} />
                        </div>

                        <ReportExport params={params} />
                    </div>
                )}
            </div>
        </>
    );
}