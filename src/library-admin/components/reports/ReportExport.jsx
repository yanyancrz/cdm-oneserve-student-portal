import { useState } from "react";
import toast from "react-hot-toast";
import { Download } from "lucide-react";

import { EXPORT_DATASETS } from "../../config/reportOptions";
import { reportService } from "../../services/reportService";
import { downloadCsv } from "../../utils/csvExport";

export default function ReportExport({ params }) {
    const [dataset, setDataset] = useState(EXPORT_DATASETS[0].value);
    const [busy, setBusy] = useState(false);

    const selected = EXPORT_DATASETS.find((d) => d.value === dataset);

    const run = async () => {
        setBusy(true);

        try {
            const table = await reportService.exportTable(dataset, params);

            if (!table.rows?.length) {
                toast("Nothing to export for this report.");
                return;
            }

            downloadCsv(table.fileName, table.columns, table.rows);
            toast.success(`Exported ${table.rows.length} row${table.rows.length === 1 ? "" : "s"}.`);
        } catch (error) {
            toast.error(error?.message || "Unable to export the report.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="no-print flex flex-wrap items-center gap-2 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
            <p className="mr-2 text-sm font-semibold text-[#1F1F1F]">Export CSV</p>

            <select
                value={dataset}
                disabled={busy}
                onChange={(e) => setDataset(e.target.value)}
                aria-label="Report to export"
                className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#106A2E]"
            >
                {EXPORT_DATASETS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                ))}
            </select>

            <button
                type="button"
                onClick={run}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
                <Download size={16} /> {busy ? "Preparing..." : "Download"}
            </button>

            <p className="text-xs text-gray-400">
                {selected?.usesRange ? "Uses the dates above." : "Current snapshot. The dates above are not used."}
            </p>
        </div>
    );
}