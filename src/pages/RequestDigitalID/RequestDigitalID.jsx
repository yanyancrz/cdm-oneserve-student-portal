import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BackgroundLayout from "../../layouts/BackgroundLayout";
import { API_URL } from "../../config/api";
import LoadingModal from "../../components/LoadingModal/LoadingModal";



export default function RequestDigitalID() {

    const navigate = useNavigate();

    const [idNumber, setIdNumber] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("");
    const [course, setCourse] = useState("");
    const [institute, setInstitute] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [position, setPosition] = useState("");
    const [address, setAddress] = useState("");
    const [studentStatus, setStudentStatus] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isFaculty = role === "faculty";

    const handleFileChange = (e) => {

        const file = e.target.files[0];

        setProfilePicture(file);

        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }

    };

    const isFormValid =
    role === "student"
        ? (
            profilePicture &&
            idNumber &&
            fullName &&
            institute &&
            course &&
            yearLevel &&
            studentStatus &&
            address
        )
        : (
            profilePicture &&
            fullName &&
            institute &&
            position &&
            address
        );

   const handleSubmit = async () => {

    try {

        setIsSubmitting(true);

        const userId =
            localStorage.getItem("userId");

       
        const formData = new FormData();

            formData.append("userId", userId);
            formData.append("role", role);
            formData.append("idNumber", idNumber);
            formData.append("fullName", fullName);
            formData.append("institute", institute);
            formData.append("course", course);
            formData.append("yearLevel", yearLevel);
            formData.append("studentStatus", studentStatus);
            formData.append("position", position);
            formData.append("address", address);

            if (profilePicture) {
                formData.append(
                    "profilePicture",
                    profilePicture
                );
            }

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

        console.error(error);

        toast.error(
            "Unable to connect to server."
        );

    }

    finally {

        setIsSubmitting(false);

    }

};

    return (
        <BackgroundLayout>

            {isSubmitting && (
                <LoadingModal
                    message="Submitting Digital ID Request..."
                />
            )}

            <div
                className="min-h-screen p-4 pb-10 relative overflow-hidden"                
            >

            <div className="max-w-md mx-auto relative z-10">

                {/* HEADER */}

                <div className="flex items-center justify-between gap-3 mb-6 pt-4">

                    <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-xl bg-[#106A2E] flex items-center justify-center flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="16" rx="2" />
                                <circle cx="9" cy="10" r="2" />
                                <path d="M15 8h2M15 12h2M7 16h10" />
                            </svg>
                        </div>

                        <div>
                            <h1 className="text-lg font-semibold text-[#1F1F1F]">
                                Request Digital ID
                            </h1>
                            <p className="text-xs text-gray-500">
                                Fill in your details to get started
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>

                </div>

                {/* FORM CARD */}

                <div className="bg-white rounded-3xl shadow-xl shadow-[#106A2E]/10 border border-[#106A2E]/[0.06] p-6">

                    {/* PROFILE PHOTO UPLOAD */}

                    <div className="flex flex-col items-center mb-6">

                        <label className="cursor-pointer group">

                            <div className="relative w-24 h-24">

                                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 group-hover:border-[#106A2E] bg-gray-50 flex items-center justify-center overflow-hidden transition-colors">

                                    {
                                        previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                                <circle cx="12" cy="13" r="4" />
                                            </svg>
                                        )
                                    }

                                </div>

                                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#106A2E] flex items-center justify-center border-2 border-white">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                            {profilePicture ? profilePicture.name : "Upload profile photo"}
                        </p>

                    </div>

                    {/* ROLE */}

                    <div className="mb-3.5">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            I am a
                        </label>
                        <div className="relative flex items-center">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-gray-400 pointer-events-none">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                            </svg>
                            <select
                                className="
                                    w-full
                                    pl-10 pr-9 py-3
                                    rounded-xl
                                    border border-gray-200
                                    bg-gray-50
                                    text-sm
                                    outline-none
                                    focus:border-[#106A2E]
                                    focus:bg-white
                                    transition-colors
                                    appearance-none
                                    text-[#1F1F1F]
                                "
                                value={role}
                                onChange={(e) => {
                                    setRole(e.target.value);
                                    setCourse("");
                                    setInstitute("");
                                    setYearLevel("");
                                    setIdNumber("");
                                }}
                            >
                                <option value="">Select Role</option>
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                            </select>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3.5 text-gray-400 pointer-events-none">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </div>
                    </div>

                    {/* STUDENT NUMBER (students only) */}

                    {!isFaculty && (

                        <div className="mb-3.5">
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                ID Number
                            </label>
                            <div className="relative flex items-center">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-gray-400">
                                    <rect x="3" y="4" width="18" height="16" rx="2" />
                                    <path d="M7 8h10M7 12h10M7 16h6" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="2024-00123"
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
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value)}
                                />
                            </div>
                        </div>

                    )}

                    {isFaculty && (
                        <div className="mb-3.5">
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                ID Number
                            </label>

                            <input
                                type="text"
                                placeholder="FAC-2026-001"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50"
                            />
                        </div>
                    )}

                    {/* FULL NAME */}

                    <div className="mb-3.5">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Full Name
                        </label>
                        <div className="relative flex items-center">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-gray-400">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Juan Dela Cruz"
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
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* COURSE (students only) */}

                    {!isFaculty && (

                        <div className="mb-3.5">
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                Program
                            </label>
                            <div className="relative flex items-center">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-gray-400 pointer-events-none">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                </svg>
                                <select
                                    className="
                                        w-full
                                        pl-10 pr-9 py-3
                                        rounded-xl
                                        border border-gray-200
                                        bg-gray-50
                                        text-sm
                                        outline-none
                                        focus:border-[#106A2E]
                                        focus:bg-white
                                        transition-colors
                                        appearance-none
                                        text-[#1F1F1F]
                                    "
                                    value={course}
                                    onChange={(e) => setCourse(e.target.value)}
                                >
                                    <option value="">Select Program</option>
                                    <option>Bachelor of Science in Business Administration Major in Human Resource Management</option>
                                    <option>Bachelor of Science in Entrepreneurship</option>
                                    <option>Bachelor of Science in Computer Engineering</option>
                                    <option>Bachelor of Science in Information Technology</option>
                                    <option>Bachelor of Early Childhood Education</option>
                                    <option>Bachelor of Technology and Livelihood Education Major in Information and Communication Technology</option>
                                    <option>Bachelor of Science in Secondary Education Major in Science</option>
                                    <option>Bachelor of Elementary Education Major in General Education</option>
                                    <option>Teacher Certificate Program</option>
                                </select>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3.5 text-gray-400 pointer-events-none">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </div>
                        </div>

                    )}

                    {/* INSTITUTE (faculty only) */}

                        <div className="mb-3.5">
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                Institute
                            </label>
                            <div className="relative flex items-center">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-gray-400 pointer-events-none">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                </svg>
                                <select
                                    className="
                                        w-full
                                        pl-10 pr-9 py-3
                                        rounded-xl
                                        border border-gray-200
                                        bg-gray-50
                                        text-sm
                                        outline-none
                                        focus:border-[#106A2E]
                                        focus:bg-white
                                        transition-colors
                                        appearance-none
                                        text-[#1F1F1F]
                                    "
                                    value={institute}
                                    onChange={(e) => setInstitute(e.target.value)}
                                >
                                    <option value="">Select Institute</option>
                                    <option>Institute of Business and Entrepreneurship</option>
                                    <option>Institute of Teacher Education</option>
                                    <option>Institute of Computing Studies</option>
                                </select>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3.5 text-gray-400 pointer-events-none">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </div>
                        </div>


                    {isFaculty && (
                        <div className="mb-3.5">
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                Position
                            </label>

                            <select
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50"
                            >
                                <option value="">Select Position</option>
                                <option>Instructor I</option>
                                <option>Instructor II</option>
                                <option>Assistant Professor</option>
                                <option>Associate Professor</option>
                                <option>Professor</option>
                            </select>
                        </div>
                    )}

                    {!isFaculty && (

                        <div className="mb-3.5">
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                Student Status
                            </label>

                            <select
                                value={studentStatus}
                                onChange={(e) => setStudentStatus(e.target.value)}
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
                                "
                            >
                                <option value="">
                                    Select Status
                                </option>

                                <option value="Regular">
                                    Regular
                                </option>

                                <option value="Irregular">
                                    Irregular
                                </option>

                            </select>
                        </div>

                    )}

                    {/* YEAR LEVEL (students only) */}

                    {!isFaculty && (

                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                Year Level
                            </label>
                            <div className="relative flex items-center">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-gray-400 pointer-events-none">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                                <select
                                    className="
                                        w-full
                                        pl-10 pr-9 py-3
                                        rounded-xl
                                        border border-gray-200
                                        bg-gray-50
                                        text-sm
                                        outline-none
                                        focus:border-[#106A2E]
                                        focus:bg-white
                                        transition-colors
                                        appearance-none
                                        text-[#1F1F1F]
                                    "
                                    value={yearLevel}
                                    onChange={(e) => setYearLevel(e.target.value)}
                                >
                                    <option value="">Select year level</option>
                                    <option>1st Year</option>
                                    <option>2nd Year</option>
                                    <option>3rd Year</option>
                                    <option>4th Year</option>
                                </select>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3.5 text-gray-400 pointer-events-none">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </div>
                        </div>

                    )}

                    <div className="mb-3.5">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Address
                        </label>

                        <textarea
                            rows="3"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Rodriguez, Rizal"
                            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50"
                        />
                    </div>

                    {/* SUBMIT BUTTON */}

                    <button
                        disabled={!isFormValid || isSubmitting}
                        onClick={handleSubmit}
                        className={`
                            w-full p-3 rounded-xl font-semibold
                            ${isFormValid
                                ? "bg-[#106A2E] text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"}
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