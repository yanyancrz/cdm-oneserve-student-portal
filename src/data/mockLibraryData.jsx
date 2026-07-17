// mockLibraryData.js
//
// Placeholder data for the Library Module of CDM: OneServe.
// Every page/component in this module should read from here rather than
// hardcoding its own sample data, so the whole module stays consistent
// once it's wired up to libraryService.js and a real backend later.
//
// NOTE: The logged-in student's identity (name, Digital ID, email) does
// NOT belong here — that already exists in the OneServe profile/digital ID
// APIs (see Dashboard.jsx: /api/profile/:email and /api/digitalid/:email).
// mockStudentLibraryStatus below only holds LIBRARY-specific extensions
// of that identity (loans, fines, clearance) until a real endpoint exists.

// ---------------------------------------------------------------------------
// STUDENT LIBRARY STATUS
// ---------------------------------------------------------------------------

export const mockStudentLibraryStatus = {
    libraryStatus: "Active", // "Active" | "Restricted" | "Suspended"
    currentLoans: 2,
    maxLoans: 5,
    reservationsCount: 1,
    favoritesCount: 4,
    overdueCount: 0,
    outstandingBalance: 0, // in PHP
};

// ---------------------------------------------------------------------------
// BOOKS
// ---------------------------------------------------------------------------
// status: "Available" | "Borrowed" | "Reserved"

