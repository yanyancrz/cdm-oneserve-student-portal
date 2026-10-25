import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Download,
    FileSpreadsheet,
    RefreshCw,
    Search,
    Users as UsersIcon,
} from "lucide-react";
import { API_URL } from "../../config/api";
import {
    AUTH_BASE,
    API_BASE,
    FONTS_HREF,
    FONTS_LINK_ID,
    focusRing,
    formatDate,
    ghostButton,
    getInstitute,
    isAdminRole,
    outlineButton,
    primaryButton,
    request,
    roleLabel,
    selectClass,
    timeAgo,
} from "./userAdminUtils";

// ─────────────────────────────────────────────────────────────
// Report categories (filteration)
// ─────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
    { value: "all", label: "All accounts (no counselors)" },
    { value: "users", label: "User accounts (students + faculty)" },
    { value: "students", label: "Students only" },
    { value: "faculty", label: "Faculty only" },
    { value: "heads", label: "Service heads / admins" },
];

const isMemberRole = (role) => role === "Student" || role === "Faculty";
const isHeadRole = (role) => role === "SuperAdmin" || isAdminRole(role);

function matchesCategory(user, category) {
    const role = user?.role;
    switch (category) {
        case "students":
            return role === "Student";
        case "faculty":
            return role === "Faculty";
        case "users":
            return isMemberRole(role);
        case "heads":
            return isHeadRole(role);
        case "all":
            return role !== "Counselor";
        default:
            return true;
    }
}

const CSV_COLUMNS = [
    { key: "fullName", label: "Full name" },
    { key: "email", label: "Email" },
    { key: "idNumber", label: "ID number" },
    { key: "role", label: "Role" },
    { key: "institute", label: "Institute" },
    { key: "course", label: "Course / program" },
    { key: "status", label: "Status" },
    { key: "adminModule", label: "Assigned module" },
    { key: "lastActive", label: "Last active" },
];

