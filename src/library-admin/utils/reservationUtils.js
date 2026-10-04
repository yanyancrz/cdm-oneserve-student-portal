export const STATUS_LABELS = {
    Reserved: "Reserved",
    Pending: "Pending",
    Approved: "Approved",
    ReadyForPickup: "Ready for pickup",
    Claimed: "Claimed",
    Rejected: "Rejected",
    Cancelled: "Cancelled",
    Expired: "Expired",
};

export const statusLabel = (status) => STATUS_LABELS[status] || status || "—";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

export function formatDate(value) {
    return value ? dateFormat.format(new Date(value)) : "—";
}

export function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);
    return `${dateFormat.format(date)}, ${timeFormat.format(date)}`;
}

const CLOSED = ["Claimed", "Rejected", "Cancelled", "Expired"];

export const isClosed = (status) => CLOSED.includes(status);

// What to show in the "Expires" column.
// tone: "muted" (finished), "normal", "warn" (under a day left), "danger" (past due or under an hour).
export function describeExpiry(item, now = new Date()) {
    if (isClosed(item.displayStatus)) {
        return { text: formatDate(item.expirationDate), sub: null, tone: "muted" };
    }

    const diff = new Date(item.expirationDate) - now;
    const sub = formatDateTime(item.expirationDate);

    if (diff < 0) return { text: "Past due", sub, tone: "danger" };

    const hours = diff / 36e5;

    if (hours < 1) return { text: "In under an hour", sub, tone: "danger" };
    if (hours < 24) return { text: `In ${Math.floor(hours)} h`, sub, tone: "warn" };

    const days = Math.floor(hours / 24);
    return { text: `In ${days} ${days === 1 ? "day" : "days"}`, sub, tone: "normal" };
}

export const ACTION_LABELS = {
    claim: "Claim",
    approve: "Approve",
    ready: "Mark ready",
    reject: "Reject",
    cancel: "Cancel reservation",
};

// The server decides what is allowed (canXxx flags). The Head-only actions are also
// hidden for staff, because the server would refuse them anyway.
export function availableActions(item, canHead) {
    const list = [];

    if (item.canClaim) list.push("claim");
    if (canHead && item.canApprove) list.push("approve");
    if (canHead && item.canMarkReady) list.push("ready");
    if (canHead && item.canReject) list.push("reject");
    if (canHead && item.canCancel) list.push("cancel");

    return list;
}

// The one action worth a button in the table row.
export function primaryAction(item, canHead) {
    const list = availableActions(item, canHead);

    // A copy is already set aside: the next step is handing it over.
    if (item.canClaim && item.holdsCopy) return "claim";

    return ["approve", "ready", "claim"].find((type) => list.includes(type)) || null;
}