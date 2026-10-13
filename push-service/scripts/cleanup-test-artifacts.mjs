/**
 * Undo the two manual transition tests: appointments #8 and #10 were
 * real rows (Oct 16 and Oct 14) that the probe flipped to verify the
 * fix. #7/#9 are left as-is: those were legitimate automatic
 * terminations by the background job, which is the feature working.
 */
import mysql from "mysql2/promise";

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
});

const [before] = await c.query(
    "SELECT Id, Status, Date, TimeSlot FROM guidance_appointments WHERE Id IN (7,8,9,10) ORDER BY Id"
);
console.log("Before:");
before.forEach((a) => console.log(`  #${a.Id} ${a.Status} ${a.Date}`));

await c.query(
    "UPDATE guidance_appointments SET Status = 'Confirmed', UpdatedAt = NOW() WHERE Id IN (8, 10)"
);

// The probe's no-show also created an in-app notification (#132) and a
// browser-push outbox row for user 17 about appointment #10.
const [notes] = await c.query(
    `SELECT Id, Type, Message FROM notifications
      WHERE Id = 132 AND Type = 'GUIDANCE_APPOINTMENT_NOSHOW'`
);
if (notes.length > 0) {
    await c.query("DELETE FROM notifications WHERE Id = 132");
    console.log(`\nDeleted notification #132: ${notes[0].Message}`);
}

const [outbox] = await c.query(
    `SELECT PushOutboxId, Title FROM pushoutbox
      WHERE Module = 'Guidance' AND Title = 'Marked as No-Show'
        AND CreatedAt > DATE_SUB(NOW(), INTERVAL 2 HOUR)`
);
for (const row of outbox) {
    await c.query("DELETE FROM pushdeliverylogs WHERE PushOutboxId = ?", [row.PushOutboxId]);
    await c.query("DELETE FROM pushoutbox WHERE PushOutboxId = ?", [row.PushOutboxId]);
    console.log(`Deleted push outbox #${row.PushOutboxId} (${row.Title})`);
}

const [after] = await c.query(
    "SELECT Id, Status, Date, TimeSlot FROM guidance_appointments WHERE Id IN (7,8,9,10) ORDER BY Id"
);
console.log("\nAfter:");
after.forEach((a) => console.log(`  #${a.Id} ${a.Status} ${a.Date}`));

await c.end();
