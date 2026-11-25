import AdminFilterPanel from "./AdminFilterPanel";
import AdminPageHeader from "./AdminPageHeader";
import UserSupportingDocument from "./UserSupportingDocument";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
    Plus,
    Search,
    Eye,
    Pencil,
    X,
    RefreshCw,
    Users as UsersIcon,
    UserCheck,
    Clock3,
    History,
    LogOut,
    Ban,
    Trash2,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
} from "lucide-react";
import { API_URL } from "../../config/api";
import {
    ConfirmDialog,
    CredentialsModal,
    ErrorNote,
    FormActions,
    Initials,
    LoadingSkeleton,
    Modal,
    PasswordFields,
    RolePill,
    RowMenu,
    SelectField,
    SortHeader,
    StatusPill,
    TextField,
    UserForm,
} from "./userAdminShared";
import {
    AUTH_BASE,
    API_BASE,
    FONTS_HREF,
    FONTS_LINK_ID,
    PAGE_SIZES,
    STATUS_FILTERS,
    INSTITUTES,
    INSTITUTE_PROGRAMS,
    focusRing,
    formatDate,
    getInstitute,
    getInstituteFromCourse,
    ghostButton,
    iconButton,
    isAdminRole,
    outlineButton,
    request,
    roleLabel,
    selectClass,
    thClass,
    timeAgo,
    validatePassword,
} from "./userAdminUtils";

// ─────────────────────────────────────────────────────────────
// Student and faculty directory. Administrative account creation and module
// assignments continue to use the existing Service Heads console.
// ─────────────────────────────────────────────────────────────
const ROLE_FILTERS = ["All", "Student", "Faculty"];
const MEMBER_ROLE_OPTIONS = ["Student", "Faculty"];

// Students + faculty only - heads and admins live on ServiceHeads.jsx.
const isMemberRole = (role) => role === "Student" || role === "Faculty";
const serviceAccessFor = (user) => {
    if (user.status !== "Active") return "Unavailable while account is inactive";
    if (user.adminModule) return user.adminModule;
    const role = String(user.role || "").toLowerCase();
    if (role === "admin" || role === "superadmin" || role === "student" || role === "faculty") {
        return "Library, Clinic, Guidance, Lost & Found";
    }
    if (role.includes("library")) return "Library";
    if (role.includes("clinic")) return "Clinic";
    if (role.includes("guidance") || role.includes("counselor")) return "Guidance";
    if (role.includes("lostfound") || role.includes("lost & found")) return "Lost & Found";
    return "No module access assigned";
};

