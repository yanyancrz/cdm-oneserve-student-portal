import { API_URL } from "../../config/api";
import { clearSession, getToken } from "../session";

// Fired on any 401 so the marketplace gates can send the user back to login.
export const MARKET_UNAUTHORIZED_EVENT = "marketplace:unauthorized";

export class MarketplaceApiError extends Error {
    constructor(message, { status = 0, errors = null } = {}) {
        super(message);
        this.name = "MarketplaceApiError";
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
            return "Marketplace Staff access required.";
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

const OPERATOR_SESSION_KEY = "marketplace:operatorSessionId";

/** The active duty-shift session id, set by the session setup screen. */
export function getOperatorSessionId() {
    try {
        return localStorage.getItem(OPERATOR_SESSION_KEY);
    } catch {
        return null;
    }
}

export function setOperatorSessionId(sessionId) {
    try {
        if (sessionId) localStorage.setItem(OPERATOR_SESSION_KEY, sessionId);
        else localStorage.removeItem(OPERATOR_SESSION_KEY);
    } catch {
        // Storage unavailable - mutations will ask for a session instead.
    }
}

async function request(path, { method = "GET", body, params, signal } = {}) {
    const token = getToken();
    const operatorSession = getOperatorSessionId();

    const isForm = typeof FormData !== "undefined" && body instanceof FormData;

    const headers = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Every staff call carries the duty-shift session when one is open.
        // The server validates it belongs to the caller; reads cope without
        // one, mutations refuse without one.
        ...(operatorSession ? { "X-Operator-Session": operatorSession } : {}),
        // A FormData body must NOT get an explicit Content-Type: the boundary is
        // appended by the browser, and overriding it makes the server see an
        // empty body.
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
    };

    let response;

    try {
        response = await fetch(buildUrl(path, params), {
            method,
            headers,
            body:
                body === undefined
                    ? undefined
                    : isForm
                      ? body
                      : JSON.stringify(body),
            signal,
        });
    } catch (error) {
        if (error?.name === "AbortError") throw error;

        throw new MarketplaceApiError(
            "Unable to connect to the server. Please try again.",
            { status: 0 }
        );
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
            setOperatorSessionId(null);
            window.dispatchEvent(new Event(MARKET_UNAUTHORIZED_EVENT));
        }

        throw new MarketplaceApiError(extractMessage(response.status, payload), {
            status: response.status,
            errors: payload?.errors ?? null,
        });
    }

    // The marketplace endpoints already answer { success, data, message }, but a
    // bare payload is normalized to the same shape so callers only handle one.
    if (payload && typeof payload === "object" && "success" in payload) {
        return payload;
    }

    return { success: true, data: payload, message: null };
}

