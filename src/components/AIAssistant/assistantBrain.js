/**
 * OneServe Assistant brain: an on-device campus Q&A responder.
 *
 * HONEST LABELING - this is a keyword + intent matcher over a curated campus
 * knowledge base, NOT a large language model. It needs no API key, no
 * network and no per-message cost, which is why it can live on every
 * student's phone. If the campus ever wants generative answers, replace the
 * exported `answerAssistant()` with a call to that endpoint - every caller
 * only depends on its { text, links } shape.
 *
 * ACCURACY RULES
 * - Only answer what the app really does (routes and flows below are real).
 * - Never invent hours, fees or policies. Time/fee questions get a pointer
 *   to announcements or staff instead of a guessed number.
 * - Match Tagalog AND English keywords; answer in simple English (the app's
 *   language).
 */

const norm = (value) =>
    (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, " ");

/**
 * Keyword test that does not trip on fragments inside other words.
 *
 * Phrases (contain a space) match as substrings of the raw text.
 * Single words match a whole token, or - only when the keyword is long
 * enough to be distinctive (5+) - a token containing it. That keeps
 * "hiram" matching "hiramin" while "payo" never matches "payong" and
 * "hi" never matches "which" or "shirt".
 */
const has = (text, ...words) =>
    words.some((word) => {
        if (word.includes(" ")) return text.includes(word);

        const tokens = text.split(/[^a-z0-9]+/);
        if (tokens.includes(word)) return true;
        if (word.length < 5) return false;
        return tokens.some((token) => token.includes(word));
    });

// ---- campus service offices ----
//
// One entry per office, each with its own location, so a question about one
// office is answered with just that office - not the whole list. `keywords` are
// what a student might type for it (English and Tagalog share these names).
const CAMPUS_OFFICES = [
    {
        name: "Clinic",
        keywords: ["clinic"],
        // `where` and `near` feed the location cards in the chat; `location` is
        // the same information as one plain sentence, kept for text-only callers.
        where: "1st floor · Admin Building",
        near: ["Near the Student Center Office", "Beside the Registrar's Office"],
        location:
            "The CDM Clinic is located on the first floor of the Admin Building, near the Student Center Office and beside the Registrar's Office.",
    },
    {
        name: "Library",
        keywords: ["library", "lib"],
        where: "2nd floor · Admin Building",
        near: ["Beside the Guidance and Counseling Office"],
        location:
            "The CDM Library is located on the second floor of the Admin Building, beside CDM's Guidance and Counseling Office.",
    },
    {
        name: "Lost and Found",
        keywords: ["lost and found", "lost & found", "lost found"],
        where: "Along the side of the Old Building",
        near: ["Beside the Student Center Office", "Beside the ROTC Office"],
        location:
            "The CDM Lost and Found Office is located along the side of the Old Building, beside the Student Center Office and the ROTC Office.",
    },
    {
        name: "Guidance and Counseling Office",
        keywords: ["guidance", "counsel"],
        where: "2nd floor · Admin Building",
        near: ["Beside the Library"],
        location:
            "The CDM Guidance and Counseling Office is located on the 2nd floor of Admin Building, beside CDM Library.",
    },
];

const LOCATION_WORDS = [
    "location",
    "saan",
    "where",
    "office",
    "opisina",
    "room",
    "building",
    "campus service",
];

/** The offices the person actually named. Empty when none. */
const officesNamed = (text) =>
    CAMPUS_OFFICES.filter((office) => has(text, ...office.keywords));

/** "Where is the library?"-style: a location word plus an office (or "service"). */
const asksOfficeLocation = (text) =>
    has(text, ...LOCATION_WORDS) &&
    (officesNamed(text).length > 0 || has(text, "service"));

/**
 * Whether a message is asking where a campus office is.
 *
 * Exported so the chat UI asks the brain instead of keeping its own copy of the
 * keywords - the two can never disagree about what a location question is.
 */
export function isLocationQuestion(rawText) {
    return asksOfficeLocation(norm(rawText).trim());
}

/**
 * `text` and `links` are always present. Optional extras the chat UI draws:
 *   - `lead` + `offices`: a location answer, shown as cards instead of `text`
 *     (`text` is still the full answer for any caller that does not draw cards)
 *   - `suggestions`: quick-reply chips offered after an answer we could not give
 *
 * @returns {{
 *   text: string,
 *   links: Array<{ label: string, to: string }>,
 *   lead?: string,
 *   offices?: Array<{ name: string, where: string, near: string[] }>,
 *   suggestions?: Array<{ label: string, ask: string }>
 * }}
 */
