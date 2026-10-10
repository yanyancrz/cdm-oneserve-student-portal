/**
 * Manual smoke test: send one notification through web-push to the newest
 * active subscription, bypassing the outbox and the API.
 *
 * Useful when you need to prove the VAPID key pair and the browser
 * subscription still agree with each other.
 *
 * Usage:
 *   node scripts/manual-send.mjs "Title" "Body text" "/lost-found/claims"
 *
 * Reads the key pair from push-service/.env, so nothing extra to configure.
 */
import webPush from "web-push";
import mysql from "mysql2/promise";

import { config, assertVapidKeysShape } from "../src/config.js";
import { child } from "../src/logger.js";

const log = child("manual-send");

const title = process.argv[2] ?? "CDM OneServe";
const body = process.argv[3] ?? "This is a manual Web Push test.";
const targetUrl = process.argv[4] ?? "/dashboard";

async function main() {
    assertVapidKeysShape();

    webPush.setVapidDetails(
        config.vapid.subject,
        config.vapid.publicKey,
        config.vapid.privateKey
    );

    const connection = await mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
    });

    try {
        const [rows] = await connection.execute(
            `SELECT PushSubscriptionId, Endpoint, P256dh, Auth, UserId
               FROM PushSubscriptions
              WHERE IsActive = 1
              ORDER BY PushSubscriptionId DESC
              LIMIT 1`
        );

        const subscription = rows[0];
        if (!subscription) {
            log("error", "No active PushSubscriptions row to test against.");
            process.exit(1);
        }

        const payload = JSON.stringify({
            title,
            body,
            targetUrl,
            module: "System",
            type: "ManualTest",
            tag: `manual-${Date.now()}`,
        });

        log("info", `Sending to subscription #${subscription.PushSubscriptionId} (user ${subscription.UserId})…`);

        await webPush.sendNotification(
            {
                endpoint: subscription.Endpoint,
                keys: { p256dh: subscription.P256dh, auth: subscription.Auth },
            },
            payload,
            { TTL: 3600 }
        );

        log("info", "Accepted by the push service. The tray should show it now.");
    } catch (error) {
        log("error", `Delivery failed (status ${error.statusCode ?? "n/a"}): ${error.message}`);
        if (error.statusCode === 404 || error.statusCode === 410) {
            log("error", "The subscription is dead. Re-subscribe from /profile and retry.");
        }
        process.exit(1);
    } finally {
        await connection.end().catch(() => undefined);
    }
}

void main();
