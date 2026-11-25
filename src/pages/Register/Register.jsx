import "../authPages.css";
import AuthCardHeader from "../AuthCardHeader";
import AuthServicePanel from "../AuthServicePanel";
import { Camera, GraduationCap, Upload, UsersRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingModal from "../../components/LoadingModal/LoadingModal";
import { API_URL } from "../../config/api";
import BackgroundLayout from "../../layouts/BackgroundLayout";

// =========================================================
// REGISTER (new flow)
// Fields: Student/Faculty ID Number, Email, Role and supporting document.
// No names, no password here.
// After submit, the backend emails the user their login
// credentials. Names + role confirmation move to Setup Profile.
// =========================================================

const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

export default function Register() {
    const [idNumber, setIdNumber] = useState("");
    const [role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [supportingDocument, setSupportingDocument] = useState(null);

    const handleDocumentChange = (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!/\.(pdf|jpe?g|png)$/i.test(file.name) ||
            !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
            toast.error("Please upload a PDF, JPG, or PNG file.");
            return;
        }
        if (file.size === 0 || file.size > 5 * 1024 * 1024) {
            toast.error("Please upload a non-empty file up to 5 MB.");
            return;
        }
        setSupportingDocument(file);
    };

    const [loading, setLoading] = useState(false);

    // Shown after the Register button is pressed: the
    // applicant reviews what they typed and confirms it
    // before anything is sent.
    const [confirming, setConfirming] = useState(false);

    const navigate = useNavigate();

    // Dynamic ID label: locked to the selected role.
    const idLabel =
        role === "Student"
            ? "Student ID Number"
            : role === "Faculty"
              ? "Faculty ID Number"
              : "ID Number";

    const idPlaceholder =
        role === "Student"
            ? "26-00000"
            : role === "Faculty"
              ? "FAC-00123"
              : "Enter your ID number";

    // =========================================================
    // FORM VALIDATION (shared by confirm prompt + submit)
    // =========================================================

    const validateForm = () => {
        if (!role) {
            return "Please select whether you are a Student or Faculty.";
        }

        if (!idNumber.trim()) {
            return `Please enter your ${idLabel}.`;
        }

        if (!email.trim()) {
            return "Please enter your email address.";
        }

        if (!isValidEmail(email)) {
            return "Please enter a valid email address.";
        }

        if (!supportingDocument) {
            return "Please upload an ID, registration form, or OVRF.";
        }

        return null;
    };

    const isFormValid =
        role &&
        idNumber.trim() &&
        email.trim() &&
        isValidEmail(email) &&
        supportingDocument &&
        !loading;

    // =========================================================
    // REGISTER BUTTON (opens the review prompt)
    // =========================================================

    const handleRegisterClick = () => {
        const formError = validateForm();

        if (formError) {
            toast.error(formError);
            return;
        }

        setConfirming(true);
    };

    // =========================================================
    // REGISTER
    // =========================================================

    const handleRegister = async () => {
        const formError = validateForm();

        if (formError) {
            toast.error(formError);
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("idNumber", idNumber.trim());
            formData.append("role", role);
            formData.append("email", email.trim());
            formData.append("supportingDocument", supportingDocument);
            const response = await fetch(
                `${API_URL}/api/auth/register-with-document`,
                {
                    method: "POST",

                    body: formData,
                }
            );

            const data =
                await response.text();

            // =================================================
            // SUCCESS -> credentials are emailed, go to login
            // =================================================

            if (response.ok) {
                toast.success(
                    "Registered! Check your email for your login credentials, including your Spam or Junk folder."
                );

                setTimeout(() => {
                    navigate("/");
                }, 1200);

                return;
            }

            // =================================================
            // ERROR
            // =================================================

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
        } catch (error) {
            toast.error(
                error.message ||
                "Registration failed."
            );
        } finally {
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
                    message="Submitting registration..."
                />
            )}

            <BackgroundLayout>
                <div className="auth-page">
                    <div className="auth-frame mx-auto grid min-h-dvh w-full max-w-6xl items-center justify-items-center gap-8 px-4 py-8 sm:px-8 lg:h-dvh lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:gap-16 lg:px-12 lg:py-8">
                        <main className="auth-card auth-enter auth-form-scroll w-full min-w-0 max-w-xl p-5 sm:p-8 lg:col-start-2 lg:row-start-1 lg:max-h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:p-10">
                            <AuthCardHeader page="register" />

                            <p className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900">
                                After you register, your login credentials
                                will be sent to your email. Use them to log
                                in, then complete your profile.
                            </p>

                            {/* =================================================
                                ACCOUNT TYPE
                            ================================================= */}

                            <div className="auth-step mb-3.5">
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

                                    <span className="text-red-500 ml-1">
                                        *
                                    </span>
                                </label>

                                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Account type">
                                    {[
                                        { value: "Student", icon: GraduationCap },
                                        { value: "Faculty", icon: UsersRound },
                                    ].map(({ value, icon: Icon }) => (
                                        <button key={value} type="button" onClick={() => setRole(value)}
                                            aria-pressed={role === value} className="auth-role">
                                            <Icon size={17} aria-hidden="true" />
                                            {value}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* =================================================
                                ID NUMBER (dynamic label, from Registration)
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
                                    {idLabel}

                                    <span className="text-red-500 ml-1">
                                        *
                                    </span>
                                </label>

                                <input
                                    type="text"
                                    placeholder={idPlaceholder}
                                    className="
                                        auth-field
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
                                EMAIL
                            ================================================= */}

                            <div className="mb-6">
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
                                    placeholder="you@example.com"
                                    className="
                                        auth-field
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
                                REGISTER BUTTON
                            ================================================= */}

                            <fieldset className="auth-step auth-step-next mb-6" aria-describedby="supporting-document-help">
                                <legend className="mb-1.5 text-xs font-medium text-slate-500">
                                    Supporting Document <span className="text-red-500">*</span>
                                </legend>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: "Choose file", icon: Upload, accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" },
                                        { label: "Take photo", icon: Camera, accept: "image/jpeg,image/png", capture: "environment" },
                                    ].map(({ label, icon: Icon, accept, capture }) => (
                                        <label key={label}>
                                            <input
                                                type="file"
                                                accept={accept}
                                                capture={capture}
                                                onChange={handleDocumentChange}
                                                disabled={loading}
                                                className="peer sr-only"
                                            />
                                            <span className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700 peer-disabled:opacity-50">
                                                <Icon size={16} aria-hidden="true" /> {label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {supportingDocument && (
                                    <p role="status" className="mt-2 break-all text-xs font-semibold text-slate-700">
                                        Selected file: {supportingDocument.name}
                                    </p>
                                )}
                                <p id="supporting-document-help" className="mt-2 text-xs leading-5 text-slate-500">
                                    Upload a clear copy of your ID, registration form, or OVRF. PDF, JPG, or PNG; maximum 5 MB.
                                </p>
                            </fieldset>

                            <button
                                onClick={handleRegisterClick}
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
                                    transition
                                    focus-visible:ring-2
                                    focus-visible:ring-emerald-600
                                    focus-visible:ring-offset-2
                                    shadow-lg
                                    shadow-emerald-900/20
                                    disabled:from-slate-300
                                    disabled:to-slate-300
                                    disabled:shadow-none
                                    disabled:cursor-not-allowed
                                "
                            >
                                {loading
                                    ? "Submitting..."
                                    : "Register"
                                }
                            </button>

                        </main>
                        <AuthServicePanel className="w-full lg:col-start-1 lg:row-start-1" />
                    </div>
                </div>
            </BackgroundLayout>

            {/* =================================================
                CONFIRMATION PROMPT
            ================================================= */}

            {confirming && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Review your registration details"
                >
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setConfirming(false)}
                    />

                    <div className="auth-dialog relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xl shadow-black/20 sm:p-7">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Review your details
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Is this correct?
                        </p>

                        <dl className="mt-4 space-y-2.5 text-sm">
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-400">I am a</dt>
                                <dd className="text-right font-semibold text-slate-800">
                                    {role}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-400">{idLabel}</dt>
                                <dd className="text-right font-semibold text-slate-800">
                                    {idNumber}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-400">Email</dt>
                                <dd className="text-right font-semibold text-slate-800 break-all">
                                    {email}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-400">Supporting document</dt>
                                <dd className="min-w-0 break-all text-right font-semibold text-slate-800">{supportingDocument?.name}</dd>
                            </div>

                            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
                                Your login credentials will be sent to
                                this email after you continue. If you don’t see
                                the email in your inbox, check your Spam or Junk folder.
                            </p>
                        </dl>

                        <div className="mt-6 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirming(false)}
                                className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white"
                            >
                                Edit details
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setConfirming(false);
                                    handleRegister();
                                }}
                                className="rounded-xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:opacity-90 active:scale-[0.98]"
                            >
                                Yes, continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
