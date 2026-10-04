import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import FacultyFilters from "../components/faculty/FacultyFilters";
import FacultyTable from "../components/faculty/FacultyTable";
import FacultyProfileModal from "../components/faculty/FacultyProfileModal";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";

import { facultyService } from "../services/facultyService";

const PAGE_SIZE = 10;
const DEFAULT_FILTERS = { department: "", status: "" };

export default function FacultyPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const [departments, setDepartments] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // { member, tab }
    const [selected, setSelected] = useState(null);

    // Options come from the real faculty data.
    useEffect(() => {
        const controller = new AbortController();

        facultyService
            .filters({ signal: controller.signal })
            .then((data) => setDepartments(data?.departments || []))
            .catch(() => {
                // The page still works without the list.
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

        facultyService
            .list(query, { signal: controller.signal })
            .then(setResult)
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load faculty.");
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

    const faculty = result?.items || [];
    const firstLoad = loading && !result;
    const hasFilters = Boolean(debouncedSearch) || Object.values(filters).some(Boolean);

    return (
        <>
            <LibraryPageHeader title="Faculty" description="Faculty directory (read-only)." />

            <div className="space-y-4">
                <FacultyFilters
                    search={search}
                    onSearchChange={setSearch}
                    filters={filters}
                    departments={departments}
                    onFilterChange={changeFilter}
                    onReset={resetFilters}
                />

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    {firstLoad ? (
                        <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading faculty">
                            {[0, 1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                            ))}
                        </div>
                    ) : error && !result ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm font-medium text-gray-700">Unable to load faculty.</p>
                            <p className="mt-1 text-xs text-gray-400">{error}</p>
                            <button
                                type="button"
                                onClick={() => setReloadKey((n) => n + 1)}
                                className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Try again
                            </button>
                        </div>
                    ) : faculty.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="No faculty found."
                            description={hasFilters ? "Try a different search or reset the filters." : "No faculty accounts yet."}
                        />
                    ) : (
                        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                            {error && (
                                <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-800">
                                    Could not refresh: {error}
                                </p>
                            )}

                            <FacultyTable
                                faculty={faculty}
                                onOpen={(member, tab) => setSelected({ member, tab })}
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
                <FacultyProfileModal
                    key={`${selected.member.userId}-${selected.tab}`}
                    member={selected.member}
                    initialTab={selected.tab}
                    onClose={() => setSelected(null)}
                />
            )}
        </>
    );
}