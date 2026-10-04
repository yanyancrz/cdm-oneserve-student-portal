import { api } from "./apiClient";

const BASE = "/api/admin/library/borrowing";

export const borrowingService = {
    async list(params = {}, options) {
        const qs = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== "" && value != null) qs.set(key, value);
        });

        const response = await api.get(`${BASE}?${qs.toString()}`, options);
        return response.data;
    },

    async get(id, options) {
        const response = await api.get(`${BASE}/${id}`, options);
        return response.data;
    },

    async searchPatrons(search, options) {
        const response = await api.get(`${BASE}/patrons?search=${encodeURIComponent(search)}`, options);
        return response.data;
    },

    // identifier = ID number, or "uid:<userId>"
    async patron(identifier, options) {
        const response = await api.get(`${BASE}/patron/${encodeURIComponent(identifier)}`, options);
        return response.data;
    },

    // qrData = raw text decoded by the existing scanner
    async scanPatron(qrData) {
        const response = await api.post(`${BASE}/patron/scan`, { qrData });
        return response.data;
    },

    async borrow(payload) {
        const response = await api.post(BASE, payload);
        return response.data;
    },
};