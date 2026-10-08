/**
 * Whether an item is running low.
 *
 * The buyer's card shows "Only N left" rather than the raw number for small
 * counts. It stops a buyer wondering why an item reads as available and then
 * disappears at checkout. The threshold here is presentational only - the
 * low-stock number staff manage lives in inventory, not here.
 */
export function isLowStock(available) {
    return available > 0 && available <= 5;
}

// =====================================================
// CAMPUSMARKET vocabulary
//
// Mirrors Services/Marketplace/MarketplaceVocabulary.cs on the server. Kept in
// one file so the UI cannot drift from the API - and so the backend stays the
// authority: nothing here is trusted for a decision, only for rendering.
// =====================================================

export const CATEGORIES = [
    { value: "Food", label: "Food" },
    { value: "Uniforms", label: "Uniforms" },
    { value: "Merchandise", label: "Merchandise" },
];

// Food -> Snacks / Drinks. Uniforms -> the eight named types. Merchandise ->
// CDM PIN / Lace / Jacket. Exactly the lists the API validates against, so the
// dropdown can only offer values the server will accept.
export const SUBCATEGORIES = {
    Food: ["Snacks", "Drinks"],
    Uniforms: [
        "Wash Day Uniform",
        "Institute Shirt",
        "PE Uniform Set",
        "PE Pants",
        "PE T-Shirt",
        "School Uniform Set",
        "School Uniform Blouse",
        "School Uniform Pants",
    ],
    Merchandise: ["CDM PIN", "CDM Lace", "CDM Jacket"],
};

export function subCategoriesFor(category) {
    return SUBCATEGORIES[category] || [];
}

// ---- fulfillment ----

export const FULFILLMENT = {
    PICKUP: "Pickup",
    CAMPUS_DELIVERY: "CampusDelivery",
};

/**
 * Deliberately NOT a generic "Delivery". Campus delivery is not an external
 * delivery service, so the wording always names the campus.
 */
export function fulfillmentLabel(method) {
    return method === FULFILLMENT.CAMPUS_DELIVERY ? "Campus Delivery" : "Pick Up";
}

// ---- order status ----

export const ORDER_STATUS = {
    Pending: "Pending",
    Confirmed: "Confirmed",
    Preparing: "Preparing",
    ReadyForPickup: "ReadyForPickup",
    OutForDelivery: "OutForDelivery",
    Delivered: "Delivered",
    Completed: "Completed",
    Cancelled: "Cancelled",
};

/**
 * The two legal paths. The server decides the next step; these are only used to
 * draw the timeline and to label a button.
 *
 *   Pick Up   : Pending -> Confirmed -> Preparing -> ReadyForPickup -> Completed
 *   Delivery : Pending -> Confirmed -> Preparing -> OutForDelivery -> Delivered -> Completed
 */
export const STATUS_FLOW = {
    [FULFILLMENT.PICKUP]: [
        "Pending",
        "Confirmed",
        "Preparing",
        "ReadyForPickup",
        "Completed",
    ],
    [FULFILLMENT.CAMPUS_DELIVERY]: [
        "Pending",
        "Confirmed",
        "Preparing",
        "OutForDelivery",
        "Delivered",
        "Completed",
    ],
};

const STATUS_LABELS = {
    Pending: "Pending",
    Confirmed: "Confirmed",
    Preparing: "Preparing",
    ReadyForPickup: "Ready for Pickup",
    OutForDelivery: "Out for Delivery",
    Delivered: "Delivered",
    Completed: "Completed",
    Cancelled: "Cancelled",
};

export function statusLabel(status) {
    return STATUS_LABELS[status] || status || "";
}

/** Tailwind classes per status, so a step is visually consistent everywhere. */
export function statusTone(status) {
    switch (status) {
        case "Pending":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "Confirmed":
            return "bg-sky-50 text-sky-700 border-sky-200";
        case "Preparing":
            return "bg-indigo-50 text-indigo-700 border-indigo-200";
        case "ReadyForPickup":
        case "OutForDelivery":
            return "bg-violet-50 text-violet-700 border-violet-200";
        case "Delivered":
            return "bg-teal-50 text-teal-700 border-teal-200";
        case "Completed":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Cancelled":
            return "bg-rose-50 text-rose-700 border-rose-200";
        default:
            return "bg-slate-50 text-slate-600 border-slate-200";
    }
}

/** The staff button text for the next step, e.g. "Mark as Preparing". */
export function nextStatusAction(next) {
    if (!next) return "";
    return `Mark as ${statusLabel(next)}`;
}

// ---- chat ----

export const CHAT_STATUS = {
    OPEN: "open",
    IN_PROGRESS: "in_progress",
    RESOLVED: "resolved",
};

export const CHAT_STATUS_OPTIONS = [
    { value: CHAT_STATUS.OPEN, label: "Open" },
    { value: CHAT_STATUS.IN_PROGRESS, label: "In Progress" },
    { value: CHAT_STATUS.RESOLVED, label: "Resolved" },
];

/** "in_progress" -> "In Progress". Chat statuses are snake_case, order ones are not. */
export function chatStatusLabel(status) {
    return CHAT_STATUS_OPTIONS.find((option) => option.value === status)?.label || status || "";
}

/** Sender types are `user` or `staff` only - the OneServe Admin is never staff. */
export const SENDER = { USER: "user", STAFF: "staff" };

// ---- stock ----

export const STOCK_STATE = {
    OUT: "out_of_stock",
    LOW: "low",
    HEALTHY: "healthy",
};

export function stockStateTone(state) {
    switch (state) {
        case STOCK_STATE.OUT:
            return "bg-rose-50 text-rose-700 border-rose-200";
        case STOCK_STATE.LOW:
            return "bg-amber-50 text-amber-700 border-amber-200";
        default:
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
}