export function answerAssistant(rawText) {
    const text = norm(rawText).trim();

    if (!text) {
        return {
            text: "Ask me anything about the Library, Guidance, or Lost & Found.",
            links: [],
        };
    }

    // ---- campus service offices: locations ----
    // (must come FIRST so it takes priority over guidance/library/lost&found
    //  blocks that also match their own keywords)
    if (asksOfficeLocation(text)) {
        const named = officesNamed(text);

        // Named one office: just that one. Named several, or asked about the
        // campus services in general: every office that applies.
        const shown = named.length > 0 ? named : CAMPUS_OFFICES;
        const offices = shown.map(({ name, where, near }) => ({ name, where, near }));

        if (named.length === 1) {
            return {
                text: named[0].location,
                lead: `Here's where to find the ${named[0].name}.`,
                offices,
                links: [],
            };
        }

        const lead =
            named.length > 0
                ? "Here are the locations you asked about:"
                : "Here are the locations of the campus service offices:";

        return {
            text: `${lead}\n\n${shown
                .map((office, index) => `${index + 1}. ${office.name}\n${office.location}`)
                .join("\n\n")}`,
            lead,
            offices,
            links: [],
        };
    }

    // ---- greetings ----
    if (
        has(
            text,
            "hello",
            "hi",
            "hey",
            "kumusta",
            "kamusta",
            "good morning",
            "good afternoon",
            "good evening",
            "magandang"
        )
    ) {
        return {
            text: "Hello! I'm the OneServe Assistant. I can help with books, counseling, lost items, or where a campus office is - what do you need?",
            links: [],
        };
    }

    // ---- library: access pass / QR (most specific first) ----
    if (has(text, "access pass", "qr", "scanner", "scan", "pass")) {
        return {
            text: "Your **Library Access Pass** is a QR code you show at the circulation desk to claim a reserved book.",
            links: [{ label: "Open my Access Pass", to: "/library/access-pass" }],
        };
    }

    // ---- library: loans, due dates, bans, renewals, returns ----
    if (
        has(
            text,
            "due",
            "deadline",
            "fine",
            "multa",
            "overdue",
            "renew",
            "return",
            "ibalik",
            "loans",
            "hiniram",
            "babayaran"
        )
    ) {
        return {
            text: "Check your due dates in **Loans**. Anything overdue shows there first.\n\nReturning late means a **borrowing ban until the end of the semester**, so renew or return before the due date.",
            links: [{ label: "Open my Loans", to: "/library/loans" }],
        };
    }

    // ---- hours: answered BEFORE browse intents, and NEVER invented.
    // Bare "open/close" are deliberately not triggers ("open my loans" is a
    // verb, "bukas" also means tomorrow) - only real time-words count.
    if (
        has(
            text,
            "what time",
            "anong oras",
            "hours",
            "hour",
            "schedule",
            "sched"
        )
    ) {
        return {
            text: "I don't have live office hours, so I won't guess - check the latest announcements on your dashboard or ask the office desk directly.",
            links: [],
        };
    }

    // ---- library: browse / borrow / reserve ----
    if (
        has(
            text,
            "borrow",
            "hiram",
            "hiramin",
            "reserve",
            "reserba",
            "pareserba",
            "book",
            "libro",
            "library",
            "aklat",
            "basa"
        ) &&
        // "book an appointment" / "book counseling" is guidance, not the library.
        !has(text, "appointment", "counsel", "guidance")
    ) {
        return {
            text: "In the Library you can browse the catalog, reserve a copy, and track it until pickup. Start here:",
            links: [
                { label: "Browse books", to: "/library/books" },
                { label: "Reserve a book", to: "/library/reserve" },
                { label: "Library home", to: "/library" },
            ],
        };
    }

    // ---- guidance ----
    if (
        has(
            text,
            "guidance",
            "counsel",
            "counselling",
            "counseling",
            "appointment",
            "usap",
            "makausap",
            "kausap",
            "chat",
            "message",
            "stress",
            "anxiety",
            "anxious",
            "depress",
            "sad",
            "lungkot",
            "problem",
            "problema",
            "mental",
            "advice"
        ) &&
        !has(text, "where", "saan", "location", "office", "opisina", "room", "building")
    ) {
        return {
            text: "Guidance offers confidential counseling with campus counselors. Pick a counselor and a time that works for you:",
            links: [
                { label: "Book an appointment", to: "/guidance/book" },
                { label: "Browse counselors", to: "/guidance/counselors" },
            ],
        };
    }

    // ---- lost & found: claims ----
    if (has(text, "claim", "akin", "aangkin", "match")) {
        return {
            text: "If a found report matches your lost item, submit a claim on it. Once approved for pickup, walk in during office hours at the OneServe Student Affairs Office to pick it up.",
            links: [{ label: "Browse the board", to: "/lost-found/browse" }],
        };
    }

    // ---- lost & found: report / search ----
    if (
        has(
            text,
            "lost",
            "nawala",
            "nawalang",
            "found",
            "nakita",
            "report",
            "missing",
            "naiwan",
            "wallet",
            "phone",
            "cellphone",
            "id",
            "payong",
            "umbrella"
        )
    ) {
        return {
            text: "Lost something or found something? Report it with a photo - it goes on the board so its owner can find it.",
            links: [
                { label: "Report an item", to: "/lost-found/report/new" },
                { label: "Browse the board", to: "/lost-found/browse" },
            ],
        };
    }

    // ---- announcements ----
    if (
        has(
            text,
            "announce",
            "anunsyo",
            "update",
            "balita",
            "news",
            "post",
            "event"
        )
    ) {
        return {
            text: "Campus announcements live on your dashboard - new ones arrive as notifications if you turned those on in your Profile.",
            links: [],
        };
    }

    // ---- account: login / security / password ----
    if (
        has(
            text,
            "log in",
            "login",
            "log-in",
            "sign in",
            "logout",
            "log out",
            "sign out",
            "password",
            "forgot",
            "security",
            "device",
            "hack",
            "history"
        )
    ) {
        return {
            text: "For anything about your sign-ins - recent devices, suspicious activity, or signing out everywhere - open this:",
            links: [{ label: "Recent Logins in Profile", to: "/profile" }],
        };
    }

    // ---- account: profile ----
    if (
        has(
            text,
            "profile",
            "account",
            "edit",
            "email",
            "picture",
            "pangalan",
            "name",
            "contact"
        )
    ) {
        return {
            text: "Your profile, login history and notification switch all live in one place:",
            links: [
                { label: "Open my Profile", to: "/profile" },
                { label: "Edit profile", to: "/edit-profile" },
            ],
        };
    }

    // ---- places ----
    if (
        has(
            text,
            "saan",
            "where",
            "location",
            "office",
            "opisina",
            "room",
            "building",
            "library",
            "lib"
        ) &&
        has(text, "saan", "where", "location", "office", "opisina", "room")
    ) {
        return {
            text: "Pickups for approved Lost & Found claims happen at the OneServe Student Affairs Office.",
            links: [],
        };
    }

    // ---- thanks ----
    if (has(text, "thank", "salamat", "ty", "tnx")) {
        return {
            text: "You're welcome! Good luck on campus today.",
            links: [],
        };
    }

    // ---- goodbye ----
    if (has(text, "bye", "goodbye", "paalam", "alis", "later")) {
        return {
            text: "See you around campus!",
            links: [],
        };
    }

    // ---- fallback: never bluff, always offer a way forward ----
    return {
        text: "I'm not sure about that one yet. I can help with the Library, Guidance, Lost & Found, and where campus offices are. Try one of these:",
        links: [
            { label: "Library", to: "/library" },
            { label: "Guidance", to: "/guidance" },
        ],
        suggestions: FALLBACK_SUGGESTIONS,
    };
}

/** Quick chips shown when the chat opens. Real destinations, no dead ends. */
export const ASSISTANT_SUGGESTIONS = [
    { label: "Clinic location", ask: "Where is the clinic?" },
    { label: "Library location", ask: "Where is the library?" },
    { label: "Lost & Found location", ask: "Where is the lost and found office?" },
    { label: "Guidance location", ask: "Where is the guidance office?" },
];

/** Offered under an answer we could not give, so there is always a next tap. */
export const FALLBACK_SUGGESTIONS = [
    { label: "Borrow a book", ask: "How do I borrow a book?" },
    { label: "Book counseling", ask: "I want to book a counseling appointment" },
    { label: "Lost an item", ask: "I lost my wallet" },
    { label: "Clinic location", ask: "Where is the clinic?" },
];