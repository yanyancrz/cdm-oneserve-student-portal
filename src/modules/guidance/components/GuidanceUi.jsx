import { Search, X } from "lucide-react";

import { initials } from "../utils/dateTime";

// =========================================================
// ONE LOOK FOR ALL OF GUIDANCE
//
// Student pages use the pink accent, counselor pages the green one.
// Pages never hard-code these colors: they ask for an accent here.
// =========================================================

export const ACCENTS = {
    pink: {
        gradient: "from-[#D9578F] to-[#B13C70]",
        solid: "bg-[#D9578F] hover:bg-[#c94d82]",
        soft: "bg-pink-50 text-[#B13C70]",
        avatar: "bg-gradient-to-br from-pink-100 to-pink-200 text-[#B13C70]",
        chipOn: "border-[#B13C70] bg-[#D9578F] text-white shadow-sm",
        tabOn: "text-[#B13C70]",
        tabPill: "bg-pink-50",
        field: "focus:border-[#D9578F] focus:ring-[#D9578F]/15",
        within: "focus-within:border-[#D9578F] focus-within:ring-[#D9578F]/15",
        link: "text-[#B13C70]",
        slotOn: "border-[#B13C70] bg-[#D9578F] text-white shadow-sm",
    },
    green: {
        gradient: "from-[#106A2E] to-[#0E3B22]",
        solid: "bg-[#106A2E] hover:bg-[#0d5a27]",
        soft: "bg-emerald-50 text-[#106A2E]",
        avatar: "bg-gradient-to-br from-emerald-100 to-emerald-200 text-[#106A2E]",
        chipOn: "border-[#0E3B22] bg-[#106A2E] text-white shadow-sm",
        tabOn: "text-[#106A2E]",
        tabPill: "bg-emerald-50",
        field: "focus:border-[#106A2E] focus:ring-[#106A2E]/15",
        within: "focus-within:border-[#106A2E] focus-within:ring-[#106A2E]/15",
        link: "text-[#106A2E]",
        slotOn: "border-[#0E3B22] bg-[#106A2E] text-white shadow-sm",
    },
};

// Same look for every input, select and textarea.
export const fieldClass = (accent = "pink") =>
    `mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${ACCENTS[accent].field}`;

// =========================================================
// SEARCH
// =========================================================

export function SearchBar({ value, onChange, placeholder, accent = "pink" }) {
    return (
        <div
            className={`flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:ring-4 ${ACCENTS[accent].within}`}
        >
            <Search size={16} aria-hidden="true" className="shrink-0 text-slate-400" />

            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
            />

            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    aria-label="Clear search"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

// =========================================================
// FILTER CHIPS (scroll sideways on a phone)
// counts (optional): { Pending: 2, Confirmed: 1 }
// =========================================================

export function FilterChips({ options, value, onChange, accent = "pink", counts }) {
    const a = ACCENTS[accent];

    return (
        <div
            role="group"
            aria-label="Filter"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            {options.map((option) => {
                const on = value === option;
                const count = counts?.[option];

                return (
                    <button
                        key={option}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange(option)}
                        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                            on ? a.chipOn : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                        }`}
                    >
                        {option}

                        {count > 0 && (
                            <span
                                className={`ml-1.5 rounded-full px-1.5 text-[10px] ${
                                    on ? "bg-white/25" : "bg-slate-100 text-slate-500"
                                }`}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// =========================================================
// AVATAR + DATE BADGE
// =========================================================

const AVATAR_SIZE = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
};

export function Avatar({ name, accent = "pink", size = "md" }) {
    return (
        <div
            aria-hidden="true"
            className={`flex shrink-0 items-center justify-center rounded-full font-bold ${AVATAR_SIZE[size]} ${ACCENTS[accent].avatar}`}
        >
            {initials(name) || "?"}
        </div>
    );
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// "2026-10-05" -> a small calendar tile (OCT / 5). muted = a past or closed one.
export function DateBadge({ date, accent = "pink", muted = false }) {
    const [, month, day] = String(date || "").slice(0, 10).split("-").map(Number);

    if (!month || !day) return null;

    return (
        <div
            aria-hidden="true"
            className={`flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${
                muted ? "bg-slate-100 text-slate-500" : ACCENTS[accent].soft
            }`}
        >
            <span className="text-[10px] font-bold leading-none tracking-wide">{MONTHS[month - 1]}</span>
            <span className="mt-0.5 text-lg font-bold leading-none">{day}</span>
        </div>
    );
}

// A small heading above a group of cards.
export function SectionTitle({ children, right }) {
    return (
        <div className="flex items-center justify-between pt-1">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{children}</h2>
            {right}
        </div>
    );
}

// Numbered label for the booking form.
export function StepLabel({ n, children, hint }) {
    return (
        <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                {n}
            </span>

            <span className="text-xs font-semibold text-slate-700">{children}</span>

            {hint && <span className="ml-auto text-[11px] text-slate-400">{hint}</span>}
        </div>
    );
}