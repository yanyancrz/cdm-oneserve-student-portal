import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import BackgroundLayout from "../../layouts/BackgroundLayout";

export default function SetupProfile() {

    const navigate = useNavigate();

    const [contactNumber, setContactNumber] = useState("");
    const [role, setRole] = useState("");
    const [course, setCourse] = useState("");
    const [institute, setInstitute] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [profilePicture, setProfilePicture] = useState(null);

    const handleSaveProfile = async () => {
       
    const userId =
        localStorage.getItem("userId");


         console.log({
        userId,
        contactNumber,
        role,
        course,
        institute,
        yearLevel
    });

    try {

        let imageUrl = "";

        // Upload photo first
        if (profilePicture) {

            const formData =
                new FormData();

            formData.append(
                "file",
                profilePicture
            );

            formData.append(
                "userId",
                userId
            );

            const uploadResponse =
                await fetch(
                    `${API_URL}/api/profile/upload-photo`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

            if (!uploadResponse.ok) {

                toast.error("Photo upload failed");

                return;
            }

            const uploadData =
                await uploadResponse.json();

            imageUrl =
                uploadData.imageUrl;

            localStorage.setItem(
                "profilePicture",
                imageUrl
            );
        }

        // Save profile information
        const response = await fetch(
            `${API_URL}/api/profile/setup`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId,
                    contactNumber,
                    role,
                    course,
                    institute,
                    yearLevel
                })
            }
        );

        const data =
            await response.text();

        toast(data);

        if (response.ok) {

            localStorage.setItem(
                "role",
                role
            );

            localStorage.setItem(
                "course",
                course
            );

            localStorage.setItem(
                "institute",
                institute
            );

            localStorage.setItem(
                "yearLevel",
                yearLevel
            );

            localStorage.setItem(
                "contactNumber",
                contactNumber
            );

            navigate("/dashboard");

        }

    }
    catch (error) {

        console.error(error);

        toast.error("Unable to save profile.");

    }

};

    return (

        <BackgroundLayout>

            <div
                className="min-h-screen flex items-center justify-center p-6"          
            >

            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl shadow-[#106A2E]/10">

                <div className="text-center mb-6">

                    <div className="w-16 h-16 rounded-2xl bg-[#106A2E] mx-auto flex items-center justify-center mb-4">

                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                        </svg>

                    </div>

                    <h1 className="text-xl font-semibold text-[#1F1F1F]">
                        Setup Profile
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Complete your profile before continuing
                    </p>

                </div>

                <div className="flex flex-col items-center mb-6">

                    <label className="cursor-pointer">

                        <img
                            src={
                                profilePicture
                                    ? URL.createObjectURL(profilePicture)
                                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                            }
                            alt="Profile"
                            className="
                                w-28
                                h-28
                                rounded-full
                                object-cover
                                border-4
                                border-[#106A2E]/20
                            "
                        />

                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) =>
                                setProfilePicture(
                                    e.target.files[0]
                                )
                            }
                        />

                    </label>

                    <p className="text-xs text-gray-500 mt-2">
                        Tap to upload photo
                    </p>

                </div>

                <div className="space-y-4">

                    <div>

                        <label className="text-sm text-gray-600">
                            Contact Number
                        </label>

                        <input
                            type="text"
                            placeholder="09XXXXXXXXX"
                            value={contactNumber}
                            onChange={(e) =>
                                setContactNumber(
                                    e.target.value
                                )
                            }
                            className="
                                w-full
                                mt-1
                                p-3
                                rounded-xl
                                border
                                border-gray-200
                                bg-gray-50
                                focus:border-[#106A2E]
                                outline-none
                            "
                        />

                    </div>

                    <div>

                        <label className="text-sm text-gray-600">
                            I am a
                        </label>

                        <select
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value);
                                setCourse("");
                                setInstitute("");
                            }}
                            className="
                                w-full
                                mt-1
                                p-3
                                rounded-xl
                                border
                                border-gray-200
                                bg-gray-50
                                focus:border-[#106A2E]
                                outline-none
                            "
                        >

                            <option value="">
                                Select Role
                            </option>

                            <option value="Student">Student</option>

                            <option value="Faculty">
                                Faculty
                            </option>

                        </select>

                    </div>

                    {role === "Student" && (

                        <div>

                            <label className="text-sm text-gray-600">
                                Program
                            </label>

                            <select
                                value={course}
                                onChange={(e) =>
                                    setCourse(
                                        e.target.value
                                    )
                                }
                                className="
                                    w-full
                                    mt-1
                                    p-3
                                    rounded-xl
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    focus:border-[#106A2E]
                                    outline-none
                                "
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

                        </div>

                    )}

                    {role === "Faculty" && (

                        <div>

                            <label className="text-sm text-gray-600">
                                Institute
                            </label>

                            <select
                                value={institute}
                                onChange={(e) =>
                                    setInstitute(
                                        e.target.value
                                    )
                                }
                                className="
                                    w-full
                                    mt-1
                                    p-3
                                    rounded-xl
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    focus:border-[#106A2E]
                                    outline-none
                                "
                            >

                                <option value="">
                                    Select Institute
                                </option>

                                <option>
                                    Institute of Business and Entrepreneurship
                                </option>

                                <option>
                                    Institute of Teacher Education
                                </option>

                                <option>
                                    Institute of Computing Studies
                                </option>

                            </select>

                        </div>

                    )}

                    {role === "Student" && (

                        <div>

                            <label className="text-sm text-gray-600">
                                Year Level
                            </label>

                            <select
                                value={yearLevel}
                                onChange={(e) =>
                                    setYearLevel(
                                        e.target.value
                                    )
                                }
                                className="
                                    w-full
                                    mt-1
                                    p-3
                                    rounded-xl
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    focus:border-[#106A2E]
                                    outline-none
                                "
                            >

                                <option value="">
                                    Select Year Level
                                </option>

                                <option>
                                    1st Year
                                </option>

                                <option>
                                    2nd Year
                                </option>

                                <option>
                                    3rd Year
                                </option>

                                <option>
                                    4th Year
                                </option>

                            </select>

                        </div>

                    )}

                </div>

                <button
                    onClick={handleSaveProfile}
                    className="
                        w-full
                        mt-6
                        bg-[#106A2E]
                        hover:bg-[#0D7856]
                        text-white
                        p-3
                        rounded-xl
                        font-semibold
                        transition-all
                    "
                >
                    Save Profile
                </button>

            </div>

        </div>

        </BackgroundLayout>

    );
}