// Date / slot helpers shared by the student Guidance pages.
// Slots look like "9:30 AM" (same format the API generates).
const pad = (n) => String(n).padStart(2, "0");

export const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const nowMinutes = () => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
};

export const slotToMinutes = (slot) => {
    const m = String(slot || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return 0;
    let h = Number(m[1]) % 12;
    if (m[3].toUpperCase() === "PM") h += 12;
    return h * 60 + Number(m[2]);
};

export const isPastSlot = (dateISO, slot) =>
    dateISO === todayISO() && slotToMinutes(slot) <= nowMinutes();

// "2026-10-05" -> "Oct 5, 2026" (parsed as a plain calendar date, no timezone shift)
export const formatYMD = (value) => {
    if (!value) return "—";
    const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export const formatStamp = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? ""
        : d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const initials = (name = "") =>
    name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();