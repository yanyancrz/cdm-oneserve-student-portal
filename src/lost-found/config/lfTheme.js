// =====================================================
// Lost & Found design tokens
//
// The module palette is the OneServe palette: the deep campus
// green, its brighter companion, the campus-yellow accent, and
// the near-black / light-gray pair for text and surfaces.
// =====================================================

export const LF_COLORS = {
    primary: "#106A2E",
    primaryDark: "#0E3B22",
    secondary: "#0D7856",
    accent: "#F4D35E",
    ink: "#1F1F1F",
    surface: "#F1F1F1",
    page: "#F7F5EF",
};

// =====================================================
// Status vocabulary - the exact strings the API stores
// =====================================================

export const REPORT_STATUS = {
    PENDING: "Pending",
    PUBLISHED: "Published",
    REJECTED: "Rejected",
};

export const CLAIM_STATUS = {
    PROCESSING: "Processing",
    INFORMATION_REQUESTED: "InformationRequested",
    RETURNED: "Returned",
    REJECTED: "Rejected",
    SCHEDULED: "Scheduled",
    AWAITING_PICKUP: "Awaiting Pickup",
    CANCELLED: "Cancelled",
};

export const SCHEDULE_STATUS = {
    AWAITING_PICKUP: "Awaiting Pickup",
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
};

export const RECOVERY_STATUS = {
    PENDING: "Pending",
    AT_ADMIN_OFFICE: "AtAdminOffice",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
};

// =====================================================
// ITEM ID - the one identifier the whole module uses
//
// Reports are identified by their numeric ReportId from the
// API. Every surface shows it as "#001" (zero-padded to three
// digits), and that value IS the Item ID - there is no second
// id field in the database.
//
// Search must be an EXACT match on this value: the query may
// carry the "#" prefix and leading zeros, and it must never
// match a different item that merely shares digits.
// =====================================================

/** 1 -> "#001" */
export function formatItemId(reportId) {
    return `#${String(reportId ?? 0).padStart(3, "0")}`;
}

/** "  #001  " -> "001" (tolerates the prefix and stray spaces). */
export function normalizeItemIdQuery(value) {
    return String(value ?? "")
        .trim()
        .replace(/^#/, "")
        .trim();
}

/**
 * True only when `query` names this report's Item ID exactly.
 *
 * The Item ID is carried by the report's own numeric id and shown as
 * "#001", so a query may include the hash and any amount of leading
 * zeros: "1", "001", "#001", "01" and "0001" all name item 1. A query
 * that resolves to a DIFFERENT id ("10" for item 1, "0012" for item
 * 125) never matches, and a non-numeric string such as
 * "LF-2026-001" is not a complete Item ID here at all.
 */
export function isExactItemIdMatch(reportId, query) {
    const key = normalizeItemIdQuery(query);
    if (!key) return false;

    // Our Item IDs are numeric; anything else is not a complete ID.
    if (!/^\d+$/.test(key)) return false;

    // Compared as strings with the zero padding removed, so no leading
    // zero is ever lost in translation.
    const stripLeadingZeros = (value) => String(value).replace(/^0+(?=\d)/, "");

    return stripLeadingZeros(key) === stripLeadingZeros(String(reportId));
}

// =====================================================
// Small presentation helpers
// =====================================================

/** Human label for a status string, for chips and badges. */
export function formatStatus(status) {
    const value = String(status || "").trim();
    if (!value) return "—";

    // "AtAdminOffice" reads better with a space.
    if (value === "AtAdminOffice") return "At Admin Office";

    // "InformationRequested" is the only camelCase status left.
    if (value === "InformationRequested") return "Information Requested";

    return value;
}

/** One-line description of a status for screen readers. */
export function statusTone(status) {
    const value = String(status || "").toLowerCase();
    if (["published", "completed", "returned", "atadminoffice"].includes(value))
        return "ok";
    if (["rejected", "cancelled"].includes(value)) return "bad";
    // "Awaiting Pickup" is good news, but the module reads it as pending
    // until the item is actually back - keep it amber.
    return "pending";
}

/** "Mar 9, 2026, 2:30 PM" - the format the pickup flow uses. */
export function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/** Initials for the photo placeholder. */
export function initials(name) {
    return String(name || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}
