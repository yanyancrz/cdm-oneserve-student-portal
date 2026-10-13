// Why did user 17 get no no-show push? Check subscription + delivery state.
import mysql from "mysql2/promise";

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
    timezone: "+08:00",
});

const [subs] = await c.query(
    `SELECT PushSubscriptionId, UserId, IsActive, DeactivatedAt, LastUsedAt
       FROM pushsubscriptions WHERE UserId IN (17, 43) ORDER BY PushSubscriptionId`
);
console.log("Subscriptions:");
subs.forEach((s) =>
    console.log(
        `  #${s.PushSubscriptionId} user=${s.UserId} active=${s.IsActive} lastUsed=${s.LastUsedAt} deactivated=${s.DeactivatedAt ?? "-"}`
    )
);

const [logs] = await c.query(
    `SELECT PushOutboxId, PushSubscriptionId, Status, StatusCode, CreatedAt
       FROM pushdeliverylogs ORDER BY PushDeliveryLogId DESC LIMIT 6`
);
console.log("\nLast deliveries:");
logs.forEach((l) =>
    console.log(
        `  outbox=#${l.PushOutboxId} sub=#${l.PushSubscriptionId} ${l.Status} HTTP${l.StatusCode ?? "-"} ${l.CreatedAt}`
    )
);

await c.end();
