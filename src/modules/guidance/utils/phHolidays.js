// Philippine public holidays (Nager.Date public API - LIBRE, walang API
// key at walang signup: https://date.nager.at/api/v3/PublicHolidays/2026/PH).
//
// Bakit walang key: ang Nager.Date ay bukas na public-holiday API. Kung gusto
// ng may-key na provider (hal. Calendarific), palitan lang ang HOLIDAY_URL at
// magdagdag ng `?api_key=...` - ang cache at helper functions dito ay pareho.

const HOLIDAY_URL = (year) => `https://date.nager.at/api/v3/PublicHolidays/${year}/PH`;

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

    const response = await fetch(HOLIDAY_URL(year), { signal });
    if (!response.ok) throw new Error(`Holiday service returned ${response.status}.`);

    const list = await response.json();
    const map = {};

    for (const h of list || []) {
        // Nager: { date: "2026-01-01", localName, name, ... }
        if (h?.date) map[h.date] = h.localName || h.name || "Public holiday";
    }

    try {
        localStorage.setItem(cacheKey(year), JSON.stringify(map));
    } catch { /* storage unavailable - memory copy still returned */ }

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
