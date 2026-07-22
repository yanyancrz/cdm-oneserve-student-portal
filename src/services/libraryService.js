import { API_URL } from "../config/api";


const BASE = `${API_URL}/api/library`;

async function request(path, options = {}) {

    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(
            data.message || `Library API error (${res.status})`
        );
    }

    return data;
}

// ---------------------------------------------------------------------------
// BOOKS
// ---------------------------------------------------------------------------

export function getBooks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/books${query ? `?${query}` : ""}`);
}

export function getBook(bookId) {
    return request(`/books/${bookId}`);
}


// ---------------------------------------------------------------------------
// BORROWING / RESERVATIONS / RENEWALS
// ---------------------------------------------------------------------------

export function borrowBook(userId, bookId) {
    return request("/borrow", {
        method: "POST",
        body: JSON.stringify({
            userId,
            bookId,
        }),
    });
}

export function reserveBook(userId, bookId) {
    return request("/reservations", {
        method: "POST",
        body: JSON.stringify({ userId, bookId })
    });
}

export function cancelReservation(reservationId) {
    return request(`/reservations/cancel/${reservationId}`, {
        method: "PUT",
    });
}

export function renewBook(borrowId) {
    return request(`/borrow/renew/${borrowId}`, {
        method: "PUT",
    });
}

export function claimReservedBook(reservationId) {
    return request(`/reservations/claim/${reservationId}`, {
        method: "POST",
    });
}

export function getMyReservations(userId) {
    return request(`/reservations/student/${userId}`);
}

export function returnBook(borrowId) {
    return request(`/borrow/return/${borrowId}`, {
        method: "PUT",
    });
}

// ---------------------------------------------------------------------------
// HISTORY / FAVORITES
// ---------------------------------------------------------------------------

export function getBorrowHistory(userId) {
    return request(`/borrow/student/${userId}`);
}

export function getFavorites(userId) {
    return request(`/favorites/${userId}`);
}

export function toggleFavorite(userId, bookId) {
    return request(`/favorites/${userId}/${bookId}`, {
        method: "POST",
    });
}

export function getCurrentBorrowedBooks(userId) {
    return request(`/borrow/current/${userId}`);
}

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------

export function getNotifications(userId) {
    return request(`/notifications/${userId}`);
}

// ---------------------------------------------------------------------------
// CLEARANCE
// ---------------------------------------------------------------------------

export function getClearanceStatus(userId) {
    return request(`/clearance/${userId}`);
}

export function requestClearance(userId) {
    return request(`/clearance/${userId}/request`, {
        method: "POST",
    });
}

// ---------------------------------------------------------------------------
// SUGGESTIONS
// ---------------------------------------------------------------------------

export function suggestBook(userId, suggestion) {
    return request(`/suggestions`, {
        method: "POST",
        body: JSON.stringify({ userId, ...suggestion }),
    });
}

export function getSuggestions(userId) {
    return request(`/suggestions/${userId}`);
}

// ---------------------------------------------------------------------------
// ASK A LIBRARIAN
// ---------------------------------------------------------------------------

export function getMessages(userId) {
    return request(`/messages/${userId}`);
}

export function sendMessage(userId, text) {
    return request(`/messages`, {
        method: "POST",
        body: JSON.stringify({ userId, text }),
    });
}

// ---------------------------------------------------------------------------
// Recent Activities (for dashboard preview)
// ---------------------------------------------------------------------------

export function getLibraryActivities(userId) {
    return request(`/activity/${userId}`);
}