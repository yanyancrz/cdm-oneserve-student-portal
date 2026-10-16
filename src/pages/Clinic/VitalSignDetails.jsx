import { useNavigate, useParams } from "react-router-dom";

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
import {
    getMyVitalSigns,
    findVitalSign,
} from "../../services/clinicService";

function ActivityIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-6 w-6">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}

function ThermometerIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
            <path d="M14 14.76V5a3 3 0 0 0-6 0v9.76a5 5 0 1 0 6 0Z" />
            <path d="M11 11v7" />
        </svg>
    );
}

function HeartIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
        </svg>
    );
}

function WindIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
            <path d="M3 8h12a3 3 0 1 0-3-3" />
            <path d="M2 12h17a3 3 0 1 1-3 3" />
            <path d="M4 16h5a3 3 0 1 1-3 3" />
        </svg>
    );
}

function DropletIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
            <path d="M12 22a7 7 0 0 0 7-7c0-4-7-13-7-13S5 11 5 15a7 7 0 0 0 7 7Z" />
        </svg>
    );
}

function GaugeIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
            <path d="M4.9 19a9 9 0 1 1 14.2 0" />
            <path d="m12 13 4-4" />
            <path d="M12 17h.01" />
        </svg>
    );
}

function getStatusTheme(status) {
    const normalized = String(status ?? "").toLowerCase();

    if (normalized.includes("critical")) {
        return {
            card: "border-red-200 bg-red-50",
            icon: "bg-red-100 text-red-700",
            heading: "text-red-950",
            description: "text-red-800",
            label: "Critical reading",
        };
    }

    if (normalized.includes("warning")) {
        return {
            card: "border-amber-200 bg-amber-50",
            icon: "bg-amber-100 text-amber-700",
            heading: "text-amber-950",
            description: "text-amber-800",
            label: "Reading needs attention",
        };
    }

    if (normalized.includes("normal")) {
        return {
            card: "border-emerald-200 bg-emerald-50",
            icon: "bg-emerald-100 text-emerald-700",
            heading: "text-emerald-950",
            description: "text-emerald-800",
            label: "Reading recorded as normal",
        };
    }

    return {
        card: "border-slate-200 bg-slate-50",
        icon: "bg-slate-100 text-slate-600",
        heading: "text-slate-900",
        description: "text-slate-600",
        label: "Reading status",
    };
}

function MeasurementCard({ label, value, unit, icon }) {
    return (
        <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 transition-colors hover:border-emerald-200 sm:p-5">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    {icon}
                </div>

                <p className="text-sm leading-5 text-slate-600">
                    {label}
                </p>
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="break-words text-2xl font-semibold tracking-tight text-slate-900">
                    {value}
                </p>

                {unit && (
                    <span className="text-sm text-slate-500">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}

function InformationRow({ label, children }) {
    return (
        <div className="flex flex-col gap-1.5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <p className="text-sm text-slate-500 sm:w-40 sm:flex-shrink-0">
                {label}
            </p>

            <div className="min-w-0 text-sm leading-6 text-slate-800 sm:flex-1 sm:text-right">
                {children || "Not recorded"}
            </div>
        </div>
    );
}

export default function VitalSignDetails() {
    const { vitalSignLogId } = useParams();
    const navigate = useNavigate();

    const { status, data, error, reload } =
        useClinicResource(getMyVitalSigns);

    const log =
        status === "success"
            ? findVitalSign(data, vitalSignLogId)
            : null;

    const theme = log ? getStatusTheme(log.status) : null;

    return (
        <ClinicPage>
            <ClinicHeader
                title="Vital Sign Details"
                subtitle="Review your recorded health measurements"
                backTo="/clinic/vital-signs"
                onRefresh={reload}
                refreshing={status === "loading"}
            />

            {status === "loading" && <ClinicLoading rows={2} />}

            {status === "error" && (
                <ClinicError error={error} onRetry={reload} />
            )}

            {status === "success" && !log && (
                <ClinicEmpty
                    title="Vital-sign log not found"
                    message="This reading isn't available in your account. It may have been removed or the link may be invalid."
                    actionLabel="Back to vital signs"
                    onAction={() => navigate("/clinic/vital-signs")}
                />
            )}

            {log && (
                <div className="space-y-5">
                    <section className={`overflow-hidden rounded-3xl border p-5 shadow-sm sm:p-7 ${theme.card}`}>
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${theme.icon}`}>
                                <ActivityIcon />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-slate-600">
                                    Recorded vital signs
                                </p>

                                <h2 className={`mt-1 text-xl font-semibold tracking-tight sm:text-2xl ${theme.heading}`}>
                                    {theme.label}
                                </h2>

                                <p className={`mt-2 text-sm ${theme.description}`}>
                                    {formatDateTime(log.recordedAt)}
                                </p>
                            </div>

                            <div className="self-start sm:self-center">
                                <StatusBadge status={log.status} />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-5">
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
                                Health readings
                            </p>

                            <h2 className="mt-1 text-lg font-semibold text-slate-900">
                                Measurements
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Values recorded during this clinic visit.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <MeasurementCard
                                label="Temperature"
                                value={display(log.temperature)}
                                unit="°C"
                                icon={<ThermometerIcon />}
                            />

                            <MeasurementCard
                                label="Heart rate"
                                value={display(log.heartRate)}
                                unit="bpm"
                                icon={<HeartIcon />}
                            />

                            <MeasurementCard
                                label="Respiratory rate"
                                value={display(log.respiratoryRate)}
                                unit="breaths/min"
                                icon={<WindIcon />}
                            />

                            <MeasurementCard
                                label="Oxygen saturation (SpO₂)"
                                value={display(log.oxygenSaturation)}
                                unit="%"
                                icon={<DropletIcon />}
                            />

                            <MeasurementCard
                                label="Blood pressure"
                                value={formatBloodPressure(
                                    log.systolicBP,
                                    log.diastolicBP
                                )}
                                icon={<GaugeIcon />}
                            />

                            <MeasurementCard
                                label="Systolic pressure"
                                value={display(log.systolicBP)}
                                unit="mmHg"
                                icon={<GaugeIcon />}
                            />

                            <MeasurementCard
                                label="Diastolic pressure"
                                value={display(log.diastolicBP)}
                                unit="mmHg"
                                icon={<GaugeIcon />}
                            />
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-2">
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
                                Visit information
                            </p>

                            <h2 className="mt-1 text-lg font-semibold text-slate-900">
                                Record details
                            </h2>
                        </div>

                        <div className="divide-y divide-slate-100">
                            <InformationRow label="Visit reason">
                                {display(log.visitReason)}
                            </InformationRow>

                            <InformationRow label="Recorded on">
                                {formatDateTime(log.recordedAt)}
                            </InformationRow>

                            <InformationRow label="Status">
                                <span className="inline-flex sm:justify-end">
                                    <StatusBadge status={log.status} />
                                </span>
                            </InformationRow>
                        </div>

                        <div className="mt-3 rounded-2xl bg-slate-50 p-4 sm:p-5">
                            <p className="text-sm font-medium text-slate-700">
                                Remarks
                            </p>

                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                                {display(log.remarks, "No remarks were recorded for this reading.")}
                            </p>
                        </div>
                    </section>

                    <div className="flex justify-start pb-2">
                        <button
                            type="button"
                            onClick={() => navigate("/clinic/vital-signs")}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                className="h-4 w-4"
                            >
                                <path d="m15 18-6-6 6-6" />
                            </svg>

                            Back to vital signs
                        </button>
                    </div>
                </div>
            )}
        </ClinicPage>
    );
}