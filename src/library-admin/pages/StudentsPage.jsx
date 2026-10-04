import { useEffect, useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import StudentFilters from "../components/students/StudentFilters";
import StudentTable from "../components/students/StudentTable";
import StudentProfileModal from "../components/students/StudentProfileModal";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";

import { studentService } from "../services/studentService";

const PAGE_SIZE = 10;
const DEFAULT_FILTERS = { course: "", yearLevel: "", status: "" };

export default function StudentsPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const [courses, setCourses] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // { student, tab }
    const [selected, setSelected] = useState(null);

    // Course options come from the real student data.
    useEffect(() => {
        const controller = new AbortController();

        studentService
            .filters({ signal: controller.signal })
            .then((data) => setCourses(data?.courses || []))
            .catch(() => {
                // The filter still works without the list. Not worth an error screen.
            });

        return () => controller.abort();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    const query = useMemo(
        () => ({ ...filters, search: debouncedSearch, page, pageSize: PAGE_SIZE }),
        [filters, debouncedSearch, page]
    );

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        studentService
            .list(query, { signal: controller.signal })
            .then(setResult)
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load students.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [query, reloadKey]);

    const changeFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setSearch("");
        setPage(1);
    };

    const students = result?.items || [];
    const firstLoad = loading && !result;
    const hasFilters = Boolean(debouncedSearch) || Object.values(filters).some(Boolean);

    return (
        <>
            <LibraryPageHeader title="Students" description="Student directory (read-only)." />

            <div className="space-y-4">
                <StudentFilters
                    search={search}
                    onSearchChange={setSearch}
                    filters={filters}
                    courses={courses}
                    onFilterChange={changeFilter}
                    onReset={resetFilters}
                />

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    {firstLoad ? (
                        <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading students">
                            {[0, 1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                            ))}
                        </div>
                    ) : error && !result ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm font-medium text-gray-700">Unable to load students.</p>
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
                            title="No students found."
                            description={hasFilters ? "Try a different search or reset the filters." : "No student accounts yet."}
                        />
                    ) : (
                        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                            {error && (
                                <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-800">
                                    Could not refresh: {error}
                                </p>
                            )}

                            <StudentTable
                                students={students}
                                onOpen={(student, tab) => setSelected({ student, tab })}
                            />

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

            {selected && (
                <StudentProfileModal
                    key={`${selected.student.userId}-${selected.tab}`}
                    student={selected.student}
                    initialTab={selected.tab}
                    onClose={() => setSelected(null)}
                />
            )}
        </>
    );
}