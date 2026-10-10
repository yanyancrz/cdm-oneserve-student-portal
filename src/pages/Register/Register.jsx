import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Check, X } from "lucide-react";
import LoadingModal from "../../components/LoadingModal/LoadingModal";
import { API_URL } from "../../config/api";
import BackgroundLayout from "../../layouts/BackgroundLayout";

// =========================================================
// STRONG PASSWORD RULES
// =========================================================

const getPasswordRules = (pw, idNumber = "", email = "") => {
    const emailName = email.split("@")[0].trim().toLowerCase();
    const lower = pw.toLowerCase();
    const id = idNumber.trim().toLowerCase();

    return [
        { key: "len", label: "At least 8 characters", ok: pw.length >= 8 },
        { key: "upper", label: "An uppercase letter (A-Z)", ok: /[A-Z]/.test(pw) },
        { key: "lower", label: "A lowercase letter (a-z)", ok: /[a-z]/.test(pw) },
        { key: "digit", label: "A number (0-9)", ok: /\d/.test(pw) },
        { key: "symbol", label: "A symbol (! @ # $ % ...)", ok: /[^A-Za-z0-9\s]/.test(pw) },
        { key: "space", label: "No spaces", ok: pw.length > 0 && !/\s/.test(pw) },
        {
            key: "personal",
            label: "Not your email name or ID number",
            ok:
                pw.length > 0 &&
                !(emailName.length >= 3 && lower.includes(emailName)) &&
                !(id.length >= 3 && lower.includes(id)),
        },
    ];
};