// ─────────────────────────────────────────────────────────────
// Small label/value block used in the View modal (local only,
// so the shared DetailRow used by other pages is untouched).
// ─────────────────────────────────────────────────────────────
function InfoItem({ label, children }) {
    return (
        <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {label}
            </dt>
            <dd className="mt-1 break-words text-sm font-medium text-gray-800">
                {children || "—"}
            </dd>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Member form (add student / faculty)
// ─────────────────────────────────────────────────────────────
function MemberForm({ onCancel, onSubmit, submitting, serverError }) {
    const [form, setForm] = useState({
        role: "Student",
        fullName: "",
        email: "",
        idNumber: "",
        institute: "",
        course: "",
        yearLevel: "",
        contactNumber: "",
        password: "",
        confirmPassword: "",
    });
    const [localError, setLocalError] = useState("");

    const isStudent = form.role === "Student";
    const isFaculty = form.role === "Faculty";

    const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const patch = (values) => {
        setForm((f) => ({ ...f, ...values }));
        setLocalError("");
    };

    const allPrograms = Object.values(INSTITUTE_PROGRAMS).flat();

    const handleRoleChange = (e) => {
        const role = e.target.value;

        setForm((f) => ({
            ...f,
            role,
            institute: role === "Faculty" ? f.institute : "",
            course: role === "Student" ? f.course : "",
            yearLevel: role === "Student" ? f.yearLevel : "",
        }));
    };

    const handleCourseChange = (e) => {
        const course = e.target.value;

        setForm((f) => ({
            ...f,
            course,
            institute: getInstituteFromCourse(course),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (submitting) return;

        const message = validatePassword(form.password, form.confirmPassword);
        if (message) {
            setLocalError(message);
            return;
        }

        setLocalError("");

        onSubmit({
            role: form.role,
            fullName: form.fullName.trim(),
            email: form.email.trim().toLowerCase(),
            idNumber: form.idNumber.trim(),
            institute: isStudent ? getInstituteFromCourse(form.course) : form.institute,
            course: isStudent ? form.course : "",
            yearLevel: isStudent ? form.yearLevel.trim() : "",
            contactNumber: form.contactNumber.trim(),
            password: form.password,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] leading-4 text-emerald-700">
                Direktang gumagawa ng Student o Faculty account. Aktibo ito at makaka-login agad ang
                user.
            </p>

            <SelectField
                label="Role"
                value={form.role}
                onChange={handleRoleChange}
                options={MEMBER_ROLE_OPTIONS.map((r) => ({ value: r, label: roleLabel(r) }))}
            />

            <TextField label="Full name" required value={form.fullName} onChange={update("fullName")} />

            <TextField
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={update("email")}
            />

            <TextField
                label={isStudent ? "Student number" : "Employee ID"}
                required
                value={form.idNumber}
                onChange={update("idNumber")}
                placeholder={isStudent ? "e.g. 26-00000" : "e.g. EMP-2024-001"}
            />

            {isStudent && (
                <>
                    <SelectField
                        label="Program"
                        required
                        value={form.course}
                        onChange={handleCourseChange}
                        placeholder="Select program"
                        options={allPrograms}
                    />

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <TextField
                                label="Institute"
                                readOnly
                                value={getInstituteFromCourse(form.course)}
                                placeholder="Auto from program"
                            />
                        </div>

                        <div className="flex-1">
                            <TextField
                                label="Year level"
                                required
                                value={form.yearLevel}
                                onChange={update("yearLevel")}
                                placeholder="e.g. 3rd Year"
                            />
                        </div>
                    </div>
                </>
            )}

            {isFaculty && (
                <SelectField
                    label="Institute"
                    required
                    value={form.institute}
                    onChange={update("institute")}
                    placeholder="Select institute"
                    options={INSTITUTES}
                />
            )}

            <TextField
                label="Contact number (optional)"
                value={form.contactNumber}
                onChange={update("contactNumber")}
                placeholder="e.g. 09123456789"
            />

            <PasswordFields
                password={form.password}
                confirmPassword={form.confirmPassword}
                onChange={patch}
            />

            <ErrorNote message={localError || serverError} />

            <FormActions
                onCancel={onCancel}
                submitting={submitting}
                submitLabel={`Create ${form.role.toLowerCase()}`}
                submittingLabel="Creating..."
            />
        </form>
    );
}

// ─────────────────────────────────────────────────────────────
// Main users page (students + faculty only)
// ─────────────────────────────────────────────────────────────
export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All statuses");
    const [instituteFilter, setInstituteFilter] = useState("All institutes");
    const [courseFilter, setCourseFilter] = useState("All courses");
    const [directoryView, setDirectoryView] = useState("all");

    const [sort, setSort] = useState({ key: null, dir: "asc" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [modal, setModal] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [loginHistory, setLoginHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");
    const [editing, setEditing] = useState(false);
    const [editError, setEditError] = useState("");

    const [confirm, setConfirm] = useState(null);
    const [credentials, setCredentials] = useState(null);

    const currentEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
    const isSuperAdmin = (localStorage.getItem("userRole") || "").toLowerCase() === "superadmin";
    const isSelf = (user) => Boolean(currentEmail) && user.email?.toLowerCase() === currentEmail;

    // ── Fonts (same as AdminProfile / Announcements) ────────
    useEffect(() => {
        if (document.getElementById(FONTS_LINK_ID)) return;
        const link = document.createElement("link");
        link.id = FONTS_LINK_ID;
        link.rel = "stylesheet";
        link.href = FONTS_HREF;
        document.head.appendChild(link);
    }, []);

    // ── Load users ──────────────────────────────────────────
    const loadUsers = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);

        try {
            const data = await request(API_BASE, {
                fallback: "Failed to load users",
                messages: { 403: "You don't have permission to view users." },
            });

            setUsers(Array.isArray(data) ? data.filter((user) => isMemberRole(user.role)) : []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(
                err.status
                    ? err.message
                    : "Couldn't load users. Is the API running?"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // ── Profile pictures ────────────────────────────────
    // GET /api/auth/users doesn't include profilePicture,
    // but the public GET /api/profile/{email} does (the file
    // lives in wwwroot/uploads/profile). Fetch them in
    // parallel and map email -> path so the table can show
    // each user's photo instead of the initials circle.
    const [pictures, setPictures] = useState({});

    useEffect(() => {
        if (!users.length) {
            setPictures({});
            return;
        }

        let cancelled = false;

        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("authToken");

        Promise.all(
            users.map((u) =>
                fetch(`${API_URL}/api/profile/${encodeURIComponent(u.email)}`, {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                })
                    .then((r) => (r.ok ? r.json() : null))
                    .then((d) => ({
                        email: String(u.email || "").toLowerCase(),
                        picture: d?.profilePicture || null,
                    }))
                    .catch(() => null)
                )
        ).then((rows) => {
            if (cancelled) return;

            const map = {};
            for (const row of rows) {
                if (row?.email && row.picture) {
                    map[row.email] = row.picture;
                }
            }
            setPictures(map);
        });

        return () => {
            cancelled = true;
        };
    }, [users]);

    // ── Filters (students + faculty only) ─────────────────
    const showCourseFilter = roleFilter === "All" || roleFilter === "Student";

    const instituteOptions = useMemo(() => {
        const set = new Set(
            users
                .filter((u) => isMemberRole(u.role) && getInstitute(u))
                .map((u) => getInstitute(u))
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
                        (instituteFilter === "All institutes" || getInstitute(u) === instituteFilter)
                )
                .map((u) => u.course)
        );

        return ["All courses", ...Array.from(set).sort()];
    }, [users, instituteFilter]);

    const handleRoleFilterChange = (value) => {
        setRoleFilter(value);
        setInstituteFilter("All institutes");
        setCourseFilter("All courses");
    };

    const handleInstituteFilterChange = (value) => {
        setInstituteFilter(value);
        setCourseFilter("All courses");
    };

    const clearAllFilters = () => {
        setSearch("");
        setDirectoryView("all");
        setRoleFilter("All");
        setStatusFilter("All statuses");
        setInstituteFilter("All institutes");
        setCourseFilter("All courses");
    };

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((u) => {
            const role = String(u.role || "").toLowerCase();
            const matchesView = (directoryView === "all" && u.status !== "Deleted")
                || (directoryView === "students" && role === "student")
                || (directoryView === "faculty" && role === "faculty")
                || (directoryView === "inactive" && u.status !== "Active" && u.status !== "Deleted");
            if (!matchesView) return false;

            const matchesSearch =
                !query ||
                [
                    u.fullName,
                    u.email,
                    u.idNumber,
                    u.role,
                    roleLabel(u.role),
                    u.institute,
                    u.course,
                    u.yearLevel,
                    u.status,
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(query));

            const matchesRole = roleFilter === "All"
                || u.role === roleFilter;

            const matchesStatus = statusFilter === "All statuses" || u.status === statusFilter;

            const matchesInstitute =
                instituteFilter === "All institutes" ||
                getInstitute(u) === instituteFilter;

            const matchesCourse =
                !showCourseFilter || courseFilter === "All courses" || u.course === courseFilter;

            return matchesSearch && matchesRole && matchesStatus && matchesInstitute && matchesCourse;
        });
    }, [
        users,
        directoryView,
        search,
        roleFilter,
        statusFilter,
        instituteFilter,
        courseFilter,
        showCourseFilter,
    ]);

    const activeChips = [];
    if (search.trim()) {
        activeChips.push({ key: "search", label: `Search: "${search.trim()}"`, clear: () => setSearch("") });
    }
    if (roleFilter !== "All") {
        activeChips.push({
            key: "role",
            label: roleFilter,
            clear: () => handleRoleFilterChange("All"),
        });
    }
    if (statusFilter !== "All statuses") {
        activeChips.push({ key: "status", label: statusFilter, clear: () => setStatusFilter("All statuses") });
    }
    if (instituteFilter !== "All institutes") {
        activeChips.push({
            key: "institute",
            label: instituteFilter,
            clear: () => handleInstituteFilterChange("All institutes"),
        });
    }
    if (showCourseFilter && courseFilter !== "All courses") {
        activeChips.push({ key: "course", label: courseFilter, clear: () => setCourseFilter("All courses") });
    }

    // ── Sort + paginate ─────────────────────────────────────
    const toggleSort = (key) => {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            if (prev.dir === "asc") return { key, dir: "desc" };
            return { key: null, dir: "asc" };
        });
    };

    const sorted = useMemo(() => {
        if (!sort.key) return filtered;

        const dir = sort.dir === "asc" ? 1 : -1;

        return [...filtered].sort((a, b) => {
            if (sort.key === "lastActive") {
                const ta = a.lastActive ? new Date(a.lastActive).getTime() : null;
                const tb = b.lastActive ? new Date(b.lastActive).getTime() : null;
                if (ta === null && tb === null) return 0;
                if (ta === null) return 1; // empty values always last
                if (tb === null) return -1;
                return (ta - tb) * dir;
            }

            const va = String(a[sort.key] || "").toLowerCase();
            const vb = String(b[sort.key] || "").toLowerCase();
            return va.localeCompare(vb) * dir;
        });
    }, [filtered, sort]);

    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, statusFilter, instituteFilter, courseFilter, directoryView, sort, pageSize]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * pageSize;
    const pageItems = sorted.slice(pageStart, pageStart + pageSize);

    // ── Stats (students + faculty only) ───────────────────
    const stats = useMemo(() => {
        const accounts = users.filter((u) => u.status !== "Deleted");
        const count = (status) => accounts.filter((u) => u.status === status).length;

        return [
            { key: "All statuses", kind: "status", label: "Total users", value: accounts.length, icon: UsersIcon, tone: "bg-gray-100 text-[#1F1F1F]", number: "text-[#1F1F1F]" },
            { key: "Active", kind: "status", label: "Active", value: count("Active"), icon: UserCheck, tone: "bg-[#E1F0E4] text-[#106A2E]", number: "text-[#106A2E]" },
            { key: "Pending", kind: "status", label: "Pending", value: count("Pending"), icon: Clock3, tone: "bg-amber-50 text-amber-600", number: "text-amber-600" },
            { key: "Suspended", kind: "status", label: "Suspended", value: count("Suspended"), icon: Ban, tone: "bg-red-50 text-red-500", number: "text-red-600" },
        ];
    }, [users]);

    const applyStatFilter = (stat) => {
        setStatusFilter(stat.key);
    };

    const isStatSelected = (stat) =>
        statusFilter === stat.key;

    // ── Modal helpers ───────────────────────────────────────
    const openAddMember = () => {
        setActiveUser(null);
        setAddError("");
        setModal("add-member");
    };

    const openView = async (user) => {
        setActiveUser(user);
        setModal("view");
        setLoginHistory(null);
        setHistoryLoading(true);
        try {
            const data = await request(`${API_URL}/api/admin/security/users/${user.id}/login-history`, {
                fallback: "Could not load login history.",
            });
            setLoginHistory(data);
        } catch (err) {
            setLoginHistory({ error: err.message || "Login history is unavailable." });
        } finally {
            setHistoryLoading(false);
        }
    };

    const signOutEverywhere = async (user) => {
        try {
            await request(`${API_URL}/api/admin/security/users/${user.id}/sign-out-all?reason=${encodeURIComponent("Administrator signed out all user sessions")}`, {
                method: "POST",
                fallback: "Could not sign the user out.",
            });
            toast.success("User sessions signed out.");
            await openView(user);
        } catch (err) {
            toast.error(err.message || "Could not sign the user out.");
        }
    };

    const sendPasswordReset = async (user) => {
        try {
            await request(`${AUTH_BASE}/forgot-password`, {
                method: "POST",
                fallback: "Could not start the secure password reset process.",
                body: { email: user.email },
            });
            toast.success(`Password reset code sent to ${user.email}.`);
        } catch (err) {
            toast.error(err.message || "Could not send the password reset code.");
        }
    };

    const openEdit = (user) => {
        setActiveUser(user);
        setEditError("");
        setModal("edit");
    };

    const closeModal = useCallback(() => {
        if (adding || editing) return;

        setModal(null);
        setActiveUser(null);
        setAddError("");
        setEditError("");
    }, [adding, editing]);

    const closeConfirm = useCallback(() => setConfirm(null), []);
    const closeCredentials = useCallback(() => setCredentials(null), []);

    // ── Add member ──────────────────────────────────────────
    const handleAddMember = async (form) => {
        setAdding(true);
        setAddError("");

        try {
            await request(`${AUTH_BASE}/members`, {
                method: "POST",
                fallback: "Failed to create account",
                messages: {
                    403: "Only the Super Admin or Admin can add students and faculty.",
                    404: "The add-member endpoint was not found. Make sure the API is updated.",
                },
                body: {
                    role: form.role,
                    fullName: form.fullName,
                    email: form.email,
                    password: form.password,
                    idNumber: form.idNumber,
                    institute: form.institute || null,
                    course: form.course || null,
                    yearLevel: form.yearLevel || null,
                    contactNumber: form.contactNumber || null,
                },
            });

            setModal(null);
            setActiveUser(null);
            setCredentials({
                role: form.role,
                fullName: form.fullName,
                email: form.email,
                password: form.password,
            });

            await loadUsers({ silent: true });
        } catch (err) {
            console.error("Failed to create member:", err);
            setAddError(err.message || "Couldn't create the account. Please try again.");
        } finally {
            setAdding(false);
        }
    };

    // ── Edit user ───────────────────────────────────────────
    const saveEdit = async (form) => {
        if (!activeUser) return;

        setEditing(true);
        setEditError("");

        try {
            const data = await request(`${API_BASE}/${activeUser.id}`, {
                method: "PUT",
                fallback: "Failed to update user.",
                messages: { 403: "You don't have permission to edit this user." },
                body: {
                    email: form.email,
                    role: form.role,
                    adminModule: form.adminModule || null,
                    institute: form.role === "Faculty" ? form.institute || null : null,
                    course: form.role === "Student" ? form.course || null : null,
                    yearLevel: form.role === "Student" ? form.yearLevel || null : null,
                },
            });

            const updated = data?.user || data;

            setUsers((prev) =>
                prev.map((u) =>
                    u.id === activeUser.id
                        ? {
                              ...u,
                              ...(updated && typeof updated === "object" ? updated : {}),
                              id: activeUser.id,
                              fullName: activeUser.fullName,
                              idNumber: activeUser.idNumber,
                          }
                        : u
                )
            );

            setModal(null);
            setActiveUser(null);
            toast.success("User updated successfully.");
        } catch (err) {
            console.error("Failed to update user:", err);
            setEditError(err.message || "Couldn't save changes. Please try again.");
        } finally {
            setEditing(false);
        }
    };

    const handleEditSubmit = (form) => {
        const escalating = isAdminRole(form.role) && !isAdminRole(activeUser.role);

        if (!escalating) {
            saveEdit(form);
            return;
        }

        setConfirm({
            title: "Grant admin access?",
            description: `${activeUser.fullName} will become ${roleLabel(form.role)} and will be able to manage parts of the system. Make sure this is intended.`,
            confirmLabel: "Grant access",
            tone: "primary",
            onConfirm: () => saveEdit(form),
        });
    };

    // ── Suspend / reinstate ─────────────────────────────────
    const performToggleStatus = async (user) => {
        const nextStatus = user.status === "Suspended" ? "Active" : "Suspended";

        setBusyId(user.id);

        try {
            const data = await request(`${API_BASE}/${user.id}/status`, {
                method: "PUT",
                body: { status: nextStatus },
                fallback: "Failed to update status.",
                messages: { 403: "You don't have permission to change this user's status." },
            });

            setUsers((prev) =>
                prev.map((u) =>
                    u.id === user.id ? { ...u, ...(data?.user || {}), status: nextStatus } : u
                )
            );

            toast.success(
                nextStatus === "Suspended" ? "Account suspended." : "Account reinstated."
            );
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Couldn't update the user's status. Please try again.");
        } finally {
            setBusyId(null);
        }
    };

    const requestToggleStatus = (user) => {
        const suspending = user.status !== "Suspended";

        setConfirm({
            title: suspending ? "Suspend account?" : "Reinstate account?",
            description: suspending
                ? `${user.fullName}'s account will be marked as Suspended. You can reinstate it anytime.`
                : `${user.fullName}'s account will be marked as Active again.`,
            confirmLabel: suspending ? "Suspend" : "Reinstate",
            tone: suspending ? "danger" : "primary",
            onConfirm: () => performToggleStatus(user),
        });
    };

    // ── Delete (soft delete) ────────────────────────────────
    const performDelete = async (user, clearActivity) => {
        setBusyId(user.id);

        try {
            const path = `${API_BASE}/${user.id}${clearActivity ? "/account-and-activity" : ""}`;
            const data = await request(path, {
                method: "DELETE",
                fallback: "Failed to delete the account.",
                messages: { 403: "You don't have permission to delete this account." },
            });

            setUsers((prev) => prev.map((u) => (u.id === user.id
                ? { ...u, status: "Deleted", lastActive: clearActivity ? null : u.lastActive }
                : u)));

            if (activeUser?.id === user.id) {
                setModal(null);
                setActiveUser(null);
            }

            toast.success(data?.message || "User account deleted successfully.");
        } catch (err) {
            console.error("Failed to delete user:", err);
            toast.error(err.message || "Couldn't delete the user account. Please try again.");
        } finally {
            setBusyId(null);
        }
    };

    const requestDelete = (user, clearActivity = false) => {
        setConfirm({
            title: clearActivity ? "Delete account and activity?" : "Delete account?",
            description: clearActivity
                ? `${user.fullName}'s account will be disabled and its activity log entries permanently deleted. Session records and security events will be retained. The deletion will be recorded in the admin audit log.`
                : `${user.fullName}'s account will be disabled. Its activity history will be retained.`,
            confirmLabel: clearActivity ? "Delete account and activity" : "Delete",
            tone: "danger",
            onConfirm: () => performDelete(user, clearActivity),
        });
    };

    // ── Row action rules ────────────────────────────────────
    const canSuspend = (u) =>
        !["Deleted", "Rejected"].includes(u.status) && u.role !== "SuperAdmin" && !isSelf(u);

    const canDelete = (u) => u.status !== "Deleted" && u.role !== "SuperAdmin" && !isSelf(u);

    const menuItems = (u) => {
        const items = [];

        if (canSuspend(u)) {
            items.push(
                u.status === "Suspended"
                    ? { label: "Reinstate", icon: RotateCcw, onClick: () => requestToggleStatus(u) }
                    : { label: "Suspend", icon: Ban, onClick: () => requestToggleStatus(u) }
            );
        }

        if (canDelete(u)) {
            items.push({ label: "Delete", icon: Trash2, danger: true, onClick: () => requestDelete(u) });
        }

        if (isSuperAdmin && u.role !== "SuperAdmin" && !isSelf(u) && (u.status !== "Deleted" || u.lastActive)) {
            items.push({ label: "Delete account and activity", icon: Trash2, danger: true, onClick: () => requestDelete(u, true) });
        }

        return items;
    };

    const renderActions = (u) => (
        <div className="flex items-center justify-end gap-1">
            {busyId === u.id ? (
                <RefreshCw size={15} className="mr-2 animate-spin text-gray-400" />
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => openView(u)}
                        aria-label={`View ${u.fullName}`}
                        className={iconButton}
                    >
                        <Eye size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={() => openEdit(u)}
                        aria-label={`Edit ${u.fullName}`}
                        className={iconButton}
                    >
                        <Pencil size={15} />
                    </button>

                    <RowMenu items={menuItems(u)} label={`More actions for ${u.fullName}`} />
                </>
            )}
        </div>
    );

    // ── Render ──────────────────────────────────────────────
    const hasFilters = activeChips.length > 0;
    const rangeStart = sorted.length === 0 ? 0 : pageStart + 1;
    const rangeEnd = Math.min(pageStart + pageSize, sorted.length);

    return (
        <div className="admin-page users-root">
            <style>{`
                .users-root { font-family: 'Inter', system-ui, sans-serif; }
                @media (prefers-reduced-motion: reduce) {
                    .users-root * { transition: none !important; animation: none !important; }
                }
            `}</style>

            {/* Header */}
            <AdminPageHeader icon="users" title="Users" description="Manage Student and Faculty accounts and review their service access.">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => loadUsers()}
                        disabled={loading}
                        className={ghostButton}
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>

                    <button type="button" onClick={openAddMember} className={outlineButton}>
                        <Plus size={16} />
                        Add Student / Faculty
                    </button>
                </div>
            </AdminPageHeader>

            <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="User account views">
                {[["all", "All users"], ["students", "Students"], ["faculty", "Faculty"], ["inactive", "Inactive accounts"]].map(([key, label]) => {
                    const count = key === "all" ? users.filter(u => u.status !== "Deleted").length
                        : key === "students" ? users.filter(u => u.role === "Student").length
                        : key === "faculty" ? users.filter(u => u.role === "Faculty").length
                        : users.filter(u => u.status !== "Active" && u.status !== "Deleted").length;
                    return <button key={key} type="button" role="tab" aria-selected={directoryView === key}
                        onClick={() => { setDirectoryView(key); setRoleFilter("All"); setPage(1); }}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${directoryView === key ? "border-[#0E3B22] bg-[#0E3B22] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
                        {label} <span className="ml-1 opacity-75">{count}</span>
                    </button>;
                })}
            </div>

            {/* Stats (also status filters) */}
            <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {stats.map((stat) => {
                    const StatIcon = stat.icon;
                    const selected = isStatSelected(stat);

                    return (
                        <button
                            key={`${stat.kind}:${stat.key}`}
                            type="button"
                            onClick={() => applyStatFilter(stat)}
                            aria-pressed={selected}
                            className={`admin-surface rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition ${focusRing} ${
                                selected
                                    ? "border-[#106A2E]/40 ring-2 ring-[#106A2E]/20"
                                    : "border-gray-200 hover:border-gray-200"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">{stat.label}</p>

                                    {loading ? (
                                        <div className="mt-2 h-8 w-10 animate-pulse rounded bg-gray-200" />
                                    ) : (
                                        <p className={`mt-1 font-semibold text-3xl ${stat.number}`}>
                                            {stat.value}
                                        </p>
                                    )}
                                </div>

                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.tone}`}
                                >
                                    <StatIcon size={17} />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Filter bar */}
            <AdminFilterPanel>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[220px] flex-1">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, ID, role..."
                            aria-label="Search users"
                            className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => handleRoleFilterChange(e.target.value)}
                        aria-label="Filter by role"
                        className={selectClass}
                    >
                        {ROLE_FILTERS.map((role) => (
                            <option key={role} value={role}>
                                {role === "All" ? "All roles" : role}
                            </option>
                        ))}
                    </select>

                    <select
                        value={instituteFilter}
                        onChange={(e) => handleInstituteFilterChange(e.target.value)}
                        aria-label="Filter by institute"
                        className={`${selectClass} max-w-[240px]`}
                    >
                        {instituteOptions.map((institute) => (
                            <option key={institute} value={institute}>
                                {institute}
                            </option>
                        ))}
                    </select>

                    {showCourseFilter && (
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            aria-label="Filter by program"
                            className={`${selectClass} max-w-[240px]`}
                        >
                            {courseOptions.map((course) => (
                                <option key={course} value={course}>
                                    {course}
                                </option>
                            ))}
                        </select>
                    )}

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        aria-label="Filter by status"
                        className={selectClass}
                    >
                        {STATUS_FILTERS.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>

                {hasFilters && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#F0EDE4] pt-3">
                        {activeChips.map((chip) => (
                            <span
                                key={chip.key}
                                className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#E1F0E4] py-1 pl-3 pr-1.5 text-xs font-medium text-[#106A2E]"
                            >
                                <span className="truncate">{chip.label}</span>
                                <button
                                    type="button"
                                    onClick={chip.clear}
                                    aria-label={`Remove filter ${chip.label}`}
                                    className={`rounded-full p-0.5 hover:bg-[#0E3B22]/10 ${focusRing}`}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}

                        <button
                            type="button"
                            onClick={clearAllFilters}
                            className={`rounded text-xs font-semibold text-gray-500 hover:text-gray-800 hover:underline ${focusRing}`}
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </AdminFilterPanel>

            {/* Error */}
            {error && (
                <div
                    role="alert"
                    className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => loadUsers()}
                        className={`rounded font-semibold underline ${focusRing}`}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Results */}
            <div className="admin-surface overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {loading ? (
                    <LoadingSkeleton />
                ) : sorted.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-transparent text-gray-300">
                            <UsersIcon size={20} />
                        </div>

                        <p className="mt-4 font-medium text-gray-700">
                            {hasFilters ? "No users match your filters" : "No users yet"}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                            {hasFilters
                                ? "Try a different search term or clear the filters."
                                : "Add a student or faculty member to get started."}
                        </p>

                        {hasFilters && (
                            <button type="button" onClick={clearAllFilters} className={`mt-5 ${ghostButton}`}>
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden max-h-[70vh] overflow-auto md:block">
                            <table className="w-full min-w-[800px] text-sm">
                                <thead>
                                    <tr>
                                        <SortHeader
                                            label="User"
                                            sortKey="fullName"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />

                                        <th className={thClass}>ID number</th>

                                        <th className={thClass}>Role</th>

                                        <SortHeader
                                            label="Status"
                                            sortKey="status"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />

                                        <SortHeader
                                            label="Last login"
                                            sortKey="lastActive"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />

                                        <th className={`${thClass} text-right`}>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pageItems.map((u, i) => (
                                        <tr
                                            key={u.id}
                                            className={`transition hover:bg-gray-50/70 ${
                                                i !== pageItems.length - 1 ? "border-b border-[#F0EDE4]" : ""
                                            } ${u.status === "Deleted" ? "opacity-60" : ""}`}
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <Initials name={u.fullName} picture={pictures[u.email?.toLowerCase()]} />

                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-gray-800">
                                                            {u.fullName}
                                                        </p>
                                                        <p className="truncate text-xs text-gray-400">
                                                            {u.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-gray-600">
                                                {u.idNumber || "—"}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <RolePill role={u.role} />
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <StatusPill status={u.status} />
                                            </td>

                                            <td
                                                className="whitespace-nowrap px-5 py-3.5 text-gray-500"
                                                title={formatDate(u.lastActive)}
                                            >
                                                {timeAgo(u.lastActive)}
                                            </td>

                                            <td className="px-5 py-3.5">{renderActions(u)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <ul className="divide-y divide-[#F0EDE4] md:hidden">
                            {pageItems.map((u) => (
                                <li
                                    key={u.id}
                                    className={`px-4 py-4 ${u.status === "Deleted" ? "opacity-60" : ""}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Initials name={u.fullName} picture={pictures[u.email?.toLowerCase()]} />

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-gray-800">{u.fullName}</p>
                                            <p className="truncate text-xs text-gray-400">{u.email}</p>

                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <RolePill role={u.role} />
                                                <StatusPill status={u.status} />
                                            </div>

                                            <p className="mt-2 text-xs text-gray-400">
                                                {[
                                                    u.idNumber,
                                                    `Last login ${timeAgo(u.lastActive)}`,
                                                ]
                                                    .filter(Boolean)
                                                    .join("  •  ")}
                                            </p>
                                        </div>

                                        {renderActions(u)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            {/* Pagination */}
            {!loading && sorted.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-400">
                        Showing {rangeStart}–{rangeEnd} of {sorted.length} users
                        {sorted.length !== users.length && ` (${users.length} total)`}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-gray-500">
                            Rows
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#106A2E]"
                            >
                                {PAGE_SIZES.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                aria-label="Previous page"
                                className={`inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 ${focusRing}`}
                            >
                                <ChevronLeft size={14} />
                                Previous
                            </button>

                            <span className="text-xs text-gray-400">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() => setPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                aria-label="Next page"
                                className={`inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 ${focusRing}`}
                            >
                                Next
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add member */}
            {modal === "add-member" && (
                <Modal title="Add student / faculty" onClose={closeModal} locked={adding}>
                    <MemberForm
                        onCancel={closeModal}
                        onSubmit={handleAddMember}
                        submitting={adding}
                        serverError={addError}
                    />
                </Modal>
            )}

            {/* Edit user */}
            {modal === "edit" && activeUser && (
                <Modal title="Edit user" onClose={closeModal} locked={editing}>
                    <UserForm
                        initial={activeUser}
                        allowedRoles={MEMBER_ROLE_OPTIONS}
                        onCancel={closeModal}
                        onSubmit={handleEditSubmit}
                        submitting={editing}
                        serverError={editError}
                        submitLabel="Save changes"
                    />
                </Modal>
            )}

            {/* View user */}
            {modal === "view" && activeUser && (
                <Modal title="User details" onClose={closeModal} size="max-w-3xl">
                    {/* Profile header */}
                    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E1F0E4] bg-gradient-to-br from-[#E1F0E4]/70 via-white to-white p-4 sm:p-5">
                        <Initials
                            name={activeUser.fullName}
                            size="w-16 h-16 text-base ring-4 ring-white shadow-sm"
                            picture={pictures[activeUser.email?.toLowerCase()]}
                        />

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-lg font-semibold text-gray-900">{activeUser.fullName}</p>
                            <p className="truncate text-sm text-gray-500">{activeUser.email}</p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <RolePill role={activeUser.role} />
                                <StatusPill status={activeUser.status} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {/* Account information */}
                        <section
                            className="rounded-2xl border border-gray-200 bg-white p-4"
                            aria-label="Account information"
                        >
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">Account information</h3>

                            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                                <InfoItem label="ID number">{activeUser.idNumber}</InfoItem>
                                <InfoItem label="Role">{roleLabel(activeUser.role)}</InfoItem>

                                {activeUser.role === "Student" && (
                                    <>
                                        <InfoItem label="Year level">{activeUser.yearLevel}</InfoItem>
                                        <InfoItem label="Institute">{getInstitute(activeUser)}</InfoItem>
                                        <div className="col-span-2">
                                            <InfoItem label="Program">{activeUser.course}</InfoItem>
                                        </div>
                                    </>
                                )}

                                {activeUser.role === "Faculty" && (
                                    <div className="col-span-2">
                                        <InfoItem label="Institute">{activeUser.institute}</InfoItem>
                                    </div>
                                )}

                                {activeUser.adminModule && (
                                    <div className="col-span-2">
                                        <InfoItem label="Assigned module">{activeUser.adminModule}</InfoItem>
                                    </div>
                                )}

                                <div className="col-span-2">
                                    <InfoItem label="Service access">{serviceAccessFor(activeUser)}</InfoItem>
                                </div>

                                <InfoItem label="Registered">{formatDate(activeUser.registrationDate)}</InfoItem>
                                <InfoItem label="Last login">{formatDate(activeUser.lastActive)}</InfoItem>
                            </dl>
                        </section>

                        {/* Login history & devices */}
                        <section
                            className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4"
                            aria-label="Login and device sessions"
                        >
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <History size={15} className="text-[#106A2E]" />
                                Login history &amp; devices
                            </h3>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => sendPasswordReset(activeUser)}
                                    className={`rounded-lg border border-[#0E3B22]/20 bg-[#E1F0E4]/50 px-3 py-1.5 text-xs font-semibold text-[#0E3B22] transition hover:bg-[#E1F0E4] ${focusRing}`}
                                >
                                    Send reset code
                                </button>

                                <button
                                    type="button"
                                    onClick={() => signOutEverywhere(activeUser)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/60 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 ${focusRing}`}
                                >
                                    <LogOut size={13} />
                                    Sign out all
                                </button>
                            </div>

                            <div className="mt-3 max-h-60 flex-1 space-y-2 overflow-y-auto pr-1">
                                {historyLoading ? (
                                    <p className="text-xs text-gray-400">Loading login history…</p>
                                ) : loginHistory?.error ? (
                                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                        {loginHistory.error}
                                    </p>
                                ) : (
                                    <>
                                        {(loginHistory?.sessions || [])
                                            .filter((s) => !s.isRevoked && !s.loggedOutAt)
                                            .map((session) => (
                                                <div
                                                    key={session.userSessionId}
                                                    className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-600"
                                                >
                                                    <p className="font-semibold text-gray-800">
                                                        {session.deviceLabel || "Device"}
                                                        <span className="font-normal text-gray-400">
                                                            {" · "}
                                                            {session.ipAddress || "IP unavailable"}
                                                        </span>
                                                    </p>
                                                    <p className="mt-0.5 text-gray-500">
                                                        Last seen {formatDate(session.lastSeenAt || session.createdAt)} · Expires{" "}
                                                        {formatDate(session.expiresAt)}
                                                    </p>
                                                </div>
                                            ))}

                                        {(loginHistory?.logins || []).slice(0, 5).map((entry, index) => (
                                            <p
                                                key={`${entry.createdAt}-${index}`}
                                                className="flex items-center gap-2 text-xs text-gray-500"
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#106A2E]/50" />
                                                Login · {formatDate(entry.createdAt)}
                                            </p>
                                        ))}

                                        {!loginHistory?.sessions?.some((s) => !s.isRevoked && !s.loggedOutAt) &&
                                            !loginHistory?.logins?.length && (
                                                <p className="text-xs text-gray-400">
                                                    No login history or active sessions available.
                                                </p>
                                            )}
                                    </>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Supporting document */}
                    <div className="mt-4">
                        <UserSupportingDocument key={activeUser.id} userId={activeUser.id} />
                    </div>

                    {/* Footer */}
                    <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                const user = activeUser;
                                setModal(null);
                                openEdit(user);
                            }}
                            className={`inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 ${focusRing}`}
                        >
                            <Pencil size={13} />
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={closeModal}
                            className={`rounded-lg bg-[#0E3B22] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0a2c19] ${focusRing}`}
                        >
                            Close
                        </button>
                    </div>
                </Modal>
            )}

            {/* Credentials (one-time) */}
            {credentials && <CredentialsModal data={credentials} onClose={closeCredentials} />}

            {/* Confirm */}
            {confirm && <ConfirmDialog config={confirm} onClose={closeConfirm} />}
        </div>
    );
}
