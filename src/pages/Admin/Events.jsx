import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import {
    AlertCircle,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Copy,
    Download,
    ExternalLink,
    FileSpreadsheet,
    Loader2,
    Mail,
    MapPin,
    Pencil,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";

const API_BASE = `${API_URL}/api/admin/events`;
const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("authToken")}`,
});

const EMPTY_FORM = {
    title: "",
    description: "",
    dates: [], // array of "YYYY-MM-DD"
    startTime: "",
    endTime: "",
    location: "",
    tag: "CAMPUS",
    accent: "#F4D35E",
};

const TAG_LABELS = {
    CAMPUS: "Campus",
    LIBRARY: "Library",
    GUIDANCE: "Guidance",
    LOSTFOUND: "Lost & Found",
    CLINIC: "Clinic",
};

// Accent color used for imported events, per category.
const TAG_ACCENT = {
    CAMPUS: "#F4D35E",
    LIBRARY: "#2F80ED",
    GUIDANCE: "#106A2E",
    LOSTFOUND: "#E0A400",
    CLINIC: "#DC2626",
};

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-emerald-100";

/* ---------- date helpers (local time, avoids timezone shifting) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const keyToDate = (k) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d);
};
const dateToKey = (dt) => toKey(dt.getFullYear(), dt.getMonth(), dt.getDate());

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAYS_3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatShort = (k) =>
    keyToDate(k).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatLong = (k) =>
    keyToDate(k).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${pad(m)} ${ap}`;
};

const timeRange = (ev) => {
    if (!ev.startTime) return "";
    const s = formatTime(ev.startTime.slice(0, 5));
    return ev.endTime ? `${s} – ${formatTime(ev.endTime.slice(0, 5))}` : s;
};

// Expands eventDate..endDate into a list of days (fallback for old events without eventDates)
const expandRange = (start, end) => {
    const out = [];
    const s = keyToDate(start);
    const e = keyToDate(end);
    for (let d = new Date(s), i = 0; d <= e && i < 366; d.setDate(d.getDate() + 1), i++) {
        out.push(dateToKey(d));
    }
    return out;
};

// All the days an event happens on, as sorted "YYYY-MM-DD" keys.
const getEventDates = (ev) => {
    let dates = [];
    if (Array.isArray(ev.eventDates) && ev.eventDates.length) {
        dates = ev.eventDates.map((d) => String(d).slice(0, 10));
    } else if (ev.eventDate) {
        const start = ev.eventDate.slice(0, 10);
        const end = ev.endDate ? ev.endDate.slice(0, 10) : start;
        dates = expandRange(start, end);
    }
    return [...new Set(dates)].sort();
};

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/* ---------- Registrar email template ---------- */
// Registrar's Office address used by the "Email Registrar" action.
const REGISTRAR_EMAIL = "info@pnm.edu.ph";

// Builds the subject/body of the registrar inquiry about the upcoming events.
const buildRegistrarMessage = (upcomingList) => {
    // remove duplicates (multi-day events)
    const seen = new Set();
    const unique = upcomingList.filter(({ ev }) => {
        if (seen.has(ev.id)) return false;
        seen.add(ev.id);
        return true;
    });
    const picked = unique.slice(0, 3);

    const subject = picked.length
        ? `Inquiry: ${picked[0].ev.title} (${formatShort(picked[0].k)})`
        : "Inquiry: School Calendar of Events";

    const eventLines = picked.length
        ? picked.map(({ k, ev }) => {
              const parts = [ev.title, formatShort(k)];
              if (timeRange(ev)) parts.push(timeRange(ev));
              if (ev.location) parts.push(ev.location);
              return `- ${parts.join(" | ")}`;
          })
        : ["- (No upcoming events listed yet)"];

    const body = [
        "Good day, Registrar's Office,",
        "",
        "I would like to inquire about the latest School Calendar of Events that is now available to the public:",
        "",
        ...eventLines,
        "",
        "May I request additional details or confirmation regarding the above?",
        "",
        "Thank you very much.",
        "",
        "Name:",
        "Contact Number:",
    ].join("\r\n");

    return { to: REGISTRAR_EMAIL, subject, body };
};

const buildMailto = ({ to, subject, body }) =>
    `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const buildGmailCompose = ({ to, subject, body }) =>
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(
        subject
    )}&body=${encodeURIComponent(body)}`;

/* Review the registrar email before sending it. A bare `mailto:` link fails
   silently on devices with no mail app configured (Android PWA, Windows
   without a mail client), so the admin gets a copyable draft and a webmail
   fallback here instead. */
function RegistrarEmailModal({ message, onClose }) {
    const [subject, setSubject] = useState(message.subject);
    const [body, setBody] = useState(message.body);
    const [copied, setCopied] = useState(false);

    const draft = { to: message.to, subject, body };

    const copyDraft = async () => {
        const text = `To: ${draft.to}\nSubject: ${subject}\n\n${body}`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("Email copied to clipboard.");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Could not copy automatically — select the text and copy it.");
        }
    };

    const openIn = (href) => {
        // The mailto draft is opened by the OS; a web compose link in a new tab.
        window.open(href, href.startsWith("mailto:") ? "_self" : "_blank", "noopener,noreferrer");
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Email the registrar"
        >
            <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#106A2E]">
                            <Mail size={18} />
                        </span>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Email the Registrar</h2>
                            <p className="mt-0.5 text-xs text-slate-400">
                                Review the draft, then send it with your mail app or webmail.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 overflow-y-auto px-5 py-5">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="email"
                                value={draft.to}
                                readOnly
                                className={`${inputClass} bg-slate-50 text-slate-500`}
                            />
                            <button
                                type="button"
                                onClick={copyDraft}
                                title="Copy the whole draft"
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Message</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={10}
                            className={`${inputClass} font-mono text-xs leading-relaxed`}
                        />
                    </div>

                    <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
                        If no mail app opens, use <span className="font-semibold">Copy</span> and paste the
                        draft into your email, or continue in Gmail.
                    </p>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => openIn(buildGmailCompose(draft))}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <ExternalLink size={14} /> Open in Gmail
                    </button>
                    <button
                        type="button"
                        onClick={() => openIn(buildMailto(draft))}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] px-3 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-900/20 hover:opacity-90"
                    >
                        <Mail size={14} /> Open in mail app
                    </button>
                </div>
            </div>
        </div>
    );
}

const getExt = (name = "") => {
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i).toLowerCase() : "";
};

/* =====================================================================
   IMPORT: file parsing (xlsx / csv / ics) -> normalized events
   ===================================================================== */

const IMPORT_EXTENSIONS = [".xlsx", ".xls", ".csv", ".ics"];
const MAX_IMPORT_MB = 5;

