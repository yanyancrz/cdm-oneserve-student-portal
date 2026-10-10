/**
 * Shared loading / empty / error kit.
 *
 * Every module used to grow its own grey blocks: Guidance had this kit,
 * the Library pages each declared a private `Skeleton`, the admin portal
 * had a 418-line one nobody else imported, and the marketplace and
 * lost-found modules had two more of their own. Five copies of the same
 * "pulsing rectangle" is how a design system rots.
 *
 * This is the single source. It is deliberately free of any module
 * context - no accents, no data shapes - so every page can import it.
 *
 * Three rules these follow that the private copies never did:
 *   1. `motion-safe:animate-pulse`, so the blocks stay perfectly still
 *      when the OS asks for reduced motion.
 *   2. One `role="status"` + `sr-only` label on the wrapper, with the
 *      blocks themselves `aria-hidden`, so a screen reader announces
 *      "Loading books..." once instead of reading every grey box.
 *   3. Callers guard with `loading && items.length === 0`, so a skeleton
 *      only ever covers the FIRST load - a background refresh repaints
 *      the list that is already there instead of flashing.
 */
import { AlertCircle, CheckCircle2, Inbox, Info, Loader2, RefreshCw } from "lucide-react";

// =========================================================
// SKELETONS
// =========================================================

const HAS_ROUNDED = /(^|\s)rounded(-|\s|$)/;

export function Skeleton({ className = "" }) {
    return (
        <div
            aria-hidden="true"
            className={`bg-slate-200/70 motion-safe:animate-pulse ${
                HAS_ROUNDED.test(className) ? "" : "rounded-lg"
            } ${className}`}
        />
    );
}

/** A list of placeholder cards: avatar, two lines, a badge, a button. */
export function CardListSkeleton({ rows = 3, label = "Loading..." }) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="space-y-3">
            <span className="sr-only">{label}</span>

            {Array.from({ length: rows }, (_, n) => (
                <div key={n} className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />

                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3.5 w-2/3" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>

                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>

                    <Skeleton className="mt-4 h-3 w-1/2" />
                    <Skeleton className="mt-4 h-9 w-full rounded-xl" />
                </div>
            ))}
        </div>
    );
}

/** A grid of placeholder stat cards. */
export function StatsSkeleton({
    count = 4,
    label = "Loading...",
    className = "",
}) {
    return (
        <div
            role="status"
            aria-busy="true"
            aria-live="polite"
            className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className}`}
        >
            <span className="sr-only">{label}</span>

            {Array.from({ length: count }, (_, n) => (
                <div key={n} className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="mt-3 h-7 w-12" />
                    <Skeleton className="mt-2 h-3 w-20" />
                </div>
            ))}
        </div>
    );
}

/** Book covers in a grid: the shape the library and reserve pages use. */
export function BookGridSkeleton({ count = 12, label = "Loading books..." }) {
    return (
        <div
            role="status"
            aria-busy="true"
            aria-live="polite"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        >
            <span className="sr-only">{label}</span>

            {Array.from({ length: count }, (_, n) => (
                <div
                    key={n}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                    <Skeleton className="aspect-[3/4] rounded-none" />

                    <div className="p-3">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="mt-2 h-3 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** One detail page: cover on the left, a title and lines on the right. */
export function DetailsSkeleton({ label = "Loading details..." }) {
    return (
        <div
            role="status"
            aria-busy="true"
            aria-live="polite"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
            <span className="sr-only">{label}</span>

            <div className="flex flex-col gap-6 sm:flex-row">
                <Skeleton className="h-56 w-40 shrink-0 rounded-xl" />

                <div className="min-w-0 flex-1 space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />

                    <div className="flex flex-wrap gap-2 pt-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>

                    <Skeleton className="mt-4 h-3 w-full" />
                    <Skeleton className="h-3 w-11/12" />
                    <Skeleton className="h-3 w-4/5" />

                    <Skeleton className="mt-5 h-11 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}

// =========================================================
// SMALL STATES
// =========================================================

/** Inline spinner, for a panel or a short list. */
export function Loading({ text = "Loading..." }) {
    return (
        <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={18} aria-hidden="true" /> {text}
        </div>
    );
}

/**
 * Full-page spinner for the moment a module opens: the route is matched
 * but nothing has been verified yet. Keeps the brand mark on screen so
 * the transition reads as "opening Guidance", not as a blank flash.
 */
export function ModuleLoadingScreen({
    icon: Icon,
    accent = "bg-slate-800",
    label,
    text = "Loading...",
}) {
    return (
        <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F7F5EF]">
            <span className="sr-only">{label ?? text}</span>

            {Icon && (
                <div
                    className={`flex h-16 w-16 items-center justify-center rounded-3xl ${accent} text-white shadow-lg`}
                >
                    <Icon size={30} aria-hidden="true" />
                </div>
            )}

            <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="animate-spin" size={16} aria-hidden="true" /> {text}
            </p>
        </div>
    );
}

export function ErrorBox({ message, onRetry }) {
    return (
        <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-red-500">
                <AlertCircle size={16} aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-medium">{message}</p>

                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition active:scale-95"
                    >
                        <RefreshCw size={12} aria-hidden="true" /> Try again
                    </button>
                )}
            </div>
        </div>
    );
}

// icon (optional): a lucide icon component. action (optional): a button or link.
export function Empty({ title, note, icon: Icon = Inbox, action }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Icon size={22} aria-hidden="true" />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>

            {note && <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">{note}</p>}

            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

const NOTE_TONES = {
    error: { box: "border-red-200 bg-red-50 text-red-700", icon: AlertCircle },
    success: { box: "border-green-200 bg-green-50 text-green-700", icon: CheckCircle2 },
    warn: { box: "border-amber-200 bg-amber-50 text-amber-800", icon: Info },
};

export function Note({ tone = "warn", children }) {
    const { box, icon: Icon } = NOTE_TONES[tone] || NOTE_TONES.warn;

    return (
        <div
            role={tone === "error" ? "alert" : "status"}
            className={`flex items-start gap-2 rounded-xl border p-3 text-xs leading-5 ${box}`}
        >
            <Icon size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}
