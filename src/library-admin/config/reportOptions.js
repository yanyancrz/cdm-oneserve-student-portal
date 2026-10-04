export const GRANULARITIES = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
];

// usesRange: false means the export is a snapshot of right now.
export const EXPORT_DATASETS = [
    { value: "catalog", label: "Book catalog", usesRange: false },
    { value: "active-loans", label: "Active loans", usesRange: false },
    { value: "overdue", label: "Overdue books", usesRange: false },
    { value: "borrows", label: "Borrow transactions", usesRange: true },
    { value: "returns", label: "Return transactions", usesRange: true },
    { value: "reservations", label: "Reservations", usesRange: true },
    { value: "fines", label: "Fine records", usesRange: true },
];

export const RANGE_PRESETS = [
    { key: "7", label: "Last 7 days", days: 7 },
    { key: "30", label: "Last 30 days", days: 30 },
    { key: "90", label: "Last 90 days", days: 90 },
];

// yyyy-mm-dd in the local time zone (toISOString would shift the day).
export function toInputDate(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1));
    return toInputDate(date);
}

export function formatBucket(value, granularity) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return granularity === "monthly"
        ? date.toLocaleDateString("en-PH", { month: "short", year: "numeric" })
        : date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}