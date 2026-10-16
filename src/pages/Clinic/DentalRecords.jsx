import { useNavigate } from "react-router-dom";

import ClinicPage from "../../components/Clinic/ClinicPage";
import ClinicHeader from "../../components/Clinic/ClinicHeader";
import { ClinicError } from "../../components/Clinic/ClinicStates";
import useClinicResource from "../../components/Clinic/useClinicResource";
import {
    formatDate,
    formatDateTime,
} from "../../components/Clinic/clinicFormat";
import { getMyDentalRecords } from "../../services/clinicService";

const DentalIcon = ({ size = 22 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M12 3c-2-2-6-1-7 2-2 5 1 8 2 12 1 3 2 5 3 4 1-1 0-5 2-5s1 4 2 5c1 1 2-1 3-4 1-4 4-7 2-12-1-3-5-4-7-2z" />
    </svg>
);

const DentalDetail = ({ label, children }) => (
    <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {children}
        </p>
    </div>
);

export default function DentalRecords() {
    const navigate = useNavigate();
    const resource = useClinicResource(getMyDentalRecords);

    const records = Array.isArray(resource.data) ? resource.data : [];
    const loading = resource.status === "loading";
    const failed = resource.status === "error";

    return (
        <ClinicPage>
            <ClinicHeader
                title="Dental Records"
                subtitle="Your dental visits and treatments"
                backTo="/clinic"
                onRefresh={resource.reload}
                refreshing={loading}
            />

            <section className="relative mb-8 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white shadow-md shadow-violet-950/5">
                <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-violet-100/70 blur-3xl" />
                <div className="absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-fuchsia-100/40 blur-3xl" />

                <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                            <DentalIcon size={27} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-700">
                                Oral health
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                                Your dental history
                            </h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                                Review the dental findings, diagnoses, treatments, and notes recorded during your clinic visits.
                            </p>
                        </div>
                    </div>

                    {resource.status === "success" && (
                        <div className="flex flex-shrink-0 items-center gap-3 self-start rounded-2xl border border-violet-100 bg-white/90 px-4 py-3 shadow-sm sm:self-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                                <DentalIcon size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold leading-none text-slate-900">
                                    {records.length}
                                </p>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    {records.length === 1 ? "Dental record" : "Dental records"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {failed ? (
                <ClinicError
                    error={resource.error}
                    onRetry={resource.reload}
                />
            ) : loading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                        <DentalIcon />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-700">
                        Loading your dental records...
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        Please wait while your history is retrieved.
                    </p>
                </div>
            ) : records.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                        <DentalIcon size={28} />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
                        No dental records yet
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        Your dental visits and treatments will appear here when records are available.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/clinic")}
                        className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Back to Clinic
                    </button>
                </div>
            ) : (
                <section>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-700">
                                Dental history
                            </p>
                            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                                Your dental visits
                            </h3>
                        </div>
                        <p className="text-sm text-slate-500">
                            {records.length} record{records.length === 1 ? "" : "s"} found
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {records.map((record, index) => (
                            <article
                                key={
                                    record.dentalRecordId ??
                                    `${record.visitDate ?? record.createdAt}-${index}`
                                }
                                className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                                        <DentalIcon />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-700">
                                            Dental consultation
                                        </p>
                                        <h4 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                                            {record.chiefComplaint || "Dental visit"}
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Visit date:{" "}
                                            {record.visitDate
                                                ? formatDate(record.visitDate)
                                                : "Not recorded"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    {record.dentalFindings && (
                                        <DentalDetail label="Dental findings">
                                            {record.dentalFindings}
                                        </DentalDetail>
                                    )}

                                    {record.diagnosis && (
                                        <DentalDetail label="Diagnosis">
                                            {record.diagnosis}
                                        </DentalDetail>
                                    )}

                                    {record.treatmentProvided && (
                                        <DentalDetail label="Treatment provided">
                                            {record.treatmentProvided}
                                        </DentalDetail>
                                    )}

                                    {record.medications && (
                                        <DentalDetail label="Medications">
                                            {record.medications}
                                        </DentalDetail>
                                    )}

                                    {record.clinicalNotes && (
                                        <div className="sm:col-span-2">
                                            <DentalDetail label="Clinical notes">
                                                {record.clinicalNotes}
                                            </DentalDetail>
                                        </div>
                                    )}
                                </div>

                                {record.createdAt && (
                                    <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                                        Record created:{" "}
                                        {formatDateTime(record.createdAt)}
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/clinic")}
                        className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Back to Clinic
                    </button>
                </section>
            )}
        </ClinicPage>
    );
}