import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import BackgroundLayout from "../../layouts/BackgroundLayout";
import BottomNavSpacer from "../../components/Layout/BottomNavSpacer";

const authHeaders = () => {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

    return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function SetupProfile() {
    const navigate = useNavigate();

    // =========================================================
    // ID NUMBER (from Registration - read-only here)
    // Set at login from the authenticated user record, which
    // carries the ID submitted during Registration.
    // =========================================================
    const registeredIdNumber =
        localStorage.getItem("idNumber") ||
        localStorage.getItem("otpIdNumber") ||
        "";

    // =========================================================
    // ROLE
    // Pre-selected from Registration/Login, but the user
    // confirms it here via "I am a Student or Faculty".
    // =========================================================
    const storedRole =
        localStorage.getItem("role") ||
        localStorage.getItem("userRole") ||
        "";

    const [role, setRole] = useState(storedRole || "");

    // =========================================================
    // NAME FIELDS (completed here, not in Registration)
    // =========================================================
    const [firstName, setFirstName] = useState(
        localStorage.getItem("firstName") || ""
    );
    const [middleName, setMiddleName] = useState(
        localStorage.getItem("middleName") || ""
    );
    const [lastName, setLastName] = useState(
        localStorage.getItem("lastName") || ""
    );

    const [contactNumber, setContactNumber] = useState("");
    const [course, setCourse] = useState("");
    const [institute, setInstitute] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [studentStatus, setStudentStatus] = useState("");
    const [position, setPosition] = useState("");
    const [profilePicture, setProfilePicture] = useState(null);

    const [saving, setSaving] = useState(false);

    // Dynamic ID label that follows the selected role.
    const idLabel =
        role === "Student"
            ? "Student ID Number"
            : role === "Faculty"
              ? "Faculty ID Number"
              : "ID Number";

    // =========================================================
    // SAVE PROFILE
    // =========================================================

    const handleSaveProfile = async () => {
        const userId = localStorage.getItem("userId");

        if (!userId) {
            toast.error(
                "User session not found. Please login again."
            );

            navigate("/");
            return;
        }

        // -----------------------------------------------------
        // BASIC VALIDATION
        // -----------------------------------------------------

        if (!role) {
            toast.error(
                "Please select whether you are a Student or Faculty."
            );
            return;
        }

        if (!firstName.trim()) {
            toast.error(
                "Please enter your first name."
            );
            return;
        }

        if (!lastName.trim()) {
            toast.error(
                "Please enter your last name."
            );
            return;
        }

        if (!contactNumber.trim()) {
            toast.error(
                "Please enter your contact number."
            );
            return;
        }

        // -----------------------------------------------------
        // STUDENT VALIDATION
        // -----------------------------------------------------

        if (role === "Student") {
            if (!course) {
                toast.error(
                    "Please select your program."
                );
                return;
            }

            if (!yearLevel) {
                toast.error(
                    "Please select your year level."
                );
                return;
            }

            if (!studentStatus) {
                toast.error(
                    "Please select your student status."
                );
                return;
            }
        }

        // -----------------------------------------------------
        // FACULTY VALIDATION
        // -----------------------------------------------------

        if (role === "Faculty") {
            if (!institute) {
                toast.error(
                    "Please select your institute."
                );
                return;
            }

            if (!position.trim()) {
                toast.error(
                    "Please enter your faculty position."
                );
                return;
            }
        }

        setSaving(true);

        try {
            let imageUrl = "";

            // =================================================
            // UPLOAD PROFILE PHOTO
            // =================================================

            if (profilePicture) {
                const formData = new FormData();

                formData.append(
                    "file",
                    profilePicture
                );

                formData.append(
                    "userId",
                    userId
                );

                const uploadResponse = await fetch(
                    `${API_URL}/api/profile/upload-photo`,
                    {
                        method: "POST",
                        headers: authHeaders(),
                        body: formData
                    }
                );

                const uploadData =
                    await uploadResponse
                        .json()
                        .catch(() => ({}));

                if (!uploadResponse.ok) {
                    toast.error(
                        uploadData?.message ||
                        "Photo upload failed."
                    );

                    return;
                }

                imageUrl = uploadData.imageUrl;

                localStorage.setItem(
                    "profilePicture",
                    imageUrl
                );
            }

            // =================================================
            // SAVE PROFILE
            // idNumber is NOT sent as an editable field: it was
            // fixed at Registration and is shown disabled above.
            // =================================================

            const response = await fetch(
                `${API_URL}/api/profile/setup`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders()
                    },

                    body: JSON.stringify({
                        userId,
                        firstName: firstName.trim(),
                        middleName: middleName.trim(),
                        lastName: lastName.trim(),
                        contactNumber,
                        role,
                        course,
                        institute,
                        yearLevel,
                        studentStatus,
                        position
                    })
                }
            );

            const data = await response.text();

            if (!response.ok) {
                toast.error(
                    data ||
                    "Unable to save profile."
                );

                return;
            }

            
            // =================================================
            // SAVE LOCAL STORAGE
            // =================================================

            localStorage.setItem(
                "role",
                role
            );

            localStorage.setItem(
                "firstName",
                firstName.trim()
            );

            localStorage.setItem(
                "middleName",
                middleName.trim()
            );

            localStorage.setItem(
                "lastName",
                lastName.trim()
            );

            localStorage.setItem(
                "userName",
                [firstName.trim(), middleName.trim(), lastName.trim()]
                    .filter(Boolean)
                    .join(" ")
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

            localStorage.setItem(
                "studentStatus",
                studentStatus
            );

            localStorage.setItem(
                "position",
                position
            );

            // =================================================
            // SUCCESS
            // =================================================

            toast.success(
                "Profile completed successfully."
            );

            setTimeout(() => {
                navigate("/dashboard");
            }, 700);

        } catch (error) {
            console.error(error);

            toast.error(
                error.message ||
                "Unable to save profile."
            );

        } finally {
            setSaving(false);
        }
    };

    return (
        <BackgroundLayout>

            <div
                className="
                    min-h-screen
                    flex
                    items-center
                    justify-center
                    p-6
                "
            >

                <div
                    className="
                        bg-white
                        rounded-3xl
                        p-8
                        w-full
                        max-w-md
                        shadow-xl
                        shadow-[#106A2E]/10
                    "
                >

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="
                        text-center
                        mb-6
                    ">

                        <div className="
                            w-16
                            h-16
                            rounded-2xl
                            bg-[#106A2E]
                            mx-auto
                            flex
                            items-center
                            justify-center
                            mb-4
                        ">

                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                            >
                                <circle
                                    cx="12"
                                    cy="8"
                                    r="4"
                                />

                                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                            </svg>

                        </div>

                        <h1 className="
                            text-xl
                            font-semibold
                            text-[#1F1F1F]
                        ">
                            Setup Profile
                        </h1>

                        <p className="
                            text-sm
                            text-gray-500
                            mt-1
                        ">
                            Complete your profile before continuing
                        </p>

                    </div>

                    {/* =================================================
                        PROFILE PHOTO
                    ================================================= */}

                    <div className="
                        flex
                        flex-col
                        items-center
                        mb-6
                    ">

                        <label className="cursor-pointer">

                            <img
                                src={
                                    profilePicture
                                        ? URL.createObjectURL(
                                            profilePicture
                                        )
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
                                        e.target.files?.[0] ||
                                        null
                                    )
                                }
                            />

                        </label>

                        <p className="
                            text-xs
                            text-gray-500
                            mt-2
                        ">
                            Tap to upload photo
                        </p>

                    </div>

                    <div className="space-y-4">

                        {/* =================================================
                            ID NUMBER (from Registration - disabled)
                        ================================================= */}

                        <div>

                            <label className="
                                text-sm
                                text-gray-600
                            ">
                                {idLabel}
                            </label>

                            <input
                                type="text"
                                value={registeredIdNumber}
                                disabled
                                readOnly
                                placeholder="From your registration"
                                title="From your registration - cannot be changed here"
                                className="
                                    w-full
                                    mt-1
                                    p-3
                                    rounded-xl
                                    border
                                    border-gray-200
                                    bg-gray-100
                                    text-gray-500
                                    cursor-not-allowed
                                    outline-none
                                "
                            />

                            <p className="
                                text-[11px]
                                text-gray-400
                                mt-1
                            ">
                                From your registration — cannot be changed here.
                            </p>

                        </div>

                        {/* =================================================
                            I AM A (Student / Faculty)
                        ================================================= */}

                        <div>

                            <label className="
                                text-sm
                                text-gray-600
                            ">
                                I am a
                            </label>

                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setRole("Student")}
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
                                                : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-white"
                                        }
                                    `}
                                >
                                    Student
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRole("Faculty")}
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
                                                : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-white"
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

                        <div>

                            <label className="
                                text-sm
                                text-gray-600
                            ">
                                First Name <span className="text-red-500">*</span>
                            </label>

                            <input
                                type="text"
                                placeholder="Juan"
                                value={firstName}
                                onChange={(e) =>
                                    setFirstName(
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

                        {/* =================================================
                            MIDDLE NAME
                        ================================================= */}

                        <div>

                            <label className="
                                text-sm
                                text-gray-600
                            ">
                                Middle Name <span className="text-gray-400">(Optional)</span>
                            </label>

                            <input
                                type="text"
                                placeholder="Santos"
                                value={middleName}
                                onChange={(e) =>
                                    setMiddleName(
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

                        {/* =================================================
                            LAST NAME
                        ================================================= */}

                        <div>

                            <label className="
                                text-sm
                                text-gray-600
                            ">
                                Last Name <span className="text-red-500">*</span>
                            </label>

                            <input
                                type="text"
                                placeholder="Dela Cruz"
                                value={lastName}
                                onChange={(e) =>
                                    setLastName(
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

                        {/* =================================================
                            CONTACT NUMBER
                        ================================================= */}

                        <div>

                            <label className="
                                text-sm
                                text-gray-600
                            ">
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

                        {/* =================================================
                            STUDENT PROGRAM
                        ================================================= */}

                        {role === "Student" && (

                            <div>

                                <label className="
                                    text-sm
                                    text-gray-600
                                ">
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

                                    <option value="">
                                        Select Program
                                    </option>

                                    <option>
                                        Bachelor of Science in Business Administration Major in Human Resource Management
                                    </option>

                                    <option>
                                        Bachelor of Science in Entrepreneurship
                                    </option>

                                    <option>
                                        Bachelor of Science in Computer Engineering
                                    </option>

                                    <option>
                                        Bachelor of Science in Information Technology
                                    </option>

                                    <option>
                                        Bachelor of Early Childhood Education
                                    </option>

                                    <option>
                                        Bachelor of Technology and Livelihood Education Major in Information and Communication Technology
                                    </option>

                                    <option>
                                        Bachelor of Science in Secondary Education Major in Science
                                    </option>

                                    <option>
                                        Bachelor of Elementary Education Major in General Education
                                    </option>

                                    <option>
                                        Teacher Certificate Program
                                    </option>

                                </select>

                            </div>

                        )}

                        {/* =================================================
                            FACULTY INSTITUTE
                        ================================================= */}

                        {role === "Faculty" && (

                            <div>

                                <label className="
                                    text-sm
                                    text-gray-600
                                ">
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

                        {/* =================================================
                            FACULTY POSITION
                        ================================================= */}

                        {role === "Faculty" && (

                            <div>

                                <label className="
                                    text-sm
                                    text-gray-600
                                ">
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
                                        border-gray-200
                                        bg-gray-50
                                        focus:border-[#106A2E]
                                        outline-none
                                    "
                                />

                            </div>

                        )}

                        {/* =================================================
                            STUDENT YEAR LEVEL
                        ================================================= */}

                        {role === "Student" && (

                            <div>

                                <label className="
                                    text-sm
                                    text-gray-600
                                ">
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

                        {/* =================================================
                            STUDENT STATUS
                        ================================================= */}

                        {role === "Student" && (

                            <div>

                                <label className="
                                    text-sm
                                    text-gray-600
                                ">
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
                                        border-gray-200
                                        bg-gray-50
                                        focus:border-[#106A2E]
                                        outline-none
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

                        )}

                    </div>

                    {/* =================================================
                        SAVE BUTTON
                    ================================================= */}

                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
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
                            disabled:bg-gray-300
                            disabled:cursor-not-allowed
                        "
                    >
                        {saving
                            ? "Saving Profile..."
                            : "Save Profile"}
                    </button>

                    {/* Clears the floating bottom nav so "Save Profile" is
                        never underneath it. */}
                    <BottomNavSpacer />

                </div>

            </div>

        </BackgroundLayout>
    );
}
