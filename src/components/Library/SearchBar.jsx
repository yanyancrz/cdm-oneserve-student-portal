// SearchBar.jsx
//
// Controlled input — matches the contract used in BrowseBooks.jsx:
// <SearchBar value={...} onChange={setSearchQuery} placeholder={...} />
// onChange receives the raw string value (not the event), so callers can
// pass a useState setter directly.

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {

    return (
        <div className="relative">

            <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
            </svg>

            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="
                    w-full
                    pl-11 pr-4 py-3.5
                    rounded-2xl
                    border border-white/60
                    bg-white/80
                    backdrop-blur-sm
                    text-sm text-[#1F1F1F]
                    placeholder:text-gray-400
                    outline-none
                    shadow-sm
                    focus:border-[#106A2E]/40
                    focus:bg-white
                    focus:shadow-md
                    transition-all duration-200
                "
            />

            {value && (
                <button
                    onClick={() => onChange("")}
                    aria-label="Clear search"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>
            )}

        </div>
    );

}