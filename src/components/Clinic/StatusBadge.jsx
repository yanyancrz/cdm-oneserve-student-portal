import { statusStyle } from "./clinicFormat";

// Displays the status returned by the CMS backend.
export default function StatusBadge({ status }) {
    const style = statusStyle(status);

    return (
        <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-current/10 whitespace-nowrap"
            style={{
                background: style.bg,
                color: style.color,
            }}
        >
            <span
                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ background: style.color }}
                aria-hidden="true"
            />
            {status || "Unknown"}
        </span>
    );
}