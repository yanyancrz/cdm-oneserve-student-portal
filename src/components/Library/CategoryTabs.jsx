// CategoryTabs.jsx
//
// Matches the contract used in BrowseBooks.jsx:
// <CategoryTabs categories={mockCategories} selected={...} onSelect={setSelectedCategory} />
//
// Visually distinct from FilterChips (underline-tab style vs. pill-chip
// style) so the two rows read as two different kinds of filtering —
// category vs. status — rather than blurring together.

export default function CategoryTabs({ categories, selected, onSelect }) {

    return (
        <div
            className="flex gap-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide border-b border-white/40"
            style={{ scrollbarWidth: "none" }}
        >
            {
                categories.map((category) => {
                    const isActive = category === selected;

                    return (
                        <button
                            key={category}
                            onClick={() => onSelect(category)}
                            className={`
                                flex-shrink-0
                                pb-2.5
                                text-sm
                                whitespace-nowrap
                                border-b-2
                                transition-colors duration-150
                                ${
                                    isActive
                                        ? "border-[#106A2E] text-[#106A2E] font-semibold"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                }
                            `}
                        >
                            {category}
                        </button>
                    );
                })
            }
        </div>
    );

}