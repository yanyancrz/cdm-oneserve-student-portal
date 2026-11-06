import { API_URL } from "../../config/api";
import { clearSession, getToken } from "../utils/session";

// Fired on any 401 so the Guidance Head context can send the user back to login.
export const UNAUTHORIZED_EVENT = "guidance-head:unauthorized";

export class ApiError extends Error {
    constructor(message, { status = 0, errors = null } = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
    }
}

function buildUrl(path, params) {
    const url = new URL(`${API_URL}${path}`);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.set(key, value);
            }
        });
    }

    return url.toString();
}

function extractMessage(status, payload) {
    if (payload?.message) return payload.message;
    if (payload?.title) return payload.title;

    if (payload?.errors && typeof payload.errors === "object") {
        const flat = Object.values(payload.errors).flat().join(" ");
        if (flat) return flat;
    }

    switch (status) {
        case 400:
            return "The request was invalid.";
        case 401:
            return "Your session has expired. Please log in again.";
        case 403:
            return "You don't have permission to do this.";
        case 404:
            return "The requested item was not found.";
        case 409:
            return "This action conflicts with the current data.";
        case 500:
            return "Something went wrong on the server. Please try again.";
        default:
            return `Request failed (${status}).`;
    }
}

async function request(path, { method = "GET", body, params, signal, headers: extraHeaders } = {}) {
    const token = getToken();
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;

    const headers = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // For multipart the browser must set the boundary itself.
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
        ...extraHeaders,
    };

    let response;

    try {
        response = await fetch(buildUrl(path, params), {
            method,
            headers,
            body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
            signal,
        });
    } catch (error) {
        if (error?.name === "AbortError") throw error;

        throw new ApiError("Unable to connect to the server. Please try again.", { status: 0 });
    }

    const text = await response.text();
    let payload = null;

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = null;
        }
    }

    if (!response.ok) {
        if (response.status === 401) {
            clearSession();
            window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
        }

        throw new ApiError(extractMessage(response.status, payload), {
            status: response.status,
            errors: payload?.errors ?? null,
        });
    }

    // Normalize to { success, data, message } even if an endpoint returns a bare payload.
    if (payload && typeof payload === "object" && "success" in payload) {
        return payload;
    }

    return { success: true, data: payload, message: null };
}

// Authenticated binary download. The API keeps report files private, so the
// JWT is sent with the request and the caller receives a Blob + file name.
async function download(path, { params, signal } = {}) {
    const token = getToken();

    const response = await fetch(buildUrl(path, params), {
        signal,
        headers: {
            Accept: "application/octet-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!response.ok) {
        let payload = null;
        try {
            payload = await response.json();
        } catch { /* not JSON */ }

        if (response.status === 401) {
            clearSession();
            window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
        }

        throw new ApiError(extractMessage(response.status, payload), { status: response.status });
    }

    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);

    return {
        blob: await response.blob(),
        fileName: match ? decodeURIComponent(match[1]) : "download",
    };
}

export function saveBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

export const api = {
    get: (path, options) => request(path, { ...options, method: "GET" }),
    post: (path, body, options) => request(path, { ...options, method: "POST", body }),
    put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
    patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
    delete: (path, options) => request(path, { ...options, method: "DELETE" }),
    download,
};
