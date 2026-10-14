// Verify returned found reports stay on the board with claimant info.
import mysql from "mysql2/promise";

const API = process.env.PROBE_API ?? "http://localhost:5212";

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
});

const [returned] = await c.query(
    `SELECT c.ClaimId, c.ReportId, c.ClaimedByUserId, c.Status,
            s.ReceivedByName, s.ReceivedByStudentId, s.Status AS schedStatus
       FROM claimrecords c
       LEFT JOIN claimschedules s ON s.ClaimId = c.ClaimId AND s.Status = 'Completed'
      WHERE c.Status = 'Returned'`
);
console.log(`Returned claims in DB: ${returned.length}`);
returned.forEach((r) =>
    console.log(
        `  claim #${r.ClaimId} report #${r.ReportId} claimant=${r.ClaimedByUserId} receiver="${r.ReceivedByName ?? "-"}"`
    )
);
await c.end();

if (returned.length === 0) {
    console.log("No returned claims to verify against - board check skipped.");
    process.exit(0);
}

// 1. Found board must include the returned FOUND report, with names.
const board = await fetch(`${API}/api/lostfound/reports?type=Found`).then((r) => r.json());
const rows = board.data ?? board;
const foundReturned = returned.find((r) => r.ReportId === 10) ?? returned[0];
const hit = rows.find((x) => x.reportId === foundReturned.ReportId);
console.log(`\nFound board rows: ${rows.length}`);
if (!hit) {
    console.log("FAIL: returned found report missing from the board");
    process.exitCode = 1;
} else {
    console.log(
        `PASS: returned report #${hit.reportId} on board, ` +
            `isReturned=${hit.isReturned} returnedTo="${hit.returnedToName}" claimedBy="${hit.claimedByName}"`
    );
    if (!hit.isReturned || !hit.returnedToName || !hit.claimedByName) {
        console.log("FAIL: claimant fields incomplete");
        process.exitCode = 1;
    }
}

// 2. Details endpoint carries the same fields.
const detail = await fetch(`${API}/api/lostfound/reports/${returned[0].ReportId}`).then((r) =>
    r.json()
);
const d = detail.data ?? detail;
console.log(
    `Details: isReturned=${d.isReturned} returnedTo="${d.returnedToName}" claimedBy="${d.claimedByName}" returnedAt=${d.returnedAt ?? "-"}`
);
if (!d.isReturned) {
    console.log("FAIL: details missing returned info");
    process.exitCode = 1;
} else {
    console.log("PASS: details carry returned info");
}

if (!process.exitCode) console.log("\nALL CHECKS PASSED");
