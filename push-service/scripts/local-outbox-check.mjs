// Local check: why did some PushOutbox rows fail / what do the pending
// rows look like? Uses the same push-service/.env credentials.
import "dotenv/config";
import mysql from "mysql2/promise";

const c = await mysql.createConnection({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "cdm_oneserve",
});

const [failed] = await c.query(
    `SELECT PushOutboxId, Module, Type, Attempts, LastError, CreatedAt
       FROM PushOutbox WHERE Status = 'Failed'`
);
console.log("== Failed rows ==");
failed.forEach((r) =>
    console.log(
        `  #${r.PushOutboxId} ${r.Module}/${r.Type} attempts=${r.Attempts} created=${r.CreatedAt}` +
            (r.LastError ? `\n     ${r.LastError}` : "")
    )
);

const [logs] = await c.query(
    `SELECT PushOutboxId, PushSubscriptionId, Status, StatusCode,
            COALESCE(Error,'') AS err, CreatedAt
       FROM PushDeliveryLogs ORDER BY PushDeliveryLogId DESC LIMIT 8`
);
console.log("\n== Last delivery log entries ==");
logs.forEach((r) =>
    console.log(
        `  outbox=#${r.PushOutboxId} sub=#${r.PushSubscriptionId} ${r.Status} HTTP ${r.StatusCode ?? "-"} ${r.CreatedAt}` +
            (r.err ? `\n     ${r.err}` : "")
    )
);

const [pending] = await c.query(
    `SELECT PushOutboxId, UserId, Module, Type, Status, Attempts,
            COALESCE(LastError,'') AS lastError, ScheduledAt, CreatedAt
       FROM PushOutbox WHERE Status = 'Pending' ORDER BY PushOutboxId`
);
console.log("\n== Pending rows ==");
pending.forEach((r) =>
    console.log(
        `  #${r.PushOutboxId} user ${r.UserId} ${r.Module}/${r.Type} attempts=${r.Attempts} ` +
            `scheduled=${r.ScheduledAt} created=${r.CreatedAt}` +
            (r.lastError ? `\n     lastError: ${r.lastError}` : "")
    )
);

await c.end();
