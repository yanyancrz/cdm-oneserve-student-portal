import { API_URL } from "../../config/api";
import { clearSession, getToken } from "../session";

// Fired on any 401 so the Lost & Found gates can send the
// user back to the shared OneServe login.
export const LF_UNAUTHORIZED_EVENT = "lostfound:unauthorized";

export class LostFoundApiError extends Error {
    constructor(message, { status = 0 } = {}) {
        super(message);
        this.name = "LostFoundApiError";
        this.status = status;
    }
}

function buildUrl(path, params) {
    const url = new URL(`${API_URL}${path}`);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.set(key, value);
            }
        });
    }

    return url.toString();
}

function extractMessage(status, payload) {
    if (payload?.message) return payload.message;

    switch (status) {
        case 400:
            return "The request was invalid.";
        case 401:
            return "Your session has expired. Please log in again.";
        case 403:
            return "Lost & Found access required.";
        case 404:
            return "The requested item was not found.";
        case 409:
            return "This action conflicts with the current data.";
        case 500:
            return "Something went wrong on the server. Please try again.";
        default:
            return `Request failed (${status}).`;
    }
}

async function request(path, { method = "GET", body, params, signal } = {}) {
    const token = getToken();

    const isForm = typeof FormData !== "undefined" && body instanceof FormData;

    const headers = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // A FormData body must NOT get an explicit Content-Type: the
        // boundary is appended by the browser.
        ...(body !== undefined && !isForm
            ? { "Content-Type": "application/json" }
            : {}),
    };

    let response;

    try {
        response = await fetch(buildUrl(path, params), {
            method,
            headers,
            body:
                body === undefined
                    ? undefined
                    : isForm
                      ? body
                      : JSON.stringify(body),
            signal,
        });
    } catch (error) {
        if (error?.name === "AbortError") throw error;

        throw new LostFoundApiError(
            "Unable to connect to the server. Please try again.",
            { status: 0 }
        );
    }

    const text = await response.text();
    let payload = null;

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = null;
        }
    }

    if (!response.ok) {
        if (response.status === 401) {
            clearSession();
            window.dispatchEvent(new Event(LF_UNAUTHORIZED_EVENT));
        }

        throw new LostFoundApiError(extractMessage(response.status, payload), {
            status: response.status,
        });
    }

    // The endpoints answer { success, data, message }; a bare
    // payload is normalized to the same shape.
    if (payload && typeof payload === "object" && "success" in payload) {
        return payload;
    }

    return { success: true, data: payload, message: null };
}

const http = {
    get: (path, options) => request(path, { ...options, method: "GET" }),
    post: (path, body, options) => request(path, { ...options, method: "POST", body }),
    put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
    delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

// =====================================================
// USER - reports, claims, matches, recovery, pickup
// =====================================================

export const lfApi = {
    // Reports
    myReports: () => http.get("/api/lostfound/reports/my"),
    publicReports: (params) => http.get("/api/lostfound/reports", { params }),
    recentFound: () => http.get("/api/lostfound/reports/recent-found"),
    report: (id) => http.get(`/api/lostfound/reports/${id}`),
    createReport: (body) => http.post("/api/lostfound/reports", body),
    updateReport: (id, body) => http.put(`/api/lostfound/reports/${id}`, body),
    deleteReport: (id) => http.delete(`/api/lostfound/reports/${id}`),
    uploadReportImage: (file) => {
        const body = new FormData();
        body.append("file", file);
        return http.post("/api/lostfound/reports/upload", body);
    },

    // Claims
    myClaims: () => http.get("/api/lostfound/claims/my"),
    myClaimForReport: (reportId) =>
        http.get(`/api/lostfound/claims/my/${reportId}`),
    claimsForReport: (reportId) =>
        http.get(`/api/lostfound/claims/report/${reportId}`),
    submitClaim: (body) => http.post("/api/lostfound/claims", body),
    updateClaimStatus: (id, status) =>
        http.put(`/api/lostfound/claims/${id}/status`, { status }),
    cancelClaim: (id) => http.put(`/api/lostfound/claims/${id}/cancel`),
    deleteClaim: (id) => http.delete(`/api/lostfound/claims/${id}`),

    // Pickup schedules
    availability: () => http.get("/api/lostfound/schedules/availability"),
    bookSchedule: (body) => http.post("/api/lostfound/schedules/book", body),
    scheduleForClaim: (claimId) =>
        http.get(`/api/lostfound/schedules/claim/${claimId}`),

    // Matches
    myMatches: () => http.get("/api/lostfound/matches/my"),
    myMatchesForReport: (reportId) =>
        http.get(`/api/lostfound/matches/my/${reportId}`),
    match: (id) => http.get(`/api/lostfound/matches/${id}`),
    createMatch: (body) => http.post("/api/lostfound/matches", body),
    confirmMatch: (id) => http.put(`/api/lostfound/matches/${id}/confirm`),

    // Recovery
    recoveryForReport: (reportId) =>
        http.get(`/api/lostfound/recovery/report/${reportId}`),
    myRecovery: () => http.get("/api/lostfound/recovery/my"),
    createRecovery: (body) => http.post("/api/lostfound/recovery", body),

    // Notifications
    notifications: () => http.get("/api/lostfound/notifications"),
    unreadCount: () => http.get("/api/lostfound/notifications/unread-count"),
    markNotificationRead: (id) =>
        http.put(`/api/lostfound/notifications/${id}/read`),
    markAllNotificationsRead: () => http.put("/api/lostfound/notifications/read-all"),
    subscribePush: (body) =>
        http.post("/api/lostfound/notifications/push/subscribe", body),
    unsubscribePush: (body) =>
        http.post("/api/lostfound/notifications/push/unsubscribe", body),
};

// =====================================================
// ADMIN - the Lost & Found console
// =====================================================

export const lfAdminApi = {
    stats: () => http.get("/api/lostfound/admin/stats"),
    reports: () => http.get("/api/lostfound/admin/reports"),
    claims: () => http.get("/api/lostfound/admin/claims"),
    schedules: () => http.get("/api/lostfound/admin/schedules"),
    matches: () => http.get("/api/lostfound/admin/matches"),
    availability: () => http.get("/api/lostfound/admin/availability"),
    updateReportStatus: (id, status) =>
        http.put(`/api/lostfound/reports/${id}/status`, { status }),
    updateClaimStatus: (id, status) =>
        http.put(`/api/lostfound/claims/${id}/status`, { status }),
    createAvailability: (body) =>
        http.post("/api/lostfound/schedules/availability", body),
    createAvailabilityBatch: (body) =>
        http.post("/api/lostfound/schedules/availability/bulk", body),
    deleteAvailability: (id) =>
        http.delete(`/api/lostfound/schedules/availability/${id}`),
    completeSchedule: (id, body) =>
        http.put(`/api/lostfound/schedules/${id}/complete`, body),
};
