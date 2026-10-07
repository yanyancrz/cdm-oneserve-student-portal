// Small metric card used across the Guidance Head dashboard and reports.
export default function KpiCard({ icon: Icon, label, value, sub, tone = "green", loading = false }) {
    const tones = {
        green: "bg-[#E1F0E4] text-[#106A2E]",
        amber: "bg-[#FBF1CC] text-[#8A6D00]",
        red: "bg-red-50 text-red-600",
        gray: "bg-gray-100 text-gray-600",
        blue: "bg-[#E4EEFB] text-[#1D4ED8]",
    };

    if (loading) {
        return (
            <div className="animate-pulse rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-gray-100" />
                <div className="mt-4 h-3 w-24 rounded bg-gray-100" />
                <div className="mt-3 h-7 w-16 rounded bg-gray-100" />
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    tones[tone] || tones.green
                }`}
            >
                {Icon && <Icon size={18} aria-hidden="true" />}
            </div>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">
                {label}
            </p>

            <p className="mt-1 text-2xl font-semibold text-[#1F1F1F]">{value}</p>

            {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
    );
}
