// Were the auto-terminated no-show browser pushes delivered?
import mysql from "mysql2/promise";

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
    timezone: "+08:00",
});

const [rows] = await c.query(
    `SELECT PushOutboxId, UserId, Title, Status, ProcessedAt
       FROM pushoutbox
      WHERE Title = 'Marked as No-Show'
      ORDER BY PushOutboxId DESC LIMIT 4`
);
rows.forEach((r) =>
    console.log(`  #${r.PushOutboxId} user=${r.UserId} [${r.Status}] processed=${r.ProcessedAt ?? "-"}`)
);

await c.end();
