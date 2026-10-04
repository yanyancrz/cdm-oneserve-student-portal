import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock } from "lucide-react";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";
import ReservationSummary from "../components/reservations/ReservationSummary";
import ReservationFilters from "../components/reservations/ReservationFilters";
import ReservationTable from "../components/reservations/ReservationTable";
import ReservationDetailsModal from "../components/reservations/ReservationDetailsModal";
import {
    ClaimReservationModal,
    ConfirmReservationModal,
    ReasonReservationModal,
} from "../components/reservations/ReservationActionModals";

import { useLibrary } from "../context/LibraryContext";
import { reservationService } from "../services/reservationService";

const PAGE_SIZE = 10;

// Staff mostly care about reservations that are still open.
const DEFAULT_FILTERS = {
    status: "active",
    patronType: "",
    sort: "newest",
};

export default function ReservationsPage() {
    const { permissions } = useLibrary();

    // Approve, mark ready, reject and cancel are Library Head only. The backend enforces this too.
    const canHead = Boolean(permissions?.canManageStaff);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const [result, setResult] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // modal = { type: "view" | "approve" | "ready" | "reject" | "cancel" | "claim", item }
    const [modal, setModal] = useState(null);

    // Wait for the user to stop typing before searching.
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

    // List
    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        reservationService
            .list(query, { signal: controller.signal })
            .then(setResult)
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load reservations.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [query, reloadKey]);

    // Counts for the cards and the status chips. A failure here must not break the list.
    useEffect(() => {
        const controller = new AbortController();

        reservationService
            .summary({ signal: controller.signal })
            .then(setSummary)
            .catch(() => {});

        return () => controller.abort();
    }, [reloadKey]);

    const reload = () => setReloadKey((n) => n + 1);

    const changeFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setSearch("");
        setPage(1);
    };

    const closeModal = () => setModal(null);

    // Runs one action. The modal decides what to do with { ok, data }.
    // The list is reloaded on failure too, because a 409 means someone else changed the row.
    const act = async (task, successMessage) => {
        try {
            const data = await task();
            toast.success(successMessage);
            reload();
            return { ok: true, data };
        } catch (err) {
            toast.error(err?.message || "Something went wrong.");
            reload();
            return { ok: false };
        }
    };

    const openAction = (type, item) => setModal({ type, item });

    const reservations = result?.items || [];
    const firstLoad = loading && !result;
    const hasFilters =
        Boolean(debouncedSearch) ||
        filters.patronType !== DEFAULT_FILTERS.patronType ||
        filters.status !== DEFAULT_FILTERS.status;

    const id = modal?.item?.reservationId;

    return (
        <>
            <LibraryPageHeader
                title="Reservations"
                description="Review reservations, set copies aside, and issue reserved books."
            />

            <div className="space-y-4">
                <ReservationSummary summary={summary} />

                <ReservationFilters
                    search={search}
                    onSearchChange={setSearch}
                    filters={filters}
                    onFilterChange={changeFilter}
                    summary={summary}
                    onReset={resetFilters}
                />

                <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    {firstLoad ? (
                        <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading reservations">
                            {[0, 1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                            ))}
                        </div>
                    ) : error && !result ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm font-medium text-gray-700">Unable to load reservations.</p>
                            <p className="mt-1 text-xs text-gray-400">{error}</p>
                            <button
                                type="button"
                                onClick={reload}
                                className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Try again
                            </button>
                        </div>
                    ) : reservations.length === 0 ? (
                        <EmptyState
                            icon={CalendarClock}
                            title="No reservations found."
                            description={
                                hasFilters
                                    ? "Try a different search or reset the filters."
                                    : "Reservations made by students and faculty will show up here."
                            }
                        />
                    ) : (
                        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                            {error && (
                                <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-800">
                                    Could not refresh: {error}
                                </p>
                            )}

                            <ReservationTable
                                reservations={reservations}
                                canHead={canHead}
                                onView={(item) => openAction("view", item)}
                                onAction={openAction}
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

            {modal?.type === "view" && (
                <ReservationDetailsModal
                    reservationId={id}
                    canHead={canHead}
                    onAction={openAction}
                    onClose={closeModal}
                />
            )}

            {modal?.type === "approve" && (
                <ConfirmReservationModal
                    action="approve"
                    item={modal.item}
                    onClose={closeModal}
                    onConfirm={() => act(() => reservationService.approve(id), "Reservation approved.")}
                />
            )}

            {modal?.type === "ready" && (
                <ConfirmReservationModal
                    action="ready"
                    item={modal.item}
                    onClose={closeModal}
                    onConfirm={() => act(() => reservationService.markReady(id), "Marked ready for pickup.")}
                />
            )}

            {modal?.type === "reject" && (
                <ReasonReservationModal
                    action="reject"
                    item={modal.item}
                    onClose={closeModal}
                    onConfirm={(reason) => act(() => reservationService.reject(id, reason), "Reservation rejected.")}
                />
            )}

            {modal?.type === "cancel" && (
                <ReasonReservationModal
                    action="cancel"
                    item={modal.item}
                    onClose={closeModal}
                    onConfirm={(reason) => act(() => reservationService.cancel(id, reason), "Reservation cancelled.")}
                />
            )}

            {modal?.type === "claim" && (
                <ClaimReservationModal
                    item={modal.item}
                    onClose={closeModal}
                    onConfirm={(payload) => act(() => reservationService.claim(id, payload), "Book issued.")}
                />
            )}
        </>
    );
}