import { formatPeso } from "../../utils/currencyUtils";

function Kpi({ label, value, hint, tone = "text-[#1F1F1F]" }) {
    return (
        <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
            {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
        </div>
    );
}

export default function ReportKpis({ summary }) {
    const rate = summary.onTimeReturnRate;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
                label="Total circulation"
                value={Number(summary.totalCirculation).toLocaleString("en-PH")}
                hint={`${summary.totalReturns} returned in this period`}
            />
            <Kpi
                label="Fines collected"
                value={formatPeso(summary.finesCollected)}
                hint="Paid fines, by return date"
                tone="text-[#106A2E]"
            />
            <Kpi
                label="Outstanding fines"
                value={formatPeso(summary.outstandingFines)}
                hint={`Unpaid or on account (all time). ${formatPeso(summary.accruingFines)} still building on ${summary.overdueLoans} overdue loan${summary.overdueLoans === 1 ? "" : "s"}.`}
                tone={summary.outstandingFines > 0 ? "text-red-600" : "text-[#1F1F1F]"}
            />
            <Kpi
                label="On-time return rate"
                value={rate == null ? "—" : `${rate}%`}
                hint={rate == null ? "No returns in this period" : "Returned on or before the due date"}
            />
        </div>
    );
}