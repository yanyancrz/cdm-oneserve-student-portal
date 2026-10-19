import { BarChart3 } from "lucide-react";

// =========================================================
// REPORT WIDGETS
//
// Small, dependency-free building blocks for the counselor Reports screen:
// stat cards, progress bars, horizontal bars, grouped columns, stacked
// distributions and a segmented tab control. No chart library - the whole
// app draws its charts with plain CSS, so these follow the same rule and stay
// crisp on a phone.
// =========================================================

// Icon chip + bar colour per tone. Kept as an object so a metric can name a
// tone ("green", "amber", ...) instead of hard-coding colours at the call site.
const REPORT_TONES = {
    green: { chip: "bg-emerald-50 text-[#106A2E]", bar: "#106A2E" },
    sky: { chip: "bg-sky-50 text-sky-700", bar: "#0ea5e9" },
    amber: { chip: "bg-amber-50 text-amber-700", bar: "#f59e0b" },
    violet: { chip: "bg-violet-50 text-violet-700", bar: "#7c3aed" },
    rose: { chip: "bg-rose-50 text-rose-700", bar: "#e11d48" },
    slate: { chip: "bg-slate-100 text-slate-600", bar: "#64748b" },
};

/** White rounded card with an optional titled header. */
export function SectionCard({
    title,
    subtitle,
    icon: Icon,
    right,
    children,
    className = "",
    bodyClassName = "p-4",
}) {
    return (
        <section className={`overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-sm ${className}`}>
            {(title || right) && (
                <header className="flex items-start justify-between gap-3 border-b border-black/[0.05] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        {Icon && (
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#106A2E]">
                                <Icon size={16} aria-hidden="true" />
                            </span>
                        )}

                        <div className="min-w-0">
                            {title && <h2 className="truncate text-sm font-bold text-slate-800">{title}</h2>}
                            {subtitle && <p className="truncate text-[11px] text-slate-400">{subtitle}</p>}
                        </div>
                    </div>

                    {right}
                </header>
            )}

            <div className={bodyClassName}>{children}</div>
        </section>
    );
}

/** A single KPI: coloured icon chip, big number, label and supporting line. */
export function StatCard({ icon: Icon, tone = "green", label, value, sub, hint }) {
    const t = REPORT_TONES[tone] || REPORT_TONES.green;

    return (
        <div className="rounded-2xl border border-black/[0.05] bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <span className={`grid h-8 w-8 place-items-center rounded-xl ${t.chip}`}>
                    {Icon && <Icon size={16} aria-hidden="true" />}
                </span>

                {hint && <span className="truncate text-[10px] font-semibold text-slate-400">{hint}</span>}
            </div>

            <p className="mt-2.5 text-2xl font-bold leading-none text-slate-800">{value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
            {sub && <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{sub}</p>}
        </div>
    );
}

/** Thin progress bar. `value` out of `max` (defaults to 100%). */
export function ProgressBar({ value = 0, max = 100, tone = "green", height = "h-2", label }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const t = REPORT_TONES[tone] || REPORT_TONES.green;

    return (
        <div
            className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}
            role="progressbar"
            aria-label={label}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
        >
            <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: t.bar }}
            />
        </div>
    );
}

