import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";

export default function Profile() {

    const navigate = useNavigate();

    const [student, setStudent] = useState(null);

    const [logoutLoading, setLogoutLoading] = useState(false);

    useEffect(() => {

        const loadProfile = async () => {

            try {

                const email =
                    localStorage.getItem("userEmail");

                const response =
                    await fetch(
                        `${API_URL}/api/profile/${email}`
                    );

                if (!response.ok) {

                    throw new Error(
                        "Failed to load profile"
                    );

                }

                const data =
                    await response.json();

                setStudent(data);

            }
            catch (error) {

                console.error(error);

            }

        };

        loadProfile();

    }, []);

    const handleLogout = () => {

    setLogoutLoading(true);

    toast.success(
        "Logged out successfully"
    );

    setTimeout(() => {

        localStorage.clear();

        navigate("/", {
            replace: true
        });

    }, 1000);

};

if (!student) {

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">
                Loading Profile...
            </p>
        </div>
    );

}

    return (

        <div
            className="min-h-screen p-4 pb-24 relative overflow-hidden"
        >

            {/* decorative blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#106A2E]/[0.06]" />
            <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-[#F4D35E]/[0.15]" />

            <div className="max-w-md mx-auto relative z-10">

                <h1 className="text-lg font-semibold text-[#1F1F1F] pt-4 mb-4">
                    My Profile
                </h1>

                {/* PROFILE CARD */}

                <div className="bg-white rounded-3xl shadow-xl shadow-[#106A2E]/10 border border-[#106A2E]/[0.06] overflow-hidden">

                    <div className="h-20 bg-gradient-to-r from-[#106A2E] to-[#0D7856]" />

                    <div className="flex flex-col items-center -mt-12 px-6 pb-6">

                        <img
                            src={
                                student.profilePicture
                                    ? `${API_URL}${student.profilePicture}`
                                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                            }
                            alt={student.fullName}
                            className="
                                w-24
                                h-24
                                rounded-full
                                object-cover
                                border-4
                                border-white
                                shadow-md
                            "
                        />

                        <h2 className="text-xl font-semibold text-[#1F1F1F] mt-3">
                            {student.fullName}
                        </h2>

                        <p className="text-sm text-gray-500 mt-0.5">
                            {student.studentNumber}
                        </p>

                        <span className="inline-flex items-center gap-1.5 bg-[#106A2E]/10 text-[#106A2E] text-xs font-medium px-3 py-1 rounded-full mt-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#106A2E]" />
                            Active Student
                        </span>

                    </div>

                </div>

                {/* DETAILS */}

                <div className="bg-white rounded-3xl shadow-xl shadow-[#106A2E]/10 border border-[#106A2E]/[0.06] p-6 mt-4">

                    <h3 className="text-sm font-semibold text-[#1F1F1F] mb-4">
                        Student Information
                    </h3>

                    <div className="space-y-4">

                        {/* Email */}

                        <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-lg bg-[#106A2E]/10 flex items-center justify-center flex-shrink-0">

                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#106A2E" strokeWidth="2">

                                    <rect x="2" y="4" width="20" height="16" rx="2" />

                                    <path d="m22 7-10 6L2 7" />

                                </svg>

                            </div>

                            <div>

                                <p className="text-xs text-gray-500">
                                    Email
                                </p>

                                <p className="text-sm font-medium text-[#1F1F1F]">
                                    {student.email}
                                </p>

                            </div>

                        </div>

                        {/* Course */}

                        <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-lg bg-[#106A2E]/10 flex items-center justify-center flex-shrink-0">

                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#106A2E" strokeWidth="2">

                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />

                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />

                                </svg>

                            </div>

                            <div>

                                <p className="text-xs text-gray-500">
                                    Course
                                </p>

                                <p className="text-sm font-medium text-[#1F1F1F]">
                                    {student.course || "Not Set"}
                                </p>

                            </div>

                        </div>

                        {/* Year Level */}

                        <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-lg bg-[#106A2E]/10 flex items-center justify-center flex-shrink-0">

                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#106A2E" strokeWidth="2">

                                    <rect x="3" y="4" width="18" height="18" rx="2" />

                                    <path d="M16 2v4M8 2v4M3 10h18" />

                                </svg>

                            </div>

                            <div>

                                <p className="text-xs text-gray-500">
                                    Year Level
                                </p>

                                <p className="text-sm font-medium text-[#1F1F1F]">
                                    {student.yearLevel || "Not Set"}
                                </p>

                            </div>

                        </div>

                        {/* Contact Number */}

                        <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-lg bg-[#106A2E]/10 flex items-center justify-center flex-shrink-0">

                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#106A2E" strokeWidth="2">

                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72" />

                                </svg>

                            </div>

                            <div>

                                <p className="text-xs text-gray-500">
                                    Contact Number
                                </p>

                                <p className="text-sm font-medium text-[#1F1F1F]">
                                    {student.contactNumber || "Not Set"}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

                <button
                    onClick={() => navigate("/edit-profile")}
                    className="
                        w-full
                        mt-4
                        bg-[#106A2E]
                        hover:bg-[#0D7856]
                        text-white
                        p-3
                        rounded-xl
                        font-semibold
                        transition-all
                    "
                >
                    Edit Profile
                </button>

                {/* LOGOUT */}

                <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="
                        w-full
                        mt-4
                        bg-white
                        hover:bg-red-50
                        text-red-600
                        border border-red-200
                        p-3
                        rounded-xl
                        font-semibold
                        transition-all
                        disabled:opacity-70
                    "
                >
                    {
                        logoutLoading
                        ? "Logging Out..."
                        : "Logout"
                    }
                </button>

            </div>

        </div>

    );
}