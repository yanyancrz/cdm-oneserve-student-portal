// EmptyState.jsx
//
// Generic and reusable. Two call sites already depend on slightly
// different shapes of this component, both supported here:
//   BookGrid.jsx    -> <EmptyState title={...} message={...} />
//   BookDetails.jsx -> <EmptyState title={...} message={...} actionLabel={...} onAction={...} />
//
// actionLabel/onAction are optional — the action button only renders when
// both are provided, so BookGrid's simpler "no results" case doesn't need
// to pass anything it doesn't use.

const DEFAULT_ICON = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

export default function EmptyState({ title, message, icon, actionLabel, onAction }) {

    return (
        <div className="flex flex-col items-center justify-center text-center py-14 px-6 bg-white/60 rounded-[24px]">

            <div className="w-14 h-14 rounded-2xl bg-[#106A2E]/10 text-[#106A2E] flex items-center justify-center mb-4">
                {icon || DEFAULT_ICON}
            </div>

            <h3 className="text-base font-semibold text-[#1F1F1F] mb-1.5">
                {title}
            </h3>

            {message && (
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-5">
                    {message}
                </p>
            )}

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="
                        bg-[#106A2E] text-white
                        px-5 py-2.5 rounded-xl
                        text-sm font-semibold
                        hover:brightness-105 active:scale-[0.99]
                        transition-all
                    "
                >
                    {actionLabel}
                </button>
            )}

        </div>
    );

}