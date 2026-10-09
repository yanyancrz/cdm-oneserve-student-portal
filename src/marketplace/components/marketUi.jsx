// Shared CampusMarket UI pieces.
//
// Deliberately small and unopinionated: the buyer pages are mobile-first and
// the staff pages are desktop tables, so these cover only what both need.

import { useEffect, useState } from "react";

import { BRAND, RADIUS, SHADOW } from "../config/marketTheme";
import { marketImageUrl } from "../config/marketImage";

/**
 * The ambient background: three blurred orbs and a faint grid, taken from the
 * Login page.
 *
 * It lives here rather than in marketTheme.js because that file is a .js and
 * cannot hold JSX. The real reason to extract it is that "three circles and a
 * 3.5% grid" is not worth retyping per screen - and a partial copy is how a
 * module ends up with two of the three orbs.
 */
export function AmbientBackground() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 overflow-hidden"
        >
            <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="absolute right-[-140px] top-[30%] h-[32rem] w-[32rem] rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute bottom-[-120px] left-[30%] h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,106,46,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,106,46,.35)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.035]" />
        </div>
    );
}

/** Page shell with the standard CampusMarket header. */
export function MarketPanel({ title, subtitle, action, children, className = "" }) {
    return (
        <section
            className={`${RADIUS.panel} ${BRAND.primaryBorderClass}/10 border bg-white ${SHADOW.card} ${className}`}
        >
            {(title || action) && (
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
                    <div>
                        {title && (
                            <h2 className="text-sm font-semibold text-slate-800 sm:text-base">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>
                        )}
                    </div>
                    {action}
                </header>
            )}
            {children}
        </section>
    );
}

/** Neutral empty state. `hint` explains what would fill it. */
export function MarketEmpty({ icon, title, hint, action }) {
    return (
        <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            {icon && (
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#106A2E]/5 text-[#106A2E]/40">
                    {icon}
                </div>
            )}
            <p className="text-sm font-semibold text-slate-700">{title}</p>
            {hint && <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">{hint}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

/** Small labelled metric tile, used on both dashboards. */
export function MarketStat({ label, value, hint, tone = "default" }) {
    const tones = {
        default: "text-slate-800",
        good: "text-emerald-700",
        warn: "text-amber-700",
        bad: "text-rose-700",
    };

    return (
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-3">
            <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-slate-400">
                {label}
            </p>
            <p className={`mt-1 text-lg font-semibold ${tones[tone] || tones.default}`}>{value}</p>
            {hint && <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>}
        </div>
    );
}

/** Consistent primary/secondary buttons across buyer and staff screens. */
export function MarketButton({
    children,
    variant = "primary",
    size = "md",
    className = "",
    ...rest
}) {
    const variants = {
        // The brand gradient + shadow, matching the Login page's sign-in button.
        // Previously a flat fill, which is why the marketplace read as a
        // different system from the rest of OneServe.
        primary: `bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-white shadow-lg shadow-emerald-900/20 transition hover:opacity-90 active:scale-[0.98]`,
        secondary:
            "border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]",
        danger:
            "bg-rose-600 text-white transition hover:bg-rose-700 active:scale-[0.98]",
        ghost: "text-slate-500 transition hover:bg-slate-100",
    };

    const sizes = {
        sm: "px-2.5 py-1.5 text-[11px]",
        md: "px-3.5 py-2 text-xs",
        lg: "px-5 py-3 text-sm",
    };

    return (
        <button
            type="button"
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
            {...rest}
        >
            {children}
        </button>
    );
}

/** Labelled form field with optional hint text. */
export function MarketField({ label, hint, error, children, className = "" }) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                {label}
            </span>
            {children}
            {error ? (
                <span className="mt-1 block text-[11px] text-rose-600">{error}</span>
            ) : hint ? (
                <span className="mt-1 block text-[10px] text-slate-400">{hint}</span>
            ) : null}
        </label>
    );
}

export const marketInputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#106A2E] focus:bg-white";

export const marketSelectClass = `${marketInputClass} appearance-none pr-9`;

/** Inline banner. `tone` picks the palette. */
export function MarketNotice({ tone = "info", title, children, icon }) {
    const tones = {
        info: "border-sky-200 bg-sky-50 text-sky-800",
        warn: "border-amber-200 bg-amber-50 text-amber-800",
        error: "border-rose-200 bg-rose-50 text-rose-800",
        good: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };

    return (
        <div className={`flex gap-2.5 rounded-xl border px-3.5 py-3 ${tones[tone]}`}>
            {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
            <div className="min-w-0">
                {title && <p className="text-xs font-semibold">{title}</p>}
                {children && (
                    <div className={`text-[11px] leading-5 ${title ? "mt-0.5" : ""}`}>
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Product photo, with the initials placeholder as both the before and the after
 * state.
 *
 * The "after" matters now that photos are real uploads: if a staff member
 * replaces or removes a file while a buyer has the catalog open, the URL 404s.
 * Without an error handler the browser paints its broken-image glyph, which looks
 * like a broken product rather than a missing photo.
 */
export function MarketImage({ src, alt, initials, className = "", rounded = "rounded-xl" }) {
    const [failed, setFailed] = useState(false);

    // The resolver runs at render, not on a state copy, so a new src always gets
    // a fresh attempt thanks to the effect below.
    const resolvedSrc = marketImageUrl(src);

    // A new src deserves a fresh attempt - the previous failure was about the
    // old one.
    useEffect(() => {
        setFailed(false);
    }, [resolvedSrc]);

    if (!resolvedSrc || failed) {
        return (
            <div
                className={`flex items-center justify-center bg-gradient-to-br from-[#106A2E]/5 to-[#106A2E]/10 ${rounded} ${className}`}
            >
                <span className="text-xl font-semibold text-[#106A2E]/30">
                    {initials}
                </span>
            </div>
        );
    }

    return (
        <img
            src={resolvedSrc}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className={`object-cover ${rounded} ${className}`}
        />
    );
}

/** Skeleton placeholder for a loading panel. */
export function MarketSkeleton({ rows = 3, className = "" }) {
    return (
        <div className={`space-y-2.5 p-4 ${className}`}>
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="h-12 animate-pulse rounded-xl bg-slate-100"
                />
            ))}
        </div>
    );
}