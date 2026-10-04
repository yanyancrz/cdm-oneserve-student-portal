import { api } from "./apiClient";

export const libraryAccessService = {
    // GET /api/admin/library/me
    // Returns the live Library role + permissions from the database.
    async getMe(options) {
        const response = await api.get("/api/admin/library/me", options);
        return response.data;
    },
};

export default libraryAccessService;