/**
 * One-shot diagnosis of the whole push chain.
 *
 * Checks, in the order a notification has to travel:
 *   1. is the Node service alive and consuming?
 *   2. is there a subscription in the database?
 *   3. is anything queued / failed / stuck?
 *   4. what did the last delivery attempt say?
 *
 *   node scripts/diagnose.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const PUSH_HEALTH = process.env.PROBE_PUSH ?? "http://127.0.0.1:4100";

function line(label, value) {
    console.log(`  ${label.padEnd(34)} ${value}`);
}

async function main() {
    // ---- 1. Node service -------------------------------------------------
    console.log("\n[1] Node notification service");
    try {
        const response = await fetch(`${PUSH_HEALTH}/health`);
        const health = await response.json();

        line("status", health.status);
        line("database", health.database);
        line("cycles completed", health.cycles);
        line("outbox", JSON.stringify(health.outbox));
        line("uptime (s)", health.uptimeSeconds);

        if (health.cycles === 0) {
            console.log("  !! 0 cycles - the worker loop never ran.");
        }
    } catch (error) {
        console.log(`  !! NOT REACHABLE at ${PUSH_HEALTH}`);
        console.log(`     ${error.message}`);
        console.log("     Start it with:  cd push-service && npm start");
        return;
    }

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST ?? "localhost",
        port: Number(process.env.DB_PORT ?? 3306),
        user: process.env.DB_USER ?? "root",
        password: process.env.DB_PASSWORD ?? "",
        database: process.env.DB_NAME ?? "cdm_oneserve",
    });

    // ---- 2. Subscriptions --------------------------------------------------
    console.log("\n[2] Subscriptions");
    const [subs] = await connection.query(
        `SELECT PushSubscriptionId, UserId, LEFT(Endpoint, 46) AS endpoint,
                IsActive, DeactivatedAt, LastUsedAt, CreatedAt
           FROM PushSubscriptions ORDER BY PushSubscriptionId DESC`
    );

    if (subs.length === 0) {
        console.log("  !! NONE. Nothing can be delivered to anybody.");
        console.log("     Turn on notifications on /profile first.");
    } else {
        line("rows", subs.length);
        line("active", subs.filter((s) => s.IsActive).length);
        line("inactive", subs.filter((s) => !s.IsActive).length);
        subs.slice(0, 5).forEach((s) => {
            console.log(
                `     #${s.PushSubscriptionId}  user ${s.UserId}  active=${s.IsActive}  ` +
                    `lastUsed=${s.LastUsedAt}  ${s.endpoint}...`
            );
        });
    }

    // ---- 3. Outbox ----------------------------------------------------------
    console.log("\n[3] Outbox");
    const [byStatus] = await connection.query(
        `SELECT Status, COUNT(*) AS n FROM PushOutbox GROUP BY Status`
    );
    if (byStatus.length === 0) {
        console.log("  empty - the API has written no notifications at all.");
        console.log("     Either no event was triggered, or the event never");
        console.log("     reached the dispatcher (stale frontend build?).");
    } else {
        byStatus.forEach((row) => line(row.Status, row.n));
    }

    const [stuck] = await connection.query(
        `SELECT PushOutboxId, Module, Type, Status, Attempts,
                COALESCE(LastError, '') AS LastError, ScheduledAt
           FROM PushOutbox
          WHERE Status IN ('Pending', 'Processing', 'Failed')
          ORDER BY PushOutboxId DESC LIMIT 8`
    );

    if (stuck.length > 0) {
        console.log("  not delivered yet / failed:");
        stuck.forEach((row) => {
            console.log(
                `     #${row.PushOutboxId} ${row.Module}/${row.Type} ${row.Status} ` +
                    `attempts=${row.Attempts}`
            );
            if (row.LastError) console.log(`        ${row.LastError}`);
        });
    }

    const [recent] = await connection.query(
        `SELECT PushOutboxId, Module, Type, Title, Status, CreatedAt
           FROM PushOutbox ORDER BY PushOutboxId DESC LIMIT 5`
    );
    if (recent.length > 0) {
        console.log("  most recent:");
        recent.forEach((r) =>
            console.log(
                `     #${r.PushOutboxId} ${r.Module}/${r.Type} [${r.Status}] ${r.Title}`
            )
        );
    }

    // ---- 4. Delivery log ------------------------------------------------------
    console.log("\n[4] Last delivery attempts");
    const [logs] = await connection.query(
        `SELECT l.PushDeliveryLogId, l.PushOutboxId, l.PushSubscriptionId,
                l.Status, l.StatusCode, COALESCE(l.Error, '') AS Error, l.CreatedAt
           FROM PushDeliveryLogs l ORDER BY l.PushDeliveryLogId DESC LIMIT 8`
    );

    if (logs.length === 0) {
        console.log("  none - the Node service has never attempted a delivery.");
        console.log("     Either it cannot see the outbox, or nothing is queued.");
    } else {
        logs.forEach((l) => {
            console.log(
                `     #${l.PushDeliveryLogId} outbox=#${l.PushOutboxId} sub=#${l.PushSubscriptionId} ` +
                    `${l.Status} HTTP ${l.StatusCode ?? "-"}`
            );
            if (l.Error) console.log(`        ${l.Error}`);
        });
    }

    await connection.end();

    // ---- verdict -----------------------------------------------------------
    console.log("\n[Verdict]");
    const hasActive = subs.some((s) => s.IsActive);
    const pending = byStatus.find((r) => r.Status === "Pending")?.n ?? 0;

    if (!hasActive) {
        console.log("  -> No ACTIVE subscription. Enable it on /profile.");
    } else if (recent.length === 0) {
        console.log("  -> Subscription exists but NO notification was ever queued.");
        console.log("     The API never called the dispatcher for your event.");
        console.log("     Most likely: the deployed frontend is an old build.");
    } else if (pending > 0) {
        console.log("  -> Notifications are queued but NOT being delivered.");
        console.log("     A worker error. Check the delivery log above.");
    } else {
        console.log("  -> Delivery ran. If no tray notification appeared, the");
        console.log("     browser/OS is the problem (permission, service worker).");
    }
}

main().catch((error) => {
    console.error("diagnosis failed:", error.message);
    process.exit(1);
});
