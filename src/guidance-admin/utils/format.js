// Date / text helpers for the Guidance Administration pages.
//
// The API returns naive (offset-less) timestamps that already carry Philippine
// wall-clock time, so they are parsed as-is - never with a "Z" suffix, which
// would shift them back by 8 hours in the browser.

export function initials(name) {
    if (!name || !name.trim()) return "—";

    return name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function parse(value) {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
    const date = parse(value);
    if (!date) return "—";

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function formatDateTime(value) {
    const date = parse(value);
    if (!date) return "Never";

    return `${date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })}, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    })}`;
}

export function formatRelative(value) {
    const date = parse(value);
    if (!date) return "Never signed in";

    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    return formatDate(value);
}

const STATUS_TONES = {
    Active: "green",
    Completed: "green",
    Finalized: "green",
    Confirmed: "green",
    Accepted: "green",
    Pending: "amber",
    Draft: "amber",
    Suspended: "red",
    Rejected: "red",
    Cancelled: "gray",
    Expired: "gray",
    Deleted: "red",
};

export function statusTone(status) {
    return STATUS_TONES[status] || "gray";
}

export function formatNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "0";
}
