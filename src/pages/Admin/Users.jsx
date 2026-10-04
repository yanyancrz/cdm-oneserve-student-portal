import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    Plus,
    Search,
    Eye,
    EyeOff,
    Pencil,
    MoreHorizontal,
    X,
    Check,
    Copy,
    RefreshCw,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Users as UsersIcon,
    UserCheck,
    Clock3,
    Ban,
    Trash2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
} from "lucide-react";
import { API_URL } from "../../config/api";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const ROLE_FILTERS = ["All roles", "Admin", "Student", "Faculty"];
const USER_ROLE_OPTIONS = ["Student", "Faculty", "Admin"];
const MEMBER_ROLE_OPTIONS = ["Student", "Faculty"];
const STATUS_FILTERS = ["All statuses", "Active", "Pending", "Suspended", "Rejected", "Deleted"];
const PAGE_SIZES = [10, 25, 50];

const ADMIN_MODULES = ["Lost & Found", "Clinic", "Business Hub", "Guidance", "Library"];

const ADMIN_ROLES = [
    "Admin",
    "LostFoundAdmin",
    "ClinicAdmin",
    "BusinessHubAdmin",
    "GuidanceAdmin",
    "LibraryAdmin",
];

const ROLE_LABELS = {
    Admin: "Admin",
    SuperAdmin: "Super Admin",
    LostFoundAdmin: "Lost & Found Head",
    ClinicAdmin: "Clinic Head",
    BusinessHubAdmin: "Business Hub Head",
    GuidanceAdmin: "Guidance Head",
    LibraryAdmin: "Library Head",
    LibraryStaff: "Library Staff",
    Student: "Student",
    Faculty: "Faculty",
};

const INSTITUTE_PROGRAMS = {
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

const INSTITUTES = Object.keys(INSTITUTE_PROGRAMS);

const HEAD_STYLE = "bg-blue-100 text-blue-700";

const ROLE_STYLES = {
    Admin: HEAD_STYLE,
    SuperAdmin: HEAD_STYLE,
    LostFoundAdmin: HEAD_STYLE,
    ClinicAdmin: HEAD_STYLE,
    BusinessHubAdmin: HEAD_STYLE,
    GuidanceAdmin: HEAD_STYLE,
    LibraryAdmin: HEAD_STYLE,
    LibraryStaff: "bg-amber-100 text-amber-700",
    Student: "bg-[#106A2E]/10 text-[#106A2E]",
    Faculty: "bg-[#0E3B22]/10 text-[#0E3B22]",
};

const STATUS_STYLES = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Suspended: "bg-red-50 text-red-700 ring-red-200",
    Rejected: "bg-red-50 text-red-700 ring-red-200",
    Deleted: "bg-gray-100 text-gray-600 ring-gray-300",
};

const STATUS_DOTS = {
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
const AUTH_BASE = `${API_URL}/api/auth`;
const API_BASE = `${AUTH_BASE}/users`;

const MIN_PASSWORD_LENGTH = 8;

const FONTS_LINK_ID = "admin-profile-fonts";
const FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";

const focusRing =
    "outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/40 focus-visible:ring-offset-2";

const fieldBase =
    "w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15";

const selectClass =
    "text-sm border border-[#E5E1D8] bg-white rounded-lg px-3 py-2.5 text-gray-700 outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15";

const primaryButton = `inline-flex items-center justify-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#0E3B22] transition hover:bg-[#0a2c19] disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;

const outlineButton = `inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border border-[#0E3B22] text-[#0E3B22] bg-white transition hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;

const ghostButton = `inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;

const iconButton = `inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const authHeaders = (withJson = false) => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");

    return {
        ...(withJson ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const isAdminRole = (role) => (role ? ADMIN_ROLES.includes(role) : false);

const roleLabel = (role) => ROLE_LABELS[role] || role || "—";

const getInstituteFromCourse = (course) => {
    if (!course) return "";

    const normalizedCourse = course.trim();

    for (const [institute, programs] of Object.entries(INSTITUTE_PROGRAMS)) {
        if (programs.includes(normalizedCourse)) return institute;
    }

    return "";
};

const getInstitute = (user) =>
    getInstituteFromCourse(user?.course) || user?.institute || "";

function formatDate(value) {
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

function timeAgo(value) {
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

function getPasswordChecks(password) {
    return [
        { label: `At least ${MIN_PASSWORD_LENGTH} characters`, ok: password.length >= MIN_PASSWORD_LENGTH },
        { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
        { label: "Lowercase letter", ok: /[a-z]/.test(password) },
        { label: "Number", ok: /\d/.test(password) },
    ];
}

// Returns an error message, or "" if the password is valid
function validatePassword(password, confirmPassword) {
    if (!getPasswordChecks(password).every((c) => c.ok)) {
        return "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.";
    }

    if (password !== confirmPassword) return "Passwords do not match.";

    return "";
}

function generatePassword(length = 12) {
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

async function copyText(text, label) {
    try {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copied.`);
    } catch {
        toast.error(`Unable to copy ${label.toLowerCase()}.`);
    }
}

function buildErrorMessage(response, data, fallback) {
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
async function request(url, { method = "GET", body, fallback = "Request failed", messages = {} } = {}) {
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

// ─────────────────────────────────────────────────────────────
// Small UI pieces
// ─────────────────────────────────────────────────────────────
function Initials({ name, size = "w-9 h-9" }) {
    const initials = (name || "User")
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div
            className={`${size} rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
            style={{ background: "#0E3B22" }}
            aria-hidden="true"
        >
            {initials}
        </div>
    );
}

function RolePill({ role }) {
    return (
        <span
            className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                ROLE_STYLES[role] || "bg-gray-100 text-gray-700"
            }`}
        >
            {roleLabel(role)}
        </span>
    );
}

function StatusPill({ status }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${
                STATUS_STYLES[status] || "bg-gray-100 text-gray-600 ring-gray-200"
            }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status] || "bg-gray-400"}`} />
            {status}
        </span>
    );
}

function Modal({ title, onClose, children, locked = false, size = "max-w-md" }) {
    const ref = useRef(null);
    const titleId = useId();

    useEffect(() => {
        ref.current?.focus();
    }, []);

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "Escape" && !locked) onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [locked, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !locked) onClose();
            }}
        >
            <div
                ref={ref}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`bg-white rounded-2xl w-full ${size} shadow-xl max-h-[90vh] overflow-y-auto outline-none`}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E1D8]">
                    <h3 id={titleId} className="font-display text-lg text-[#1F1F1F]">
                        {title}
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={locked}
                        aria-label="Close"
                        className={iconButton}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );
}

