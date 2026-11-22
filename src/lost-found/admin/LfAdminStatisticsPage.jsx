import { useRecordTable } from "../components/useRecordTable.js";
import { useState } from "react";
import { createPortal } from "react-dom";
import { formatDateTime, formatItemId } from "../config/lfTheme";
import { MissingDuration, RecordPagination } from "../components/LfRecords";
import { reportCategories } from "../components/recordTable.js";
import { LfButton, LfNotice } from "../components/lfUi";
import { lfAdminApi } from "../services/lfApi";
import "./lfStatistics.css";

function Report({ result, visibleRows = result.rows }) {
    const { category, from, to, generatedAt, rows } = result;
    const counts = Object.entries(reportCategories).map(([label, matches]) => [
        label === "Lost" || label === "Found" ? `${label} reports` : `${label} report records`,
        rows.filter(matches).length,
    ]);

    const returnedItems = new Set(rows.filter(reportCategories.Returned)
        .map((row) => row.missingItemId || row.reportId)).size;

    return (
        <article className="lf-statistics rounded-2xl border bg-white p-5">
            <h1 className="text-xl font-bold">OSAS F.I.N.D. Lost and Found Statistics</h1>
            <dl className="mt-3 grid gap-1 text-sm">
                <div><dt>Category</dt><dd>{category}</dd></div>
                <div><dt>Submission period</dt><dd>{from} to {to} (Philippine time)</dd></div>
                <div><dt>Generated</dt><dd>{formatDateTime(generatedAt)}</dd></div>
            </dl>
            <dl className="my-5 flex flex-wrap gap-4 text-sm">
                {[["Total reports", rows.length], ["Returned items", returnedItems], ...counts].map(([label, count]) => (
                    <div key={label}><dt>{label}</dt><dd>{count}</dd></div>
                ))}
            </dl>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr>
                            {["Item ID", "Item", "Type", "Submitted", "Status", "Duration"].map((label) =>
                                <th key={label} scope="col">{label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.map((row) => (
                            <tr key={row.reportId}>
                                <td>{formatItemId(row.reportId)}</td>
                                <td>{row.itemName}</td>
                                <td>{row.reportType}</td>
                                <td>{formatDateTime(row.createdAt)}</td>
                                <td>{row.lifecycleStatus || row.status}</td>
                                <td><MissingDuration item={row} /></td>
                            </tr>
                        ))}
                        {rows.length === 0 && <tr><td colSpan={6}>No reports in the selected period.</td></tr>}
                    </tbody>
                </table>
            </div>
        </article>
    );
}

export default function LfAdminStatisticsPage() {
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const table = useRecordTable(result?.rows ?? [], []);

    async function generate(event) {
        event.preventDefault();
        const filters = Object.fromEntries(new FormData(event.currentTarget));
        if (filters.from > filters.to) {
            setError("From Date must be on or before To Date.");
            return;
        }
        setError("");
        setResult(null);
        table.reset();
        setBusy(true);
        try {
            const response = await lfAdminApi.reports(filters);
            setResult({ ...filters, generatedAt: new Date(), rows: response.data ?? [] });
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Printable Statistics</h2>
            <form onSubmit={generate} className="flex flex-wrap items-end gap-3 text-xs">
                <label>
                    <span className="block font-semibold">Category</span>
                    <select className="rounded-lg border p-2" name="category" defaultValue="All">
                        {["All", ...Object.keys(reportCategories)].map((label) => <option key={label}>{label}</option>)}
                    </select>
                </label>
                <label>
                    <span className="block font-semibold">From Date</span>
                    <input className="rounded-lg border p-2" type="date" name="from" required />
                </label>
                <label>
                    <span className="block font-semibold">To Date</span>
                    <input className="rounded-lg border p-2" type="date" name="to" required />
                </label>
                <LfButton type="submit" loading={busy}>Generate report</LfButton>
                <LfButton type="button" variant="secondary" disabled={!result}
                    onClick={() => window.print()}>Print</LfButton>
            </form>
            {error && <LfNotice tone="bad">{error}</LfNotice>}
            {result && <>
                <Report result={result} visibleRows={table.rows} />
                <RecordPagination {...table.pagination} />
            </>}
            {result && createPortal(
                <div className="lf-statistics-print"><Report result={result} /></div>, document.body)}
        </section>
    );
}
