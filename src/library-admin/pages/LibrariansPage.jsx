import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search, UserRound, X } from "lucide-react";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import LibrarianTable from "../components/librarians/LibrarianTable";
import AddLibrarianModal from "../components/librarians/AddLibrarianModal";
import EditLibrarianModal from "../components/librarians/EditLibrarianModal";
import LibrarianDetailsModal from "../components/librarians/LibrarianDetailsModal";
import TempPasswordModal from "../components/librarians/TempPasswordModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";

import { librarianService } from "../services/librarianService";

const PAGE_SIZE = 10;

const select =
    "rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#106A2E]";

export default function LibrariansPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // { type: "add" | "view" | "edit" | "disable" | "enable" | "reset", item? }
    const [modal, setModal] = useState(null);
    const [busy, setBusy] = useState(false);
    const [tempPassword, setTempPassword] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    const query = useMemo(
        () => ({ search: debouncedSearch, status, page, pageSize: PAGE_SIZE }),
        [debouncedSearch, status, page]
    );

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        librarianService
            .list(query, { signal: controller.signal })
            .then(setResult)
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load Library Staff.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [query, reloadKey]);

    const reload = () => setReloadKey((n) => n + 1);
    const closeModal = () => setModal(null);

    const reset = () => {
        setSearch("");
        setStatus("");
        setPage(1);
    };

    const runConfirmed = async () => {
        const { type, item } = modal;

        setBusy(true);

        try {
            if (type === "disable") {
                await librarianService.disable(item.userId);
                toast.success("Account disabled. The staff member can no longer sign in.");
            } else if (type === "enable") {
                await librarianService.enable(item.userId);
                toast.success("Account enabled.");
            } else if (type === "reset") {
                const data = await librarianService.resetPassword(item.userId);
                setTempPassword({ name: item.fullName, password: data.temporaryPassword });
            }

            closeModal();
            reload();
        } catch (err) {
            toast.error(err?.message || "Unable to complete the action.");
            reload();
        } finally {
            setBusy(false);
        }
    };

    const librarians = result?.items || [];
    const firstLoad = loading && !result;
    const hasFilters = Boolean(debouncedSearch) || Boolean(status);

    const confirmCopy = {
        disable: {
            title: "Disable account",
            tone: "danger",
            label: "Disable",
            message: (n) => `Disable ${n}? They will not be able to sign in. You can enable the account again later.`,
        },
        enable: {
            title: "Enable account",
            tone: "primary",
            label: "Enable",
            message: (n) => `Enable ${n}? They will be able to sign in again.`,
        },
        reset: {
            title: "Reset password",
            tone: "primary",
            label: "Reset password",
            message: (n) => `Create a new temporary password for ${n}? The old password stops working right away.`,
        },
    };

    const confirm = modal && confirmCopy[modal.type];

    return (
        <>
            <LibraryPageHeader title="Librarians" description="Manage Library Staff accounts." />

            <div className="space-y-4">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setModal({ type: "add" })}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        <Plus size={16} /> Add Library Staff
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                    <div className="relative min-w-[260px] flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, employee ID, or email"
                            className="w-full rounded-lg border border-black/[0.08] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#106A2E]"
                        />
                    </div>

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
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                    </select>

                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-100"
                    >
                        <X size={14} /> Reset
                    </button>
                </div>

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    {firstLoad ? (
                        <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading Library Staff">
                            {[0, 1, 2, 3].map((n) => (
                                <div key={n} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                            ))}
                        </div>
                    ) : error && !result ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm font-medium text-gray-700">Unable to load Library Staff.</p>
                            <p className="mt-1 text-xs text-gray-400">{error}</p>
                            <button
                                type="button"
                                onClick={reload}
                                className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Try again
                            </button>
                        </div>
                    ) : librarians.length === 0 ? (
                        <EmptyState
                            icon={UserRound}
                            title="No Library Staff found."
                            description={hasFilters ? "Try a different search or reset the filters." : "Add the first Library Staff account."}
                        />
                    ) : (
                        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                            {error && (
                                <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-800">
                                    Could not refresh: {error}
                                </p>
                            )}

                            <LibrarianTable
                                librarians={librarians}
                                onAction={(type, item) => setModal({ type, item })}
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

            <AddLibrarianModal open={modal?.type === "add"} onClose={closeModal} onSaved={reload} />

            {modal?.type === "view" && <LibrarianDetailsModal librarian={modal.item} onClose={closeModal} />}

            {modal?.type === "edit" && (
                <EditLibrarianModal librarian={modal.item} onClose={closeModal} onSaved={reload} />
            )}

            {confirm && (
                <ConfirmDialog
                    title={confirm.title}
                    message={confirm.message(modal.item.fullName)}
                    confirmLabel={confirm.label}
                    tone={confirm.tone}
                    busy={busy}
                    onConfirm={runConfirmed}
                    onClose={closeModal}
                />
            )}

            {tempPassword && (
                <TempPasswordModal
                    name={tempPassword.name}
                    password={tempPassword.password}
                    onClose={() => setTempPassword(null)}
                />
            )}
        </>
    );
}