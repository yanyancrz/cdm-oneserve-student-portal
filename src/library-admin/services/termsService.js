import { api } from "./apiClient";

const BASE = "/api/admin/library/terms";

export const termsService = {
    async get(options) {
        const response = await api.get(BASE, options);
        return response.data;
    },

    // sections = [{ termKey, content }]
    async update(sections) {
        const response = await api.put(BASE, { sections });
        return response.data;
    },
};