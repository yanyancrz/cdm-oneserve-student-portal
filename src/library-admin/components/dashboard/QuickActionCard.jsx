import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function QuickActionCard({ label, description, to, icon: Icon }) {
    return (
        <Link
            to={to}
            className="group flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm transition hover:border-[#106A2E]/30 hover:shadow-md"
        >
            {Icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E1F0E4] text-[#106A2E]">
                    <Icon size={18} />
                </div>
            )}

            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1F1F1F]">{label}</p>
                {description && <p className="truncate text-xs text-gray-500">{description}</p>}
            </div>

            <ArrowRight
                size={16}
                className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#106A2E]"
            />
        </Link>
    );
}