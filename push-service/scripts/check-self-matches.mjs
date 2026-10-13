// Actual L&F table names (case) for writing the migration.
import mysql from "mysql2/promise";

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
});

const [t] = await c.query("SHOW TABLES LIKE '%report%'");
console.log(t.map((r) => Object.values(r)[0]).join("\n"));

const [m] = await c.query(
    `SELECT COUNT(*) n FROM matchrecords WHERE IsConfirmed = 0`
);
console.log("\nunconfirmed match rows:", m[0].n);

const [self] = await c.query(
    `SELECT COUNT(*) n
       FROM matchrecords m
       JOIN lostfoundreports lr ON lr.ReportId = m.LostReportId
       JOIN lostfoundreports fr ON fr.ReportId = m.FoundReportId
      WHERE m.IsConfirmed = 0 AND lr.UserId = fr.UserId`
);
console.log("self-matches (same UserId, unconfirmed):", self[0].n);

await c.end();
