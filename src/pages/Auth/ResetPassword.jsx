import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Check, X } from "lucide-react";
import LoadingModal from "../../components/LoadingModal/LoadingModal";
import { API_URL } from "../../config/api";
import BackgroundLayout from "../../layouts/BackgroundLayout";

// =========================================================
// STRONG PASSWORD RULES
// =========================================================

const getPasswordRules = (pw, email = "") => {
    const emailName = (email || "").split("@")[0].trim().toLowerCase();
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
            label: "Not your email name",
            ok: pw.length > 0 && !(emailName.length >= 3 && lower.includes(emailName)),
        },
    ];
};

const STRENGTH = [
    { label: "Too weak", bar: "bg-red-500", text: "text-red-600" },
    { label: "Weak", bar: "bg-orange-500", text: "text-orange-600" },
    { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
    { label: "Good", bar: "bg-lime-500", text: "text-lime-600" },
    { label: "Strong", bar: "bg-emerald-600", text: "text-emerald-700" },
];

function PasswordStrength({ rules, password }) {
    if (!password) return null;

    const passed = rules.filter((r) => r.ok).length;
    const level =
        passed >= rules.length
            ? 4
            : Math.min(3, Math.floor((passed / rules.length) * 4));
    const filled = level === 4 ? 4 : Math.max(1, level);
    const info = STRENGTH[level];

    return (
        <div className="mt-2.5" aria-live="polite">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < filled ? info.bar : "bg-slate-200"
                        }`}
                    />
                ))}
            </div>

            <p className={`mt-1 text-[11px] font-semibold ${info.text}`}>
                {info.label}
            </p>

            <ul className="mt-1.5 grid grid-cols-1 gap-y-0.5 sm:grid-cols-2 sm:gap-x-3">
                {rules.map((r) => (
                    <li
                        key={r.key}
                        className={`flex items-center gap-1.5 text-[11px] ${
                            r.ok ? "text-emerald-700" : "text-slate-400"
                        }`}
                    >
                        {r.ok ? (
                            <Check size={12} aria-hidden="true" />
                        ) : (
                            <X size={12} aria-hidden="true" />
                        )}
                        {r.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function EyeToggle({ shown, onToggle }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={shown ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
        >
            {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
    );
}

export default function ResetPassword() {

    const [otpCode, setOtpCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const email =
        localStorage.getItem("resetEmail");

    const passwordRules = getPasswordRules(newPassword, email);
    const isPasswordStrong = passwordRules.every((r) => r.ok);

    const handleResetPassword = async () => {

        if (
            !otpCode.trim() ||
            !newPassword.trim() ||
            !confirmPassword.trim()
        ) {
            toast.error("Please complete all fields.");
            return;
        }

        const weakRule = passwordRules.find((r) => !r.ok);

        if (weakRule) {
            toast.error(
                `Password is not strong enough: ${weakRule.label.toLowerCase()}.`
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                `${API_URL}/api/auth/reset-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        otpCode,
                        newPassword
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {

                toast.success(
                    data.message || "Password updated successfully."
                );

                localStorage.removeItem(
                    "resetEmail"
                );

                setTimeout(() => {

                    navigate("/");

                }, 1500);

            } else {

                toast.error(
                    data.message || "Unable to reset password."
                );

            }

        } catch (error) {

            toast.error(
                error.message || "Unable to connect to API"
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <>
            {
                loading && (
                    <LoadingModal
                        message="Updating Password..."
                    />
                )
            }

            <BackgroundLayout>

                <div
                    className="relative min-h-screen overflow-hidden bg-[#F7F5EF] flex items-center justify-center p-6"
                >

                    {/* =========================
                        BACKGROUND
                    ========================= */}

                    <div className="pointer-events-none fixed inset-0 overflow-hidden">
                        <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
                        <div className="absolute right-[-140px] top-[30%] h-[32rem] w-[32rem] rounded-full bg-cyan-300/10 blur-3xl" />
                        <div className="absolute bottom-[-120px] left-[30%] h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />
                        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(16,106,46,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,106,46,.35)_1px,transparent_1px)] bg-[size:40px_40px]" />
                    </div>

                    <style>{`
                        @keyframes resetReveal {
                            from {
                                opacity: 0;
                                transform: translateY(15px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                        .reset-reveal {
                            animation: resetReveal .65s cubic-bezier(.2,.8,.2,1) both;
                        }
                    `}</style>

                    <div className="reset-reveal bg-white rounded-[28px] p-9 w-full max-w-md shadow-xl shadow-black/5 border border-slate-200 relative z-10">

                        {/* BRAND ICON */}

                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-900/20">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>

                        <h1 className="text-xl font-semibold text-center text-slate-800">
                            Reset Password
                        </h1>

                        <p className="text-sm text-slate-400 text-center mt-1 mb-7">
                            Enter OTP and new password.
                        </p>

                        <div className="mb-3.5">
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                OTP Code
                            </label>

                            <input
                                type="text"
                                placeholder="6-digit code"
                                value={otpCode}
                                onChange={(e) =>
                                    setOtpCode(e.target.value)
                                }
                                className="
                                    w-full
                                    px-4 py-3
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    text-sm
                                    text-slate-700
                                    outline-none
                                    focus:border-[#106A2E]
                                    focus:bg-white
                                    transition-colors
                                "
                            />
                        </div>

                        <div className="mb-3.5">
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                New Password
                            </label>

                            <div className="relative">
                                <input
                                    type={showNew ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    className="
                                        w-full
                                        pl-4 pr-11 py-3
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-slate-50
                                        text-sm
                                        text-slate-700
                                        outline-none
                                        focus:border-[#106A2E]
                                        focus:bg-white
                                        transition-colors
                                    "
                                />

                                <EyeToggle
                                    shown={showNew}
                                    onToggle={() => setShowNew((v) => !v)}
                                />
                            </div>

                            <PasswordStrength
                                rules={passwordRules}
                                password={newPassword}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                Confirm Password
                            </label>

                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="
                                        w-full
                                        pl-4 pr-11 py-3
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-slate-50
                                        text-sm
                                        text-slate-700
                                        outline-none
                                        focus:border-[#106A2E]
                                        focus:bg-white
                                        transition-colors
                                    "
                                />

                                <EyeToggle
                                    shown={showConfirm}
                                    onToggle={() => setShowConfirm((v) => !v)}
                                />
                            </div>

                            {confirmPassword && (
                                <p
                                    className={`mt-1.5 text-[11px] font-medium ${
                                        confirmPassword === newPassword
                                            ? "text-emerald-700"
                                            : "text-red-600"
                                    }`}
                                >
                                    {confirmPassword === newPassword
                                        ? "Passwords match"
                                        : "Passwords do not match"}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleResetPassword}
                            disabled={
                                loading ||
                                !isPasswordStrong ||
                                newPassword !== confirmPassword
                            }
                            className="
                                w-full
                                bg-gradient-to-br
                                from-[#106A2E]
                                to-[#0E3B22]
                                hover:opacity-90
                                active:scale-[0.98]
                                text-white
                                p-3
                                rounded-xl
                                font-semibold
                                text-sm
                                transition-all
                                shadow-lg
                                shadow-emerald-900/20
                                disabled:opacity-60
                                disabled:cursor-not-allowed
                            "
                        >
                            {loading ? "Updating..." : "Update Password"}
                        </button>

                        <div className="flex items-center gap-2.5 my-5">
                            <span className="flex-1 h-px bg-slate-200" />
                            <span className="text-[11px] uppercase tracking-wider text-slate-400">
                                Or
                            </span>
                            <span className="flex-1 h-px bg-slate-200" />
                        </div>

                        <div className="text-center">
                            <Link
                                to="/"
                                className="text-[#106A2E] font-semibold hover:underline text-sm"
                            >
                                Back to Login
                            </Link>
                        </div>

                    </div>

                </div>

            </BackgroundLayout>

        </>
    );
}