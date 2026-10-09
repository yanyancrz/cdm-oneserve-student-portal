import { API_URL } from "../../config/api";

// =====================================================
// Resolving a stored product photo into a URL the browser can load
//
// WHY THIS FILE EXISTS
// The marketplace stores a photo as a ROOT-RELATIVE path - "/uploads/marketplace/
// ab12....jpg" - because that is what the file is called on disk inside wwwroot,
// and it keeps the row portable across servers.
//
// But the frontend is NOT served by the API. In development Vite serves the app
// on its own port, and in production the app and the API sit on different hosts.
// A root-relative "/uploads/..." therefore resolves against the FRONTEND origin,
// where no such file exists: the request 404s, <img> fires onError, and the UI
// silently falls back to the initials placeholder.
//
// The upload itself never failed - the file is on the API, and
// GET {API_URL}/uploads/... returns 200. Only the <img> src was pointing at the
// wrong host. Every other upload in OneServe already prefixes API_URL this way
// (Profile.jsx, EditProfile.jsx, ViewRequestModal.jsx); the marketplace was the
// one place that forgot, which is why only product photos were broken.
//
// RESOLVED HERE, ONCE, so the prefix cannot be forgotten again in a fourth
// call site.
// =====================================================

/**
 * Returns a URL the browser can actually fetch.
 *
 * Passes through anything that already names its own origin - an absolute
 * http(s) URL, a protocol-relative one, or a blob:/data: URL from a local file
 * preview - because prefixing those would break them. `null` and blanks become
 * `null` so the caller renders its placeholder rather than `<img src="">`, which
 * is a request to the current page's own URL and a second way to hit onError.
 */
export function marketImageUrl(value) {
    if (value === null || value === undefined) return null;

    const raw = String(value).trim();

    if (!raw) return null;

    // Already absolute, protocol-relative, or an inline/local preview.
    if (/^(https?:|blob:|data:|\/\/)/i.test(raw)) return raw;

    const base = API_URL.replace(/\/+$/, "");

    return raw.startsWith("/") ? `${base}${raw}` : `${base}/${raw}`;
}