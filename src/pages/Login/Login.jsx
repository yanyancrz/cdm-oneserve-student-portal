import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoadingModal from "../../components/LoadingModal/LoadingModal";
import toast from "react-hot-toast";
import BackgroundLayout from "../../layouts/BackgroundLayout";
import { API_URL } from "../../config/api";

export default function Login() {

    const [email, setEmail] = useState("");
    const navigate = useNavigate();
    const [password, setPassword] = useState("");   
    const [loading, setLoading] = useState(false);

   const handleLogin = async () => {

    setLoading(true);

    try {

        const response = await fetch(
            `${API_URL}/api/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

if (response.ok) {

    localStorage.setItem("userId", data.id);
    localStorage.setItem("studentNumber", data.studentNumber);
    localStorage.setItem("userName", data.fullName);
    localStorage.setItem("userEmail", data.email);
    localStorage.setItem("userRole", data.role);
    localStorage.setItem("course", data.course || "");
    localStorage.setItem("yearLevel", data.yearLevel || "");
    localStorage.setItem("contactNumber", data.contactNumber || "");

    if (!data.isProfileComplete) {

        toast.success(
            "Login successful. Please complete your profile."
        );

        navigate("/setup-profile");
        return;
    }

    toast.success("Welcome back!");

        if (data.role === "Admin") {

            navigate("/admin/dashboard", {
                replace: true
            });

        }
        else {

            navigate("/dashboard", {
                replace: true
            });

        }

}
else {

    toast.error(
        data.message
    );

}
    }
    catch (error) {

        console.error(error);

        toast.error("Unable to connect to API");

    }
    finally {

        setLoading(false);

    }

};

    return (
        <>
    {
        loading && (
            <LoadingModal
                message="Signing In..."
            />
        )
    }

    <BackgroundLayout>

        <div
            className="
                min-h-screen
                flex
                items-center
                justify-center
                p-6
                relative
                overflow-hidden
            "
        >


            <div className="bg-white rounded-3xl p-9 w-full max-w-sm shadow-xl shadow-[#106A2E]/10 border border-[#106A2E]/[0.06] relative z-10">

                {/* BRAND */}

                <div className="w-14 h-14 rounded-2xl bg-[#106A2E] flex items-center justify-center mx-auto mb-4">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                </div>

                <h1 className="text-xl font-semibold text-center text-[#1F1F1F]">
                    CDM OneServe
                </h1>

                <p className="text-sm text-gray-500 text-center mt-1 mb-7">
                    Sign in to your student account
                </p>

                {/* EMAIL */}

                <div className="mb-3.5">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Email
                    </label>
                    <div className="relative flex items-center">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-gray-400">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="m22 7-10 6L2 7" />
                        </svg>
                        <input
                            type="email"
                            placeholder="you@cdm.edu.ph"
                            className="
                                w-full
                                pl-10 pr-3.5 py-3
                                rounded-xl
                                border border-gray-200
                                bg-gray-50
                                text-sm
                                outline-none
                                focus:border-[#106A2E]
                                focus:bg-white
                                transition-colors
                            "
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                {/* PASSWORD */}

                <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Password
                    </label>
                    <div className="relative flex items-center">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-gray-400">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="
                                w-full
                                pl-10 pr-3.5 py-3
                                rounded-xl
                                border border-gray-200
                                bg-gray-50
                                text-sm
                                outline-none
                                focus:border-[#106A2E]
                                focus:bg-white
                                transition-colors
                            "
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>
                
                <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#106A2E] hover:underline"
                >
                    Forgot password?
                </Link>

                {/* LOGIN BUTTON */}

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="
                        w-full
                        bg-[#106A2E]
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
                        shadow-[#106A2E]/25
                        disabled:opacity-70
                    "
                >
                    {
                        loading ? (
                            <>
                                <div
                                    className="
                                        w-4
                                        h-4
                                        border-2
                                        border-white/30
                                        border-t-white
                                        rounded-full
                                        animate-spin
                                    "
                                />
                                Signing In...
                            </>
                        ) : (
                            <>
                                <svg
                                    width="17"
                                    height="17"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <path d="M10 17l5-5-5-5M15 12H3" />
                                </svg>
                                Sign In
                            </>
                        )
                    }
                </button>

                {/* DIVIDER */}

                <div className="flex items-center gap-2.5 my-5">
                    <span className="flex-1 h-px bg-gray-200" />
                    <span className="text-[11px] uppercase tracking-wider text-gray-400">
                        New here
                    </span>
                    <span className="flex-1 h-px bg-gray-200" />
                </div>

                {/* REGISTER */}

                <p className="text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-[#106A2E] font-semibold hover:underline"
                    >
                        Register
                    </Link>
                </p>

            </div>

        </div>

        </BackgroundLayout>
    </>
    );
}
