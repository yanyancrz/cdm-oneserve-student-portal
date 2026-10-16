import { useNavigate } from "react-router-dom";

import ClinicPage from "../../components/Clinic/ClinicPage";
import ClinicHeader from "../../components/Clinic/ClinicHeader";
import { ClinicError } from "../../components/Clinic/ClinicStates";
import useClinicResource from "../../components/Clinic/useClinicResource";
import {
    formatDate,
    formatDateTime,
} from "../../components/Clinic/clinicFormat";
import { getMyReferrals } from "../../services/clinicService";

function getReferralStatus(status) {
    const value = String(status ?? "").trim().toLowerCase();

    if (["completed", "closed", "fulfilled"].includes(value)) {
        return {
            label: status,
            className: "bg-emerald-50 text-emerald-700",
        };
    }

    if (["cancelled", "canceled", "rejected"].includes(value)) {
        return {
            label: status,
            className: "bg-red-50 text-red-700",
        };
    }

    if (["pending", "in progress", "processing"].includes(value)) {
        return {
            label: status,
            className: "bg-amber-50 text-amber-700",
        };
    }

    return {
        label: status || "Status unavailable",
        className: "bg-slate-100 text-slate-600",
    };
}

const ReferralIcon = ({ size = 22 }) => (
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
);

const ReferralDetail = ({ label, children }) => (
    <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {children}
        </p>
    </div>
);

export default function Referrals() {
    const navigate = useNavigate();
    const resource = useClinicResource(getMyReferrals);

    const referrals = Array.isArray(resource.data) ? resource.data : [];
    const loading = resource.status === "loading";
    const failed = resource.status === "error";

    return (
        <ClinicPage>
            <ClinicHeader
                title="Referrals"
                subtitle="Your clinic referral records"
                backTo="/clinic"
                onRefresh={resource.reload}
                refreshing={loading}
            />

            <section className="relative mb-8 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white shadow-md shadow-amber-950/5">
                <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-amber-100/70 blur-3xl" />
                <div className="absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-orange-100/40 blur-3xl" />

                <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-600/20">
                            <ReferralIcon size={27} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
                                Continuing care
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                                Your referrals
                            </h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                                Review referrals from your clinic visits, including the receiving facility, referral reason, status, and clinical notes.
                            </p>
                        </div>
                    </div>

                    {resource.status === "success" && (
                        <div className="flex flex-shrink-0 items-center gap-3 self-start rounded-2xl border border-amber-100 bg-white/90 px-4 py-3 shadow-sm sm:self-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                <ReferralIcon size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold leading-none text-slate-900">
                                    {referrals.length}
                                </p>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    {referrals.length === 1 ? "Referral record" : "Referral records"}
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
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                        <ReferralIcon />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-700">
                        Loading your referrals...
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        Please wait while your records are retrieved.
                    </p>
                </div>
            ) : referrals.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                        <ReferralIcon size={28} />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
                        No referrals yet
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        Your clinic referral records will appear here when they are available.
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
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                                Referral history
                            </p>
                            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                                Your referrals
                            </h3>
                        </div>
                        <p className="text-sm text-slate-500">
                            {referrals.length} referral{referrals.length === 1 ? "" : "s"} found
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {referrals.map((referral, index) => {
                            const status = getReferralStatus(referral.status);

                            return (
                                <article
                                    key={
                                        referral.referralId ??
                                        `${referral.referralDate ?? referral.createdAt}-${index}`
                                    }
                                    className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                                            <ReferralIcon />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                                                Referral
                                            </p>
                                            <h4 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                                                {referral.facilityName ||
                                                    "Referral facility not specified"}
                                            </h4>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Referral date:{" "}
                                                {referral.referralDate
                                                    ? formatDate(referral.referralDate)
                                                    : "Not recorded"}
                                            </p>
                                        </div>

                                        <span
                                            className={`max-w-36 flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                                        >
                                            {status.label}
                                        </span>
                                    </div>

                                    {(referral.reasonForReferral || referral.clinicalNotes) && (
                                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                            {referral.reasonForReferral && (
                                                <ReferralDetail label="Reason for referral">
                                                    {referral.reasonForReferral}
                                                </ReferralDetail>
                                            )}

                                            {referral.clinicalNotes && (
                                                <ReferralDetail label="Clinical notes">
                                                    {referral.clinicalNotes}
                                                </ReferralDetail>
                                            )}
                                        </div>
                                    )}

                                    {referral.createdAt && (
                                        <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                                            Record created:{" "}
                                            {formatDateTime(referral.createdAt)}
                                        </p>
                                    )}
                                </article>
                            );
                        })}
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