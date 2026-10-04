const TONES = {
    green: "bg-[#E1F0E4] text-[#106A2E]",
    red: "bg-red-50 text-red-600",
    amber: "bg-[#FBF1CC] text-[#8A6D00]",
    gray: "bg-gray-100 text-gray-600",
};

export default function StatusBadge({ tone = "gray", children }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone] || TONES.gray}`}>
            {children}
        </span>
    );
}