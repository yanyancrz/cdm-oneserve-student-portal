import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    BookOpen,
    Eye,
    EyeOff,
    GraduationCap,
    Lock,
    LogIn,
    Mail,
    MessageCircleHeart,
    SearchCheck,
    Stethoscope,
    Store,
} from "lucide-react";
import toast from "react-hot-toast";

import LoadingModal from "../../components/LoadingModal/LoadingModal";
import BackgroundLayout from "../../layouts/BackgroundLayout";
import { API_URL } from "../../config/api";
import { isPWAInstalled } from "../../utils/pwa";
import { LIBRARY_HOME_ROUTE, clearSession } from "../../library-admin/utils/session";
import { GUIDANCE_HEAD_HOME_ROUTE } from "../../guidance-admin/utils/session";

// =====================================================
// CAMPUS SERVICES SHOWN ON THE LOGIN PAGE
// =====================================================

const SERVICES = [
    { name: "Clinic", description: "Health records", icon: Stethoscope },
    { name: "Library", description: "Books, reservations, and e-resources", icon: BookOpen },
    { name: "Guidance", description: "Counseling and student support", icon: MessageCircleHeart },
    { name: "Lost & Found", description: "Report and claim lost items", icon: SearchCheck },
    { name: "Business Hub", description: "Campus products and services", icon: Store },
];

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const checkPWAAccess = () => {
        // DEV MODE: allow testing directly from localhost/browser
        if (import.meta.env.DEV) {
            return true;
        }

        if (!isPWAInstalled()) {
            toast.error("Please install the CDM OneServe app first.");
            return false;
        }

        return true;
    };

    // =====================================================
    // DEVICE DETECTION
    // =====================================================

    const getDeviceType = () => {
        const userAgent = navigator.userAgent || "";

        const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
        const isMobile = /Android.*Mobile|iPhone|iPod|Windows Phone|Mobile/i.test(userAgent);

        if (isTablet) return "tablet";
        if (isMobile) return "mobile";

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
            toast.error("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            // ---------- LOGIN REQUEST ----------
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            // ---------- READ RESPONSE ----------
            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            // ---------- LOGIN FAILED ----------
            if (!response.ok) {
                toast.error(data?.message || data?.error || "Invalid Email or Password");
                return;
            }

            // ---------- USER + ROLE ----------
            const user = data.user || data;

            const role = String(user.role || user.userRole || "")
                .trim()
                .toLowerCase();

            // ---------- DEVICE ----------
            const deviceType = getDeviceType();
            const isMobile = deviceType === "mobile";
            const isDesktop = deviceType === "desktop";

            // The token is saved before the device / role checks below,
            // so a rejected login must also clear the session.
            const rejectLogin = (message) => {
                clearSession();
                toast.error(message);
            };

            const isLibraryStaff =
                role === "librarystaff" ||
                role === "library_staff" ||
                role === "library-staff";

            // ---------- SAVE JWT TOKEN ----------
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("authToken", data.token); // compatibility
            }

            // ---------- SAVE USER INFORMATION ----------
            localStorage.setItem("userId", user.id ?? "");
            localStorage.setItem("idNumber", user.idNumber || "");
            localStorage.setItem("userName", user.fullName || "");
            localStorage.setItem("userEmail", user.email || "");
            localStorage.setItem("userRole", user.role || "");
            localStorage.setItem("role", user.role || ""); // compatibility
            localStorage.setItem("course", user.course || "");
            localStorage.setItem("yearLevel", user.yearLevel || "");
            localStorage.setItem("contactNumber", user.contactNumber || "");
            localStorage.setItem("profilePicture", user.profilePicture || "");
            localStorage.setItem("isProfileComplete", String(user.isProfileComplete ?? false));

            // ---------- LIBRARY STAFF: any device, directly to scanner ----------
            if (isLibraryStaff) {
                toast.success("Welcome, Library Staff!");
                navigate("/library/scanner", { replace: true });
                return;
            }

            // ---------- LIBRARY ADMIN (HEAD): desktop only ----------
            if (
                role === "libraryadmin" ||
                role === "library_admin" ||
                role === "library-admin"
            ) {
                if (!isDesktop) {
                    rejectLogin("Library Admin accounts can only be used on a desktop device.");
                    return;
                }

                toast.success("Welcome, Library Head!");
                navigate(LIBRARY_HOME_ROUTE, { replace: true });
                return;
            }

            // ---------- MAIN / SUPER ADMIN: desktop only ----------
            if (
                role === "admin" ||
                role === "superadmin" ||
                role === "super_admin" ||
                role === "super-admin"
            ) {
                if (!isDesktop) {
                    rejectLogin("Admin accounts can only be used on a desktop device.");
                    return;
                }

                toast.success("Welcome back, Admin!");
                navigate("/admin/dashboard", { replace: true });
                return;
            }

            // ---------- GUIDANCE HEAD: desktop only, straight to its own portal ----------
            // Same shared login page. The Guidance Administration dashboard is a
            // separate, desktop-only module - never the student OneServe dashboard.
            if (
                role === "guidanceadmin" ||
                role === "guidance_admin" ||
                role === "guidance-admin"
            ) {
                if (!isDesktop) {
                    rejectLogin("Guidance Head accounts can only be used on a desktop device.");
                    return;
                }

                toast.success("Welcome, Guidance Head!");
                navigate(GUIDANCE_HEAD_HOME_ROUTE, { replace: true });
                return;
            }

            // ---------- OTHER ADMIN MODULES: desktop only ----------
            if (
                role === "clinicadmin" ||
                role === "clinic_admin" ||
                role === "clinic-admin" ||
                role === "businesshubadmin" ||
                role === "business_hub_admin" ||
                role === "business-hub-admin"
            ) {
                if (!isDesktop) {
                    rejectLogin("Staff and Admin accounts can only be used on a desktop device.");
                    return;
                }

                toast.success("Welcome back!");
                navigate("/admin/dashboard", { replace: true });
                return;
            }

            // ---------- COUNSELOR: mobile, straight to the Counselor page ----------
            // Same shared login. Counselors never go through the student dashboard.
            if (role === "counselor") {
                if (!isMobile && !import.meta.env.DEV) {
                    rejectLogin("Counselor accounts can only be used on a mobile phone.");
                    return;
                }

                toast.success("Welcome, Counselor!");
                navigate("/guidance/counselor", { replace: true });
                return;
            }

            // ---------- STUDENT / FACULTY: mobile only ----------
            if (role === "student" || role === "faculty") {
                // DEV MODE: allow testing on desktop. Production requires a phone.
                if (!isMobile && !import.meta.env.DEV) {
                    rejectLogin("Student and Faculty accounts can only be used on a mobile phone.");
                    return;
                }

                // if (!isMobile) {
                //     rejectLogin("Student and Faculty accounts can only be used on a mobile phone.");
                //     return;
                // }

                if (!user.isProfileComplete) {
                    toast.success("Login successful. Please complete your profile.");
                    navigate("/setup-profile", { replace: true });
                    return;
                }

                toast.success("Welcome back!");
                navigate("/dashboard", { replace: true });
                return;
            }

            // ---------- UNKNOWN ROLE ----------
            rejectLogin("Your account role is not recognized.");
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Unable to connect to API");
        } finally {
            setLoading(false);
        }
    };

    const handleEnter = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    };

    const inputClass =
        "w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 text-sm text-slate-700 outline-none transition-colors focus:border-[#106A2E] focus:bg-white";

    return (
        <>
            {loading && <LoadingModal message="Signing In..." />}

            <BackgroundLayout>
                <div className="relative min-h-screen overflow-hidden bg-[#F7F5EF]">
                    {/* ================= BACKGROUND ================= */}
                    <div className="pointer-events-none fixed inset-0 overflow-hidden">
                        <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
                        <div className="absolute right-[-140px] top-[30%] h-[32rem] w-[32rem] rounded-full bg-cyan-300/10 blur-3xl" />
                        <div className="absolute bottom-[-120px] left-[30%] h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,106,46,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,106,46,.35)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.035]" />
                    </div>

                    <style>{`
                        @keyframes loginReveal {
                            from { opacity: 0; transform: translateY(15px); }
                            to   { opacity: 1; transform: translateY(0); }
                        }
                        .login-reveal {
                            animation: loginReveal .65s cubic-bezier(.2,.8,.2,1) both;
                        }
                        .login-reveal-delay {
                            animation: loginReveal .65s cubic-bezier(.2,.8,.2,1) .12s both;
                        }
                    `}</style>

                    <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 p-6 lg:grid-cols-2 lg:gap-16 lg:p-10">
                        {/* ================= BRAND PANEL (desktop) ================= */}
                        <section className="login-reveal hidden lg:block">
                            <h1 className="text-4xl font-bold tracking-tight text-slate-800">
                                CDM OneServe
                            </h1>

                            <p className="mt-2 text-lg font-medium text-[#106A2E]">
                                An Integrated Campus Service Management
                            </p>

                            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
                                One account for every service at Colegio de Montalban,
                                from the clinic to the library and everything in between.
                            </p>

                            <ul className="mt-8 grid max-w-md gap-3">
                                {SERVICES.map(({ name, description, icon: Icon }) => (
                                    <li
                                        key={name}
                                        className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 backdrop-blur"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E1F0E4] text-[#106A2E]">
                                            <Icon size={18} />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800">{name}</p>
                                            <p className="truncate text-xs text-slate-500">{description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* ================= LOGIN CARD ================= */}
                        <section className="flex flex-col items-center">
                            <div className="login-reveal-delay relative z-10 w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-9 shadow-xl shadow-black/5">
                                {/* Brand (same on mobile and desktop) */}
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] shadow-lg shadow-emerald-900/20">
                                    <GraduationCap size={26} className="text-white" />
                                </div>

                                <h2 className="text-center text-xl font-semibold text-slate-800">
                                    CDM OneServe
                                </h2>

                                <p className="mb-7 mt-1 text-center text-sm text-slate-400">
                                    An Integrated Campus Service Management
                                </p>

                                {/* ---------- EMAIL ---------- */}
                                <div className="mb-3.5">
                                    <label
                                        htmlFor="login-email"
                                        className="mb-1.5 block text-xs font-medium text-slate-500"
                                    >
                                        Email
                                    </label>

                                    <div className="relative flex items-center">
                                        <Mail size={17} className="absolute left-3.5 text-slate-400" />

                                        <input
                                            id="login-email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@cdm.edu.ph"
                                            className={`${inputClass} pr-3.5`}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyDown={handleEnter}
                                        />
                                    </div>
                                </div>

                                {/* ---------- PASSWORD ---------- */}
                                <div className="mb-2">
                                    <label
                                        htmlFor="login-password"
                                        className="mb-1.5 block text-xs font-medium text-slate-500"
                                    >
                                        Password
                                    </label>

                                    <div className="relative flex items-center">
                                        <Lock size={17} className="absolute left-3.5 text-slate-400" />

                                        <input
                                            id="login-password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className={`${inputClass} pr-10`}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyDown={handleEnter}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            className="absolute right-3.5 text-slate-400 transition-colors hover:text-[#106A2E]"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </div>

                                {/* ---------- FORGOT PASSWORD ---------- */}
                                <div className="flex justify-end">
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs font-medium text-[#106A2E] hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                {/* ---------- LOGIN BUTTON ---------- */}
                                <button
                                    onClick={handleLogin}
                                    disabled={loading}
                                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] p-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
                                >
                                    {loading ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Signing In...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn size={17} />
                                            Sign In
                                        </>
                                    )}
                                </button>

                                {/* ---------- DIVIDER ---------- */}
                                <div className="my-5 flex items-center gap-2.5">
                                    <span className="h-px flex-1 bg-slate-200" />
                                    <span className="text-[11px] uppercase tracking-wider text-slate-400">
                                        New here
                                    </span>
                                    <span className="h-px flex-1 bg-slate-200" />
                                </div>

                                {/* ---------- REGISTER ---------- */}
                                <p className="text-center text-sm text-slate-500">
                                    Don't have an account?{" "}
                                    <Link
                                        to="/register"
                                        className="font-semibold text-[#106A2E] hover:underline"
                                    >
                                        Register
                                    </Link>
                                </p>
                            </div>

                            {/* ================= SERVICE CHIPS (mobile / tablet) ================= */}
                            <div className="login-reveal-delay mt-6 flex max-w-sm flex-wrap justify-center gap-2 lg:hidden">
                                {SERVICES.map(({ name, icon: Icon }) => (
                                    <span
                                        key={name}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600"
                                    >
                                        <Icon size={13} className="text-[#106A2E]" />
                                        {name}
                                    </span>
                                ))}
                            </div>

                            <p className="mt-6 text-center text-[11px] text-slate-400">
                                Colegio de Montalban &middot; CDM OneServe
                            </p>
                        </section>
                    </div>
                </div>
            </BackgroundLayout>
        </>
    );
}