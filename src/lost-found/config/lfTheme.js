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
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CLAIMED: "Claimed",
};

export const CLAIM_STATUS = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    SCHEDULED: "Scheduled",
    AWAITING_PICKUP: "Awaiting Pickup",
    COMPLETED: "Completed",
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
// Small presentation helpers
// =====================================================

/** Human label for a status string, for chips and badges. */
export function formatStatus(status) {
    const value = String(status || "").trim();
    if (!value) return "—";

    // "AtAdminOffice" reads better with a space.
    if (value === "AtAdminOffice") return "At Admin Office";

    return value;
}

/** One-line description of a status for screen readers. */
export function statusTone(status) {
    const value = String(status || "").toLowerCase();
    if (["approved", "completed", "claimed", "atadminoffice"].includes(value))
        return "ok";
    if (["rejected", "cancelled"].includes(value)) return "bad";
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
