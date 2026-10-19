// Pure helpers behind the counselor Reports screen.
//
// The Reports page keeps its single server report (GET /counselor/reports) for
// the canonical lifetime numbers and the rolling 6-month chart, and additionally
// reads the raw lists it already has access to (appointments, follow-ups,
// counseling records) so the period filter can recalculate every metric for the
// chosen window without inventing numbers or adding backend endpoints.
//
// Kept out of the page so the math is easy to follow and reuse.

const pad = (n) => String(n).padStart(2, "0");

export const toISODate = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const iso10 = (value) => String(value || "").slice(0, 10);

// The four windows the filter offers. Kept as display strings so they can be
// fed straight into the shared <FilterChips>.
export const PERIOD_OPTIONS = ["7 days", "30 days", "90 days", "All time"];

export const PERIOD_DAYS = {
    "7 days": 7,
    "30 days": 30,
    "90 days": 90,
    "All time": "all",
};

export const MONTH_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "today" is injectable so the helpers stay deterministic in tests.
export function periodStartISO(days, now = new Date()) {
    if (days === "all") return null;
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (Number(days) - 1));
    return toISODate(d);
}

export function periodRange(days, now = new Date()) {
    return { from: periodStartISO(days, now), to: toISODate(now) };
}

// Included when `dateValue` (a yyyy-MM-dd string, possibly a longer ISO stamp)
// falls inside the last `days` days, inclusive of today. `"all"` keeps everything.
export function inPeriod(dateValue, days, now = new Date()) {
    if (days === "all") return true;
    const iso = iso10(dateValue);
    if (iso.length !== 10) return false;
    const start = periodStartISO(days, now);
    return iso >= start && iso <= toISODate(now);
}

export function filterByPeriod(items, getDate, days, now = new Date()) {
    return items.filter((item) => inPeriod(getDate(item), days, now));
}

export const distinctClients = (appointments) =>
    new Set(appointments.map((a) => a.studentId ?? a.studentName)).size;

export const countStatus = (appointments, status) =>
    appointments.filter((a) => a.status === status).length;

// ---------------- status / concern / role / weekday ----------------

const STATUS_ORDER = [
    "Pending", "Confirmed", "Arrived", "Completed",
    "Cancelled", "Rejected", "Expired", "NoShow",
];

export const STATUS_COLORS = {
    Pending: "#f59e0b",
    Confirmed: "#22c55e",
    Arrived: "#10b981",
    Completed: "#0ea5e9",
    Cancelled: "#94a3b8",
    Rejected: "#ef4444",
    Expired: "#cbd5e1",
    NoShow: "#d97706",
};

export function statusBreakdown(appointments) {
    const counts = {};
    for (const a of appointments) counts[a.status] = (counts[a.status] || 0) + 1;

    return STATUS_ORDER
        .filter((s) => counts[s])
        .map((s) => ({ label: s, value: counts[s], color: STATUS_COLORS[s] }));
}

