
import { useNavigate } from "react-router-dom";

import ClinicPage from "../../components/Clinic/ClinicPage";
import ClinicHeader from "../../components/Clinic/ClinicHeader";
import StatusBadge from "../../components/Clinic/StatusBadge";
import { ClinicError } from "../../components/Clinic/ClinicStates";
import useClinicResource from "../../components/Clinic/useClinicResource";
import {
    formatDate,
    formatDateTime,
} from "../../components/Clinic/clinicFormat";
import {
    getMyMedicalRecords,
    getMyVitalSigns,
    getMyDentalRecords,
    getMyReferrals,
} from "../../services/clinicService";

export default function Clinic() {
    const navigate = useNavigate();

    const records = useClinicResource(getMyMedicalRecords);
    const vitals = useClinicResource(getMyVitalSigns);
    const dentalRecords = useClinicResource(getMyDentalRecords);
    const referrals = useClinicResource(getMyReferrals);

    const resources = [records, vitals, dentalRecords, referrals];

    const loading = resources.some(
        (resource) => resource.status === "loading"
    );

    const bothFailed = resources.every(
        (resource) => resource.status === "error"
    );

    const refresh = () => {
        resources.forEach((resource) => resource.reload());
    };

    const latestRecord = records.data?.[0];
    const latestVital = vitals.data?.[0];
    const latestDentalRecord = dentalRecords.data?.[0];
    const latestReferral = referrals.data?.[0];

    const cards = [
        {
            key: "records",
            title: "Medical Records",
            route: "/clinic/medical-records",
            bg: "#FAECE7",
            color: "#712B13",
            summary:
                records.status === "success"
                    ? latestRecord
                        ? `${records.data.length} record${records.data.length === 1 ? "" : "s"} · Last visit ${formatDate(latestRecord.visitDate)}`
                        : "No visits yet"
                    : records.status === "error"
                        ? "Unavailable"
                        : "Loading…",
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M12 12v6M9 15h6" />
                </svg>
            ),
        },
        {
            key: "vitals",
            title: "Vital Signs",
            route: "/clinic/vital-signs",
            bg: "#E1F5EE",
            color: "#085041",
            summary:
                vitals.status === "success"
                    ? latestVital
                        ? `${vitals.data.length} log${vitals.data.length === 1 ? "" : "s"} · Latest ${formatDateTime(latestVital.recordedAt)}`
                        : "No vital signs yet"
                    : vitals.status === "error"
                        ? "Unavailable"
                        : "Loading…",
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
            ),
        },
        {
            key: "dental",
            title: "Dental Records",
            route: "/clinic/dental-records",
            bg: "#EDE9FE",
            color: "#5B21B6",
            summary:
                dentalRecords.status === "success"
                    ? latestDentalRecord
                        ? `${dentalRecords.data.length} record${dentalRecords.data.length === 1 ? "" : "s"} · Last visit ${formatDate(latestDentalRecord.visitDate)}`
                        : "No dental visits yet"
                    : dentalRecords.status === "error"
                        ? "Unavailable"
                        : "Loading…",
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 3c-2-2-6-1-7 2-2 5 1 8 2 12 1 3 2 5 3 4 1-1 0-5 2-5s1 4 2 5c1 1 2-1 3-4 1-4 4-7 2-12-1-3-5-4-7-2z" />
                </svg>
            ),
        },
        {
            key: "referrals",
            title: "Referrals",
            route: "/clinic/referrals",
            bg: "#FEF3C7",
            color: "#92400E",
            summary:
                referrals.status === "success"
                    ? latestReferral
                        ? `${referrals.data.length} referral${referrals.data.length === 1 ? "" : "s"} · Latest ${formatDate(latestReferral.referralDate)}`
                        : "No referrals yet"
                    : referrals.status === "error"
                        ? "Unavailable"
                        : "Loading…",
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M8 13h8M8 17h5" />
                    <path d="m9 10 2 2 4-4" />
                </svg>
            ),
        },
    ];

    return (
        <ClinicPage>
            <ClinicHeader
                title="Clinic"
                subtitle="Your health records"
                backTo="/dashboard"
                onRefresh={refresh}
                refreshing={loading}
            />

            {bothFailed && (
                <div className="mb-4">
                    <ClinicError
                        error={records.error}
                        onRetry={refresh}
                    />
                </div>
            )}

            {!bothFailed && (
                <div className="space-y-4">

                    <div className="relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-emerald-800 to-emerald-950 px-6 py-8 text-white shadow-xl shadow-emerald-950/15 sm:px-9 sm:py-10">
                        <div className="pointer-events-none absolute inset-0 opacity-20">
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
                                    backgroundSize: "34px 34px",
                                }}
                            />
                        </div>

                        <div className="relative">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
                                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                                CDM Clinic
                            </div>

                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Your health, <span className="text-emerald-300">in focus.</span>
                            </h2>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/85 sm:text-base">
                                View your medical records, vital-sign readings, dental visits,
                                and referrals in one place.
                            </p>
                        </div>

                        <svg
                            className="pointer-events-none absolute right-6 top-6 h-10 w-10 text-emerald-100/70 sm:right-9 sm:top-9 sm:h-14 sm:w-14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>

                    {latestVital && (
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
                                        <path d="m9 12 2 2 4-4" />
                                    </svg>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-900">
                                        Latest vital-sign status
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Based on your latest recorded reading
                                    </p>
                                </div>

                                <StatusBadge status={latestVital.status} />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {cards.map((card) => (
                        <button
                            key={card.key}
                            type="button"
                            onClick={() => navigate(card.route)}
                            className="group relative flex min-h-44 w-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-950/5 active:scale-[0.99] sm:min-h-48 sm:p-6"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
                                    style={{
                                        background: card.bg,
                                        color: card.color,
                                    }}
                                >
                                    {card.icon}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-lg font-bold tracking-tight text-slate-900">
                                        {card.title}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                        {card.summary}
                                    </p>

                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                            Total activity
                                        </span>

                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
                                            {card.key === "records"
                                                ? records.data?.length ?? "—"
                                                : card.key === "vitals"
                                                    ? vitals.data?.length ?? "—"
                                                    : card.key === "dental"
                                                        ? dentalRecords.data?.length ?? "—"
                                                        : referrals.data?.length ?? "—"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700">
                                    <svg
                                        width="18"
                                        height="18"
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
                                </div>
                            </div>
                        </button>
                    ))}
                    </div>
                </div>
            )}
        </ClinicPage>
    );
}
