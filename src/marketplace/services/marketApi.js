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

    /**
     * Records that cash was actually taken for an order.
     *
     * Separate from releasing or completing it: this stamps PaidAt at the moment
     * the money changes hands, so a cash order can be paid before collection.
     * Refused for campus card orders (debited at checkout) and already-paid ones.
     */
    confirmCash: (orderId) => http.post(`/api/marketplace/staff/orders/${orderId}/cash-payment`),

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
// =====================================================
// CAMPUS SERVICES (buyer side)
//
// Canteen pre-ordering, the Paper Shop category and the campus card.
// Backed by Database/Marketplace/003_campus_services.sql on the server.
// =====================================================

export const campusApi = {
    // ---- canteen / paper shop pre-ordering ----

    /** The bookable pickup-slot window, so the UI never hardcodes the rule. */
    preOrderOptions: () => http.get("/api/marketplace/campus/preorder-options"),

    /** The claim code for one of the caller's own orders, issued on demand. */
    claimCode: (orderId) => http.get(`/api/marketplace/campus/orders/${orderId}/claim-code`),

    // ---- campus card ----

    /** The caller's own card and recent ledger. Issued on first read. */
    myCard: () => http.get("/api/marketplace/card/me"),

    // ---- Student / Faculty ID claim ----

    myIdClaims: () => http.get("/api/marketplace/id-claims"),

    fileIdClaim: (body) => http.post("/api/marketplace/id-claims", body),
};

// =====================================================
// CAMPUS SERVICES (staff side)
//
// The counter screens: verifying a claim code, releasing a claimed order,
// topping up a campus card and the ID claim review queue.
// =====================================================

export const campusStaffApi = {
    // ---- order claim verification ----

    /**
     * Looks a claim code up without changing anything, so staff can confirm it
     * belongs to the person in front of them first.
     *
     * A valid code on a cancelled order resolves successfully with found=false
     * and a reason - not an error - so staff can say "that was cancelled" as
     * confidently as "no such code". Read `.found`, not just `.data`.
     */
    lookupClaim: (claimCode) =>
        http.get("/api/marketplace/staff/claims/lookup", { params: { claimCode } }),

    /** Releases a claimed order: collected, completed, stock consumed. */
    verifyClaim: (body) => http.post("/api/marketplace/staff/claims/verify", body),

    reissueClaim: (orderId) => http.post(`/api/marketplace/staff/claims/orders/${orderId}/reissue`),

    // ---- campus card at the counter ----

    /** Search by the printed card number or by the owner's ID number. */
    searchCard: (query) => http.get("/api/marketplace/card/counter/search", { params: { query } }),

    cardLedger: (cardId) => http.get(`/api/marketplace/card/counter/${cardId}/ledger`),

    /** Top-up. Requires an open operator session; the operator name is audited. */
    loadCard: (userId, body) => http.post(`/api/marketplace/card/counter/${userId}/load`, body),

    setCardStatus: (cardId, body) => http.post(`/api/marketplace/card/counter/${cardId}/status`, body),

    // ---- ID claim review ----

    idClaims: (params) => http.get("/api/marketplace/id-claims/staff", { params }),

    /** Approve (release / hand over) or reject. Approve from Pending issues a claim code. */
    reviewIdClaim: (idClaimId, body) =>
        http.post(`/api/marketplace/id-claims/staff/${idClaimId}/review`, body),

    verifyIdClaim: (claimCode) =>
        http.get("/api/marketplace/id-claims/staff/verify", { params: { claimCode } }),
};

// =====================================================
// STOREFRONTS
//
// The seller/shopfront layer on top of the workspace-scoped fulfilment model.
// Backed by Database/Marketplace/006_storefronts.sql (+007, +008) on the server.
//
// No online payments: cash and campus card only.
// =====================================================

