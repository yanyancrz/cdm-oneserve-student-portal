// Session helpers for the Library module.
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

export const LIBRARY_HOME_ROUTE = "/admin/library/dashboard";

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

// For the shared Login page: where should a Library account land?
// Returns null for every other role so the existing redirect logic stays in charge.
export function getLibraryHomeRoute(role) {
    return role === "LibraryAdmin" || role === "LibraryStaff"
        ? LIBRARY_HOME_ROUTE
        : null;
}