export const mockBooks = [
    {
        id: "bk-001",
        title: "Introduction to Algorithms",
        author: "Thomas H. Cormen",
        isbn: "978-0262046305",
        category: "Computer Science",
        publisher: "MIT Press",
        year: 2022,
        language: "English",
        description:
            "A comprehensive guide to algorithms, covering design techniques, data structures, and analysis methods used throughout computer science.",
        shelfLocation: "CS-104-A",
        coverUrl: "https://placehold.co/300x420/106A2E/FFFFFF?text=Algorithms",
        availableCopies: 3,
        totalCopies: 5,
        status: "Available",
        isNewArrival: false,
        addedDate: "2025-11-02",
        rating: 4.7,
    },
    {
        id: "bk-002",
        title: "Clean Code",
        author: "Robert C. Martin",
        isbn: "978-0132350884",
        category: "Computer Science",
        publisher: "Prentice Hall",
        year: 2020,
        language: "English",
        description:
            "A handbook of agile software craftsmanship that teaches principles, patterns, and practices for writing readable, maintainable code.",
        shelfLocation: "CS-108-B",
        coverUrl: "https://placehold.co/300x420/085041/FFFFFF?text=Clean+Code",
        availableCopies: 0,
        totalCopies: 4,
        status: "Borrowed",
        isNewArrival: false,
        addedDate: "2025-09-14",
        rating: 4.5,
    },
    {
        id: "bk-003",
        title: "Fundamentals of Nursing",
        author: "Patricia A. Potter",
        isbn: "978-0323812336",
        category: "Health Sciences",
        publisher: "Elsevier",
        year: 2023,
        language: "English",
        description:
            "Core concepts and clinical skills for nursing practice, including patient care, safety, and evidence-based procedures.",
        shelfLocation: "HS-021-C",
        coverUrl: "https://placehold.co/300x420/712B13/FFFFFF?text=Nursing",
        availableCopies: 2,
        totalCopies: 6,
        status: "Available",
        isNewArrival: true,
        addedDate: "2026-06-30",
        rating: 4.6,
    },
    {
        id: "bk-004",
        title: "Principles of Marketing",
        author: "Philip Kotler",
        isbn: "978-0134492513",
        category: "Business",
        publisher: "Pearson",
        year: 2021,
        language: "English",
        description:
            "An accessible introduction to marketing strategy, consumer behavior, branding, and digital marketing fundamentals.",
        shelfLocation: "BUS-045-A",
        coverUrl: "https://placehold.co/300x420/633806/FFFFFF?text=Marketing",
        availableCopies: 1,
        totalCopies: 3,
        status: "Reserved",
        isNewArrival: false,
        addedDate: "2025-08-21",
        rating: 4.2,
    },
    {
        id: "bk-005",
        title: "Structural Analysis",
        author: "R. C. Hibbeler",
        isbn: "978-0134610672",
        category: "Engineering",
        publisher: "Pearson",
        year: 2021,
        language: "English",
        description:
            "Covers the analysis of statically determinate and indeterminate structures, with applications to real-world civil engineering problems.",
        shelfLocation: "ENG-077-D",
        coverUrl: "https://placehold.co/300x420/3C3489/FFFFFF?text=Structural",
        availableCopies: 4,
        totalCopies: 4,
        status: "Available",
        isNewArrival: false,
        addedDate: "2025-05-10",
        rating: 4.4,
    },
    {
        id: "bk-006",
        title: "Criminal Law Reviewer",
        author: "Luis B. Reyes",
        isbn: "978-9715925123",
        category: "Law",
        publisher: "Rex Book Store",
        year: 2024,
        language: "English/Filipino",
        description:
            "A widely used reviewer covering the Revised Penal Code, criminal liability, and jurisprudence for law students.",
        shelfLocation: "LAW-013-A",
        coverUrl: "https://placehold.co/300x420/72243E/FFFFFF?text=Criminal+Law",
        availableCopies: 2,
        totalCopies: 2,
        status: "Available",
        isNewArrival: true,
        addedDate: "2026-07-01",
        rating: 4.8,
    },
    {
        id: "bk-007",
        title: "Organic Chemistry",
        author: "Paula Yurkanis Bruice",
        isbn: "978-0134042282",
        category: "Science",
        publisher: "Pearson",
        year: 2022,
        language: "English",
        description:
            "A student-friendly approach to organic chemistry with an emphasis on mechanisms and real-world relevance.",
        shelfLocation: "SCI-039-B",
        coverUrl: "https://placehold.co/300x420/085041/FFFFFF?text=Chemistry",
        availableCopies: 0,
        totalCopies: 3,
        status: "Borrowed",
        isNewArrival: false,
        addedDate: "2025-10-18",
        rating: 4.1,
    },
    {
        id: "bk-008",
        title: "Educational Psychology",
        author: "Anita Woolfolk",
        isbn: "978-0134894781",
        category: "Education",
        publisher: "Pearson",
        year: 2020,
        language: "English",
        description:
            "Explores how students learn and develop, with practical strategies for classroom teaching and assessment.",
        shelfLocation: "EDU-058-A",
        coverUrl: "https://placehold.co/300x420/633806/FFFFFF?text=Ed+Psych",
        availableCopies: 3,
        totalCopies: 5,
        status: "Available",
        isNewArrival: false,
        addedDate: "2025-04-02",
        rating: 4.3,
    },
];

// ---------------------------------------------------------------------------
// ANNOUNCEMENTS
// ---------------------------------------------------------------------------

export const mockAnnouncements = [
    {
        id: "ann-001",
        title: "Extended hours for finals week",
        message: "The library will be open until 9:00 PM from July 21–25.",
        isNew: true,
    },
    {
        id: "ann-002",
        title: "New Health Sciences titles added",
        message: "12 new nursing and allied health books are now available.",
        isNew: true,
    },
    {
        id: "ann-003",
        title: "System maintenance notice",
        message: "Online renewals will be unavailable on July 20, 12AM–4AM.",
        isNew: false,
    },
];

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------
// type is used to pick an icon in NotificationCard.jsx

export const mockNotifications = [
    {
        id: "notif-001",
        type: "due-soon",
        title: "Book Due Tomorrow",
        description: "\"Clean Code\" is due on July 18. Renew now to avoid a fine.",
        time: "2h ago",
        read: false,
    },
    {
        id: "notif-002",
        type: "reservation-approved",
        title: "Reservation Approved",
        description: "\"Principles of Marketing\" is ready for pickup at the front desk.",
        time: "5h ago",
        read: false,
    },
    {
        id: "notif-003",
        type: "book-available",
        title: "Book Available",
        description: "\"Organic Chemistry\" you reserved is now available.",
        time: "1d ago",
        read: true,
    },
    {
        id: "notif-004",
        type: "closure",
        title: "Library Closed",
        description: "The library will be closed on July 26 for a staff seminar.",
        time: "2d ago",
        read: true,
    },
];