function ConfirmDialog({ config, onClose }) {
    const [busy, setBusy] = useState(false);
    const cancelRef = useRef(null);
    const isDanger = config.tone === "danger";

    useEffect(() => {
        cancelRef.current?.focus();
    }, []);

    useEffect(() => {
        // Capture phase so Esc closes only this dialog, not the modal behind it
        const onKey = (event) => {
            if (event.key === "Escape" && !busy) {
                event.stopPropagation();
                onClose();
            }
        };
        document.addEventListener("keydown", onKey, true);
        return () => document.removeEventListener("keydown", onKey, true);
    }, [busy, onClose]);

    const handleConfirm = async () => {
        setBusy(true);
        try {
            await config.onConfirm();
        } finally {
            setBusy(false);
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onClose();
            }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="users-confirm-title"
                aria-describedby="users-confirm-desc"
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            >
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        isDanger ? "bg-red-50 text-red-500" : "bg-[#E1F0E4] text-[#106A2E]"
                    }`}
                >
                    <AlertTriangle size={20} />
                </div>

                <h2 id="users-confirm-title" className="mt-4 text-base font-semibold text-gray-900">
                    {config.title}
                </h2>
                <p id="users-confirm-desc" className="mt-1.5 text-sm leading-6 text-gray-500 whitespace-pre-line">
                    {config.description}
                </p>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className={`rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 ${focusRing}`}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={busy}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${focusRing} ${
                            isDanger ? "bg-red-600 hover:bg-red-700" : "bg-[#106A2E] hover:bg-[#0d5224]"
                        }`}
                    >
                        {busy && <RefreshCw size={14} className="animate-spin" />}
                        {config.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function TextField({ label, labelAction, error, hint, rightSlot, readOnly, className = "", ...props }) {
    const id = useId();

    return (
        <div>
            <div className="flex items-center justify-between">
                <label htmlFor={id} className="text-xs font-medium text-gray-500">
                    {label}
                </label>
                {labelAction}
            </div>

            <div className="relative mt-1">
                <input
                    id={id}
                    readOnly={readOnly}
                    aria-invalid={Boolean(error)}
                    className={`${fieldBase} ${
                        readOnly ? "bg-gray-50 text-gray-600 cursor-default" : "bg-white"
                    } ${error ? "border-red-500" : "border-[#E5E1D8]"} ${className}`}
                    {...props}
                />
                {rightSlot}
            </div>

            {error && (
                <p className="mt-1 text-[11px] text-red-600" role="alert">
                    {error}
                </p>
            )}
            {!error && hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
        </div>
    );
}

function SelectField({ label, options, placeholder, ...props }) {
    const id = useId();

    return (
        <div>
            <label htmlFor={id} className="text-xs font-medium text-gray-500">
                {label}
            </label>

            <select
                id={id}
                className={`${fieldBase} mt-1 bg-white border-[#E5E1D8]`}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}

                {options.map((option) => {
                    const value = typeof option === "string" ? option : option.value;
                    const text = typeof option === "string" ? option : option.label;
                    return (
                        <option key={value} value={value}>
                            {text}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}

function FormActions({ onCancel, submitting, submitLabel, submittingLabel }) {
    return (
        <div className="flex justify-end gap-2 pt-2">
            <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className={`text-xs font-semibold px-4 py-2 rounded-lg border border-[#E5E1D8] text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 ${focusRing}`}
            >
                Cancel
            </button>

            <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg text-white bg-[#0E3B22] transition hover:bg-[#0a2c19] disabled:opacity-60 ${focusRing}`}
            >
                {submitting && <RefreshCw size={13} className="animate-spin" />}
                {submitting ? submittingLabel : submitLabel}
            </button>
        </div>
    );
}

function ErrorNote({ message }) {
    if (!message) return null;

    return (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {message}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Password fields (shared by HeadForm and MemberForm)
// ─────────────────────────────────────────────────────────────
function PasswordFields({ password, confirmPassword, onChange }) {
    const [showPassword, setShowPassword] = useState(false);

    const checks = getPasswordChecks(password);
    const passed = checks.filter((c) => c.ok).length;
    const match = password === confirmPassword;

    const strengthLabel = passed <= 1 ? "Weak" : passed <= 3 ? "Fair" : "Strong";
    const strengthColor =
        passed <= 1 ? "bg-red-500" : passed <= 3 ? "bg-amber-500" : "bg-emerald-500";

    const handleGenerate = () => {
        const generated = generatePassword();
        onChange({ password: generated, confirmPassword: generated });
        setShowPassword(true);
    };

    return (
        <>
            <div>
                <TextField
                    label="Password"
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => onChange({ password: e.target.value })}
                    className="pr-11"
                    labelAction={
                        <button
                            type="button"
                            onClick={handleGenerate}
                            className={`inline-flex items-center gap-1 rounded text-[11px] font-semibold text-[#106A2E] hover:underline ${focusRing}`}
                        >
                            <RefreshCw size={11} />
                            Generate
                        </button>
                    }
                    rightSlot={
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 ${focusRing}`}
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    }
                />

                {password && (
                    <div className="mt-2">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className={`h-full rounded-full transition-all ${strengthColor}`}
                                    style={{ width: `${(passed / checks.length) * 100}%` }}
                                />
                            </div>

                            <span className="text-[11px] font-semibold text-gray-500">
                                {strengthLabel}
                            </span>
                        </div>

                        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                            {checks.map((check) => (
                                <li
                                    key={check.label}
                                    className={`flex items-center gap-1.5 text-[11px] ${
                                        check.ok ? "text-emerald-600" : "text-gray-400"
                                    }`}
                                >
                                    {check.ok ? (
                                        <Check size={11} />
                                    ) : (
                                        <span className="inline-block w-[11px] text-center">•</span>
                                    )}
                                    {check.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <TextField
                label="Confirm password"
                required
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => onChange({ confirmPassword: e.target.value })}
                error={confirmPassword && !match ? "Passwords do not match." : ""}
            />
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// Head form (add module head)
// ─────────────────────────────────────────────────────────────
function HeadForm({ onCancel, onSubmit, submitting, serverError }) {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        idNumber: "",
        adminModule: "",
        password: "",
        confirmPassword: "",
    });
    const [localError, setLocalError] = useState("");

    const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const patch = (values) => {
        setForm((f) => ({ ...f, ...values }));
        setLocalError("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (submitting) return;

        const message = validatePassword(form.password, form.confirmPassword);
        if (message) {
            setLocalError(message);
            return;
        }

        setLocalError("");

        onSubmit({
            fullName: form.fullName.trim(),
            email: form.email.trim().toLowerCase(),
            idNumber: form.idNumber.trim(),
            adminModule: form.adminModule,
            password: form.password,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-4 text-blue-700">
                Module Heads ang idinadagdag dito. Sila na ang gagawa ng sariling staff accounts sa
                module nila.
            </p>

            <SelectField
                label="Module"
                required
                value={form.adminModule}
                onChange={update("adminModule")}
                placeholder="Select module"
                options={ADMIN_MODULES.map((m) => ({ value: m, label: `${m} Head` }))}
            />

            <TextField label="Full name" required value={form.fullName} onChange={update("fullName")} />

            <TextField
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={update("email")}
            />

            <TextField
                label="Employee ID (optional)"
                value={form.idNumber}
                onChange={update("idNumber")}
                placeholder="e.g. EMP-2024-001"
            />

            <PasswordFields
                password={form.password}
                confirmPassword={form.confirmPassword}
                onChange={patch}
            />

            <ErrorNote message={localError || serverError} />

            <FormActions
                onCancel={onCancel}
                submitting={submitting}
                submitLabel="Create head"
                submittingLabel="Creating..."
            />
        </form>
    );
}

// ─────────────────────────────────────────────────────────────
// Member form (add student / faculty)
// ─────────────────────────────────────────────────────────────
function MemberForm({ onCancel, onSubmit, submitting, serverError }) {
    const [form, setForm] = useState({
        role: "Student",
        fullName: "",
        email: "",
        idNumber: "",
        institute: "",
        course: "",
        yearLevel: "",
        contactNumber: "",
        password: "",
        confirmPassword: "",
        idVerified: false,
    });
    const [localError, setLocalError] = useState("");

    const isStudent = form.role === "Student";
    const isFaculty = form.role === "Faculty";

    const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const patch = (values) => {
        setForm((f) => ({ ...f, ...values }));
        setLocalError("");
    };

    const allPrograms = Object.values(INSTITUTE_PROGRAMS).flat();

    const handleRoleChange = (e) => {
        const role = e.target.value;

        setForm((f) => ({
            ...f,
            role,
            institute: role === "Faculty" ? f.institute : "",
            course: role === "Student" ? f.course : "",
            yearLevel: role === "Student" ? f.yearLevel : "",
        }));
    };

    const handleCourseChange = (e) => {
        const course = e.target.value;

        setForm((f) => ({
            ...f,
            course,
            institute: getInstituteFromCourse(course),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (submitting) return;

        const message = validatePassword(form.password, form.confirmPassword);
        if (message) {
            setLocalError(message);
            return;
        }

        setLocalError("");

        onSubmit({
            role: form.role,
            fullName: form.fullName.trim(),
            email: form.email.trim().toLowerCase(),
            idNumber: form.idNumber.trim(),
            institute: isStudent ? getInstituteFromCourse(form.course) : form.institute,
            course: isStudent ? form.course : "",
            yearLevel: isStudent ? form.yearLevel.trim() : "",
            contactNumber: form.contactNumber.trim(),
            password: form.password,
            idVerified: form.idVerified,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] leading-4 text-emerald-700">
                Direktang gumagawa ng Student o Faculty account. Aktibo ito at makaka-login agad ang
                user. I-check ang box sa ibaba kung na-verify mo na ang ID niya.
            </p>

            <SelectField
                label="Role"
                value={form.role}
                onChange={handleRoleChange}
                options={MEMBER_ROLE_OPTIONS.map((r) => ({ value: r, label: roleLabel(r) }))}
            />

            <TextField label="Full name" required value={form.fullName} onChange={update("fullName")} />

            <TextField
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={update("email")}
            />

            <TextField
                label={isStudent ? "Student number" : "Employee ID"}
                required
                value={form.idNumber}
                onChange={update("idNumber")}
                placeholder={isStudent ? "e.g. 23-13133" : "e.g. EMP-2024-001"}
            />

            {isStudent && (
                <>
                    <SelectField
                        label="Program"
                        required
                        value={form.course}
                        onChange={handleCourseChange}
                        placeholder="Select program"
                        options={allPrograms}
                    />

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <TextField
                                label="Institute"
                                readOnly
                                value={getInstituteFromCourse(form.course)}
                                placeholder="Auto from program"
                            />
                        </div>

                        <div className="flex-1">
                            <TextField
                                label="Year level"
                                required
                                value={form.yearLevel}
                                onChange={update("yearLevel")}
                                placeholder="e.g. 3rd Year"
                            />
                        </div>
                    </div>
                </>
            )}

            {isFaculty && (
                <SelectField
                    label="Institute"
                    required
                    value={form.institute}
                    onChange={update("institute")}
                    placeholder="Select institute"
                    options={INSTITUTES}
                />
            )}

            <TextField
                label="Contact number (optional)"
                value={form.contactNumber}
                onChange={update("contactNumber")}
                placeholder="e.g. 09123456789"
            />

            {/* ID verification */}
            <label className="flex items-start gap-2 rounded-lg border border-[#E5E1D8] px-3 py-2.5 cursor-pointer">
                <input
                    type="checkbox"
                    checked={form.idVerified}
                    onChange={(e) => setForm((f) => ({ ...f, idVerified: e.target.checked }))}
                    className="mt-0.5 accent-[#106A2E]"
                />

                <span className="text-xs text-gray-600 leading-4">
                    <span className="font-semibold text-gray-800">
                        {isStudent
                            ? "Nagpakita ng ID / confirmed enrolled"
                            : "Nagpakita ng ID / confirmed faculty"}
                    </span>
                    <br />
                    I-check kung na-verify mo na nang personal. Mamarkahan ang account bilang Verified
                    at maitatala sa activity log.
                </span>
            </label>

            <PasswordFields
                password={form.password}
                confirmPassword={form.confirmPassword}
                onChange={patch}
            />

            <ErrorNote message={localError || serverError} />

            <FormActions
                onCancel={onCancel}
                submitting={submitting}
                submitLabel={`Create ${form.role.toLowerCase()}`}
                submittingLabel="Creating..."
            />
        </form>
    );
}

// ─────────────────────────────────────────────────────────────
// User form (edit only)
// ─────────────────────────────────────────────────────────────
function UserForm({ initial, onCancel, onSubmit, submitting, serverError, submitLabel }) {
    const [form, setForm] = useState(initial);

    const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const isStudent = form.role === "Student";
    const isFaculty = form.role === "Faculty";
    const isAdmin = isAdminRole(form.role);
    const grantsAdmin = isAdmin && !isAdminRole(initial.role);

    // Keep the current role (e.g. LibraryAdmin) in the dropdown so it doesn't disappear
    const roleOptions = USER_ROLE_OPTIONS.includes(form.role)
        ? USER_ROLE_OPTIONS
        : [form.role, ...USER_ROLE_OPTIONS];

    const availablePrograms = form.institute
        ? INSTITUTE_PROGRAMS[form.institute] || []
        : Object.values(INSTITUTE_PROGRAMS).flat();

    const handleRoleChange = (e) => {
        const newRole = e.target.value;

        setForm((f) => ({
            ...f,
            role: newRole,
            adminModule: isAdminRole(newRole) ? f.adminModule : "",
            institute: newRole === "Faculty" ? f.institute : "",
            course: newRole === "Student" ? f.course : "",
            yearLevel: newRole === "Student" ? f.yearLevel : "",
        }));
    };

    const handleInstituteChange = (e) => {
        const institute = e.target.value;

        setForm((f) => ({
            ...f,
            institute,
            course: f.course && INSTITUTE_PROGRAMS[institute]?.includes(f.course) ? f.course : "",
        }));
    };

    const handleCourseChange = (e) => {
        const course = e.target.value;

        setForm((f) => ({
            ...f,
            course,
            institute: getInstituteFromCourse(course) || f.institute,
        }));
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (submitting) return;

                onSubmit({
                    ...form,
                    institute: isStudent
                        ? getInstituteFromCourse(form.course) || form.institute
                        : isFaculty
                        ? form.institute
                        : "",
                });
            }}
            className="space-y-3"
        >
            <TextField label="Full name" readOnly value={form.fullName} />

            <TextField
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={update("email")}
            />

            <SelectField
                label="Role"
                value={form.role}
                onChange={handleRoleChange}
                options={roleOptions.map((r) => ({ value: r, label: roleLabel(r) }))}
            />

            {grantsAdmin && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-700">
                    This gives the user admin access. You'll be asked to confirm before saving.
                </p>
            )}

            {isAdmin && (
                <SelectField
                    label="Assigned module"
                    required
                    value={form.adminModule || ""}
                    onChange={update("adminModule")}
                    placeholder="Select module"
                    options={ADMIN_MODULES}
                />
            )}

            {isStudent && (
                <>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <TextField label="ID number" readOnly value={form.idNumber || ""} />
                        </div>

                        <div className="flex-1">
                            <TextField
                                label="Year level"
                                value={form.yearLevel || ""}
                                onChange={update("yearLevel")}
                                placeholder="e.g. 3rd Year"
                            />
                        </div>
                    </div>

                    <TextField
                        label="Institute"
                        readOnly
                        value={getInstituteFromCourse(form.course) || form.institute || ""}
                        placeholder="Automatically assigned from program"
                    />

                    <SelectField
                        label="Program"
                        required
                        value={form.course || ""}
                        onChange={handleCourseChange}
                        placeholder="Select program"
                        options={availablePrograms}
                    />
                </>
            )}

            {isFaculty && (
                <>
                    <TextField label="ID number" readOnly value={form.idNumber || ""} />

                    <SelectField
                        label="Institute"
                        value={form.institute || ""}
                        onChange={handleInstituteChange}
                        placeholder="Select institute"
                        options={INSTITUTES}
                    />
                </>
            )}

            <ErrorNote message={serverError} />

            <FormActions
                onCancel={onCancel}
                submitting={submitting}
                submitLabel={submitLabel}
                submittingLabel="Saving..."
            />
        </form>
    );
}

// ─────────────────────────────────────────────────────────────
// Credentials modal (shown once after creating an account)
// ─────────────────────────────────────────────────────────────
function CredentialsModal({ data, onClose }) {
    const rows = [
        { label: "Name", value: data.fullName },
        { label: "Email", value: data.email, copy: true },
        { label: "Password", value: data.password, copy: true },
    ];

    if (data.idVerified !== undefined) {
        rows.push({ label: "ID verification", value: data.idVerified ? "Verified" : "Not verified" });
    }

    return (
        <Modal title={`${roleLabel(data.role)} account created`} onClose={onClose}>
            <div className="space-y-2">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5"
                    >
                        <div className="min-w-0">
                            <p className="text-[11px] text-gray-400">{row.label}</p>
                            <p className="break-all text-sm font-medium text-gray-800 select-all">
                                {row.value}
                            </p>
                        </div>

                        {row.copy && (
                            <button
                                type="button"
                                onClick={() => copyText(row.value, row.label)}
                                aria-label={`Copy ${row.label.toLowerCase()}`}
                                className={iconButton}
                            >
                                <Copy size={15} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-700">
                Ibigay ito sa user. Hindi na makikita ulit ang password pagkasara ng window na ito.
            </p>

            <div className="flex justify-end gap-2 pt-4">
                <button
                    type="button"
                    onClick={() =>
                        copyText(`Email: ${data.email}\nPassword: ${data.password}`, "Credentials")
                    }
                    className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-[#E5E1D8] text-gray-600 transition hover:bg-gray-50 ${focusRing}`}
                >
                    <Copy size={13} />
                    Copy both
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    className={`text-xs font-semibold px-4 py-2 rounded-lg text-white bg-[#0E3B22] transition hover:bg-[#0a2c19] ${focusRing}`}
                >
                    Done
                </button>
            </div>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────
// Table pieces
// ─────────────────────────────────────────────────────────────
const thClass =
    "sticky top-0 z-10 bg-white text-left font-semibold text-gray-500 px-5 py-3 text-xs border-b border-[#E5E1D8]";

function SortHeader({ label, sortKey, sort, onSort }) {
    const active = sort.key === sortKey;
    const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;

    return (
        <th
            className={thClass}
            aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
        >
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={`inline-flex items-center gap-1.5 rounded hover:text-gray-800 ${focusRing} ${
                    active ? "text-gray-800" : ""
                }`}
            >
                {label}
                <Icon size={13} className={active ? "text-[#106A2E]" : "text-gray-300"} />
            </button>
        </th>
    );
}

// Rendered with fixed positioning so the scrolling table never clips it
function RowMenu({ items, label }) {
    const [pos, setPos] = useState(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const close = useCallback(() => setPos(null), []);

    useEffect(() => {
        if (!pos) return undefined;

        const onDown = (event) => {
            if (menuRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) {
                return;
            }
            close();
        };
        const onKey = (event) => {
            if (event.key === "Escape") close();
        };

        window.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        window.addEventListener("resize", close);
        window.addEventListener("scroll", close, true);

        return () => {
            window.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", close);
            window.removeEventListener("scroll", close, true);
        };
    }, [pos, close]);

    const toggle = () => {
        if (pos) {
            close();
            return;
        }

        const rect = buttonRef.current.getBoundingClientRect();
        const menuHeight = items.length * 40 + 8;
        const openUp = rect.bottom + menuHeight + 8 > window.innerHeight;

        setPos({
            top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
            left: Math.max(8, rect.right - 176),
        });
    };

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={toggle}
                disabled={items.length === 0}
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={Boolean(pos)}
                className={iconButton}
            >
                <MoreHorizontal size={17} />
            </button>

            {pos && (
                <div
                    ref={menuRef}
                    role="menu"
                    className="fixed z-40 w-44 rounded-xl border border-[#E5E1D8] bg-white p-1 shadow-lg"
                    style={{ top: pos.top, left: pos.left }}
                >
                    {items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                            <button
                                key={item.label}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    close();
                                    item.onClick();
                                }}
                                className={`flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm transition ${focusRing} ${
                                    item.danger
                                        ? "text-red-600 hover:bg-red-50"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <ItemIcon size={15} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </>
    );
}

function LoadingSkeleton() {
    return (
        <div className="divide-y divide-[#F0EDE4] animate-pulse" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                    <div className="h-9 w-9 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-40 rounded bg-gray-200" />
                        <div className="h-3 w-56 rounded bg-gray-100" />
                    </div>
                    <div className="hidden h-5 w-16 rounded-full bg-gray-100 sm:block" />
                    <div className="hidden h-5 w-20 rounded-full bg-gray-100 sm:block" />
                </div>
            ))}
        </div>
    );
}

function DetailRow({ label, children }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-800 text-right">{children}</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Main users page
// ─────────────────────────────────────────────────────────────
export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All roles");
    const [statusFilter, setStatusFilter] = useState("All statuses");
    const [instituteFilter, setInstituteFilter] = useState("All institutes");
    const [courseFilter, setCourseFilter] = useState("All courses");

    const [sort, setSort] = useState({ key: null, dir: "asc" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [modal, setModal] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");
    const [editing, setEditing] = useState(false);
    const [editError, setEditError] = useState("");

    const [confirm, setConfirm] = useState(null);
    const [credentials, setCredentials] = useState(null);

    const currentEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
    const isSelf = (user) => Boolean(currentEmail) && user.email?.toLowerCase() === currentEmail;

    // ── Fonts (same as AdminProfile / Announcements) ────────
    useEffect(() => {
        if (document.getElementById(FONTS_LINK_ID)) return;
        const link = document.createElement("link");
        link.id = FONTS_LINK_ID;
        link.rel = "stylesheet";
        link.href = FONTS_HREF;
        document.head.appendChild(link);
    }, []);

    // ── Load users ──────────────────────────────────────────
    const loadUsers = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);

        try {
            const data = await request(API_BASE, {
                fallback: "Failed to load users",
                messages: { 403: "You don't have permission to view users." },
            });

            setUsers(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(
                err.status
                    ? err.message
                    : "Couldn't load users. Is the API running?"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // ── Filters ─────────────────────────────────────────────
    const showInstituteFilter = roleFilter === "Student" || roleFilter === "Faculty";
    const showCourseFilter = roleFilter === "Student";
    const showAssignedModule = roleFilter === "All roles" || roleFilter === "Admin";
    const showIdNumber = roleFilter === "All roles" || roleFilter === "Student" || roleFilter === "Faculty";

    const instituteOptions = useMemo(() => {
        const set = new Set(
            users
                .filter((u) => u.role?.toLowerCase() === roleFilter.toLowerCase() && getInstitute(u))
                .map((u) => getInstitute(u))
        );

        return ["All institutes", ...Array.from(set).sort()];
    }, [users, roleFilter]);

    const courseOptions = useMemo(() => {
        const set = new Set(
            users
                .filter(
                    (u) =>
                        u.role?.toLowerCase() === "student" &&
                        u.course &&
                        (instituteFilter === "All institutes" || getInstitute(u) === instituteFilter)
                )
                .map((u) => u.course)
        );

        return ["All courses", ...Array.from(set).sort()];
    }, [users, instituteFilter]);

    const handleRoleFilterChange = (value) => {
        setRoleFilter(value);
        setInstituteFilter("All institutes");
        setCourseFilter("All courses");
    };

    const handleInstituteFilterChange = (value) => {
        setInstituteFilter(value);
        setCourseFilter("All courses");
    };

    const clearAllFilters = () => {
        setSearch("");
        setRoleFilter("All roles");
        setStatusFilter("All statuses");
        setInstituteFilter("All institutes");
        setCourseFilter("All courses");
    };

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((u) => {
            const matchesSearch =
                !query ||
                [
                    u.fullName,
                    u.email,
                    u.idNumber,
                    u.role,
                    roleLabel(u.role),
                    u.adminModule,
                    u.institute,
                    u.course,
                    u.yearLevel,
                    u.status,
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(query));

            let matchesRole = true;
            if (roleFilter === "Admin") {
                matchesRole = isAdminRole(u.role);
            } else if (roleFilter !== "All roles") {
                matchesRole = u.role?.toLowerCase() === roleFilter.toLowerCase();
            }

            const matchesStatus = statusFilter === "All statuses" || u.status === statusFilter;

            const matchesInstitute =
                !showInstituteFilter ||
                instituteFilter === "All institutes" ||
                getInstitute(u) === instituteFilter;

            const matchesCourse =
                !showCourseFilter || courseFilter === "All courses" || u.course === courseFilter;

            return matchesSearch && matchesRole && matchesStatus && matchesInstitute && matchesCourse;
        });
    }, [
        users,
        search,
        roleFilter,
        statusFilter,
        instituteFilter,
        courseFilter,
        showInstituteFilter,
        showCourseFilter,
    ]);

    const activeChips = [];
    if (search.trim()) {
        activeChips.push({ key: "search", label: `Search: "${search.trim()}"`, clear: () => setSearch("") });
    }
    if (roleFilter !== "All roles") {
        activeChips.push({
            key: "role",
            label: roleFilter === "Admin" ? "Admin / Heads" : roleFilter,
            clear: () => handleRoleFilterChange("All roles"),
        });
    }
    if (statusFilter !== "All statuses") {
        activeChips.push({ key: "status", label: statusFilter, clear: () => setStatusFilter("All statuses") });
    }
    if (showInstituteFilter && instituteFilter !== "All institutes") {
        activeChips.push({
            key: "institute",
            label: instituteFilter,
            clear: () => handleInstituteFilterChange("All institutes"),
        });
    }
    if (showCourseFilter && courseFilter !== "All courses") {
        activeChips.push({ key: "course", label: courseFilter, clear: () => setCourseFilter("All courses") });
    }

    // ── Sort + paginate ─────────────────────────────────────
    const toggleSort = (key) => {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            if (prev.dir === "asc") return { key, dir: "desc" };
            return { key: null, dir: "asc" };
        });
    };

    const sorted = useMemo(() => {
        if (!sort.key) return filtered;

        const dir = sort.dir === "asc" ? 1 : -1;

        return [...filtered].sort((a, b) => {
            if (sort.key === "lastActive") {
                const ta = a.lastActive ? new Date(a.lastActive).getTime() : null;
                const tb = b.lastActive ? new Date(b.lastActive).getTime() : null;
                if (ta === null && tb === null) return 0;
                if (ta === null) return 1; // empty values always last
                if (tb === null) return -1;
                return (ta - tb) * dir;
            }

            const va = String(a[sort.key] || "").toLowerCase();
            const vb = String(b[sort.key] || "").toLowerCase();
            return va.localeCompare(vb) * dir;
        });
    }, [filtered, sort]);

    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, statusFilter, instituteFilter, courseFilter, sort, pageSize]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * pageSize;
    const pageItems = sorted.slice(pageStart, pageStart + pageSize);

    // ── Stats ───────────────────────────────────────────────
    const stats = useMemo(() => {
        const count = (status) => users.filter((u) => u.status === status).length;

        return [
            { key: "All statuses", label: "Total users", value: users.length, icon: UsersIcon, tone: "bg-[#ECE9E2] text-[#1F1F1F]", number: "text-[#1F1F1F]" },
            { key: "Active", label: "Active", value: count("Active"), icon: UserCheck, tone: "bg-[#E1F0E4] text-[#106A2E]", number: "text-[#106A2E]" },
            { key: "Pending", label: "Pending", value: count("Pending"), icon: Clock3, tone: "bg-amber-50 text-amber-600", number: "text-amber-600" },
            { key: "Suspended", label: "Suspended", value: count("Suspended"), icon: Ban, tone: "bg-red-50 text-red-500", number: "text-red-600" },
        ];
    }, [users]);

    // ── Modal helpers ───────────────────────────────────────
    const openAdd = () => {
        setActiveUser(null);
        setAddError("");
        setModal("add");
    };

    const openAddMember = () => {
        setActiveUser(null);
        setAddError("");
        setModal("add-member");
    };

    const openView = (user) => {
        setActiveUser(user);
        setModal("view");
    };

    const openEdit = (user) => {
        setActiveUser(user);
        setEditError("");
        setModal("edit");
    };

    const closeModal = useCallback(() => {
        if (adding || editing) return;

        setModal(null);
        setActiveUser(null);
        setAddError("");
        setEditError("");
    }, [adding, editing]);

    const closeConfirm = useCallback(() => setConfirm(null), []);
    const closeCredentials = useCallback(() => setCredentials(null), []);

    // ── Add head ────────────────────────────────────────────
    const handleAddHead = async (form) => {
        setAdding(true);
        setAddError("");

        try {
            const data = await request(`${AUTH_BASE}/heads`, {
                method: "POST",
                fallback: "Failed to create head",
                messages: { 403: "Only the Super Admin or Admin can add module heads." },
                body: {
                    fullName: form.fullName,
                    email: form.email,
                    password: form.password,
                    adminModule: form.adminModule,
                    idNumber: form.idNumber || null,
                },
            });

            const created = data?.user || data;

            setModal(null);
            setActiveUser(null);
            setCredentials({
                role: created?.role || "Admin",
                fullName: form.fullName,
                email: form.email,
                password: form.password,
            });

            await loadUsers({ silent: true });
        } catch (err) {
            console.error("Failed to create head:", err);
            setAddError(err.message || "Couldn't create the account. Please try again.");
        } finally {
            setAdding(false);
        }
    };

    // ── Add member ──────────────────────────────────────────
    const handleAddMember = async (form) => {
        setAdding(true);
        setAddError("");

        try {
            await request(`${AUTH_BASE}/members`, {
                method: "POST",
                fallback: "Failed to create account",
                messages: {
                    403: "Only the Super Admin or Admin can add students and faculty.",
                    404: "The add-member endpoint was not found. Make sure the API is updated.",
                },
                body: {
                    role: form.role,
                    fullName: form.fullName,
                    email: form.email,
                    password: form.password,
                    idNumber: form.idNumber,
                    institute: form.institute || null,
                    course: form.course || null,
                    yearLevel: form.yearLevel || null,
                    contactNumber: form.contactNumber || null,
                    idVerified: !!form.idVerified,
                },
            });

            setModal(null);
            setActiveUser(null);
            setCredentials({
                role: form.role,
                fullName: form.fullName,
                email: form.email,
                password: form.password,
                idVerified: form.idVerified,
            });

            await loadUsers({ silent: true });
        } catch (err) {
            console.error("Failed to create member:", err);
            setAddError(err.message || "Couldn't create the account. Please try again.");
        } finally {
            setAdding(false);
        }
    };

    // ── Edit user ───────────────────────────────────────────
    const saveEdit = async (form) => {
        if (!activeUser) return;

        setEditing(true);
        setEditError("");

        try {
            const data = await request(`${API_BASE}/${activeUser.id}`, {
                method: "PUT",
                fallback: "Failed to update user.",
                messages: { 403: "You don't have permission to edit this user." },
                body: {
                    email: form.email,
                    role: form.role,
                    adminModule: form.adminModule || null,
                    institute: form.role === "Faculty" ? form.institute || null : null,
                    course: form.role === "Student" ? form.course || null : null,
                    yearLevel: form.role === "Student" ? form.yearLevel || null : null,
                },
            });

            const updated = data?.user || data;

            setUsers((prev) =>
                prev.map((u) =>
                    u.id === activeUser.id
                        ? {
                              ...u,
                              ...(updated && typeof updated === "object" ? updated : {}),
                              id: activeUser.id,
                              fullName: activeUser.fullName,
                              idNumber: activeUser.idNumber,
                          }
                        : u
                )
            );

            setModal(null);
            setActiveUser(null);
            toast.success("User updated successfully.");
        } catch (err) {
            console.error("Failed to update user:", err);
            setEditError(err.message || "Couldn't save changes. Please try again.");
        } finally {
            setEditing(false);
        }
    };

    const handleEditSubmit = (form) => {
        const escalating = isAdminRole(form.role) && !isAdminRole(activeUser.role);

        if (!escalating) {
            saveEdit(form);
            return;
        }

        setConfirm({
            title: "Grant admin access?",
            description: `${activeUser.fullName} will become ${roleLabel(form.role)} and will be able to manage parts of the system. Make sure this is intended.`,
            confirmLabel: "Grant access",
            tone: "primary",
            onConfirm: () => saveEdit(form),
        });
    };

    // ── Suspend / reinstate ─────────────────────────────────
    const performToggleStatus = async (user) => {
        const nextStatus = user.status === "Suspended" ? "Active" : "Suspended";

        setBusyId(user.id);

        try {
            const data = await request(`${API_BASE}/${user.id}/status`, {
                method: "PUT",
                body: { status: nextStatus },
                fallback: "Failed to update status.",
                messages: { 403: "You don't have permission to change this user's status." },
            });

            setUsers((prev) =>
                prev.map((u) =>
                    u.id === user.id ? { ...u, ...(data?.user || {}), status: nextStatus } : u
                )
            );

            toast.success(
                nextStatus === "Suspended" ? "Account suspended." : "Account reinstated."
            );
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Couldn't update the user's status. Please try again.");
        } finally {
            setBusyId(null);
        }
    };

    const requestToggleStatus = (user) => {
        const suspending = user.status !== "Suspended";

        setConfirm({
            title: suspending ? "Suspend account?" : "Reinstate account?",
            description: suspending
                ? `${user.fullName}'s account will be marked as Suspended. You can reinstate it anytime.`
                : `${user.fullName}'s account will be marked as Active again.`,
            confirmLabel: suspending ? "Suspend" : "Reinstate",
            tone: suspending ? "danger" : "primary",
            onConfirm: () => performToggleStatus(user),
        });
    };

    // ── Delete (soft delete) ────────────────────────────────
    const performDelete = async (user) => {
        setBusyId(user.id);

        try {
            const data = await request(`${API_BASE}/${user.id}`, {
                method: "DELETE",
                fallback: "Failed to delete the account.",
                messages: { 403: "You don't have permission to delete this account." },
            });

            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: "Deleted" } : u)));

            if (activeUser?.id === user.id) {
                setModal(null);
                setActiveUser(null);
            }

            toast.success(data?.message || "User account deleted successfully.");
        } catch (err) {
            console.error("Failed to delete user:", err);
            toast.error(err.message || "Couldn't delete the user account. Please try again.");
        } finally {
            setBusyId(null);
        }
    };

    const requestDelete = (user) => {
        setConfirm({
            title: "Delete account?",
            description: `The account of ${user.fullName} will be deactivated, but historical system records and the official School Record will be preserved.`,
            confirmLabel: "Delete",
            tone: "danger",
            onConfirm: () => performDelete(user),
        });
    };

    // ── Row action rules ────────────────────────────────────
    const canSuspend = (u) =>
        !["Deleted", "Rejected"].includes(u.status) && u.role !== "SuperAdmin" && !isSelf(u);

    const canDelete = (u) => u.status !== "Deleted" && u.role !== "SuperAdmin" && !isSelf(u);

    const menuItems = (u) => {
        const items = [];

        if (canSuspend(u)) {
            items.push(
                u.status === "Suspended"
                    ? { label: "Reinstate", icon: RotateCcw, onClick: () => requestToggleStatus(u) }
                    : { label: "Suspend", icon: Ban, onClick: () => requestToggleStatus(u) }
            );
        }

        if (canDelete(u)) {
            items.push({ label: "Delete", icon: Trash2, danger: true, onClick: () => requestDelete(u) });
        }

        return items;
    };

    const renderActions = (u) => (
        <div className="flex items-center justify-end gap-1">
            {busyId === u.id ? (
                <RefreshCw size={15} className="mr-2 animate-spin text-gray-400" />
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => openView(u)}
                        aria-label={`View ${u.fullName}`}
                        className={iconButton}
                    >
                        <Eye size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={() => openEdit(u)}
                        aria-label={`Edit ${u.fullName}`}
                        className={iconButton}
                    >
                        <Pencil size={15} />
                    </button>

                    <RowMenu items={menuItems(u)} label={`More actions for ${u.fullName}`} />
                </>
            )}
        </div>
    );

    // ── Render ──────────────────────────────────────────────
    const hasFilters = activeChips.length > 0;
    const rangeStart = sorted.length === 0 ? 0 : pageStart + 1;
    const rangeEnd = Math.min(pageStart + pageSize, sorted.length);

    return (
        <div className="users-root w-full min-w-0 max-w-[1250px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
            <style>{`
                .font-display { font-family: 'Fraunces', serif; }
                .users-root { font-family: 'Inter', system-ui, sans-serif; }
                @media (prefers-reduced-motion: reduce) {
                    .users-root * { transition: none !important; animation: none !important; }
                }
            `}</style>

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="font-display text-3xl text-[#1F1F1F] sm:text-4xl">Users</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage student, faculty, and module head accounts.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => loadUsers()}
                        disabled={loading}
                        className={ghostButton}
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>

                    <button type="button" onClick={openAddMember} className={outlineButton}>
                        <Plus size={16} />
                        Add Student / Faculty
                    </button>

                    <button type="button" onClick={openAdd} className={primaryButton}>
                        <Plus size={16} />
                        Add Head
                    </button>
                </div>
            </div>

            {/* Stats (also status filters) */}
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((stat) => {
                    const StatIcon = stat.icon;
                    const selected = statusFilter === stat.key;

                    return (
                        <button
                            key={stat.key}
                            type="button"
                            onClick={() => setStatusFilter(stat.key)}
                            aria-pressed={selected}
                            className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${focusRing} ${
                                selected
                                    ? "border-[#106A2E]/40 ring-2 ring-[#106A2E]/20"
                                    : "border-black/[0.05] hover:border-gray-200"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">{stat.label}</p>

                                    {loading ? (
                                        <div className="mt-2 h-8 w-10 animate-pulse rounded bg-gray-200" />
                                    ) : (
                                        <p className={`mt-1 font-display text-3xl ${stat.number}`}>
                                            {stat.value}
                                        </p>
                                    )}
                                </div>

                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.tone}`}
                                >
                                    <StatIcon size={17} />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Filter bar */}
            <div className="mb-4 rounded-2xl border border-[#E5E1D8] bg-white p-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[220px] flex-1">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, ID, role..."
                            aria-label="Search users"
                            className="w-full rounded-lg border border-[#E5E1D8] py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => handleRoleFilterChange(e.target.value)}
                        aria-label="Filter by role"
                        className={selectClass}
                    >
                        {ROLE_FILTERS.map((role) => (
                            <option key={role} value={role}>
                                {role === "Admin" ? "Admin / Heads" : role}
                            </option>
                        ))}
                    </select>

                    {showInstituteFilter && (
                        <select
                            value={instituteFilter}
                            onChange={(e) => handleInstituteFilterChange(e.target.value)}
                            aria-label="Filter by institute"
                            className={`${selectClass} max-w-[240px]`}
                        >
                            {instituteOptions.map((institute) => (
                                <option key={institute} value={institute}>
                                    {institute}
                                </option>
                            ))}
                        </select>
                    )}

                    {showCourseFilter && (
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            aria-label="Filter by program"
                            className={`${selectClass} max-w-[240px]`}
                        >
                            {courseOptions.map((course) => (
                                <option key={course} value={course}>
                                    {course}
                                </option>
                            ))}
                        </select>
                    )}

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        aria-label="Filter by status"
                        className={selectClass}
                    >
                        {STATUS_FILTERS.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>

                {hasFilters && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#F0EDE4] pt-3">
                        {activeChips.map((chip) => (
                            <span
                                key={chip.key}
                                className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#E1F0E4] py-1 pl-3 pr-1.5 text-xs font-medium text-[#106A2E]"
                            >
                                <span className="truncate">{chip.label}</span>
                                <button
                                    type="button"
                                    onClick={chip.clear}
                                    aria-label={`Remove filter ${chip.label}`}
                                    className={`rounded-full p-0.5 hover:bg-[#106A2E]/10 ${focusRing}`}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}

                        <button
                            type="button"
                            onClick={clearAllFilters}
                            className={`rounded text-xs font-semibold text-gray-500 hover:text-gray-800 hover:underline ${focusRing}`}
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div
                    role="alert"
                    className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => loadUsers()}
                        className={`rounded font-semibold underline ${focusRing}`}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Results */}
            <div className="overflow-hidden rounded-2xl border border-[#E5E1D8] bg-white">
                {loading ? (
                    <LoadingSkeleton />
                ) : sorted.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F5EF] text-gray-300">
                            <UsersIcon size={20} />
                        </div>

                        <p className="mt-4 font-medium text-gray-700">
                            {hasFilters ? "No users match your filters" : "No users yet"}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                            {hasFilters
                                ? "Try a different search term or clear the filters."
                                : "Add a student, faculty member, or module head to get started."}
                        </p>

                        {hasFilters && (
                            <button type="button" onClick={clearAllFilters} className={`mt-5 ${ghostButton}`}>
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden max-h-[70vh] overflow-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr>
                                        <SortHeader
                                            label="User"
                                            sortKey="fullName"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />

                                        {showIdNumber && <th className={thClass}>ID number</th>}

                                        <th className={thClass}>Role</th>

                                        {showAssignedModule && <th className={thClass}>Assigned module</th>}

                                        <SortHeader
                                            label="Status"
                                            sortKey="status"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />

                                        <SortHeader
                                            label="Last active"
                                            sortKey="lastActive"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />

                                        <th className={`${thClass} text-right`}>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pageItems.map((u, i) => (
                                        <tr
                                            key={u.id}
                                            className={`transition hover:bg-gray-50/70 ${
                                                i !== pageItems.length - 1 ? "border-b border-[#F0EDE4]" : ""
                                            } ${u.status === "Deleted" ? "opacity-60" : ""}`}
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <Initials name={u.fullName} />

                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-gray-800">
                                                            {u.fullName}
                                                        </p>
                                                        <p className="truncate text-xs text-gray-400">
                                                            {u.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {showIdNumber && (
                                                <td className="px-5 py-3.5 text-gray-600">
                                                    {u.idNumber || "—"}
                                                </td>
                                            )}

                                            <td className="px-5 py-3.5">
                                                <RolePill role={u.role} />
                                            </td>

                                            {showAssignedModule && (
                                                <td className="px-5 py-3.5 text-gray-600">
                                                    {u.adminModule || "—"}
                                                </td>
                                            )}

                                            <td className="px-5 py-3.5">
                                                <StatusPill status={u.status} />
                                            </td>

                                            <td
                                                className="whitespace-nowrap px-5 py-3.5 text-gray-500"
                                                title={formatDate(u.lastActive)}
                                            >
                                                {timeAgo(u.lastActive)}
                                            </td>

                                            <td className="px-5 py-3.5">{renderActions(u)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <ul className="divide-y divide-[#F0EDE4] md:hidden">
                            {pageItems.map((u) => (
                                <li
                                    key={u.id}
                                    className={`px-4 py-4 ${u.status === "Deleted" ? "opacity-60" : ""}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Initials name={u.fullName} />

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-gray-800">{u.fullName}</p>
                                            <p className="truncate text-xs text-gray-400">{u.email}</p>

                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <RolePill role={u.role} />
                                                <StatusPill status={u.status} />
                                            </div>

                                            <p className="mt-2 text-xs text-gray-400">
                                                {[
                                                    u.idNumber,
                                                    u.adminModule,
                                                    `Active ${timeAgo(u.lastActive)}`,
                                                ]
                                                    .filter(Boolean)
                                                    .join("  •  ")}
                                            </p>
                                        </div>

                                        {renderActions(u)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            {/* Pagination */}
            {!loading && sorted.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-400">
                        Showing {rangeStart}–{rangeEnd} of {sorted.length} users
                        {sorted.length !== users.length && ` (${users.length} total)`}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-gray-500">
                            Rows
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="rounded-lg border border-[#E5E1D8] bg-white px-2 py-1.5 text-xs outline-none focus:border-[#106A2E]"
                            >
                                {PAGE_SIZES.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                aria-label="Previous page"
                                className={`inline-flex items-center gap-1 rounded-lg border border-[#E5E1D8] bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 ${focusRing}`}
                            >
                                <ChevronLeft size={14} />
                                Previous
                            </button>

                            <span className="text-xs text-gray-400">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() => setPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                aria-label="Next page"
                                className={`inline-flex items-center gap-1 rounded-lg border border-[#E5E1D8] bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 ${focusRing}`}
                            >
                                Next
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add head */}
            {modal === "add" && (
                <Modal title="Add module head" onClose={closeModal} locked={adding}>
                    <HeadForm
                        onCancel={closeModal}
                        onSubmit={handleAddHead}
                        submitting={adding}
                        serverError={addError}
                    />
                </Modal>
            )}

            {/* Add member */}
            {modal === "add-member" && (
                <Modal title="Add student / faculty" onClose={closeModal} locked={adding}>
                    <MemberForm
                        onCancel={closeModal}
                        onSubmit={handleAddMember}
                        submitting={adding}
                        serverError={addError}
                    />
                </Modal>
            )}

            {/* Edit user */}
            {modal === "edit" && activeUser && (
                <Modal title="Edit user" onClose={closeModal} locked={editing}>
                    <UserForm
                        initial={activeUser}
                        onCancel={closeModal}
                        onSubmit={handleEditSubmit}
                        submitting={editing}
                        serverError={editError}
                        submitLabel="Save changes"
                    />
                </Modal>
            )}

            {/* View user */}
            {modal === "view" && activeUser && (
                <Modal title="User details" onClose={closeModal}>
                    <div className="mb-4 flex items-center gap-3">
                        <Initials name={activeUser.fullName} size="w-11 h-11" />

                        <div className="min-w-0">
                            <p className="truncate font-medium text-gray-800">{activeUser.fullName}</p>
                            <p className="truncate text-xs text-gray-400">{activeUser.email}</p>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <DetailRow label="Role">{roleLabel(activeUser.role)}</DetailRow>

                        {activeUser.adminModule && (
                            <DetailRow label="Assigned module">{activeUser.adminModule}</DetailRow>
                        )}

                        {activeUser.idNumber && (
                            <DetailRow label="ID number">{activeUser.idNumber}</DetailRow>
                        )}

                        {activeUser.role === "Student" && (
                            <>
                                <DetailRow label="Institute">{getInstitute(activeUser) || "—"}</DetailRow>
                                <DetailRow label="Program">{activeUser.course || "—"}</DetailRow>
                                <DetailRow label="Year level">{activeUser.yearLevel || "—"}</DetailRow>
                            </>
                        )}

                        {activeUser.role === "Faculty" && (
                            <DetailRow label="Institute">{activeUser.institute || "—"}</DetailRow>
                        )}

                        {(activeUser.role === "Student" || activeUser.role === "Faculty") && (
                            <DetailRow label="ID verification">
                                {activeUser.physicalIdVerificationStatus || "Not verified"}
                            </DetailRow>
                        )}

                        <DetailRow label="Status">
                            <StatusPill status={activeUser.status} />
                        </DetailRow>

                        <DetailRow label="Last active">{formatDate(activeUser.lastActive)}</DetailRow>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                const user = activeUser;
                                setModal(null);
                                openEdit(user);
                            }}
                            className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-[#E5E1D8] text-gray-600 transition hover:bg-gray-50 ${focusRing}`}
                        >
                            <Pencil size={13} />
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={closeModal}
                            className={`text-xs font-semibold px-4 py-2 rounded-lg text-white bg-[#0E3B22] transition hover:bg-[#0a2c19] ${focusRing}`}
                        >
                            Close
                        </button>
                    </div>
                </Modal>
            )}

            {/* Credentials (one-time) */}
            {credentials && <CredentialsModal data={credentials} onClose={closeCredentials} />}

            {/* Confirm */}
            {confirm && <ConfirmDialog config={confirm} onClose={closeConfirm} />}
        </div>
    );
}