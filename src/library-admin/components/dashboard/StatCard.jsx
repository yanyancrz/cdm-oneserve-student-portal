import { Skeleton } from "../common/Skeleton";

const TONES = {
    green: "bg-[#E1F0E4] text-[#106A2E]",
    teal: "bg-[#DDF1EA] text-[#0D7856]",
    amber: "bg-[#FBF1CC] text-[#8A6D00]",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-100 text-gray-600",
};

export default function StatCard({ label, value, icon: Icon, tone = "green", loading = false }) {
    return (
        <div
            className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm"
            aria-busy={loading || undefined}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500">{label}</p>

                    {loading ? (
                        // Same height as the number (text-2xl = h-8 + mt-1), so nothing jumps.
                        <div className="mt-1 flex h-8 items-center">
                            <Skeleton className="h-6 w-16" />
                        </div>
                    ) : (
                        <p className="mt-1 text-2xl font-semibold text-[#1F1F1F]">
                            {Number(value ?? 0).toLocaleString("en-PH")}
                        </p>
                    )}
                </div>

                {Icon && (
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            TONES[tone] || TONES.green
                        }`}
                    >
                        <Icon size={18} />
                    </div>
                )}
            </div>
        </div>
    );
}