// ---------------------------------------------------------------------------
// CURRENT LOANS (used by RenewBook.jsx)
// ---------------------------------------------------------------------------
// renewStatus: "Eligible" | "Renewed" | "Not Eligible"

export const mockCurrentLoans = [
    {
        id: "loan-001",
        bookId: "bk-002",
        bookTitle: "Clean Code",
        bookAuthor: "Robert C. Martin",
        coverUrl: "https://placehold.co/300x420/085041/FFFFFF?text=Clean+Code",
        borrowDate: "2026-07-04",
        dueDate: "2026-07-18",
        renewCount: 0,
        maxRenewals: 2,
        renewStatus: "Eligible",
    },
    {
        id: "loan-002",
        bookId: "bk-007",
        bookTitle: "Organic Chemistry",
        bookAuthor: "Paula Yurkanis Bruice",
        coverUrl: "https://placehold.co/300x420/085041/FFFFFF?text=Chemistry",
        borrowDate: "2026-06-27",
        dueDate: "2026-07-25",
        renewCount: 1,
        maxRenewals: 2,
        renewStatus: "Eligible",
    },
];

// ---------------------------------------------------------------------------
// RESERVATIONS (used by ReserveBook.jsx)
// ---------------------------------------------------------------------------
// status: "Waiting" | "Ready for Pickup" | "Cancelled"

export const mockReservations = [
    {
        id: "res-001",
        bookId: "bk-004",
        bookTitle: "Principles of Marketing",
        coverUrl: "https://placehold.co/300x420/633806/FFFFFF?text=Marketing",
        queuePosition: 1,
        queueLength: 1,
        reservedDate: "2026-07-10",
        estimatedAvailability: "2026-07-19",
        status: "Ready for Pickup",
    },
];

// ---------------------------------------------------------------------------
// BORROW HISTORY (used by BorrowHistory.jsx)
// ---------------------------------------------------------------------------
// status: "Returned" | "Ongoing" | "Overdue"

export const mockBorrowHistory = [
    {
        id: "hist-001",
        bookId: "bk-002",
        bookTitle: "Clean Code",
        coverUrl: "https://placehold.co/300x420/085041/FFFFFF?text=Clean+Code",
        borrowDate: "2026-07-04",
        dueDate: "2026-07-18",
        returnDate: null,
        status: "Ongoing",
        fine: 0,
    },
    {
        id: "hist-002",
        bookId: "bk-007",
        bookTitle: "Organic Chemistry",
        coverUrl: "https://placehold.co/300x420/085041/FFFFFF?text=Chemistry",
        borrowDate: "2026-06-27",
        dueDate: "2026-07-25",
        returnDate: null,
        status: "Ongoing",
        fine: 0,
    },
    {
        id: "hist-003",
        bookId: "bk-001",
        bookTitle: "Introduction to Algorithms",
        coverUrl: "https://placehold.co/300x420/106A2E/FFFFFF?text=Algorithms",
        borrowDate: "2026-05-02",
        dueDate: "2026-05-16",
        returnDate: "2026-05-15",
        status: "Returned",
        fine: 0,
    },
    {
        id: "hist-004",
        bookId: "bk-005",
        bookTitle: "Structural Analysis",
        coverUrl: "https://placehold.co/300x420/3C3489/FFFFFF?text=Structural",
        borrowDate: "2026-03-11",
        dueDate: "2026-03-25",
        returnDate: "2026-03-29",
        status: "Returned",
        fine: 40,
    },
    {
        id: "hist-005",
        bookId: "bk-008",
        bookTitle: "Educational Psychology",
        coverUrl: "https://placehold.co/300x420/633806/FFFFFF?text=Ed+Psych",
        borrowDate: "2026-02-01",
        dueDate: "2026-02-15",
        returnDate: "2026-02-14",
        status: "Returned",
        fine: 0,
    },
];

