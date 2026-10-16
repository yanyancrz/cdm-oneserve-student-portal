import { useNavigate } from "react-router-dom";

import ClinicPage from "../../components/Clinic/ClinicPage";
import ClinicHeader from "../../components/Clinic/ClinicHeader";
import StatusBadge from "../../components/Clinic/StatusBadge";
import {
    ClinicLoading,
    ClinicError,
    ClinicEmpty,
} from "../../components/Clinic/ClinicStates";
import useClinicResource from "../../components/Clinic/useClinicResource";
import {
    display,
    formatDateTime,
    formatBloodPressure,
} from "../../components/Clinic/clinicFormat";
import { getMyVitalSigns } from "../../services/clinicService";

const getVitalCardStyle = (status) => {
    const normalizedStatus = String(status ?? "").trim().toLowerCase();

    if (normalizedStatus === "critical") {
        return {
            card: "border-red-200 bg-gradient-to-br from-red-50 via-white to-red-50/40 hover:border-red-300 hover:shadow-red-900/10",
        };
    }

    if (normalizedStatus === "warning") {
        return {
            card: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 hover:border-amber-300 hover:shadow-amber-900/10",
        };
    }

    if (normalizedStatus === "normal") {
        return {
            card: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 hover:border-emerald-300 hover:shadow-emerald-900/10",
        };
    }

    return {
        card: "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-slate-900/5",
    };
};

const Stat = ({ label, value, icon }) => (
    <div className="group min-w-0 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition-colors group-hover:bg-white">
        <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                {icon}
            </span>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {label}
            </p>
        </div>
        <p className="mt-3 break-words text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            {value}
        </p>
    </div>
);

const HeartbeatIcon = ({ size = 22 }) => (
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
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

const ThermometerIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 14.76V5a3 3 0 0 0-6 0v9.76a5 5 0 1 0 6 0Z" />
        <path d="M11 11v6" />
    </svg>
);

const HeartIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
);

const LungsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 12V4" />
        <path d="M10 9c-2-3-3-4-4-2-2 3-4 7-4 10a4 4 0 0 0 7 2c1-2 1-5 1-7" />
        <path d="M14 9c2-3 3-4 4-2 2 3 4 7 4 10a4 4 0 0 1-7 2c-1-2-1-5-1-7" />
    </svg>
);

const OxygenIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11Z" />
        <path d="M8 12h2l1-2 2 4 1-2h2" />
    </svg>
);

const PressureIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
    </svg>
);

export default function VitalSigns() {
    const navigate = useNavigate();
    const { status, data, error, reload } = useClinicResource(getMyVitalSigns);

    const readings = Array.isArray(data) ? data : [];

    return (
        <ClinicPage>
            <ClinicHeader
                title="Vital Signs"
                subtitle="Your vital-sign history"
                backTo="/clinic"
                onRefresh={reload}
                refreshing={status === "loading"}
            />

            <section className="relative mb-8 overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white shadow-md shadow-emerald-950/5">
                <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-emerald-100/70 blur-3xl" />
                <div className="absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-teal-100/50 blur-3xl" />

                <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                            <HeartbeatIcon size={27} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                                Health monitoring
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                                Your vital signs
                            </h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                                Review the measurements recorded during your clinic visits, including temperature, heart rate, breathing, oxygen saturation, and blood pressure.
                            </p>
                        </div>
                    </div>

                    {status === "success" && (
                        <div className="flex flex-shrink-0 items-center gap-3 self-start rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm sm:self-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <HeartbeatIcon size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold leading-none text-slate-900">
                                    {readings.length}
                                </p>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    {readings.length === 1 ? "Recorded reading" : "Recorded readings"}
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

            {status === "success" && readings.length === 0 && (
                <ClinicEmpty
                    title="No vital signs yet"
                    message="Your recorded vital signs will appear here after a clinic visit."
                />
            )}

            {status === "success" && readings.length > 0 && (
                <section>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
                                Reading history
                            </p>
                            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                                Your recorded measurements
                            </h3>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                            Select a reading to view details
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {readings.map((log, index) => {
                            const colors = getVitalCardStyle(log.status);

                            return (
                                <button
                                    key={log.vitalSignLogId ?? index}
                                    type="button"
                                    onClick={() =>
                                        navigate(`/clinic/vital-signs/${log.vitalSignLogId}`)
                                    }
                                    className={`group w-full rounded-3xl border p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.995] sm:p-6 ${colors.card}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                                            <HeartbeatIcon />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
                                                Vital-sign reading
                                            </p>
                                            <h4 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                                                Recorded measurements
                                            </h4>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {formatDateTime(log.recordedAt)}
                                            </p>
                                        </div>

                                        <div className="flex-shrink-0">
                                            <StatusBadge status={log.status} />
                                        </div>
                                    </div>

                                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                        <Stat
                                            label="Temperature"
                                            value={display(log.temperature, " °C")}
                                            icon={<ThermometerIcon />}
                                        />
                                        <Stat
                                            label="Heart rate"
                                            value={display(log.heartRate, " bpm")}
                                            icon={<HeartIcon />}
                                        />
                                        <Stat
                                            label="Respiratory rate"
                                            value={display(log.respiratoryRate, " breaths/min")}
                                            icon={<LungsIcon />}
                                        />
                                        <Stat
                                            label="Oxygen (SpO₂)"
                                            value={display(log.oxygenSaturation, "%")}
                                            icon={<OxygenIcon />}
                                        />
                                        <Stat
                                            label="Blood pressure"
                                            value={formatBloodPressure(log.systolicBP, log.diastolicBP)}
                                            icon={<PressureIcon />}
                                        />
                                    </div>

                                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <span className="text-xs font-medium text-slate-500">
                                            Reading #{log.vitalSignLogId ?? index + 1}
                                        </span>
                                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-700 transition-all group-hover:gap-2">
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
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}
        </ClinicPage>
    );
}