function toCsv(rows) {
    const header = CSV_COLUMNS.map((c) => `"${c.label}"`).join(",");
    const body = rows
        .map((row) =>
            CSV_COLUMNS.map((c) => {
                let value = row[c.key];
                if (c.key === "role") value = roleLabel(value);
                if (c.key === "institute") value = getInstitute(row);
                if (c.key === "lastActive") value = value ? formatDate(value) : "";
                if (value === null || value === undefined) value = "";
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(",")
        )
        .join("\n");
    return `${header}\n${body}`;
}

function downloadCsv(filename, content) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// Simple bar chart (no chart lib)
// ─────────────────────────────────────────────────────────────
function BarChart({ data, color = "#106A2E", emptyLabel = "No data" }) {
    const max = Math.max(1, ...data.map((d) => d.value));
    if (!data.length) {
        return <p className="py-8 text-center text-sm text-gray-400">{emptyLabel}</p>;
    }
    return (
        <div className="space-y-2">
            {data.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                    <div className="w-40 shrink-0 truncate text-xs text-gray-600" title={d.label}>
                        {d.label}
                    </div>
                    <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-[#F0EDE4]">
                        <div
                            className="h-full rounded-lg transition-all"
                            style={{
                                width: `${(d.value / max) * 100}%`,
                                background: color,
                            }}
                        />
                        <span className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-gray-700">
                            {d.value}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function Reports() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [category, setCategory] = useState("all");
    const [statusFilter, setStatusFilter] = useState("All statuses");
    const [instituteFilter, setInstituteFilter] = useState("All institutes");
    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // ── Fonts ───────────────────────────────────────────────
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
                fallback: "Failed to load accounts",
                messages: { 403: "You don't have permission to view accounts." },
            });
            setUsers(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.status ? err.message : "Couldn't load accounts. Is the API running?");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // ── Institutes list ─────────────────────────────────────
    const instituteOptions = useMemo(() => {
        const set = new Set(users.map((u) => getInstitute(u)).filter(Boolean));
        return ["All institutes", ...Array.from(set).sort()];
    }, [users]);

    // ── Filtered rows ───────────────────────────────────────
    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return users.filter((u) => {
            if (!matchesCategory(u, category)) return false;
            if (statusFilter !== "All statuses" && u.status !== statusFilter) return false;
            if (instituteFilter !== "All institutes" && getInstitute(u) !== instituteFilter) return false;
            if (query) {
                const haystack = [u.fullName, u.email, u.idNumber, u.role, roleLabel(u.role), getInstitute(u), u.course, u.status]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(query)) return false;
            }
            return true;
        });
    }, [users, category, statusFilter, instituteFilter, search]);

    // ── Pagination ──────────────────────────────────────────
    useEffect(() => {
        setPage(1);
    }, [category, statusFilter, instituteFilter, search, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(pageStart, pageStart + pageSize);

    // ── Stats ───────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = filtered.length;
        const active = filtered.filter((u) => u.status === "Active").length;
        const suspended = filtered.filter((u) => u.status === "Suspended").length;
        const students = filtered.filter((u) => u.role === "Student").length;
        const faculty = filtered.filter((u) => u.role === "Faculty").length;
        const heads = filtered.filter((u) => isHeadRole(u.role)).length;
        return { total, active, suspended, students, faculty, heads };
    }, [filtered]);

    // ── Chart data ──────────────────────────────────────────
    const byInstitute = useMemo(() => {
        const map = {};
        filtered.forEach((u) => {
            const inst = getInstitute(u) || "Unassigned";
            map[inst] = (map[inst] || 0) + 1;
        });
        return Object.entries(map)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);
    }, [filtered]);

    const byStatus = useMemo(() => {
        const map = {};
        filtered.forEach((u) => {
            const s = u.status || "Unknown";
            map[s] = (map[s] || 0) + 1;
        });
        return Object.entries(map).map(([label, value]) => ({ label, value }));
    }, [filtered]);

    const byRole = useMemo(() => {
        const map = {};
        filtered.forEach((u) => {
            const r = roleLabel(u.role) || "Unknown";
            map[r] = (map[r] || 0) + 1;
        });
        return Object.entries(map)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);
    }, [filtered]);

    // institutes that have at least one active/login (lastActive present)
    const loggedInByInstitute = useMemo(() => {
        const map = {};
        filtered.forEach((u) => {
            if (!u.lastActive) return;
            const inst = getInstitute(u) || "Unassigned";
            map[inst] = (map[inst] || 0) + 1;
        });
        return Object.entries(map)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);
    }, [filtered]);

    // ── Export ───────────────────────────────────────────────
    const handleExport = () => {
        if (!filtered.length) {
            toast.error("No records to export.");
            return;
        }
        const csv = toCsv(filtered);
        const stamp = new Date().toISOString().slice(0, 10);
        downloadCsv(`accounts-report-${category}-${stamp}.csv`, csv);
        toast.success(`Exported ${filtered.length} record(s).`);
    };

    const handlePrint = () => {
        window.print();
    };

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
                    <h1 className="font-display text-3xl text-[#1F1F1F] sm:text-4xl">Reports</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Generate and export account reports with filters and charts.
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

                    <button type="button" onClick={handleExport} className={primaryButton}>
                        <Download size={16} />
                        Export CSV
                    </button>

                    <button type="button" onClick={handlePrint} className={outlineButton}>
                        <FileSpreadsheet size={16} />
                        Print
                    </button>
                </div>
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
                            placeholder="Search by name, email, ID, role..."
                            aria-label="Search accounts"
                            className="w-full rounded-lg border border-[#E5E1D8] py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15"
                        />
                    </div>

                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        aria-label="Filter by account type"
                        className={selectClass}
                    >
                        {CATEGORY_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={instituteFilter}
                        onChange={(e) => setInstituteFilter(e.target.value)}
                        aria-label="Filter by institute"
                        className={`${selectClass} max-w-[240px]`}
                    >
                        {instituteOptions.map((inst) => (
                            <option key={inst} value={inst}>
                                {inst}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        aria-label="Filter by status"
                        className={selectClass}
                    >
                        {["All statuses", "Active", "Pending", "Suspended", "Rejected", "Deleted"].map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
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

            {/* Stats */}
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
                {[
                    { label: "Total", value: stats.total, tone: "text-[#1F1F1F]" },
                    { label: "Active", value: stats.active, tone: "text-[#106A2E]" },
                    { label: "Suspended", value: stats.suspended, tone: "text-red-600" },
                    { label: "Students", value: stats.students, tone: "text-[#106A2E]" },
                    { label: "Faculty", value: stats.faculty, tone: "text-[#0E3B22]" },
                    { label: "Service heads", value: stats.heads, tone: "text-blue-700" },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"
                    >
                        <p className="text-xs font-medium text-gray-500">{s.label}</p>
                        {loading ? (
                            <div className="mt-2 h-8 w-10 animate-pulse rounded bg-gray-200" />
                        ) : (
                            <p className={`mt-1 font-display text-3xl ${s.tone}`}>{s.value}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                        <BarChart3 size={18} className="text-[#106A2E]" />
                        <h2 className="text-sm font-semibold text-gray-800">
                            Accounts by institute
                        </h2>
                    </div>
                    {loading ? (
                        <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
                    ) : (
                        <BarChart data={byInstitute} color="#106A2E" emptyLabel="No accounts" />
                    )}
                </div>

                <div className="rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                        <BarChart3 size={18} className="text-blue-600" />
                        <h2 className="text-sm font-semibold text-gray-800">
                            Institutes with logged-in users
                        </h2>
                    </div>
                    {loading ? (
                        <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
                    ) : (
                        <BarChart data={loggedInByInstitute} color="#2563eb" emptyLabel="No login activity" />
                    )}
                </div>

                <div className="rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                        <BarChart3 size={18} className="text-amber-600" />
                        <h2 className="text-sm font-semibold text-gray-800">Accounts by status</h2>
                    </div>
                    {loading ? (
                        <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
                    ) : (
                        <BarChart data={byStatus} color="#d97706" emptyLabel="No accounts" />
                    )}
                </div>

                <div className="rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                        <BarChart3 size={18} className="text-purple-600" />
                        <h2 className="text-sm font-semibold text-gray-800">Accounts by role</h2>
                    </div>
                    {loading ? (
                        <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
                    ) : (
                        <BarChart data={byRole} color="#7c3aed" emptyLabel="No accounts" />
                    )}
                </div>
            </div>

            {/* Table preview */}
            <div className="overflow-hidden rounded-2xl border border-[#E5E1D8] bg-white">
                {loading ? (
                    <div className="px-5 py-14 text-center text-sm text-gray-400">Loading accounts…</div>
                ) : filtered.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                        <UsersIcon size={20} className="mx-auto text-gray-300" />
                        <p className="mt-4 font-medium text-gray-700">No accounts match your filters</p>
                        <p className="mt-1 text-sm text-gray-400">Try a different search term or clear the filters.</p>
                    </div>
                ) : (
                    <div className="max-h-[60vh] overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="sticky top-0 z-10 bg-white text-left font-semibold text-gray-500 px-5 py-3 text-xs border-b border-[#E5E1D8]">
                                        Name
                                    </th>
                                    <th className="sticky top-0 z-10 bg-white text-left font-semibold text-gray-500 px-5 py-3 text-xs border-b border-[#E5E1D8]">
                                        Email
                                    </th>
                                    <th className="sticky top-0 z-10 bg-white text-left font-semibold text-gray-500 px-5 py-3 text-xs border-b border-[#E5E1D8]">
                                        Role
                                    </th>
                                    <th className="sticky top-0 z-10 bg-white text-left font-semibold text-gray-500 px-5 py-3 text-xs border-b border-[#E5E1D8]">
                                        Institute
                                    </th>
                                    <th className="sticky top-0 z-10 bg-white text-left font-semibold text-gray-500 px-5 py-3 text-xs border-b border-[#E5E1D8]">
                                        Status
                                    </th>
                                    <th className="sticky top-0 z-10 bg-white text-left font-semibold text-gray-500 px-5 py-3 text-xs border-b border-[#E5E1D8]">
                                        Last active
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.map((u, i) => (
                                    <tr
                                        key={u.id}
                                        className={`transition hover:bg-gray-50/70 ${
                                            i !== filtered.length - 1 ? "border-b border-[#F0EDE4]" : ""
                                        }`}
                                    >
                                        <td className="px-5 py-3.5 font-medium text-gray-800">{u.fullName}</td>
                                        <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                                        <td className="px-5 py-3.5 text-gray-600">{roleLabel(u.role)}</td>
                                        <td className="px-5 py-3.5 text-gray-600">{getInstitute(u) || "—"}</td>
                                        <td className="px-5 py-3.5 text-gray-600">{u.status || "—"}</td>
                                        <td className="px-5 py-3.5 text-gray-500">{timeAgo(u.lastActive)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!loading && filtered.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-400">
                        Showing {pageStart + 1}–{Math.min(pageStart + pageSize, filtered.length)} of {filtered.length} accounts
                        {filtered.length !== users.length && ` (${users.length} total)`}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-gray-500">
                            Rows
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="rounded-lg border border-[#E5E1D8] bg-white px-2 py-1.5 text-xs outline-none focus:border-[#106A2E]"
                            >
                                {[10, 25, 50].map((size) => (
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

            <p className="mt-3 text-xs text-gray-400">
                Showing {filtered.length} of {users.length} accounts. Use Export CSV to download the filtered list.
            </p>
        </div>
    );
}