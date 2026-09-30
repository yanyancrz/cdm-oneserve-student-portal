import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoadingModal from "../../components/LoadingModal/LoadingModal";
import toast from "react-hot-toast";
import BackgroundLayout from "../../layouts/BackgroundLayout";
import { API_URL } from "../../config/api";
import { isPWAInstalled } from "../../utils/pwa";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const checkPWAAccess = () => {
        // DEV MODE:
        // Allow testing directly from localhost/browser
        if (import.meta.env.DEV) {
            return true;
        }

        if (!isPWAInstalled()) {
            toast.error(
                "Please install the CDM OneServe app first."
            );

            return false;
        }

        return true;
    };

    // =====================================================
    // DEVICE DETECTION
    // =====================================================

    const getDeviceType = () => {
        const userAgent = navigator.userAgent || "";

        const isTablet =
            /iPad|Android(?!.*Mobile)|Tablet/i.test(
                userAgent
            );

        const isMobile =
            /Android.*Mobile|iPhone|iPod|Windows Phone|Mobile/i.test(
                userAgent
            );

        if (isTablet) {
            return "tablet";
        }

        if (isMobile) {
            return "mobile";
        }

        return "desktop";
    };

    // =====================================================
    // HANDLE LOGIN
    // =====================================================

    const handleLogin = async () => {

        if (!checkPWAAccess()) {
            return;
        }

        if (!email.trim() || !password.trim()) {
            toast.error(
                "Please enter your email and password."
            );

            return;
        }

        setLoading(true);

        try {
            // =================================================
            // LOGIN REQUEST
            // =================================================

            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        email: email.trim(),
                        password,
                    }),
                }
            );

            // =================================================
            // READ RESPONSE
            // =================================================

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            // =================================================
            // LOGIN FAILED
            // =================================================

            if (!response.ok) {
                toast.error(
                    data?.message ||
                        data?.error ||
                        "Invalid Email or Password"
                );

                return;
            }

            // =================================================
            // GET USER DATA
            // =================================================

            const user = data.user || data;

            // =================================================
            // NORMALIZE ROLE
            // =================================================

            const role = String(
                user.role ||
                    user.userRole ||
                    ""
            )
                .trim()
                .toLowerCase();

            // =================================================
            // GET DEVICE
            // =================================================

            const deviceType = getDeviceType();

            const isMobile =
                deviceType === "mobile";

            const isTablet =
                deviceType === "tablet";

            const isDesktop =
                deviceType === "desktop";

            // =================================================
            // ADMIN ROLES
            // =================================================

            const adminRoles = [
                "admin",

                "superadmin",
                "super_admin",
                "super-admin",

                "lostfoundadmin",
                "lost_found_admin",
                "lost-found-admin",

                "clinicadmin",
                "clinic_admin",
                "clinic-admin",

                "businesshubadmin",
                "business_hub_admin",
                "business-hub-admin",

                "guidanceadmin",
                "guidance_admin",
                "guidance-admin",

                "libraryadmin",
                "library_admin",
                "library-admin",
            ];

            const isAdminRole =
                adminRoles.includes(role);

            // =================================================
            // LIBRARY STAFF
            //
            // Library Staff is allowed on:
            // - Mobile
            // - Tablet
            // - Desktop
            //
            // They will directly open the scanner.
            // =================================================

            const isLibraryStaff =
                role === "librarystaff" ||
                role === "library_staff" ||
                role === "library-staff";

            // =================================================
            // SAVE JWT TOKEN
            //
            // We only save this after successful login.
            // =================================================

            if (data.token) {
                localStorage.setItem(
                    "token",
                    data.token
                );

                // Compatibility
                localStorage.setItem(
                    "authToken",
                    data.token
                );
            }

            // =================================================
            // SAVE USER INFORMATION
            // =================================================

            localStorage.setItem(
                "userId",
                user.id ?? ""
            );

            localStorage.setItem(
                "idNumber",
                user.idNumber || ""
            );

            localStorage.setItem(
                "userName",
                user.fullName || ""
            );

            localStorage.setItem(
                "userEmail",
                user.email || ""
            );

            localStorage.setItem(
                "userRole",
                user.role || ""
            );

            // Compatibility
            localStorage.setItem(
                "role",
                user.role || ""
            );

            localStorage.setItem(
                "course",
                user.course || ""
            );

            localStorage.setItem(
                "yearLevel",
                user.yearLevel || ""
            );

            localStorage.setItem(
                "contactNumber",
                user.contactNumber || ""
            );

            localStorage.setItem(
                "profilePicture",
                user.profilePicture || ""
            );

            localStorage.setItem(
                "isProfileComplete",
                String(
                    user.isProfileComplete ??
                        false
                )
            );

            // =================================================
            // LIBRARY STAFF
            //
            // ANY DEVICE
            // DIRECTLY TO SCANNER
            // =================================================

            if (isLibraryStaff) {
                toast.success(
                    "Welcome, Library Staff!"
                );

                navigate(
                    "/library/scanner",
                    {
                        replace: true,
                    }
                );

                return;
            }

            // =================================================
            // LIBRARY ADMIN
            //
            // DESKTOP ONLY
            // =================================================

            if (
                role === "libraryadmin" ||
                role === "library_admin" ||
                role === "library-admin"
            ) {
                if (!isDesktop) {
                    toast.error(
                        "Library Admin accounts can only be used on a desktop device."
                    );

                    return;
                }

                toast.success(
                    "Welcome, Library Admin!"
                );

                navigate(
                    "/admin/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            // =================================================
            // MAIN / SUPER ADMIN
            //
            // DESKTOP ONLY
            // =================================================

            if (
                role === "admin" ||
                role === "superadmin" ||
                role === "super_admin" ||
                role === "super-admin"
            ) {
                if (!isDesktop) {
                    toast.error(
                        "Admin accounts can only be used on a desktop device."
                    );

                    return;
                }

                toast.success(
                    "Welcome back, Admin!"
                );

                navigate(
                    "/admin/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            // =================================================
            // LOST & FOUND ADMIN
            //
            // DESKTOP ONLY
            // =================================================

            if (
                role === "lostfoundadmin" ||
                role === "lost_found_admin" ||
                role === "lost-found-admin"
            ) {
                if (!isDesktop) {
                    toast.error(
                        "Lost & Found Admin accounts can only be used on a desktop device."
                    );

                    return;
                }

                toast.success(
                    "Welcome, Lost & Found Admin!"
                );

                navigate(
                    "/admin/lost-found/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            // =================================================
            // OTHER ADMIN MODULES
            //
            // DESKTOP ONLY
            // =================================================

            if (
                role === "clinicadmin" ||
                role === "clinic_admin" ||
                role === "clinic-admin" ||
                role === "businesshubadmin" ||
                role === "business_hub_admin" ||
                role === "business-hub-admin" ||
                role === "guidanceadmin" ||
                role === "guidance_admin" ||
                role === "guidance-admin"
            ) {
                if (!isDesktop) {
                    toast.error(
                        "Staff and Admin accounts can only be used on a desktop device."
                    );

                    return;
                }

                toast.success(
                    "Welcome back!"
                );

                navigate(
                    "/admin/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            // =================================================
            // STUDENT / FACULTY
            //
            // MOBILE ONLY
            //
            // Tablet is not treated as a phone.
            // =================================================

            if (
                    role === "student" ||
                    role === "faculty"
                ) {
                    // DEV MODE:
                    // Allow Student/Faculty testing on desktop.
                    // Production will still require a mobile phone.
                    if (!isMobile && !import.meta.env.DEV) {
                        toast.error(
                            "Student and Faculty accounts can only be used on a mobile phone."
                        );

                        return;
                    }

                // =============================================
                // PROFILE CHECK
                // =============================================

                if (!user.isProfileComplete) {
                    toast.success(
                        "Login successful. Please complete your profile."
                    );

                    navigate(
                        "/setup-profile",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                // =============================================
                // STUDENT / FACULTY DASHBOARD
                // =============================================

                toast.success(
                    "Welcome back!"
                );

                navigate(
                    "/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            // =================================================
            // UNKNOWN ROLE
            // =================================================

            toast.error(
                "Your account role is not recognized."
            );

        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            toast.error(
                "Unable to connect to API"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (
                <LoadingModal
                    message="Signing In..."
                />
            )}

            <BackgroundLayout>
                <div
                    className="
                        relative
                        min-h-screen
                        overflow-hidden
                        bg-[#F7F5EF]
                        flex
                        items-center
                        justify-center
                        p-6
                    "
                >
                    {/* =================================================
                        BACKGROUND
                    ================================================= */}

                    <div className="pointer-events-none fixed inset-0 overflow-hidden">

                        <div
                            className="
                                absolute
                                -left-28
                                -top-28
                                h-96
                                w-96
                                rounded-full
                                bg-emerald-400/10
                                blur-3xl
                            "
                        />

                        <div
                            className="
                                absolute
                                right-[-140px]
                                top-[30%]
                                h-[32rem]
                                w-[32rem]
                                rounded-full
                                bg-cyan-300/10
                                blur-3xl
                            "
                        />

                        <div
                            className="
                                absolute
                                bottom-[-120px]
                                left-[30%]
                                h-[28rem]
                                w-[28rem]
                                rounded-full
                                bg-amber-300/10
                                blur-3xl
                            "
                        />

                        <div
                            className="
                                absolute
                                inset-0
                                opacity-[0.035]
                                bg-[linear-gradient(rgba(16,106,46,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,106,46,.35)_1px,transparent_1px)]
                                bg-[size:40px_40px]
                            "
                        />

                    </div>

                    {/* =================================================
                        ANIMATION
                    ================================================= */}

                    <style>{`
                        @keyframes loginReveal {
                            from {
                                opacity: 0;
                                transform: translateY(15px);
                            }

                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }

                        .login-reveal {
                            animation:
                                loginReveal
                                .65s
                                cubic-bezier(.2,.8,.2,1)
                                both;
                        }
                    `}</style>

                    {/* =================================================
                        LOGIN CARD
                    ================================================= */}

                    <div
                        className="
                            login-reveal
                            bg-white
                            rounded-[28px]
                            p-9
                            w-full
                            max-w-sm
                            shadow-xl
                            shadow-black/5
                            border
                            border-slate-200
                            relative
                            z-10
                        "
                    >

                        {/* =================================================
                            BRAND
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
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>

                        </div>

                        <h1
                            className="
                                text-xl
                                font-semibold
                                text-center
                                text-slate-800
                            "
                        >
                            CDM OneServe
                        </h1>

                        <p
                            className="
                                text-sm
                                text-slate-400
                                text-center
                                mt-1
                                mb-7
                            "
                        >
                            Sign in to your account
                        </p>

                        {/* =================================================
                            EMAIL
                        ================================================= */}

                        <div className="mb-3.5">

                            <label
                                className="
                                    block
                                    text-xs
                                    font-medium
                                    text-slate-500
                                    mb-1.5
                                "
                            >
                                Email
                            </label>

                            <div className="relative flex items-center">

                                <svg
                                    width="17"
                                    height="17"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="
                                        absolute
                                        left-3.5
                                        text-slate-400
                                    "
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

                                <input
                                    type="email"
                                    placeholder="you@cdm.edu.ph"
                                    className="
                                        w-full
                                        pl-10
                                        pr-3.5
                                        py-3
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
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key ===
                                            "Enter"
                                        ) {
                                            handleLogin();
                                        }
                                    }}
                                />

                            </div>

                        </div>

                        {/* =================================================
                            PASSWORD
                        ================================================= */}

                        <div className="mb-2">

                            <label
                                className="
                                    block
                                    text-xs
                                    font-medium
                                    text-slate-500
                                    mb-1.5
                                "
                            >
                                Password
                            </label>

                            <div className="relative flex items-center">

                                <svg
                                    width="17"
                                    height="17"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="
                                        absolute
                                        left-3.5
                                        text-slate-400
                                    "
                                >
                                    <rect
                                        x="3"
                                        y="11"
                                        width="18"
                                        height="11"
                                        rx="2"
                                    />

                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="••••••••"
                                    className="
                                        w-full
                                        pl-10
                                        pr-10
                                        py-3
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
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key ===
                                            "Enter"
                                        ) {
                                            handleLogin();
                                        }
                                    }}
                                />

                                {/* SHOW / HIDE PASSWORD */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (prev) =>
                                                !prev
                                        )
                                    }
                                    className="
                                        absolute
                                        right-3.5
                                        text-slate-400
                                        hover:text-[#106A2E]
                                        transition-colors
                                    "
                                    tabIndex={-1}
                                >

                                    {showPassword ? (
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
                                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />

                                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />

                                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />

                                            <line
                                                x1="2"
                                                y1="2"
                                                x2="22"
                                                y2="22"
                                            />
                                        </svg>
                                    ) : (
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
                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />

                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="3"
                                            />
                                        </svg>
                                    )}

                                </button>

                            </div>

                        </div>

                        {/* =================================================
                            FORGOT PASSWORD
                        ================================================= */}

                        <Link
                            to="/forgot-password"
                            className="
                                text-xs
                                font-medium
                                text-[#106A2E]
                                hover:underline
                            "
                        >
                            Forgot password?
                        </Link>

                        {/* =================================================
                            LOGIN BUTTON
                        ================================================= */}

                        <button
                            onClick={handleLogin}
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
                                flex
                                items-center
                                justify-center
                                gap-2
                                shadow-lg
                                shadow-emerald-900/20
                                disabled:opacity-70
                                mt-5
                            "
                        >

                            {loading ? (
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
                            )}

                        </button>

                        {/* =================================================
                            DIVIDER
                        ================================================= */}

                        <div className="flex items-center gap-2.5 my-5">

                            <span className="flex-1 h-px bg-slate-200" />

                            <span
                                className="
                                    text-[11px]
                                    uppercase
                                    tracking-wider
                                    text-slate-400
                                "
                            >
                                New here
                            </span>

                            <span className="flex-1 h-px bg-slate-200" />

                        </div>

                        {/* =================================================
                            REGISTER
                        ================================================= */}

                        <p
                            className="
                                text-center
                                text-sm
                                text-slate-500
                            "
                        >
                            Don't have an account?{" "}

                            <Link
                                to="/register"
                                className="
                                    text-[#106A2E]
                                    font-semibold
                                    hover:underline
                                "
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