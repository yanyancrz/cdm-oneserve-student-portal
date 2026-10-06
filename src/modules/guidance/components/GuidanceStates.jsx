import { AlertCircle, CheckCircle2, Inbox, Info, Loader2, RefreshCw } from "lucide-react";

// =========================================================
// SKELETONS (grey blocks that pulse; still while "reduce motion" is on)
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

// A few placeholder cards: avatar, two lines, a badge, a button.
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

// Four stat cards (counselor dashboard).
export function StatsSkeleton({ label = "Loading..." }) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="grid grid-cols-2 gap-3">
            <span className="sr-only">{label}</span>

            {[0, 1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="mt-3 h-7 w-12" />
                    <Skeleton className="mt-2 h-3 w-20" />
                </div>
            ))}
        </div>
    );
}

// =========================================================
// SMALL STATES
// =========================================================

// Inline spinner for small spots.
export function Loading({ text = "Loading..." }) {
    return (
        <div
            role="status"
            className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"
        >
            <Loader2 className="animate-spin" size={18} aria-hidden="true" /> {text}
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