const http = {
    get: (path, options) => request(path, { ...options, method: "GET" }),
    post: (path, body, options) => request(path, { ...options, method: "POST", body }),
    put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
    patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
    delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

// ---- multipart ----
// The marketplace API sends FormData bodies through without a Content-Type, so
// the browser sets the multipart boundary itself. Setting it by hand is what
// breaks multipart uploads.

// =====================================================
// BUYER
// =====================================================

export const buyerApi = {
    me: () => http.get("/api/marketplace/me"),

    products: (params) => http.get("/api/marketplace/products", { params }),
    product: (productId) => http.get(`/api/marketplace/products/${productId}`),

    workspaces: () => http.get("/api/marketplace/workspaces"),
    stallLocations: () => http.get("/api/marketplace/stall-locations"),

    campusLocations: () => http.get("/api/marketplace/campus-locations"),
    checkoutInfo: () => http.get("/api/marketplace/checkout-info"),

    cart: () => http.get("/api/marketplace/cart"),
    addToCart: (body) => http.post("/api/marketplace/cart/items", body),
    setCartQuantity: (cartItemId, quantity) =>
        http.put(`/api/marketplace/cart/items/${cartItemId}`, { quantity }),
    clearCart: () => http.delete("/api/marketplace/cart"),

    orders: () => http.get("/api/marketplace/orders"),
    order: (orderId) => http.get(`/api/marketplace/orders/${orderId}`),
    placeOrder: (body) => http.post("/api/marketplace/orders", body),
    cancelOrder: (orderId, reason) =>
        http.post(`/api/marketplace/orders/${orderId}/cancel`, { reason }),

    conversation: () => http.get("/api/marketplace/chat/conversation"),
    startConversation: (body) => http.post("/api/marketplace/chat/conversation", body),
    sendMessage: (conversationId, message) =>
        http.post(`/api/marketplace/chat/conversation/${conversationId}/messages`, { message }),
};

// =====================================================
// STAFF
// =====================================================

export const staffApi = {
    me: () => http.get("/api/marketplace/staff/me"),

    session: () => http.get("/api/marketplace/staff/session"),
    sessionContext: () => http.get("/api/marketplace/staff/session/context"),
    startSession: (body) => http.post("/api/marketplace/staff/session", body),
    endSession: () => http.post("/api/marketplace/staff/session/end"),

    dashboard: (params) => http.get("/api/marketplace/staff/dashboard", { params }),

    orders: (params) => http.get("/api/marketplace/staff/orders", { params }),
    deliveries: (params) => http.get("/api/marketplace/staff/deliveries", { params }),
    order: (orderId) => http.get(`/api/marketplace/staff/orders/${orderId}`),
    updateOrderStatus: (orderId, status) =>
        http.post(`/api/marketplace/staff/orders/${orderId}/status`, { status }),

    products: (params) => http.get("/api/marketplace/staff/products", { params }),
    // One endpoint does create and update - ProductId in the payload decides
    // which, matching the service's upsert.
    saveProduct: (body) => http.post("/api/marketplace/staff/products", body),
    archiveProduct: (productId) =>
        http.post(`/api/marketplace/staff/products/${productId}/archive`),
    restoreProduct: (productId) =>
        http.post(`/api/marketplace/staff/products/${productId}/restore`),

    /**
     * Uploads a real photo for a product. Sent as FormData so the browser streams
     * the file rather than base64-ing it into a JSON body, which would inflate a
     * 2 MB photo by a third and hold it in memory on the way.
     */
    uploadProductImage: (productId, file) => {
        const body = new FormData();
        body.append("file", file);
        return http.post(`/api/marketplace/staff/products/${productId}/image`, body);
    },
    removeProductImage: (productId) =>
        http.delete(`/api/marketplace/staff/products/${productId}/image`),

    inventory: (params) => http.get("/api/marketplace/staff/inventory", { params }),
    lowStock: (params) => http.get("/api/marketplace/staff/inventory/low-stock", { params }),
    saveInventory: (inventoryId, body) =>
        http.put(`/api/marketplace/staff/inventory/${inventoryId}`, body),
    restock: (inventoryId, body) =>
        http.post(`/api/marketplace/staff/inventory/${inventoryId}/restock`, body),
    inventoryHistory: (params) =>
        http.get("/api/marketplace/staff/inventory/history", { params }),

    locations: () => http.get("/api/marketplace/staff/locations"),
    saveLocation: (body) =>
        body.locationId
            ? http.put(`/api/marketplace/staff/locations/${body.locationId}`, body)
            : http.post("/api/marketplace/staff/locations", body),
    archiveLocation: (locationId) =>
        http.post(`/api/marketplace/staff/locations/${locationId}/archive`),

    settings: () => http.get("/api/marketplace/staff/settings"),
    saveSettings: (body) => http.put("/api/marketplace/staff/settings", body),

    transactions: (params) => http.get("/api/marketplace/staff/transactions", { params }),

    conversations: (params) => http.get("/api/marketplace/staff/chat/conversations", { params }),
    conversation: (conversationId) =>
        http.get(`/api/marketplace/staff/chat/conversations/${conversationId}`),
    reply: (conversationId, message) =>
        http.post(`/api/marketplace/staff/chat/conversations/${conversationId}/reply`, { message }),
    setConversationStatus: (conversationId, status) =>
        http.patch(`/api/marketplace/staff/chat/conversations/${conversationId}/status`, { status }),
};

// =====================================================
// MARKETPLACE HEAD - staff account management
//
// Only the Marketplace Head reaches these. The CDM OneServe Admin is refused
// with 403, because spec 39 keeps them read-only in the marketplace.
// =====================================================

export const headApi = {
    me: () => http.get("/api/marketplace/head/me"),

    staff: () => http.get("/api/marketplace/head/staff"),
    createStaff: (body) => http.post("/api/marketplace/head/staff", body),
    deactivateStaff: (staffUserId) =>
        http.post(`/api/marketplace/head/staff/${staffUserId}/deactivate`),
    reactivateStaff: (staffUserId) =>
        http.post(`/api/marketplace/head/staff/${staffUserId}/reactivate`),

    stallLocations: () => http.get("/api/marketplace/head/stall-locations"),
    saveStallLocation: (body) =>
        body.stallLocationId
            ? http.put(`/api/marketplace/head/stall-locations/${body.stallLocationId}`, body)
            : http.post("/api/marketplace/head/stall-locations", body),

    workspaces: () => http.get("/api/marketplace/head/workspaces"),
    saveWorkspace: (body) => http.post("/api/marketplace/head/workspaces/save", body),

    createStallAccount: (workspaceId, body) =>
        http.post(`/api/marketplace/head/workspaces/${workspaceId}/account`, body),
    deactivateStallAccount: (workspaceId) =>
        http.delete(`/api/marketplace/head/workspaces/${workspaceId}/account`),
    resetStallAccountPassword: (workspaceId, password) =>
        http.post(`/api/marketplace/head/workspaces/${workspaceId}/account/password`, { password }),
    setStallOperator: (workspaceId, body) =>
        http.put(`/api/marketplace/head/workspaces/${workspaceId}/account/operator`, body),

    audit: (params) => http.get("/api/marketplace/head/audit", { params }),
};

// =====================================================
// ADMIN MONITORING (read-only)
// =====================================================

export const adminApi = {
    overview: (params) => http.get("/api/marketplace/admin/overview", { params }),
    accounts: (params) => http.get("/api/marketplace/admin/accounts", { params }),
    transactions: (params) => http.get("/api/marketplace/admin/transactions", { params }),
    analytics: (days = 30, workspaceId) =>
        http.get("/api/marketplace/admin/analytics", { params: { days, workspaceId } }),
    workspaces: () => http.get("/api/marketplace/workspaces"),
};