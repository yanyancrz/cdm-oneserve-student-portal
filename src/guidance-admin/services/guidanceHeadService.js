import { api } from "./apiClient";

// Every endpoint of the Guidance Administration portal.
// Base path is /api/admin/guidance - same JWT as the rest of OneServe.
export const guidanceHeadService = {
    // GET /api/admin/guidance/me
    getMe(options) {
        return api.get("/api/admin/guidance/me", options).then((r) => r.data);
    },

    // GET /api/admin/guidance/dashboard/overview
    getOverview(options) {
        return api.get("/api/admin/guidance/dashboard/overview", options).then((r) => r.data);
    },

    // GET /api/admin/guidance/counselors
    listCounselors(params, options) {
        return api
            .get("/api/admin/guidance/counselors", { ...options, params })
            .then((r) => r.data);
    },

    // GET /api/admin/guidance/counselors/{id}
    getCounselor(id, options) {
        return api.get(`/api/admin/guidance/counselors/${id}`, options).then((r) => r.data);
    },

    // POST /api/admin/guidance/counselors
    createCounselor(body, options) {
        return api.post("/api/admin/guidance/counselors", body, options).then((r) => r.data);
    },

    // PUT /api/admin/guidance/counselors/{id}
    updateCounselor(id, body, options) {
        return api.put(`/api/admin/guidance/counselors/${id}`, body, options).then((r) => r.data);
    },

    // PATCH /api/admin/guidance/counselors/{id}/status
    setCounselorStatus(id, status, options) {
        return api
            .patch(`/api/admin/guidance/counselors/${id}/status`, { status }, options)
            .then((r) => ({ ...(r.data || {}), message: r.message }));
    },

    // POST /api/admin/guidance/counselors/{id}/reset-password
    // Returns the emailed address plus the server message, which names the address.
    sendPasswordReset(id, options) {
        return api
            .post(`/api/admin/guidance/counselors/${id}/reset-password`, undefined, options)
            .then((r) => ({ ...(r.data || {}), message: r.message }));
    },

    // GET /api/admin/guidance/students
    listStudents(params, options) {
        return api.get("/api/admin/guidance/students", { ...options, params }).then((r) => r.data);
    },

    // GET /api/admin/guidance/students/{id}
    getStudent(id, options) {
        return api.get(`/api/admin/guidance/students/${id}`, options).then((r) => r.data);
    },

    // GET /api/admin/guidance/reports/overview?days=
    getReports(days, options) {
        return api
            .get("/api/admin/guidance/reports/overview", { ...options, params: { days } })
            .then((r) => r.data);
    },

    // GET /api/admin/guidance/settings
    getSettings(options) {
        return api.get("/api/admin/guidance/settings", options).then((r) => r.data);
    },

    // PUT /api/admin/guidance/settings
    saveSettings(body, options) {
        return api.put("/api/admin/guidance/settings", body, options).then((r) => r.data);
    },
};

export default guidanceHeadService;
