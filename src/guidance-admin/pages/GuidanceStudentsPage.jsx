import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Search, X } from "lucide-react";

import {
    EmptyState,
    PageHeader,
    Pagination,
    StatusBadge,
} from "../components/common";
import guidanceHeadService from "../services/guidanceHeadService";
import { formatDateTime, formatNumber, initials, statusTone } from "../utils/format";

const PAGE_SIZE = 10;

const select =
    "rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#106A2E]";

const cell = "px-4 py-3 text-sm";

export default function GuidanceStudentsPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    const query = useMemo(
        () => ({ search: debouncedSearch, role, status, page, pageSize: PAGE_SIZE }),
        [debouncedSearch, role, status, page]
    );

    useEffect(() => {
        const controller = new AbortController();

        // Deferred so the effect body never sets state synchronously.
        queueMicrotask(() => {
            setLoading(true);
            setError(null);

            guidanceHeadService
                .listStudents(query, { signal: controller.signal })
                .then(setResult)
                .catch((err) => {
                    if (err?.name === "AbortError") return;
                    setError(err?.message || "Unable to load the student directory.");
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        });

        return () => controller.abort();
    }, [query, reloadKey]);

    const students = result?.items || [];
    const firstLoad = loading && !result;
    const hasFilters = Boolean(debouncedSearch) || Boolean(role) || Boolean(status);

    const reset = () => {
        setSearch("");
        setRole("");
        setStatus("");
        setPage(1);
    };

    return (
        <>
            <PageHeader
                eyebrow="People"
                icon={GraduationCap}
                title="Students"
                description="Read-only directory of every student and faculty account that uses Guidance, with their bookings and last sign-in."
                loading={loading && !result}
                actions={
                    <button
                        type="button"
                        onClick={() => setReloadKey((n) => n + 1)}
                        className="rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                        Refresh
                    </button>
                }
            />

            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    <div className="relative min-w-[260px] flex-1">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, ID number, or email"
                            className="w-full rounded-lg border border-black/[0.08] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#106A2E]"
                        />
                    </div>

                    <select
                        className={select}
                        value={role}
                        onChange={(e) => {
                            setRole(e.target.value);
                            setPage(1);
                        }}
                        aria-label="Account role"
                    >
                        <option value="">Students & faculty</option>
                        <option value="Student">Students only</option>
                        <option value="Faculty">Faculty only</option>
                    </select>

                    <select
                        className={select}
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        aria-label="Account status"
                    >
                        <option value="">All statuses</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Rejected">Rejected</option>
                    </select>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={reset}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-100"
                        >
                            <X size={14} /> Reset
                        </button>
                    )}
                </div>

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    {firstLoad ? (
                        <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading students">
                            {[0, 1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                            ))}
                        </div>
                    ) : error && !result ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm font-medium text-gray-700">
                                Unable to load the directory.
                            </p>
                            <p className="mt-1 text-xs text-gray-400">{error}</p>
                            <button
                                type="button"
                                onClick={() => setReloadKey((n) => n + 1)}
                                className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Try again
                            </button>
                        </div>
                    ) : students.length === 0 ? (
                        <EmptyState
                            icon={GraduationCap}
                            title="No accounts found."
                            description={
                                hasFilters
                                    ? "Try a different search or reset the filters."
                                    : "No student or faculty accounts exist yet."
                            }
                        />
                    ) : (
                        <div
                            className={`overflow-x-auto ${
                                loading ? "opacity-60 transition-opacity" : "transition-opacity"
                            }`}
                        >
                            {error && (
                                <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-800">
                                    Could not refresh: {error}
                                </p>
                            )}

                            <table className="w-full min-w-[900px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-black/[0.06] text-[11px] uppercase tracking-wide text-gray-400">
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">ID</th>
                                        <th className="px-4 py-3 font-medium">Role</th>
                                        <th className="px-4 py-3 font-medium">Program / Year</th>
                                        <th className="px-4 py-3 font-medium">Appts</th>
                                        <th className="px-4 py-3 font-medium">Chat</th>
                                        <th className="px-4 py-3 font-medium">Last login</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-black/[0.04]">
                                    {students.map((s) => (
                                        <tr key={s.userId} className="transition hover:bg-[#FAFAF7]">
                                            <td className={cell}>
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E4EEFB] text-xs font-semibold text-[#1D4ED8]">
                                                        {initials(s.fullName)}
                                                    </span>

                                                    <div className="min-w-0">
                                                        <Link
                                                            to={`/admin/guidance/students/${s.userId}`}
                                                            className="block truncate font-medium text-gray-800 hover:text-[#106A2E] hover:underline"
                                                        >
                                                            {s.fullName}
                                                        </Link>
                                                        <p className="truncate text-xs text-gray-400">
                                                            {s.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className={`${cell} whitespace-nowrap text-gray-500`}>
                                                {s.idNumber || "—"}
                                            </td>

                                            <td className={cell}>
                                                <StatusBadge tone={s.role === "Faculty" ? "amber" : "green"}>
                                                    {s.role}
                                                </StatusBadge>
                                            </td>

                                            <td className={cell}>
                                                <p className="truncate text-gray-700">
                                                    {s.course || "—"}
                                                </p>
                                                <p className="truncate text-xs text-gray-400">
                                                    {[s.yearLevel, s.institute].filter(Boolean).join(" · ") ||
                                                        "—"}
                                                </p>
                                            </td>

                                            <td className={`${cell} text-gray-600`}>
                                                {formatNumber(s.appointments)}
                                            </td>

                                            <td className={`${cell} text-gray-600`}>
                                                {formatNumber(s.chatConversations)}
                                            </td>

                                            <td className={`${cell} whitespace-nowrap text-gray-500`}>
                                                {formatDateTime(s.lastLoginAt)}
                                            </td>

                                            <td className={cell}>
                                                <StatusBadge tone={statusTone(s.accountStatus)}>
                                                    {s.accountStatus}
                                                </StatusBadge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <Pagination
                                page={result.page}
                                totalPages={result.totalPages}
                                totalItems={result.totalItems}
                                pageSize={result.pageSize}
                                onChange={setPage}
                            />
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
