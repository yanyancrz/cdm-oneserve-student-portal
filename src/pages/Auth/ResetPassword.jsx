import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

            toast.error(
                "Passwords do not match."
            );

            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        toast.success("Password Updated Successfully");

        setTimeout(() => {
            navigate("/");
        }, 1500);

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

                toast.success(data.message);

                localStorage.removeItem(
                    "resetEmail"
                );

                setTimeout(() => {

                    navigate("/");

                }, 1500);

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
                        message="Updating Password..."
                    />
                )
            }

            <BackgroundLayout>
            

            <div
                className="min-h-screen flex items-center justify-center p-6"              
            >

                <div className="bg-white rounded-3xl p-9 w-full max-w-md shadow-xl">

                    <h1 className="text-xl font-semibold text-center text-[#1F1F1F]">
                        Reset Password
                    </h1>

                    <p className="text-sm text-gray-500 text-center mt-2 mb-6">
                        Enter OTP and new password.
                    </p>

                    <input
                        type="text"
                        placeholder="OTP Code"
                        value={otpCode}
                        onChange={(e) =>
                            setOtpCode(e.target.value)
                        }
                        className="
                            w-full
                            px-4 py-3
                            rounded-xl
                            border
                            border-gray-200
                            bg-gray-50
                            mb-3
                        "
                    />

                    <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) =>
                            setNewPassword(e.target.value)
                        }
                        className="
                            w-full
                            px-4 py-3
                            rounded-xl
                            border
                            border-gray-200
                            bg-gray-50
                            mb-3
                        "
                    />

                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(e.target.value)
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
                        onClick={handleResetPassword}
                        className="
                            w-full
                            bg-[#106A2E]
                            text-white
                            p-3
                            rounded-xl
                            font-semibold
                        "
                    >
                        Update Password
                    </button>

                </div>

            </div>

        </BackgroundLayout>
        
        </>
    );
}