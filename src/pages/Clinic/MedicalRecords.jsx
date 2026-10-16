import { useNavigate } from "react-router-dom";

import ClinicPage from "../../components/Clinic/ClinicPage";
import ClinicHeader from "../../components/Clinic/ClinicHeader";
import {
    ClinicLoading,
    ClinicError,
    ClinicEmpty,
} from "../../components/Clinic/ClinicStates";
import useClinicResource from "../../components/Clinic/useClinicResource";
import {
    display,
    formatDate,
} from "../../components/Clinic/clinicFormat";
import { getMyMedicalRecords } from "../../services/clinicService";

export default function MedicalRecords() {
    const navigate = useNavigate();
    const { status, data, error, reload } =
        useClinicResource(getMyMedicalRecords);

    return (
        <ClinicPage>
            <ClinicHeader
                title="Medical Records"
                subtitle="Your clinic visits and consultation history"
                backTo="/clinic"
                onRefresh={reload}
                refreshing={status === "loading"}
            />

            <section className="relative mb-8 overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white shadow-md shadow-emerald-950/5">
                <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-100/60 blur-2xl" />

                <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-900/20">
                            <svg
                                width="30"
                                height="30"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                                <path d="M8 13h8M8 17h8M8 9h1" />
                            </svg>
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                                Your health records
                            </p>

                            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                                Consultation history
                            </h2>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                                A record of your clinic visits, consultations, and diagnoses.
                            </p>
                        </div>
                    </div>

                    {status === "success" && (
                        <div className="flex flex-shrink-0 items-center gap-4 rounded-2xl border border-emerald-100 bg-white/90 px-5 py-4 shadow-sm">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M8 6h13M8 12h13M8 18h13" />
                                    <path d="M3 6h.01M3 12h.01M3 18h.01" />
                                </svg>
                            </div>

                            <div>
                                <p className="text-3xl font-semibold leading-none tracking-tight text-emerald-800">
                                    {data.length}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {data.length === 1 ? "Total record" : "Total records"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {status === "loading" && <ClinicLoading />}

            {status === "error" && (
                <ClinicError error={error} onRetry={reload} />
            )}

            {status === "success" && data.length === 0 && (
                <ClinicEmpty
                    title="No medical records yet"
                    message="Your clinic visits will appear here after your consultation."
                />
            )}

            {status === "success" && data.length > 0 && (
                <section>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                Visit history
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Select a visit to view its full details.
                            </p>
                        </div>

                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                            {data.length} total
                        </span>
                    </div>

                    <div className="flex flex-col gap-4">
                        {data.map((record, index) => (
                            <button
                                key={record.medicalRecordId ?? index}
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/clinic/medical-records/${record.medicalRecordId}`
                                    )
                                }
                                className="group w-full rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-950/5 active:scale-[0.995] sm:p-6"
                            >
                                <div className="flex w-full items-start gap-4">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 transition-colors group-hover:bg-emerald-100">
                                        <svg
                                            width="22"
                                            height="22"
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
                                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
                                            Clinic consultation
                                        </p>

                                        <p className="mt-1 break-words text-lg font-semibold tracking-tight text-slate-900">
                                            {display(record.chiefComplaint)}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {formatDate(record.visitDate)}
                                        </p>
                                    </div>

                                    <span className="flex-shrink-0 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-800">
                                        Pain {display(record.painScale)}/10
                                    </span>
                                </div>

                                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                                            <svg
                                                width="17"
                                                height="17"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <path d="M9 12h6M9 16h6M9 8h2" />
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <path d="M14 2v6h6" />
                                            </svg>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                                Diagnosis
                                            </p>
                                            <p className="mt-1 break-words text-sm leading-6 text-slate-800">
                                                {(() => {
                                                    const diagnosis = display(record.diagnosis);
                                                    return !diagnosis || diagnosis.toLowerCase() === "none"
                                                        ? "No diagnosis recorded"
                                                        : diagnosis;
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex w-full items-center justify-between gap-3 pt-5">
                                    <span className="text-xs text-slate-400">
                                        Medical record
                                    </span>

                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 transition-colors group-hover:text-emerald-900">
                                        View details
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </ClinicPage>
    );
}