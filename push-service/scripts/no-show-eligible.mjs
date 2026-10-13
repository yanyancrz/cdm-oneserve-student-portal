// What the auto-terminate job's criteria would pick up right now.
import mysql from "mysql2/promise";

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
    timezone: "+08:00",
});

const [[t]] = await c.query("SELECT NOW() AS dbNow, CURDATE() AS today");
console.log(`DB NOW() = ${t.dbNow}   CURDATE() = ${t.today}`);

// Reproduce the service's in-memory filter in SQL: Confirmed,
// Date <= today, AND slotStart + 30min <= nowMinutes (PH wall clock).
const [eligible] = await c.query(
    `SELECT Id, Date, TimeSlot, Status, UpdatedAt
       FROM guidance_appointments
      WHERE Status = 'Confirmed'
        AND Date <= CURDATE()
        AND (Date < CURDATE()
             OR (TIME_TO_SEC(TIME(TimeSlot)) + 1800) <= TIME_TO_SEC(CURTIME()))
      ORDER BY Id`
);
console.log("\nEligible for auto-terminate RIGHT NOW:");
eligible.forEach((a) =>
    console.log(`  #${a.Id} ${a.Date.toISOString().slice(0, 10)} ${a.TimeSlot} -> ${a.Status}`)
);
if (eligible.length === 0) console.log("  (none)");

await c.end();
