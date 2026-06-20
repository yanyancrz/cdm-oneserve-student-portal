import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingModal from "../../components/LoadingModal/LoadingModal";


export default function Register() {

    const [studentNumber, setStudentNumber] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const isFormValid =
    studentNumber.trim() &&
    fullName.trim() &&
    email.trim() &&
    password.trim();

    const navigate = useNavigate();

    const handleRegister = async () => {

    if (
        !studentNumber.trim() ||
        !fullName.trim() ||
        !email.trim() ||
        !password.trim()
    ) {
        toast.error(
            "Please complete all required fields."
        );
        return;
    }

    setLoading(true);

    try {

        const response = await fetch(
            "http://localhost:5212/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    studentNumber,
                    fullName,
                    email,
                    password
                })
            }
        );

        const data = await response.text();

        if (response.ok) {

            toast.success("OTP Sent!");

            localStorage.setItem(
                "otpEmail",
                email
            );

            setTimeout(() => {

                navigate("/otp");

            }, 1000);


        } else {

            toast.error(data);

        }

    } catch (error) {

        toast.error(error.message);

    } finally {

        setLoading(false);

    }
};

    return (

        <>
    {
        loading && (
           <LoadingModal
                message="Sending OTP to your email..."
            />
        )
    }
        <div
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
            
        >

            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#106A2E]/[0.06]" />
            <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-[#F4D35E]/[0.15]" />

            <div className="bg-white rounded-3xl p-9 w-full max-w-md shadow-xl shadow-[#106A2E]/10 border border-[#106A2E]/[0.06] relative z-10">

                <div className="w-14 h-14 rounded-2xl bg-[#106A2E] flex items-center justify-center mx-auto mb-4">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                </div>

                <h1 className="text-xl font-semibold text-center text-[#1F1F1F]">
                    Create Account
                </h1>

                <p className="text-sm text-gray-500 text-center mt-1 mb-7">
                    Register for your CDM OneServe account
                </p>

                {/* Student Number */}

                <div className="mb-3.5">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Student Number
                    </label>

                    <input
                        type="text"
                        placeholder="2024-00123"
                        className="
                            w-full
                            px-4 py-3
                            rounded-xl
                            border border-gray-200
                            bg-gray-50
                            text-sm
                            outline-none
                            focus:border-[#106A2E]
                            focus:bg-white
                        "
                        value={studentNumber}
                        onChange={(e) =>
                            setStudentNumber(e.target.value)
                        }
                    />
                </div>

                {/* Full Name */}

                <div className="mb-3.5">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Full Name
                    </label>

                    <input
                        type="text"
                        placeholder="Juan Dela Cruz"
                        className="
                            w-full
                            px-4 py-3
                            rounded-xl
                            border border-gray-200
                            bg-gray-50
                            text-sm
                            outline-none
                            focus:border-[#106A2E]
                            focus:bg-white
                        "
                        value={fullName}
                        onChange={(e) =>
                            setFullName(e.target.value)
                        }
                    />
                </div>

                {/* Email */}

                <div className="mb-3.5">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Email Address
                    </label>

                    <input
                        type="email"
                        placeholder="you@cdm.edu.ph"
                        className="
                            w-full
                            px-4 py-3
                            rounded-xl
                            border border-gray-200
                            bg-gray-50
                            text-sm
                            outline-none
                            focus:border-[#106A2E]
                            focus:bg-white
                        "
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />
                </div>

                {/* Password */}

                <div className="mb-6">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Enter Password"
                        className="
                            w-full
                            px-4 py-3
                            rounded-xl
                            border border-gray-200
                            bg-gray-50
                            text-sm
                            outline-none
                            focus:border-[#106A2E]
                            focus:bg-white
                        "
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />
                </div>

                {/* Register Button */}

                <button
                    onClick={handleRegister}
                    disabled={!isFormValid || loading}
                    className="
                        w-full
                        bg-[#106A2E]
                        hover:bg-[#0D7856]
                        text-white
                        p-3
                        rounded-xl
                        font-semibold
                        transition-all
                        disabled:bg-gray-300
                        disabled:cursor-not-allowed
                    "
                >
                    {
                        loading
                            ? "Sending OTP..."
                            : "Register"
                    }
                </button>

                <div className="flex items-center gap-2.5 my-5">
                    <span className="flex-1 h-px bg-gray-200" />
                    <span className="text-[11px] uppercase tracking-wider text-gray-400">
                        Already a member
                    </span>
                    <span className="flex-1 h-px bg-gray-200" />
                </div>

                <p className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link
                        to="/"
                        className="text-[#106A2E] font-semibold hover:underline"
                    >
                        Login
                    </Link>
                </p>

            </div>

        </div>
    </>
    );
}