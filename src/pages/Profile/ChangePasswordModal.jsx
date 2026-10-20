import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";

const authHeaders = () => {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

    return token ? { Authorization: `Bearer ${token}` } : {};
};
import { KeyRound, Mail, ShieldCheck } from "lucide-react";

// ==========================================
// CHANGE PASSWORD (Profile)
// ==========================================
// Two steps, both proven against the student number + account email:
//   1. Request a one-time code mailed to that email.
//   2. Enter the code and the new password.
// The backend clears the "you are still on the password we gave you" flag
// when the change succeeds, so this is also how a user gets rid of the
// dashboard alert.
// ==========================================

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-emerald-100";

function Label({ htmlFor, children }) {
    return (
        <label
            htmlFor={htmlFor}
            className="mb-1 block text-xs font-medium text-slate-600"
        >
            {children}
        </label>
    );
}

export default function ChangePasswordModal({
    idNumber = "",
    email = "",
    onClose,
    onSuccess,
}) {
    const [step, setStep] = useState(1);

    const [form, setForm] = useState({
        idNumber,
        email,
        otpCode: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Escape closes the dialog unless a request is in flight.
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape" && !submitting) onClose();
        };

        const previousOverflow = document.body.style.overflow;

        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose, submitting]);

    const update = (field, value) =>
        setForm((previous) => ({ ...previous, [field]: value }));

    // =======================
    // STEP 1 — SEND THE CODE
    // =======================

    const handleSendOtp = async (event) => {
        event.preventDefault();

        const next = {};

        if (!form.idNumber.trim()) {
            next.idNumber = "Student number is required.";
        }

        if (!form.email.trim()) {
            next.email = "Account email is required.";
        }

        if (Object.keys(next).length) {
            setErrors(next);
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            const response = await fetch(
                `${API_URL}/api/profile/password-otp/request`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders(),
                    },
                    body: JSON.stringify({
                        idNumber: form.idNumber.trim(),
                        email: form.email.trim(),
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message || "We couldn't send the code."
                );
            }

            toast.success("A code was sent to your email.");
            setStep(2);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ==========================
    // STEP 2 — CHANGE PASSWORD
    // ==========================

    const handleChangePassword = async (event) => {
        event.preventDefault();

        const next = {};

        if (!form.otpCode.trim()) {
            next.otpCode = "Enter the code from your email.";
        } else if (form.otpCode.trim().length !== 6) {
            next.otpCode = "The code is 6 digits.";
        }

        if (!form.newPassword) {
            next.newPassword = "New password is required.";
        } else if (form.newPassword.length < 8) {
            next.newPassword = "Use at least 8 characters.";
        }

        if (form.confirmPassword !== form.newPassword) {
            next.confirmPassword = "Passwords do not match.";
        }

        if (Object.keys(next).length) {
            setErrors(next);
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            const response = await fetch(
                `${API_URL}/api/profile/password-otp/confirm`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders(),
                    },
                    body: JSON.stringify({
                        idNumber: form.idNumber.trim(),
                        email: form.email.trim(),
                        otpCode: form.otpCode.trim(),
                        newPassword: form.newPassword,
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message || "We couldn't change your password."
                );
            }

            toast.success("Password changed successfully.");
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const focusRing =
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300";

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !submitting) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-password-title"
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-[#106A2E]">
                    <ShieldCheck size={22} />
                </div>

                <h2
                    id="change-password-title"
                    className="mt-4 text-center text-lg font-semibold text-slate-900"
                >
                    Change Password
                </h2>

                <p className="mt-1 text-center text-xs leading-5 text-slate-500">
                    {step === 1
                        ? "Confirm your student number and account email to receive a one-time code."
                        : "Enter the code we emailed you, then choose a new password."}
                </p>

                {/* STEP 1 */}
                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
                        <div>
                            <Label htmlFor="cp-id">Student number</Label>
                            <input
                                id="cp-id"
                                type="text"
                                value={form.idNumber}
                                onChange={(event) =>
                                    update("idNumber", event.target.value)
                                }
                                placeholder="e.g. 26-00000"
                                className={inputClass}
                                autoComplete="off"
                            />
                            {errors.idNumber && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.idNumber}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="cp-email">Account email</Label>
                            <input
                                id="cp-email"
                                type="email"
                                value={form.email}
                                onChange={(event) =>
                                    update("email", event.target.value)
                                }
                                placeholder="you@cdm.edu.ph"
                                className={inputClass}
                                autoComplete="off"
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className={`flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 ${focusRing}`}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] p-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:opacity-90 disabled:opacity-60 ${focusRing}`}
                            >
                                <Mail size={15} />
                                {submitting ? "Sending..." : "Send code"}
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <form
                        onSubmit={handleChangePassword}
                        className="mt-5 space-y-4"
                    >
                        <div>
                            <Label htmlFor="cp-otp">One-time code</Label>
                            <input
                                id="cp-otp"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={form.otpCode}
                                onChange={(event) =>
                                    update(
                                        "otpCode",
                                        event.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6)
                                    )
                                }
                                placeholder="6-digit code"
                                className={`${inputClass} tracking-[.4em]`}
                                autoComplete="one-time-code"
                            />
                            {errors.otpCode && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.otpCode}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="cp-new">New password</Label>
                            <input
                                id="cp-new"
                                type="password"
                                value={form.newPassword}
                                onChange={(event) =>
                                    update("newPassword", event.target.value)
                                }
                                placeholder="At least 8 characters"
                                className={inputClass}
                                autoComplete="new-password"
                            />
                            {errors.newPassword && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.newPassword}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="cp-confirm">
                                Confirm new password
                            </Label>
                            <input
                                id="cp-confirm"
                                type="password"
                                value={form.confirmPassword}
                                onChange={(event) =>
                                    update(
                                        "confirmPassword",
                                        event.target.value
                                    )
                                }
                                placeholder="Re-type the new password"
                                className={inputClass}
                                autoComplete="new-password"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setErrors({});
                                    setStep(1);
                                }}
                                disabled={submitting}
                                className={`flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 ${focusRing}`}
                            >
                                Back
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] p-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:opacity-90 disabled:opacity-60 ${focusRing}`}
                            >
                                <KeyRound size={15} />
                                {submitting ? "Saving..." : "Change password"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}
