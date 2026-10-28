// Session helpers for Lost & Found.
//
// There is NO lost-and-found login and NO registration. The shared
// CDM OneServe login already stored the JWT and the user identity;
// this module only reads them. Nothing here creates, edits or
// deletes an account - account ownership stays with OneServe.

const TOKEN_KEYS = ["token", "authToken"];

// Console identity, written by LfAdminGate after it verifies the account
// with the API. Read by the layout to show only the pages the role may use.
export const LF_ADMIN_ROLE_KEY = "lfAdminRole";
export const LF_ADMIN_NAME_KEY = "lfAdminName";
export const LF_ADMIN_PERMISSION_KEY = "lfAdminPermissions";

// Every key the shared login flow writes (Login.jsx). Listing them
// explicitly rather than calling localStorage.clear(), which would
// also wipe unrelated PWA / device settings.
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
    // Which browser this is. Written by the shared login; without clearing it
    // here a signed-out device would keep a stale session key.
    "oneserve:sessionKey",
];

export const LOST_FOUND_HOME_ROUTE = "/lost-found";
export const LOST_FOUND_ADMIN_HOME_ROUTE = "/lost-found/admin";

export function getToken() {
    for (const key of TOKEN_KEYS) {
        const value = localStorage.getItem(key);
        if (value) return value;
    }
    return null;
}

export function clearSession() {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
    [LF_ADMIN_ROLE_KEY, LF_ADMIN_NAME_KEY, LF_ADMIN_PERMISSION_KEY].forEach(
        (key) => localStorage.removeItem(key)
    );
}

/**
 * Signs the user out of the whole of OneServe.
 *
 * There is no server-side logout endpoint: the JWT is stateless, so
 * there is nothing to revoke server-side. Clearing the stored token
 * is what the Guidance and Library portals do too, and it is what
 * actually stops this device.
 */
export function logout() {
    clearSession();
}

export function getUserId() {
    const value = localStorage.getItem("userId");
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** "Student" | "Faculty" | "" - for display only. */
export function getAccountType() {
    const role = getStoredRole();
    if (role === "faculty") return "Faculty";
    if (role === "student") return "Student";
    return "";
}

/**
 * Is this the Lost & Found admin (module owner)?
 *
 * Decided from the stored role, which the shared login already
 * saved. The server re-checks the same thing on every call, so
 * tampering with localStorage gets a 403 and nothing else.
 */
export function isLostFoundAdminRole() {
    const role = getStoredRole();
    return (
        role === "lostfoundadmin" ||
        role === "lostfound_admin" ||
        role === "lostfound-admin" ||
        role === "lostfoundsuperadmin" ||
        role === "lostfound_super_admin" ||
        role === "lostfound-super-admin" ||
        role === "lostfoundsubadmin" ||
        role === "lostfound_sub_admin" ||
        role === "lostfound-subadmin"
    );
}

/** True only for the module owner (legacy LostFoundAdmin counts as owner). */
export function isLostFoundSuperAdminRole() {
    const role = getStoredRole();
    return (
        role === "lostfoundsuperadmin" ||
        role === "lostfound_super_admin" ||
        role === "lostfound-super-admin" ||
        role === "lostfoundadmin" ||
        role === "lostfound_admin" ||
        role === "lostfound-admin"
    );
}

// ---------- console identity (written by LfAdminGate) ----------

export function rememberConsoleAdmin(me = {}) {
    const role = me.role || "";
    localStorage.setItem(LF_ADMIN_ROLE_KEY, role);
    localStorage.setItem(LF_ADMIN_NAME_KEY, me.fullName || "");
    localStorage.setItem(
        LF_ADMIN_PERMISSION_KEY,
        me.canManageAdmins ? "manage" : "operate"
    );
}

export function getConsoleAdmin() {
    return {
        role: localStorage.getItem(LF_ADMIN_ROLE_KEY) || "",
        fullName: localStorage.getItem(LF_ADMIN_NAME_KEY) || "",
        canManageAdmins:
            localStorage.getItem(LF_ADMIN_PERMISSION_KEY) === "manage",
    };
}

function getStoredRole() {
    return (
        localStorage.getItem("role") || localStorage.getItem("userRole") || ""
    )
        .trim()
        .toLowerCase();
}