export const storeApi = {
    // ---- browse (any signed-in account) ----

    /** Storefronts a buyer may see, most sales first. `kind` is food|supplies. */
    browse: (params) => http.get("/api/marketplace/stores", { params }),

    /**
     * One storefront, with the caller's OWN permissions attached
     * (`myPermissions`, `isOwner`, `canManage`), so the same payload serves the
     * buyer page and the management screen.
     *
     * A banned or deleted store is a 404 for everyone who is not on its team.
     */
    read: (storeId) => http.get(`/api/marketplace/stores/${storeId}`),

    // ---- team (store OWNER only) ----

    /** The team, with the owner as a synthetic first row. */
    team: (storeId) => http.get(`/api/marketplace/stores/${storeId}/team`),

    /**
     * Adds or updates a member. `isActive: false` deactivates instead.
     *
     * The permission set is replaced wholesale, so a bit the owner removed
     * really stops applying - there is no partial merge.
     */
    saveMember: (storeId, body) => http.post(`/api/marketplace/stores/${storeId}/team`, body),

    // ---- applications ----

    /** Applies to join a store's team. Student/Faculty only. */
    apply: (body) => http.post("/api/marketplace/stores/apply", body),

    /** Applications at a store. Owner only. */
    applications: (storeId, params) => http.get(`/api/marketplace/stores/${storeId}/applications`, { params }),

    /**
     * Owner's decision. Approving creates the membership in the same step with
     * the permissions the owner chose, so nobody is ever "approved" without a
     * way to act.
     */
    reviewApplication: (applicationId, body) =>
        http.post(`/api/marketplace/stores/applications/${applicationId}/review`, body),

    // ---- categories ----

    /** The store's own categories plus every system category. */
    categories: (storeId) => http.get(`/api/marketplace/stores/${storeId}/categories`),

    /** Creates or renames one of the store's own categories. Needs `catalog`. */
    saveCategory: (storeId, body) => http.post(`/api/marketplace/stores/${storeId}/categories`, body),

    // ---- analytics (owner, or a member with `analytics`) ----

    /**
     * Sales figures for one storefront: a 28-day daily series and a seven-day
     * average forecast. Read-only, derived from the marketplace_sales_daily view
     * (018_store_analytics.sql). Needs the `analytics` permission - the owner
     * always has it.
     */
    analytics: (storeId) => http.get(`/api/marketplace/stores/${storeId}/analytics`),

    // ---- product photo gallery ----

    photos: (productId) => http.get(`/api/marketplace/stores/products/${productId}/photos`),
    /** HTTPS only, at most 8 per product. Needs `catalog`. */
    addPhoto: (productId, body) => http.post(`/api/marketplace/stores/products/${productId}/photos`, body),

    removePhoto: (photoId) => http.delete(`/api/marketplace/stores/photos/${photoId}`),

    // ---- Marketplace Head only ----

    /**
     * EVERY storefront, including banned and deleted.
     *
     * The browse endpoint hides those from buyers, but the Head needs the
     * opposite: an administrator who cannot see a banned storefront can never
     * unban it.
     */
    manage: () => http.get("/api/marketplace/stores/manage"),

    /** Creates or edits a storefront. Head only; an owner cannot rename or re-own. */
    save: (body) => http.post("/api/marketplace/stores", body),
};

// =====================================================
// REVIEWS
//
// A buyer rates the store they bought from, after a completed order.
// One review per order ever; tied to the order, not to a product line.
// Backed by Database/Marketplace/013_reviews.sql.
// =====================================================

export const reviewApi = {
    /** Posts a review for a completed, paid order. One per order ever. */
    review: (body) => http.post("/api/marketplace/reviews", body),

    /** A store's reviews, newest first, capped at 100. */
    forStore: (storeId) => http.get(`/api/marketplace/reviews/stores/${storeId}`),

    /** A store's rating summary: average (one decimal) and count. Null when none. */
    rating: (storeId) => http.get(`/api/marketplace/reviews/stores/${storeId}/rating`),
};

// =====================================================
// MODERATION
//
// Blocks, reports, support tickets, and bans.
// Backed by Database/Marketplace/015_moderation.sql.
// =====================================================

