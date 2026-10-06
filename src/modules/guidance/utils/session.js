import { getToken } from "../../../library-admin/utils/session";

export { getToken };

// Every key Login.jsx writes. (library-admin clearSession() only removes some.)
const KEYS = [
    "token", "authToken", "userId", "idNumber", "userName", "userEmail",
    "userRole", "role", "course", "yearLevel", "contactNumber",
    "profilePicture", "isProfileComplete", "adminName",
];

export function getStoredRole() {
    return localStorage.getItem("role") || localStorage.getItem("userRole") || "";
}

export function signOut() {
    KEYS.forEach((k) => localStorage.removeItem(k));
}