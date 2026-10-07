import { API_URL } from "../../../config/api";
import { getToken, signOut } from "../utils/session";

export const GUIDANCE_UNAUTHORIZED_EVENT = "guidance:unauthorized";

export class GuidanceApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "GuidanceApiError";
        this.status = status;
    }
}

// Every Guidance call goes through here: it sends the SAME OneServe JWT and
// never sends a user id. The server reads the user from the token.
export async function guidanceFetch(path, { method = "GET", body, signal } = {}) {
    const token = getToken();

    if (!token) {
        throw new GuidanceApiError("You are not signed in.", 401);
    }

    let response;
    try {
        response = await fetch(`${API_URL}/api/guidance${path}`, {
            method,
            signal,
            headers: {
                Authorization: `Bearer ${token}`,
                ...(body ? { "Content-Type": "application/json" } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (error) {
        if (error?.name === "AbortError") throw error;
        throw new GuidanceApiError("Unable to reach the server. Check your connection.", 0);
    }

    let data = null;
    try {
        data = await response.json();
    } catch {
        /* no / non-JSON body - leave data as null */
    }

    if (response.status === 401) {
        signOut();
        window.dispatchEvent(new Event(GUIDANCE_UNAUTHORIZED_EVENT));
    }

    if (!response.ok) {
        throw new GuidanceApiError(
            data?.message || data?.title || "Something went wrong.",
            response.status
        );
    }

    return data;
}

export const guidanceApi = {
    getStudentMe: (signal) => guidanceFetch("/student/me", { signal }),
    getCounselorMe: (signal) => guidanceFetch("/counselor/me", { signal }),

    // ---- student: counselors, availability, appointments ----
    getCounselors: (signal) =>
        guidanceFetch("/student/counselors", { signal }).then((d) => d.counselors || []),

    // Rules the Book screen needs BEFORE it draws the form, e.g. whether today
    // is bookable at all (Guidance Head > Settings > "Same-day bookings").
    getBookingRules: (signal) => guidanceFetch("/student/booking-rules", { signal }),

    getAvailability: (counselorId, date, signal) =>
        guidanceFetch(
            `/student/availability?counselorId=${encodeURIComponent(counselorId)}&date=${encodeURIComponent(date)}`,
            { signal }
        ),

    bookAppointment: (payload) =>
        guidanceFetch("/student/appointments", { method: "POST", body: payload }),

    getMyAppointments: (signal) =>
        guidanceFetch("/student/appointments", { signal }).then((d) => d.appointments || []),

    cancelAppointment: (id) =>
        guidanceFetch(`/student/appointments/${id}`, { method: "DELETE" }),

    // ---- counselor ----
    getCounselorAppointments: ({ status, date } = {}, signal) => {
        const q = new URLSearchParams();
        if (status && status !== "All") q.set("status", status);
        if (date) q.set("date", date);
        return guidanceFetch(`/counselor/appointments?${q}`, { signal }).then((d) => d.appointments || []);
    },

    getCounselorStats: (signal) =>
        guidanceFetch("/counselor/stats", { signal }).then((d) => d.stats),

    getCounselorReport: (signal) =>
        guidanceFetch("/counselor/reports", { signal }).then((d) => d.report),

    updateCounselorProfile: (payload) =>
        guidanceFetch("/counselor/profile", { method: "PUT", body: payload }),

    updateAppointmentStatus: (id, status) =>
        guidanceFetch(`/counselor/appointments/${id}/status`, { method: "PATCH", body: { status } }),

    getRescheduleAvailability: (appointmentId, date, signal) =>
        guidanceFetch(
            `/counselor/reschedule-availability?appointmentId=${appointmentId}&date=${encodeURIComponent(date)}`,
            { signal }
        ),

    rescheduleAppointment: (id, { date, timeSlot, reason, instructions }) =>
        guidanceFetch(`/counselor/appointments/${id}/reschedule`, {
            method: "PATCH",
            body: { date, timeSlot, reason, instructions: instructions || null },
        }),

    getMyAvailability: (signal) =>
        guidanceFetch("/counselor/availability", { signal }).then((d) => d.availability || []),

    addAvailability: (body) => guidanceFetch("/counselor/availability", { method: "POST", body }),

    updateAvailability: (id, body) =>
        guidanceFetch(`/counselor/availability/${id}`, { method: "PATCH", body }),

    deleteAvailability: (id) => guidanceFetch(`/counselor/availability/${id}`, { method: "DELETE" }),

    // ---- counselor: session records, follow-ups, student records ----
    getRecords: (studentId, signal) => {
        const q = studentId ? `?studentId=${studentId}` : "";
        return guidanceFetch(`/counselor/records${q}`, { signal }).then((d) => d.records || []);
    },

    getSessionRecord: (appointmentId, signal) =>
        guidanceFetch(`/counselor/appointments/${appointmentId}/record`, { signal }).then((d) => d.record || null),

    saveSessionRecord: (appointmentId, payload) =>
        guidanceFetch(`/counselor/appointments/${appointmentId}/record`, { method: "PUT", body: payload }),

    getCounselorFollowUps: (signal) =>
        guidanceFetch("/counselor/follow-ups", { signal }).then((d) => d.followUps || []),

    createFollowUp: (payload) =>
        guidanceFetch("/counselor/follow-ups", { method: "POST", body: payload }),

    cancelFollowUp: (id) =>
        guidanceFetch(`/counselor/follow-ups/${id}/cancel`, { method: "POST" }),

    getStudentCases: (signal) =>
        guidanceFetch("/counselor/students", { signal }).then((d) => d.students || []),

    getStudentCase: (studentId, signal) =>
        guidanceFetch(`/counselor/students/${studentId}`, { signal }),

    // ---- student: follow-ups ----
    getMyFollowUps: (signal) =>
        guidanceFetch("/student/follow-ups", { signal }).then((d) => d.followUps || []),

    respondFollowUp: (id, status) =>
        guidanceFetch(`/student/follow-ups/${id}`, { method: "PATCH", body: { status } }),

    // ---- chat (audience = "student" | "counselor") ----
    getConversations: (audience, signal) =>
        guidanceFetch(`/${audience}/conversations`, { signal }).then((d) => d.conversations || []),

    startConversation: (counselorId) =>
        guidanceFetch("/student/conversations", { method: "POST", body: { counselorId } }),

    getMessages: (audience, conversationId, signal) =>
        guidanceFetch(`/${audience}/conversations/${conversationId}/messages`, { signal }).then((d) => d.messages || []),

    sendMessage: (audience, conversationId, body, clientId) =>
        guidanceFetch(`/${audience}/conversations/${conversationId}/messages`, {
            method: "POST",
            body: { body, clientId },
        }),

    markChatRead: (audience, conversationId) =>
        guidanceFetch(`/${audience}/conversations/${conversationId}/read`, { method: "POST" }),

    // ---- alerts (student, faculty and counselor) ----
    // -> { notifications: [{ id, title, message, type, isRead, createdAt }], unreadCount }
    getNotifications: (signal) => guidanceFetch("/notifications", { signal }),

    markNotificationRead: (id) => guidanceFetch(`/notifications/${id}/read`, { method: "PATCH" }),

    markAllNotificationsRead: () => guidanceFetch("/notifications/read-all", { method: "PATCH" }),
};