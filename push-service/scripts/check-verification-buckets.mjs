// Smoke test: what the Users page will classify each student/faculty as.
import mysql from "mysql2/promise";

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
});

function getVerificationMethod(u) {
    if (u.PhysicalIdDocument) return "Physical ID";
    const email = String(u.Email || "").trim().toLowerCase();
    if (
        email.endsWith("@student.pnm.edu.ph") ||
        email.endsWith("@pnm.edu.ph")
    )
        return "PNM Email";
    const v = String(u.PhysicalIdVerificationStatus || "").toLowerCase();
    if (v === "verified" || v === "approved") return "Physical ID";
    return "Not verified";
}

const [rows] = await c.query(
    `SELECT Id, FullName, Email, Role, AccountStatus,
            PhysicalIdVerificationStatus, PhysicalIdDocument
       FROM users
      WHERE Role IN ('Student','Faculty') AND AccountStatus <> 'Deleted'
      ORDER BY Id`
);

const buckets = { "PNM Email": [], "Physical ID": [], "Not verified": [] };
rows.forEach((u) => buckets[getVerificationMethod(u)].push(u));

console.log(`Students + faculty: ${rows.length}\n`);
for (const [method, list] of Object.entries(buckets)) {
    console.log(`== ${method}: ${list.length} ==`);
    list.slice(0, 12).forEach((u) =>
        console.log(
            `   #${u.Id} ${u.Role} [${u.AccountStatus}/${u.PhysicalIdVerificationStatus ?? "-"}] doc=${u.PhysicalIdDocument ? "yes" : "no"} ${u.Email}`
        )
    );
    if (list.length > 12) console.log(`   ... +${list.length - 12} more`);
}
await c.end();