export const moderationApi = {
    // ---- blocks (user action) ----

    /** Blocks a user or a store. Exactly one target. */
    block: (body) => http.post("/api/marketplace/moderation/blocks", body),

    /** Removes a block the caller created. */
    unblock: (blockId) => http.delete(`/api/marketplace/moderation/blocks/${blockId}`),

    // ---- reports ----

    /** Files a report. Exactly one target; reason 5-2000 characters. */
    report: (body) => http.post("/api/marketplace/moderation/reports", body),

    /** Reports waiting for or already reviewed by an administrator. Admin only. */
    reports: (params) => http.get("/api/marketplace/moderation/reports", { params }),

    /** Administrator's decision on a report. */
    resolveReport: (reportId, body) =>
        http.post(`/api/marketplace/moderation/reports/${reportId}/resolve`, body),

    // ---- support tickets ----

    /** Opens a support ticket. Any signed-in account. */
    openTicket: (body) => http.post("/api/marketplace/moderation/tickets", body),

    /** The caller's own tickets. */
    myTickets: () => http.get("/api/marketplace/moderation/tickets/mine"),

    /** All tickets. Administrator only. */
    tickets: (params) => http.get("/api/marketplace/moderation/tickets", { params }),

    /** Administrator replies to a ticket. */
    respondTicket: (ticketId, body) =>
        http.post(`/api/marketplace/moderation/tickets/${ticketId}/respond`, body),

    /** Closes a ticket. Administrator only. */
    closeTicket: (ticketId) => http.post(`/api/marketplace/moderation/tickets/${ticketId}/close`),

    // ---- bans (administrator action) ----

    /** Bans or unbans an account. Administrator only. */
    banAccount: (targetUserId, body) =>
        http.post(`/api/marketplace/moderation/accounts/${targetUserId}/ban`, body),

    /** Bans or unbans a store. Administrator only. */
    banStore: (storeId, body) =>
        http.post(`/api/marketplace/moderation/stores/${storeId}/ban`, body),
};

// =====================================================
// REFUNDS / RETURNS
//
// A buyer requests a return on a paid order; the store owner or an
// administrator reviews it; a cash refund is confirmed at the counter.
// Backed by Database/Marketplace/014_refunds.sql.
// =====================================================

export const refundApi = {
    /** Requests a return/refund on a paid order. One per order ever. */
    request: (body) => http.post("/api/marketplace/refunds", body),

    /** One request, by order id. */
    get: (orderId) => http.get(`/api/marketplace/refunds/orders/${orderId}`),

    /** A store's refund requests. Owner or admin only. Filter by status. */
    forStore: (storeId, params) => http.get(`/api/marketplace/refunds/stores/${storeId}`, { params }),

    /** The owner's or administrator's decision. */
    review: (orderId, body) => http.post(`/api/marketplace/refunds/orders/${orderId}/review`, body),

    /** Confirms a cash refund at the counter. */
    confirm: (orderId) => http.post(`/api/marketplace/refunds/orders/${orderId}/confirm`),
};

// =====================================================
// SELLER ONBOARDING
//
// A verified Student or Faculty account applies to sell; the Marketplace Head
// reviews and, on approval, creates the storefront and assigns them as owner.
// Backed by Database/Marketplace/012_seller_applications.sql.
// =====================================================

export const sellerApi = {
    /** Files an application to become a seller. Student/Faculty + verified. */
    apply: (body) => http.post("/api/marketplace/seller-applications", body),

    /** Every application the signed-in account has filed. */
    mine: () => http.get("/api/marketplace/seller-applications/mine"),

    /** The Head's review queue. Filter by status. */
    queue: (params) => http.get("/api/marketplace/seller-applications/head", { params }),

    /** The Head's decision. Approving records the intent; the Head then creates the store. */
    review: (applicationId, body) =>
        http.post(`/api/marketplace/seller-applications/head/${applicationId}/review`, body),
};
