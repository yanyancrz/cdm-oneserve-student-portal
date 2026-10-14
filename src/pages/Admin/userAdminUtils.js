import toast from "react-hot-toast";
import { API_URL } from "../../config/api";

// ─────────────────────────────────────────────────────────────
// Shared constants + helpers for the admin user-management
// pages (Users.jsx + ServiceHeads.jsx). No components here on
// purpose: files that export components alongside other values
// break Fast Refresh (react-refresh/only-export-components).
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
export const USER_ROLE_OPTIONS = ["Student", "Faculty", "Admin"];
export const STATUS_FILTERS = ["All statuses", "Active", "Pending", "Suspended", "Rejected", "Deleted"];
export const PAGE_SIZES = [10, 25, 50];

// "Marketplace" is included because CampusMarket is a module INSIDE OneServe, in
// exactly the same position as the other five: the OneServe Admin creates the
// module Head here, and that Head then manages the module's own staff accounts in
// the module portal. The backend already maps "Marketplace" -> MarketplaceAdmin
// and already refuses a second Head for the same module.
export const ADMIN_MODULES = ["Lost & Found", "Clinic", "Guidance", "Library", "Marketplace"];

export const ADMIN_ROLES = [
    "Admin",
    "LostFoundAdmin",
    "ClinicAdmin",
    "GuidanceAdmin",
    "LibraryAdmin",
    "MarketplaceAdmin",
];

export const ROLE_LABELS = {
    Admin: "Admin",
    SuperAdmin: "Super Admin",
    LostFoundAdmin: "Lost & Found Head",
    ClinicAdmin: "Clinic Head",
    GuidanceAdmin: "Guidance Head",
    MarketplaceAdmin: "Marketplace Head",
    LibraryAdmin: "Library Head",
    LibraryStaff: "Library Staff",
    Student: "Student",
    Faculty: "Faculty",
};

export const INSTITUTE_PROGRAMS = {
    "Institute of Computing Studies": [
        "Bachelor of Science in Computer Engineering",
        "Bachelor of Science in Information Technology",
    ],

    "Institute of Teacher Education": [
        "Bachelor of Early Childhood Education",
        "Bachelor of Technology and Livelihood Education Major in Information and Communication Technology",
        "Bachelor of Science in Secondary Education Major in Science",
        "Bachelor of Elementary Education Major in General Education",
        "Teacher Certificate Program",
    ],

    "Institute of Business and Entrepreneurship": [
        "Bachelor of Science in Business Administration Major in Human Resource Management",
        "Bachelor of Science in Entrepreneurship",
    ],
};

export const INSTITUTES = Object.keys(INSTITUTE_PROGRAMS);

const HEAD_STYLE = "bg-blue-100 text-blue-700";

export const ROLE_STYLES = {
    Admin: HEAD_STYLE,
    SuperAdmin: HEAD_STYLE,
    LostFoundAdmin: HEAD_STYLE,
    ClinicAdmin: HEAD_STYLE,
    GuidanceAdmin: HEAD_STYLE,
    LibraryAdmin: HEAD_STYLE,
    MarketplaceAdmin: HEAD_STYLE,
    LibraryStaff: "bg-amber-100 text-amber-700",
    Student: "bg-[#106A2E]/10 text-[#106A2E]",
    Faculty: "bg-[#0E3B22]/10 text-[#0E3B22]",
};

export const STATUS_STYLES = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Suspended: "bg-red-50 text-red-700 ring-red-200",
    Rejected: "bg-red-50 text-red-700 ring-red-200",
    Deleted: "bg-gray-100 text-gray-600 ring-gray-300",
};

export const STATUS_DOTS = {
    Active: "bg-emerald-500",
    Pending: "bg-amber-500",
    Suspended: "bg-red-500",
    Rejected: "bg-red-500",
    Deleted: "bg-gray-500",
};

// AuthController = [Route("api/[controller]")] -> /api/auth
//
//   POST /api/auth/members          -> add student / faculty
//   POST /api/auth/heads            -> add module head
//   GET/PUT/DELETE /api/auth/users  -> list / edit / status / soft delete
export const AUTH_BASE = `${API_URL}/api/auth`;
export const API_BASE = `${AUTH_BASE}/users`;

export const MIN_PASSWORD_LENGTH = 8;

export const FONTS_LINK_ID = "admin-profile-fonts";
export const FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";

export const focusRing =
    "outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/40 focus-visible:ring-offset-2";

export const fieldBase =
    "w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15";

export const selectClass =
    "text-sm border border-[#E5E1D8] bg-white rounded-lg px-3 py-2.5 text-gray-700 outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15";

