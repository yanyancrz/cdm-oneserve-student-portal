// Date / text helpers for the Guidance Administration pages.
//
// Two API conventions meet here:
//  - account "last login" values are UTC instants, now serialised with "Z";
//  - appointment/schedule values are Philippine wall clocks (GuidanceClock),
//    serialised without a zone.
// parse() treats a zone-less value as +08:00 and leaves a zoned value alone,
// then every formatter renders Asia/Manila. That converts once, never twice.

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

const PH_TIME_ZONE = "Asia/Manila";
const PH_OFFSET = "+08:00";

function parse(value) {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const text = String(value).trim();
    const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
    const date = new Date(hasZone ? text : `${text}${PH_OFFSET}`);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
    const date = parse(value);
    if (!date) return "—";

    return date.toLocaleDateString("en-US", {
        timeZone: PH_TIME_ZONE,
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function formatDateTime(value) {
    const date = parse(value);
    if (!date) return "Never";

    return `${date.toLocaleDateString("en-US", {
        timeZone: PH_TIME_ZONE,
        year: "numeric",
        month: "short",
        day: "numeric",
    })}, ${date.toLocaleTimeString("en-US", {
        timeZone: PH_TIME_ZONE,
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