export function concernBreakdown(appointments, limit = 8) {
    const counts = {};
    for (const a of appointments) {
        const concern = String(a.concernType || "").trim();
        if (concern) counts[concern] = (counts[concern] || 0) + 1;
    }

    return Object.entries(counts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
        .slice(0, limit);
}

export function roleBreakdown(appointments) {
    const clients = {};
    for (const a of appointments) {
        const key = a.role || "Student";
        (clients[key] = clients[key] || new Set()).add(a.studentId ?? a.studentName);
    }

    return Object.entries(clients)
        .map(([label, set]) => ({ label, value: set.size }))
        .sort((a, b) => b.value - a.value);
}

export function weekdayBreakdown(appointments) {
    const counts = Array(7).fill(0);
    for (const a of appointments) {
        const [y, m, d] = iso10(a.date).split("-").map(Number);
        if (!y || !m || !d) continue;
        counts[new Date(y, m - 1, d).getDay()] += 1;
    }
    return counts.map((value, index) => ({ label: WEEKDAY_SHORT[index], value }));
}

// ---------------- activity over time ----------------

// Returns { buckets: [{ label, fullLabel, values: [booked, completed] }], unit }.
// `reportMonthly` (from the server report) is used for the "All time" view so
// the lifetime chart keeps the same rolling-6-month calculation as before.
export function buildTrend(appointments, days, reportMonthly = []) {
    if (days === "all") {
        const buckets = (reportMonthly || []).map((m) => {
            const monthIndex = Number(String(m.month).slice(5, 7)) - 1;
            return {
                label: MONTH_SHORT[monthIndex] || String(m.month),
                fullLabel: String(m.month),
                values: [m.total || 0, m.completed || 0],
            };
        });
        return { buckets, unit: "month" };
    }

    const total = Number(days);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const buckets = [];

    const add = (startIso, endIso, label, fullLabel) => {
        const rows = appointments.filter((a) => {
            const iso = iso10(a.date);
            return iso >= startIso && iso <= endIso;
        });
        buckets.push({
            label,
            fullLabel,
            values: [rows.length, rows.filter((a) => a.status === "Completed").length],
        });
    };

    // 7 days -> one bar per day.
    if (total <= 7) {
        for (let i = total - 1; i >= 0; i--) {
            const day = new Date(now);
            day.setDate(now.getDate() - i);
            const iso = toISODate(day);
            add(iso, iso, WEEKDAY_SHORT[day.getDay()], iso);
        }
        return { buckets, unit: "day" };
    }

    // Up to a month -> one bar per week.
    if (total <= 31) {
        const weeks = Math.ceil(total / 7);
        for (let k = weeks - 1; k >= 0; k--) {
            const end = new Date(now);
            end.setDate(now.getDate() - k * 7);
            const start = new Date(end);
            start.setDate(end.getDate() - 6);
            const startIso = toISODate(start);
            const endIso = toISODate(end);
            add(startIso, endIso, `${start.getDate()} ${MONTH_SHORT[start.getMonth()]}`, `${startIso} → ${endIso}`);
        }
        return { buckets, unit: "week" };
    }

    // 90 days -> one bar per calendar month in the window.
    const startIso = periodStartISO(total, now);
    const first = new Date(
        Number(startIso.slice(0, 4)),
        Number(startIso.slice(5, 7)) - 1,
        1
    );
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const m = new Date(first); m <= lastMonth; m.setMonth(m.getMonth() + 1)) {
        const monthStart = toISODate(m);
        const monthEnd = toISODate(new Date(m.getFullYear(), m.getMonth() + 1, 0));
        const start = monthStart < startIso ? startIso : monthStart;
        const end = monthEnd > toISODate(now) ? toISODate(now) : monthEnd;
        add(start, end, MONTH_SHORT[m.getMonth()], `${m.getFullYear()}-${pad(m.getMonth() + 1)}`);
    }
    return { buckets, unit: "month" };
}

// ---------------- follow-ups / notes / clients ----------------

const FOLLOWUP_ORDER = ["Pending", "Accepted", "Completed", "Declined", "Cancelled"];

export const FOLLOWUP_COLORS = {
    Pending: "#f59e0b",
    Accepted: "#22c55e",
    Completed: "#0ea5e9",
    Declined: "#ef4444",
    Cancelled: "#94a3b8",
};

export function followUpBreakdown(followUps) {
    const counts = {};
    for (const f of followUps) counts[f.status] = (counts[f.status] || 0) + 1;

    return FOLLOWUP_ORDER
        .filter((s) => counts[s])
        .map((s) => ({ label: s, value: counts[s], color: FOLLOWUP_COLORS[s] }));
}

export function notesBreakdown(records) {
    let finalized = 0;
    let draft = 0;
    for (const r of records) {
        if (r.status === "Finalized") finalized += 1;
        else if (r.status === "Draft") draft += 1;
    }
    return { finalized, draft, total: finalized + draft };
}

// One summary per client from the appointments in scope, plus the client's
// current pending follow-ups (a live count, not tied to the period).
export function buildClients(appointments, followUps = []) {
    const pendingFollowUps = {};
    for (const f of followUps) {
        if (f.status !== "Pending") continue;
        const key = f.studentId;
        pendingFollowUps[key] = (pendingFollowUps[key] || 0) + 1;
    }

    const map = new Map();
    for (const a of appointments) {
        const key = a.studentId ?? a.studentName;
        let client = map.get(key);

        if (!client) {
            client = {
                id: key,
                name: a.studentName || "Student",
                role: a.role || "Student",
                studentNumber: a.studentNumber,
                course: a.course,
                yearLevel: a.yearLevel,
                institute: a.institute,
                position: a.position,
                total: 0,
                completed: 0,
                lastSession: null,
                concerns: new Set(),
            };
            map.set(key, client);
        }

        client.total += 1;
        if (a.status === "Completed") {
            client.completed += 1;
            const sessionDate = iso10(a.date);
            if (!client.lastSession || sessionDate > client.lastSession) client.lastSession = sessionDate;
        }
        if (a.concernType) client.concerns.add(a.concernType);
    }

    return [...map.values()]
        .map((client) => ({
            ...client,
            concerns: [...client.concerns],
            pendingFollowUps: pendingFollowUps[client.id] || 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

// Most recent sessions first, for the "recent activity" feed.
export function recentAppointments(appointments, limit = 6) {
    return [...appointments]
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .slice(0, limit);
}

export { iso10 };
