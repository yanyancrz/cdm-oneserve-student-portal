import { LOST_FOUND_HOME_ROUTE as HOME } from "../session";

// =====================================================
// FIND Assistant brain - fully on-device, no API key.
//
// Beginner-friendly FAQ + full guide for the Lost & Found
// module. Keyword buckets first, each answer ends with the
// deep link(s) that continue the task in the app.
// =====================================================

const has = (text, ...words) => words.some((w) => text.includes(w));

export const FIND_SUGGESTIONS = [
    { label: "New here? Full guide", ask: "new here guide" },
    { label: "How to report", ask: "how to report" },
    { label: "How to claim", ask: "how to claim" },
    { label: "Pickup guide", ask: "pickup" },
    { label: "Status meanings", ask: "status meaning" },
];

function link(label, to) {
    return { label, to };
}

const GUIDE = `Welcome to FIND! Here is the whole flow:

1. LOST something? Go to Report an item, choose Lost, add a photo and where you lost it.
2. FOUND something? Report it as Found - every found item goes to the OneServe Student Affairs Office.
3. Reports start as Pending. The admin publishes good ones to the board.
4. See your item on the board? Claim it and describe your proof (marks, contents, where lost).
5. The finder checks your claim. Once it is Awaiting Pickup, walk in during office hours with your student ID.
6. Handover done = Returned. No booking needed - just walk in during office hours!

Tap a topic below for details.`;

export function answerFind(input) {
    const text = String(input || "").toLowerCase().trim();

    // ---- full beginner guide ----
    if (has(text, "guide", "new here", "start", "beginner", "how to use", "paano gamitin", "tutorial")) {
        return {
            text: GUIDE,
            links: [
                link("Report an item", `${HOME}/report/new`),
                link("Browse the board", `${HOME}/browse`),
            ],
        };
    }

    // ---- reporting ----
    if (has(text, "report", "nawala", "naiwan", "missing", "file", "submit") && !has(text, "claim", "recover", "recovery")) {
        return {
            text: `How to report (2 minutes):

1. Tap Report an item.
2. Pick Lost (nawawala mo) or Found (nakita mo).
3. Add a clear photo - it helps a lot.
4. Fill in the item name, category, and where/when it was lost or found.
5. Submit! It becomes Pending while the admin reviews it, then Published on the board.

Found items always go to the OneServe Student Affairs Office - that is the only handover place.`,
            links: [
                link("Report an item", `${HOME}/report/new`),
                link("My reports", `${HOME}/my-items`),
            ],
        };
    }

    // ---- claiming ----
    if (has(text, "claim", "akin", "aangkin", "mine", "proof", "verify")) {
        return {
            text: `How to claim a found item:

1. Find it on the board (Browse) or open a match.
2. Tap Claim this item on a Published found report.
3. Write SPECIFIC proof only the owner would know: engravings, stickers, contents, exact place and day lost.
4. The finder reviews it. Statuses: Processing (waiting) → Awaiting Pickup (go get it!) → Returned (done).
5. Rejected? You can claim again with stronger proof, or ask at the office.

Tip: vague claims ("it is mine, black phone") get rejected. Details win.`,
            links: [
                link("Browse the board", `${HOME}/browse`),
                link("My claims", `${HOME}/claims`),
            ],
        };
    }

    // ---- pickup ----
    if (has(text, "pickup", "pick up", "collect", "kuha", "office", "hours", "saan kukunin", "claiming my", "schedule")) {
        return {
            text: `Pickup guide - no booking needed!

1. Wait until your claim says Awaiting Pickup.
2. Check the office windows on the Claims page.
3. Walk in to the OneServe Student Affairs Office during any window.
4. Bring your student ID - the office checks it before handing anything over.
5. After handover your claim becomes Returned. Done!

Lunch and holidays: the office follows its published windows, so check the list before going.`,
            links: [link("My claims", `${HOME}/claims`)],
        };
    }

    // ---- matches ----
    if (has(text, "match", "similar", "kamukha", "pareho", "pair")) {
        return {
            text: `Possible matches = a lost report and a found report that look like the same item, with a % score (name, category, location, date = 25 points each).

Tap any match to see BOTH items side by side with photos. If it is yours, confirm it - or claim the found side directly. 75%+ is usually the real thing.`,
            links: [link("My matches", `${HOME}/matches`)],
        };
    }

    // ---- recovery (found someone's lost item) ----
    if (has(text, "recover", "found this", "nakita ko", "surrender", "turn over", "handover", "handover")) {
        return {
            text: `Found someone's lost item? Thank you!

1. Open the lost report and tap Report recovery.
2. Bring the item to the OneServe Student Affairs Office - every handover runs through the office, never person-to-person.
3. The owner is notified automatically and a pickup claim is created for them.`,
            links: [link("Browse lost items", `${HOME}/browse?type=Lost`)],
        };
    }

    // ---- statuses ----
    if (has(text, "status", "meaning", "pending", "published", "processing", "rejected", "returned", "ibig sabihin")) {
        return {
            text: `Status cheat sheet:

Reports: Pending (under review) → Published (on the board) or Rejected.
Claims: Processing (finder is reviewing) → Awaiting Pickup (come get it!) → Returned (handed over). Rejected = try again with better proof.
Pickups: Awaiting Pickup → Completed at handover.`,
            links: [
                link("My reports", `${HOME}/my-items`),
                link("My claims", `${HOME}/claims`),
            ],
        };
    }

    // ---- notifications ----
    if (has(text, "notif", "alert", "bell", "update", "message")) {
        return {
            text: `You get notified for: new claims on your report, claim decisions, matches on your reports, and completed handovers.

Tap the bell in Alerts - each notification links straight to the report. Unread ones have the green dot.`,
            links: [link("Alerts", `${HOME}/notifications`)],
        };
    }

    // ---- edit / delete / withdraw ----
    if (has(text, "edit", "delete", "remove", "cancel", "withdraw", "change", "update my")) {
        return {
            text: `Fixing your own stuff:

- Reports: open it from My Items - Edit/Delete work while it is still Pending.
- Claims: open My Claims - Withdraw works while Processing or Awaiting Pickup.
- Published reports cannot be edited (ask the office if something is wrong).`,
            links: [
                link("My reports", `${HOME}/my-items`),
                link("My claims", `${HOME}/claims`),
            ],
        };
    }

    // ---- photo ----
    if (has(text, "photo", "picture", "image", "upload", "camera")) {
        return {
            text: `Photos make everything faster: clear, well-lit shot of the whole item, plus one close-up of any mark, engraving or sticker. JPG/PNG/WEBP up to 5 MB. Claims with matching details + a matching photo almost always pass.`,
            links: [link("Report an item", `${HOME}/report/new`)],
        };
    }

    // ---- office / human help ----
    if (has(text, "human", "office", "contact", "help", "support", "person", "admin", "staff")) {
        return {
            text: `Need a human? Visit the OneServe Student Affairs Office during pickup windows (see the Claims page) with your student ID. For account or login problems, go back to the main portal.`,
            links: [link("My claims", `${HOME}/claims`)],
        };
    }

    // ---- fallback ----
    return {
        text: `I can walk you through reporting, claiming, pickups, matches, recovery, statuses and notifications. Try one of the topics below, or ask like "how do I report a lost ID?"`,
        links: [
            link("Full guide", `${HOME}`),
            link("Browse the board", `${HOME}/browse`),
        ],
    };
}