// ---------------------------------------------------------------------------
// FAVORITES (list of book IDs the student has favorited)
// ---------------------------------------------------------------------------

export const mockFavoriteBookIds = ["bk-001", "bk-003", "bk-005", "bk-006"];

// ---------------------------------------------------------------------------
// RECOMMENDATIONS (subset of books shown in RecommendedBooks.jsx)
// ---------------------------------------------------------------------------

export const mockRecommendedBookIds = ["bk-003", "bk-006", "bk-008", "bk-004"];

// ---------------------------------------------------------------------------
// RECENT ACTIVITY (used on the Dashboard)
// ---------------------------------------------------------------------------
// type: "borrowed" | "reserved" | "renewed" | "returned"

export const mockRecentActivity = [
    {
        id: "act-001",
        type: "borrowed",
        label: "Borrowed \"Clean Code\"",
        time: "Today, 9:41 AM",
    },
    {
        id: "act-002",
        type: "renewed",
        label: "Renewed \"Organic Chemistry\"",
        time: "Yesterday, 3:12 PM",
    },
    {
        id: "act-003",
        type: "reserved",
        label: "Reserved \"Principles of Marketing\"",
        time: "Jul 10, 11:03 AM",
    },
    {
        id: "act-004",
        type: "returned",
        label: "Returned \"Introduction to Algorithms\"",
        time: "May 15, 2:30 PM",
    },
];

// ---------------------------------------------------------------------------
// SUGGESTIONS (used by SuggestBook.jsx)
// ---------------------------------------------------------------------------
// status: "Pending" | "Approved" | "Declined"

export const mockSuggestions = [
    {
        id: "sug-001",
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        isbn: "978-1449373320",
        reason: "Referenced heavily in our database systems course.",
        course: "BSCS - Database Systems",
        submittedDate: "2026-07-05",
        status: "Pending",
    },
    {
        id: "sug-002",
        title: "Atomic Habits",
        author: "James Clear",
        isbn: "978-0735211292",
        reason: "Would help students with study habits and productivity.",
        course: "General Education",
        submittedDate: "2026-06-20",
        status: "Approved",
    },
];

// ---------------------------------------------------------------------------
// ASK A LIBRARIAN — conversation thread (used by AskLibrarian.jsx)
// ---------------------------------------------------------------------------
// sender: "student" | "librarian"

export const mockMessages = [
    {
        id: "msg-001",
        sender: "librarian",
        text: "Hi! Welcome to Ask a Librarian. How can we help you today?",
        time: "9:00 AM",
    },
    {
        id: "msg-002",
        sender: "student",
        text: "Hi, is the 2024 edition of Criminal Law Reviewer available?",
        time: "9:03 AM",
    },
    {
        id: "msg-003",
        sender: "librarian",
        text: "Yes, we have 2 copies at shelf LAW-013-A. Would you like me to hold one for you?",
        time: "9:06 AM",
    },
];

// ---------------------------------------------------------------------------
// CLEARANCE (used by LibraryClearance.jsx)
// ---------------------------------------------------------------------------
// status: "Cleared" | "Pending" | "Blocked"

export const mockClearance = {
    status: "Pending",
    outstandingBooks: 2, // matches mockCurrentLoans length in this mock
    outstandingBalance: 0,
    approvalSteps: [
        { id: "step-1", label: "Books returned", complete: false },
        { id: "step-2", label: "Fines settled", complete: true },
        { id: "step-3", label: "Librarian review", complete: false },
        { id: "step-4", label: "Final approval", complete: false },
    ],
};

// ---------------------------------------------------------------------------
// CATEGORY LIST (used by BrowseBooks.jsx / CategoryTabs.jsx)
// ---------------------------------------------------------------------------

export const mockCategories = [
    "All",
    "Computer Science",
    "Health Sciences",
    "Business",
    "Engineering",
    "Law",
    "Science",
    "Education",
];