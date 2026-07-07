import { useState, useMemo } from "react";

// Mock data shape — replace with real API data
const MOCK_USERS = [
    { id: 1, name: "Alhianne Jhane Reyes", email: "alhianne.reyes@cdm.edu.ph", role: "Student", status: "Active", lastActive: "2026-06-28" },
    { id: 2, name: "Marco D. Villanueva", email: "marco.villanueva@cdm.edu.ph", role: "Faculty", status: "Active", lastActive: "2026-06-27" },
    { id: 3, name: "Carmela Santos", email: "carmela.santos@cdm.edu.ph", role: "Student", status: "Suspended", lastActive: "2026-06-10" },
    { id: 4, name: "Jericho Tan", email: "jericho.tan@cdm.edu.ph", role: "Registrar", status: "Active", lastActive: "2026-06-29" },
    { id: 5, name: "Bea Fernandez", email: "bea.fernandez@cdm.edu.ph", role: "Student", status: "Pending", lastActive: "—" },
];

const ROLE_FILTERS = ["All roles", "Student", "Faculty", "Registrar"];
const STATUS_FILTERS = ["All statuses", "Active", "Pending", "Suspended"];

const ROLE_STYLES = {
    Student: "bg-[#106A2E]/10 text-[#106A2E]",
    Faculty: "bg-[#0E3B22]/10 text-[#0E3B22]",
    Registrar: "bg-amber-100 text-amber-700",
};

const STATUS_STYLES = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Suspended: "bg-red-50 text-red-700 ring-red-200",
};

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

export default function Users() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All roles");
    const [statusFilter, setStatusFilter] = useState("All statuses");

    const filtered = useMemo(() => {
        return MOCK_USERS.filter((u) => {
            const matchesSearch =
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase());
            const matchesRole = roleFilter === "All roles" || u.role === roleFilter;
            const matchesStatus = statusFilter === "All statuses" || u.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [search, roleFilter, statusFilter]);

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
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="text-sm border rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none"
                    style={{ borderColor: "#E5E1D8" }}
                >
                    {ROLE_FILTERS.map((r) => (
                        <option key={r}>{r}</option>
                    ))}
                </select>

                {/* Status filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm border rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none"
                    style={{ borderColor: "#E5E1D8" }}
                >
                    {STATUS_FILTERS.map((s) => (
                        <option key={s}>{s}</option>
                    ))}
                </select>
            </div>

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
                                Status
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
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center">
                                    <p className="text-gray-700 font-medium">
                                        No users match your filters
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Try a different search term or clear the role/status filters.
                                    </p>
                                </td>
                            </tr>
                        )}

                        {filtered.map((u, i) => (
                            <tr
                                key={u.id}
                                className={i !== filtered.length - 1 ? "border-b" : ""}
                                style={{ borderColor: "#F0EDE4" }}
                            >
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <Initials name={u.name} />
                                        <div>
                                            <p className="font-medium text-gray-800">{u.name}</p>
                                            <p className="text-gray-400 text-xs">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_STYLES[u.role] || "bg-gray-100 text-gray-700"}`}>
                                        {u.role}
                                    </span>
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
                                <td className="px-5 py-3.5 text-gray-500">
                                    {u.lastActive}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="text-xs font-semibold text-[#106A2E] hover:underline">
                                            View
                                        </button>
                                        <button className="text-xs font-semibold text-gray-500 hover:text-gray-800">
                                            Edit
                                        </button>
                                        <button className="text-xs font-semibold text-red-500 hover:text-red-700">
                                            {u.status === "Suspended" ? "Reinstate" : "Suspend"}
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
                    Showing {filtered.length} of {MOCK_USERS.length} users
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

        </div>
    );
}