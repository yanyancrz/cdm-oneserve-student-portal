// Philippine public holidays.
//
// The list is served by OUR API (GET /api/guidance/holidays?year=YYYY), which
// fetches the same public data (Nager.Date, no key, no signup) and caches it
// server-side. Routing it through the backend means the calendar the student
// and the counselor see and the rule the server enforces when booking always
// agree - there is one holiday source, not two.
//
// The result is still cached in localStorage for a year, so the app makes at
// most one holiday request per year.

import { guidanceApi } from "../services/guidanceApi";

const cacheKey = (year) => `ph_holidays_${year}`;

/**
 * { "2026-01-01": "New Year's Day", ... } para sa taon.
 * naka-cache sa localStorage ng isang taon - isang network call lang kada taon.
 */
export async function getPHHolidays(year, signal) {
    try {
        const raw = localStorage.getItem(cacheKey(year));
        if (raw) return JSON.parse(raw);
    } catch { /* corrupted cache - refetch */ }

    const data = await guidanceApi.getHolidays(year, signal);
    const map = data?.holidays || {};

    // Only cache a real list. An empty one means the provider was unreachable,
    // so it must not be remembered for the whole year.
    if (Object.keys(map).length > 0) {
        try {
            localStorage.setItem(cacheKey(year), JSON.stringify(map));
        } catch { /* storage unavailable - memory copy still returned */ }
    }

    return map;
}

/** Synchronous read ng na-cache na (wag gamitin bago mag-getPHHolidays). */
export function getCachedHolidays(year) {
    try {
        return JSON.parse(localStorage.getItem(cacheKey(year)) || "{}");
    } catch {
        return {};
    }
}

export const holidayName = (map, dateISO) => map?.[dateISO] || "";

export const isHoliday = (map, dateISO) => Boolean(map?.[dateISO]);
