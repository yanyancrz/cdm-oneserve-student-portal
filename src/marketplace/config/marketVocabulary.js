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
    { value: "Food", label: "Canteen" },
    { value: "Supplies", label: "Paper Shop" },
    { value: "Uniforms", label: "Uniforms" },
    { value: "Merchandise", label: "Merchandise" },
];

// Food -> canteen sections. Supplies -> the Paper Shop sections. Uniforms ->
// the eight named types. Merchandise -> CDM PIN / Lace / Jacket. Exactly the
// lists the API validates against, so the dropdown can only offer values the
// server will accept.
//
// The labels differ from the values on purpose: the stored category stays
// "Food" (so every existing product row keeps working) while the buyer sees
// the campus name for it.
export const SUBCATEGORIES = {
    Food: ["Meals", "Snacks", "Beverages", "Drinks"],
    Supplies: ["Writing", "Notebooks", "Paper Products", "School Tools", "Exam Supplies"],
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
    // A paid order the buyer asked to return; the money has not moved yet.
    ReturnRequested: "ReturnRequested",
    // The refund was confirmed at the counter. Terminal.
    Refunded: "Refunded",
    // Collectable, and nobody came for it. Distinct from Cancelled on purpose.
    Expired: "Expired",
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
    ReturnRequested: "Return Requested",
    Refunded: "Refunded",
    Expired: "Expired",
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
        case "ReturnRequested":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "Refunded":
            return "bg-slate-100 text-slate-600 border-slate-200";
        case "Expired":
            return "bg-slate-50 text-slate-500 border-slate-200";
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

// ---- support tickets ----
//
// A buyer's private message to the ADMINISTRATORS - a refund dispute, a damaged
// item, feedback - anything the stall cannot settle. Deliberately separate from
// the store chat, which goes to the stall itself. Only an administrator replies,
// and a ticket keeps its answer on record, so it is a request rather than a
// conversation. Mirrors MarketplaceSupportTicketStatus on the server.

export const TICKET_STATUS = {
    OPEN: "open",
    ANSWERED: "answered",
    CLOSED: "closed",
};

export function ticketStatusLabel(status) {
    switch (status) {
        case TICKET_STATUS.ANSWERED:
            return "Answered";
        case TICKET_STATUS.CLOSED:
            return "Closed";
        default:
            return "Open";
    }
}

export function ticketStatusTone(status) {
    switch (status) {
        case TICKET_STATUS.ANSWERED:
            return "bg-sky-50 text-sky-700 border-sky-200";
        case TICKET_STATUS.CLOSED:
            return "bg-slate-50 text-slate-600 border-slate-200";
        default:
            return "bg-amber-50 text-amber-700 border-amber-200";
    }
}

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
// ---- payment ----

export const PAYMENT_METHOD = {
    CASH: "cash",
    CAMPUS_CARD: "campus_card",
};

export const PAYMENT_METHOD_OPTIONS = [
    { value: PAYMENT_METHOD.CASH, label: "Cash on Pickup", hint: "Pay when you collect." },
    { value: PAYMENT_METHOD.CAMPUS_CARD, label: "Campus Card", hint: "Spend your card balance now." },
];

/** Mirrors MarketplacePaymentMethod.Label on the server. */
export function paymentLabel(method) {
    return method === PAYMENT_METHOD.CAMPUS_CARD ? "Campus Card" : "Cash on Pickup";
}

// ---- campus card ----

export const CARD_STATUS = { ACTIVE: "Active", BLOCKED: "Blocked" };

export function cardStatusLabel(status) {
    return status === CARD_STATUS.BLOCKED ? "Blocked" : "Active";
}

export function cardStatusTone(status) {
    return status === CARD_STATUS.BLOCKED
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
}

/**
 * Campus card ledger rows.
 *
 * The server already sends a signed amount, so the tone only has to read the
 * direction - it never re-derives it.
 */
export function cardTransactionTone(type) {
    switch (type) {
        case "Credit":
            return "text-emerald-700";
        case "Debit":
            return "text-rose-700";
        default:
            return "text-sky-700";
    }
}

export function cardTransactionLabel(type) {
    switch (type) {
        case "Credit":
            return "Loaded";
        case "Debit":
            return "Purchase";
        case "Refund":
            return "Refund";
        default:
            return "Movement";
    }
}

// ---- ID claim ----

export const ID_CLAIM_TYPE = {
    FIRST_ISSUE: "FirstIssue",
    REPLACEMENT: "Replacement",
    LOST: "Lost",
    DAMAGED: "Damaged",
};

export const ID_CLAIM_TYPES = [
    { value: ID_CLAIM_TYPE.REPLACEMENT, label: "Replacement ID", hint: "Worn out or the print is gone." },
    { value: ID_CLAIM_TYPE.LOST, label: "Lost ID", hint: "Tell us what happened.", needsReason: true },
    { value: ID_CLAIM_TYPE.DAMAGED, label: "Damaged ID", hint: "Cracked, bent or water-damaged.", needsReason: true },
    { value: ID_CLAIM_TYPE.FIRST_ISSUE, label: "First ID", hint: "You have not received one yet." },
];

export const ID_CLAIM_STATUS = {
    PENDING: "Pending",
    READY_FOR_CLAIM: "ReadyForClaim",
    CLAIMED: "Claimed",
    REJECTED: "Rejected",
};

/** Mirrors IdClaimType.Normalize's labels on the server. */
export function idClaimTypeLabel(type) {
    switch (type) {
        case ID_CLAIM_TYPE.FIRST_ISSUE:
            return "First ID";
        case ID_CLAIM_TYPE.LOST:
            return "Lost ID";
        case ID_CLAIM_TYPE.DAMAGED:
            return "Damaged ID";
        default:
            return "Replacement ID";
    }
}

export function idClaimStatusLabel(status) {
    switch (status) {
        case ID_CLAIM_STATUS.PENDING:
            return "Waiting for Review";
        case ID_CLAIM_STATUS.READY_FOR_CLAIM:
            return "Ready for Claim";
        case ID_CLAIM_STATUS.CLAIMED:
            return "Claimed";
        case ID_CLAIM_STATUS.REJECTED:
            return "Rejected";
        default:
            return status || "";
    }
}

export function idClaimStatusTone(status) {
    switch (status) {
        case ID_CLAIM_STATUS.PENDING:
            return "bg-amber-50 text-amber-700 border-amber-200";
        case ID_CLAIM_STATUS.READY_FOR_CLAIM:
            return "bg-violet-50 text-violet-700 border-violet-200";
        case ID_CLAIM_STATUS.CLAIMED:
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case ID_CLAIM_STATUS.REJECTED:
            return "bg-rose-50 text-rose-700 border-rose-200";
        default:
            return "bg-slate-50 text-slate-600 border-slate-200";
    }
}

/** True while a claim still blocks the person from filing another. */
export function isOpenClaim(status) {
    return status === ID_CLAIM_STATUS.PENDING || status === ID_CLAIM_STATUS.READY_FOR_CLAIM;
}

// ---- reviews ----
//
// A buyer rates the store they bought from, after a completed order.
// One review per order ever. No moderation, no edit, no delete by the author.

export const RATING_LABELS = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very good",
    5: "Excellent",
};