const STRENGTH = [
    { label: "Too weak", bar: "bg-red-500", text: "text-red-600" },
    { label: "Weak", bar: "bg-orange-500", text: "text-orange-600" },
    { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
    { label: "Good", bar: "bg-lime-500", text: "text-lime-600" },
    { label: "Strong", bar: "bg-emerald-600", text: "text-emerald-700" },
];

function PasswordStrength({ rules, password }) {
    if (!password) return null;

    const passed = rules.filter((r) => r.ok).length;
    const level =
        passed >= rules.length
            ? 4
            : Math.min(3, Math.floor((passed / rules.length) * 4));
    const filled = level === 4 ? 4 : Math.max(1, level);
    const info = STRENGTH[level];

    return (
        <div className="mt-2.5" aria-live="polite">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < filled ? info.bar : "bg-slate-200"
                        }`}
                    />
                ))}
            </div>

            <p className={`mt-1 text-[11px] font-semibold ${info.text}`}>
                {info.label}
            </p>

            <ul className="mt-1.5 grid grid-cols-1 gap-y-0.5 sm:grid-cols-2 sm:gap-x-3">
                {rules.map((r) => (
                    <li
                        key={r.key}
                        className={`flex items-center gap-1.5 text-[11px] ${
                            r.ok ? "text-emerald-700" : "text-slate-400"
                        }`}
                    >
                        {r.ok ? (
                            <Check size={12} aria-hidden="true" />
                        ) : (
                            <X size={12} aria-hidden="true" />
                        )}
                        {r.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function Register() {
    const [idNumber, setIdNumber] = useState("");

    // Name fields
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");

    const [role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [physicalIdFile, setPhysicalIdFile] = useState(null);
    const [physicalIdPreview, setPhysicalIdPreview] = useState("");

    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const navigate = useNavigate();

    // =========================================================
    // FORM VALIDATION
    // =========================================================

    const passwordRules = getPasswordRules(password, idNumber, email);
    const isPasswordStrong = passwordRules.every((r) => r.ok);

    const isFormValid =
        idNumber.trim() &&
        firstName.trim() &&
        lastName.trim() &&
        role &&
        email.trim() &&
        password.trim() &&
        isPasswordStrong &&
        physicalIdFile;

    // =========================================================
    // HANDLE PHYSICAL ID FILE
    // =========================================================

    const handlePhysicalIdChange = (file) => {
        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error(
                "Please upload a JPG, PNG, or WEBP image."
            );

            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            toast.error(
                "Physical ID image must be 5 MB or smaller."
            );

            return;
        }

        if (physicalIdPreview) {
            URL.revokeObjectURL(physicalIdPreview);
        }

        setPhysicalIdFile(file);

        const previewUrl =
            URL.createObjectURL(file);

        setPhysicalIdPreview(previewUrl);
    };

    // =========================================================
    // REMOVE PHYSICAL ID
    // =========================================================

    const removePhysicalId = () => {
        if (physicalIdPreview) {
            URL.revokeObjectURL(
                physicalIdPreview
            );
        }

        setPhysicalIdFile(null);
        setPhysicalIdPreview("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        if (cameraInputRef.current) {
            cameraInputRef.current.value = "";
        }
    };

    // =========================================================
    // UPLOAD PHYSICAL ID
    // =========================================================

    const uploadPhysicalId = async () => {
        if (!physicalIdFile) {
            throw new Error(
                "Please upload your physical ID."
            );
        }

        const formData = new FormData();

        formData.append(
            "file",
            physicalIdFile
        );

        const response = await fetch(
            `${API_URL}/api/auth/upload-physical-id`,
            {
                method: "POST",
                body: formData,
            }
        );

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data?.message ||
                "Failed to upload physical ID."
            );
        }

        return data.physicalIdDocument;
    };

    // =========================================================
    // REGISTER
    // =========================================================

    const handleRegister = async () => {
        // -----------------------------------------------------
        // REQUIRED FIELD VALIDATION
        // -----------------------------------------------------

        if (
            !idNumber.trim() ||
            !firstName.trim() ||
            !lastName.trim() ||
            !role ||
            !email.trim() ||
            !password.trim()
        ) {
            toast.error(
                "Please complete all required fields."
            );

            return;
        }

        // -----------------------------------------------------
        // STRONG PASSWORD VALIDATION
        // -----------------------------------------------------

        const weakRule = passwordRules.find((r) => !r.ok);

        if (weakRule) {
            toast.error(
                `Password is not strong enough: ${weakRule.label.toLowerCase()}.`
            );

            return;
        }

        // -----------------------------------------------------
        // PHYSICAL ID VALIDATION
        // -----------------------------------------------------

        if (!physicalIdFile) {
            toast.error(
                "Please upload your physical ID."
            );

            return;
        }

        setLoading(true);

        try {
            // =================================================
            // UPLOAD PHYSICAL ID FIRST
            // =================================================

            setUploadingPhoto(true);

            const physicalIdDocument =
                await uploadPhysicalId();

            setUploadingPhoto(false);

            // =================================================
            // REGISTER ACCOUNT
            // =================================================
            //
            // IMPORTANT:
            // We no longer send "fullName".
            //
            // The backend receives:
            // firstName
            // middleName
            // lastName
            //
            // The backend will compare the submitted name
            // against the official School Record.
            // =================================================

            const response =
                await fetch(
                    `${API_URL}/api/auth/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            firstName:
                                firstName.trim(),

                            middleName:
                                middleName.trim(),

                            lastName:
                                lastName.trim(),

                            idNumber:
                                idNumber.trim(),

                            role,

                            email:
                                email.trim(),

                            password,

                            physicalIdDocument,
                        }),
                    }
                );

            const data =
                await response.text();

            // =================================================
            // SUCCESS
            // =================================================

            if (response.ok) {
                toast.success(
                    "OTP Sent!"
                );

                // -------------------------------------------------
                // SAVE EMAIL FOR OTP PAGE
                // -------------------------------------------------

                localStorage.setItem(
                    "otpEmail",
                    email.trim()
                );

                // -------------------------------------------------
                // OPTIONAL: SAVE ID NUMBER
                // -------------------------------------------------
                //
                // This can be useful if the OTP page needs it.
                // -------------------------------------------------

                localStorage.setItem(
                    "otpIdNumber",
                    idNumber.trim()
                );

                // -------------------------------------------------
                // GO TO OTP PAGE
                // -------------------------------------------------

                setTimeout(() => {
                    navigate("/otp");
                }, 1000);
            }

            // =================================================
            // ERROR
            // =================================================

            else {
                let errorMessage =
                    "Registration failed.";

                try {
                    const parsedData =
                        JSON.parse(data);

                    errorMessage =
                        parsedData?.message ||
                        parsedData?.title ||
                        errorMessage;
                } catch {
                    if (data) {
                        errorMessage =
                            data;
                    }
                }

                toast.error(
                    errorMessage
                );
            }
        }

        // =====================================================
        // NETWORK / SERVER ERROR
        // =====================================================

        catch (error) {
            setUploadingPhoto(false);

            toast.error(
                error.message ||
                "Registration failed."
            );
        }

        // =====================================================
        // FINALLY
        // =====================================================

        finally {
            setLoading(false);
        }
    };

    // =========================================================
    // JSX
    // =========================================================

    return (
        <>
            {loading && (
                <LoadingModal
                    message={
                        uploadingPhoto
                            ? "Uploading physical ID..."
                            : "Sending OTP to your email..."
                    }
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
                        <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

                        <div className="absolute right-[-140px] top-[30%] h-[32rem] w-[32rem] rounded-full bg-cyan-300/10 blur-3xl" />

                        <div className="absolute bottom-[-120px] left-[30%] h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />

                        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(16,106,46,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,106,46,.35)_1px,transparent_1px)] bg-[size:40px_40px]" />
                    </div>

                    <style>{`
                        @keyframes registerReveal {
                            from {
                                opacity: 0;
                                transform: translateY(15px);
                            }

                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }

                        .register-reveal {
                            animation: registerReveal .65s cubic-bezier(.2,.8,.2,1) both;
                        }
                    `}</style>

                    <div
                        className="
                            register-reveal
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
                            ICON
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
                            Create Account
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
                            Register for your CDM OneServe account
                        </p>

                        {/* =================================================
                            ID NUMBER
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
                                ID Number

                                <span className="text-red-500 ml-1">
                                    *
                                </span>
                            </label>

                            <input
                                type="text"
                                placeholder="2024-00123"
                                className="
                                    w-full
                                    px-4
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
                                "
                                value={idNumber}
                                onChange={(e) =>
                                    setIdNumber(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        {/* =================================================
                            ACCOUNT TYPE
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
                                I am a
                            </label>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setRole("Student")
                                    }
                                    className={`
                                        py-3
                                        rounded-xl
                                        border
                                        text-sm
                                        font-medium
                                        transition-all
                                        ${
                                            role === "Student"
                                                ? "border-[#106A2E] bg-emerald-50 text-[#106A2E]"
                                                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white"
                                        }
                                    `}
                                >
                                    Student
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setRole("Faculty")
                                    }
                                    className={`
                                        py-3
                                        rounded-xl
                                        border
                                        text-sm
                                        font-medium
                                        transition-all
                                        ${
                                            role === "Faculty"
                                                ? "border-[#106A2E] bg-emerald-50 text-[#106A2E]"
                                                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white"
                                        }
                                    `}
                                >
                                    Faculty
                                </button>
                            </div>
                        </div>

                        {/* =================================================
                            FIRST NAME
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
                                First Name

                                <span className="text-red-500 ml-1">
                                    *
                                </span>
                            </label>

                            <input
                                type="text"
                                placeholder="Juan"
                                className="
                                    w-full
                                    px-4
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
                                "
                                value={firstName}
                                onChange={(e) =>
                                    setFirstName(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        {/* =================================================
                            MIDDLE NAME
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
                                Middle Name

                                <span className="text-slate-400 ml-1">
                                    (Optional)
                                </span>
                            </label>

                            <input
                                type="text"
                                placeholder="Santos"
                                className="
                                    w-full
                                    px-4
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
                                "
                                value={middleName}
                                onChange={(e) =>
                                    setMiddleName(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        {/* =================================================
                            LAST NAME
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
                                Last Name

                                <span className="text-red-500 ml-1">
                                    *
                                </span>
                            </label>

                            <input
                                type="text"
                                placeholder="Dela Cruz"
                                className="
                                    w-full
                                    px-4
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
                                "
                                value={lastName}
                                onChange={(e) =>
                                    setLastName(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

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
                                Email Address

                                <span className="text-red-500 ml-1">
                                    *
                                </span>
                            </label>

                            <input
                                type="email"
                                placeholder="you@cdm.edu.ph"
                                className="
                                    w-full
                                    px-4
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
                                "
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        {/* =================================================
                            PASSWORD
                        ================================================= */}

                        <div className="mb-5">
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

                                <span className="text-red-500 ml-1">
                                    *
                                </span>
                            </label>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Enter Password"
                                    className="
                                        w-full
                                        pl-4
                                        pr-11
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
                                    "
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((v) => !v)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    className="
                                        absolute
                                        right-3
                                        top-1/2
                                        -translate-y-1/2
                                        p-1
                                        text-slate-400
                                        hover:text-slate-600
                                    "
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>

                            <PasswordStrength
                                rules={passwordRules}
                                password={password}
                            />
                        </div>

                        {/* =================================================
                            PHYSICAL ID
                        ================================================= */}

                        <div className="mb-6">
                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    mb-1.5
                                "
                            >
                                <label
                                    className="
                                        block
                                        text-xs
                                        font-medium
                                        text-slate-500
                                    "
                                >
                                    Physical ID

                                    <span className="text-red-500 ml-1">
                                        *
                                    </span>
                                </label>

                                <span
                                    className="
                                        text-[10px]
                                        text-slate-400
                                    "
                                >
                                    Supporting Document
                                </span>
                            </div>

                            <div
                                className="
                                    border
                                    border-dashed
                                    border-slate-300
                                    rounded-2xl
                                    bg-slate-50
                                    p-4
                                "
                            >
                                {!physicalIdPreview ? (
                                    <div className="text-center">
                                        <div
                                            className="
                                                w-12
                                                h-12
                                                rounded-xl
                                                bg-emerald-50
                                                flex
                                                items-center
                                                justify-center
                                                mx-auto
                                                mb-2
                                            "
                                        >
                                            <svg
                                                width="22"
                                                height="22"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#106A2E"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <rect
                                                    x="3"
                                                    y="4"
                                                    width="18"
                                                    height="16"
                                                    rx="2"
                                                />

                                                <circle
                                                    cx="9"
                                                    cy="10"
                                                    r="2"
                                                />

                                                <path d="M14 9h4M14 13h4M7 16h11" />
                                            </svg>
                                        </div>

                                        <p
                                            className="
                                                text-xs
                                                font-medium
                                                text-slate-700
                                            "
                                        >
                                            Upload your physical school ID
                                        </p>

                                        <p
                                            className="
                                                text-[10px]
                                                text-slate-400
                                                mt-1
                                                mb-3
                                            "
                                        >
                                            JPG, PNG, or WEBP • Max 5 MB
                                        </p>

                                        <div
                                            className="
                                                flex
                                                items-center
                                                justify-center
                                                gap-2
                                            "
                                        >
                                            {/* UPLOAD */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className="
                                                    px-3
                                                    py-2
                                                    rounded-lg
                                                    bg-white
                                                    border
                                                    border-slate-200
                                                    text-xs
                                                    font-medium
                                                    text-slate-700
                                                    hover:border-[#106A2E]
                                                    hover:text-[#106A2E]
                                                    transition
                                                "
                                            >
                                                Upload Photo
                                            </button>

                                            {/* CAMERA */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    cameraInputRef.current?.click()
                                                }
                                                className="
                                                    px-3
                                                    py-2
                                                    rounded-lg
                                                    bg-gradient-to-br
                                                    from-[#106A2E]
                                                    to-[#0E3B22]
                                                    text-white
                                                    text-xs
                                                    font-medium
                                                    hover:opacity-90
                                                    transition
                                                "
                                            >
                                                Take Photo
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div
                                            className="
                                                relative
                                                overflow-hidden
                                                rounded-xl
                                                bg-slate-100
                                            "
                                        >
                                            <img
                                                src={
                                                    physicalIdPreview
                                                }
                                                alt="Physical ID preview"
                                                className="
                                                    w-full
                                                    h-40
                                                    object-cover
                                                "
                                            />

                                            <button
                                                type="button"
                                                onClick={
                                                    removePhysicalId
                                                }
                                                className="
                                                    absolute
                                                    top-2
                                                    right-2
                                                    w-8
                                                    h-8
                                                    rounded-full
                                                    bg-black/60
                                                    text-white
                                                    flex
                                                    items-center
                                                    justify-center
                                                    hover:bg-black/75
                                                "
                                                title="Remove photo"
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <div
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                                mt-3
                                            "
                                        >
                                            <div className="min-w-0">
                                                <p
                                                    className="
                                                        text-xs
                                                        font-medium
                                                        text-slate-700
                                                        truncate
                                                    "
                                                >
                                                    {
                                                        physicalIdFile.name
                                                    }
                                                </p>

                                                <p
                                                    className="
                                                        text-[10px]
                                                        text-slate-400
                                                    "
                                                >
                                                    {(
                                                        physicalIdFile.size /
                                                        (1024 * 1024)
                                                    ).toFixed(2)}{" "}
                                                    MB
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className="
                                                    text-xs
                                                    font-medium
                                                    text-[#106A2E]
                                                    hover:underline
                                                    ml-3
                                                "
                                            >
                                                Change
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* NORMAL FILE INPUT */}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) =>
                                        handlePhysicalIdChange(
                                            e.target.files?.[0]
                                        )
                                    }
                                />

                                {/* CAMERA INPUT */}

                                <input
                                    ref={cameraInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) =>
                                        handlePhysicalIdChange(
                                            e.target.files?.[0]
                                        )
                                    }
                                />
                            </div>

                            <p
                                className="
                                    text-[10px]
                                    text-slate-400
                                    mt-2
                                "
                            >
                                Please upload a clear photo of your physical
                                school ID. Make sure the information is readable.
                            </p>
                        </div>

                        {/* =================================================
                            REGISTER BUTTON
                        ================================================= */}

                        <button
                            onClick={handleRegister}
                            disabled={
                                !isFormValid ||
                                loading
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
                                transition-all
                                shadow-lg
                                shadow-emerald-900/20
                                disabled:from-slate-300
                                disabled:to-slate-300
                                disabled:shadow-none
                                disabled:cursor-not-allowed
                            "
                        >
                            {loading
                                ? (
                                    uploadingPhoto
                                        ? "Uploading ID..."
                                        : "Sending OTP..."
                                )
                                : "Register"
                            }
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
                                Already a member
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

                        <p
                            className="
                                text-center
                                text-sm
                                text-slate-500
                            "
                        >
                            Already have an account?{" "}

                            <Link
                                to="/"
                                className="
                                    text-[#106A2E]
                                    font-semibold
                                    hover:underline
                                "
                            >
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </BackgroundLayout>
        </>
    );
}