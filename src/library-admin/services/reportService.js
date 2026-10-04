import { api } from "./apiClient";

const BASE = "/api/admin/library/reports";

function qs(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== "" && value != null) query.set(key, value);
    });

    return query.toString();
}

export const reportService = {
    async summary(params, options) {
        const response = await api.get(`${BASE}/summary?${qs(params)}`, options);
        return response.data;
    },

    async circulation(params, options) {
        const response = await api.get(`${BASE}/circulation?${qs(params)}`, options);
        return response.data;
    },

    async institutes(params, options) {
        const response = await api.get(`${BASE}/institutes?${qs(params)}`, options);
        return response.data;
    },

    async topBooks(params, options) {
        const response = await api.get(`${BASE}/top-books?${qs({ ...params, limit: 10 })}`, options);
        return response.data;
    },

    // Returns { fileName, columns, rows }.
    async exportTable(dataset, params, options) {
        const response = await api.get(`${BASE}/export/${dataset}?${qs(params)}`, options);
        return response.data;
    },
};