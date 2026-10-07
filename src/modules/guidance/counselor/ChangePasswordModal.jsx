import { useState } from "react";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

import { Note } from "../components/GuidanceStates";
import { StepLabel, fieldClass } from "../components/GuidanceUi";
import { API_URL } from "../../../config/api";

const MIN_LENGTH = 8;

// Same checks as the admin Change Password tab.
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

// Centered modal: counselor changes their account password.
// POST /api/profile/change-password (same endpoint the admin tab uses).
export default function ChangePasswordModal({ userId, onClose }) {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const strength = getPasswordStrength(next);
    const checks = getPasswordChecks(next);

    const submit = async () => {
        setError("");

        if (!current.trim()) return setError("Current password is required.");
        if (next.length < MIN_LENGTH) return setError(`New password must be at least ${MIN_LENGTH} characters.`);
        if (next === current) return setError("New password cannot be the same as your current password.");
        if (next !== confirm) return setError("Passwords do not match.");

        setSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/api/profile/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    currentPassword: current,
                    newPassword: next,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) throw new Error(data?.message || "Could not change your password.");

            toast.success(data?.message || "Password changed successfully.");
            onClose();
        } catch (e) {
            setError(e.message || "Could not change your password.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Change password"
                className="mx-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-800">Change password</h2>
                        <p className="text-xs text-slate-500">Use a password you have not used before.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <StepLabel n={1}>Current password</StepLabel>
                        <div className="relative">
                            <input
                                type={showCurrent ? "text" : "password"}
                                autoComplete="current-password"
                                aria-label="Current password"
                                value={current}
                                onChange={(e) => setCurrent(e.target.value)}
                                className={`${fieldClass("green")} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent((v) => !v)}
                                aria-label={showCurrent ? "Hide password" : "Show password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                            >
                                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <StepLabel n={2}>New password</StepLabel>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                autoComplete="new-password"
                                aria-label="New password"
                                value={next}
                                onChange={(e) => setNext(e.target.value)}
                                className={`${fieldClass("green")} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew((v) => !v)}
                                aria-label={showNew ? "Hide password" : "Show password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                            >
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

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
                                    <span className={`text-xs font-medium ${strength.text}`}>{strength.label}</span>
                                </div>

                                <ul className="mt-3 space-y-1.5">
                                    {checks.map((check) => (
                                        <li
                                            key={check.label}
                                            className={`flex items-center gap-2 text-xs ${
                                                check.passed ? "text-[#106A2E]" : "text-slate-400"
                                            }`}
                                        >
                                            <span
                                                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                                                    check.passed ? "bg-emerald-50" : "bg-slate-100"
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

                    <div>
                        <StepLabel n={3}>Confirm new password</StepLabel>
                        <input
                            type={showNew ? "text" : "password"}
                            autoComplete="new-password"
                            aria-label="Confirm new password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && submit()}
                            className={fieldClass("green")}
                        />
                    </div>

                    {error && <Note tone="error">{error}</Note>}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition active:scale-[0.99]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={submitting}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#106A2E] py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
                        >
                            {submitting && <Loader2 className="animate-spin" size={16} aria-hidden="true" />}
                            Update password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
