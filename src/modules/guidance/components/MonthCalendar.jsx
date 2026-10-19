import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const pad = (n) => String(n).padStart(2, "0");
const toISO = (y, m, day) => `${y}-${pad(m + 1)}-${pad(day)}`;

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Reusable month calendar.
 *
 * @param {string} props.value       selected "YYYY-MM-DD" ("" = none)
 * @param {Function} props.onSelect  (dateISO) => void
 * @param {string} [props.minDate]   days before this are disabled
 * @param {string} [props.maxDate]   days after this are disabled
 * @param {Function} [props.dayInfo] (dateISO) => {
 *     disabled?: boolean, disabledReason?: string,
 *     dots?: number,        // appointment count dots (capped at 3 visually)
 *     holiday?: string,     // holiday name - red-tinted cell
 *     leave?: string,       // counselor on leave - amber-tinted cell (label/reason)
 *     weekend?: boolean,
 *   }
 * @param {string} [props.initialMonth] "YYYY-MM" to open on (defaults to value/today)
 * @param {Function} [props.onMonthChange] (year, monthIndex) => void - fired on
 *   mount and every month shift, so parents can prefetch per-day data.
 */
export default function MonthCalendar({ value, onSelect, minDate, maxDate, dayInfo, initialMonth, onMonthChange }) {
    const start = initialMonth || (value ? value.slice(0, 7) : null);

    const now = new Date();
    const [viewYear, setViewYear] = useState(
        start ? Number(start.split("-")[0]) : now.getFullYear()
    );
    const [viewMonth, setViewMonth] = useState(
        start ? Number(start.split("-")[1]) - 1 : now.getMonth()
    );

    const cells = useMemo(() => {
        const lead = new Date(viewYear, viewMonth, 1).getDay();
        const days = new Date(viewYear, viewMonth + 1, 0).getDate();
        const list = [];

        for (let i = 0; i < lead; i++) list.push(null);
        for (let d = 1; d <= days; d++) list.push(toISO(viewYear, viewMonth, d));

        return list;
    }, [viewYear, viewMonth]);

    const shift = (delta) => {
        const next = new Date(viewYear, viewMonth + delta, 1);
        setViewYear(next.getFullYear());
        setViewMonth(next.getMonth());
        onMonthChange?.(next.getFullYear(), next.getMonth());
    };

    const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-PH", {
        month: "long",
        year: "numeric",
    });

    // Tell the parent which month is showing so it can prefetch
    // per-day data (e.g. slot availability). Runs on mount + shift.
    const announced = useRef("");
    useEffect(() => {
        const key = `${viewYear}-${viewMonth}`;
        if (announced.current === key) return;
        announced.current = key;
        onMonthChange?.(viewYear, viewMonth);
    }, [viewYear, viewMonth, onMonthChange]);

    return (
        <div className="rounded-2xl border border-black/[0.05] bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => shift(-1)}
                    aria-label="Previous month"
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
                >
                    <ChevronLeft size={16} aria-hidden="true" />
                </button>

                <p className="text-sm font-bold text-slate-700">{monthLabel}</p>

                <button
                    type="button"
                    onClick={() => shift(1)}
                    aria-label="Next month"
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
                >
                    <ChevronRight size={16} aria-hidden="true" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {WEEKDAYS.map((d) => (
                    <span key={d} className="py-1">{d}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {cells.map((iso, i) => {
                    if (!iso) return <span key={`blank-${i}`} />;

                    const info = dayInfo?.(iso) || {};
                    const outOfRange =
                        (minDate && iso < minDate) || (maxDate && iso > maxDate);
                    const disabled = outOfRange || info.disabled;
                    const selected = value === iso;
                    const dayNum = Number(iso.split("-")[2]);

                    return (
                        <button
                            key={iso}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelect?.(iso)}
                            title={info.holiday || info.leave || info.disabledReason || iso}
                            aria-label={`${iso}${info.holiday ? `, ${info.holiday}` : ""}${info.leave ? `, on leave: ${info.leave}` : ""}${selected ? ", selected" : ""}`}
                            aria-pressed={selected}
                            className={`relative flex min-h-[44px] flex-col items-center justify-center rounded-xl py-1 text-xs font-semibold transition active:scale-95 ${
                                selected
                                    ? "bg-[#106A2E] text-white shadow-sm"
                                    : info.holiday
                                      ? `bg-red-50 text-red-700 ring-1 ring-red-200 ${disabled ? "cursor-not-allowed" : "hover:bg-red-100"}`
                                      : info.leave
                                        ? `bg-amber-50 text-amber-700 ring-1 ring-amber-200 ${disabled ? "cursor-not-allowed" : "hover:bg-amber-100"}`
                                        : disabled
                                          ? "cursor-not-allowed text-slate-300"
                                          : "bg-slate-50 text-slate-700 hover:ring-2 hover:ring-[#106A2E]/30"
                            }`}
                        >
                            <span>{dayNum}</span>

                            {info.dots > 0 && (
                                <span className="mt-0.5 flex gap-0.5" aria-hidden="true">
                                    {Array.from({ length: Math.min(info.dots, 3) }).map((_, n) => (
                                        <span
                                            key={n}
                                            className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-[#106A2E]"}`}
                                        />
                                    ))}
                                </span>
                            )}

                            {info.holiday && !selected && (
                                <span className="max-w-full truncate px-0.5 text-[8px] font-bold leading-tight text-red-500">
                                    Holiday
                                </span>
                            )}

                            {info.leave && !info.holiday && !selected && (
                                <span className="max-w-full truncate px-0.5 text-[8px] font-bold leading-tight text-amber-600">
                                    Leave
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
