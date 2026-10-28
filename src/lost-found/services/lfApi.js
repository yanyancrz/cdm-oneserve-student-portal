import { API_URL } from "../../config/api";
import { getSessionKey } from "../../session/deviceSession";
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
    const sessionKey = getSessionKey();

    const isForm = typeof FormData !== "undefined" && body instanceof FormData;

    const headers = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(sessionKey ? { "X-Session-Key": sessionKey } : {}),
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
    recentLost: () => http.get("/api/lostfound/reports/recent-lost"),
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
    updateMyClaim: (claimId, body) =>
        http.put(`/api/lostfound/claims/${claimId}`, body),
    updateClaimStatus: (id, status, reason) =>
        http.put(`/api/lostfound/claims/${id}/status`, { status, reason }),
    cancelClaim: (id) => http.put(`/api/lostfound/claims/${id}/cancel`),
    deleteClaim: (id) => http.delete(`/api/lostfound/claims/${id}`),

    // Proof of ownership (optional). The file is uploaded first and only
    // its server-side reference travels with the claim, so a proof is
    // never a public URL.
    uploadClaimProof: (file) => {
        const body = new FormData();
        body.append("file", file);
        return http.post("/api/lostfound/claims/proof-upload", body);
    },
    /** Authorized proof URL - only the claimant, the finder or an admin can read it. */
    claimProofUrl: (claimId) =>
        `${API_URL}/api/lostfound/claims/${claimId}/proof`,

    /**
     * Loads the proof FILE, token and all, and hands back an object URL.
     *
     * An <img src> or a plain link cannot send an Authorization header,
     * and the proof endpoint is [Authorize] - so the bytes are fetched
     * here with the session token and turned into a blob URL. That is
     * what lets the preview render ON the claim page instead of opening
     * a new tab that answers 401.
     *
     * The caller owns the returned URL and must URL.revokeObjectURL() it
     * when the preview goes away.
     */
    claimProofBlobUrl: async (claimId) => {
        const token = getToken();
        const sessionKey = getSessionKey();
        const response = await fetch(
            `${API_URL}/api/lostfound/claims/${claimId}/proof`,
            {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...(sessionKey ? { "X-Session-Key": sessionKey } : {}),
                },
            }
        );

        if (!response.ok) {
            throw new LostFoundApiError(
                response.status === 403
                    ? "Your session can no longer view this proof. Log in again as the finder or the FIND admin."
                    : `The proof file could not be loaded (HTTP ${response.status}).`,
                { status: response.status }
            );
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    },

    // Pickup schedules (view-only: students walk in during published
    // windows, nobody books a slot)
    availability: () => http.get("/api/lostfound/schedules/availability"),
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
    // Who am I + what may I do (works even while a password change is due).
    me: () => http.get("/api/lostfound/admin/me"),

    stats: () => http.get("/api/lostfound/admin/stats"),
    reports: () => http.get("/api/lostfound/admin/reports"),
    reportDetail: (id) => http.get(`/api/lostfound/admin/reports/${id}`),
    claims: () => http.get("/api/lostfound/admin/claims"),
    schedules: () => http.get("/api/lostfound/admin/schedules"),
    matches: () => http.get("/api/lostfound/admin/matches"),
    availability: () => http.get("/api/lostfound/admin/availability"),
    updateReportStatus: (id, status) =>
        http.put(`/api/lostfound/reports/${id}/status`, { status }),
    updateClaimStatus: (id, status, reason) =>
        http.put(`/api/lostfound/claims/${id}/status`, { status, reason }),
    createAvailability: (body) =>
        http.post("/api/lostfound/schedules/availability", body),
    createAvailabilityBatch: (body) =>
        http.post("/api/lostfound/schedules/availability/bulk", body),
    deleteAvailability: (id) =>
        http.delete(`/api/lostfound/schedules/availability/${id}`),
    completeSchedule: (id, body) =>
        http.put(`/api/lostfound/schedules/${id}/complete`, body),

    // ---------------------------------------------------------------
    // ADMIN MANAGEMENT, LOGIN MONITORING AND AUDIT
    // Super-Admin-only on the server; a Sub-Admin gets 403.
    // ---------------------------------------------------------------
    admins: () => http.get("/api/lostfound/admin/admins"),
    createAdmin: (body) => http.post("/api/lostfound/admin/admins", body),
    setAdminStatus: (id, isActive) =>
        http.put(`/api/lostfound/admin/admins/${id}/status`, { isActive }),
    loginActivity: () => http.get("/api/lostfound/admin/login-activity"),
    activityLog: (params) =>
        http.get("/api/lostfound/admin/activity-log", { params }),

    /** Ends this device's session record before dropping the local token. */
    logout: () => http.post("/api/auth/session/logout", {}),

    // ---------------------------------------------------------------
    // Profile settings - the console administrator's OWN account.
    // These are the same shared /api/profile endpoints the student
    // and counselor portals use, so there is no new API surface.
    // The user id always comes from the signed-in session (the
    // shared OneServe login), never from an editable field.
    //
    // NOTE: `profileMe` reads the shared profile; `me` above is the
    // console identity/authorisation endpoint.
    // ---------------------------------------------------------------
    profileMe: (email) => http.get(`/api/profile/${encodeURIComponent(email)}`),
    updateProfile: (body) => http.put("/api/profile/update", body),
    uploadProfilePhoto: (file, userId) => {
        const body = new FormData();
        body.append("file", file);
        body.append("userId", String(userId));
        return http.post("/api/profile/upload-photo", body);
    },
    requestEmailChange: (body) =>
        http.post("/api/profile/request-email-change", body),
    verifyEmailChange: (body) =>
        http.post("/api/profile/verify-email-change", body),
    changePassword: (body) => http.post("/api/profile/change-password", body),
};
