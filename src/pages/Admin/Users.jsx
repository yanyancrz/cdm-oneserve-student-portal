import { useState, useMemo, useEffect } from "react";

const ROLE_FILTERS = ["All roles", "Admin", "Student", "Faculty"];
const USER_ROLE_OPTIONS = ["Student", "Faculty", "Admin"];
const STATUS_FILTERS = ["All statuses", "Active", "Pending", "Suspended", "Rejected", "Deleted"];

const ADMIN_MODULES = [
    "Lost & Found",
    "Clinic",
    "Business Hub",
    "Guidance",
    "Library",
];

const ADMIN_ROLES = [
    "Admin",
    "LostFoundAdmin",
    "ClinicAdmin",
    "BusinessHubAdmin",
    "GuidanceAdmin",
    "LibraryAdmin",
];

const INSTITUTE_PROGRAMS = {
    "Institute of Computing Studies": [
        "Bachelor of Science in Computer Engineering",
        "Bachelor of Science in Information Technology",
    ],

    "Institute of Teacher Education": [
        "Bachelor of Early Childhood Education",
        "Bachelor of Technology and Livelihood Education Major in Information and Communication Technology",
        "Bachelor of Science in Secondary Education Major in Science",
        "Bachelor of Elementary Education Major in General Education",
        "Teacher Certificate Program",
    ],

    "Institute of Business and Entrepreneurship": [
        "Bachelor of Science in Business Administration Major in Human Resource Management",
        "Bachelor of Science in Entrepreneurship",
    ],
};

const INSTITUTES = Object.keys(INSTITUTE_PROGRAMS);

const ROLE_STYLES = {
    Admin: "bg-blue-100 text-blue-700",
    LostFoundAdmin: "bg-blue-100 text-blue-700",
    ClinicAdmin: "bg-blue-100 text-blue-700",
    BusinessHubAdmin: "bg-blue-100 text-blue-700",
    GuidanceAdmin: "bg-blue-100 text-blue-700",
    LibraryAdmin: "bg-blue-100 text-blue-700",
    Student: "bg-[#106A2E]/10 text-[#106A2E]",
    student: "bg-[#106A2E]/10 text-[#106A2E]",
    Faculty: "bg-[#0E3B22]/10 text-[#0E3B22]",
};

const STATUS_STYLES = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Suspended: "bg-red-50 text-red-700 ring-red-200",
    Rejected: "bg-red-50 text-red-700 ring-red-200",
    Deleted: "bg-gray-100 text-gray-600 ring-gray-300",
};

const API_BASE = "https://api.cdmconnect.online/api/auth/users";

const isAdminRole = (role) => {
    if (!role) return false;

    return ADMIN_ROLES.includes(role);
};

const getInstituteFromCourse = (course) => {
    if (!course) return "";

    const normalizedCourse = course.trim();

    for (const [institute, programs] of Object.entries(INSTITUTE_PROGRAMS)) {
        if (programs.includes(normalizedCourse)) {
            return institute;
        }
    }

    return "";
};

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function Initials({ name }) {
    const initials = (name || "User")
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ background: "#0E3B22" }}
        >
            {initials}
        </div>
    );
}

// ---------------------------------------------------------
// MODAL
// ---------------------------------------------------------

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
                <div
                    className="flex items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: "#E5E1D8" }}
                >
                    <h3 className="text-sm font-semibold text-gray-800">
                        {title}
                    </h3>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-5 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// USER FORM
// ---------------------------------------------------------

