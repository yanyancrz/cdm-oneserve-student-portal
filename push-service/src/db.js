/**
 * MySQL pool + the small set of statements this service needs.
 *
 * Read pattern: claim a row by flipping Pending -> Processing, then work
 * on it. The claim is a conditional UPDATE, so two workers (or a worker
 * restarting mid-flight) can never send the same notification twice.
 */
import mysql from "mysql2/promise";

import { config } from "./config.js";
import { child } from "./logger.js";

const log = child("db");

export const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit,
    queueLimit: 0,
    // Long polling loop: never recycle a connection mid-transaction.
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    // Dates come back as strings; the API stores local time, so keep it
    // simple and compare everything in SQL.
    dateStrings: true,
    charset: "utf8mb4_unicode_ci",
});

export async function initDatabase() {
    // Fail fast with a clear message instead of a stack trace on first push.
    const connection = await pool.getConnection();
    try {
        const [tables] = await connection.query(
            `SELECT TABLE_NAME FROM information_schema.TABLES
              WHERE TABLE_SCHEMA = ?
                AND TABLE_NAME IN ('PushOutbox','PushSubscriptions','PushDeliveryLogs')`,
            [config.db.database]
        );

        // Case-insensitive comparison: a MySQL server running
        // lower_case_table_names=1 stores "PushSubscriptions" as
        // "pushsubscriptions", so exact matching would report a false
        // "missing table" on Windows and most shared hosts.
        const found = new Set(
            tables.map((row) => String(row.TABLE_NAME).toLowerCase())
        );

        const missing = TABLES.filter((name) => !found.has(name.toLowerCase()));

        if (missing.length > 0) {
            throw new Error(
                `Missing Web Push table(s): ${missing.join(", ")}. ` +
                    `Run Database/Notifications/001_web_push_schema.sql against the ` +
                    `${config.db.database} database first.`
            );
        }
    } finally {
        connection.release();
    }
}

const TABLES = ["pushoutbox", "pushsubscriptions", "pushdeliverylogs"];

export const PAYLOAD_SELECT = `
    o.PushOutboxId,
    o.UserId,
    o.PushSubscriptionId,
    o.Module,
    o.Type,
    o.Title,
    o.Body,
    o.IconUrl,
    o.BadgeUrl,
    o.TargetUrl,
    o.Tag,
    o.Priority,
    o.Attempts,
    o.CreatedAt
`;

/**
 * Claims a batch of due messages. The WHERE on Status is what makes the
 * claim atomic; affectedRows tells us whether we won the race.
 */
export async function claimDueMessages(batchSize) {
    const [rows] = await pool.query(
        `SELECT ${PAYLOAD_SELECT}
           FROM PushOutbox o
          WHERE o.Status = 'Pending'
            AND o.ScheduledAt <= NOW()
            AND o.CreatedAt >= (NOW() - INTERVAL ? HOUR)
          ORDER BY o.Priority ASC, o.PushOutboxId ASC
          LIMIT ?`,
        [config.worker.maxMessageAgeHours, batchSize]
    );

    const claimed = [];

    for (const row of rows) {
        const [result] = await pool.query(
            `UPDATE PushOutbox
                SET Status = 'Processing', Attempts = Attempts + 1
              WHERE PushOutboxId = ? AND Status = 'Pending'`,
            [row.PushOutboxId]
        );

        // Someone else took it, or it was cancelled meanwhile.
        if (result.affectedRows === 1) claimed.push(row);
    }

    return claimed;
}

/** Subscriptions to deliver one claimed message to. */
export async function loadTargetSubscriptions(message) {
    if (message.PushSubscriptionId) {
        const [rows] = await pool.query(
            `SELECT PushSubscriptionId, Endpoint, P256dh, Auth, UserId
               FROM PushSubscriptions
              WHERE PushSubscriptionId = ? AND IsActive = 1`,
            [message.PushSubscriptionId]
        );
        return rows;
    }

    const [rows] = await pool.query(
        `SELECT PushSubscriptionId, Endpoint, P256dh, Auth, UserId
           FROM PushSubscriptions
          WHERE UserId = ? AND IsActive = 1
          ORDER BY PushSubscriptionId ASC`,
        [message.UserId]
    );
    return rows;
}

/**
 * Closes a message out.
 *
 * @param {object} outcome
 * @param {"sent"|"retry"|"failed"|"gone"} outcome.result
 */
