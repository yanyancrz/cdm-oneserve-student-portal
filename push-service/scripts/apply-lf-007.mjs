/**
 * Apply Database/LostFound/007_no_self_matches.sql.
 *
 *   node scripts/apply-lf-007.mjs [--dry-run]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const dryRun = process.argv.includes("--dry-run");
const here = dirname(fileURLToPath(import.meta.url));
const sqlFile = join(
    here, "..", "..", "..", "CDM-OneServe-API", "Database", "LostFound",
    "007_no_self_matches.sql"
);

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
});

async function countSelfMatches() {
    const [rows] = await c.query(
        `SELECT COUNT(*) AS n
           FROM matchrecords m
           JOIN lostfoundreports lr ON lr.ReportId = m.LostReportId
           JOIN lostfoundreports fr ON fr.ReportId = m.FoundReportId
          WHERE lr.UserId = fr.UserId`
    );
    return rows[0].n;
}

try {
    const before = await countSelfMatches();
    console.log(`Self-matches before: ${before}`);

    if (before === 0) {
        console.log("Nothing to clean.");
    } else if (!dryRun) {
        await c.query(readFileSync(sqlFile, "utf8"));
        console.log(`After: ${await countSelfMatches()}`);
        console.log("Applied 007_no_self_matches.sql");
    } else {
        console.log("(dry run - nothing applied)");
    }
} catch (error) {
    console.error("FAILED:", error.message);
    process.exitCode = 1;
} finally {
    await c.end();
}
