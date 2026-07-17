// libraryHelpers.js
//
// Shared helper functions for the Library Module of CDM: OneServe.
// Pages and components should import from here instead of redefining
// their own date/formatting/sorting/filtering logic, so behavior stays
// consistent across the module (e.g. RenewBook.jsx and BorrowHistory.jsx
// should show the same due-date math).

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
// Formats a date (Date object, ISO string, or "YYYY-MM-DD" string) for
// display. `style` controls how much detail is shown.
//
//   formatDate("2026-07-18")                 -> "Jul 18, 2026"
//   formatDate("2026-07-18", "long")         -> "Sat, Jul 18, 2026"
//   formatDate("2026-07-18", "short")        -> "Jul 18"

export function formatDate(date, style = "default") {
    if (!date) return "—";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "—";

    if (style === "long") {
        return parsed.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    if (style === "short") {
        return parsed.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    }

    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

// ---------------------------------------------------------------------------
// addDays
// ---------------------------------------------------------------------------
// Small companion helper — not in the original spec list, but both
// BorrowBook.jsx and RenewBook.jsx need to add a loan period / renewal
// period to a date, so it lives here to avoid duplicating it everywhere.

export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// ---------------------------------------------------------------------------
// calculateDueDays
// ---------------------------------------------------------------------------
// Returns the number of days remaining until `dueDate`.
// Positive  -> days remaining (0 = due today)
// Negative  -> days overdue (e.g. -3 = 3 days overdue)

export function calculateDueDays(dueDate) {
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// getBookStatus
// ---------------------------------------------------------------------------
// Derives a display status for a book based on its available copies.
// Books already carry a `status` field in mockLibraryData, but this helper
// lets any page recompute it consistently if `availableCopies` changes
// (e.g. after a mock borrow/return) without needing a full data refetch.

export function getBookStatus(book) {
    if (!book) return "Unknown";
    if (book.availableCopies > 0) return "Available";
    return "Borrowed";
}

// ---------------------------------------------------------------------------
// getLoanStatus
// ---------------------------------------------------------------------------
// Derives a display status for a borrow-history entry.
// Mirrors the "Returned" | "Ongoing" | "Overdue" values used in
// mockBorrowHistory, but computed live from dates so it self-corrects
// (e.g. an "Ongoing" loan becomes "Overdue" once its due date passes).

export function getLoanStatus(entry) {
    if (entry.returnDate) return "Returned";
    const daysRemaining = calculateDueDays(entry.dueDate);
    return daysRemaining < 0 ? "Overdue" : "Ongoing";
}

// ---------------------------------------------------------------------------
// sortBooks
// ---------------------------------------------------------------------------
// sortBy: "title" | "author" | "newest" | "rating"

export function sortBooks(books, sortBy = "title") {
    const sorted = [...books];

    switch (sortBy) {
        case "author":
            return sorted.sort((a, b) => a.author.localeCompare(b.author));
        case "newest":
            return sorted.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
        case "rating":
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case "title":
        default:
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
}

// ---------------------------------------------------------------------------
// filterBooks
// ---------------------------------------------------------------------------
// filters = {
//   query: string,             // matches title, author, isbn
//   category: string,          // "All" or a category name
//   status: string,            // "All" | "Available" | "Borrowed" | "Reserved"
//   newArrivalsOnly: boolean,
// }

export function filterBooks(books, filters = {}) {
    const { query = "", category = "All", status = "All", newArrivalsOnly = false } = filters;

    const normalizedQuery = query.trim().toLowerCase();

    return books.filter((book) => {
        const matchesQuery =
            !normalizedQuery ||
            book.title.toLowerCase().includes(normalizedQuery) ||
            book.author.toLowerCase().includes(normalizedQuery) ||
            book.isbn.toLowerCase().includes(normalizedQuery);

        const matchesCategory = category === "All" || book.category === category;
        const matchesStatus = status === "All" || book.status === status;
        const matchesNewArrival = !newArrivalsOnly || book.isNewArrival;

        return matchesQuery && matchesCategory && matchesStatus && matchesNewArrival;
    });
}