export const primaryButton = `inline-flex items-center justify-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#0E3B22] transition hover:bg-[#0a2c19] disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;

export const outlineButton = `inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border border-[#0E3B22] text-[#0E3B22] bg-white transition hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;

export const ghostButton = `inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;

export const iconButton = `inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`;

export const thClass =
    "sticky top-0 z-10 bg-white text-left font-semibold text-gray-500 px-5 py-3 text-xs border-b border-[#E5E1D8]";

// ─────────────────────────────────────────────────────────────
// Verification method (physical ID vs PNM email)
// ─────────────────────────────────────────────────────────────
// Must match AuthController.GetSchoolRoleForEmail exactly: a
// school email already proves school membership, so those
// accounts carry no ID document and were verified by the
// email itself. Anyone with an uploaded document went
// through ID review - including school emails from before
// the auto-verify feature, and in-person admin checks that
// leave no document behind.
export const STUDENT_EMAIL_DOMAIN = "@student.pnm.edu.ph";
export const FACULTY_EMAIL_DOMAIN = "@pnm.edu.ph";

export function getVerificationMethod(user) {
    if (user?.physicalIdDocument) return "Physical ID";

    const email = String(user?.email || "").trim().toLowerCase();

    if (email.endsWith(STUDENT_EMAIL_DOMAIN) || email.endsWith(FACULTY_EMAIL_DOMAIN)) {
        return "PNM Email";
    }

    const verification = String(user?.physicalIdVerificationStatus || "").toLowerCase();

    // Verified by an admin in person (e.g. the Add Student /
    // Faculty checkbox) - an ID was shown, just never uploaded.
    if (verification === "verified" || verification === "approved") return "Physical ID";

    return "Not verified";
}

export function isVerifiedStatus(user) {
    const verification = String(user?.physicalIdVerificationStatus || "").toLowerCase();
    return verification === "verified" || verification === "approved";
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
export const authHeaders = (withJson = false) => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");

    return {
        ...(withJson ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const isAdminRole = (role) => (role ? ADMIN_ROLES.includes(role) : false);

export const roleLabel = (role) => ROLE_LABELS[role] || role || "—";

export const getInstituteFromCourse = (course) => {
    if (!course) return "";

    const normalizedCourse = course.trim();

    for (const [institute, programs] of Object.entries(INSTITUTE_PROGRAMS)) {
        if (programs.includes(normalizedCourse)) return institute;
    }

    return "";
};

export const getInstitute = (user) =>
    getInstituteFromCourse(user?.course) || user?.institute || "";

export function formatDate(value) {
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

export function timeAgo(value) {
    if (!value) return "—";

    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return "—";

    const minutes = Math.floor((Date.now() - then) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(value).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function getPasswordChecks(password) {
    return [
        { label: `At least ${MIN_PASSWORD_LENGTH} characters`, ok: password.length >= MIN_PASSWORD_LENGTH },
        { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
        { label: "Lowercase letter", ok: /[a-z]/.test(password) },
        { label: "Number", ok: /\d/.test(password) },
    ];
}

// Returns an error message, or "" if the password is valid
export function validatePassword(password, confirmPassword) {
    if (!getPasswordChecks(password).every((c) => c.ok)) {
        return "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.";
    }

    if (password !== confirmPassword) return "Passwords do not match.";

    return "";
}

export function generatePassword(length = 12) {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const digits = "23456789";
    const all = upper + lower + digits;

    const pick = (chars) => {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return chars[array[0] % chars.length];
    };

    const result = [pick(upper), pick(lower), pick(digits)];

    while (result.length < length) result.push(pick(all));

    for (let i = result.length - 1; i > 0; i--) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const j = array[0] % (i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result.join("");
}

export async function copyText(text, label) {
    try {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copied.`);
    } catch {
        toast.error(`Unable to copy ${label.toLowerCase()}.`);
    }
}

export function buildErrorMessage(response, data, fallback) {
    const validationMessage = data?.errors ? Object.values(data.errors).flat().join(" ") : "";

    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (validationMessage) return validationMessage;
    if (data?.title) return data.title;

    if (response.status === 401) return "Session expired. Please log in again.";
    if (response.status === 403) return "You don't have permission to do this.";

    return `${fallback} (${response.status}).`;
}

// One place for fetch + JSON + error handling
export async function request(url, { method = "GET", body, fallback = "Request failed", messages = {} } = {}) {
    const hasBody = body !== undefined;

    const response = await fetch(url, {
        method,
        headers: authHeaders(hasBody),
        body: hasBody ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(messages[response.status] || buildErrorMessage(response, data, fallback));
        error.status = response.status;
        throw error;
    }

    return data;
}
