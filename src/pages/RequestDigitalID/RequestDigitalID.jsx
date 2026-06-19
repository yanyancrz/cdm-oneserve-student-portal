import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RequestDigitalID() {

    const navigate = useNavigate();

    const [studentNumber, setStudentNumber] = useState("");
    const [fullName, setFullName] = useState("");
    const [course, setCourse] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleFileChange = (e) => {

        const file = e.target.files[0];

        setProfilePicture(file);

        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }

    };

    const handleSubmit = () => {

        console.log({
            studentNumber,
            fullName,
            course,
            yearLevel,
            profilePicture
        });

        alert("Digital ID Request Submitted!");

    };

    return (
        <div
            className="min-h-screen p-4 pb-10 relative overflow-hidden"
            style={{ background: "#F1F1F1" }}
        >

            {/* decorative blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#106A2E]/[0.06]" />
            <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-[#F4D35E]/[0.15]" />

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

                    {/* STUDENT NUMBER */}

                    <div className="mb-3.5">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Student Number
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
                                value={studentNumber}
                                onChange={(e) => setStudentNumber(e.target.value)}
                            />
                        </div>
                    </div>

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

                    {/* COURSE */}

                    <div className="mb-3.5">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Course
                        </label>
                        <div className="relative flex items-center">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-gray-400">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                            <input
                                type="text"
                                placeholder="BS Computer Science"
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
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* YEAR LEVEL */}

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

                    {/* SUBMIT BUTTON */}

                    <button
                        onClick={handleSubmit}
                        className="
                            w-full
                            bg-[#106A2E]
                            hover:bg-[#0D7856]
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
                        "
                    >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2 11 13" />
                            <path d="M22 2 15 22l-4-9-9-4z" />
                        </svg>
                        Submit Request
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-4">
                        You'll be notified once your Digital ID is ready
                    </p>

                </div>

            </div>

        </div>
    );
}
