import { isExactItemIdMatch } from "../config/lfTheme.js";

export const RECORDS_PER_PAGE = 20;
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function selectRecords(rows, { fields, categories, search, category, sort, page }) {
    const term = search.trim().toLowerCase();
    const matching = rows.filter((row) => !term ||
        isExactItemIdMatch(row.reportId, term) ||
        fields.some((field) => String(row[field] ?? "").toLowerCase().includes(term)));
    const categoryFilter = categories[category];
    const filtered = categoryFilter ? matching.filter(categoryFilter) : [...matching];
    if (sort.key) {
        filtered.sort((a, b) => (sort.desc ? -1 : 1) *
            collator.compare(a[sort.key] ?? "", b[sort.key] ?? ""));
    }

    const pages = Math.max(1, Math.ceil(filtered.length / RECORDS_PER_PAGE));
    const current = Math.min(page, pages);
    const start = (current - 1) * RECORDS_PER_PAGE;
    return {
        rows: filtered.slice(start, start + RECORDS_PER_PAGE),
        counts: Object.fromEntries([["", matching.length], ...Object.entries(categories)
            .map(([label, test]) => [label, matching.filter(test).length])]),
        pagination: { page: current, pages, total: filtered.length },
    };
}

export const reportCategories = {
    Lost: (report) => report.reportType === "Lost",
    Found: (report) => report.reportType === "Found",
    Claimed: (report) => report.lifecycleStatus === "Claimed",
    Returned: (report) => report.lifecycleStatus === "Returned",
};
