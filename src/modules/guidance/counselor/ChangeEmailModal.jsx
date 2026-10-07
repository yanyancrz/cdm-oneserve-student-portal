import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, X } from "lucide-react";
import toast from "react-hot-toast";

import { Note } from "../components/GuidanceStates";
import { fieldClass } from "../components/GuidanceUi";
import { API_URL } from "../../../config/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Centered modal: counselor changes their login email.
// Step 1 -> POST /api/profile/request-email-change  (SMTP OTP to the new email)
// Step 2 -> POST /api/profile/verify-email-change
// Same endpoints / OTP flow the student Edit Profile page uses.
export default function ChangeEmailModal({ userId, currentEmail, onClose, onEmailChanged }) {
    const [step, setStep] = useState(1);

    const [newEmail, setNewEmail] = useState("");
    const [sending, setSending] = useState(false);

    const [digits, setDigits] = useState(["", "", "", "", "", ""]);
    const [verifying, setVerifying] = useState(false);

    const [error, setError] = useState("");
    const inputRefs = useRef([]);

    const otp = digits.join("");

    // Focus the first OTP box when step 2 opens.
    useEffect(() => {
        if (step === 2) inputRefs.current[0]?.focus();
    }, [step]);

    const requestOtp = async () => {
        setError("");

        const email = newEmail.trim();
        if (!EMAIL_RE.test(email)) return setError("Enter a valid email address.");
        if (email.toLowerCase() === (currentEmail || "").toLowerCase()) {
            return setError("That is already your current email.");
        }

        setSending(true);
        try {
            const response = await fetch(`${API_URL}/api/profile/request-email-change`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, newEmail: email }),
            });

            const message = await response.text();
            if (!response.ok) throw new Error(message || "Unable to request an email change.");

            toast.success("OTP sent to your new email.");
            setStep(2);
        } catch (e) {
            setError(e.message || "Unable to request an email change.");
        } finally {
            setSending(false);
        }
    };

    const changeDigit = (index, value) => {
        const cleaned = value.replace(/[^0-9]/g, "").slice(-1);
        const next = [...digits];
        next[index] = cleaned;
        setDigits(next);

        if (cleaned && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const onDigitKeyDown = (index, e) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const verify = async () => {
        setError("");
        if (otp.length !== 6) return setError("Please enter the 6-digit OTP.");

        setVerifying(true);
        try {
            const response = await fetch(`${API_URL}/api/profile/verify-email-change`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, otpCode: otp }),
            });

            const message = await response.text();
            if (!response.ok) throw new Error(message || "Invalid OTP.");

            // keep the stored email in sync, then refresh `me` from the server
            localStorage.setItem("userEmail", newEmail.trim());
            toast.success("Email updated successfully.");
            onEmailChanged?.(newEmail.trim());
        } catch (e) {
            setError(e.message || "Invalid OTP.");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Change email"
                className="mx-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-[#106A2E]">
                            <Mail size={15} aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-base font-semibold text-slate-800">Change email</h2>
                            <p className="text-xs text-slate-500">
                                {step === 1 ? "We'll send a 6-digit code to the new email." : "Enter the code we sent."}
                            </p>
                        </div>
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

                {step === 1 ? (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Current email
                            </p>
                            <p className="mt-0.5 break-all text-sm text-slate-600">{currentEmail || "—"}</p>
                        </div>

                        <div>
                            <label
                                htmlFor="new-email"
                                className="text-xs font-semibold text-slate-700"
                            >
                                New email address
                            </label>
                            <input
                                id="new-email"
                                type="email"
                                autoComplete="email"
                                placeholder="newemail@example.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && requestOtp()}
                                className={fieldClass("green")}
                            />
                            <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
                                A 6-digit code will be sent to this address to confirm the change.
                            </p>
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
                                onClick={requestOtp}
                                disabled={sending}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#106A2E] py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
                            >
                                {sending && <Loader2 className="animate-spin" size={16} aria-hidden="true" />}
                                Send code
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-slate-700">Verification code</p>
                            <p className="mt-1 text-xs text-slate-500">
                                Sent to <span className="font-semibold text-slate-700">{newEmail.trim()}</span>
                            </p>
                        </div>

                        <div className="flex justify-center gap-2">
                            {digits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    aria-label={`OTP digit ${index + 1}`}
                                    value={digit}
                                    onChange={(e) => changeDigit(index, e.target.value)}
                                    onKeyDown={(e) => onDigitKeyDown(index, e)}
                                    className="h-14 w-12 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-semibold text-slate-800 outline-none transition focus:border-[#106A2E] focus:ring-4 focus:ring-[#106A2E]/15"
                                />
                            ))}
                        </div>

                        {error && <Note tone="error">{error}</Note>}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setDigits(["", "", "", "", "", ""]);
                                    setError("");
                                }}
                                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition active:scale-[0.99]"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={verify}
                                disabled={verifying}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#106A2E] py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
                            >
                                {verifying && <Loader2 className="animate-spin" size={16} aria-hidden="true" />}
                                Verify
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setDigits(["", "", "", "", "", ""]);
                                setError("");
                                requestOtp();
                            }}
                            disabled={sending}
                            className="w-full text-center text-xs font-semibold text-[#106A2E] transition hover:underline disabled:opacity-60"
                        >
                            Resend code
                        </button>

                        <p className="text-center text-[11px] text-slate-400">
                            The code expires in 5 minutes.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
