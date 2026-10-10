// Session helpers for CampusMarket.
//
// There is NO marketplace login and NO marketplace registration. The shared
// CDM OneServe login already stored the JWT and the user identity; this module
// only reads them. Nothing here creates, edits or deletes a Student/Faculty
// account - account ownership stays with OneServe.

const TOKEN_KEYS = ["token", "authToken"];

// Every key the shared login flow writes (Login.jsx). Listing them explicitly
// rather than calling localStorage.clear(), which would also wipe unrelated
// PWA / device settings.
//
// This list is deliberately complete. Leaving a stale name or avatar behind
// after logout looks like a bug even when the token is gone - something on the
// login screen can render the old user's details before the next sign-in.
const SESSION_KEYS = [
    ...TOKEN_KEYS,
    "userId",
    "idNumber",
    "userName",
    "userEmail",
    "userRole",
    "role", // compatibility alias
    "course",
    "yearLevel",
    "contactNumber",
    "profilePicture",
    "isProfileComplete",
];

export const MARKET_HOME_ROUTE = "/marketplace";
export const MARKET_STAFF_HOME_ROUTE = "/marketplace/staff";

export function getToken() {
    for (const key of TOKEN_KEYS) {
        const value = localStorage.getItem(key);
        if (value) return value;
    }
    return null;
}

export function clearSession() {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

/**
 * Signs the user out of the whole of OneServe.
 *
 * There is no server-side logout endpoint: the JWT is stateless, so there is
 * nothing to revoke server-side. Clearing the stored token is what the Guidance
 * and Library portals do too, and it is what actually stops this device - any
 * token captured beforehand stays valid until it expires, which is a property of
 * stateless JWTs rather than something this module can change.
 *
 * Because it clears the SHARED OneServe session, logging out of the marketplace
 * portal logs you out of OneServe entirely - which is the intent. A marketplace
 * operator has no separate marketplace account to preserve.
 */
export function logout() {
    clearSession();
    try {
        localStorage.removeItem("marketplace:operatorSessionId");
    } catch {
        // Storage unavailable - nothing to clear.
    }
}

export function getUserId() {
    const value = localStorage.getItem("userId");
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Is the signed-in account a Student or Faculty member - the marketplace BUYER?
 *
 * This is a client-side courtesy only: it decides which layout to render so the
 * UI is not briefly wrong. The real authorization is on the server, which reads
 * the same role from the database and refuses anything else with a 403.
 *
 * The CDM OneServe Admin is deliberately NOT a buyer - they monitor the
 * marketplace, they do not shop in it.
 */
export function isBuyerRole() {
    const role = getStoredRole();
    return role === "student" || role === "faculty";
}

/** "Student" | "Faculty" | "" - for display only. */
export function getAccountType() {
    const role = getStoredRole();
    if (role === "faculty") return "Faculty";
    if (role === "student") return "Student";
    return "";
}

/**
 * Is this the Marketplace Head?
 *
 * The Head is a module owner created in Admin > Users, the same way the Library
 * Head and Guidance Head are. They operate the marketplace AND manage its staff
 * accounts, so they land in the same staff portal - the Staff Accounts screen is
 * simply only rendered for them.
 *
 * Decided from the stored role, which the shared login already saved. The server
 * re-checks the same thing on every call, so tampering with localStorage gets a
 * 403 and nothing else.
 */
export function isHeadRole() {
    return getStoredRole() === "marketplaceadmin";
}

function getStoredRole() {
    return (
        localStorage.getItem("role") || localStorage.getItem("userRole") || ""
    )
        .trim()
        .toLowerCase();
}