export async function finishMessage(outboxId, outcome) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const delivery of outcome.deliveries) {
            await connection.query(
                `INSERT INTO PushDeliveryLogs
                    (PushOutboxId, PushSubscriptionId, Status, StatusCode, Error)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    outboxId,
                    delivery.subscriptionId,
                    delivery.status,
                    delivery.statusCode ?? null,
                    safeError(delivery.error),
                ]
            );

            if (delivery.status === "Sent") {
                await connection.query(
                    `UPDATE PushSubscriptions
                        SET LastUsedAt = NOW(), IsActive = 1
                      WHERE PushSubscriptionId = ?`,
                    [delivery.subscriptionId]
                );
            }

            if (delivery.status === "Expired") {
                // 404/410: the push service has forgotten this subscription.
                // Keep the row (the user may still see the device listed),
                // but stop counting it as live so no more work is queued
                // for it, and let the API's maintenance job remove it later.
                await connection.query(
                    `UPDATE PushSubscriptions
                        SET IsActive = 0,
                            DeactivatedAt = NOW(),
                            LastUsedAt = NOW()
                      WHERE PushSubscriptionId = ?`,
                    [delivery.subscriptionId]
                );
            }
        }

        if (outcome.result === "sent") {
            await connection.query(
                `UPDATE PushOutbox
                    SET Status = 'Sent', ProcessedAt = NOW(), LastError = NULL
                  WHERE PushOutboxId = ?`,
                [outboxId]
            );
        } else if (outcome.result === "retry") {
            const delaySeconds = Math.floor(
                (outcome.retryDelayMs ?? 30_000) / 1000
            );
            await connection.query(
                `UPDATE PushOutbox
                    SET Status = 'Pending',
                        ScheduledAt = DATE_ADD(NOW(), INTERVAL ? SECOND),
                        LastError = ?
                  WHERE PushOutboxId = ?`,
                [delaySeconds, safeError(outcome.summary), outboxId]
            );
        } else if (outcome.result === "gone") {
            await connection.query(
                `UPDATE PushOutbox
                    SET Status = 'Failed',
                        ProcessedAt = NOW(),
                        LastError = 'Every target subscription is gone (404/410).'
                  WHERE PushOutboxId = ?`,
                [outboxId]
            );
        } else {
            await connection.query(
                `UPDATE PushOutbox
                    SET Status = 'Failed', ProcessedAt = NOW(), LastError = ?
                  WHERE PushOutboxId = ?`,
                [safeError(outcome.summary), outboxId]
            );
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback().catch(() => undefined);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Gives back rows this (or a previous) worker claimed but never resolved.
 *
 * A crash between claim and finishMessage leaves a row in 'Processing' with
 * no way back: claimDueMessages only ever picks up 'Pending', so the
 * notification would be lost until the API's 24-hour maintenance job ran.
 * Called on startup so a restart is always enough to recover.
 */
export async function requeueStuckMessages(minutesStuck = 10) {
    const [result] = await pool.query(
        `UPDATE PushOutbox
            SET Status = 'Pending',
                ScheduledAt = NOW(),
                LastError = 'Reclaimed: previous worker did not finish the delivery.'
          WHERE Status = 'Processing'
            AND ScheduledAt < (NOW() - INTERVAL ? MINUTE)`,
        [minutesStuck]
    );

    return result.affectedRows ?? 0;
}

/** Drops messages whose targets all died before delivery could start. */
export async function dropUnsubscribableMessages() {
    // Broadcasts (PushSubscriptionId IS NULL) with no live subscription left.
    const [broadcast] = await pool.query(
        `UPDATE PushOutbox o
            SET o.Status = 'Failed',
                o.ProcessedAt = NOW(),
                o.LastError = 'No active subscription left for this user.'
          WHERE o.Status IN ('Pending', 'Processing')
            AND o.PushSubscriptionId IS NULL
            AND o.CreatedAt < (NOW() - INTERVAL 1 HOUR)
            AND NOT EXISTS (
                SELECT 1 FROM PushSubscriptions s
                 WHERE s.UserId = o.UserId AND s.IsActive = 1
            )`
    );

    // Single-device sends whose one subscription is gone.
    const [targeted] = await pool.query(
        `UPDATE PushOutbox o
            SET o.Status = 'Failed',
                o.ProcessedAt = NOW(),
                o.LastError = 'Target subscription is no longer active.'
          WHERE o.Status IN ('Pending', 'Processing')
            AND o.PushSubscriptionId IS NOT NULL
            AND o.CreatedAt < (NOW() - INTERVAL 1 HOUR)
            AND NOT EXISTS (
                SELECT 1 FROM PushSubscriptions s
                 WHERE s.PushSubscriptionId = o.PushSubscriptionId
                   AND s.IsActive = 1
            )`
    );

    return (broadcast.affectedRows ?? 0) + (targeted.affectedRows ?? 0);
}

export async function pruneDeliveryLog(retentionDays) {
    const [result] = await pool.query(
        `DELETE FROM PushDeliveryLogs
          WHERE CreatedAt < (NOW() - INTERVAL ? DAY)`,
        [retentionDays]
    );
    return result.affectedRows;
}

export async function countPending() {
    const [rows] = await pool.query(
        `SELECT
            SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END)    AS pending,
            SUM(CASE WHEN Status = 'Processing' THEN 1 ELSE 0 END) AS processing,
            SUM(CASE WHEN Status = 'Sent' THEN 1 ELSE 0 END)       AS sent,
            SUM(CASE WHEN Status = 'Failed' THEN 1 ELSE 0 END)     AS failed
           FROM PushOutbox`
    );

    const row = rows[0] ?? {};
    return {
        pending: Number(row.pending ?? 0),
        processing: Number(row.processing ?? 0),
        sent: Number(row.sent ?? 0),
        failed: Number(row.failed ?? 0),
    };
}

function safeError(error) {
    if (!error) return null;
    const text =
        typeof error === "string"
            ? error
            : `${error.message ?? "Unknown error"}`;
    return text.length > 900 ? `${text.slice(0, 900)}…` : text;
}

export async function closeDatabase() {
    log.info("Closing MySQL pool…");
    await pool.end().catch(() => undefined);
}
