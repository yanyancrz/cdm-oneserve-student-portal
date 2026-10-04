import { api } from "./apiClient";

const BASE = "/api/admin/library/reservations";

export const reservationService = {
    // Paged list. Empty filter values are left out of the query string.
    async list(params = {}, options) {
        const qs = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== "" && value != null) qs.set(key, value);
        });

        const response = await api.get(`${BASE}?${qs.toString()}`, options);
        return response.data;
    },

    async summary(options) {
        const response = await api.get(`${BASE}/summary`, options);
        return response.data;
    },

    async get(id, options) {
        const response = await api.get(`${BASE}/${id}`, options);
        return response.data;
    },

    // Head only
    async approve(id) {
        const response = await api.post(`${BASE}/${id}/approve`, {});
        return response.data;
    },

    // Head only. Sets one copy aside for the patron.
    async markReady(id) {
        const response = await api.post(`${BASE}/${id}/ready`, {});
        return response.data;
    },

    // Head only. A reason is required.
    async reject(id, reason) {
        const response = await api.post(`${BASE}/${id}/reject`, { reason });
        return response.data;
    },

    // Head only. The reason is optional.
    async cancel(id, reason) {
        const response = await api.post(`${BASE}/${id}/cancel`, { reason: reason || null });
        return response.data;
    },

    // Head and Staff. Converts the reservation into a loan and returns the receipt.
    async claim(id, { loanDays, acceptedTerms }) {
        const response = await api.post(`${BASE}/${id}/claim`, { loanDays, acceptedTerms });
        return response.data;
    },
};