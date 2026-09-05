import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import BackgroundLayout from "../../layouts/BackgroundLayout";

export default function EditProfile() {

    const navigate = useNavigate();

    const [student, setStudent] = useState(null);

    const [email, setEmail] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [institute, setInstitute] = useState("");

    // Student / Faculty specific fields
    const [studentStatus, setStudentStatus] = useState("");
    const [position, setPosition] = useState("");

    const [profilePicture, setProfilePicture] = useState(null);


    // ==========================================
    // LOAD PROFILE
    // ==========================================

    useEffect(() => {

        const loadProfile = async () => {

            try {

                const userEmail =
                    localStorage.getItem("userEmail");

                if (!userEmail) {
                    toast.error("User email not found.");
                    navigate("/login");
                    return;
                }

                const response = await fetch(
                    `${API_URL}/api/profile/${encodeURIComponent(userEmail)}`
                );

                if (!response.ok) {
                    throw new Error("Failed to load profile.");
                }

                const data = await response.json();

                setStudent(data);

                setEmail(data.email || "");

                setContactNumber(
                    data.contactNumber || ""
                );

                setInstitute(
                    data.institute || ""
                );

                setStudentStatus(
                    data.studentStatus || ""
                );

                setPosition(
                    data.position || ""
                );

            }
            catch (error) {

                console.error(error);

                toast.error(
                    "Unable to load profile."
                );

            }

        };

        loadProfile();

    }, [navigate]);


    // ==========================================
    // ROLE CHECK
    // ==========================================

    const isFaculty =
        student?.role?.toLowerCase() === "faculty";


    // ==========================================
    // UPDATE PROFILE
    // ==========================================

    const handleUpdate = async () => {

        try {

            // ==========================================
            // UPLOAD PROFILE PICTURE
            // ==========================================

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

                const photoResponse = await fetch(
                    `${API_URL}/api/profile/upload-photo`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

                if (!photoResponse.ok) {
                    throw new Error(
                        "Failed to upload profile picture."
                    );
                }

            }


            // ==========================================
            // UPDATE PROFILE INFORMATION
            // ==========================================

            const updateResponse = await fetch(
                `${API_URL}/api/profile/update`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        userId: student.id,
                        email: student.email,
                        contactNumber,

                        ...(isFaculty && {
                            institute,
                            position
                        }),

                        ...(!isFaculty && {
                            studentStatus
                        })
                    })
                }
            );


            if (!updateResponse.ok) {

                const errorText =
                    await updateResponse.text();

                throw new Error(
                    errorText ||
                    "Failed to update profile."
                );

            }


            // ==========================================
            // EMAIL CHANGE
            // ==========================================

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


                if (!response.ok) {

                    toast.error(
                        data ||
                        "Unable to request email change."
                    );

                    return;

                }


                localStorage.setItem(
                    "emailChangeUserId",
                    student.id
                );

                localStorage.setItem(
                    "newEmail",
                    email
                );


                toast.success(
                    "OTP sent to your new email."
                );


                navigate(
                    "/verify-email-change"
                );

                return;

            }


            // ==========================================
            // SUCCESS
            // ==========================================

            toast.success(
                "Profile Updated Successfully"
            );

            navigate("/profile");

        }
        catch (error) {

            console.error(error);

            toast.error(
                error.message ||
                "Unable to update profile."
            );

        }

    };


    // ==========================================
    // LOADING
    // ==========================================

    if (!student) {

        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );

    }


    // ==========================================
    // UI
    // ==========================================

    return (

        <BackgroundLayout>

            <div className="min-h-screen p-6">

                <div className="max-w-md mx-auto">

                    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-[#106A2E]/10">


                        {/* ==========================================
                            HEADER
                        ========================================== */}

                        <div className="flex items-center justify-between mb-6">

                            <h1 className="text-xl font-semibold text-[#1F1F1F]">
                                Edit Profile
                            </h1>


                            <button
                                onClick={() =>
                                    navigate("/profile")
                                }
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
                            PROFILE PICTURE
                        ========================================== */}

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
                                    onChange={(e) => {

                                        const file =
                                            e.target.files?.[0];

                                        if (file) {
                                            setProfilePicture(file);
                                        }

                                    }}
                                />

                            </label>


                            <p className="text-xs text-gray-500 mt-2">
                                Change Profile Picture
                            </p>

                        </div>


                        {/* ==========================================
                            STUDENT NUMBER / FACULTY ID
                        ========================================== */}

                        <div className="mb-4">

                            <label className="text-sm text-gray-500">

                                {isFaculty
                                    ? "Faculty ID"
                                    : "Student Number"}

                            </label>


                            <input
                                value={
                                    student.idNumber || ""
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


                        {/* ==========================================
                            FULL NAME
                        ========================================== */}

                        <div className="mb-4">

                            <label className="text-sm text-gray-500">
                                Full Name
                            </label>


                            <input
                                value={
                                    student.fullName || ""
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


                        {/* ==========================================
                            EMAIL
                        ========================================== */}

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


                        {/* ==========================================
                            CONTACT NUMBER
                        ========================================== */}

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


                        {/* =================================================
                            FACULTY ONLY
                            Institute + Faculty Position
                        ================================================= */}

                        {isFaculty && (

                            <>

                                {/* INSTITUTE */}

                                <div className="mb-4">

                                    <label className="text-sm text-gray-500">
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
                                            bg-white
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


                                {/* FACULTY POSITION */}

                                <div className="mb-6">

                                    <label className="text-sm text-gray-500">
                                        Faculty Position
                                    </label>


                                    <input
                                        type="text"
                                        placeholder="Enter Faculty Position"
                                        value={position}
                                        onChange={(e) =>
                                            setPosition(
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

                            </>

                        )}


                        {/* =================================================
                            STUDENT ONLY
                            Student Status + Course + Year Level
                        ================================================= */}

                        {!isFaculty && (

                            <>

                                {/* STUDENT STATUS */}

                                <div className="mb-4">

                                    <label className="text-sm text-gray-500">
                                        Student Status
                                    </label>


                                    <select
                                        value={studentStatus}
                                        onChange={(e) =>
                                            setStudentStatus(
                                                e.target.value
                                            )
                                        }
                                        className="
                                            w-full
                                            mt-1
                                            p-3
                                            rounded-xl
                                            border
                                            bg-white
                                        "
                                    >

                                        <option value="">
                                            Select Student Status
                                        </option>

                                        <option value="Regular">
                                            Regular
                                        </option>

                                        <option value="Irregular">
                                            Irregular
                                        </option>

                                    </select>

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

                            </>

                        )}


                        {/* ==========================================
                            SAVE BUTTON
                        ========================================== */}

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

        </BackgroundLayout>

    );

}