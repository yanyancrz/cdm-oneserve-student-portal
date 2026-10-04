import { api } from "./apiClient";

const BASE = "/api/admin/library/faculty";

export const facultyService = {
    async list(params = {}, options) {
        const qs = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== "" && value != null) qs.set(key, value);
        });

        const response = await api.get(`${BASE}?${qs.toString()}`, options);
        return response.data;
    },

    async filters(options) {
        const response = await api.get(`${BASE}/filters`, options);
        return response.data;
    },

    async get(id, options) {
        const response = await api.get(`${BASE}/${id}`, options);
        return response.data;
    },

    async loans(id, options) {
        const response = await api.get(`${BASE}/${id}/loans`, options);
        return response.data;
    },

    async history(id, options) {
        const response = await api.get(`${BASE}/${id}/history`, options);
        return response.data;
    },

    async reservations(id, options) {
        const response = await api.get(`${BASE}/${id}/reservations`, options);
        return response.data;
    },
};