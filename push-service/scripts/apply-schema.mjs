/**
 * Applies Database/Notifications/001_web_push_schema.sql.
 *
 * The raw .sql file is written for a database that already has the old
 * LostFoundPushSubscriptions table. When it does not exist - the table was
 * never actually created on this install, which is the normal case because
 * nothing ever called the Lost & Found push endpoints - the data-carry-over
 * step is skipped rather than failing the whole migration.
 *
 * Usage:
 *   node scripts/apply-schema.mjs            # apply
 *   node scripts/apply-schema.mjs --dry-run  # show what would happen
 *
 * Safe to run repeatedly: everything is CREATE TABLE IF NOT EXISTS and the
 * carry-over is guarded by NOT EXISTS on the endpoint.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import mysql from "mysql2/promise";

import { config } from "../src/config.js";
import { child } from "../src/logger.js";

const log = child("schema");

const here = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(here, "..", "..", "CDM-OneServe-API", "Database", "Notifications", "001_web_push_schema.sql");

const dryRun = process.argv.includes("--dry-run");

const TABLES = ["PushSubscriptions", "PushOutbox", "PushDeliveryLogs"];

async function main() {
    const connection = await mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        // The schema file is a multi-statement script.
        multipleStatements: true,
    });

    try {
        const before = await tableNames(connection);
        log.info(`Connected to ${config.db.database}. ${before.length} tables.`);

        // ---- carry-over guard -------------------------------------------------
        // Names are compared case-insensitively on purpose: this MySQL runs
        // lower_case_table_names=1 (so "PushSubscriptions" is stored as
        // "pushsubscriptions"), while a Linux host keeps the declared case.
        const legacy = "LostFoundPushSubscriptions";
        const legacyExists = before.some((name) => name.toLowerCase() === legacy.toLowerCase());

        if (!legacyExists) {
            log.info(`No ${legacy} table - nothing to carry over. Skipping that step.`);
        } else {
            const [[row]] = await connection.query(
                "SELECT COUNT(*) AS n FROM LostFoundPushSubscriptions"
            );
            log.info(`${legacy} found with ${row.n} row(s); they will be carried over.`);
        }

        if (dryRun) {
            log.info("Dry run: no changes made.");
            return;
        }

        // ---- create the tables ----------------------------------------------
        await connection.query(`
            CREATE TABLE IF NOT EXISTS PushSubscriptions (
              PushSubscriptionId int(11) NOT NULL AUTO_INCREMENT,
              UserId int(11) NOT NULL,
              Endpoint varchar(500) NOT NULL,
              P256dh varchar(255) NOT NULL,
              Auth varchar(255) NOT NULL,
              UserAgent varchar(500) DEFAULT NULL,
              DeviceLabel varchar(100) DEFAULT NULL,
              IsActive tinyint(1) NOT NULL DEFAULT 1,
              DeactivatedAt datetime DEFAULT NULL,
              LastUsedAt datetime NOT NULL DEFAULT current_timestamp(),
              CreatedAt datetime NOT NULL DEFAULT current_timestamp(),
              PRIMARY KEY (PushSubscriptionId),
              UNIQUE KEY IX_PushSub_Endpoint (Endpoint),
              KEY IX_PushSub_UserId_Active (UserId, IsActive),
              CONSTRAINT FK_PushSub_User FOREIGN KEY (UserId) REFERENCES users (Id)
                ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS PushOutbox (
              PushOutboxId bigint(20) NOT NULL AUTO_INCREMENT,
              UserId int(11) NOT NULL,
              PushSubscriptionId int(11) DEFAULT NULL,
              Module varchar(50) NOT NULL DEFAULT 'General',
              Type varchar(80) NOT NULL DEFAULT 'General',
              Title varchar(200) NOT NULL,
              Body varchar(1000) NOT NULL,
              IconUrl varchar(500) DEFAULT NULL,
              BadgeUrl varchar(500) DEFAULT NULL,
              TargetUrl varchar(500) NOT NULL DEFAULT '/dashboard',
              Tag varchar(120) DEFAULT NULL,
              DedupeKey varchar(190) NOT NULL,
              Priority tinyint(4) NOT NULL DEFAULT 5,
              Status varchar(20) NOT NULL DEFAULT 'Pending',
              Attempts tinyint(4) NOT NULL DEFAULT 0,
              LastError varchar(1000) DEFAULT NULL,
              ScheduledAt datetime NOT NULL DEFAULT current_timestamp(),
              CreatedAt datetime NOT NULL DEFAULT current_timestamp(),
              ProcessedAt datetime DEFAULT NULL,
              PRIMARY KEY (PushOutboxId),
              UNIQUE KEY IX_PushOutbox_DedupeKey (DedupeKey),
              KEY IX_PushOutbox_Claim (Status, ScheduledAt, PushOutboxId),
              KEY IX_PushOutbox_UserId (UserId),
              CONSTRAINT FK_PushOutbox_User FOREIGN KEY (UserId) REFERENCES users (Id)
                ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS PushDeliveryLogs (
              PushDeliveryLogId bigint(20) NOT NULL AUTO_INCREMENT,
              PushOutboxId bigint(20) NOT NULL,
              PushSubscriptionId int(11) NOT NULL,
              Status varchar(20) NOT NULL DEFAULT 'Sent',
              StatusCode int(11) DEFAULT NULL,
              Error varchar(1000) DEFAULT NULL,
              CreatedAt datetime NOT NULL DEFAULT current_timestamp(),
              PRIMARY KEY (PushDeliveryLogId),
              KEY IX_PushDeliveryLog_Outbox (PushOutboxId),
              KEY IX_PushDeliveryLog_Sub (PushSubscriptionId, CreatedAt)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

        log.info("Tables created (or already present).");

        // ---- carry-over ------------------------------------------------------
        if (legacyExists) {
            const [result] = await connection.query(
                `INSERT INTO PushSubscriptions
                   (UserId, Endpoint, P256dh, Auth, UserAgent, DeviceLabel,
                    IsActive, DeactivatedAt, LastUsedAt, CreatedAt)
                 SELECT o.UserId, LEFT(o.Endpoint, 500), o.P256dh, o.Auth,
                        NULL, 'Lost & Found', 1, NULL, o.LastUsedAt, o.CreatedAt
                   FROM LostFoundPushSubscriptions o
                  WHERE NOT EXISTS (
                        SELECT 1 FROM PushSubscriptions n WHERE n.Endpoint = o.Endpoint)`
            );

            if (result.affectedRows > 0) {
                log.info(`Carried over ${result.affectedRows} row(s) from ${legacy}.`);
            } else {
                log.info("Nothing to carry over.");
            }
        }

        // ---- verify ----------------------------------------------------------
        const after = await tableNames(connection);
        const lower = after.map((name) => name.toLowerCase());
        const missing = TABLES.filter((name) => !lower.includes(name.toLowerCase()));

        if (missing.length > 0) {
            throw new Error(`Still missing after migration: ${missing.join(", ")}`);
        }

        for (const name of TABLES) {
            const [[row]] = await connection.query(`SELECT COUNT(*) AS n FROM ${name}`);
            log.info(`${name}: ${row.n} row(s)`);
        }

        log.info("Migration complete. npm start should now boot clean.");
    } finally {
        await connection.end().catch(() => undefined);
    }
}

async function tableNames(connection) {
    const [rows] = await connection.query(
        `SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
        [config.db.database]
    );
    return rows.map((row) => row.name);
}

main().catch((error) => {
    log.error(`Migration failed: ${error?.message ?? error}`);
    process.exit(1);
});

// Referenced so the .sql path is available for anyone diffing the two sources.
export const schemaFile = sqlPath;
