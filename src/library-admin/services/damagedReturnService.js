import { api } from "./apiClient";

const BASE = "/api/admin/library/damaged-returns";

export const damagedReturnService = {
    async list(params = {}, options) {
        const qs = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== "" && value != null) qs.set(key, value);
        });

        const response = await api.get(`${BASE}?${qs.toString()}`, options);
        return response.data;
    },

    async setDueDate(transactionId, replacementDueDate) {
        const response = await api.put(`${BASE}/${transactionId}/due-date`, {
            replacementDueDate,
        });
        return response.data;
    },

    async resolve(transactionId) {
        const response = await api.post(`${BASE}/${transactionId}/resolve`);
        return response.data;
    },
};
