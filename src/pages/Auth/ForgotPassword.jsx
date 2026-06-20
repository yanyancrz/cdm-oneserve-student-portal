import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingModal from "../../components/LoadingModal/LoadingModal";
import { API_URL } from "../../config/api";
import BackgroundLayout from "../../layouts/BackgroundLayout";

export default function ForgotPassword() {

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSendOtp = async () => {

        if (!email.trim()) {
            toast.error("Please enter your email.");
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                `${API_URL}/auth/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {

                localStorage.setItem(
                    "resetEmail",
                    email
                );

                toast.success(data.message);

                navigate("/reset-password");

            } else {

                toast.error(data.message);

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
                        message="Sending OTP..."
                    />
                )
            }

            <BackgroundLayout>
            

            <div
                className="min-h-screen flex items-center justify-center p-6"
            >

                <div className="bg-white rounded-3xl p-9 w-full max-w-md shadow-xl">

                    <h1 className="text-xl font-semibold text-center text-[#1F1F1F]">
                        Forgot Password
                    </h1>

                    <p className="text-sm text-gray-500 text-center mt-2 mb-6">
                        Enter your email to receive an OTP.
                    </p>

                    <input
                        type="email"
                        placeholder="you@cdm.edu.ph"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        className="
                            w-full
                            px-4 py-3
                            rounded-xl
                            border
                            border-gray-200
                            bg-gray-50
                            mb-5
                        "
                    />

                    <button
                        onClick={handleSendOtp}
                        className="
                            w-full
                            bg-[#106A2E]
                            text-white
                            p-3
                            rounded-xl
                            font-semibold
                        "
                    >
                        Send OTP
                    </button>

                    <p className="text-center mt-5 text-sm">
                        <Link
                            to="/"
                            className="text-[#106A2E] font-medium"
                        >
                            Back to Login
                        </Link>
                    </p>

                </div>

            </div>

            </BackgroundLayout>
        </>
    );
}