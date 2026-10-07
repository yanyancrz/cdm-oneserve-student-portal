import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    CalendarCheck2,
    CalendarClock,
    KeyRound,
    Mail,
    NotebookPen,
    Pencil,
    Phone,
    Power,
    MapPin,
} from "lucide-react";

import CounselorFormModal from "../components/counselors/CounselorFormModal";
import KpiCard from "../components/dashboard/KpiCard";
import {
    ConfirmDialog,
    ErrorMessage,
    PageHeader,
    StatusBadge,
} from "../components/common";
import guidanceHeadService from "../services/guidanceHeadService";
import { formatDateTime, formatNumber, initials, statusTone } from "../utils/format";

const CONFIRM = {
    reset: {
        title: "Send password reset code",
        tone: "primary",
        label: "Send code",
        message: (n) =>
            `Email a one-time password reset code to ${n}? You never see or set their password.`,
    },
    suspend: {
        title: "Suspend account",
        tone: "danger",
        label: "Suspend",
        message: (n) => `Suspend ${n}? They will not be able to sign in until you activate it again.`,
    },
    activate: {
        title: "Activate account",
        tone: "primary",
        label: "Activate",
        message: (n) => `Activate ${n}? They will be able to sign in again.`,
    },
};

const row = "flex items-start gap-2 text-sm";