/** Renders 1-5 stars as a compact label. */
export function ratingLabel(rating) {
    const n = Number(rating) || 0;
    if (n < 1 || n > 5) return "";
    return `${n} / 5 - ${RATING_LABELS[n]}`;
}

// ---- pre-order ----

/**
 * The claim code is deliberately not formatted here.
 *
 * The server mints it from an alphabet with 0/O and 1/I removed so it can be
 * read aloud across a counter without being misheard. Adding spaces or dashes
 * client-side would only give staff something new to mistype.
 */
export function formatClaimCode(code) {
    return (code || "").trim().toUpperCase();
}

/** A pickup slot, for the buyer's pre-order picker. */
export function slotLabel(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    // The browser shows local time; the server stores UTC.
    return date.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

// ---- storefronts ----
//
// Mirrors MarketplaceStoreKind / MarketplaceStoreStatus /
// MarketplaceStorePermissions on the server. A store is a PUBLIC FACE over a
// workspace: products, stock and orders stay workspace-scoped, so pausing a
// storefront stops new orders without touching a single inventory row.

export const STORE_KIND = {
    FOOD: "food",
    SUPPLIES: "supplies",
};

export const STORE_KINDS = [
    { value: STORE_KIND.FOOD, label: "Food" },
    { value: STORE_KIND.SUPPLIES, label: "Supplies" },
];

export function storeKindLabel(kind) {
    return kind === STORE_KIND.SUPPLIES ? "Supplies" : "Food";
}

export const STORE_STATUS = {
    ACTIVE: "active",
    PAUSED: "paused",
    BANNED: "banned",
    DELETED: "deleted",
};

export function storeStatusLabel(status) {
    switch (status) {
        case STORE_STATUS.PAUSED:
            return "Paused";
        case STORE_STATUS.BANNED:
            return "Banned";
        case STORE_STATUS.DELETED:
            return "Removed";
        default:
            return "Open";
    }
}

export function storeStatusTone(status) {
    switch (status) {
        case STORE_STATUS.PAUSED:
            return "bg-amber-50 text-amber-700 border-amber-200";
        case STORE_STATUS.BANNED:
        case STORE_STATUS.DELETED:
            return "bg-rose-50 text-rose-700 border-rose-200";
        default:
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
}

/**
 * The five permissions a store team member can hold.
 *
 * Closed list, mirroring the database CHECK constraint. The server replaces the
 * permission set wholesale on save, so removing a tick here really removes it.
 */
export const STORE_PERMISSIONS = [
    { value: "catalog", label: "Products & categories", hint: "Add items, edit prices, manage sections." },
    { value: "orders", label: "Orders", hint: "Prepare orders and move them along." },
    { value: "cash", label: "Confirm cash payments", hint: "Mark an order paid at the counter." },
    { value: "analytics", label: "Sales & forecast", hint: "See figures for this store." },
    { value: "delivery", label: "Delivery & handover", hint: "Manage campus delivery runs." },
];

/** What a brand-new member gets when no permission is ticked. */
export const DEFAULT_STORE_PERMISSIONS = ["orders"];

export function storePermissionLabel(permission) {
    return STORE_PERMISSIONS.find((p) => p.value === permission)?.label || permission;
}

/** True when the caller can act on the storefront itself, not just shop there. */
export function canManageStore(store) {
    return store?.isOwner === true || store?.canManage === true;
}

export const APPLICATION_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
};

export function applicationStatusLabel(status) {
    switch (status) {
        case APPLICATION_STATUS.APPROVED:
            return "Approved";
        case APPLICATION_STATUS.REJECTED:
            return "Rejected";
        default:
            return "Waiting";
    }
}

export function applicationStatusTone(status) {
    switch (status) {
        case APPLICATION_STATUS.APPROVED:
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case APPLICATION_STATUS.REJECTED:
            return "bg-slate-50 text-slate-600 border-slate-200";
        default:
            return "bg-amber-50 text-amber-700 border-amber-200";
    }
}

// ---- payment status / order grouping ----
//
// Mirrors the server's separate PaymentStatus axis. The two are independent: an
// order can be completed and still unpaid (a cash order walked straight to the
// end), or paid and still awaiting hand-over.
//
// The buyer's tabs are grouped here rather than in the page so the mapping
// between the server's vocabulary and the UI's buckets lives in one place.

export const PAYMENT_STATUS = {
    UNPAID: "unpaid",
    PAID: "paid",
};

/**
 * Which bucket an order belongs to for the buyer's filter tabs.
 *
 *   to_pay      - money still outstanding. A cash order that has not been paid,
 *                 and has not been cancelled or expired.
 *   to_receive  - paid (or not payable), still on its way or waiting to be
 *                 collected.
 *   completed   - delivered / collected.
 *   cancelled   - called off, or expired uncollected. Kept in one bucket
 *                 because the buyer's question is the same: "will I get this?".
 *
 * `Expired` is deliberately grouped with Cancelled for the buyer, even though
 * the server keeps it distinct - the distinction matters in the audit trail and
 * to staff, not to someone deciding whether their lunch is coming.
 */
export function orderBucket(order) {
    if (!order) return "all";

    const status = order.status;

    // A return in flight or completed is its own bucket: the money has changed
    // hands, so "to receive" would be a lie and "cancelled" understates it.
    if (status === ORDER_STATUS.ReturnRequested || status === ORDER_STATUS.Refunded) {
        return "returns";
    }

    if (status === ORDER_STATUS.Completed) return "completed";

    if (status === ORDER_STATUS.Cancelled || status === ORDER_STATUS.Expired) return "cancelled";

    if (order.paymentStatus === PAYMENT_STATUS.UNPAID) return "to_pay";

    return "to_receive";
}

export const ORDER_BUCKET_OPTIONS = [
    { value: "all", label: "All" },
    { value: "to_pay", label: "To pay" },
    { value: "to_receive", label: "To receive" },
    { value: "completed", label: "Completed" },
    { value: "returns", label: "Returns" },
    { value: "cancelled", label: "Cancelled" },
];
