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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Kpi
                label="Total circulation"
                value={Number(summary.totalCirculation).toLocaleString("en-PH")}
                hint={`${summary.totalReturns} returned in this period`}
            />
            <Kpi
                label="On-time return rate"
                value={rate == null ? "—" : `${rate}%`}
                hint={rate == null ? "No returns in this period" : "Returned on or before the due date"}
            />
        </div>
    );
}