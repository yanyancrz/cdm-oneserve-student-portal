import { api } from "./apiClient";

const BASE = "/api/admin/library/returns";

export const returnService = {
    async activeLoans(params = {}, options) {
        const qs = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== "" && value != null) qs.set(key, value);
        });

        const response = await api.get(`${BASE}/active-loans?${qs.toString()}`, options);
        return response.data;
    },

    async lookup(transactionId, options) {
        const response = await api.get(`${BASE}/lookup?transactionId=${transactionId}`, options);
        return response.data;
    },

    async submit({ transactionId, condition, paymentStatus }) {
        const response = await api.post(BASE, {
            transactionId,
            condition,
            paymentStatus: paymentStatus || null,
        });
        return response.data;
    },
};