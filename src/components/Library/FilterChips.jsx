// FilterChips.jsx
//
// Generic and reusable — takes whatever options a page needs rather than
// hardcoding a fixed list, since different pages need different sets
// (e.g. BrowseBooks.jsx uses Available/Borrowed/Reserved/New Arrival,
// while a page like Favorites.jsx might use a different set entirely).
//
// Matches the contract used in BrowseBooks.jsx:
// <FilterChips options={[...]} selected={...} onSelect={setSelectedFilter} />

export default function FilterChips({ options, selected, onSelect }) {

    return (
        <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
        >
            {
                options.map((option) => {
                    const isActive = option === selected;

                    return (
                        <button
                            key={option}
                            onClick={() => onSelect(option)}
                            className={`
                                flex-shrink-0
                                px-3.5 py-2
                                rounded-full
                                text-xs font-medium
                                border
                                transition-all duration-150
                                ${
                                    isActive
                                        ? "bg-[#106A2E] border-[#106A2E] text-white shadow-sm"
                                        : "bg-white/80 border-white/60 text-gray-600 hover:bg-white"
                                }
                            `}
                        >
                            {option}
                        </button>
                    );
                })
            }
        </div>
    );

}