const IMPORT_FIELDS = [
    { key: "title", label: "Title", required: true },
    { key: "startDate", label: "Date / Start date", required: true },
    { key: "endDate", label: "End date" },
    { key: "startTime", label: "Start time" },
    { key: "endTime", label: "End time" },
    { key: "location", label: "Location" },
    { key: "category", label: "Category" },
    { key: "description", label: "Description" },
];

// Header patterns, tried in order. Fields are matched in FIELD_ORDER so that
// "End Date" is claimed before the generic "Date" pattern can grab it.
const FIELD_PATTERNS = {
    title: [
        /^(title|event|event title|event name|activity|activities|name|program)s?$/i,
        /^(?!.*(date|time|loc|venue|desc|detail)).*(title|event|activit|name)/i,
    ],
    endDate: [/^(end(ing)?\s*date|date to|to|until)$/i, /end.*date/i],
    startDate: [/^(start(ing)?\s*date|date from|from)$/i, /^dates?$/i, /start.*date|date/i],
    endTime: [/^(end(ing)?\s*time|time to)$/i, /end.*time/i],
    startTime: [/^(start(ing)?\s*time|time from)$/i, /^time$/i, /start.*time|time/i],
    location: [/location|venue|place|where/i],
    category: [/category|tag|type|office|department/i],
    description: [/desc|detail|remark|note/i],
};
const FIELD_ORDER = ["title", "endDate", "startDate", "endTime", "startTime", "location", "category", "description"];

const autoDetectMapping = (headers) => {
    const mapping = {};
    const used = new Set();
    FIELD_ORDER.forEach((field) => {
        mapping[field] = -1;
        for (const pattern of FIELD_PATTERNS[field]) {
            const idx = headers.findIndex((h, i) => !used.has(i) && pattern.test(h));
            if (idx >= 0) {
                mapping[field] = idx;
                used.add(idx);
                break;
            }
        }
    });
    return mapping;
};

// Finds the header row (calendars often have title rows above the table).
const findHeaderRow = (rows) => {
    const limit = Math.min(rows.length, 15);
    const allPatterns = Object.values(FIELD_PATTERNS).flat();

    for (let i = 0; i < limit; i++) {
        const hits = rows[i].filter((c) => {
            const s = String(c ?? "").trim();
            return s && allPatterns.some((p) => p.test(s));
        }).length;
        if (hits >= 2) return i;
    }
    for (let i = 0; i < limit; i++) {
        if (rows[i].filter((c) => String(c ?? "").trim()).length >= 2) return i;
    }
    return 0;
};

const buildSheet = (name, aoa) => {
    if (!aoa.length) return null;
    const hi = findHeaderRow(aoa);
    const headerRow = aoa[hi] || [];
    const body = aoa.slice(hi + 1);
    const width = Math.max(headerRow.length, ...body.map((r) => r.length), 0);
    if (!width || !body.length) return null;

    const headers = Array.from({ length: width }, (_, i) => {
        const h = String(headerRow[i] ?? "").trim();
        return h || `Column ${i + 1}`;
    });
    const rows = body.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ""));
    return { name, headers, rows };
};

function parseCsv(text) {
    const clean = text.replace(/^\uFEFF/, "");
    const firstLine = clean.split(/\r?\n/)[0] || "";
    const delim = [",", ";", "\t"]
        .map((d) => [d, firstLine.split(d).length])
        .sort((a, b) => b[1] - a[1])[0][0];

    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < clean.length; i++) {
        const ch = clean[i];
        if (inQuotes) {
            if (ch === '"') {
                if (clean[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                cur += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === delim) {
            row.push(cur);
            cur = "";
        } else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && clean[i + 1] === "\n") i++;
            row.push(cur);
            cur = "";
            rows.push(row);
            row = [];
        } else {
            cur += ch;
        }
    }
    if (cur !== "" || row.length) {
        row.push(cur);
        rows.push(row);
    }
    return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

// .ics -> same tabular shape as a spreadsheet so the rest of the flow is shared.
function parseIcsToSheets(text) {
    const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
    const unescape = (s = "") =>
        s.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");

    const parseIcsDate = (val) => {
        const m = String(val || "").match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/);
        if (!m) return null;
        let [, y, mo, d, hh, mm] = m;
        y = Number(y);
        mo = Number(mo);
        d = Number(d);
        if (hh === undefined) return { key: toKey(y, mo - 1, d), time: "" };
        if (m[7]) {
            const local = new Date(Date.UTC(y, mo - 1, d, Number(hh), Number(mm)));
            return { key: dateToKey(local), time: `${pad(local.getHours())}:${pad(local.getMinutes())}` };
        }
        return { key: toKey(y, mo - 1, d), time: `${hh}:${mm}` };
    };

    const events = [];
    let cur = null;

    lines.forEach((line) => {
        if (line === "BEGIN:VEVENT") cur = {};
        else if (line === "END:VEVENT") {
            if (cur) events.push(cur);
            cur = null;
        } else if (cur) {
            const idx = line.indexOf(":");
            if (idx < 0) return;
            const name = line.slice(0, idx).split(";")[0].toUpperCase();
            cur[name] = line.slice(idx + 1);
        }
    });

    const rows = events.map((e) => {
        const start = parseIcsDate(e.DTSTART);
        const end = parseIcsDate(e.DTEND);
        let endKey = "";

        if (start && end) {
            if (!start.time && end.key > start.key) {
                // all-day DTEND is exclusive
                const d = keyToDate(end.key);
                d.setDate(d.getDate() - 1);
                endKey = dateToKey(d);
            } else {
                endKey = end.key;
            }
            if (endKey === start.key) endKey = "";
        }

        return [
            unescape(e.SUMMARY),
            unescape(e.DESCRIPTION),
            start?.key || "",
            endKey,
            start?.time || "",
            end?.time || "",
            unescape(e.LOCATION),
            unescape(e.CATEGORIES),
        ];
    });

    if (!rows.length) return [];
    return [
        {
            name: "Calendar",
            headers: ["Title", "Description", "Start Date", "End Date", "Start Time", "End Time", "Location", "Category"],
            rows,
        },
    ];
}

async function readFileToSheets(file) {
    const ext = getExt(file.name);

    if (ext === ".csv") {
        const sheet = buildSheet("Sheet 1", parseCsv(await file.text()));
        return sheet ? [sheet] : [];
    }
    if (ext === ".ics") {
        return parseIcsToSheets(await file.text());
    }

    // .xlsx / .xls - loaded on demand so it doesn't weigh on the initial bundle
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    return wb.SheetNames.map((name) =>
        buildSheet(
            name,
            XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: "", blankrows: false })
        )
    ).filter(Boolean);
}

