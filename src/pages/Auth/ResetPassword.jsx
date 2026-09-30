import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingModal from "../../components/LoadingModal/LoadingModal";
import { API_URL } from "../../config/api";
import BackgroundLayout from "../../layouts/BackgroundLayout";

export default function ResetPassword() {

    const [otpCode, setOtpCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const email =
        localStorage.getItem("resetEmail");

    const handleResetPassword = async () => {

        if (
            !otpCode.trim() ||
            !newPassword.trim() ||
            !confirmPassword.trim()
        ) {
            toast.error("Please complete all fields.");
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

                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) =>
                                    setNewPassword(e.target.value)
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

                        <div className="mb-6">
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
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

                        <button
                            onClick={handleResetPassword}
                            disabled={loading}
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
                                disabled:opacity-70
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