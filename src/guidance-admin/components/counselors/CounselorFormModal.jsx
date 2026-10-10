import { useState } from "react";
import { Eye, EyeOff, Check, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import { Modal } from "../common";
import guidanceHeadService from "../../services/guidanceHeadService";

const input =
    "w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#106A2E]";
const label = "mb-1.5 block text-xs font-medium text-gray-500";

const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";

const passwordRules = (pw, idNumber = "", email = "") => {
    const emailName = email.split("@")[0].trim().toLowerCase();
    const lower = pw.toLowerCase();
    return [
        { key: "len", label: "At least 8 characters", ok: pw.length >= 8 },
        { key: "upper", label: "An uppercase letter (A-Z)", ok: /[A-Z]/.test(pw) },
        { key: "lower", label: "A lowercase letter (a-z)", ok: /[a-z]/.test(pw) },
        { key: "digit", label: "A number (0-9)", ok: /\d/.test(pw) },
        { key: "symbol", label: "A symbol (! @ # $ % ...)", ok: /[^A-Za-z0-9\s]/.test(pw) },
        { key: "space", label: "No spaces", ok: pw.length > 0 && !/\s/.test(pw) },
        {
            key: "personal",
            label: "Does not contain the email name or ID number",
            ok:
                pw.length > 0 &&
                !(emailName.length >= 3 && lower.includes(emailName)) &&
                !(idNumber.trim().length >= 3 && lower.includes(idNumber.trim().toLowerCase())),
        },
    ];
};

// Cryptographically random password that always passes every rule above.
const generatePassword = (length = 12) => {
    const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", SYMBOLS];
    const all = sets.join("");
    const rand = (n) => {
        const buf = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / n) * n;
        do crypto.getRandomValues(buf);
        while (buf[0] >= limit);
        return buf[0] % n;
    };
    const chars = sets.map((s) => s[rand(s.length)]);
    while (chars.length < length) chars.push(all[rand(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
        const j = rand(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
};

const STRENGTH = [
    { label: "Too weak", bar: "bg-red-500", text: "text-red-600" },
    { label: "Weak", bar: "bg-orange-500", text: "text-orange-600" },
    { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
    { label: "Good", bar: "bg-lime-500", text: "text-lime-600" },
    { label: "Strong", bar: "bg-emerald-600", text: "text-emerald-700" },
];

function PasswordMeter({ rules, password }) {
    const passed = rules.filter((r) => r.ok).length;
    const level = !password ? -1 : passed >= rules.length ? 4 : Math.min(3, Math.floor((passed / rules.length) * 4));
    const info = STRENGTH[Math.max(level, 0)];
    const filled = !password ? 0 : level === 4 ? 4 : Math.max(1, Math.min(3, level));

    return (
        <div aria-live="polite">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < filled ? info.bar : "bg-gray-200"
                        }`}
                    />
                ))}
            </div>
            {password && <p className={`mt-1 text-[11px] font-semibold ${info.text}`}>{info.label}</p>}
            <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
                {rules.map((r) => (
                    <li
                        key={r.key}
                        className={`flex items-center gap-1.5 text-[11px] ${r.ok ? "text-emerald-700" : "text-gray-400"}`}
                    >
                        {r.ok ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
                        {r.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Field({ children, className = "" }) {
    return <div className={className}>{children}</div>;
}

// Rendered only while open (the page unmounts it on close), so the form always
// starts from the values below - no reset effect needed.
//
// Props
//  - counselor : null for "add", or the row being edited
export default function CounselorFormModal({ counselor, onClose, onSaved }) {
    const isEdit = Boolean(counselor);

    const [fullName, setFullName] = useState(counselor?.fullName || "");
    const [email, setEmail] = useState(counselor?.email || "");
    const [idNumber, setIdNumber] = useState(counselor?.idNumber || "");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [title, setTitle] = useState(counselor?.title || "");
    const [room, setRoom] = useState(counselor?.room || "");
    const [department, setDepartment] = useState(counselor?.department || "");
    const [phone, setPhone] = useState(counselor?.phone || "");
    const [specializations, setSpecializations] = useState(counselor?.specializations || "");
    const [bio, setBio] = useState(counselor?.bio || "");
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState(null);

    const validate = () => {
        if (!fullName.trim()) return "Full name is required.";
        if (!email.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
        if (!isEdit && !idNumber.trim()) return "ID number is required.";
        if (!isEdit) {
            const failed = passwordRules(password, idNumber, email).find((r) => !r.ok);
            if (failed) return `Password is not strong enough: ${failed.label.toLowerCase()}.`;
        }
        return null;
    };

    const submit = async (event) => {
        event.preventDefault();

        const problem = validate();
        if (problem) {
            setFormError(problem);
            return;
        }

        setBusy(true);
        setFormError(null);

        const payload = {
            fullName: fullName.trim(),
            email: email.trim(),
            title: title.trim() || null,
            room: room.trim() || null,
            department: department.trim() || null,
            phone: phone.trim() || null,
            bio: bio.trim() || null,
            specializations: specializations
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
        };

        try {
            if (isEdit) {
                await guidanceHeadService.updateCounselor(counselor.userId, payload);
                toast.success("Counselor updated.");
            } else {
                await guidanceHeadService.createCounselor({
                    ...payload,
                    idNumber: idNumber.trim(),
                    password,
                });
                toast.success("Counselor account created.");
            }

            onSaved?.();
            onClose();
        } catch (err) {
            setFormError(err?.message || "Unable to save the counselor.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open
            onClose={busy ? undefined : onClose}
            title={isEdit ? "Edit counselor" : "Add counselor"}
            size="lg"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="counselor-form"
                        disabled={busy}
                        className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                        {busy ? "Saving..." : isEdit ? "Save changes" : "Create account"}
                    </button>
                </>
            }
        >
            <form id="counselor-form" onSubmit={submit} className="space-y-4">
                {formError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                        {formError}
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                        <label className={label} htmlFor="c-fullname">
                            Full name *
                        </label>
                        <input
                            id="c-fullname"
                            className={input}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Juan Dela Cruz"
                            required
                        />
                    </Field>

                    <Field>
                        <label className={label} htmlFor="c-email">
                            Email *
                        </label>
                        <input
                            id="c-email"
                            type="email"
                            className={input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="counselor@cdm.edu.ph"
                            required
                        />
                    </Field>

                    {!isEdit && (
                        <>
                            <Field>
                                <label className={label} htmlFor="c-idnumber">
                                    ID number *
                                </label>
                                <input
                                    id="c-idnumber"
                                    className={input}
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value)}
                                    placeholder="22-00000"
                                    required
                                />
                            </Field>

                            <Field>
                                <label className={label} htmlFor="c-password">
                                    Temporary password *
                                </label>
                                <div className="relative">
                                    <input
                                        id="c-password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        className={`${input} pr-10`}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="At least 8 characters"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPassword(generatePassword());
                                        setShowPassword(true);
                                    }}
                                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#106A2E] hover:underline"
                                >
                                    <RefreshCw size={12} aria-hidden="true" />
                                    Generate strong password
                                </button>

                                <p className="mt-1 text-[11px] text-gray-400">
                                    Share this with the counselor - they can change it after signing in.
                                </p>
                            </Field>

                            <Field className="sm:col-span-2">
                                <PasswordMeter rules={passwordRules(password, idNumber, email)} password={password} />
                            </Field>
                        </>
                    )}

                    <Field>
                        <label className={label} htmlFor="c-title">
                            Title
                        </label>
                        <input
                            id="c-title"
                            className={input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Licensed Guidance Counselor"
                        />
                    </Field>

                    <Field>
                        <label className={label} htmlFor="c-department">
                            Department
                        </label>
                        <input
                            id="c-department"
                            className={input}
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="Guidance Office"
                        />
                    </Field>

                    <Field>
                        <label className={label} htmlFor="c-room">
                            Room
                        </label>
                        <input
                            id="c-room"
                            className={input}
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            placeholder="rm 101"
                        />
                    </Field>

                    <Field>
                        <label className={label} htmlFor="c-phone">
                            Contact number
                        </label>
                        <input
                            id="c-phone"
                            className={input}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="09xx xxx xxxx"
                        />
                    </Field>

                    <Field className="sm:col-span-2">
                        <label className={label} htmlFor="c-spec">
                            Specializations
                        </label>
                        <input
                            id="c-spec"
                            className={input}
                            value={specializations}
                            onChange={(e) => setSpecializations(e.target.value)}
                            placeholder="Academic, Personal, Career"
                        />
                        <p className="mt-1 text-[11px] text-gray-400">Separate each with a comma.</p>
                    </Field>

                    <Field className="sm:col-span-2">
                        <label className={label} htmlFor="c-bio">
                            Short bio
                        </label>
                        <textarea
                            id="c-bio"
                            rows={3}
                            className={`${input} resize-y`}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Shown to students on the counselor card."
                        />
                    </Field>
                </div>
            </form>
        </Modal>
    );
}