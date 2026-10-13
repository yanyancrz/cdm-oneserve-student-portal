/**
 * Apply Database/Guidance/004_guidance_attendance_status.sql.
 *
 * Fixes the console-terminate 500: the ck_gapp_status check constraint
 * rejected 'Arrived' and 'NoShow'. Idempotent - it reports when the
 * migration is already applied instead of failing.
 *
 *   node scripts/apply-004.mjs [--dry-run]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const dryRun = process.argv.includes("--dry-run");
const here = dirname(fileURLToPath(import.meta.url));
const sqlFile = join(
    here, "..", "..", "..", "CDM-OneServe-API", "Database", "Guidance",
    "004_guidance_attendance_status.sql"
);

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
    multipleStatements: true,
});

function splitStatements(sql) {
    return sql
        .split(/;\s*(?:\r?\n|$)/)
        .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
        .filter((s) => s.length > 0);
}

try {
    const [rows] = await c.query(
        `SELECT CHECK_CLAUSE FROM information_schema.CHECK_CONSTRAINTS
          WHERE CONSTRAINT_SCHEMA = 'cdm_oneserve'
            AND CONSTRAINT_NAME = 'ck_gapp_status'`
    );

    const clause = rows[0]?.CHECK_CLAUSE ?? "";
    const done = clause.includes("NoShow");

    if (done) {
        console.log("Already applied: ck_gapp_status already lists NoShow.");
        console.log(`  ${clause}`);
        await c.end();
        process.exit(0);
    }

    console.log(`Current constraint: ${clause}\n`);

    const statements = splitStatements(readFileSync(sqlFile, "utf8"));
    console.log(`${statements.length} statement(s) to run${dryRun ? " (DRY RUN)" : ""}:\n`);

    for (const statement of statements) {
        const preview = statement.replace(/\s+/g, " ");
        console.log(`  > ${preview.slice(0, 110)}${preview.length > 110 ? "..." : ""}`);
        if (!dryRun) await c.query(statement);
    }

    if (!dryRun) {
        const [after] = await c.query(
            `SELECT CHECK_CLAUSE FROM information_schema.CHECK_CONSTRAINTS
              WHERE CONSTRAINT_SCHEMA = 'cdm_oneserve'
                AND CONSTRAINT_NAME = 'ck_gapp_status'`
        );
        console.log(`\nNew constraint: ${after[0]?.CHECK_CLAUSE}`);
        console.log("Applied. Terminate/NoShow will now work.");
    }
} catch (error) {
    console.error("FAILED:", error.message);
    process.exitCode = 1;
} finally {
    await c.end();
}
