// Session helpers for the Guidance Administration module.
// The shared CDM OneServe login already stores the JWT; we only read it.

const TOKEN_KEYS = ["token", "authToken"];

const SESSION_KEYS = [
    ...TOKEN_KEYS,
    "userEmail",
    "userName",
    "adminName",
    "role",
    "userRole",
];

export const GUIDANCE_HEAD_HOME_ROUTE = "/admin/guidance/dashboard";

export function getToken() {
    for (const key of TOKEN_KEYS) {
        const value = localStorage.getItem(key);
        if (value) return value;
    }
    return null;
}

// Removes only the keys the login flow writes (not localStorage.clear(),
// which would also wipe unrelated PWA / device settings).
export function clearSession() {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

// For the shared Login page: where should a Guidance Head account land?
// Returns null for every other role so the existing redirect logic stays in charge.
export function getGuidanceHeadHomeRoute(role) {
    if (!role) return null;

    const normalized = role.toLowerCase().replace(/[_-]/g, "");

    return normalized === "guidanceadmin" ? GUIDANCE_HEAD_HOME_ROUTE : null;
}
