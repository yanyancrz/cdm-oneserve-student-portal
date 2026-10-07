import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search, UsersRound, X } from "lucide-react";

import CounselorTable from "../components/counselors/CounselorTable";
import CounselorFormModal from "../components/counselors/CounselorFormModal";
import {
    ConfirmDialog,
    EmptyState,
    PageHeader,
    Pagination,
} from "../components/common";
import guidanceHeadService from "../services/guidanceHeadService";

const PAGE_SIZE = 10;

const select =
    "rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#106A2E]";

const CONFIRM = {
    reset: {
        title: "Send password reset code",
        tone: "primary",
        label: "Send code",
        message: (n) =>
            `Email a one-time password reset code to ${n}? The counselor opens the link, enters the code and picks a new password. You never see it.`,
    },
    suspend: {
        title: "Suspend account",
        tone: "danger",
        label: "Suspend",
        message: (n) =>
            `Suspend ${n}? They will not be able to sign in until you activate the account again.`,
    },
    activate: {
        title: "Activate account",
        tone: "primary",
        label: "Activate",
        message: (n) => `Activate ${n}? They will be able to sign in again.`,
    },
};

export default function GuidanceCounselorsPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // { type: "add" | "edit" | "reset" | "suspend" | "activate", counselor? }
    const [modal, setModal] = useState(null);
    const [busy, setBusy] = useState(false);

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

        // Deferred so the effect body never sets state synchronously.
        queueMicrotask(() => {
            setLoading(true);
            setError(null);

            guidanceHeadService
                .listCounselors(query, { signal: controller.signal })
                .then(setResult)
                .catch((err) => {
                    if (err?.name === "AbortError") return;
                    setError(err?.message || "Unable to load counselors.");
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        });

        return () => controller.abort();
    }, [query, reloadKey]);

    const reload = () => setReloadKey((n) => n + 1);
    const closeModal = () => setModal(null);

    const handleAction = async (type, counselor) => {
        if (type !== "edit") {
            setModal({ type, counselor });
            return;
        }

        try {
            const detail = await guidanceHeadService.getCounselor(counselor.userId);
            setModal({ type: "edit", counselor: detail });
        } catch (err) {
            toast.error(err?.message || "Unable to load that counselor.");
        }
    };

    const runConfirmed = async () => {
        const { type, counselor } = modal;

        setBusy(true);

        try {
            if (type === "reset") {
                const result = await guidanceHeadService.sendPasswordReset(counselor.userId);
                toast.success(result?.message || `Reset code sent to ${counselor.email}.`);
            } else if (type === "suspend") {
                await guidanceHeadService.setCounselorStatus(counselor.userId, "Suspended");
                toast.success(`${counselor.fullName} can no longer sign in.`);
            } else if (type === "activate") {
                await guidanceHeadService.setCounselorStatus(counselor.userId, "Active");
                toast.success(`${counselor.fullName} can sign in again.`);
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

    const counselors = result?.items || [];
    const firstLoad = loading && !result;
    const hasFilters = Boolean(debouncedSearch) || Boolean(status);
    const confirm = modal && CONFIRM[modal.type];

    return (
        <>
            <PageHeader
                eyebrow="People"
                icon={UsersRound}
                title="Counselors"
                description="Create counselor accounts, keep their profiles current, and control who can sign in."
                loading={loading && !result}
                actions={
                    <button
                        type="button"
                        onClick={() => setModal({ type: "add" })}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        <Plus size={16} /> Add counselor
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
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        aria-label="Account status"
                    >
                        <option value="">All statuses</option>
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                    </select>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setStatus("");
                                setPage(1);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-100"
                        >
                            <X size={14} /> Reset
                        </button>
                    )}
                </div>

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    {firstLoad ? (
                        <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading counselors">
                            {[0, 1, 2, 3].map((n) => (
                                <div key={n} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                            ))}
                        </div>
                    ) : error && !result ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm font-medium text-gray-700">
                                Unable to load counselors.
                            </p>
                            <p className="mt-1 text-xs text-gray-400">{error}</p>
                            <button
                                type="button"
                                onClick={reload}
                                className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Try again
                            </button>
                        </div>
                    ) : counselors.length === 0 ? (
                        <EmptyState
                            icon={UsersRound}
                            title="No counselors found."
                            description={
                                hasFilters
                                    ? "Try a different search or reset the filters."
                                    : "Add the first counselor account."
                            }
                        />
                    ) : (
                        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                            {error && (
                                <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-800">
                                    Could not refresh: {error}
                                </p>
                            )}

                            <CounselorTable counselors={counselors} onAction={handleAction} />

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

            {modal?.type === "add" && (
                <CounselorFormModal counselor={null} onClose={closeModal} onSaved={reload} />
            )}

            {modal?.type === "edit" && (
                <CounselorFormModal
                    counselor={modal.counselor}
                    onClose={closeModal}
                    onSaved={reload}
                />
            )}

            {confirm && (
                <ConfirmDialog
                    title={confirm.title}
                    message={confirm.message(modal.counselor.fullName)}
                    confirmLabel={confirm.label}
                    tone={confirm.tone}
                    busy={busy}
                    onConfirm={runConfirmed}
                    onClose={closeModal}
                />
            )}
        </>
    );
}