function UserForm({
    initial,
    onCancel,
    onSubmit,
    submitLabel,
}) {
    const [form, setForm] = useState(
        initial || {
            fullName: "",
            email: "",
            role: "Student",
            status: "Active",
            idNumber: "",
            institute: "",
            course: "",
            yearLevel: "",
            adminModule: "",
        }
    );

    const update = (field) => (e) => {
        setForm((f) => ({
            ...f,
            [field]: e.target.value,
        }));
    };

    const isStudent = form.role === "Student";
    const isFaculty = form.role === "Faculty";
    const isAdmin = isAdminRole(form.role);

    const availablePrograms = form.institute
        ? INSTITUTE_PROGRAMS[form.institute] || []
        : Object.values(INSTITUTE_PROGRAMS).flat();

    const handleRoleChange = (e) => {
        const newRole = e.target.value;

        setForm((f) => ({
            ...f,
            role: newRole,
            adminModule: newRole === "Admin" ? f.adminModule : "",
            institute: newRole === "Faculty" ? f.institute : "",
            course: newRole === "Student" ? f.course : "",
            idNumber:
                newRole === "Student" || newRole === "Faculty"
                    ? f.idNumber
                    : "",
            yearLevel: newRole === "Student" ? f.yearLevel : "",
        }));
    };

    const handleInstituteChange = (e) => {
        const institute = e.target.value;

        setForm((f) => ({
            ...f,
            institute,
            course:
                f.course &&
                INSTITUTE_PROGRAMS[institute]?.includes(f.course)
                    ? f.course
                    : "",
        }));
    };

    const handleCourseChange = (e) => {
        const course = e.target.value;

        setForm((f) => ({
            ...f,
            course,
            institute: getInstituteFromCourse(course) || f.institute,
        }));
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();

                const cleanedForm = {
                    ...form,
                    institute: isStudent
                        ? getInstituteFromCourse(form.course) || form.institute
                        : isFaculty
                            ? form.institute
                            : "",
                };

                onSubmit(cleanedForm);
            }}
            className="space-y-3"
        >
            {/* FULL NAME */}
            <div>
                <label className="text-xs font-medium text-gray-500">
                    Full name
                </label>

                <input
                    required
                    value={form.fullName}
                    onChange={update("fullName")}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{
                        borderColor: "#E5E1D8",
                        "--tw-ring-color": "#106A2E",
                    }}
                />
            </div>

            {/* EMAIL */}
            <div>
                <label className="text-xs font-medium text-gray-500">
                    Email
                </label>

                <input
                    required
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{
                        borderColor: "#E5E1D8",
                        "--tw-ring-color": "#106A2E",
                    }}
                />
            </div>

            {/* ROLE + STATUS */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500">
                        Role
                    </label>

                    <select
                        value={form.role}
                        onChange={handleRoleChange}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: "#E5E1D8" }}
                    >
                        {USER_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500">
                        Status
                    </label>

                    <select
                        value={form.status}
                        onChange={update("status")}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: "#E5E1D8" }}
                    >
                        {STATUS_FILTERS.slice(1).map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ADMIN */}
            {isAdmin && (
                <div>
                    <label className="text-xs font-medium text-gray-500">
                        Assigned Module
                    </label>

                    <select
                        required
                        value={form.adminModule || ""}
                        onChange={update("adminModule")}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: "#E5E1D8" }}
                    >
                        <option value="">
                            Select module
                        </option>

                        {ADMIN_MODULES.map((module) => (
                            <option key={module} value={module}>
                                {module}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* STUDENT */}
            {isStudent && (
                <>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500">
                                ID number
                            </label>

                            <input
                                value={form.idNumber || ""}
                                onChange={update("idNumber")}
                                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                                style={{
                                    borderColor: "#E5E1D8",
                                    "--tw-ring-color": "#106A2E",
                                }}
                            />
                        </div>

                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500">
                                Year level
                            </label>

                            <input
                                value={form.yearLevel || ""}
                                onChange={update("yearLevel")}
                                placeholder="e.g. 3rd Year"
                                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                                style={{
                                    borderColor: "#E5E1D8",
                                    "--tw-ring-color": "#106A2E",
                                }}
                            />
                        </div>
                    </div>

                    {/* STUDENT INSTITUTE */}
                    <div>
                        <label className="text-xs font-medium text-gray-500">
                            Institute
                        </label>

                        <input
                            readOnly
                            value={
                                getInstituteFromCourse(form.course) ||
                                form.institute ||
                                ""
                            }
                            placeholder="Automatically assigned from program"
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-600"
                            style={{ borderColor: "#E5E1D8" }}
                        />
                    </div>

                    {/* STUDENT COURSE */}
                    <div>
                        <label className="text-xs font-medium text-gray-500">
                            Program
                        </label>

                        <select
                            required
                            value={form.course || ""}
                            onChange={handleCourseChange}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            style={{ borderColor: "#E5E1D8" }}
                        >
                            <option value="">
                                Select program
                            </option>

                            {availablePrograms.map((program) => (
                                <option key={program} value={program}>
                                    {program}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {/* FACULTY */}
            {isFaculty && (
                <>
                    <div>
                        <label className="text-xs font-medium text-gray-500">
                            ID number
                        </label>

                        <input
                            value={form.idNumber || ""}
                            onChange={update("idNumber")}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                            style={{
                                borderColor: "#E5E1D8",
                                "--tw-ring-color": "#106A2E",
                            }}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500">
                            Institute
                        </label>

                        <select
                            value={form.institute || ""}
                            onChange={handleInstituteChange}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            style={{ borderColor: "#E5E1D8" }}
                        >
                            <option value="">
                                Select institute
                            </option>

                            {INSTITUTES.map((institute) => (
                                <option key={institute} value={institute}>
                                    {institute}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {/* BUTTONS */}
            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs font-semibold px-4 py-2 rounded-lg border text-gray-600"
                    style={{ borderColor: "#E5E1D8" }}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="text-xs font-semibold px-4 py-2 rounded-lg text-white"
                    style={{ background: "#0E3B22" }}
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}

// ---------------------------------------------------------
// MAIN USERS PAGE
// ---------------------------------------------------------

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All roles");
    const [statusFilter, setStatusFilter] = useState("All statuses");

    const [instituteFilter, setInstituteFilter] =
        useState("All institutes");

    const [courseFilter, setCourseFilter] =
        useState("All courses");

    const [modal, setModal] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [busyId, setBusyId] = useState(null);

    // ---------------------------------------------------------
    // LOAD USERS
    // ---------------------------------------------------------

    const loadUsers = () => {
        setLoading(true);

        fetch(API_BASE)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to load users");
                }

                return res.json();
            })
            .then((data) => {
                setUsers(Array.isArray(data) ? data : []);
                setError(null);
            })
            .catch((err) => {
                console.error(err);
                setError(
                    "Couldn't load users. Is the API running?"
                );
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // ---------------------------------------------------------
    // FILTER OPTIONS
    // ---------------------------------------------------------

    const instituteOptions = useMemo(() => {
        const set = new Set(
            users
                .filter(
                    (u) =>
                        u.role?.toLowerCase() === "student" &&
                        u.institute
                )
                .map((u) => u.institute)
        );

        return [
            "All institutes",
            ...Array.from(set).sort(),
        ];
    }, [users]);

    const courseOptions = useMemo(() => {
        const set = new Set(
            users
                .filter(
                    (u) =>
                        u.role?.toLowerCase() === "student" &&
                        u.course &&
                        (
                            instituteFilter === "All institutes" ||
                            u.institute === instituteFilter
                        )
                )
                .map((u) => u.course)
        );

        return [
            "All courses",
            ...Array.from(set).sort(),
        ];
    }, [users, instituteFilter]);

    // ---------------------------------------------------------
    // FILTER STATES
    // ---------------------------------------------------------

    const isStudentFilter = roleFilter === "Student";

    const showAssignedModule =
        roleFilter === "All roles" ||
        roleFilter === "Admin";

    const showIdNumber =
        roleFilter === "All roles" ||
        roleFilter === "Student" ||
        roleFilter === "Faculty";

    const tableColumnCount =
        5 +
        (showAssignedModule ? 1 : 0) +
        (showIdNumber ? 1 : 0);

    const handleRoleFilterChange = (value) => {
        setRoleFilter(value);

        if (value !== "Student") {
            setInstituteFilter("All institutes");
            setCourseFilter("All courses");
        }
    };

    const handleInstituteFilterChange = (value) => {
        setInstituteFilter(value);
        setCourseFilter("All courses");
    };

    // ---------------------------------------------------------
    // FILTER USERS
    // ---------------------------------------------------------

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((u) => {
            const matchesSearch =
                !query ||
                [
                    u.fullName,
                    u.email,
                    u.idNumber,
                    u.role,
                    u.adminModule,
                    u.institute,
                    u.course,
                    u.yearLevel,
                    u.status,
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value)
                            .toLowerCase()
                            .includes(query)
                    );

            let matchesRole = true;

            if (roleFilter === "Admin") {
                matchesRole = isAdminRole(u.role);
            } else if (roleFilter !== "All roles") {
                matchesRole =
                    u.role?.toLowerCase() ===
                    roleFilter.toLowerCase();
            }

            const matchesStatus =
                statusFilter === "All statuses" ||
                u.status === statusFilter;

            const matchesInstitute =
                !isStudentFilter ||
                instituteFilter === "All institutes" ||
                u.institute === instituteFilter;

            const matchesCourse =
                !isStudentFilter ||
                courseFilter === "All courses" ||
                u.course === courseFilter;

            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus &&
                matchesInstitute &&
                matchesCourse
            );
        });
    }, [
        users,
        search,
        roleFilter,
        statusFilter,
        instituteFilter,
        courseFilter,
        isStudentFilter,
    ]);

    // ---------------------------------------------------------
    // MODAL HANDLERS
    // ---------------------------------------------------------

    const openAdd = () => {
        setActiveUser(null);
        setModal("add");
    };

    const openView = (user) => {
        setActiveUser(user);
        setModal("view");
    };

    const openEdit = (user) => {
        setActiveUser(user);
        setModal("edit");
    };

    const closeModal = () => {
        setModal(null);
        setActiveUser(null);
    };

    // ---------------------------------------------------------
    // ADD USER
    // ---------------------------------------------------------

    const handleAddSubmit = (form) => {
        fetch(API_BASE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(
                        "Failed to create user"
                    );
                }

                return res.json();
            })
            .then((created) => {
                setUsers((prev) => [
                    ...prev,
                    created,
                ]);

                closeModal();
            })
            .catch((err) => {
                console.error(err);

                alert(
                    "Couldn't create the user. Please try again."
                );
            });
    };

    // ---------------------------------------------------------
    // EDIT USER
    // ---------------------------------------------------------

    // ---------------------------------------------------------
// EDIT USER
// ---------------------------------------------------------

const handleEditSubmit = async (form) => {
    if (!activeUser) return;

    try {
        const response = await fetch(
            `${API_BASE}/${activeUser.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: form.email,
                    role: form.role,
                    adminModule: form.adminModule || null,

                    institute:
                        form.role === "Faculty"
                            ? form.institute || null
                            : null,

                    course:
                        form.role === "Student"
                            ? form.course || null
                            : null,

                    yearLevel:
                        form.role === "Student"
                            ? form.yearLevel || null
                            : null,
                }),
            }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(
                data?.message ||
                data?.error ||
                "Failed to update user."
            );
        }

        const updatedUser = data?.user || data;

        setUsers((prev) =>
            prev.map((u) =>
                u.id === activeUser.id
                    ? {
                          ...u,
                          ...updatedUser,

                          // Identity fields remain unchanged
                          id: activeUser.id,
                          fullName: activeUser.fullName,
                          idNumber: activeUser.idNumber,
                      }
                    : u
            )
        );

        closeModal();

        alert("User updated successfully.");
    } catch (err) {
        console.error(
            "Failed to update user:",
            err
        );

        alert(
            err.message ||
            "Couldn't save changes. Please try again."
        );
    }
};

    // ---------------------------------------------------------
    // SUSPEND / REINSTATE
    // ---------------------------------------------------------

    const handleToggleStatus = async (user) => {
        if (user.status === "Deleted") {
            alert("Deleted accounts cannot be reinstated from User Management. The user must register again.");
            return;
        }

        const nextStatus =
            user.status === "Suspended"
                ? "Active"
                : "Suspended";

        setBusyId(user.id);

        try {
            const response = await fetch(
                `${API_BASE}/${user.id}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: nextStatus,
                    }),
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to update status."
                );
            }

            setUsers((prev) =>
                prev.map((u) =>
                    u.id === user.id
                        ? {
                            ...u,
                            ...(data?.user || {}),
                            status: nextStatus,
                        }
                        : u
                )
            );
        } catch (err) {
            console.error(err);
            alert(
                err.message ||
                "Couldn't update the user's status. Please try again."
            );
        } finally {
            setBusyId(null);
        }
    };

    // ---------------------------------------------------------
    // DELETE ACCOUNT — SOFT DELETE
    // ---------------------------------------------------------

    const handleDeleteUser = async (user) => {
        if (!user?.id) return;

        if (user.role === "SuperAdmin") {
            alert("The Super Admin account cannot be deleted.");
            return;
        }

        if (user.status === "Deleted") {
            alert("This account is already deleted.");
            return;
        }

        const confirmed = window.confirm(
            `Delete the account of ${user.fullName}?

The account will be deactivated, but historical system records and the official School Record will be preserved.`
        );

        if (!confirmed) return;

        setBusyId(user.id);

        try {
            const response = await fetch(
                `${API_BASE}/${user.id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to delete the account."
                );
            }

            // Keep the deleted account visible so admins can find it
            // using the Deleted status filter.
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === user.id
                        ? {
                            ...u,
                            status: "Deleted",
                        }
                        : u
                )
            );

            if (activeUser?.id === user.id) {
                closeModal();
            }

            alert(
                data?.message ||
                "User account deleted successfully."
            );
        } catch (err) {
            console.error("Failed to delete user:", err);
            alert(
                err.message ||
                "Couldn't delete the user account. Please try again."
            );
        } finally {
            setBusyId(null);
        }
    };

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------

    return (
        <div className="px-8 py-6 max-w-7xl">

            {/* PAGE INTRO */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        Users
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Manage student, faculty, and admin accounts.
                    </p>
                </div>

                <button
                    onClick={openAdd}
                    className="
                        flex items-center gap-2
                        text-white text-sm font-semibold
                        px-4 py-2.5 rounded-xl
                        transition-all
                        hover:opacity-90
                    "
                    style={{
                        background: "#0E3B22",
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M12 5v14M5 12h14" />
                    </svg>

                    Add User
                </button>
            </div>

            {/* FILTER BAR */}
            <div
                className="
                    bg-white rounded-xl border p-3 mb-4
                    flex flex-wrap items-center gap-3
                "
                style={{
                    borderColor: "#E5E1D8",
                }}
            >
                {/* SEARCH */}
                <div className="relative flex-1 min-w-[220px]">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="
                            absolute left-3 top-1/2
                            -translate-y-1/2 text-gray-400
                        "
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-3.5-3.5" />
                    </svg>

                    <input
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search by name, email, ID, role..."
                        className="
                            w-full pl-9 pr-3 py-2.5
                            rounded-lg text-sm
                            border focus:outline-none focus:ring-2
                        "
                        style={{
                            borderColor: "#E5E1D8",
                            "--tw-ring-color": "#106A2E",
                        }}
                    />
                </div>

                {/* ROLE FILTER */}
                <select
                    value={roleFilter}
                    onChange={(e) =>
                        handleRoleFilterChange(
                            e.target.value
                        )
                    }
                    className="
                        text-sm border rounded-lg
                        px-3 py-2.5 text-gray-700
                        focus:outline-none
                    "
                    style={{
                        borderColor: "#E5E1D8",
                    }}
                >
                    {ROLE_FILTERS.map((role) => (
                        <option
                            key={role}
                            value={role}
                        >
                            {role}
                        </option>
                    ))}
                </select>

                {/* STUDENT FILTERS */}
                {isStudentFilter && (
                    <>
                        <select
                            value={instituteFilter}
                            onChange={(e) =>
                                handleInstituteFilterChange(
                                    e.target.value
                                )
                            }
                            className="
                                text-sm border rounded-lg
                                px-3 py-2.5 text-gray-700
                                focus:outline-none
                            "
                            style={{
                                borderColor: "#E5E1D8",
                            }}
                        >
                            {instituteOptions.map(
                                (institute) => (
                                    <option
                                        key={institute}
                                        value={institute}
                                    >
                                        {institute}
                                    </option>
                                )
                            )}
                        </select>

                        <select
                            value={courseFilter}
                            onChange={(e) =>
                                setCourseFilter(
                                    e.target.value
                                )
                            }
                            className="
                                text-sm border rounded-lg
                                px-3 py-2.5 text-gray-700
                                focus:outline-none
                            "
                            style={{
                                borderColor: "#E5E1D8",
                            }}
                        >
                            {courseOptions.map(
                                (course) => (
                                    <option
                                        key={course}
                                        value={course}
                                    >
                                        {course}
                                    </option>
                                )
                            )}
                        </select>
                    </>
                )}

                {/* STATUS FILTER */}
                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }
                    className="
                        text-sm border rounded-lg
                        px-3 py-2.5 text-gray-700
                        focus:outline-none
                    "
                    style={{
                        borderColor: "#E5E1D8",
                    }}
                >
                    {STATUS_FILTERS.map((status) => (
                        <option
                            key={status}
                            value={status}
                        >
                            {status}
                        </option>
                    ))}
                </select>
            </div>

            {/* ERROR */}
            {error && (
                <div className="
                    mb-4 px-4 py-3 rounded-lg
                    bg-red-50 text-red-700 text-sm
                    flex items-center justify-between
                ">
                    <span>{error}</span>

                    <button
                        onClick={loadUsers}
                        className="font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* TABLE */}
            <div
                className="
                    bg-white rounded-xl border
                    overflow-hidden
                "
                style={{
                    borderColor: "#E5E1D8",
                }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">

                        {/* TABLE HEADER */}
                        <thead>
                            <tr
                                className="border-b"
                                style={{
                                    borderColor: "#E5E1D8",
                                }}
                            >
                                {/* USER */}
                                <th className="
                                    text-left font-medium
                                    text-gray-400 px-5 py-3
                                    text-xs uppercase tracking-wide
                                ">
                                    User
                                </th>

                                {/* ID NUMBER */}
                                {showIdNumber && (
                                    <th className="
                                        text-left font-medium
                                        text-gray-400 px-5 py-3
                                        text-xs uppercase tracking-wide
                                    ">
                                        ID Number
                                    </th>
                                )}

                                {/* ROLE */}
                                <th className="
                                    text-left font-medium
                                    text-gray-400 px-5 py-3
                                    text-xs uppercase tracking-wide
                                ">
                                    Role
                                </th>

                                {/* ASSIGNED MODULE */}
                                {showAssignedModule && (
                                    <th className="
                                        text-left font-medium
                                        text-gray-400 px-5 py-3
                                        text-xs uppercase tracking-wide
                                    ">
                                        Assigned Module
                                    </th>
                                )}

                                {/* STATUS */}
                                <th className="
                                    text-left font-medium
                                    text-gray-400 px-5 py-3
                                    text-xs uppercase tracking-wide
                                ">
                                    Status
                                </th>

                                {/* LAST ACTIVE */}
                                <th className="
                                    text-left font-medium
                                    text-gray-400 px-5 py-3
                                    text-xs uppercase tracking-wide
                                ">
                                    Last Active
                                </th>

                                {/* ACTIONS */}
                                <th className="
                                    text-right font-medium
                                    text-gray-400 px-5 py-3
                                    text-xs uppercase tracking-wide
                                ">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        {/* TABLE BODY */}
                        <tbody>

                            {/* EMPTY */}
                            {!loading &&
                                filtered.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                tableColumnCount
                                            }
                                            className="
                                                px-5 py-12
                                                text-center
                                            "
                                        >
                                            <p className="
                                                text-gray-700
                                                font-medium
                                            ">
                                                No users match
                                                your filters
                                            </p>

                                            <p className="
                                                text-gray-400
                                                text-sm mt-1
                                            ">
                                                Try a different
                                                search term or
                                                clear the filters.
                                            </p>
                                        </td>
                                    </tr>
                                )}

                            {/* LOADING */}
                            {loading && (
                                <tr>
                                    <td
                                        colSpan={
                                            tableColumnCount
                                        }
                                        className="
                                            px-5 py-12
                                            text-center
                                            text-gray-400
                                            text-sm
                                        "
                                    >
                                        Loading users…
                                    </td>
                                </tr>
                            )}

                            {/* USERS */}
                            {!loading &&
                                filtered.map((u, i) => (
                                    <tr
                                        key={u.id}
                                        className={
                                            i !==
                                            filtered.length - 1
                                                ? "border-b"
                                                : ""
                                        }
                                        style={{
                                            borderColor:
                                                "#F0EDE4",
                                        }}
                                    >
                                        {/* USER */}
                                        <td className="
                                            px-5 py-3.5
                                        ">
                                            <div className="
                                                flex items-center
                                                gap-3
                                            ">
                                                <Initials
                                                    name={
                                                        u.fullName
                                                    }
                                                />

                                                <div>
                                                    <p className="
                                                        font-medium
                                                        text-gray-800
                                                    ">
                                                        {
                                                            u.fullName
                                                        }
                                                    </p>

                                                    <p className="
                                                        text-gray-400
                                                        text-xs
                                                    ">
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* ID NUMBER */}
                                        {showIdNumber && (
                                            <td className="
                                                px-5 py-3.5
                                                text-gray-600
                                            ">
                                                {u.idNumber ||
                                                    "—"}
                                            </td>
                                        )}

                                        {/* ROLE */}
                                        <td className="
                                            px-5 py-3.5
                                        ">
                                            <span
                                                className={`
                                                    text-xs
                                                    font-semibold
                                                    px-2.5 py-1
                                                    rounded-full
                                                    ${
                                                        ROLE_STYLES[
                                                            u.role
                                                        ] ||
                                                        "bg-gray-100 text-gray-700"
                                                    }
                                                `}
                                            >
                                                {u.role}
                                            </span>
                                        </td>

                                        {/* ASSIGNED MODULE */}
                                        {showAssignedModule && (
                                            <td className="
                                                px-5 py-3.5
                                                text-gray-600
                                            ">
                                                {isAdminRole(
                                                    u.role
                                                )
                                                    ? u.adminModule ||
                                                        "—"
                                                    : "—"}
                                            </td>
                                        )}

                                        {/* STATUS */}
                                        <td className="
                                            px-5 py-3.5
                                        ">
                                            <span
                                                className={`
                                                    inline-flex
                                                    items-center
                                                    gap-1.5
                                                    text-xs
                                                    font-semibold
                                                    px-2.5 py-1
                                                    rounded-full
                                                    ring-1
                                                    ${
                                                        STATUS_STYLES[
                                                            u.status
                                                        ] ||
                                                        "bg-gray-100 text-gray-600 ring-gray-200"
                                                    }
                                                `}
                                            >
                                                <span
                                                    className={`
                                                        w-1.5 h-1.5
                                                        rounded-full
                                                        ${
                                                            u.status ===
                                                            "Active"
                                                                ? "bg-emerald-500"
                                                                : u.status ===
                                                                    "Pending"
                                                                    ? "bg-amber-500"
                                                                    : u.status ===
                                                                        "Deleted"
                                                                        ? "bg-gray-500"
                                                                        : "bg-red-500"
                                                        }
                                                    `}
                                                />

                                                {u.status}
                                            </span>
                                        </td>

                                        {/* LAST ACTIVE */}
                                        <td className="
                                            px-5 py-3.5
                                            text-gray-500
                                        ">
                                            {formatDate(
                                                u.lastActive
                                            )}
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="
                                            px-5 py-3.5
                                            text-right
                                        ">
                                            <div className="
                                                flex items-center
                                                justify-end gap-2
                                            ">
                                                <button
                                                    onClick={() =>
                                                        openView(u)
                                                    }
                                                    className="
                                                        text-xs
                                                        font-semibold
                                                        text-[#106A2E]
                                                        hover:underline
                                                    "
                                                >
                                                    View
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        openEdit(u)
                                                    }
                                                    className="
                                                        text-xs
                                                        font-semibold
                                                        text-gray-500
                                                        hover:text-gray-800
                                                    "
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            u
                                                        )
                                                    }
                                                    disabled={
                                                        busyId ===
                                                        u.id
                                                    }
                                                    className="
                                                        text-xs
                                                        font-semibold
                                                        text-red-500
                                                        hover:text-red-700
                                                        disabled:opacity-40
                                                    "
                                                >
                                                    {busyId ===
                                                    u.id
                                                        ? "…"
                                                        : u.status ===
                                                            "Suspended"
                                                            ? "Reinstate"
                                                            : "Suspend"}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDeleteUser(u)
                                                    }
                                                    disabled={
                                                        busyId === u.id ||
                                                        u.status === "Deleted" ||
                                                        u.role === "SuperAdmin"
                                                    }
                                                    className="
                                                        text-xs
                                                        font-semibold
                                                        text-red-600
                                                        hover:text-red-800
                                                        disabled:opacity-40
                                                    "
                                                >
                                                    {busyId === u.id
                                                        ? "…"
                                                        : "Delete"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAGINATION */}
            <div className="
                flex items-center
                justify-between mt-4
            ">
                <p className="
                    text-xs text-gray-400
                ">
                    Showing {filtered.length} of{" "}
                    {users.length} users
                </p>

                <div className="
                    flex items-center gap-2
                ">
                    <button
                        className="
                            text-xs font-medium
                            px-3 py-1.5 rounded-lg
                            border text-gray-500
                            disabled:opacity-40
                        "
                        style={{
                            borderColor: "#E5E1D8",
                        }}
                        disabled
                    >
                        Previous
                    </button>

                    <span className="
                        text-xs text-gray-400
                    ">
                        Page 1 of 1
                    </span>

                    <button
                        className="
                            text-xs font-medium
                            px-3 py-1.5 rounded-lg
                            border text-gray-500
                            disabled:opacity-40
                        "
                        style={{
                            borderColor: "#E5E1D8",
                        }}
                        disabled
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* ADD USER MODAL */}
            {modal === "add" && (
                <Modal
                    title="Add user"
                    onClose={closeModal}
                >
                    <UserForm
                        onCancel={closeModal}
                        onSubmit={handleAddSubmit}
                        submitLabel="Create user"
                    />
                </Modal>
            )}

            {/* EDIT USER MODAL */}
            {modal === "edit" && activeUser && (
                <Modal
                    title="Edit user"
                    onClose={closeModal}
                >
                    <UserForm
                        initial={activeUser}
                        onCancel={closeModal}
                        onSubmit={handleEditSubmit}
                        submitLabel="Save changes"
                    />
                </Modal>
            )}

            {/* VIEW USER MODAL */}
            {modal === "view" && activeUser && (
                <Modal
                    title="User details"
                    onClose={closeModal}
                >
                    {/* USER HEADER */}
                    <div className="
                        flex items-center gap-3 mb-4
                    ">
                        <Initials
                            name={activeUser.fullName}
                        />

                        <div>
                            <p className="
                                font-medium
                                text-gray-800
                            ">
                                {activeUser.fullName}
                            </p>

                            <p className="
                                text-gray-400
                                text-xs
                            ">
                                {activeUser.email}
                            </p>
                        </div>
                    </div>

                    <div className="
                        space-y-2 text-sm
                    ">
                        {/* ROLE */}
                        <div className="
                            flex justify-between
                            gap-4
                        ">
                            <span className="
                                text-gray-500
                            ">
                                Role
                            </span>

                            <span className="
                                font-medium
                                text-gray-800
                                text-right
                            ">
                                {activeUser.role}
                            </span>
                        </div>

                        {/* ADMIN MODULE */}
                        {isAdminRole(
                            activeUser.role
                        ) && (
                            <div className="
                                flex justify-between
                                gap-4
                            ">
                                <span className="
                                    text-gray-500
                                ">
                                    Assigned Module
                                </span>

                                <span className="
                                    font-medium
                                    text-gray-800
                                    text-right
                                ">
                                    {activeUser.adminModule ||
                                        "—"}
                                </span>
                            </div>
                        )}

                        {/* STUDENT */}
                        {activeUser.role ===
                            "Student" && (
                            <>
                                <div className="
                                    flex justify-between
                                    gap-4
                                ">
                                    <span className="
                                        text-gray-500
                                    ">
                                        ID Number
                                    </span>

                                    <span className="
                                        font-medium
                                        text-gray-800
                                        text-right
                                    ">
                                        {activeUser.idNumber ||
                                            "—"}
                                    </span>
                                </div>

                                <div className="
                                    flex justify-between
                                    gap-4
                                ">
                                    <span className="
                                        text-gray-500
                                    ">
                                        Institute
                                    </span>

                                    <span className="
                                        font-medium
                                        text-gray-800
                                        text-right
                                    ">
                                        {getInstituteFromCourse(
                                            activeUser.course
                                        ) ||
                                            activeUser.institute ||
                                            "—"}
                                    </span>
                                </div>

                                <div className="
                                    flex justify-between
                                    gap-4
                                ">
                                    <span className="
                                        text-gray-500
                                    ">
                                        Program
                                    </span>

                                    <span className="
                                        font-medium
                                        text-gray-800
                                        text-right
                                    ">
                                        {activeUser.course ||
                                            "—"}
                                    </span>
                                </div>

                                <div className="
                                    flex justify-between
                                    gap-4
                                ">
                                    <span className="
                                        text-gray-500
                                    ">
                                        Year level
                                    </span>

                                    <span className="
                                        font-medium
                                        text-gray-800
                                        text-right
                                    ">
                                        {activeUser.yearLevel ||
                                            "—"}
                                    </span>
                                </div>
                            </>
                        )}

                        {/* FACULTY */}
                        {activeUser.role ===
                            "Faculty" && (
                            <>
                                <div className="
                                    flex justify-between
                                    gap-4
                                ">
                                    <span className="
                                        text-gray-500
                                    ">
                                        ID Number
                                    </span>

                                    <span className="
                                        font-medium
                                        text-gray-800
                                        text-right
                                    ">
                                        {activeUser.idNumber ||
                                            "—"}
                                    </span>
                                </div>

                                <div className="
                                    flex justify-between
                                    gap-4
                                ">
                                    <span className="
                                        text-gray-500
                                    ">
                                        Institute
                                    </span>

                                    <span className="
                                        font-medium
                                        text-gray-800
                                        text-right
                                    ">
                                        {activeUser.institute ||
                                            "—"}
                                    </span>
                                </div>
                            </>
                        )}

                        {/* STATUS */}
                        <div className="
                            flex justify-between
                            gap-4
                        ">
                            <span className="
                                text-gray-500
                            ">
                                Status
                            </span>

                            <span className="
                                font-medium
                                text-gray-800
                                text-right
                            ">
                                {activeUser.status}
                            </span>
                        </div>

                        {/* LAST ACTIVE */}
                        <div className="
                            flex justify-between
                            gap-4
                        ">
                            <span className="
                                text-gray-500
                            ">
                                Last active
                            </span>

                            <span className="
                                font-medium
                                text-gray-800
                                text-right
                            ">
                                {formatDate(
                                    activeUser.lastActive
                                )}
                            </span>
                        </div>
                    </div>

                    {/* CLOSE */}
                    <div className="
                        flex justify-end pt-4
                    ">
                        <button
                            onClick={closeModal}
                            className="
                                text-xs font-semibold
                                px-4 py-2 rounded-lg
                                border text-gray-600
                            "
                            style={{
                                borderColor: "#E5E1D8",
                            }}
                        >
                            Close
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}