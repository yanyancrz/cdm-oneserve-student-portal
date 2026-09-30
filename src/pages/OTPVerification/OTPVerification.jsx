import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import toast from "react-hot-toast";

export default function OTPVerification() {
    const navigate = useNavigate();

    const [digits, setDigits] = useState([
        "",
        "",
        "",
        "",
        "",
        "",
    ]);

    const [loading, setLoading] = useState(false);

    const [resendLoading, setResendLoading] =
        useState(false);

    const [resendCooldown, setResendCooldown] =
        useState(0);

    const inputRefs = useRef([]);

    const otp = digits.join("");

    // =========================================================
    // GET EMAIL
    // =========================================================

    const otpEmail =
        localStorage.getItem("otpEmail");

    // =========================================================
    // RESEND COUNTDOWN
    // =========================================================

    useEffect(() => {
        if (resendCooldown <= 0) {
            return;
        }

        const timer =
            setInterval(() => {
                setResendCooldown((prev) =>
                    prev > 0 ? prev - 1 : 0
                );
            }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    // =========================================================
    // FOCUS FIRST INPUT
    // =========================================================

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // =========================================================
    // HANDLE OTP CHANGE
    // =========================================================

    const handleChange = (
        index,
        value
    ) => {
        const cleaned =
            value
                .replace(/[^0-9]/g, "")
                .slice(-1);

        const next = [...digits];

        next[index] = cleaned;

        setDigits(next);

        if (
            cleaned &&
            index < 5
        ) {
            inputRefs.current[
                index + 1
            ]?.focus();
        }
    };

    // =========================================================
    // HANDLE KEYBOARD
    // =========================================================

    const handleKeyDown = (
        index,
        e
    ) => {
        // -----------------------------------------------------
        // BACKSPACE
        // -----------------------------------------------------

        if (
            e.key === "Backspace" &&
            !digits[index] &&
            index > 0
        ) {
            inputRefs.current[
                index - 1
            ]?.focus();

            return;
        }

        // -----------------------------------------------------
        // ARROW LEFT
        // -----------------------------------------------------

        if (
            e.key === "ArrowLeft" &&
            index > 0
        ) {
            inputRefs.current[
                index - 1
            ]?.focus();

            return;
        }

        // -----------------------------------------------------
        // ARROW RIGHT
        // -----------------------------------------------------

        if (
            e.key === "ArrowRight" &&
            index < 5
        ) {
            inputRefs.current[
                index + 1
            ]?.focus();

            return;
        }

        // -----------------------------------------------------
        // ENTER
        // -----------------------------------------------------

        if (
            e.key === "Enter"
        ) {
            handleVerify();
        }
    };

    // =========================================================
    // HANDLE PASTE
    // =========================================================

    const handlePaste = (e) => {
        const pasted =
            e.clipboardData
                .getData("text")
                .replace(/[^0-9]/g, "")
                .slice(0, 6);

        if (!pasted) {
            return;
        }

        e.preventDefault();

        const next = [
            "",
            "",
            "",
            "",
            "",
            "",
        ];

        for (
            let i = 0;
            i < 6;
            i++
        ) {
            next[i] =
                pasted[i] || "";
        }

        setDigits(next);

        const lastFilled =
            Math.min(
                pasted.length,
                6
            ) - 1;

        inputRefs.current[
            lastFilled >= 0
                ? lastFilled
                : 0
        ]?.focus();
    };

    // =========================================================
    // VERIFY OTP
    // =========================================================

    const handleVerify = async () => {
        if (loading) {
            return;
        }

        // -----------------------------------------------------
        // CHECK EMAIL
        // -----------------------------------------------------

        const email =
            localStorage.getItem(
                "otpEmail"
            );

        if (!email) {
            toast.error(
                "Registration session expired. Please register again."
            );

            navigate("/register");

            return;
        }

        // -----------------------------------------------------
        // CHECK OTP
        // -----------------------------------------------------

        if (otp.length !== 6) {
            toast.error(
                "Please enter a valid 6-digit OTP."
            );

            return;
        }

        setLoading(true);

        try {
            const response =
                await fetch(
                    `${API_URL}/api/auth/verify-otp`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            email:
                                email.trim(),

                            otpCode:
                                otp,
                        }),
                    }
                );

            const rawData =
                await response.text();

            let data = {};

            try {
                data =
                    rawData
                        ? JSON.parse(
                            rawData
                        )
                        : {};
            } catch {
                data = {
                    message:
                        rawData,
                };
            }

            // =================================================
            // SUCCESS
            // =================================================

            if (response.ok) {
                toast.success(
                    data?.message ||
                    "Registration submitted successfully!"
                );

                // -------------------------------------------------
                // REMOVE REGISTRATION DATA
                // -------------------------------------------------

                localStorage.removeItem(
                    "otpEmail"
                );

                localStorage.removeItem(
                    "otpIdNumber"
                );

                // -------------------------------------------------
                // CLEAR OTP
                // -------------------------------------------------

                setDigits([
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]);

                // -------------------------------------------------
                // REDIRECT TO LOGIN
                // -------------------------------------------------

                setTimeout(() => {
                    navigate("/");
                }, 1000);

                return;
            }

            // =================================================
            // ERROR
            // =================================================

            const errorMessage =
                data?.message ||
                data?.title ||
                "Invalid or expired OTP.";

            toast.error(
                errorMessage
            );

            // Clear entered OTP after an invalid attempt
            setDigits([
                "",
                "",
                "",
                "",
                "",
                "",
            ]);

            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 50);
        }

        // =====================================================
        // NETWORK ERROR
        // =====================================================

        catch (error) {
            console.error(
                "OTP verification error:",
                error
            );

            toast.error(
                error?.message ||
                "Unable to connect to the server."
            );
        }

        finally {
            setLoading(false);
        }
    };

    // =========================================================
    // RESEND OTP
    // =========================================================
    //
    // NOTE:
    // The current backend does NOT have a /resend-otp endpoint.
    // Therefore we do not make a fake request here.
    //
    // This button informs the user to restart registration
    // if the OTP expires.
    // =========================================================

    const handleResendOTP = async () => {
        if (
            resendLoading ||
            resendCooldown > 0
        ) {
            return;
        }

        const email =
            localStorage.getItem(
                "otpEmail"
            );

        if (!email) {
            toast.error(
                "Registration session expired. Please register again."
            );

            navigate("/register");

            return;
        }

        setResendLoading(true);

        try {
            /*
             * There is currently no dedicated resend OTP
             * endpoint in the backend.
             *
             * Do NOT pretend that an OTP was resent.
             */

            toast(
                "Please register again to receive a new OTP."
            );

            setResendCooldown(30);
        }

        catch (error) {
            console.error(
                "Resend OTP error:",
                error
            );

            toast.error(
                error?.message ||
                "Unable to resend OTP."
            );
        }

        finally {
            setResendLoading(false);
        }
    };

    // =========================================================
    // GO BACK TO REGISTER
    // =========================================================

    const handleBackToRegister = () => {
        setDigits([
            "",
            "",
            "",
            "",
            "",
            "",
        ]);

        navigate("/register");
    };

    // =========================================================
    // DISPLAY EMAIL
    // =========================================================

    const displayEmail =
        otpEmail
            ? otpEmail
            : "your email";

    // =========================================================
    // JSX
    // =========================================================

    return (
        <div
            className="
                relative
                min-h-screen
                overflow-hidden
                bg-[#F7F5EF]
                flex
                items-center
                justify-center
                px-4
            "
        >
            {/* =================================================
                BACKGROUND
            ================================================= */}

            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

                <div className="absolute right-[-140px] top-[30%] h-[32rem] w-[32rem] rounded-full bg-cyan-300/10 blur-3xl" />

                <div className="absolute bottom-[-120px] left-[30%] h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />

                <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(16,106,46,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,106,46,.35)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            {/* =================================================
                ANIMATION
            ================================================= */}

            <style>{`
                @keyframes otpReveal {
                    from {
                        opacity: 0;
                        transform: translateY(15px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .otp-reveal {
                    animation: otpReveal .65s cubic-bezier(.2,.8,.2,1) both;
                }
            `}</style>

            {/* =================================================
                CARD
            ================================================= */}

            <div
                className="
                    otp-reveal
                    bg-white
                    rounded-[28px]
                    p-9
                    w-full
                    max-w-md
                    shadow-xl
                    shadow-black/5
                    border
                    border-slate-200
                    relative
                    z-10
                "
            >
                {/* =================================================
                    BRAND ICON
                ================================================= */}

                <div
                    className="
                        w-14
                        h-14
                        rounded-2xl
                        bg-gradient-to-br
                        from-[#106A2E]
                        to-[#0E3B22]
                        flex
                        items-center
                        justify-center
                        mx-auto
                        mb-4
                        shadow-lg
                        shadow-emerald-900/20
                    "
                >
                    <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect
                            x="2"
                            y="4"
                            width="20"
                            height="16"
                            rx="2"
                        />

                        <path d="m22 7-10 6L2 7" />
                    </svg>
                </div>

                {/* =================================================
                    TITLE
                ================================================= */}

                <h1
                    className="
                        text-xl
                        font-semibold
                        text-center
                        text-slate-800
                    "
                >
                    Verify Email
                </h1>

                <p
                    className="
                        text-center
                        text-sm
                        text-slate-400
                        mt-1
                        mb-2
                    "
                >
                    Enter the 6-digit OTP sent to your email
                </p>

                {/* =================================================
                    EMAIL
                ================================================= */}

                <p
                    className="
                        text-center
                        text-xs
                        font-medium
                        text-[#106A2E]
                        mb-7
                        break-all
                    "
                >
                    {displayEmail}
                </p>

                {/* =================================================
                    OTP BOXES
                ================================================= */}

                <div
                    className="
                        flex
                        justify-center
                        gap-2.5
                        mb-6
                    "
                    onPaste={handlePaste}
                >
                    {digits.map(
                        (
                            digit,
                            index
                        ) => (
                            <input
                                key={index}
                                ref={(el) =>
                                    (inputRefs.current[
                                        index
                                    ] = el)
                                }
                                type="text"
                                inputMode="numeric"
                                autoComplete={
                                    index === 0
                                        ? "one-time-code"
                                        : "off"
                                }
                                maxLength={1}
                                value={digit}
                                disabled={loading}
                                onChange={(e) =>
                                    handleChange(
                                        index,
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) =>
                                    handleKeyDown(
                                        index,
                                        e
                                    )
                                }
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
                                    text-slate-800

                                    ${
                                        digit
                                            ? "border-[#106A2E] bg-emerald-50"
                                            : "border-slate-200 bg-slate-50"
                                    }

                                    focus:border-[#106A2E]
                                    focus:bg-white

                                    disabled:opacity-60
                                    disabled:cursor-not-allowed
                                `}
                            />
                        )
                    )}
                </div>

                {/* =================================================
                    VERIFY BUTTON
                ================================================= */}

                <button
                    onClick={handleVerify}
                    disabled={
                        loading ||
                        otp.length !== 6
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
                        flex
                        items-center
                        justify-center
                        gap-2
                        shadow-lg
                        shadow-emerald-900/20

                        disabled:from-slate-300
                        disabled:to-slate-300
                        disabled:shadow-none
                        disabled:cursor-not-allowed
                    "
                >
                    {loading ? (
                        <>
                            <svg
                                className="animate-spin"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="9"
                                    className="opacity-30"
                                />

                                <path d="M21 12a9 9 0 0 1-9 9" />
                            </svg>

                            Verifying...
                        </>
                    ) : (
                        <>
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20 6 9 17l-5-5" />
                            </svg>

                            Verify OTP
                        </>
                    )}
                </button>

                {/* =================================================
                    RESEND
                ================================================= */}

                <p
                    className="
                        text-center
                        text-sm
                        text-slate-400
                        mt-5
                    "
                >
                    Didn't receive the code?
                </p>

                <button
                    onClick={
                        handleResendOTP
                    }
                    disabled={
                        resendLoading ||
                        resendCooldown > 0
                    }
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
                        hover:bg-emerald-50
                        active:scale-[0.98]
                        transition-all

                        disabled:border-slate-200
                        disabled:text-slate-400
                        disabled:bg-slate-50
                        disabled:cursor-not-allowed
                    "
                >
                    {resendLoading
                        ? "Please wait..."
                        : resendCooldown > 0
                            ? `Try again in ${resendCooldown}s`
                            : "Resend OTP"}
                </button>

                {/* =================================================
                    BACK TO REGISTER
                ================================================= */}

                <button
                    type="button"
                    onClick={
                        handleBackToRegister
                    }
                    className="
                        w-full
                        mt-3
                        text-xs
                        text-slate-400
                        hover:text-[#106A2E]
                        transition-colors
                    "
                >
                    Need to change your information?
                    <span className="font-medium ml-1">
                        Register again
                    </span>
                </button>

                {/* =================================================
                    DIVIDER
                ================================================= */}

                <div
                    className="
                        flex
                        items-center
                        gap-2.5
                        my-5
                    "
                >
                    <span
                        className="
                            flex-1
                            h-px
                            bg-slate-200
                        "
                    />

                    <span
                        className="
                            text-[11px]
                            uppercase
                            tracking-wider
                            text-slate-400
                        "
                    >
                        Or
                    </span>

                    <span
                        className="
                            flex-1
                            h-px
                            bg-slate-200
                        "
                    />
                </div>

                {/* =================================================
                    LOGIN
                ================================================= */}

                <div className="text-center">
                    <Link
                        to="/"
                        className="
                            text-[#106A2E]
                            font-semibold
                            hover:underline
                            text-sm
                        "
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}