export default function GuidanceCounselorDetailPage() {
    const { counselorId } = useParams();

    const [counselor, setCounselor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [modal, setModal] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(
        async (signal) => {
            setLoading(true);
            setError(null);

            try {
                const data = await guidanceHeadService.getCounselor(counselorId, { signal });
                setCounselor(data);
            } catch (err) {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load that counselor.");
            } finally {
                if (!signal.aborted) setLoading(false);
            }
        },
        [counselorId]
    );

    useEffect(() => {
        const controller = new AbortController();

        // Deferred so the effect body never sets state synchronously.
        queueMicrotask(() => load(controller.signal));

        return () => controller.abort();
    }, [load]);

    const runConfirmed = async () => {
        const { type } = modal;

        setBusy(true);

        try {
            if (type === "reset") {
                const result = await guidanceHeadService.sendPasswordReset(counselor.userId);
                toast.success(result?.message || "Reset code sent.");
            } else if (type === "suspend") {
                await guidanceHeadService.setCounselorStatus(counselor.userId, "Suspended");
                toast.success("Account suspended.");
            } else if (type === "activate") {
                await guidanceHeadService.setCounselorStatus(counselor.userId, "Active");
                toast.success("Account activated.");
            }

            setModal(null);
            load(new AbortController().signal);
        } catch (err) {
            toast.error(err?.message || "Unable to complete the action.");
        } finally {
            setBusy(false);
        }
    };

    if (loading && !counselor) {
        return (
            <div className="space-y-4" aria-busy="true" aria-label="Loading counselor">
                <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
            </div>
        );
    }

    if (error && !counselor) {
        return (
            <ErrorMessage
                title="Unable to load this counselor"
                message={error}
                onRetry={() => load(new AbortController().signal)}
            />
        );
    }

    if (!counselor) return null;

    const active = counselor.accountStatus === "Active";
    const confirm = modal && CONFIRM[modal.type];
    const stats = counselor.appointmentsByStatus;

    return (
        <>
            <Link
                to="/admin/guidance/counselors"
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-[#106A2E]"
            >
                <ArrowLeft size={15} /> Back to counselors
            </Link>

            <PageHeader
                eyebrow="Counselor"
                icon={NotebookPen}
                title={counselor.fullName}
                description={`${counselor.title || "Guidance counselor"}${
                    counselor.department ? ` · ${counselor.department}` : ""
                }`}
                loading={loading && !counselor}
                actions={
                    <>
                        <button
                            type="button"
                            onClick={() => setModal({ type: "edit" })}
                            className="inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                            <Pencil size={15} /> Edit
                        </button>

                        <button
                            type="button"
                            onClick={() => setModal({ type: "reset" })}
                            className="inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                            <KeyRound size={15} /> Reset password
                        </button>

                        <button
                            type="button"
                            onClick={() => setModal({ type: active ? "suspend" : "activate" })}
                            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90 ${
                                active ? "bg-red-600 hover:bg-red-700" : "bg-[#106A2E]"
                            }`}
                        >
                            <Power size={15} /> {active ? "Suspend" : "Activate"}
                        </button>
                    </>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Identity */}
                <section className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E1F0E4] text-lg font-semibold text-[#106A2E]">
                            {initials(counselor.fullName)}
                        </span>

                        <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-800">
                                {counselor.fullName}
                            </p>
                            <div className="mt-1">
                                <StatusBadge tone={statusTone(counselor.accountStatus)}>
                                    {counselor.accountStatus}
                                </StatusBadge>
                            </div>
                        </div>
                    </div>

                    <dl className="mt-5 space-y-3">
                        <div className={row}>
                            <Mail size={15} className="mt-0.5 shrink-0 text-gray-400" />
                            <dd className="min-w-0 break-all text-gray-600">{counselor.email}</dd>
                        </div>

                        <div className={row}>
                            <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
                            <dd className="text-gray-600">
                                {[counselor.room, counselor.department].filter(Boolean).join(" · ") ||
                                    "No room assigned"}
                            </dd>
                        </div>

                        <div className={row}>
                            <Phone size={15} className="mt-0.5 shrink-0 text-gray-400" />
                            <dd className="text-gray-600">{counselor.phone || "No contact number"}</dd>
                        </div>
                    </dl>

                    <div className="mt-5 space-y-2 border-t border-black/[0.06] pt-4 text-xs text-gray-500">
                        <p>ID number: {counselor.idNumber || "—"}</p>
                        <p>Last login: {formatDateTime(counselor.lastLoginAt)}</p>
                        <p>Account created: {formatDateTime(counselor.createdAt)}</p>
                    </div>

                    {counselor.specializations && (
                        <div className="mt-4 border-t border-black/[0.06] pt-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                Specializations
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {counselor.specializations.split(",").map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-[#E1F0E4] px-2.5 py-0.5 text-xs text-[#106A2E]"
                                    >
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {counselor.bio && (
                        <div className="mt-4 border-t border-black/[0.06] pt-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                Bio
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                                {counselor.bio}
                            </p>
                        </div>
                    )}
                </section>

                {/* Stats + availability */}
                <div className="space-y-4 lg:col-span-2">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <KpiCard
                            icon={CalendarCheck2}
                            label="Appointments"
                            value={formatNumber(stats?.total)}
                            sub={`${stats?.pending ?? 0} pending`}
                        />
                        <KpiCard
                            icon={NotebookPen}
                            label="Sessions recorded"
                            value={formatNumber(counselor.completedSessions)}
                            sub="Counseling records"
                            tone="blue"
                        />
                        <KpiCard
                            icon={CalendarClock}
                            label="Available days"
                            value={formatNumber(counselor.availabilityDays)}
                            sub="Days offered per week"
                            tone="amber"
                        />
                    </div>

                    <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                        <div className="border-b border-black/[0.06] px-5 py-4">
                            <h2 className="text-sm font-semibold text-[#1F1F1F]">
                                Appointments by status
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-400">All time</p>
                        </div>

                        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-3">
                            {[
                                ["Pending", stats?.pending],
                                ["Confirmed", stats?.confirmed],
                                ["Completed", stats?.completed],
                                ["Cancelled", stats?.cancelled],
                                ["Rejected", stats?.rejected],
                                ["Expired", stats?.expired],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between rounded-lg bg-[#FAFAF7] px-3 py-2"
                                >
                                    <dt className="text-xs text-gray-500">{label}</dt>
                                    <dd className="text-sm font-semibold text-gray-800">
                                        {formatNumber(value)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                        <div className="border-b border-black/[0.06] px-5 py-4">
                            <h2 className="text-sm font-semibold text-[#1F1F1F]">
                                Availability schedule
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-400">
                                What students see when booking
                            </p>
                        </div>

                        {counselor.availability.length === 0 ? (
                            <p className="px-5 py-8 text-center text-sm text-gray-400">
                                No availability set yet. The counselor adds this from their own
                                schedule screen.
                            </p>
                        ) : (
                            <ul className="divide-y divide-black/[0.04]">
                                {counselor.availability.map((slot, index) => (
                                    <li
                                        key={`${slot.dayOfWeek}-${slot.startTime}-${index}`}
                                        className="flex items-center justify-between px-5 py-3 text-sm"
                                    >
                                        <span className="font-medium text-gray-700">
                                            {slot.dayLabel}
                                        </span>

                                        <span className="text-gray-500">
                                            {slot.startTime} – {slot.endTime}
                                        </span>

                                        <StatusBadge tone={slot.isActive ? "green" : "gray"}>
                                            {slot.isActive ? "Active" : "Inactive"}
                                        </StatusBadge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>

            {modal?.type === "edit" && (
                <CounselorFormModal
                    counselor={counselor}
                    onClose={() => setModal(null)}
                    onSaved={() => load(new AbortController().signal)}
                />
            )}

            {confirm && (
                <ConfirmDialog
                    title={confirm.title}
                    message={confirm.message(counselor.fullName)}
                    confirmLabel={confirm.label}
                    tone={confirm.tone}
                    busy={busy}
                    onConfirm={runConfirmed}
                    onClose={() => setModal(null)}
                />
            )}
        </>
    );
}
