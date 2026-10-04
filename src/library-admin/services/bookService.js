import { api } from "./apiClient";
import { API_URL } from "../../config/api";

const BASE = "/api/admin/library/books";

// Turns a stored relative path (library/covers/x.jpg) into a loadable URL.
export function fileUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${String(API_URL).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
}

const toNumberOrNull = (v) => (v === "" || v == null ? null : Number(v));
const toTextOrNull = (v) => (v == null || String(v).trim() === "" ? null : String(v).trim());

// Form values -> API payload.
export function toPayload(v) {
    return {
        bookCode: toTextOrNull(v.bookCode),
        isbn: String(v.isbn || "").trim(),
        title: String(v.title || "").trim(),
        author: String(v.author || "").trim(),
        publisher: toTextOrNull(v.publisher),
        category: toTextOrNull(v.category),
        institute: toTextOrNull(v.institute),
        yearLevel: toTextOrNull(v.yearLevel),
        semester: toTextOrNull(v.semester),
        ddc: toTextOrNull(v.ddc),
        callNo: toTextOrNull(v.callNo),
        description: toTextOrNull(v.description),
        language: toTextOrNull(v.language),
        edition: toTextOrNull(v.edition),
        publishYear: toNumberOrNull(v.publishYear),
        shelfLocation: toTextOrNull(v.shelfLocation),
        totalCopies: Number(v.totalCopies) || 0,
    };
}

export const bookService = {
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

    async create(values) {
        const response = await api.post(BASE, toPayload(values));
        return response.data;
    },

    async update(id, values) {
        const response = await api.put(`${BASE}/${id}`, toPayload(values));
        return response.data;
    },

    async remove(id) {
        const response = await api.delete(`${BASE}/${id}`);
        return response.data;
    },

    async uploadCover(id, file) {
        const body = new FormData();
        body.append("file", file);
        const response = await api.post(`${BASE}/${id}/upload-cover`, body);
        return response.data;
    },

    async uploadPdf(id, file) {
        const body = new FormData();
        body.append("file", file);
        const response = await api.post(`${BASE}/${id}/upload-pdf`, body);
        return response.data;
    },

    // Uploads whichever files were chosen. Throws on the first failure.
    async uploadFiles(id, { cover, pdf } = {}) {
        if (cover) await this.uploadCover(id, cover);
        if (pdf) await this.uploadPdf(id, pdf);
    },
};