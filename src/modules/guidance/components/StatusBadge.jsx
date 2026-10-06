const STYLE = {
    Pending:   { bg: "#fef3c7", fg: "#92400e", dot: "#f59e0b" },
    Confirmed: { bg: "#dcfce7", fg: "#166534", dot: "#22c55e" },
    Completed: { bg: "#e0f2fe", fg: "#0c4a6e", dot: "#0ea5e9" },
    Cancelled: { bg: "#f1f5f9", fg: "#475569", dot: "#94a3b8" },
    Rejected:  { bg: "#fee2e2", fg: "#991b1b", dot: "#ef4444" },
    Expired:   { bg: "#f1f5f9", fg: "#64748b", dot: "#cbd5e1" },
};

export default function StatusBadge({ status }) {
    const c = STYLE[status] || STYLE.Cancelled;

    return (
        <span
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: c.bg, color: c.fg }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.dot }} />
            {status}
        </span>
    );
}