/** Horizontal bar list. items: [{ label, value, color? }]. */
export function BarList({ items = [], empty = "No data for this period.", tone = "green", max }) {
    if (!items.length) {
        return <p className="py-6 text-center text-xs text-slate-400">{empty}</p>;
    }

    const top = max || Math.max(1, ...items.map((i) => i.value));

    return (
        <ul className="space-y-3">
            {items.map((item) => (
                <li key={item.label}>
                    <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-medium text-slate-600">{item.label}</span>
                        <span className="shrink-0 font-bold text-slate-700">{item.value}</span>
                    </div>

                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${Math.max(2, Math.round((item.value / top) * 100))}%`,
                                background: item.color || (REPORT_TONES[tone] || REPORT_TONES.green).bar,
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

/**
 * Grouped column chart (no library). `buckets` items look like
 * { label, fullLabel?, values: [n1, n2] } and line up with `series`
 * ([{ label, color }]). Values all-zero fall back to an empty state.
 */
export function GroupedColumns({
    buckets = [],
    series = [],
    height = 150,
    emptyLabel = "No activity in this period.",
}) {
    const hasData = buckets.some((b) => b.values.some((v) => v > 0));

    if (!buckets.length || !hasData) {
        return (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
                <BarChart3 size={22} className="text-slate-300" aria-hidden="true" />
                <p className="text-xs text-slate-400">{emptyLabel}</p>
            </div>
        );
    }

    const max = Math.max(1, ...buckets.flatMap((b) => b.values));

    return (
        <div>
            <div className="flex gap-1" style={{ height }}>
                {buckets.map((bucket, index) => (
                    <div key={`${bucket.label}-${index}`} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                        <div
                            className="flex h-full w-full items-end justify-center gap-1"
                            title={`${bucket.fullLabel || bucket.label}${
                                series.length
                                    ? ` — ${bucket.values
                                          .map((v, i) => `${series[i]?.label || "Value"}: ${v}`)
                                          .join(", ")}`
                                    : ""
                            }`}
                        >
                            {bucket.values.map((value, seriesIndex) => (
                                <div
                                    key={seriesIndex}
                                    className="w-full max-w-[16px] rounded-t-[3px] transition-all duration-500"
                                    style={{
                                        height: `${Math.max(value > 0 ? 6 : 3, Math.round((value / max) * 100))}%`,
                                        background: series[seriesIndex]?.color || REPORT_TONES.green.bar,
                                        opacity: value > 0 ? 1 : 0.2,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-2 flex gap-1 border-t border-black/[0.06] pt-2">
                {buckets.map((bucket, index) => (
                    <span
                        key={`${bucket.label}-label-${index}`}
                        className="min-w-0 flex-1 truncate text-center text-[9px] font-semibold text-slate-400"
                    >
                        {bucket.label}
                    </span>
                ))}
            </div>

            {series.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {series.map((s) => (
                        <span key={s.label} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                            {s.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

/** A single stacked bar plus a two-column legend. items: [{ label, value, color }]. */
export function DistributionBar({ items = [], emptyLabel = "No data for this period." }) {
    const total = items.reduce((sum, i) => sum + i.value, 0);

    if (!total) {
        return <p className="py-6 text-center text-xs text-slate-400">{emptyLabel}</p>;
    }

    return (
        <div className="space-y-3">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                {items.map((item) => (
                    <div
                        key={item.label}
                        title={`${item.label}: ${item.value}`}
                        style={{ width: `${(item.value / total) * 100}%`, background: item.color }}
                    />
                ))}
            </div>

            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {items.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex min-w-0 items-center gap-1.5">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                            <span className="truncate text-slate-600">{item.label}</span>
                        </span>
                        <span className="shrink-0 font-bold text-slate-700">{item.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** A compact inline metric used inside the summary banner. */
export function InlineStat({ label, value, tone = "green" }) {
    const t = REPORT_TONES[tone] || REPORT_TONES.green;

    return (
        <div className={`rounded-xl ${t.chip} px-3 py-2`}>
            <p className="text-lg font-bold leading-none">{value}</p>
            <p className="mt-1 text-[10px] font-medium opacity-80">{label}</p>
        </div>
    );
}

/** Pill segmented control for the Overview / Breakdown / Cases / Students tabs. */
export function SegmentedTabs({ tabs, value, onChange }) {
    return (
        <div
            role="tablist"
            aria-label="Report view"
            className="flex gap-1 rounded-2xl border border-black/[0.05] bg-white p-1 shadow-sm"
        >
            {tabs.map((tab) => {
                const on = value === tab;

                return (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onChange(tab)}
                        className={`flex-1 rounded-xl px-1.5 py-2 text-xs font-semibold transition active:scale-95 ${
                            on ? "bg-[#106A2E] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                        {tab}
                    </button>
                );
            })}
        </div>
    );
}
