import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarCheck2, GraduationCap, Mail, MessageSquareMore, Phone } from "lucide-react";

import KpiCard from "../components/dashboard/KpiCard";
import { ErrorMessage, PageHeader, StatusBadge } from "../components/common";
import guidanceHeadService from "../services/guidanceHeadService";
import { formatDate, formatDateTime, formatNumber, initials, statusTone } from "../utils/format";

const row = "flex items-start gap-2 text-sm";

export default function GuidanceStudentDetailPage() {
    const { studentId } = useParams();

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(
        async (signal) => {
            setLoading(true);
            setError(null);

            try {
                const data = await guidanceHeadService.getStudent(studentId, { signal });
                setStudent(data);
            } catch (err) {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load that account.");
            } finally {
                if (!signal.aborted) setLoading(false);
            }
        },
        [studentId]
    );

    useEffect(() => {
        const controller = new AbortController();

        // Deferred so the effect body never sets state synchronously.
        queueMicrotask(() => load(controller.signal));

        return () => controller.abort();
    }, [load]);

    if (loading && !student) {
        return (
            <div className="space-y-4" aria-busy="true" aria-label="Loading account">
                <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
            </div>
        );
    }

    if (error && !student) {
        return (
            <ErrorMessage
                title="Unable to load this account"
                message={error}
                onRetry={() => load(new AbortController().signal)}
            />
        );
    }

    if (!student) return null;

    return (
        <>
            <Link
                to="/admin/guidance/students"
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-[#106A2E]"
            >
                <ArrowLeft size={15} /> Back to students
            </Link>

            <PageHeader
                eyebrow={student.role}
                icon={GraduationCap}
                title={student.fullName}
                description={[student.course, student.yearLevel, student.institute]
                    .filter(Boolean)
                    .join(" · ") || "No program information on file"}
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E4EEFB] text-lg font-semibold text-[#1D4ED8]">
                            {initials(student.fullName)}
                        </span>

                        <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-800">
                                {student.fullName}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                <StatusBadge tone={statusTone(student.accountStatus)}>
                                    {student.accountStatus}
                                </StatusBadge>
                                <StatusBadge tone={student.role === "Faculty" ? "amber" : "green"}>
                                    {student.role}
                                </StatusBadge>
                            </div>
                        </div>
                    </div>

                    <dl className="mt-5 space-y-3">
                        <div className={row}>
                            <Mail size={15} className="mt-0.5 shrink-0 text-gray-400" />
                            <dd className="min-w-0 break-all text-gray-600">{student.email}</dd>
                        </div>

                        <div className={row}>
                            <Phone size={15} className="mt-0.5 shrink-0 text-gray-400" />
                            <dd className="text-gray-600">
                                {student.contactNumber || "No contact number"}
                            </dd>
                        </div>
                    </dl>

                    <div className="mt-5 space-y-2 border-t border-black/[0.06] pt-4 text-xs text-gray-500">
                        <p>ID number: {student.idNumber || "—"}</p>
                        <p>
                            Profile: {student.profileComplete ? "Complete" : "Incomplete"}
                            {student.studentStatus ? ` · ${student.studentStatus}` : ""}
                        </p>
                        <p>Last login: {formatDateTime(student.lastLoginAt)}</p>
                        <p>Account created: {formatDate(student.createdAt)}</p>
                    </div>
                </section>

                <div className="space-y-4 lg:col-span-2">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <KpiCard
                            icon={CalendarCheck2}
                            label="Appointments"
                            value={formatNumber(student.appointments)}
                        />
                        <KpiCard
                            icon={MessageSquareMore}
                            label="Chat conversations"
                            value={formatNumber(student.chatConversations)}
                            tone="blue"
                        />
                        <KpiCard
                            icon={GraduationCap}
                            label="Joined"
                            value={formatDate(student.createdAt)}
                            sub="Account creation date"
                            tone="amber"
                        />
                    </div>

                    <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                        <div className="border-b border-black/[0.06] px-5 py-4">
                            <h2 className="text-sm font-semibold text-[#1F1F1F]">
                                Appointment history
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-400">Most recent first</p>
                        </div>

                        {student.appointmentHistory.length === 0 ? (
                            <p className="px-5 py-8 text-center text-sm text-gray-400">
                                This account has never booked a counseling appointment.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[620px] border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-black/[0.06] text-[11px] uppercase tracking-wide text-gray-400">
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 font-medium">Time</th>
                                            <th className="px-4 py-3 font-medium">Concern</th>
                                            <th className="px-4 py-3 font-medium">Counselor</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium">Requested</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-black/[0.04]">
                                        {student.appointmentHistory.map((a) => (
                                            <tr key={a.id}>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {formatDate(a.date)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {a.timeSlot}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {a.concernType || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {a.counselorName || "Unassigned"}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <StatusBadge tone={statusTone(a.status)}>
                                                        {a.status}
                                                    </StatusBadge>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {formatDateTime(a.createdAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
