import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, RotateCcw, Search } from "lucide-react";
import toast from "react-hot-toast";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";

import { damagedReturnService } from "../services/damagedReturnService";
import { formatDate } from "../utils/dateUtils";

const PAGE_SIZE = 10;

const todayInputValue = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

// Mirrors the backend default: replacement due 7 days after the return.
const defaultDueInputValue = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);

    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const toInputValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

function DeadlineBadge({ item }) {
    if (item.isResolved) {
        return <StatusBadge tone="green">Resolved</StatusBadge>;
    }

    if (!item.replacementDueDate) {
        return <StatusBadge tone="amber">No deadline</StatusBadge>;
    }

    if (item.isOverdue) {
        return <StatusBadge tone="red">Overdue</StatusBadge>;
    }

    return <StatusBadge tone="amber">Pending</StatusBadge>;
}

export default function DamagedReturnsPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("pending");
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editing, setEditing] = useState(null);
    const [dueDate, setDueDate] = useState("");
    const [saving, setSaving] = useState(false);

    const [resolving, setResolving] = useState(null);
    const [resolvingBusy, setResolvingBusy] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    const query = useMemo(
        () => ({
            search: debouncedSearch,
            status,
            page,
            pageSize: PAGE_SIZE,
        }),
        [debouncedSearch, status, page]
    );

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        damagedReturnService
            .list(query, { signal: controller.signal })
            .then(setResult)
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load damaged returns.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [query, reloadKey]);

    const reload = () => setReloadKey((n) => n + 1);

    const items = result?.items || [];
    const firstLoad = loading && !result;
    const hasFilters = Boolean(debouncedSearch) || status !== "pending";

    const openDeadline = (item) => {
        setEditing(item);
        setDueDate(
            toInputValue(item.replacementDueDate) || defaultDueInputValue()
        );
    };

    const saveDeadline = async () => {
        if (!editing || !dueDate) return;

        if (dueDate < todayInputValue()) {
            toast.error("The deadline cannot be in the past.");
            return;
        }

        setSaving(true);

        try {
            await damagedReturnService.setDueDate(editing.transactionId, dueDate);
            toast.success("Replacement deadline saved.");
            setEditing(null);
            reload();
        } catch (err) {
            toast.error(err?.message || "Unable to save the deadline.");
        } finally {
            setSaving(false);
        }
    };

    const confirmResolve = async () => {
        if (!resolving) return;

        setResolvingBusy(true);

        try {
            await damagedReturnService.resolve(resolving.transactionId);
            toast.success("Damaged return resolved. One copy is back on the shelf.");
            setResolving(null);
            reload();
        } catch (err) {
            toast.error(err?.message || "Unable to resolve this damaged return.");
        } finally {
            setResolvingBusy(false);
        }
    };

    return (
        <>
            <LibraryPageHeader
                title="Damaged Returns"
                description="Track damaged copies that a patron still has to return or replace."
            />

            <div className="space-y-4">
                <section className="flex flex-col gap-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search transaction, patron, or book..."
                            className="w-full rounded-lg border border-black/10 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#106A2E]"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                        className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#106A2E]"
                    >
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="all">All</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => {
                            setSearch("");
                            setStatus("pending");
                            setPage(1);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>
                </section>

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    {firstLoad ? (
                        <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading damaged returns">
                            {[0, 1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                            ))}
                        </div>
                    ) : error && !result ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm font-medium text-gray-700">Unable to load damaged returns.</p>
                            <p className="mt-1 text-xs text-gray-400">{error}</p>
                            <button
                                type="button"
                                onClick={reload}
                                className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Try again
                            </button>
                        </div>
                    ) : items.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle2}
                            title="No damaged returns found."
                            description={
                                hasFilters
                                    ? "Try a different search or reset the filters."
                                    : "Every returned copy is accounted for."
                            }
                        />
                    ) : (
                        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                            {error && (
                                <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-800">
                                    Could not refresh: {error}
                                </p>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px] text-left text-sm">
                                    <thead>
                                        <tr className="text-xs uppercase tracking-wide text-gray-400">
                                            <th className="px-5 py-3 font-medium">Txn</th>
                                            <th className="px-3 py-3 font-medium">Patron</th>
                                            <th className="px-3 py-3 font-medium">Book</th>
                                            <th className="px-3 py-3 font-medium">Returned</th>
                                            <th className="px-3 py-3 font-medium">Deadline</th>
                                            <th className="px-3 py-3 font-medium">Status</th>
                                            <th className="px-5 py-3 text-right font-medium">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-black/[0.04]">
                                        {items.map((item) => (
                                            <tr key={item.transactionId} className="hover:bg-gray-50/60">
                                                <td className="px-5 py-3 text-gray-500">#{item.transactionId}</td>
                                                <td className="px-3 py-3">
                                                    <p className="max-w-[190px] truncate font-medium text-[#1F1F1F]">
                                                        {item.patronName}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {item.patronId || "—"} &middot; {item.patronType}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="max-w-[240px] truncate text-gray-800">{item.bookTitle}</p>
                                                    <p className="max-w-[240px] truncate text-xs text-gray-400">
                                                        {item.author}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3 text-gray-600">{formatDate(item.returnDate)}</td>
                                                <td className="px-3 py-3">
                                                    {item.isResolved ? (
                                                        <span className="text-xs text-gray-500">
                                                            Resolved {formatDate(item.resolvedDate)}
                                                        </span>
                                                    ) : (
                                                        <div>
                                                            <p className="text-gray-700">
                                                                {item.replacementDueDate
                                                                    ? formatDate(item.replacementDueDate)
                                                                    : "Not set"}
                                                            </p>
                                                            {item.replacementDueDate && !item.isOverdue && (
                                                                <p className="text-xs text-gray-400">
                                                                    {item.daysLeft === 0
                                                                        ? "Due today"
                                                                        : `${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"} left`}
                                                                </p>
                                                            )}
                                                            {item.isOverdue && (
                                                                <p className="text-xs font-medium text-red-600">
                                                                    {Math.abs(item.daysLeft)} day
                                                                    {Math.abs(item.daysLeft) === 1 ? "" : "s"} overdue
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <DeadlineBadge item={item} />
                                                </td>
                                                <td className="px-5 py-3">
                                                    {item.isResolved ? (
                                                        <span className="block text-right text-xs text-gray-400">—</span>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeadline(item)}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <CalendarClock size={13} />
                                                                Deadline
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setResolving(item)}
                                                                className="rounded-lg bg-[#106A2E] px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                                                            >
                                                                Mark resolved
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

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

                <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    A damaged copy stays off the shelf. Set the deadline, then mark it resolved once the
                    patron returns an exact replacement (same ISBN and edition) or the copy is repaired.
                    Resolving puts one copy back on the shelf.
                </p>
            </div>

            {editing && (
                <Modal
                    open
                    title="Set replacement deadline"
                    size="sm"
                    onClose={saving ? undefined : () => setEditing(null)}
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setEditing(null)}
                                disabled={saving}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={saveDeadline}
                                disabled={saving || !dueDate}
                                className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save deadline"}
                            </button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="rounded-xl bg-gray-50 p-3 text-sm">
                            <p className="font-semibold text-gray-800">{editing.bookTitle}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                                {editing.patronName} &middot; returned {formatDate(editing.returnDate)}
                            </p>
                        </div>

                        <label className="block text-xs font-medium text-gray-600">
                            Patron must return or replace the copy by
                            <input
                                type="date"
                                value={dueDate}
                                min={todayInputValue()}
                                onChange={(event) => setDueDate(event.target.value)}
                                className="mt-1.5 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#106A2E]"
                            />
                        </label>

                        <p className="text-xs text-gray-500">
                            The patron sees this deadline in the Library dashboard and in My Loans.
                        </p>
                    </div>
                </Modal>
            )}

            {resolving && (
                <ConfirmDialog
                    title="Mark damaged return resolved?"
                    message={`Confirm that ${resolving.patronName} has returned an exact replacement (or that the copy of "${resolving.bookTitle}" has been repaired). One copy will go back on the shelf.`}
                    confirmLabel="Mark resolved"
                    busy={resolvingBusy}
                    onConfirm={confirmResolve}
                    onClose={() => setResolving(null)}
                />
            )}
        </>
    );
}
