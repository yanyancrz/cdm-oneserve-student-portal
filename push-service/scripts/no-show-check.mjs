// Check the no-show auto-termination state: which Confirmed sessions the
// background job already terminated, and what notifications it wrote.
import mysql from "mysql2/promise";

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
});

const [appts] = await c.query(
    `SELECT Id, StudentId, CounselorId, Date, TimeSlot, Status, UpdatedAt
       FROM guidance_appointments
      WHERE Status IN ('NoShow','Confirmed')
      ORDER BY Id DESC LIMIT 15`
);
console.log("== guidance_appointments (recent) ==");
appts.forEach((a) =>
    console.log(
        `  #${a.Id} st=${a.StudentId} co=${a.CounselorId} ${a.Date} ${a.TimeSlot} -> ${a.Status} (updated ${a.UpdatedAt})`
    )
);

const [noshows] = await c.query(
    `SELECT COUNT(*) n, MIN(UpdatedAt) firstOne, MAX(UpdatedAt) lastOne
       FROM guidance_appointments
      WHERE Status = 'NoShow'
        AND UpdatedAt >= DATE_SUB(NOW(), INTERVAL 3 DAY)`
);
console.log("\n== NoShow rows updated in the last 3 days ==");
console.log(
    `  count=${noshows[0].n} first=${noshows[0].firstOne} last=${noshows[0].lastOne}`
);

const [notes] = await c.query(
    `SELECT Id, UserId, Type, Title, Message, CreatedAt
       FROM Notifications
      WHERE Type = 'GUIDANCE_APPOINTMENT_NOSHOW'
      ORDER BY Id DESC LIMIT 10`
);
console.log("\n== GUIDANCE_APPOINTMENT_NOSHOW notifications ==");
notes.forEach((n) =>
    console.log(`  #${n.Id} user=${n.UserId} ${n.Title} (${n.CreatedAt})\n     ${n.Message}`)
);

await c.end();
