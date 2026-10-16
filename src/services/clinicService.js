// CMS Clinic module — service layer.
// Consumes the existing CMS integration API through the Mother API_URL:
//   GET {API_URL}/api/integration/student/{studentNumber}/medical-records
//   GET {API_URL}/api/integration/student/{studentNumber}/vital-signs

import { API_URL } from "../config/api";
import { getToken } from "../guidance-admin/utils/session";

const CLINIC_API = `${API_URL}/api/clinic/me`;

// kind: "no-identity" | "network" | "not-found" | "server" | "request" | "malformed"
export class ClinicError extends Error {
    constructor(kind, status) {
        super(kind);
        this.name = "ClinicError";
        this.kind = kind;
        this.status = status;
    }
}

async function fetchCollection(resource, options = {}) {

    let response;

    try {
        response = await fetch(
            `${CLINIC_API}/${resource}`,

            {
                signal: options.signal,
                headers: {
                    Accept: "application/json",
                    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
                },
            }

        );
    } catch (error) {
        if (error?.name === "AbortError") throw error;
        throw new ClinicError("network");
    }

    if (!response.ok) {
        if (response.status === 404) throw new ClinicError("not-found", 404);
        if (response.status >= 500) throw new ClinicError("server", response.status);
        throw new ClinicError("request", response.status);
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new ClinicError("malformed");
    }

    // An empty array is a valid, successful response.
    if (
        !Array.isArray(data) ||
        data.some((item) => item === null || typeof item !== "object")
    ) {
        throw new ClinicError("malformed");
    }

    return data;
}

const time = (value) => {
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? 0 : t;
};

// Newest first
export const getMyMedicalRecords = async (options) => {
    const records = await fetchCollection("medical-records", options);
    return [...records].sort(
        (a, b) =>
            time(b.visitDate ?? b.createdAt) - time(a.visitDate ?? a.createdAt)
    );
};

export const getMyDentalRecords = async (options) => {
    const records = await fetchCollection("dental-records", options);

    return [...records].sort(
        (a, b) =>
            time(b.visitDate ?? b.createdAt) -
            time(a.visitDate ?? a.createdAt)
    );
};

export const getMyReferrals = async (options) => {
    const referrals = await fetchCollection("referrals", options);

    return [...referrals].sort(
        (a, b) =>
            time(b.referralDate ?? b.createdAt) -
            time(a.referralDate ?? a.createdAt)
    );
};

// Newest first
export const getMyVitalSigns = async (options) => {
    const logs = await fetchCollection("vital-signs", options);
    return [...logs].sort((a, b) => time(b.recordedAt) - time(a.recordedAt));
};

// No single-record endpoints exist, so selected records are located locally.
export const findMedicalRecord = (records, medicalRecordId) =>
    records.find((r) => String(r.medicalRecordId) === String(medicalRecordId)) || null;

export const findVitalSign = (logs, vitalSignLogId) =>
    logs.find((v) => String(v.vitalSignLogId) === String(vitalSignLogId)) || null;
