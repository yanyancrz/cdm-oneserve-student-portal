import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    AlertTriangle,
    Check,
    Copy,
    Eye,
    EyeOff,
    MoreHorizontal,
    RefreshCw,
    X,
} from "lucide-react";
import { API_URL } from "../../config/api";
import {
    ADMIN_MODULES,
    INSTITUTES,
    INSTITUTE_PROGRAMS,
    USER_ROLE_OPTIONS,
    copyText,
    fieldBase,
    focusRing,
    generatePassword,
    getInstituteFromCourse,
    getPasswordChecks,
    iconButton,
    isAdminRole,
    roleLabel,
    ROLE_STYLES,
    STATUS_DOTS,
    STATUS_STYLES,
    thClass,
    validatePassword,
} from "./userAdminUtils";

// ─────────────────────────────────────────────────────────────
// Shared table chrome, modals and forms for the admin
// user-management pages (Users.jsx + ServiceHeads.jsx).
// Components ONLY in this file - constants and helpers live
// in userAdminUtils.js so Fast Refresh keeps working
// (react-refresh/only-export-components).
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Small UI pieces
// ─────────────────────────────────────────────────────────────
export function Initials({ name, size = "w-9 h-9", picture }) {
    const initials = (name || "User")
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    // Profile photo kung may ibinigay ang API;
    // kung wala, initials circle pa rin.
    const photo = picture
        ? picture.startsWith("http")
            ? picture
            : `${API_URL}${picture}`
        : null;

    if (photo) {
        return (
            <img
                src={photo}
                alt={name || "User"}
                className={`${size} rounded-full object-cover flex-shrink-0`}
            />
        );
    }

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

export function RolePill({ role }) {
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

export function VerificationPill({ method }) {
    if (method === "PNM Email") {
        return (
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                PNM Email
            </span>
        );
    }

    if (method === "Physical ID") {
        return (
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                Physical ID
            </span>
        );
    }

    return <span className="text-xs text-gray-300">—</span>;
}

export function StatusPill({ status }) {
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

// Portaled to document.body: AdminLayout renders pages inside a
// <div class="relative z-10"> stacking context, so a plain fixed z-50
// modal loses to the layout's fixed z-50 sidebar. z-[60] clears it.
export function Modal({ title, onClose, children, locked = false, size = "max-w-md" }) {
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

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
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
        </div>, document.body
    );
}

// Portaled like Modal; z-[70] keeps it above any open Modal (z-[60]).
export function ConfirmDialog({ config, onClose }) {
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

    return createPortal(
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
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
        </div>, document.body
    );
}

export function TextField({ label, labelAction, error, hint, rightSlot, readOnly, className = "", ...props }) {
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

export function SelectField({ label, options, placeholder, ...props }) {
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

export function FormActions({ onCancel, submitting, submitLabel, submittingLabel }) {
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

export function ErrorNote({ message }) {
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
export function PasswordFields({ password, confirmPassword, onChange }) {
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
export function HeadForm({ onCancel, onSubmit, submitting, serverError }) {
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
// User form (edit only)
// ─────────────────────────────────────────────────────────────
export function UserForm({ initial, onCancel, onSubmit, submitting, serverError, submitLabel }) {
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
export function CredentialsModal({ data, onClose }) {
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
export function SortHeader({ label, sortKey, sort, onSort }) {
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
export function RowMenu({ items, label }) {
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

            {/* Menu portaled to body so the fixed z-50 sidebar can't
                cover it on narrow screens; z-[55] sits above the
                sidebar but below modals (z-[60]/z-[70]). */}
            {pos &&
                createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    className="fixed z-[55] w-44 rounded-xl border border-[#E5E1D8] bg-white p-1 shadow-lg"
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
                </div>, document.body
            )}
        </>
    );
}

export function LoadingSkeleton() {
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

export function DetailRow({ label, children }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-800 text-right">{children}</span>
        </div>
    );
}
