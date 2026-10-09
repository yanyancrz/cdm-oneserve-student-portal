import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Image as ImageIcon, Inbox, Loader2, Search, UploadCloud } from "lucide-react";

import { LF_COLORS, statusTone } from "../config/lfTheme";

// =====================================================
// Shared Lost & Found UI primitives
//
// The module reuses the OneServe surface (page background,
// green header, rounded cards) rather than inventing its own,
// so it reads as part of OneServe and not as a pasted-in
// system.
// =====================================================

export function LfPanel({ title, subtitle, action, children, className = "" }) {
    return (
        <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
            {(title || action) && (
                <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <div>
                        {title && (
                            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
                        )}
                        {subtitle && (
                            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                        )}
                    </div>
                    {action}
                </header>
            )}
            {children}
        </section>
    );
}

export function LfButton({
    children,
    onClick,
    variant = "primary",
    type = "button",
    disabled = false,
    loading = false,
    className = "",
}) {
    const variants = {
        primary: `bg-[${LF_COLORS.primary}] text-white hover:bg-[${LF_COLORS.primaryDark}]`,
        secondary: `border border-[${LF_COLORS.primary}] text-[${LF_COLORS.primary}] hover:bg-[${LF_COLORS.primary}]/5`,
        accent: `bg-[${LF_COLORS.accent}] text-[${LF_COLORS.ink}] hover:opacity-90`,
        ghost: `text-slate-600 hover:bg-slate-100`,
        danger: `bg-red-600 text-white hover:bg-red-700`,
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[${LF_COLORS.primary}]/40 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
        >
            {loading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {children}
        </button>
    );
}

/** A status pill with a tone derived from the status itself. */
export function LfStatusChip({ status }) {
    const tone = statusTone(status);

    const tones = {
        ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
        bad: "bg-red-50 text-red-700 border-red-200",
        pending: "bg-amber-50 text-amber-700 border-amber-200",
    };

    const icons = {
        ok: CheckCircle2,
        bad: AlertCircle,
        pending: Clock,
    };

    const Icon = icons[tone] || Clock;

    const label =
        status === "AtAdminOffice"
            ? "At Admin Office"
            : String(status || "—");

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}
        >
            <Icon size={11} aria-hidden="true" />
            {label}
        </span>
    );
}

/** Lost / Found / Report-type tag. */
export function LfTypeTag({ type }) {
    const isFound = String(type || "").toLowerCase() === "found";

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isFound
                    ? "bg-[#0D7856]/10 text-[#0D7856]"
                    : "bg-[#106A2E]/10 text-[#106A2E]"
            }`}
        >
            {isFound ? "FOUND" : "LOST"}
        </span>
    );
}

export function LfEmpty({ icon: Icon = Inbox, title, message, action }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#106A2E]/5 text-[#106A2E]">
                <Icon size={22} aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
            {message && (
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{message}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function LfSkeleton({ rows = 3 }) {
    return (
        <div className="space-y-3" aria-label="Loading">
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="h-20 animate-pulse rounded-2xl bg-slate-200/70"
                />
            ))}
        </div>
    );
}

export function LfNotice({ tone = "info", children }) {
    const tones = {
        info: "border-[#106A2E]/20 bg-[#106A2E]/5 text-[#106A2E]",
        warn: "border-amber-300 bg-amber-50 text-amber-800",
        bad: "border-red-300 bg-red-50 text-red-700",
    };

    return (
        <div className={`rounded-xl border px-4 py-3 text-xs leading-5 ${tones[tone]}`}>
            {children}
        </div>
    );
}

/** Search input, same shape across the module. */
export function LfSearchInput({ value, onChange, placeholder = "Search items…" }) {
    return (
        <label className="relative block">
            <span className="sr-only">{placeholder}</span>
            <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
            />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#106A2E]/40 focus:outline-none focus:ring-2 focus:ring-[#106A2E]/15"
            />
        </label>
    );
}

export const lfInputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#106A2E]/40 focus:outline-none focus:ring-2 focus:ring-[#106A2E]/15";

export function lfField(label, props) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </span>
            <input {...props} className={`${lfInputClass} ${props.className || ""}`} />
        </label>
    );
}

/** Photo with a graceful fallback to an icon tile. */
export function LfImage({ src, alt = "", className = "" }) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div
                className={`flex items-center justify-center rounded-xl bg-[#106A2E]/5 text-[#106A2E]/50 ${className}`}
                aria-label={alt || "No photo"}
            >
                <ImageIcon size={22} aria-hidden="true" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className={`object-cover ${className}`}
        />
    );
}

/** File picker styled as a dashed drop zone for report photos. */
export function LfPhotoPicker({ onFile, preview, className = "" }) {
    const [dragging, setDragging] = useState(false);

    const accept = ".jpg,.jpeg,.png,.webp";

    const pick = (files) => {
        const file = files?.[0];
        if (file) onFile(file);
    };

    return (
        <label
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
                dragging
                    ? "border-[#106A2E] bg-[#106A2E]/5"
                    : "border-slate-300 bg-white hover:border-[#106A2E]/50"
            } ${className}`}
            onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                pick(event.dataTransfer?.files);
            }}
        >
            {preview ? (
                <img
                    src={preview}
                    alt="Report photo preview"
                    className="mb-3 max-h-40 rounded-xl object-contain"
                />
            ) : (
                <UploadCloud size={26} className="mb-2 text-[#106A2E]/60" aria-hidden="true" />
            )}
            <span className="text-xs font-semibold text-slate-700">
                {preview ? "Replace photo" : "Add a photo"}
            </span>
            <span className="mt-1 text-[10px] text-slate-400">
                JPG, PNG or WEBP · max 5 MB
            </span>
            <input
                type="file"
                accept={accept}
                className="sr-only"
                onChange={(event) => pick(event.target.files)}
            />
        </label>
    );
}
