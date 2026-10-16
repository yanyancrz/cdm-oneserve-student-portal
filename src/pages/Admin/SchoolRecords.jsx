import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";

// =========================================================
// SCHOOL RECORDS (admin)
// The official list of Student/Faculty ID Numbers allowed to
// register. IDs live ONLY in the database — never hardcoded
// in the mobile app. The Register page sends { idNumber, role,
// email } and the backend rejects anything not in this table.
//
// Expected backend endpoints (adjust if names differ):
//   GET    /api/admin/school-records
//   POST   /api/admin/school-records        { idNumber, role }
//   DELETE /api/admin/school-records/{id}
// =========================================================

// Fallback shown when the backend endpoint is not reachable yet.
// Same 20 official Student IDs from the seed script — display only,
// the real check always happens server-side at register time.
const SEED_IDS = [
    "23-00387",
    "23-00534",
    "23-00014",
    "23-00665",
    "23-00626",
    "23-01551",
    "23-01053",
    "23-00970",
    "23-01241",
    "23-01062",
    "23-01218",
    "22-00955",
    "23-00636",
    "23-00050",
    "23-00148",
    "23-00951",
    "23-00839",
    "21-01426",
    "23-00535",
    "23-00041",
];

const authHeaders = () => {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export default function SchoolRecords() {
    const [records, setRecords] = useState([]);
    const [usingFallback, setUsingFallback] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [idNumber, setIdNumber] = useState("");
    const [role, setRole] = useState("Student");
    const [adding, setAdding] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // -----------------------------------------------------
    // LOAD
    // -----------------------------------------------------
    const loadRecords = async () => {
        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/admin/school-records`,
                { headers: authHeaders() }
            );

            if (!response.ok) throw new Error("not-ready");

            const data = await response.json();
            const list = Array.isArray(data) ? data : data?.records || [];

            setRecords(list);
            setUsingFallback(false);
        } catch {
            // Backend endpoint not ready — show the seed list so the
            // admin still sees the 20 official IDs. Adds/deletes are
            // disabled in this mode (DB is the source of truth).
            setRecords(
                SEED_IDS.map((n, i) => ({
                    id: `seed-${i}`,
                    idNumber: n,
                    role: "Student",
                    isUsed: false,
                    _seed: true,
                }))
            );
            setUsingFallback(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecords();
    }, []);

    // -----------------------------------------------------
    // ADD
    // -----------------------------------------------------
    const handleAdd = async () => {
        const value = idNumber.trim();

        if (!value) {
            toast.error("Please enter an ID number.");
            return;
        }

        if (usingFallback) {
            toast.error(
                "Backend not connected — IDs can only be added in the database."
            );
            return;
        }

        setAdding(true);

        try {
            const response = await fetch(
                `${API_URL}/api/admin/school-records`,
                {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({ idNumber: value, role }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data?.message || "Failed to add record.");
            }

            toast.success("School record added.");
            setIdNumber("");
            await loadRecords();
        } catch (error) {
            toast.error(error.message || "Unable to add record.");
        } finally {
            setAdding(false);
        }
    };

    // -----------------------------------------------------
    // DELETE
    // -----------------------------------------------------
    const handleDelete = async (record) => {
        if (usingFallback || record._seed) {
            toast.error(
                "Backend not connected — IDs can only be removed in the database."
            );
            return;
        }

        if (!window.confirm(`Remove ${record.idNumber} from School Records?`)) {
            return;
        }

        setDeletingId(record.id);

        try {
            const response = await fetch(
                `${API_URL}/api/admin/school-records/${encodeURIComponent(record.id)}`,
                { method: "DELETE", headers: authHeaders() }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.message || "Failed to remove record.");
            }

            toast.success("School record removed.");
            await loadRecords();
        } catch (error) {
            toast.error(error.message || "Unable to remove record.");
        } finally {
            setDeletingId(null);
        }
    };

    // -----------------------------------------------------
    // SEARCH
    // -----------------------------------------------------
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return records;
        return records.filter(
            (r) =>
                r.idNumber?.toLowerCase().includes(q) ||
                r.role?.toLowerCase().includes(q)
        );
    }, [records, search]);

    return (
        <div className="min-h-screen bg-[#F7F5EF] text-[#1F1F1F]">
            <main className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-[#106A2E]/70">
                    Admin
                </p>
                <h1 className="text-2xl font-semibold lg:text-3xl">
                    School Records
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Official ID Numbers allowed to register. IDs live only in
                    the database — the app never hardcodes them.
                </p>

                {usingFallback && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                        Backend endpoint{" "}
                        <code>/api/admin/school-records</code> is not reachable
                        — showing the 20 seeded IDs below. Run{" "}
                        <code>docs/school-records-seed.sql</code> on the backend
                        database. Adds/removes are disabled until connected.
                    </div>
                )}

                {/* ADD FORM */}
                <div className="mt-6 rounded-2xl border border-[#1F1F1F]/5 bg-white p-5">
                    <h2 className="text-sm font-semibold">Add record</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px_auto]">
                        <input
                            type="text"
                            placeholder="ID Number (e.g. 23-00387)"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#106A2E] focus:bg-white"
                        />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#106A2E]"
                        >
                            <option>Student</option>
                            <option>Faculty</option>
                        </select>
                        <button
                            onClick={handleAdd}
                            disabled={adding}
                            className="rounded-xl bg-[#0E3B22] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a2c19] disabled:opacity-60"
                        >
                            {adding ? "Adding..." : "Add"}
                        </button>
                    </div>
                </div>

                {/* SEARCH */}
                <div className="mt-4">
                    <input
                        type="text"
                        placeholder="Search ID number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#106A2E]"
                    />
                </div>

                {/* LIST */}
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-5 py-4">
                        <p className="text-sm font-semibold">
                            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    {loading ? (
                        <p className="p-8 text-center text-sm text-gray-400">
                            Loading...
                        </p>
                    ) : filtered.length === 0 ? (
                        <p className="p-8 text-center text-sm text-gray-400">
                            No records found.
                        </p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {filtered.map((r) => (
                                <li
                                    key={r.id}
                                    className="flex items-center justify-between gap-3 px-5 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">
                                            {r.idNumber}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {r.role}
                                            {r.isUsed ? " • already registered" : ""}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(r)}
                                        disabled={deletingId === r.id}
                                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {deletingId === r.id ? "..." : "Remove"}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}
