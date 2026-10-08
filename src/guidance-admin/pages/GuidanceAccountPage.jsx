import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, UserCog } from "lucide-react";

import { PageHeader, StatusBadge } from "../components/common";
import { useGuidanceHead } from "../context/guidanceHeadStore";
import guidanceHeadService from "../services/guidanceHeadService";
import { formatDateTime, initials, statusTone } from "../utils/format";

const input =
    "w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#106A2E]";
const label = "mb-1.5 block text-sm font-medium text-gray-700";
const hint = "mt-1 text-xs text-gray-400";

const MIN_LENGTH = 8;

// Same rules the counselor and admin Change Password forms show, so every
// OneServe password screen agrees on what "good" looks like.
const getPasswordChecks = (password) => [
    { label: `At least ${MIN_LENGTH} characters`, passed: password.length >= MIN_LENGTH },
    { label: "Upper and lowercase letters", passed: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "At least one number", passed: /\d/.test(password) },
    { label: "At least one symbol", passed: /[^A-Za-z0-9]/.test(password) },
];

const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: "", bar: "bg-slate-200", text: "text-slate-400" };

    const passed = getPasswordChecks(password).filter((c) => c.passed).length;

    if (password.length < MIN_LENGTH || passed <= 1) {
        return { score: 1, label: "Weak", bar: "bg-red-500", text: "text-red-600" };
    }
    if (passed <= 3) {
        return { score: 2, label: "Fair", bar: "bg-amber-500", text: "text-amber-600" };
    }
    return { score: 3, label: "Strong", bar: "bg-[#106A2E]", text: "text-[#106A2E]" };
};

function PasswordField({ id, labelText, autoComplete, value, onChange, show, onToggle, onKeyDown }) {
    return (
        <div>
            <label className={label} htmlFor={id}>
                {labelText}
            </label>

            <div className="relative">
                <input
                    id={id}
                    type={show ? "text" : "password"}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    className={`${input} pr-10`}
                />

                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={show ? `Hide ${labelText.toLowerCase()}` : `Show ${labelText.toLowerCase()}`}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
}

function DetailRow({ term, children }) {
    return (
        <div className="flex items-start justify-between gap-4 border-t border-black/[0.05] py-3 first:border-t-0 first:pt-0">
            <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400">{term}</dt>
            <dd className="min-w-0 text-right text-sm font-medium break-words text-gray-700">{children}</dd>
        </div>
    );
}

// The Guidance Head's own account: what they are signed in as, and the form to
// change that account's password. POST /api/admin/guidance/change-password.
export default function GuidanceAccountPage() {
    const { user } = useGuidanceHead();

    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const strength = getPasswordStrength(next);
    const checks = getPasswordChecks(next);

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        if (!current) return setError("Current password is required.");
        if (next.length < MIN_LENGTH) return setError(`New password must be at least ${MIN_LENGTH} characters.`);
        if (next === current) return setError("New password cannot be the same as your current password.");
        if (next !== confirm) return setError("Passwords do not match.");

        setSubmitting(true);

        try {
            const result = await guidanceHeadService.changePassword({
                currentPassword: current,
                newPassword: next,
            });

            toast.success(result?.message || "Password changed successfully.");

            setCurrent("");
            setNext("");
            setConfirm("");
        } catch (err) {
            setError(err?.message || "Could not change your password.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <PageHeader
                eyebrow="Account"
                icon={UserCog}
                title="My account"
                description="Who you are signed in as, and the password you use to reach this portal."
            />

            <div className="grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                {/* -------------------------------------------------- */}
                {/* SIGNED-IN ACCOUNT                                   */}
                {/* -------------------------------------------------- */}
                <section className="h-fit rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div
                            aria-hidden="true"
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-lg font-semibold text-white shadow-sm ring-2 ring-[#E1F0E4]"
                        >
                            {initials(user?.fullName)}
                        </div>

                        <div className="min-w-0">
                            <p className="break-words text-base font-semibold text-gray-800">
                                {user?.fullName || "—"}
                            </p>

                            <p className="break-words text-sm text-gray-500">{user?.email || "—"}</p>
                        </div>
                    </div>

                    <dl className="mt-5">
                        <DetailRow term="Role">{user?.roleLabel || user?.role || "—"}</DetailRow>

                        <DetailRow term="Status">
                            <StatusBadge tone={statusTone(user?.accountStatus)}>
                                {user?.accountStatus || "—"}
                            </StatusBadge>
                        </DetailRow>

                        <DetailRow term="Last sign-in">{formatDateTime(user?.lastLoginAt)}</DetailRow>
                    </dl>

                    <p className="mt-4 border-t border-black/[0.05] pt-3 text-xs leading-relaxed text-gray-400">
                        Changes made here only affect this account. Counselors and students keep their own
                        passwords.
                    </p>
                </section>

                {/* -------------------------------------------------- */}
                {/* CHANGE PASSWORD                                      */}
                {/* -------------------------------------------------- */}
                <form
                    onSubmit={submit}
                    className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm"
                >
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">Change password</h2>
                        <p className={hint}>Use a password you have not used before.</p>
                    </div>

                    <div className="mt-4 space-y-4">
                        <PasswordField
                            id="gh-current-password"
                            labelText="Current password"
                            autoComplete="current-password"
                            value={current}
                            onChange={setCurrent}
                            show={showCurrent}
                            onToggle={() => setShowCurrent((v) => !v)}
                        />

                        <div>
                            <PasswordField
                                id="gh-new-password"
                                labelText="New password"
                                autoComplete="new-password"
                                value={next}
                                onChange={setNext}
                                show={showNew}
                                onToggle={() => setShowNew((v) => !v)}
                            />

                            {next && (
                                <div className="mt-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-1 gap-1.5">
                                            {[1, 2, 3].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                                                        strength.score >= level ? strength.bar : "bg-slate-200"
                                                    }`}
                                                />
                                            ))}
                                        </div>

                                        <span className={`text-xs font-medium ${strength.text}`}>
                                            {strength.label}
                                        </span>
                                    </div>

                                    <ul className="mt-3 space-y-1.5">
                                        {checks.map((check) => (
                                            <li
                                                key={check.label}
                                                className={`flex items-center gap-2 text-xs ${
                                                    check.passed ? "text-[#106A2E]" : "text-gray-400"
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-4 w-4 items-center justify-center rounded-full ${
                                                        check.passed ? "bg-[#E1F0E4]" : "bg-slate-100"
                                                    }`}
                                                >
                                                    {check.passed && "✓"}
                                                </span>
                                                {check.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <PasswordField
                            id="gh-confirm-password"
                            labelText="Confirm new password"
                            autoComplete="new-password"
                            value={confirm}
                            onChange={setConfirm}
                            show={showNew}
                            onToggle={() => setShowNew((v) => !v)}
                            onKeyDown={(e) => e.key === "Enter" && submit(e)}
                        />

                        {error && (
                            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                            >
                                {submitting && <Loader2 className="animate-spin" size={16} aria-hidden="true" />}
                                {submitting ? "Updating..." : "Update password"}
                            </button>
                        </div>

                        <p className={hint}>
                            You stay signed in on this device after the change. The password takes effect the
                            next time you log in.
                        </p>
                    </div>
                </form>
            </div>
        </>
    );
}