/* ---------- cell parsers ---------- */
const MONTH_RE =
    "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const MONTH_INDEX = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const monthIdx = (name) => MONTH_INDEX[name.slice(0, 3).toLowerCase()];

const mkKey = (y, m, d) => {
    const dt = new Date(y, m, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;
    return toKey(y, m, d);
};

const SEP = "(?:-|to|until)";
const ORD = "(?:st|nd|rd|th)?";
const RANGE_PATTERNS = {
    // Oct 26-28, 2026
    r1: new RegExp(`^(${MONTH_RE})\\.?\\s+(\\d{1,2})${ORD}\\s*${SEP}\\s*(\\d{1,2})${ORD}(?:,?\\s*(\\d{4}))?$`, "i"),
    // Oct 26 - Nov 2, 2026   |   Oct 26, 2026 - Oct 28, 2026
    r2: new RegExp(
        `^(${MONTH_RE})\\.?\\s+(\\d{1,2})${ORD}(?:,?\\s*(\\d{4}))?\\s*${SEP}\\s*(${MONTH_RE})\\.?\\s+(\\d{1,2})${ORD}(?:,?\\s*(\\d{4}))?$`,
        "i"
    ),
    // 26-28 October 2026
    r3: new RegExp(`^(\\d{1,2})${ORD}\\s*${SEP}\\s*(\\d{1,2})${ORD}\\s+(${MONTH_RE})\\.?(?:,?\\s*(\\d{4}))?$`, "i"),
    // 26 Oct - 2 Nov 2026
    r4: new RegExp(
        `^(\\d{1,2})${ORD}\\s+(${MONTH_RE})\\.?(?:,?\\s*(\\d{4}))?\\s*${SEP}\\s*(\\d{1,2})${ORD}\\s+(${MONTH_RE})\\.?(?:,?\\s*(\\d{4}))?$`,
        "i"
    ),
};
const SINGLE_PATTERNS = {
    text1: new RegExp(`^(${MONTH_RE})\\.?\\s+(\\d{1,2})${ORD}(?:,?\\s*(\\d{4}))?$`, "i"),
    text2: new RegExp(`^(\\d{1,2})${ORD}\\s+(${MONTH_RE})\\.?(?:,?\\s*(\\d{4}))?$`, "i"),
};

function parseSingleDate(s, defYear) {
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
    if (m) return mkKey(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

    m = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})$/);
    if (m) {
        let a = Number(m[1]);
        let b = Number(m[2]);
        let y = Number(m[3]);
        if (y < 100) y += 2000;
        // month-first unless the first number can't be a month
        return a > 12 ? mkKey(y, b - 1, a) : mkKey(y, a - 1, b);
    }

    m = s.match(SINGLE_PATTERNS.text1);
    if (m) return mkKey(m[3] ? Number(m[3]) : defYear, monthIdx(m[1]), Number(m[2]));

    m = s.match(SINGLE_PATTERNS.text2);
    if (m) return mkKey(m[3] ? Number(m[3]) : defYear, monthIdx(m[2]), Number(m[1]));

    return null;
}

// -> { start, end } as "YYYY-MM-DD" keys, or null when the date isn't understood.
function parseDateCell(value, defYear) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const k = dateToKey(value);
        return { start: k, end: k };
    }

    if (typeof value === "number") {
        if (value > 20000 && value < 80000) {
            // Excel serial date
            const d = new Date(Math.round((value - 25569) * 86400000));
            const k = mkKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
            return k ? { start: k, end: k } : null;
        }
        return null;
    }

    let s = String(value ?? "").trim();
    if (!s) return null;
    s = s
        .replace(/[–—]/g, "-")
        .replace(/\s+/g, " ")
        .replace(/^(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,?\s+/i, "");

    let m = s.match(RANGE_PATTERNS.r1);
    if (m) {
        const y = m[4] ? Number(m[4]) : defYear;
        const mo = monthIdx(m[1]);
        const a = mkKey(y, mo, Number(m[2]));
        const b = mkKey(y, mo, Number(m[3]));
        return a && b ? { start: a, end: b >= a ? b : a } : null;
    }

    m = s.match(RANGE_PATTERNS.r2);
    if (m) {
        const m1 = monthIdx(m[1]);
        const m2 = monthIdx(m[4]);
        const y1 = m[3] ? Number(m[3]) : m[6] ? Number(m[6]) : defYear;
        let y2 = m[6] ? Number(m[6]) : y1;
        if (!m[6] && !m[3] && m2 < m1) y2 = y1 + 1;
        const a = mkKey(y1, m1, Number(m[2]));
        const b = mkKey(y2, m2, Number(m[5]));
        return a && b ? { start: a, end: b >= a ? b : a } : null;
    }

    m = s.match(RANGE_PATTERNS.r3);
    if (m) {
        const y = m[4] ? Number(m[4]) : defYear;
        const mo = monthIdx(m[3]);
        const a = mkKey(y, mo, Number(m[1]));
        const b = mkKey(y, mo, Number(m[2]));
        return a && b ? { start: a, end: b >= a ? b : a } : null;
    }

    m = s.match(RANGE_PATTERNS.r4);
    if (m) {
        const m1 = monthIdx(m[2]);
        const m2 = monthIdx(m[5]);
        const y1 = m[3] ? Number(m[3]) : m[6] ? Number(m[6]) : defYear;
        let y2 = m[6] ? Number(m[6]) : y1;
        if (!m[6] && !m[3] && m2 < m1) y2 = y1 + 1;
        const a = mkKey(y1, m1, Number(m[1]));
        const b = mkKey(y2, m2, Number(m[4]));
        return a && b ? { start: a, end: b >= a ? b : a } : null;
    }

    const parts = s.split(/\s+(?:-|to|until)\s+/i);
    if (parts.length === 2) {
        const a = parseSingleDate(parts[0].trim(), defYear);
        const b = parseSingleDate(parts[1].trim(), defYear);
        if (a && b) return { start: a, end: b >= a ? b : a };
    }

    const single = parseSingleDate(s, defYear);
    return single ? { start: single, end: single } : null;
}

const to24 = (h, min, ap) => {
    let hh = Number(h);
    const mm = Number(min);
    if (ap === "p" && hh < 12) hh += 12;
    if (ap === "a" && hh === 12) hh = 0;
    if (hh > 23 || mm > 59) return "";
    return `${pad(hh)}:${pad(mm)}`;
};

