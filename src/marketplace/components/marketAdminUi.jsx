import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

// =====================================================
// Admin-only UI primitives for the CampusMarket monitoring portal.
//
// Same visual language as the OneServe / Library admin dashboard:
// white cards, rounded-2xl, hairline black/5 borders, green #106A2E accent,
// soft green #E1F0E4 tint. The staff portal keeps using ./marketUi untouched.
// =====================================================

export const adminInputClass =
    "w-full rounded-xl border border-black/[0.08] bg-white px-3 text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15";

export const adminSelectClass =
    "rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-xs text-gray-600 outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15";

export function AdminPanel({ title, subtitle, action, children }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-sm">
            {(title || action) && (
                <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] px-5 py-3.5">
                    <div>
                        {title && (
                            <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
                        )}
                        {subtitle && (
                            <p className="mt-0.5 text-[11px] text-gray-400">{subtitle}</p>
                        )}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

const STAT_TONES = {
    default: "border-black/[0.05] bg-white text-gray-800",
    good: "border-[#106A2E]/15 bg-[#E1F0E4] text-[#106A2E]",
    warn: "border-amber-200/70 bg-amber-50 text-amber-700",
    bad: "border-red-200/70 bg-red-50 text-red-600",
};

export function AdminStat({ label, value, tone = "default" }) {
    return (
        <div className={`rounded-xl border px-3.5 py-3 ${STAT_TONES[tone] || STAT_TONES.default}`}>
            <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-gray-400">
                {label}
            </p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
    );
}

const NOTICE_TONES = {
    info: { box: "border-[#106A2E]/15 bg-[#E1F0E4]/60 text-[#0d5a27]", icon: Info },
    warn: { box: "border-amber-200/70 bg-amber-50 text-amber-800", icon: TriangleAlert },
    error: { box: "border-red-200/70 bg-red-50 text-red-700", icon: AlertCircle },
    success: { box: "border-[#106A2E]/15 bg-[#E1F0E4] text-[#0d5a27]", icon: CheckCircle2 },
};

export function AdminNotice({ tone = "info", icon, title, children }) {
    const config = NOTICE_TONES[tone] || NOTICE_TONES.info;
    const Icon = config.icon;

    return (
        <div
            role={tone === "error" ? "alert" : "status"}
            className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-xs leading-relaxed ${config.box}`}
        >
            <span className="mt-0.5 shrink-0">{icon || <Icon size={14} />}</span>
            <div>
                {title && <p className="mb-0.5 font-semibold">{title}</p>}
                <div>{children}</div>
            </div>
        </div>
    );
}

export function AdminEmpty({ icon, title, hint }) {
    return (
        <div className="flex flex-col items-center px-5 py-12 text-center">
            {icon && (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E1F0E4] text-[#106A2E]">
                    {icon}
                </div>
            )}
            <p className="mt-3 text-sm font-semibold text-gray-800">{title}</p>
            {hint && <p className="mt-1 max-w-sm text-xs text-gray-400">{hint}</p>}
        </div>
    );
}

export function AdminSkeleton({ rows = 5 }) {
    return (
        <div className="space-y-3 p-5" role="status" aria-label="Loading">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/5 animate-pulse rounded bg-gray-100" />
                        <div className="h-2.5 w-3/5 animate-pulse rounded bg-gray-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}