import { useNavigate, useParams } from "react-router-dom";

import ClinicPage from "../../components/Clinic/ClinicPage";
import ClinicHeader from "../../components/Clinic/ClinicHeader";
import DetailRow from "../../components/Clinic/DetailRow";
import {
    ClinicLoading,
    ClinicError,
    ClinicEmpty,
} from "../../components/Clinic/ClinicStates";
import useClinicResource from "../../components/Clinic/useClinicResource";
import {
    formatDate,
    formatDateTime,
} from "../../components/Clinic/clinicFormat";
import {
    getMyMedicalRecords,
    findMedicalRecord,
} from "../../services/clinicService";

export default function MedicalRecordDetails() {
    const { medicalRecordId } = useParams();
    const navigate = useNavigate();

    const { status, data, error, reload } =
        useClinicResource(getMyMedicalRecords);

    const record =
        status === "success"
            ? findMedicalRecord(data, medicalRecordId)
            : null;

    return (
        <ClinicPage>
            <ClinicHeader
                title="Medical Record"
                subtitle="Read-only visit details"
                backTo="/clinic/medical-records"
                onRefresh={reload}
                refreshing={status === "loading"}
            />

            {status === "loading" && <ClinicLoading rows={2} />}

            {status === "error" && (
                <ClinicError error={error} onRetry={reload} />
            )}

            {status === "success" && !record && (
                <ClinicEmpty
                    title="Record not found"
                    message="This medical record isn't available in your account."
                    actionLabel="Back to records"
                    onAction={() => navigate("/clinic/medical-records")}
                />
            )}

            {record && (
                <div className="space-y-6">
                    <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white shadow-md shadow-emerald-950/5">
                        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-100/60 blur-3xl" />

                        <div className="relative p-6 sm:p-8">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-900/20">
                                    <svg
                                        width="27"
                                        height="27"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <path d="M14 2v6h6M12 11v6M9 14h6" />
                                    </svg>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                                        Clinic consultation
                                    </p>

                                    <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                                        {record.chiefComplaint || "Visit details"}
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-600">
                                        {formatDate(record.visitDate)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                        Pain scale
                                    </p>

                                    <p className="mt-2 text-xl font-semibold text-slate-900">
                                        {record.painScale == null
                                            ? "Not recorded"
                                            : `${record.painScale} / 10`}
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Reported pain level during the visit
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                        Diagnosis
                                    </p>

                                    <p className="mt-2 break-words text-base font-semibold text-slate-900">
                                        {(() => {
                                            const diagnosis = record.diagnosis?.trim();

                                            return !diagnosis || diagnosis.toLowerCase() === "none"
                                                ? "No diagnosis recorded"
                                                : diagnosis;
                                        })()}
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Clinical assessment
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                                Consultation details
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Information documented during your clinic visit.
                            </p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            <DetailRow
                                label="Visit date"
                                value={formatDate(record.visitDate)}
                            />

                            <DetailRow
                                label="Chief complaint"
                                value={record.chiefComplaint}
                            />

                            <DetailRow
                                label="Pain scale"
                                value={
                                    record.painScale == null
                                        ? null
                                        : `${record.painScale} / 10`
                                }
                            />

                            <DetailRow
                                label="Diagnosis"
                                value={record.diagnosis}
                            />

                            <div className="bg-white px-5 py-5 sm:px-6">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                    Medications
                                </p>

                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                                    {record.medications?.trim() || "No medication information recorded"}
                                </p>
                            </div>

                            <div className="border-t border-slate-100 bg-white px-5 py-5 sm:px-6">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                    Allergies
                                </p>

                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                                    {record.allergies?.trim() || "No allergy information recorded"}
                                </p>
                            </div>

                            <div className="border-t border-slate-100 bg-white px-5 py-5 sm:px-6">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                    Clinical notes
                                </p>

                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                                    {record.clinicalNotes?.trim() || "No clinical notes recorded"}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-600">
                                Record history
                            </h3>
                        </div>

                        <div className="divide-y divide-slate-100">
                            <DetailRow
                                label="Created"
                                value={formatDateTime(record.createdAt)}
                            />

                            <DetailRow
                                label="Last updated"
                                value={formatDateTime(record.updatedAt)}
                            />
                        </div>
                    </section>
                </div>
            )}
        </ClinicPage>
    );
}