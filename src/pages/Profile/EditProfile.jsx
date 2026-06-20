import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";

export default function EditProfile() {

    const navigate = useNavigate();

    const [student, setStudent] = useState(null);

    const [email, setEmail] = useState("");
    const [contactNumber, setContactNumber] = useState("");

    const [profilePicture, setProfilePicture] =
        useState(null);

    useEffect(() => {

        const loadProfile = async () => {

            try {

                const userEmail =
                    localStorage.getItem(
                        "userEmail"
                    );

                const response =
                    await fetch(
                        `${API_URL}/api/profile/${userEmail}`
                    );

                const data =
                    await response.json();

                setStudent(data);

                setEmail(data.email || "");

                setContactNumber(
                    data.contactNumber || ""
                );

            }
            catch (error) {

                console.error(error);

            }

        };

        loadProfile();

    }, []);

    const handleUpdate = async () => {

    try {

        // Upload profile picture

        if (profilePicture) {

            const formData = new FormData();

            formData.append(
                "file",
                profilePicture
            );

            formData.append(
                "userId",
                student.id
            );

            await fetch(
                `${API_URL}/api/profile/upload-photo`,
                {
                    method: "POST",
                    body: formData
                }
            );

        }

        // Update contact number only

        await fetch(
            `${API_URL}/api/profile/update`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    userId: student.id,
                    email: student.email,
                    contactNumber
                })
            }
        );

        // If email changed, send OTP

        if (email !== student.email) {

            const response = await fetch(
                `${API_URL}/api/profile/request-email-change`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        userId: student.id,
                        newEmail: email
                    })
                }
            );

            const data =
                await response.text();

            toast(data);

            if (response.ok) {

                localStorage.setItem(
                    "emailChangeUserId",
                    student.id
                );

                localStorage.setItem(
                    "newEmail",
                    email
                );

                navigate(
                    "/verify-email-change"
                );

                return;

            }

        }

        toast.success("Profile Updated Successfully");

        navigate("/profile");

    }
    catch (error) {

        console.error(error);

        toast.error("Unable to update profile.");

    }

};

if (!student) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            Loading...
        </div>
    );
}

    return (

        <div
            className="min-h-screen p-6"
            style={{
                background: "#F1F1F1"
            }}
        >

            <div className="max-w-md mx-auto">

                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-[#106A2E]/10">

                    <div className="flex items-center justify-between mb-6">

                        <h1 className="text-xl font-semibold text-[#1F1F1F]">
                            Edit Profile
                        </h1>

                        <button
                            onClick={() => navigate("/profile")}
                            aria-label="Cancel"
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

                    {/* PROFILE PICTURE */}

                    <div className="flex flex-col items-center mb-6">

                        <label className="cursor-pointer">

                            <img
                                src={
                                    profilePicture
                                        ? URL.createObjectURL(
                                            profilePicture
                                        )
                                        : (
                                            student.profilePicture
                                                ? `${API_URL}${student.profilePicture}`
                                                : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                        )
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
                            Change Profile Picture
                        </p>

                    </div>

                    {/* STUDENT NUMBER */}

                    <div className="mb-4">

                        <label className="text-sm text-gray-500">
                            Student Number
                        </label>

                        <input
                            value={
                                student.studentNumber
                            }
                            disabled
                            className="
                                w-full
                                mt-1
                                p-3
                                rounded-xl
                                bg-gray-100
                                border
                            "
                        />

                    </div>

                    {/* FULL NAME */}

                    <div className="mb-4">

                        <label className="text-sm text-gray-500">
                            Full Name
                        </label>

                        <input
                            value={
                                student.fullName
                            }
                            disabled
                            className="
                                w-full
                                mt-1
                                p-3
                                rounded-xl
                                bg-gray-100
                                border
                            "
                        />

                    </div>

                    {/* EMAIL */}

                    <div className="mb-4">

                        <label className="text-sm text-gray-500">
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                            className="
                                w-full
                                mt-1
                                p-3
                                rounded-xl
                                border
                            "
                        />

                    </div>

                    {/* CONTACT NUMBER */}

                    <div className="mb-4">

                        <label className="text-sm text-gray-500">
                            Contact Number
                        </label>

                        <input
                            type="text"
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
                            "
                        />

                    </div>

                    {/* COURSE */}

                    <div className="mb-4">

                        <label className="text-sm text-gray-500">
                            Course
                        </label>

                        <input
                            value={
                                student.course || ""
                            }
                            disabled
                            className="
                                w-full
                                mt-1
                                p-3
                                rounded-xl
                                bg-gray-100
                                border
                            "
                        />

                    </div>

                    {/* YEAR LEVEL */}

                    <div className="mb-6">

                        <label className="text-sm text-gray-500">
                            Year Level
                        </label>

                        <input
                            value={
                                student.yearLevel || ""
                            }
                            disabled
                            className="
                                w-full
                                mt-1
                                p-3
                                rounded-xl
                                bg-gray-100
                                border
                            "
                        />

                    </div>

                    {/* ACTION BUTTONS */}

                    <button
                        onClick={handleUpdate}
                        className="
                            w-full
                            bg-[#106A2E]
                            hover:bg-[#0D7856]
                            active:scale-[0.98]
                            text-white
                            p-3
                            rounded-xl
                            font-semibold
                            transition-all
                        "
                    >
                        Save Changes
                    </button>

                </div>

            </div>

        </div>

    );
}
