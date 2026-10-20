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
    Ban,
    Trash2,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    ShieldCheck,
} from "lucide-react";
import { API_URL } from "../../config/api";
import {
    ConfirmDialog,
    CredentialsModal,
    DetailRow,
    HeadForm,
    Initials,
    LoadingSkeleton,
    Modal,
    RolePill,
    RowMenu,
    SortHeader,
    StatusPill,
    UserForm,
} from "./userAdminShared";
import {
    AUTH_BASE,
    API_BASE,
    ADMIN_MODULES,
    ADMIN_ROLES,
    FONTS_HREF,
    FONTS_LINK_ID,
    PAGE_SIZES,
    STATUS_FILTERS,
    focusRing,
    formatDate,
    ghostButton,
    iconButton,
    isAdminRole,
    primaryButton,
    request,
    roleLabel,
    selectClass,
    thClass,
    timeAgo,
} from "./userAdminUtils";

// ─────────────────────────────────────────────────────────────
// Service Heads - module heads + admins only. Students and
// faculty live on the Users page; shared table chrome, modals
// and forms live in userAdminShared.jsx.
// ─────────────────────────────────────────────────────────────
const HEAD_ROLE_FILTERS = ["All", "SuperAdmin", ...ADMIN_ROLES];

const isHeadRole = (role) => role === "SuperAdmin" || isAdminRole(role);

