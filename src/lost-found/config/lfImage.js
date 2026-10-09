import { API_URL } from "../../config/api";

// =====================================================
// Resolving a stored report photo into a URL the browser can load
//
// Same reasoning as the marketplace's marketImageUrl: the API
// stores photos as ROOT-RELATIVE paths ("/uploads/lostfound/
// ab12....jpg"), but the frontend is served from a different
// origin than the API. Prefixing with API_URL turns the stored
// path into a fetchable URL; anything that already names its own
// origin (absolute, protocol-relative, blob:/data:) passes through
// untouched so a local file preview still works.
// =====================================================

export function lfImageUrl(value) {
    if (value === null || value === undefined) return null;

    const raw = String(value).trim();

    if (!raw) return null;

    if (/^(https?:|blob:|data:|\/\/)/i.test(raw)) return raw;

    const base = API_URL.replace(/\/+$/, "");

    return raw.startsWith("/") ? `${base}${raw}` : `${base}/${raw}`;
}
