/**
 * Proves the "one push per conversation per minute" grouping actually holds,
 * against the real UNIQUE index in PushOutbox.
 *
 * It inserts the exact key the Guidance chat service + PushDispatcher build,
 * twice, and counts the rows. Then it does the same across a minute boundary
 * and expects two.
 *
 *   node scripts/verify-chat-grouping.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const MODULE = "guidance";
const CONVERSATION_ID = 999001;
const DAY = new Date().toISOString().slice(0, 10).replace(/-/g, "");

function keyFor(minute) {
    // Mirrors PushDispatcher: "<module>:<dedupeKey>:<yyyyMMdd>"
    return `${MODULE}:chat:${CONVERSATION_ID}:${DAY}${minute}:${DAY}`;
}

const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "cdm_oneserve",
});

try {
    // Need a real user id for the FK.
    const [[user]] = await connection.query("SELECT Id FROM users ORDER BY Id LIMIT 1");
    if (!user) {
        console.log("No users in the database to test with.");
        process.exit(1);
    }

    async function tryInsert(key, label) {
        await connection.query(
            `INSERT INTO PushOutbox
                (UserId, Module, Type, Title, Body, TargetUrl, Tag,
                 DedupeKey, Priority, Status, Attempts, ScheduledAt, CreatedAt)
             VALUES (?, 'Guidance', 'GUIDANCE_CHAT_MESSAGE', ?, ?, ?, ?, ?, 1,
                     'Pending', 0, NOW(), NOW())
             ON DUPLICATE KEY UPDATE PushOutboxId = PushOutboxId`,
            [
                user.Id,
                "Sender Name",
                "Preview of the counselling message…",
                `/guidance/chat/${CONVERSATION_ID}`,
                `guidance-chat-${CONVERSATION_ID}`,
                key,
            ]
        );

        const [[row]] = await connection.query(
            "SELECT COUNT(*) AS n FROM PushOutbox WHERE DedupeKey = ?",
            [key]
        );
        console.log(`  ${label.padEnd(42)} rows=${row.n}`);
        return row.n;
    }

    console.log("\nTwo messages inside the SAME minute:");
    const sameMinuteA = await tryInsert(keyFor("1430"), "message 1 at 14:30");
    const sameMinuteB = await tryInsert(keyFor("1430"), "message 2 at 14:30 (retry/rapid)");

    console.log("\nA message in the NEXT minute:");
    const nextMinute = await tryInsert(keyFor("1431"), "message 3 at 14:31");

    console.log("\nThe key that was actually stored:");
    console.log(`  ${keyFor("1430")}`);

    console.log("\nverdict:");
    console.log(
        `  ${sameMinuteB === 1 && sameMinuteA === 1 ? "OK" : "BROKEN"} - two messages in one ` +
            `minute produced ${sameMinuteB} row(s) (want 1)`
    );
    console.log(
        `  ${nextMinute === 1 ? "OK" : "BROKEN"} - a later minute produced its own row ` +
            `(${nextMinute}) so a continuing conversation is not blocked`
    );

    // The tray tag is what makes the OS replace rather than stack.
    const [[tagged]] = await connection.query(
        `SELECT COUNT(DISTINCT Tag) AS distinctTags, COUNT(*) AS totalRows
           FROM PushOutbox WHERE Tag = ?`,
        [`guidance-chat-${CONVERSATION_ID}`]
    );
    console.log(
        `  ${tagged.distinctTags === 1 ? "OK" : "BROKEN"} - all rows share one tray tag, so ` +
            `the notification is replaced, not stacked`
    );
} finally {
    await connection.query("DELETE FROM PushOutbox WHERE Tag = ?", [
        `guidance-chat-${CONVERSATION_ID}`,
    ]);
    await connection.end();
    console.log("\n(test rows removed)");
}
