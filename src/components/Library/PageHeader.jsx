import { useNavigate } from "react-router-dom";

// PageHeader.jsx
//
// Reusable across every Library sub-page. Owns its own back navigation
// (useNavigate(-1)) so pages don't each re-implement a back button.
//
// Matches the contract used in BrowseBooks.jsx / BookDetails.jsx:
// <PageHeader title={...} subtitle={...} showBack={true} />

export default function PageHeader({ title, subtitle, showBack = true }) {

    const navigate = useNavigate();

    return (
        <div className="flex items-center gap-3 mb-5">

            {showBack && (
                <button
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                    className="
                        w-10 h-10 rounded-full bg-white/80 shadow-sm
                        flex items-center justify-center text-[#1F1F1F]
                        flex-shrink-0
                        hover:bg-white active:scale-95
                        transition-all
                    "
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
            )}

            <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-[#1F1F1F] tracking-tight truncate">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {subtitle}
                    </p>
                )}
            </div>

        </div>
    );

}