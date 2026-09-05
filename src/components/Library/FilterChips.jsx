export default function FilterChips({
    options = [],
    selected,
    onSelect
}) {

    return (
        <div
            className="
                flex
                gap-2
                overflow-x-auto
                pb-1
                -mx-4
                px-4
                sm:mx-0
                sm:px-0
                scrollbar-hide
            "
            style={{ scrollbarWidth: "none" }}
        >
            {options.map((option) => {

                // Supports:
                // "Available"
                // OR
                // { value: "Available", label: "Available Now" }

                const value =
                    typeof option === "object"
                        ? option.value
                        : option;

                const label =
                    typeof option === "object"
                        ? option.label
                        : option;

                const isActive =
                    value === selected;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onSelect(value)}
                        className={`
                            flex-shrink-0
                            px-3.5
                            py-2
                            rounded-full
                            text-xs
                            font-medium
                            border
                            transition-all
                            duration-150

                            ${
                                isActive
                                    ? `
                                        bg-[#106A2E]
                                        border-[#106A2E]
                                        text-white
                                        shadow-sm
                                    `
                                    : `
                                        bg-white/80
                                        border-white/60
                                        text-gray-600
                                        hover:bg-white
                                    `
                            }
                        `}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}