import { api } from "./apiClient";

const BASE = "/api/admin/library/settings";

export const settingsService = {
    async get(options) {
        const response = await api.get(BASE, options);
        return response.data;
    },

    async update(values) {
        const response = await api.put(BASE, {
            overdueFinePerDay: Number(values.overdueFinePerDay),
            studentBorrowLimit: Number(values.studentBorrowLimit),
            facultyBorrowLimit: Number(values.facultyBorrowLimit),
            defaultLoanDays: Number(values.defaultLoanDays),
            reservationPickupDays: Number(values.reservationPickupDays),
        });
        return response.data;
    },
};