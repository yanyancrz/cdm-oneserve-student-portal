import "../authPages.css";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    BookOpen,
    Eye,
    EyeOff,
    Lock,
    LogIn,
    Mail,
    MessageCircleHeart,
    SearchCheck,
    Stethoscope,
} from "lucide-react";
import toast from "react-hot-toast";

import LoadingModal from "../../components/LoadingModal/LoadingModal";
import BackgroundLayout from "../../layouts/BackgroundLayout";
import AuthCardHeader from "../AuthCardHeader";
import { API_URL } from "../../config/api";
import { loadGoogleIdentity, bindGoogleIdentity } from "../../services/googleIdentity";
import { isPWAInstalled } from "../../utils/pwa";
import { LIBRARY_HOME_ROUTE, clearSession } from "../../library-admin/utils/session";
import { rememberSessionKey } from "../../session/deviceSession";
import { GUIDANCE_HEAD_HOME_ROUTE } from "../../guidance-admin/utils/session";
import { LOST_FOUND_ADMIN_HOME_ROUTE } from "../../lost-found/session";

// =====================================================
// CAMPUS SERVICES SHOWN ON THE LOGIN PAGE
// =====================================================

const SERVICES = [
    { name: "Clinic", description: "Health records", icon: Stethoscope },
    { name: "Library", description: "Books, reservations, and e-resources", icon: BookOpen },
    { name: "Guidance", description: "Counseling and student support", icon: MessageCircleHeart },
    { name: "Lost & Found", description: "Report and claim lost items", icon: SearchCheck },
];

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Set only when the server has a Google
    // client ID configured - the button renders
    // only then, so an unconfigured server shows
    // the plain password form.
    const [googleClientId, setGoogleClientId] = useState(null);

    const navigate = useNavigate();

    const googleButtonRef = useRef(null);

    // The Google callback reads the latest handler
    // through this ref, so the Identity Services
    // initialization (which runs once) never holds a
    // stale closure.
    const googleCallbackRef = useRef(null);

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

    // authData lets Google sign-in hand over an
    // already-verified payload: the password form
    // fetches it itself, Google has it already.
    // Everything after this point - session
    // handling and routing - is identical.
    const handleLogin = async (authData = null) => {
        if (!authData) {
            if (!checkPWAAccess()) {
                return;
            }

            if (!email.trim() || !password.trim()) {
                toast.error("Please enter your email and password.");
                return;
            }
        }

        setLoading(true);

        try {
            let data = authData;

            if (!data) {
                // ---------- LOGIN REQUEST ----------
                const response = await fetch(`${API_URL}/api/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email.trim(), password }),
                });

                // ---------- READ RESPONSE ----------
                data = {};

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

            // ---------- REMEMBER WHICH BROWSER THIS IS ----------
            // Stored next to the token. It is the only way the server can later
            // answer "was your account signed in somewhere else?" - a stateless
            // JWT cannot answer that on its own.
            rememberSessionKey(data.sessionKey);

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

            // ---------- LOST & FOUND ADMIN (module owner): desktop only ----------
            // Same shared login page. The Lost & Found console is a
            // separate, desktop-only module - never the student dashboard.
            if (
                role === "lostfoundadmin" ||
                role === "lostfound_admin" ||
                role === "lostfound-admin" ||
                role === "lostfoundsuperadmin" ||
                role === "lostfound_super_admin" ||
                role === "lostfound-super-admin" ||
                role === "lostfoundsubadmin" ||
                role === "lostfound_sub_admin" ||
                role === "lostfound-subadmin"
            ) {
                if (!isDesktop) {
                    rejectLogin("Lost & Found Admin accounts can only be used on a desktop device.");
                    return;
                }

                toast.success("Welcome, Lost & Found Admin!");
                navigate(LOST_FOUND_ADMIN_HOME_ROUTE, { replace: true });
                return;
            }

            // ---------- OTHER ADMIN MODULES: desktop only ----------
            if (
                role === "clinicadmin" ||
                role === "clinic_admin" ||
                role === "clinic-admin"
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

    // =====================================================
    // GOOGLE SIGN-IN
    // =====================================================
    // Sends the Google credential to the server,
    // which verifies it against Google's own keys,
    // then finishes the login exactly like the
    // password form does.

    const handleGoogleCredential = async (response) => {
        const credential = response?.credential;

        if (!credential) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken: credential }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                toast.error(data?.message || "Google sign-in failed.");
                return;
            }

            await handleLogin(data);
        } catch {
            toast.error("Unable to connect to API");
        }
    };

    // Keep the latest handler reachable from the
    // one-time Identity Services initialization.
    useEffect(() => {
        googleCallbackRef.current = handleGoogleCredential;
    });

    // =====================================================
    // GOOGLE SIGN-IN BUTTON
    // =====================================================
    // Loads the Google Identity Services script on
    // demand and renders the official button. A
    // failure anywhere leaves the password form
    // working - Google sign-in is additive.

    useEffect(() => {
        let cancelled = false;
        let unbindGoogle;

        const init = async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/config`);

                if (!response.ok) {
                    return;
                }

                const data = await response.json().catch(() => ({}));
                const clientId = data?.googleClientId;

                if (!clientId || cancelled) {
                    return;
                }

                setGoogleClientId(clientId);

                await loadGoogleIdentity();

                if (cancelled || !window.google?.accounts?.id) {
                    return;
                }

                unbindGoogle = bindGoogleIdentity(clientId, response =>
                    googleCallbackRef.current?.(response));

                // The button container only exists once
                // googleClientId is set - wait for the
                // re-render if the script won the race.
                let attempts = 0;

                while (
                    !googleButtonRef.current &&
                    attempts < 20 &&
                    !cancelled
                ) {
                    await new Promise((r) =>
                        window.setTimeout(r, 50)
                    );
                    attempts += 1;
                }

                if (cancelled || !googleButtonRef.current) {
                    return;
                }

                // GIS accepts a pixel number only (200-400); "100%" is ignored.
                // Measure the container so the button matches the Sign In width.
                const containerWidth = Math.round(
                    googleButtonRef.current.clientWidth
                );

                window.google.accounts.id.renderButton(
                    googleButtonRef.current,
                    {
                        type: "standard",
                        theme: "outline",
                        size: "large",
                        text: "continue_with",
                        shape: "rectangular",
                        logo_alignment: "center",
                        width: Math.min(400, Math.max(200, containerWidth)),
                    }
                );
            } catch {
                // Google sign-in stays unavailable;
                // the password form above is unaffected.
            }
        };

        init();

        return () => {
            cancelled = true;
            unbindGoogle?.();
        };
    }, []);

    const handleEnter = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    };

    const inputClass =
        "auth-field w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 text-sm text-slate-700 outline-none transition-colors focus:border-[#106A2E] focus:bg-white";

    return (
        <>
            {loading && <LoadingModal message="Signing In..." />}

            <BackgroundLayout>
                <div className="auth-page">
                    <div className="auth-frame mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-8 px-4 py-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-12">
                        {/* ================= BRAND PANEL (desktop) ================= */}
                        <section className="auth-enter auth-brand-enter order-1 hidden lg:order-none lg:block">
                            <h2 className="text-5xl font-bold tracking-tight text-emerald-950">
                                CDM OneServe
                            </h2>

                            <p className="mt-2 text-lg font-medium text-[#106A2E]">
                                An Integrated Campus Service Management
                            </p>

                            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                                One account for every service at Colegio de Montalban,
                                from the clinic to the library and everything in between.
                            </p>

                            <ul className="mt-8 grid max-w-md gap-2.5">
                                {SERVICES.map(({ name, description, icon: Icon }) => (
                                    <li
                                        key={name}
                                        className="flex items-center gap-3 rounded-2xl border border-emerald-900/10 bg-white/75 p-3"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#106A2E]">
                                            <Icon size={18} />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800">{name}</p>
                                            <p className="text-xs leading-5 text-slate-600">{description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* ================= LOGIN CARD ================= */}
                        <section className="flex flex-col items-center">
                            <div className="auth-card auth-enter w-full max-w-md p-5 sm:p-8 lg:p-9">
                                <AuthCardHeader page="login" />

                                {/* ---------- EMAIL ---------- */}
                                <div className="auth-step mb-3.5">
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
                                <div className="auth-step auth-step-next mb-2">
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
                                            className={`${inputClass} pr-12`}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyDown={handleEnter}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            className="absolute right-1 grid size-10 place-items-center rounded-lg text-slate-500 transition-colors hover:text-[#106A2E] focus-visible:ring-2 focus-visible:ring-emerald-600"
                                            >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </div>

                                {/* ---------- FORGOT PASSWORD ---------- */}
                                <div className="auth-step auth-step-next flex justify-end">
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs font-medium text-[#106A2E] hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                {/* ---------- LOGIN BUTTON ---------- */}
                                <button
                                    onClick={() => handleLogin()}
                                    disabled={loading}
                                    className="auth-step auth-step-last mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] p-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-70"
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

                                {/* ---------- GOOGLE SIGN-IN ---------- */}
                                {googleClientId && (
                                    <>
                                        <div className="my-5 flex items-center gap-2.5">
                                            <span className="h-px flex-1 bg-slate-200" />
                                            <span className="text-[11px] uppercase tracking-wider text-slate-400">
                                                or
                                            </span>
                                            <span className="h-px flex-1 bg-slate-200" />
                                        </div>

                                        {/* min-h reserves the space so the card doesn't jump when the
                                            Google iframe loads; the pulse placeholder sits behind it
                                            and is covered once the real button renders. */}
                                        <div className="relative flex min-h-[44px] w-full items-center justify-center overflow-hidden rounded-xl">
                                            <div className="absolute inset-0 animate-pulse rounded-xl bg-slate-100" />
                                            <div
                                                ref={googleButtonRef}
                                                className="relative z-10 flex w-full justify-center"
                                            />
                                        </div>
                                    </>
                                )}

                            </div>

                            {/* ================= SERVICE CHIPS (mobile / tablet) ================= */}
                            <div className="auth-service-list mt-6 flex max-w-sm flex-wrap justify-center gap-2 lg:hidden">
                                {SERVICES.map(({ name, icon: Icon }) => (
                                    <span
                                        key={name}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/10 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700"
                                    >
                                        <Icon size={13} className="text-[#106A2E]" />
                                        {name}
                                    </span>
                                ))}
                            </div>

                            <p className="mt-6 text-center text-xs text-slate-600">
                                Colegio de Montalban &middot; CDM OneServe
                            </p>
                        </section>
                    </div>
                </div>
            </BackgroundLayout>
        </>
    );
}
