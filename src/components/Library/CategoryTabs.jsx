export default function CategoryTabs({
    categories = [],
    selected = "All",
    onSelect,
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-[#1F1F1F] mb-2">
                Category
            </label>

            <div className="relative">

                <select
                    value={selected}
                    onChange={(e) => onSelect(e.target.value)}
                    className="
                        w-full
                        appearance-none
                        bg-white
                        border
                        border-gray-200
                        rounded-xl
                        px-4
                        py-3
                        pr-10
                        text-sm
                        text-[#1F1F1F]
                        outline-none
                        cursor-pointer
                        transition-all
                        focus:border-[#106A2E]
                        focus:ring-2
                        focus:ring-[#106A2E]/10
                    "
                >
                    <option value="All">
                        All Categories
                    </option>

                    {categories
                        .filter(
                            (category) =>
                                category &&
                                category !== "All"
                        )
                        .map((category) => (
                            <option
                                key={category}
                                value={category}
                            >
                                {category}
                            </option>
                        ))}
                </select>

                {/* DOWN ARROW */}
                <div
                    className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        pointer-events-none
                        text-gray-400
                    "
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </div>

            </div>
        </div>
    );
}