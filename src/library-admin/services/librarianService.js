import { api } from "./apiClient";

const BASE = "/api/admin/library/librarians";

export const librarianService = {
    async list(params = {}, options) {
        const qs = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== "" && value != null) qs.set(key, value);
        });

        const response = await api.get(`${BASE}?${qs.toString()}`, options);
        return response.data;
    },

    async activity(id, options) {
        const response = await api.get(`${BASE}/${id}/activity`, options);
        return response.data;
    },

    async create(values) {
        const response = await api.post(BASE, {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            idNumber: values.idNumber.trim(),
            email: values.email.trim(),
            password: values.password,
        });
        return response.data;
    },

    async update(id, values) {
        const response = await api.put(`${BASE}/${id}`, {
            fullName: values.fullName.trim(),
            idNumber: values.idNumber.trim(),
            email: values.email.trim(),
        });
        return response.data;
    },

    async disable(id) {
        const response = await api.delete(`${BASE}/${id}`);
        return response.data;
    },

    async enable(id) {
        const response = await api.post(`${BASE}/${id}/enable`, {});
        return response.data;
    },

    // Returns { temporaryPassword }.
    async resetPassword(id) {
        const response = await api.post(`${BASE}/${id}/reset-password`, {});
        return response.data;
    },
};