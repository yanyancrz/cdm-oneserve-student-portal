import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BackgroundLayout from "../../layouts/BackgroundLayout";
import { API_URL } from "../../config/api";
import LoadingModal from "../../components/LoadingModal/LoadingModal";

export default function RequestDigitalID() {

    const navigate = useNavigate();

    // Profile information
    const [idNumber, setIdNumber] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [course, setCourse] = useState("");
    const [institute, setInstitute] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [position, setPosition] = useState("");
    const [studentStatus, setStudentStatus] = useState("");
    

    // User input
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [address, setAddress] = useState("");

    // Loading states
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isFaculty = role === "faculty";


    // ==========================================
    // LOAD PROFILE INFORMATION
    // ==========================================

    useEffect(() => {

        const loadProfile = async () => {

            try {

                const storedEmail =
                     localStorage.getItem("userEmail");

                if (!storedEmail) {

                    toast.error(
                        "Profile email not found. Please login again."
                    );

                    return;
                }

                const response = await fetch(
                    `${API_URL}/api/profile/${encodeURIComponent(
                        storedEmail
                    )}`
                );

                if (!response.ok) {

                    toast.error(
                        "Unable to load your profile information."
                    );

                    return;
                }

                const data =
                    await response.json();

                console.log(
                    "Profile loaded:",
                    data
                );


                // ==========================================
                // ALIGN DIGITAL ID WITH PROFILE
                // ==========================================

                setIdNumber(
                    data.idNumber || ""
                );

                setFullName(
                    data.fullName || ""
                );

                setEmail(
                    data.email || storedEmail
                );

                setRole(
                    (data.role || "").toLowerCase()
                );

                setInstitute(
                    data.institute || ""
                );

                setCourse(
                    data.course || ""
                );

                setYearLevel(
                    data.yearLevel || ""
                );

                setStudentStatus(
                    data.studentStatus || ""
                );

                setPosition(
                    data.position || ""
                );


            }
            catch (error) {

                console.error(
                    "Profile loading error:",
                    error
                );

                toast.error(
                    "Unable to load profile information."
                );

            }
            finally {

                setIsLoadingProfile(false);

            }

        };


        loadProfile();

    }, []);


    // ==========================================
    // FILE CHANGE
    // ==========================================

    const handleFileChange = (e) => {

        const file =
            e.target.files[0];

        setProfilePicture(file);

        if (file) {

            setPreviewUrl(
                URL.createObjectURL(file)
            );

        }
        else {

            setPreviewUrl(null);

        }

    };


    // ==========================================
    // FORM VALIDATION
    // ==========================================

    const isFormValid =

        !isLoadingProfile &&

        role === "student"

            ? (
                profilePicture &&
                idNumber &&
                fullName &&
                email &&
                role &&
                institute &&
                course &&
                yearLevel &&
                studentStatus &&
                address
            )

            : (

                profilePicture &&
                idNumber &&
                fullName &&
                email &&
                role &&
                institute &&
                position &&
                address

            );


    // ==========================================
    // SUBMIT DIGITAL ID REQUEST
    // ==========================================

    const handleSubmit = async () => {

        try {

            setIsSubmitting(true);

            const userId =
                localStorage.getItem("userId");


            if (!userId) {

                toast.error(
                    "User ID not found. Please login again."
                );

                return;

            }


            const formData =
                new FormData();


            // ==========================================
            // PROFILE INFORMATION
            // ==========================================

            formData.append(
                "userId",
                userId
            );

            formData.append(
                "role",
                role
            );

            formData.append(
                "idNumber",
                idNumber
            );

            formData.append(
                "fullName",
                fullName
            );

            formData.append(
                "institute",
                institute
            );

            formData.append(
                "course",
                course
            );

            formData.append(
                "yearLevel",
                yearLevel
            );

            formData.append(
                "studentStatus",
                studentStatus
            );

            formData.append(
                "position",
                position
            );


            // ==========================================
            // MANUAL INFORMATION
            // ==========================================

            formData.append(
                "address",
                address
            );


            // ==========================================
            // FORMAL PICTURE
            // ==========================================

            if (profilePicture) {

                formData.append(
                    "profilePicture",
                    profilePicture
                );

            }


            // ==========================================
            // SEND REQUEST
            // ==========================================

            const response = await fetch(
                `${API_URL}/api/digitalid/request`,
                {
                    method: "POST",
                    body: formData
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                toast.error(
                    data.message ||
                    "Unable to submit request."
                );

                return;

            }


            toast.success(
                "Digital ID Request Submitted!"
            );


            navigate("/dashboard");


        }
        catch (error) {

            console.error(
                error
            );

            toast.error(
                "Unable to connect to server."
            );

        }
        finally {

            setIsSubmitting(false);

        }

    };


    // ==========================================
    // LOADING PROFILE
    // ==========================================

    if (isLoadingProfile) {

        return (

            <BackgroundLayout>

                <div className="min-h-screen flex items-center justify-center p-6">

                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">

                        <div className="w-10 h-10 border-4 border-[#106A2E]/20 border-t-[#106A2E] rounded-full animate-spin mx-auto mb-4">
                        </div>

                        <p className="text-sm text-gray-600">
                            Loading your profile information...
                        </p>

                    </div>

                </div>

            </BackgroundLayout>

        );

    }


    return (

        <BackgroundLayout>

            {isSubmitting && (

                <LoadingModal
                    message="Submitting Digital ID Request..."
                />

            )}


            <div className="min-h-screen p-4 pb-10 relative overflow-hidden">

                <div className="max-w-md mx-auto relative z-10">


                    {/* ==========================================
                        HEADER
                    ========================================== */}

                    <div className="flex items-center justify-between gap-3 mb-4 pt-4">

                        <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-xl bg-[#106A2E] flex items-center justify-center flex-shrink-0">

                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
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

                                    <path
                                        d="M15 8h2M15 12h2M7 16h10"
                                    />

                                </svg>

                            </div>


                            <div>

                                <h1 className="text-lg font-semibold text-[#1F1F1F]">
                                    Request Digital ID
                                </h1>

                                <p className="text-xs text-gray-500">
                                    Review your information and complete your request
                                </p>

                            </div>

                        </div>


                        <button
                            onClick={() => navigate(-1)}
                            aria-label="Cancel request"
                            className="
                                w-9 h-9
                                rounded-full
                                bg-white
                                border border-gray-200
                                flex items-center justify-center
                                text-gray-500
                                hover:bg-gray-50
                                hover:text-[#1F1F1F]
                                active:scale-95
                                transition-all
                                flex-shrink-0
                            "
                        >

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

                                <path d="M18 6 6 18M6 6l12 12" />

                            </svg>

                        </button>

                    </div>


                    {/* ==========================================
                        NOTE
                    ========================================== */}

                    <div className="
                        mb-5
                        rounded-xl
                        border border-[#106A2E]/10
                        bg-[#106A2E]/5
                        px-4
                        py-3
                    ">

                        <p className="text-xs text-gray-600 leading-relaxed">

                            <span className="font-semibold text-[#106A2E]">
                                Note:
                            </span>{" "}

                            Your personal information should be aligned with your registered profile.
                            Please review your profile first if any information is incorrect.

                        </p>

                    </div>


                    {/* ==========================================
                        FORM CARD
                    ========================================== */}

                    <div className="
                        bg-white
                        rounded-3xl
                        shadow-xl
                        shadow-[#106A2E]/10
                        border
                        border-[#106A2E]/[0.06]
                        p-6
                    ">


                        {/* ==========================================
                            PROFILE PHOTO
                        ========================================== */}

                        <div className="flex flex-col items-center mb-6">

                            <label className="cursor-pointer group">

                                <div className="relative w-24 h-24">

                                    <div className="
                                        w-24 h-24
                                        rounded-full
                                        border-2 border-dashed
                                        border-gray-300
                                        group-hover:border-[#106A2E]
                                        bg-gray-50
                                        flex items-center justify-center
                                        overflow-hidden
                                        transition-colors
                                    ">

                                        {previewUrl ? (

                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />

                                        ) : (

                                            <svg
                                                width="28"
                                                height="28"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="text-gray-400"
                                            >

                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />

                                                <circle
                                                    cx="12"
                                                    cy="13"
                                                    r="4"
                                                />

                                            </svg>

                                        )}

                                    </div>


                                    <div className="
                                        absolute
                                        bottom-0
                                        right-0
                                        w-7
                                        h-7
                                        rounded-full
                                        bg-[#106A2E]
                                        flex items-center justify-center
                                        border-2 border-white
                                    ">

                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >

                                            <path d="M12 5v14M5 12h14" />

                                        </svg>

                                    </div>

                                </div>


                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                            </label>


                            <p className="text-xs text-gray-500 mt-2.5">

                                {profilePicture
                                    ? profilePicture.name
                                    : "Upload formal picture"}

                            </p>

                        </div>


                        {/* ==========================================
                            PROFILE INFORMATION
                        ========================================== */}

                        <div className="space-y-3.5">


                            {/* ROLE */}

                            <div>

                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Role
                                </label>

                                <input
                                    type="text"
                                    value={
                                        role === "student"
                                            ? "Student"
                                            : role === "faculty"
                                                ? "Faculty"
                                                : ""
                                    }
                                    readOnly
                                    className="
                                        w-full
                                        p-3
                                        rounded-xl
                                        border border-gray-200
                                        bg-gray-100
                                        text-sm
                                        text-gray-600
                                        outline-none
                                        cursor-not-allowed
                                    "
                                />

                            </div>


                            {/* ID NUMBER */}

                            <div>

                                <label className="block text-xs font-medium text-gray-600 mb-1.5">

                                    {isFaculty
                                        ? "Faculty ID"
                                        : "Student Number"}

                                </label>

                                <input
                                    type="text"
                                    value={idNumber}
                                    readOnly
                                    className="
                                        w-full
                                        p-3
                                        rounded-xl
                                        border border-gray-200
                                        bg-gray-100
                                        text-sm
                                        text-gray-600
                                        outline-none
                                        cursor-not-allowed
                                    "
                                />

                            </div>


                            {/* FULL NAME */}

                            <div>

                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    value={fullName}
                                    readOnly
                                    className="
                                        w-full
                                        p-3
                                        rounded-xl
                                        border border-gray-200
                                        bg-gray-100
                                        text-sm
                                        text-gray-600
                                        outline-none
                                        cursor-not-allowed
                                    "
                                />

                            </div>


                            {/* EMAIL */}

                            <div>

                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    readOnly
                                    className="
                                        w-full
                                        p-3
                                        rounded-xl
                                        border border-gray-200
                                        bg-gray-100
                                        text-sm
                                        text-gray-600
                                        outline-none
                                        cursor-not-allowed
                                    "
                                />

                            </div>


                            {/* INSTITUTE */}

                            <div>

                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Institute
                                </label>

                                <input
                                    type="text"
                                    value={institute}
                                    readOnly
                                    className="
                                        w-full
                                        p-3
                                        rounded-xl
                                        border border-gray-200
                                        bg-gray-100
                                        text-sm
                                        text-gray-600
                                        outline-none
                                        cursor-not-allowed
                                    "
                                />

                            </div>


                            {/* COURSE */}

                            {!isFaculty && (

                                <div>

                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Program
                                    </label>

                                    <input
                                        type="text"
                                        value={course}
                                        readOnly
                                        className="
                                            w-full
                                            p-3
                                            rounded-xl
                                            border border-gray-200
                                            bg-gray-100
                                            text-sm
                                            text-gray-600
                                            outline-none
                                            cursor-not-allowed
                                        "
                                    />

                                </div>

                            )}


                            {/* FACULTY POSITION */}

                            {isFaculty && (

                                <div>

                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Faculty Position
                                    </label>

                                    <input
                                        type="text"
                                        value={position}
                                        readOnly
                                        className="
                                            w-full
                                            p-3
                                            rounded-xl
                                            border border-gray-200
                                            bg-gray-100
                                            text-sm
                                            text-gray-600
                                            outline-none
                                            cursor-not-allowed
                                        "
                                    />

                                </div>

                            )}


                            {/* STUDENT STATUS */}

                            {!isFaculty && (

                                <div>

                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Student Status
                                    </label>

                                    <input
                                        type="text"
                                        value={studentStatus}
                                        readOnly
                                        className="
                                            w-full
                                            p-3
                                            rounded-xl
                                            border border-gray-200
                                            bg-gray-100
                                            text-sm
                                            text-gray-600
                                            outline-none
                                            cursor-not-allowed
                                        "
                                    />

                                </div>

                            )}


                            {/* YEAR LEVEL */}

                            {!isFaculty && (

                                <div>

                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Year Level
                                    </label>

                                    <input
                                        type="text"
                                        value={yearLevel}
                                        readOnly
                                        className="
                                            w-full
                                            p-3
                                            rounded-xl
                                            border border-gray-200
                                            bg-gray-100
                                            text-sm
                                            text-gray-600
                                            outline-none
                                            cursor-not-allowed
                                        "
                                    />

                                </div>

                            )}


                            {/* ==========================================
                                ADDRESS - MANUAL
                            ========================================== */}

                            <div className="pt-2">

                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Address
                                </label>

                                <textarea
                                    rows="3"
                                    value={address}
                                    onChange={(e) =>
                                        setAddress(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Rodriguez, Rizal"
                                    className="
                                        w-full
                                        p-3
                                        rounded-xl
                                        border border-gray-200
                                        bg-gray-50
                                        text-sm
                                        outline-none
                                        focus:border-[#106A2E]
                                        focus:bg-white
                                        transition-colors
                                        resize-none
                                    "
                                />

                            </div>


                        </div>


                        {/* ==========================================
                            SUBMIT BUTTON
                        ========================================== */}

                        <button
                            disabled={
                                !isFormValid ||
                                isSubmitting
                            }
                            onClick={handleSubmit}
                            className={`
                                w-full
                                mt-6
                                p-3
                                rounded-xl
                                font-semibold
                                transition-all
                                ${
                                    isFormValid
                                        ? "bg-[#106A2E] text-white hover:bg-[#0D7856]"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }
                            `}
                        >

                            {isSubmitting
                                ? "Submitting..."
                                : "Submit Request"}

                        </button>


                    </div>

                </div>

            </div>

        </BackgroundLayout>

    );

}