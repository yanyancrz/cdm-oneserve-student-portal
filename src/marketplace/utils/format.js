// Formatting helpers for CampusMarket.
//
// Money is ALWAYS integer centavos from the API - never a float. These helpers
// are the only place centavos become a peso string, so rounding can never leak
// into a total.

/** 45000 -> "PHP 450.00" */
export function formatPeso(centavos, { withSymbol = true } = {}) {
    const value = Number(centavos) || 0;
    const amount = (value / 100).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return withSymbol ? `PHP ${amount}` : amount;
}

/** Compact form for dashboard tiles: 1250000 -> "PHP 12.5K" */
export function formatPesoShort(centavos) {
    const value = Number(centavos) || 0;
    const amount = value / 100;

    if (amount >= 1_000_000) return `PHP ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `PHP ${(amount / 1_000).toFixed(1)}K`;
    return `PHP ${amount.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

/** Centavos -> a number the <input type="number"> inputs can edit. */
export function centavosToPesos(centavos) {
    return ((Number(centavos) || 0) / 100).toFixed(2);
}

/** A peso string/number -> integer centavos, never negative. */
export function pesosToCentavos(pesos) {
    const parsed = Number(String(pesos).replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.round(parsed * 100));
}

export function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return `${formatDate(value)} ${date.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
    })}`;
}

/** "3 minutes ago" - used in the chat and the transactions list. */
export function formatRelative(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return formatDate(value);
}

/** Initial letters for an avatar fallback when a product has no image. */
export function initials(text) {
    return String(text || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join("");
}