// "8:00 AM", "08:00", "8AM", "8:00 AM - 10:00 AM", or an Excel time fraction.
function parseTimeCell(value) {
    const empty = { start: "", end: "" };

    if (typeof value === "number") {
        if (value >= 0 && value < 1) {
            const mins = Math.round(value * 1440);
            return { start: `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`, end: "" };
        }
        return empty;
    }

    const s = String(value ?? "").trim();
    if (!s) return empty;

    const found = [
        ...s.matchAll(/(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)?|(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)/gi),
    ]
        .slice(0, 2)
        .map((m) => ({
            h: m[1] ?? m[4],
            min: m[2] ?? "00",
            ap: (m[3] ?? m[5] ?? "").toLowerCase().charAt(0),
        }));

    if (!found.length) return empty;

    if (found.length === 2 && !found[0].ap && found[1].ap) {
        found[0].ap = found[1].ap;
        // "11:00 - 1:00 PM" -> start is AM
        if (found[1].ap === "p" && Number(found[0].h) % 12 > Number(found[1].h) % 12) found[0].ap = "a";
    }

    return {
        start: to24(found[0].h, found[0].min, found[0].ap),
        end: found[1] ? to24(found[1].h, found[1].min, found[1].ap) : "",
    };
}

const mapTag = (text, fallback) => {
    const t = String(text ?? "").toLowerCase();
    if (!t.trim()) return fallback;
    if (/librar/.test(t)) return "LIBRARY";
    if (/guidance|counsel/.test(t)) return "GUIDANCE";
    if (/lost|found/.test(t)) return "LOSTFOUND";
    if (/clinic|health|medical/.test(t)) return "CLINIC";
    if (/campus|academic|school|college/.test(t)) return "CAMPUS";
    return fallback;
};

// Turns spreadsheet rows into import candidates using the chosen column mapping.
function normalizeRows(sheet, mapping, defYear, defTag, existingKeys) {
    const cell = (row, idx) => (idx >= 0 ? row[idx] : "");
    const items = [];

    sheet.rows.forEach((row, index) => {
        const title = String(cell(row, mapping.title) ?? "").trim();
        const startCell = cell(row, mapping.startDate);
        const startText = String(startCell ?? "").trim();

        if (!title && !startText) return; // blank row

        const sRange = parseDateCell(startCell, defYear);
        const endCell = cell(row, mapping.endDate);
        const eRange = String(endCell ?? "").trim() ? parseDateCell(endCell, defYear) : null;

        let dates = [];
        if (sRange) {
            const endKey = eRange ? eRange.end : sRange.end;
            dates = endKey > sRange.start ? expandRange(sRange.start, endKey) : [sRange.start];
        }

        let startTime = "";
        let endTime = "";
        if (mapping.startTime >= 0) {
            const t = parseTimeCell(cell(row, mapping.startTime));
            startTime = t.start;
            endTime = t.end;
        }
        if (mapping.endTime >= 0) {
            const t = parseTimeCell(cell(row, mapping.endTime));
            if (t.start) endTime = t.start;
        }
        if (!startTime || (endTime && endTime <= startTime)) endTime = "";

        let error = "";
        if (!title) error = "Missing title";
        else if (!startText) error = "Missing date";
        else if (!sRange) error = "Date not recognized";

        const tag = mapTag(cell(row, mapping.category), defTag);
        const duplicate =
            !error && existingKeys.has(`${title.toLowerCase()}|${dates.join(",")}`);

        items.push({
            id: index,
            title,
            description: String(cell(row, mapping.description) ?? "").trim(),
            dates,
            startTime,
            endTime,
            location: String(cell(row, mapping.location) ?? "").trim(),
            tag,
            accent: TAG_ACCENT[tag] || TAG_ACCENT.CAMPUS,
            error,
            duplicate,
            ok: !error,
        });
    });

    return items;
}

const buildEventBody = (it) => {
    const sorted = [...it.dates].sort();
    return {
        title: it.title,
        description: it.description || null,
        // kept for backward compatibility with the existing backend
        eventDate: sorted[0],
        endDate: sorted.length > 1 ? sorted[sorted.length - 1] : null,
        eventDates: sorted,
        startTime: it.startTime || null,
        endTime: it.endTime || null,
        location: it.location || null,
        tag: it.tag,
        accent: it.accent,
    };
};

const describeImportDates = (dates) => {
    if (!dates.length) return "—";
    if (dates.length === 1) return formatShort(dates[0]);
    return `${formatShort(dates[0])} – ${formatShort(dates[dates.length - 1])} (${dates.length} days)`;
};

const downloadTemplate = () => {
    const csv = [
        "Title,Description,Start Date,End Date,Start Time,End Time,Location,Category",
        "Foundation Day,Annual celebration,2026-11-15,,08:00,17:00,Campus Grounds,Campus",
        "Final Examinations,End-of-semester exams,2026-12-10,2026-12-14,,,,Campus",
    ].join("\r\n");
    downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), "cdm-calendar-import-template.csv");
};

