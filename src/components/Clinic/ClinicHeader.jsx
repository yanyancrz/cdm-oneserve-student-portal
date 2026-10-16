
import { useNavigate } from "react-router-dom";

// Shared header for Clinic pages.
export default function ClinicHeader({
    title,
    subtitle,
    backTo = "/dashboard",
    onRefresh,
    refreshing,
}) {
    const navigate = useNavigate();

    return (
        <header className="mb-8">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => navigate(backTo)}
                    aria-label="Go back"
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95"
                >
                    <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>

                <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        CDM OneServe · Clinic
                    </p>

                    <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {title}
                    </h1>

                    {subtitle && (
                        <p className="mt-1 truncate text-sm text-slate-500 sm:text-base">
                            {subtitle}
                        </p>
                    )}
                </div>

                {onRefresh && (
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={refreshing}
                        aria-label="Refresh"
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-emerald-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={refreshing ? "animate-spin" : ""}
                            aria-hidden="true"
                        >
                            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                            <path d="M21 3v6h-6" />
                        </svg>
                    </button>
                )}
            </div>
        </header>
    );
}
