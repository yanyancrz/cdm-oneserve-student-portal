import { api } from "./apiClient";

export const libraryDashboardService = {
    // GET /api/admin/library/dashboard
    async getStats(options) {
        const response = await api.get("/api/admin/library/dashboard", options);
        return response.data;
    },

    // GET /api/admin/library/dashboard/overdue
    async getOverdue(limit = 10, options) {
        const response = await api.get(
            `/api/admin/library/dashboard/overdue?limit=${limit}`,
            options
        );
        return response.data;
    },

    async getActivity(limit = 10, scope = "mine", options) {
        const response = await api.get(
            `/api/admin/library/dashboard/activity?limit=${limit}&scope=${scope}`,
            options
        );
        return response.data;
    },

    async getSnapshot(signal, scope = "mine") {
        const options = { signal };

        const [stats, overdue, activity] = await Promise.all([
            this.getStats(options),
            this.getOverdue(10, options),
            this.getActivity(10, scope, options),
        ]);

        return { stats, overdue, activity };
    },
};