export default function ServiceHeads() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All statuses");

    const [sort, setSort] = useState({ key: null, dir: "asc" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [modal, setModal] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");
    const [editing, setEditing] = useState(false);
    const [editError, setEditError] = useState("");

    const [confirm, setConfirm] = useState(null);
    const [credentials, setCredentials] = useState(null);

    const currentEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
    const isSelf = (user) => Boolean(currentEmail) && user.email?.toLowerCase() === currentEmail;

    // ── Fonts (same as the other admin pages) ───────────────
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
                fallback: "Failed to load service heads",
                messages: { 403: "You don't have permission to view users." },
            });

            setUsers(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(
                err.status
                    ? err.message
                    : "Couldn't load service heads. Is the API running?"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // ── Profile pictures ────────────────────────────────
    const [pictures, setPictures] = useState({});

    useEffect(() => {
        const heads = users.filter((u) => isHeadRole(u.role));

        if (!heads.length) {
            setPictures({});
            return;
        }

        let cancelled = false;

        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("authToken");

        Promise.all(
            heads.map((u) =>
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

    // ── Filters ─────────────────────────────────────────────
    const clearAllFilters = () => {
        setSearch("");
        setRoleFilter("All");
        setStatusFilter("All statuses");
    };

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((u) => {
            // This page is heads + admins only.
            if (!isHeadRole(u.role)) return false;

            const matchesSearch =
                !query ||
                [
                    u.fullName,
                    u.email,
                    u.idNumber,
                    u.role,
                    roleLabel(u.role),
                    u.adminModule,
                    u.status,
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(query));

            const matchesRole = roleFilter === "All" || u.role === roleFilter;

            const matchesStatus = statusFilter === "All statuses" || u.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, search, roleFilter, statusFilter]);

    const activeChips = [];
    if (search.trim()) {
        activeChips.push({ key: "search", label: `Search: "${search.trim()}"`, clear: () => setSearch("") });
    }
    if (roleFilter !== "All") {
        activeChips.push({
            key: "role",
            label: roleLabel(roleFilter),
            clear: () => setRoleFilter("All"),
        });
    }
    if (statusFilter !== "All statuses") {
        activeChips.push({ key: "status", label: statusFilter, clear: () => setStatusFilter("All statuses") });
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
    }, [search, roleFilter, statusFilter, sort, pageSize]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * pageSize;
    const pageItems = sorted.slice(pageStart, pageStart + pageSize);

    // ── Stats ───────────────────────────────────────────────
    const stats = useMemo(() => {
        const heads = users.filter((u) => isHeadRole(u.role));
        const modulesCovered = new Set(
            heads.map((u) => u.adminModule).filter(Boolean)
        ).size;

        return [
            { key: "all", label: "Total heads", value: heads.length, icon: UsersIcon, tone: "bg-[#ECE9E2] text-[#1F1F1F]", number: "text-[#1F1F1F]" },
            { key: "active", label: "Active", value: heads.filter((u) => u.status === "Active").length, icon: UserCheck, tone: "bg-[#E1F0E4] text-[#106A2E]", number: "text-[#106A2E]" },
            { key: "suspended", label: "Suspended", value: heads.filter((u) => u.status === "Suspended").length, icon: Ban, tone: "bg-red-50 text-red-500", number: "text-red-600" },
            { key: "modules", label: `Modules with heads (${ADMIN_MODULES.length})`, value: modulesCovered, icon: ShieldCheck, tone: "bg-blue-50 text-blue-700", number: "text-blue-700" },
        ];
    }, [users]);

    // ── Modal helpers ───────────────────────────────────────
    const openAdd = () => {
        setActiveUser(null);
        setAddError("");
        setModal("add");
    };

    const openView = (user) => {
        setActiveUser(user);
        setModal("view");
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

    // ── Add head ────────────────────────────────────────────
    const handleAddHead = async (form) => {
        setAdding(true);
        setAddError("");

        try {
            const data = await request(`${AUTH_BASE}/heads`, {
                method: "POST",
                fallback: "Failed to create head",
                messages: { 403: "Only the Super Admin or Admin can add module heads." },
                body: {
                    fullName: form.fullName,
                    email: form.email,
                    password: form.password,
                    adminModule: form.adminModule,
                    idNumber: form.idNumber || null,
                },
            });

            const created = data?.user || data;

            setModal(null);
            setActiveUser(null);
            setCredentials({
                role: created?.role || "Admin",
                fullName: form.fullName,
                email: form.email,
                password: form.password,
            });

            await loadUsers({ silent: true });
        } catch (err) {
            console.error("Failed to create head:", err);
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
    const performDelete = async (user) => {
        setBusyId(user.id);

        try {
            const data = await request(`${API_BASE}/${user.id}`, {
                method: "DELETE",
                fallback: "Failed to delete the account.",
                messages: { 403: "You don't have permission to delete this account." },
            });

            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: "Deleted" } : u)));

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

    const requestDelete = (user) => {
        setConfirm({
            title: "Delete account?",
            description: `The account of ${user.fullName} will be deactivated, but historical system records will be preserved.`,
            confirmLabel: "Delete",
            tone: "danger",
            onConfirm: () => performDelete(user),
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
        <div className="users-root w-full min-w-0 max-w-[1250px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
            <style>{`
                .font-display { font-family: 'Fraunces', serif; }
                .users-root { font-family: 'Inter', system-ui, sans-serif; }
                @media (prefers-reduced-motion: reduce) {
                    .users-root * { transition: none !important; animation: none !important; }
                }
            `}</style>

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="font-display text-3xl text-[#1F1F1F] sm:text-4xl">Service Heads</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage module head and admin accounts.
                    </p>
                </div>

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

                    <button type="button" onClick={openAdd} className={primaryButton}>
                        <Plus size={16} />
                        Add Head
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((stat) => {
                    const StatIcon = stat.icon;

                    return (
                        <div
                            key={stat.key}
                            className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">{stat.label}</p>

                                    {loading ? (
                                        <div className="mt-2 h-8 w-10 animate-pulse rounded bg-gray-200" />
                                    ) : (
                                        <p className={`mt-1 font-display text-3xl ${stat.number}`}>
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
                        </div>
                    );
                })}
            </div>

            {/* Filter bar */}
            <div className="mb-4 rounded-2xl border border-[#E5E1D8] bg-white p-3">
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
                            placeholder="Search by name, email, ID, module..."
                            aria-label="Search service heads"
                            className="w-full rounded-lg border border-[#E5E1D8] py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        aria-label="Filter by role"
                        className={selectClass}
                    >
                        {HEAD_ROLE_FILTERS.map((role) => (
                            <option key={role} value={role}>
                                {role === "All" ? "All roles" : roleLabel(role)}
                            </option>
                        ))}
                    </select>

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
                                    className={`rounded-full p-0.5 hover:bg-[#106A2E]/10 ${focusRing}`}
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
            </div>

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
            <div className="overflow-hidden rounded-2xl border border-[#E5E1D8] bg-white">
                {loading ? (
                    <LoadingSkeleton />
                ) : sorted.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F5EF] text-gray-300">
                            <UsersIcon size={20} />
                        </div>

                        <p className="mt-4 font-medium text-gray-700">
                            {hasFilters ? "No heads match your filters" : "No service heads yet"}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                            {hasFilters
                                ? "Try a different search term or clear the filters."
                                : "Add a module head to get started."}
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
                            <table className="w-full text-sm">
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

                                        <th className={thClass}>Assigned module</th>

                                        <SortHeader
                                            label="Status"
                                            sortKey="status"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />

                                        <SortHeader
                                            label="Last active"
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

                                            <td className="px-5 py-3.5 text-gray-600">
                                                {u.adminModule || "—"}
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
                                                    u.adminModule,
                                                    `Active ${timeAgo(u.lastActive)}`,
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
                        Showing {rangeStart}–{rangeEnd} of {sorted.length} heads
                        {sorted.length !== users.filter((u) => isHeadRole(u.role)).length &&
                            ` (${users.filter((u) => isHeadRole(u.role)).length} total)`}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-gray-500">
                            Rows
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="rounded-lg border border-[#E5E1D8] bg-white px-2 py-1.5 text-xs outline-none focus:border-[#106A2E]"
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
                                className={`inline-flex items-center gap-1 rounded-lg border border-[#E5E1D8] bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 ${focusRing}`}
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
                                className={`inline-flex items-center gap-1 rounded-lg border border-[#E5E1D8] bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 ${focusRing}`}
                            >
                                Next
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add head */}
            {modal === "add" && (
                <Modal title="Add module head" onClose={closeModal} locked={adding}>
                    <HeadForm
                        onCancel={closeModal}
                        onSubmit={handleAddHead}
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
                <Modal title="User details" onClose={closeModal}>
                    <div className="mb-4 flex items-center gap-3">
                        <Initials name={activeUser.fullName} size="w-11 h-11" picture={pictures[activeUser.email?.toLowerCase()]} />

                        <div className="min-w-0">
                            <p className="truncate font-medium text-gray-800">{activeUser.fullName}</p>
                            <p className="truncate text-xs text-gray-400">{activeUser.email}</p>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <DetailRow label="Role">{roleLabel(activeUser.role)}</DetailRow>

                        {activeUser.adminModule && (
                            <DetailRow label="Assigned module">{activeUser.adminModule}</DetailRow>
                        )}

                        {activeUser.idNumber && (
                            <DetailRow label="ID number">{activeUser.idNumber}</DetailRow>
                        )}

                        <DetailRow label="Status">
                            <StatusPill status={activeUser.status} />
                        </DetailRow>

                        <DetailRow label="Last active">{formatDate(activeUser.lastActive)}</DetailRow>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                const user = activeUser;
                                setModal(null);
                                openEdit(user);
                            }}
                            className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-[#E5E1D8] text-gray-600 transition hover:bg-gray-50 ${focusRing}`}
                        >
                            <Pencil size={13} />
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={closeModal}
                            className={`text-xs font-semibold px-4 py-2 rounded-lg text-white bg-[#0E3B22] transition hover:bg-[#0a2c19] ${focusRing}`}
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
