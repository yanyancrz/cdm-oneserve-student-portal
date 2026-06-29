import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import toast from "react-hot-toast";

export default function OTPVerification() {

    const navigate = useNavigate();

    const [digits, setDigits] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);

    const otp = digits.join("");

    const handleChange = (index, value) => {

        // only allow a single digit
        const cleaned = value.replace(/[^0-9]/g, "").slice(-1);

        const next = [...digits];
        next[index] = cleaned;
        setDigits(next);

        if (cleaned && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

    };

    const handleKeyDown = (index, e) => {

        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

    };

    const handlePaste = (e) => {

        const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);

        if (!pasted) return;

        e.preventDefault();

        const next = [...digits];

        for (let i = 0; i < 6; i++) {
            next[i] = pasted[i] || "";
        }

        setDigits(next);

        const lastFilled = Math.min(pasted.length, 6) - 1;
        inputRefs.current[lastFilled >= 0 ? lastFilled : 0]?.focus();

    };

   const handleVerify = async () => {

    if (otp.length !== 6) {
        toast.error("Please enter a valid 6-digit OTP.");
        return;
    }

    try {

        const email =
            localStorage.getItem("otpEmail");

       const response = await fetch(
        `${API_URL}/api/auth/verify-otp`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    otpCode: otp
                })
            }
        );

        const data = await response.text();

        toast.error(data);

        if (response.ok) {

            localStorage.removeItem("otpEmail");

            navigate("/");

        }

    }
            catch (error) {

            console.error(error);

            toast.error(error.message);

        }

};

    const handleResendOTP = () => {
        toast.info("OTP has been resent to your email.");
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
        >

            {/* decorative blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#106A2E]/[0.06]" />
            <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-[#F4D35E]/[0.15]" />

            <div className="bg-white rounded-3xl p-9 w-full max-w-md shadow-xl shadow-[#106A2E]/10 border border-[#106A2E]/[0.06] relative z-10">

                {/* BRAND ICON */}

                <div className="w-14 h-14 rounded-2xl bg-[#106A2E] flex items-center justify-center mx-auto mb-4">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-10 6L2 7" />
                    </svg>
                </div>

                <h1 className="text-xl font-semibold text-center text-[#1F1F1F]">
                    Verify Email
                </h1>

                <p className="text-center text-sm text-gray-500 mt-1 mb-7">
                    Enter the 6-digit OTP sent to your email
                </p>

                {/* OTP BOXES */}

                <div
                    className="flex justify-center gap-2.5 mb-6"
                    onPaste={handlePaste}
                >

                    {
                        digits.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className={`
                                    w-12
                                    h-14
                                    text-center
                                    text-xl
                                    font-semibold
                                    rounded-xl
                                    border
                                    outline-none
                                    transition-colors
                                    text-[#1F1F1F]
                                    ${digit
                                        ? "border-[#106A2E] bg-[#106A2E]/5"
                                        : "border-gray-200 bg-gray-50"}
                                    focus:border-[#106A2E]
                                    focus:bg-white
                                `}
                            />
                        ))
                    }

                </div>

                {/* VERIFY BUTTON */}

                <button
                    onClick={handleVerify}
                    className="
                        w-full
                        bg-[#106A2E]
                        hover:bg-[#0D7856]
                        active:scale-[0.98]
                        text-white
                        p-3
                        rounded-xl
                        font-semibold
                        text-sm
                        transition-all
                        flex
                        items-center
                        justify-center
                        gap-2
                        shadow-lg
                        shadow-[#106A2E]/25
                    "
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Verify OTP
                </button>

                {/* RESEND */}

                <p className="text-center text-sm text-gray-500 mt-5">
                    Didn't receive the code?
                </p>

                <button
                    onClick={handleResendOTP}
                    className="
                        w-full
                        mt-2
                        border
                        border-[#106A2E]
                        text-[#106A2E]
                        p-3
                        rounded-xl
                        font-semibold
                        text-sm
                        hover:bg-[#106A2E]/5
                        active:scale-[0.98]
                        transition-all
                    "
                >
                    Resend OTP
                </button>

                {/* DIVIDER */}

                <div className="flex items-center gap-2.5 my-5">
                    <span className="flex-1 h-px bg-gray-200" />
                    <span className="text-[11px] uppercase tracking-wider text-gray-400">
                        Or
                    </span>
                    <span className="flex-1 h-px bg-gray-200" />
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
    );
}