/* ---------- Import dialog ---------- */
function ImportModal({ events, onClose, onImported }) {
    const [step, setStep] = useState("pick"); // pick | preview | importing | done
    const [parsing, setParsing] = useState(false);
    const [parseError, setParseError] = useState("");
    const [dragging, setDragging] = useState(false);

    const [fileName, setFileName] = useState("");
    const [sheets, setSheets] = useState([]);
    const [sheetIndex, setSheetIndex] = useState(0);
    const [mapping, setMapping] = useState({});
    const [defYear, setDefYear] = useState(new Date().getFullYear());
    const [defTag, setDefTag] = useState("CAMPUS");
    const [overrides, setOverrides] = useState({}); // id -> checked

    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [result, setResult] = useState({ ok: 0, failed: [] });

    const busy = step === "importing";

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape" && !busy) onClose();
        };
        const previousOverflow = document.body.style.overflow;
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [busy, onClose]);

    const sheet = sheets[sheetIndex];

    const existingKeys = useMemo(
        () =>
            new Set(
                events.map((ev) => `${(ev.title || "").trim().toLowerCase()}|${getEventDates(ev).join(",")}`)
            ),
        [events]
    );

    const items = useMemo(
        () => (sheet ? normalizeRows(sheet, mapping, Number(defYear) || new Date().getFullYear(), defTag, existingKeys) : []),
        [sheet, mapping, defYear, defTag, existingKeys]
    );

    const isChecked = (it) => (it.id in overrides ? overrides[it.id] : it.ok && !it.duplicate);
    const selectable = items.filter((i) => i.ok);
    const allChecked = selectable.length > 0 && selectable.every(isChecked);
    const toImport = items.filter((i) => i.ok && isChecked(i));

    const counts = {
        ready: items.filter((i) => i.ok && !i.duplicate).length,
        duplicate: items.filter((i) => i.duplicate).length,
        error: items.filter((i) => !i.ok).length,
    };

    const handleFile = async (file) => {
        if (!file || parsing) return;
        setParseError("");

        if (!IMPORT_EXTENSIONS.includes(getExt(file.name))) {
            setParseError("Unsupported file. Use an Excel (.xlsx), CSV (.csv) or calendar (.ics) file.");
            return;
        }
        if (file.size > MAX_IMPORT_MB * 1024 * 1024) {
            setParseError(`File is larger than ${MAX_IMPORT_MB} MB.`);
            return;
        }

        setParsing(true);
        try {
            const parsed = await readFileToSheets(file);
            if (!parsed.length) {
                throw new Error(
                    "No rows found. Make sure the file has column headers such as Title and Date."
                );
            }
            setSheets(parsed);
            setSheetIndex(0);
            setMapping(autoDetectMapping(parsed[0].headers));
            setOverrides({});
            setFileName(file.name);
            setStep("preview");
        } catch (err) {
            setParseError(err?.message || "Unable to read this file.");
        } finally {
            setParsing(false);
        }
    };

    const changeSheet = (i) => {
        setSheetIndex(i);
        setMapping(autoDetectMapping(sheets[i].headers));
        setOverrides({});
    };

    const changeMapping = (key, value) => {
        setMapping((m) => ({ ...m, [key]: Number(value) }));
        setOverrides({});
    };

    const toggleAll = () => {
        const next = {};
        selectable.forEach((i) => {
            next[i.id] = !allChecked;
        });
        setOverrides((o) => ({ ...o, ...next }));
    };

    const runImport = async () => {
        const list = toImport;
        if (!list.length) return;

        setStep("importing");
        setProgress({ done: 0, total: list.length });

        const failed = [];
        let ok = 0;
        let earliest = null;

        for (let i = 0; i < list.length; i++) {
            const it = list[i];
            try {
                const res = await fetch(API_BASE, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...authHeaders() },
                    body: JSON.stringify(buildEventBody(it)),
                });
                if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    throw new Error(d.message || `Error ${res.status}`);
                }
                ok += 1;
                if (!earliest || it.dates[0] < earliest) earliest = it.dates[0];
            } catch (err) {
                failed.push({ title: it.title, message: err?.message || "Failed" });
            }
            setProgress({ done: i + 1, total: list.length });
        }

        setResult({ ok, failed });
        if (ok) onImported(earliest);

        if (failed.length === 0) {
            toast.success(`${ok} event${ok === 1 ? "" : "s"} imported.`);
            onClose();
        } else {
            setStep("done");
        }
    };

    const dropHandlers = {
        onDragOver: (e) => {
            e.preventDefault();
            setDragging(true);
        },
        onDragLeave: () => setDragging(false),
        onDrop: (e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer?.files?.[0]);
        },
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !busy) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Import calendar"
        >
            <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-3xl sm:rounded-2xl">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#106A2E]">
                            <UploadCloud size={18} />
                        </span>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Import calendar</h2>
                            <p className="mt-0.5 text-xs text-slate-400">
                                {step === "pick" && "Add school events and academic dates from a file"}
                                {step === "preview" && `Review before importing · ${fileName}`}
                                {step === "importing" && "Importing events..."}
                                {step === "done" && "Import finished"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Step 1: pick a file */}
                {step === "pick" && (
                    <div className="overflow-y-auto px-5 py-5">
                        <div
                            {...dropHandlers}
                            className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                                dragging ? "border-[#106A2E] bg-emerald-50/60" : "border-slate-200 bg-slate-50/50"
                            }`}
                        >
                            {parsing ? (
                                <Loader2 size={30} className="animate-spin text-[#106A2E]" />
                            ) : (
                                <UploadCloud size={30} className="text-[#106A2E]" />
                            )}
                            <p className="mt-3 text-sm font-medium text-slate-700">
                                {parsing ? "Reading file..." : "Drag and drop your file here"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Excel (.xlsx), CSV (.csv) or calendar (.ics) · up to {MAX_IMPORT_MB} MB
                            </p>

                            <label className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition hover:opacity-90">
                                <FileSpreadsheet size={15} />
                                Choose file
                                <input
                                    type="file"
                                    accept={IMPORT_EXTENSIONS.join(",")}
                                    className="hidden"
                                    disabled={parsing}
                                    onChange={(e) => {
                                        handleFile(e.target.files?.[0]);
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                        </div>

                        {parseError && (
                            <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">
                                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                {parseError}
                            </p>
                        )}

                        <div className="mt-5 space-y-2 text-xs text-slate-500">
                            <p>
                                <span className="font-medium text-slate-600">Columns we look for:</span>{" "}
                                Title, Date (or Start/End date), Start/End time, Location, Category, Description.
                                Dates like <em>2026-11-15</em>, <em>11/15/2026</em>, <em>November 15, 2026</em> or
                                ranges like <em>Dec 10-14, 2026</em> are understood. You can fix the column
                                matching on the next screen.
                            </p>
                            <p>
                                Have a PDF? Convert it to Excel or CSV first — PDFs can&apos;t be read reliably.
                            </p>
                            <button
                                type="button"
                                onClick={downloadTemplate}
                                className="inline-flex items-center gap-1.5 font-medium text-[#106A2E] hover:underline"
                            >
                                <Download size={13} /> Download CSV template
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: preview */}
                {step === "preview" && sheet && (
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        {/* Summary */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-[#0E3B22]">
                                {counts.ready} ready
                            </span>
                            {counts.duplicate > 0 && (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                                    {counts.duplicate} already in calendar
                                </span>
                            )}
                            {counts.error > 0 && (
                                <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-600">
                                    {counts.error} with problems
                                </span>
                            )}
                            {sheets.length > 1 && (
                                <label className="ml-auto flex items-center gap-2 text-slate-500">
                                    Sheet
                                    <select
                                        value={sheetIndex}
                                        onChange={(e) => changeSheet(Number(e.target.value))}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#106A2E]"
                                    >
                                        {sheets.map((s, i) => (
                                            <option key={s.name} value={i}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                        </div>

                        {/* Column matching */}
                        <details className="mt-3 rounded-xl border border-slate-200" open={!mapping.title || mapping.title < 0 || mapping.startDate < 0}>
                            <summary className="cursor-pointer select-none px-3.5 py-2.5 text-xs font-semibold text-slate-700">
                                Column matching
                                <span className="ml-2 font-normal text-slate-400">
                                    check that each field points to the right column
                                </span>
                            </summary>
                            <div className="grid gap-3 border-t border-slate-100 px-3.5 py-3 sm:grid-cols-2">
                                {IMPORT_FIELDS.map((f) => (
                                    <label key={f.key} className="block">
                                        <span className="mb-1 block text-[11px] font-medium text-slate-500">
                                            {f.label}
                                            {f.required && <span className="text-red-500"> *</span>}
                                        </span>
                                        <select
                                            value={mapping[f.key] ?? -1}
                                            onChange={(e) => changeMapping(f.key, e.target.value)}
                                            className={`w-full rounded-lg border bg-white px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-[#106A2E] ${
                                                f.required && (mapping[f.key] ?? -1) < 0
                                                    ? "border-red-300"
                                                    : "border-slate-200"
                                            }`}
                                        >
                                            <option value={-1}>— not in file —</option>
                                            {sheet.headers.map((h, i) => (
                                                <option key={`${h}-${i}`} value={i}>
                                                    {h}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                ))}
                            </div>

                            <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 px-3.5 py-3">
                                <label className="block">
                                    <span className="mb-1 block text-[11px] font-medium text-slate-500">
                                        Default year
                                    </span>
                                    <input
                                        type="number"
                                        min={2000}
                                        max={2100}
                                        value={defYear}
                                        onChange={(e) => setDefYear(e.target.value)}
                                        className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-[#106A2E]"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-[11px] font-medium text-slate-500">
                                        Default category
                                    </span>
                                    <select
                                        value={defTag}
                                        onChange={(e) => setDefTag(e.target.value)}
                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-[#106A2E]"
                                    >
                                        {Object.entries(TAG_LABELS).map(([k, v]) => (
                                            <option key={k} value={k}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <p className="pb-2 text-[11px] text-slate-400">
                                    The year is used for dates that don&apos;t include one.
                                </p>
                            </div>
                        </details>

                        {/* Rows */}
                        {items.length === 0 ? (
                            <p className="py-10 text-center text-sm text-slate-400">
                                No usable rows with the current column matching.
                            </p>
                        ) : (
                            <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[620px] border-collapse text-left text-xs">
                                    <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                                        <tr>
                                            <th className="w-9 px-3 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={allChecked}
                                                    onChange={toggleAll}
                                                    disabled={!selectable.length}
                                                    aria-label="Select all"
                                                    className="accent-[#106A2E]"
                                                />
                                            </th>
                                            <th className="px-2 py-2 font-medium">Title</th>
                                            <th className="px-2 py-2 font-medium">Date</th>
                                            <th className="px-2 py-2 font-medium">Time</th>
                                            <th className="px-2 py-2 font-medium">Location</th>
                                            <th className="px-2 py-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((it) => (
                                            <tr key={it.id} className={it.ok ? "" : "bg-red-50/40"}>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={it.ok && isChecked(it)}
                                                        disabled={!it.ok}
                                                        onChange={(e) =>
                                                            setOverrides((o) => ({ ...o, [it.id]: e.target.checked }))
                                                        }
                                                        aria-label={`Import ${it.title || "row"}`}
                                                        className="accent-[#106A2E]"
                                                    />
                                                </td>
                                                <td className="max-w-[200px] px-2 py-2">
                                                    <span className="block truncate font-medium text-slate-700" title={it.title}>
                                                        {it.title || "—"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {TAG_LABELS[it.tag]}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-2 text-slate-600">
                                                    {it.ok ? describeImportDates(it.dates) : "—"}
                                                </td>
                                                <td className="px-2 py-2 text-slate-600">
                                                    {it.startTime
                                                        ? `${formatTime(it.startTime)}${it.endTime ? ` – ${formatTime(it.endTime)}` : ""}`
                                                        : "—"}
                                                </td>
                                                <td className="max-w-[140px] truncate px-2 py-2 text-slate-600" title={it.location}>
                                                    {it.location || "—"}
                                                </td>
                                                <td className="px-2 py-2">
                                                    {!it.ok ? (
                                                        <span className="font-medium text-red-600">{it.error}</span>
                                                    ) : it.duplicate ? (
                                                        <span className="font-medium text-amber-600">Already exists</span>
                                                    ) : (
                                                        <span className="font-medium text-[#106A2E]">Ready</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: importing */}
                {step === "importing" && (
                    <div className="px-5 py-12 text-center">
                        <Loader2 size={30} className="mx-auto animate-spin text-[#106A2E]" />
                        <p className="mt-3 text-sm font-medium text-slate-700">
                            Importing {progress.done} of {progress.total}...
                        </p>
                        <div className="mx-auto mt-3 h-2 w-64 max-w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-[#106A2E] transition-all"
                                style={{
                                    width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%`,
                                }}
                            />
                        </div>
                        <p className="mt-3 text-xs text-slate-400">Please keep this window open.</p>
                    </div>
                )}

                {/* Step 4: finished with problems */}
                {step === "done" && (
                    <div className="overflow-y-auto px-5 py-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 size={20} className="mt-0.5 text-[#106A2E]" />
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    {result.ok} event{result.ok === 1 ? "" : "s"} imported
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {result.failed.length} could not be imported.
                                </p>
                            </div>
                        </div>
                        <ul className="mt-4 max-h-48 space-y-1.5 overflow-y-auto rounded-xl bg-red-50 p-3 text-xs text-red-700">
                            {result.failed.map((f, i) => (
                                <li key={i}>
                                    <span className="font-medium">{f.title}</span> — {f.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Footer */}
                {(step === "pick" || step === "preview" || step === "done") && (
                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
                        <div>
                            {step === "preview" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("pick");
                                        setParseError("");
                                    }}
                                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                                >
                                    Choose another file
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                            >
                                {step === "done" ? "Close" : "Cancel"}
                            </button>

                            {step === "preview" && (
                                <button
                                    type="button"
                                    onClick={runImport}
                                    disabled={toImport.length === 0}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition hover:opacity-90 disabled:opacity-50"
                                >
                                    <UploadCloud size={15} />
                                    Import {toImport.length} event{toImport.length === 1 ? "" : "s"}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------- Multi-date calendar (used in the edit form) ---------- */
function MultiDatePicker({ value, onChange }) {
    const initial = value.length ? keyToDate([...value].sort()[0]) : new Date();
    const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });

    const selected = useMemo(() => new Set(value), [value]);
    const todayKey = dateToKey(new Date());

    const firstDay = new Date(view.y, view.m, 1).getDay();
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const cells = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const shiftMonth = (delta) => {
        const d = new Date(view.y, view.m + delta, 1);
        setView({ y: d.getFullYear(), m: d.getMonth() });
    };

    const toggle = (day) => {
        const k = toKey(view.y, view.m, day);
        const next = new Set(selected);
        next.has(k) ? next.delete(k) : next.add(k);
        onChange([...next].sort());
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
                <button type="button" onClick={() => shiftMonth(-1)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Previous month">
                    <ChevronLeft size={16} className="text-slate-600" />
                </button>
                <p className="text-sm font-semibold text-slate-800">
                    {MONTHS[view.m]} {view.y}
                </p>
                <button type="button" onClick={() => shiftMonth(1)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Next month">
                    <ChevronRight size={16} className="text-slate-600" />
                </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-medium text-slate-400">
                {WEEKDAYS.map((w) => (
                    <div key={w} className="py-1">{w}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
                {cells.map((day, i) => {
                    if (!day) return <div key={`e${i}`} />;
                    const k = toKey(view.y, view.m, day);
                    const isSel = selected.has(k);
                    const isToday = k === todayKey;
                    return (
                        <button
                            key={k}
                            type="button"
                            onClick={() => toggle(day)}
                            aria-pressed={isSel}
                            className={[
                                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                                isSel
                                    ? "bg-[#106A2E] font-semibold text-white"
                                    : "text-slate-700 hover:bg-emerald-50",
                                isToday && !isSel ? "ring-1 ring-[#106A2E]" : "",
                            ].join(" ")}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            <div className="mt-3 border-t border-slate-100 pt-2">
                {value.length === 0 ? (
                    <p className="text-xs text-slate-400">Click one or more dates on the calendar.</p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {value.map((k) => (
                            <span key={k} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 py-1 pl-2.5 pr-1.5 text-xs text-[#0E3B22]">
                                {formatShort(k)}
                                <button
                                    type="button"
                                    onClick={() => onChange(value.filter((v) => v !== k))}
                                    className="rounded-full p-0.5 hover:bg-emerald-100"
                                    aria-label={`Remove ${formatShort(k)}`}
                                >
                                    <X size={11} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------- Month calendar widget ---------- */
function CalendarWidget({ view, setView, selectedKey, setSelectedKey, eventsByDate }) {
    const todayKey = dateToKey(new Date());

    const firstDay = new Date(view.y, view.m, 1).getDay();
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const total = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    const cells = Array.from({ length: total }, (_, i) => {
        const d = new Date(view.y, view.m, 1 - firstDay + i);
        return { key: dateToKey(d), day: d.getDate(), inMonth: d.getMonth() === view.m };
    });

    const shiftMonth = (delta) => {
        const d = new Date(view.y, view.m + delta, 1);
        setView({ y: d.getFullYear(), m: d.getMonth() });
    };

    const goToday = () => {
        const now = new Date();
        setView({ y: now.getFullYear(), m: now.getMonth() });
        setSelectedKey(todayKey);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-800">
                    {MONTHS[view.m]} {view.y}
                </h2>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={goToday}
                        className="mr-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Today
                    </button>
                    <button type="button" onClick={() => shiftMonth(-1)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Previous month">
                        <ChevronLeft size={18} className="text-slate-600" />
                    </button>
                    <button type="button" onClick={() => shiftMonth(1)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Next month">
                        <ChevronRight size={18} className="text-slate-600" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-100 pb-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {WEEKDAYS_3.map((w) => (
                    <div key={w}>{w}</div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {cells.map((c) => {
                    const dayEvents = eventsByDate.get(c.key) || [];
                    const isSelected = c.key === selectedKey;
                    const isToday = c.key === todayKey;

                    return (
                        <button
                            key={c.key}
                            type="button"
                            onClick={() => {
                                setSelectedKey(c.key);
                                if (!c.inMonth) {
                                    const d = keyToDate(c.key);
                                    setView({ y: d.getFullYear(), m: d.getMonth() });
                                }
                            }}
                            aria-pressed={isSelected}
                            aria-label={`${formatLong(c.key)}${dayEvents.length ? `, ${dayEvents.length} events` : ""}`}
                            className={[
                                "flex min-h-[56px] flex-col items-stretch gap-1 border-b border-r border-slate-100 p-1 text-left transition sm:min-h-[92px] sm:p-1.5",
                                isSelected ? "bg-emerald-50/70 ring-2 ring-inset ring-[#106A2E]" : "hover:bg-slate-50",
                                c.inMonth ? "" : "bg-slate-50/50",
                            ].join(" ")}
                        >
                            <span
                                className={[
                                    "flex h-6 w-6 items-center justify-center self-start rounded-full text-xs",
                                    isToday
                                        ? "bg-[#106A2E] font-semibold text-white"
                                        : c.inMonth
                                          ? "text-slate-700"
                                          : "text-slate-300",
                                ].join(" ")}
                            >
                                {c.day}
                            </span>

                            {/* Desktop: event chips */}
                            <div className="hidden flex-col gap-0.5 sm:flex">
                                {dayEvents.slice(0, 2).map((ev) => (
                                    <span
                                        key={ev.id}
                                        className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight text-slate-700"
                                        style={{
                                            background: `${ev.accent || "#F4D35E"}33`,
                                            borderLeft: `3px solid ${ev.accent || "#F4D35E"}`,
                                        }}
                                        title={ev.title}
                                    >
                                        {ev.title}
                                    </span>
                                ))}
                                {dayEvents.length > 2 && (
                                    <span className="px-1 text-[10px] font-medium text-slate-400">
                                        +{dayEvents.length - 2} more
                                    </span>
                                )}
                            </div>

                            {/* Mobile: dots */}
                            <div className="flex flex-wrap gap-0.5 px-0.5 sm:hidden">
                                {dayEvents.slice(0, 4).map((ev) => (
                                    <span
                                        key={ev.id}
                                        className="h-1.5 w-1.5 rounded-full"
                                        style={{ background: ev.accent || "#F4D35E" }}
                                    />
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    // Draft of the registrar email, frozen when the button is pressed.
    const [registrarDraft, setRegistrarDraft] = useState(null);

    const now = new Date();
    const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
    const [selectedKey, setSelectedKey] = useState(dateToKey(now));

    const loadEvents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(API_BASE, { headers: authHeaders() });
            if (!res.ok) throw new Error("Failed to load events");
            const data = await res.json();
            setEvents(Array.isArray(data) ? data : []);
        } catch (e) {
            toast.error(e.message || "Failed to load events");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    // date key -> events on that day (active events only)
    const eventsByDate = useMemo(() => {
        const map = new Map();
        events
            .filter((ev) => ev.isActive !== false)
            .forEach((ev) => {
                getEventDates(ev).forEach((k) => {
                    if (!map.has(k)) map.set(k, []);
                    map.get(k).push(ev);
                });
            });
        map.forEach((list) =>
            list.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
        );
        return map;
    }, [events]);

    const selectedEvents = eventsByDate.get(selectedKey) || [];

    const upcoming = useMemo(() => {
        const todayKey = dateToKey(new Date());
        return [...eventsByDate.entries()]
            .filter(([k]) => k >= todayKey)
            .sort(([a], [b]) => a.localeCompare(b))
            .flatMap(([k, list]) => list.map((ev) => ({ k, ev })))
            .slice(0, 5);
    }, [eventsByDate]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
    };

    const openEdit = (ev) => {
        setForm({
            title: ev.title || "",
            description: ev.description || "",
            dates: getEventDates(ev),
            startTime: ev.startTime ? ev.startTime.slice(0, 5) : "",
            endTime: ev.endTime ? ev.endTime.slice(0, 5) : "",
            location: ev.location || "",
            tag: ev.tag || "CAMPUS",
            accent: ev.accent || "#F4D35E",
        });
        setEditingId(ev.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || form.dates.length === 0) {
            toast.error("Title and at least one event date are required.");
            return;
        }
        if (form.startTime && form.endTime && form.endTime <= form.startTime) {
            toast.error("End time must be later than start time.");
            return;
        }
        setSaving(true);
        try {
            const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
            const method = editingId ? "PUT" : "POST";
            const sorted = [...form.dates].sort();
            const body = {
                title: form.title.trim(),
                description: form.description || null,
                // kept for backward compatibility with the existing backend
                eventDate: sorted[0],
                endDate: sorted.length > 1 ? sorted[sorted.length - 1] : null,
                // new fields
                eventDates: sorted,
                startTime: form.startTime || null,
                endTime: form.endTime || null,
                location: form.location || null,
                tag: form.tag,
                accent: form.accent,
            };
            if (editingId) body.isActive = true;
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.message || "Failed to save event");
            }
            toast.success(editingId ? "Event updated." : "Event created.");
            resetForm();
            await loadEvents();
        } catch (err) {
            toast.error(err.message || "Failed to save event");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this event?")) return;
        try {
            const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE", headers: authHeaders() });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Event deleted.");
            await loadEvents();
        } catch (err) {
            toast.error(err.message || "Failed to delete event");
        }
    };

    // After an import: reload, then jump the calendar to the earliest imported date.
    const handleImported = async (earliestKey) => {
        await loadEvents();
        if (earliestKey) {
            const d = keyToDate(earliestKey);
            setView({ y: d.getFullYear(), m: d.getMonth() });
            setSelectedKey(earliestKey);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F5EF] p-4 pb-24 md:pt-24">
            <div className="mx-auto max-w-5xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={20} className="text-[#106A2E]" />
                        <div>
                            <h1 className="text-lg font-semibold text-slate-800">Event Calendar</h1>
                            <p className="text-xs text-slate-400">School events and academic dates</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setRegistrarDraft(buildRegistrarMessage(upcoming))}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <Mail size={14} /> Email Registrar
                        </button>

                        <button
                            onClick={() => setImportOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-900/20 transition hover:opacity-90"
                        >
                            <UploadCloud size={14} /> Import
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-slate-400">Loading events...</div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                        <CalendarWidget
                            view={view}
                            setView={setView}
                            selectedKey={selectedKey}
                            setSelectedKey={setSelectedKey}
                            eventsByDate={eventsByDate}
                        />

                        <div className="space-y-4">
                            {/* Selected day */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Selected day
                                </p>
                                <h3 className="mt-0.5 text-sm font-semibold text-slate-800">
                                    {formatLong(selectedKey)}
                                </h3>

                                {selectedEvents.length === 0 ? (
                                    <p className="mt-3 text-sm text-slate-400">No events on this day.</p>
                                ) : (
                                    <ul className="mt-3 space-y-3">
                                        {selectedEvents.map((ev) => (
                                            <li
                                                key={ev.id}
                                                className="flex items-start gap-2.5 rounded-xl border border-slate-100 p-3"
                                                style={{ borderLeft: `4px solid ${ev.accent || "#F4D35E"}` }}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-slate-800">{ev.title}</p>
                                                    {ev.description && (
                                                        <p className="mt-0.5 text-xs text-slate-500">{ev.description}</p>
                                                    )}
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                                                        {timeRange(ev) && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <Clock size={12} /> {timeRange(ev)}
                                                            </span>
                                                        )}
                                                        {ev.location && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <MapPin size={12} /> {ev.location}
                                                            </span>
                                                        )}
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                                            {TAG_LABELS[ev.tag] || ev.tag}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 gap-0.5">
                                                    <button
                                                        onClick={() => openEdit(ev)}
                                                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                                                        aria-label={`Edit ${ev.title}`}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(ev.id)}
                                                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                                        aria-label={`Delete ${ev.title}`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Upcoming */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Upcoming
                                </p>

                                {upcoming.length === 0 ? (
                                    <p className="mt-3 text-sm text-slate-400">
                                        No upcoming events. Use Import to add the school calendar.
                                    </p>
                                ) : (
                                    <ul className="mt-2 divide-y divide-slate-100">
                                        {upcoming.map(({ k, ev }) => (
                                            <li key={`${ev.id}-${k}`}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const d = keyToDate(k);
                                                        setView({ y: d.getFullYear(), m: d.getMonth() });
                                                        setSelectedKey(k);
                                                    }}
                                                    className="flex w-full items-center gap-2.5 py-2.5 text-left hover:opacity-80"
                                                >
                                                    <span
                                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                        style={{ background: ev.accent || "#F4D35E" }}
                                                    />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-medium text-slate-700">
                                                            {ev.title}
                                                        </span>
                                                        <span className="block text-xs text-slate-400">
                                                            {formatShort(k)}
                                                            {timeRange(ev) ? ` · ${timeRange(ev)}` : ""}
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit form (events are edited from the selected day panel) */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Edit Event" : "New Event"}</h2>
                                <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-slate-100">
                                    <X size={18} className="text-slate-500" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={3} />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Event Dates * (select one or more)</label>
                                    <MultiDatePicker value={form.dates} onChange={(dates) => setForm({ ...form, dates })} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                                            <Clock size={12} /> Start Time
                                        </label>
                                        <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                                            <Clock size={12} /> End Time (optional)
                                        </label>
                                        <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={inputClass} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
                                    <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Tag</label>
                                        <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className={inputClass}>
                                            <option value="CAMPUS">Campus</option>
                                            <option value="LIBRARY">Library</option>
                                            <option value="GUIDANCE">Guidance</option>
                                            <option value="LOSTFOUND">Lost & Found</option>
                                            <option value="CLINIC">Clinic</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Accent Color</label>
                                        <input type="color" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 cursor-pointer" />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={resetForm} className="flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                                    <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] p-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 hover:opacity-90 disabled:opacity-60">
                                        {saving ? "Saving..." : (editingId ? "Update" : "Create")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {importOpen && (
                    <ImportModal
                        events={events}
                        onClose={() => setImportOpen(false)}
                        onImported={handleImported}
                    />
                )}

                {registrarDraft && (
                    <RegistrarEmailModal
                        message={registrarDraft}
                        onClose={() => setRegistrarDraft(null)}
                    />
                )}
            </div>
        </div>
    );
}