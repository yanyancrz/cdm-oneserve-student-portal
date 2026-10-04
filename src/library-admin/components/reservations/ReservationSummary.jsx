import { Ban, BookOpen, CalendarClock, Clock, PackageCheck } from "lucide-react";

const CARDS = [
    { key: "active", label: "Active", icon: BookOpen, tint: "bg-[#E1F0E4] text-[#106A2E]" },
    { key: "awaitingAction", label: "Awaiting action", icon: Clock, tint: "bg-amber-50 text-amber-700" },
    { key: "readyForPickup", label: "Ready for pickup", icon: PackageCheck, tint: "bg-sky-50 text-sky-700" },
    { key: "expiringToday", label: "Expiring today", icon: CalendarClock, tint: "bg-orange-50 text-orange-700" },
    { key: "expired", label: "Expired", icon: Ban, tint: "bg-gray-100 text-gray-500" },
];

export default function ReservationSummary({ summary }) {
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {CARDS.map(({ key, label, icon: Icon, tint }) => (
                <div
                    key={key}
                    className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"
                >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                        <Icon size={18} />
                    </div>

                    <div className="min-w-0">
                        <p className="text-xl font-semibold tabular-nums text-[#1F1F1F]">
                            {summary ? summary[key] ?? 0 : "—"}
                        </p>
                        <p className="truncate text-xs text-gray-500">{label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}