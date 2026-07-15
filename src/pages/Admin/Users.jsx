import { useState, useMemo, useEffect } from "react";

const ROLE_FILTERS = ["All roles", "Student", "Faculty", "Registrar"];
const STATUS_FILTERS = ["All statuses", "Active", "Pending", "Suspended"];

const ROLE_STYLES = {
    student: "bg-[#106A2E]/10 text-[#106A2E]",
    Admin: "bg-blue-100 text-blue-700",
    Faculty: "bg-[#0E3B22]/10 text-[#0E3B22]",
    Registrar: "bg-amber-100 text-amber-700",
};

const STATUS_STYLES = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Suspended: "bg-red-50 text-red-700 ring-red-200",
};

const DIGITAL_ID_STYLES = {
    Approved: "bg-emerald-50 text-emerald-700",
    Pending: "bg-amber-50 text-amber-700",
    Rejected: "bg-red-50 text-red-700",
    None: "bg-gray-100 text-gray-500",
};

const API_BASE = "http://localhost:5212/api/auth/users";

function Initials({ name }) {
    const initials = name
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

// Simple modal shell reused by Add / View / Edit
function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E1D8" }}>
                    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );
}

function UserForm({ initial, onCancel, onSubmit, submitLabel }) {
    const [form, setForm] = useState(
        initial || {
            fullName: "",
            email: "",
            role: "Student",
            status: "Active",
            studentNumber: "",
            institute: "",
            course: "",
            yearLevel: "",
        }
    );

    const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
    const isStudent = form.role === "Student";
    const isFaculty = form.role === "Faculty";

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(form);
            }}
            className="space-y-3"
        >
            <div>
                <label className="text-xs font-medium text-gray-500">Full name</label>
                <input
                    required
                    value={form.fullName}
                    onChange={update("fullName")}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "#E5E1D8", "--tw-ring-color": "#106A2E" }}
                />
            </div>
            <div>
                <label className="text-xs font-medium text-gray-500">Email</label>
                <input
                    required
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "#E5E1D8", "--tw-ring-color": "#106A2E" }}
                />
            </div>
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500">Role</label>
                    <select
                        value={form.role}
                        onChange={update("role")}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: "#E5E1D8" }}
                    >
                        {ROLE_FILTERS.slice(1).map((r) => (
                            <option key={r}>{r}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500">Status</label>
                    <select
                        value={form.status}
                        onChange={update("status")}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: "#E5E1D8" }}
                    >
                        {STATUS_FILTERS.slice(1).map((s) => (
                            <option key={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {isStudent && (
                <>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500">Student number</label>
                            <input
                                value={form.studentNumber}
                                onChange={update("studentNumber")}
                                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                                style={{ borderColor: "#E5E1D8", "--tw-ring-color": "#106A2E" }}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500">Year level</label>
                            <input
                                value={form.yearLevel}
                                onChange={update("yearLevel")}
                                placeholder="e.g. 3rd Year"
                                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                                style={{ borderColor: "#E5E1D8", "--tw-ring-color": "#106A2E" }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Institute</label>
                        <input
                            value={form.institute}
                            onChange={update("institute")}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: "#E5E1D8", "--tw-ring-color": "#106A2E" }}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Course</label>
                        <input
                            value={form.course}
                            onChange={update("course")}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: "#E5E1D8", "--tw-ring-color": "#106A2E" }}
                        />
                    </div>
                </>
            )}

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

export default function Users() {

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All roles");
    const [instituteFilter, setInstituteFilter] = useState("All institutes");
    const [courseFilter, setCourseFilter] = useState("All courses");

    // Which modal is open: null | "add" | "view" | "edit"
    const [modal, setModal] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [busyId, setBusyId] = useState(null); // user id currently being suspended/reinstated

    const loadUsers = () => {
        setLoading(true);
        fetch(API_BASE)
            .then((res) => res.json())
            .then((data) => {
                setUsers(data);
                setError(null);
            })
            .catch((err) => {
                console.error(err);
                setError("Couldn't load users. Is the API running?");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Institute/course options are derived from student records only,
    // since those are the fields that apply to the Student role.
    const instituteOptions = useMemo(() => {
        const set = new Set(
            users.filter((u) => u.role?.toLowerCase() === "student" && u.institute).map((u) => u.institute)
        );
        return ["All institutes", ...Array.from(set).sort()];
    }, [users]);

    const courseOptions = useMemo(() => {
        const set = new Set(
            users
                .filter(
                    (u) =>
                        u.role?.toLowerCase() === "student" &&
                        u.course &&
                        (instituteFilter === "All institutes" || u.institute === instituteFilter)
                )
                .map((u) => u.course)
        );
        return ["All courses", ...Array.from(set).sort()];
    }, [users, instituteFilter]);

    const isStudentFilter = roleFilter === "Student";

    const handleRoleFilterChange = (value) => {
        setRoleFilter(value);
        if (value !== "Student") {
            setInstituteFilter("All institutes");
            setCourseFilter("All courses");
        }
    };

    const handleInstituteFilterChange = (value) => {
        setInstituteFilter(value);
        setCourseFilter("All courses"); // course list depends on institute, so reset it
    };

    const filtered = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch =
                u.fullName.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase());
           const matchesRole =
                roleFilter === "All roles" ||
                u.role?.toLowerCase() === roleFilter.toLowerCase();
            const matchesInstitute =
                !isStudentFilter || instituteFilter === "All institutes" || u.institute === instituteFilter;
            const matchesCourse =
                !isStudentFilter || courseFilter === "All courses" || u.course === courseFilter;
            return matchesSearch && matchesRole && matchesInstitute && matchesCourse;
        });
    }, [users, search, roleFilter, instituteFilter, courseFilter, isStudentFilter]);

    // ---- Handlers ----

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

    const handleAddSubmit = (form) => {
        fetch(API_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to create user");
                return res.json();
            })
            .then((created) => {
                setUsers((prev) => [...prev, created]);
                closeModal();
            })
            .catch((err) => {
                console.error(err);
                alert("Couldn't create the user. Please try again.");
            });
    };

    const handleEditSubmit = (form) => {
        fetch(`${API_BASE}/${activeUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to update user");
                return res.json();
            })
            .then((updated) => {
                setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? updated : u)));
                closeModal();
            })
            .catch((err) => {
                console.error(err);
                alert("Couldn't save changes. Please try again.");
            });
    };

    const handleToggleStatus = (user) => {
        const nextStatus = user.status === "Suspended" ? "Active" : "Suspended";
        setBusyId(user.id);
        fetch(`${API_BASE}/${user.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to update status");
                return res.json();
            })
            .then(() => {
                setUsers((prev) =>
                    prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
                );
            })
            .catch((err) => {
                console.error(err);
                alert("Couldn't update the user's status. Please try again.");
            })
            .finally(() => setBusyId(null));
    };

    return (
        <div className="px-8 py-6 max-w-7xl">

            {/* PAGE INTRO */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        Users
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage student, faculty, and registrar accounts.
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
                    style={{ background: "#0E3B22" }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add User
                </button>
            </div>

            {/* FILTER BAR */}
            <div
                className="bg-white rounded-xl border p-3 mb-4 flex flex-wrap items-center gap-3"
                style={{ borderColor: "#E5E1D8" }}
            >
                {/* Search */}
                <div className="relative flex-1 min-w-[220px]">
                    <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-3.5-3.5" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email"
                        className="
                            w-full pl-9 pr-3 py-2.5 rounded-lg text-sm
                            border focus:outline-none focus:ring-2
                        "
                        style={{ borderColor: "#E5E1D8", "--tw-ring-color": "#106A2E" }}
                    />
                </div>

                {/* Role filter */}
                <select
                    value={roleFilter}
                    onChange={(e) => handleRoleFilterChange(e.target.value)}
                    className="text-sm border rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none"
                    style={{ borderColor: "#E5E1D8" }}
                >
                    {ROLE_FILTERS.map((r) => (
                        <option key={r}>{r}</option>
                    ))}
                </select>

                {/* Institute / Course filters — only relevant once "Student" is chosen */}
                {isStudentFilter && (
                    <>
                        <select
                            value={instituteFilter}
                            onChange={(e) => handleInstituteFilterChange(e.target.value)}
                            className="text-sm border rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none"
                            style={{ borderColor: "#E5E1D8" }}
                        >
                            {instituteOptions.map((i) => (
                                <option key={i}>{i}</option>
                            ))}
                        </select>

                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="text-sm border rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none"
                            style={{ borderColor: "#E5E1D8" }}
                        >
                            {courseOptions.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </>
                )}
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={loadUsers} className="font-semibold underline">Retry</button>
                </div>
            )}

            {/* TABLE */}
            <div
                className="bg-white rounded-xl border overflow-hidden"
                style={{ borderColor: "#E5E1D8" }}
            >
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b" style={{ borderColor: "#E5E1D8" }}>
                            <th className="text-left font-medium text-gray-400 px-5 py-3 text-xs uppercase tracking-wide">
                                Name
                            </th>
                            <th className="text-left font-medium text-gray-400 px-5 py-3 text-xs uppercase tracking-wide">
                                Role
                            </th>
                            <th className="text-left font-medium text-gray-400 px-5 py-3 text-xs uppercase tracking-wide">
                                Institute
                            </th>
                            <th className="text-left font-medium text-gray-400 px-5 py-3 text-xs uppercase tracking-wide">
                                Course
                            </th>
                            <th className="text-left font-medium text-gray-400 px-5 py-3 text-xs uppercase tracking-wide">
                                ID Number
                            </th>
                            <th className="text-left font-medium text-gray-400 px-5 py-3 text-xs uppercase tracking-wide">
                                Year
                            </th>
                            <th className="text-left font-medium text-gray-400 px-5 py-3 text-xs uppercase tracking-wide">
                                Status
                            </th>
                            <th className="text-center font-medium text-gray-400 px-5 py-3 text-xs uppercase tracking-wide">
                                Digital ID
                            </th>
                            <th className="text-left font-medium text-gray-400 px-5 py-3 text-xs uppercase tracking-wide">
                                Last active
                            </th>
                            <th className="text-right font-medium text-gray-400 px-5 py-3 text-xs uppercase tracking-wide">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && filtered.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-5 py-12 text-center">
                                    <p className="text-gray-700 font-medium">
                                        No users match your filters
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Try a different search term or clear the role/status filters.
                                    </p>
                                </td>
                            </tr>
                        )}

                        {loading && (
                            <tr>
                                <td colSpan={9} className="px-5 py-12 text-center text-gray-400 text-sm">
                                    Loading users…
                                </td>
                            </tr>
                        )}

                        {!loading && filtered.map((u, i) => (
                            <tr
                                key={u.id}
                                className={i !== filtered.length - 1 ? "border-b" : ""}
                                style={{ borderColor: "#F0EDE4" }}
                            >
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <Initials name={u.fullName} />
                                        <div>
                                            <p className="font-medium text-gray-800">{u.fullName}</p>
                                            <p className="text-gray-400 text-xs">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_STYLES[u.role] || "bg-gray-100 text-gray-700"}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-gray-600">
                                    {u.role === "Faculty"
                                        ? (u.institute || "—")
                                        : "—"}
                                </td>
                                <td className="px-5 py-3.5 text-gray-600">
                                    {u.role === "Student"
                                        ? (u.course || "—")
                                        : "—"}
                                </td>
                                <td className="px-5 py-3.5 text-gray-600">
                                    {(u.role === "Student" || u.role === "Faculty")
                                        ? (u.studentNumber || "—")
                                        : "—"}
                                </td>
                                <td className="px-5 py-3.5 text-gray-600">
                                    {u.role === "Student"
                                        ? (u.yearLevel || "—")
                                        : "—"}
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${STATUS_STYLES[u.status]}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            u.status === "Active" ? "bg-emerald-500" :
                                            u.status === "Pending" ? "bg-amber-500" : "bg-red-500"
                                        }`} />
                                        {u.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIGITAL_ID_STYLES[u.digitalIdStatus] || DIGITAL_ID_STYLES.None}`}>
                                        {u.digitalIdStatus || "None"}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-gray-500">
                                    {u.lastActive
                                            ? new Date(u.lastActive).toLocaleString("en-PH")
                                            : "—"}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => openView(u)}
                                            className="text-xs font-semibold text-[#106A2E] hover:underline"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => openEdit(u)}
                                            className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(u)}
                                            disabled={busyId === u.id}
                                            className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40"
                                        >
                                            {busyId === u.id
                                                ? "…"
                                                : u.status === "Suspended" ? "Reinstate" : "Suspend"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-400">
                    Showing {filtered.length} of {users.length} users
                </p>
                <div className="flex items-center gap-2">
                    <button
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border text-gray-500 disabled:opacity-40"
                        style={{ borderColor: "#E5E1D8" }}
                        disabled
                    >
                        Previous
                    </button>
                    <span className="text-xs text-gray-400">Page 1 of 1</span>
                    <button
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border text-gray-500 disabled:opacity-40"
                        style={{ borderColor: "#E5E1D8" }}
                        disabled
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* ADD USER MODAL */}
            {modal === "add" && (
                <Modal title="Add user" onClose={closeModal}>
                    <UserForm onCancel={closeModal} onSubmit={handleAddSubmit} submitLabel="Create user" />
                </Modal>
            )}

            {/* EDIT USER MODAL */}
            {modal === "edit" && activeUser && (
                <Modal title="Edit user" onClose={closeModal}>
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
                <Modal title="User details" onClose={closeModal}>
                    <div className="flex items-center gap-3 mb-4">
                        <Initials name={activeUser.fullName} />
                        <div>
                            <p className="font-medium text-gray-800">{activeUser.fullName}</p>
                            <p className="text-gray-400 text-xs">{activeUser.email}</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Role</span>
                            <span className="font-medium text-gray-800">{activeUser.role}</span>
                        </div>
                       {(activeUser.role === "Student" || activeUser.role === "Faculty") && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">ID Number</span>
                                    <span className="font-medium text-gray-800">{activeUser.studentNumber || "—"}</span>
                                </div>
                                
                                {activeUser.role === "Faculty" && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Institute</span>
                                        <span className="font-medium">
                                            {activeUser.institute || "—"}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Course</span>
                                    <span className="font-medium text-gray-800">{activeUser.course || "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Year level</span>
                                    <span className="font-medium text-gray-800">{activeUser.yearLevel || "—"}</span>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <span className="font-medium text-gray-800">{activeUser.status}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Digital ID</span>
                            <span className="font-medium text-gray-800">{activeUser.digitalIdStatus || "None"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Last active</span>
                            <span className="font-medium text-gray-800">{activeUser.lastActive? new Date(activeUser.lastActive).toLocaleString("en-PH") : "—"}</span>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={closeModal}
                            className="text-xs font-semibold px-4 py-2 rounded-lg border text-gray-600"
                            style={{ borderColor: "#E5E1D8" }}
                        >
                            Close
                        </button>
                    </div>
                </Modal>
            )}

        </div>
    );
}