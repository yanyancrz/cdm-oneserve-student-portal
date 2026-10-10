/**
 * CDM OneServe - Web Push notification service.
 *
 *   .env  ->  config  ->  db + sender  ->  worker loop
 *
 * HTTP surface: /health and /stats only. There is intentionally no
 * "send a notification now" endpoint: everything arrives through the
 * PushOutbox table, which is what keeps the ASP.NET API decoupled from
 * this process and from the VAPID private key.
 */
import http from "node:http";

import { assertVapidKeysShape, config } from "./config.js";
import * as db from "./db.js";
import { child, configureLogging } from "./logger.js";
import { initWebPush } from "./sender.js";
import { runCycle, runMaintenance } from "./worker.js";

const log = child("server");

let cycle = 0;
let running = true;

async function loop() {
    // Reclaim anything a previous process abandoned mid-delivery, so a
    // restart alone always recovers stuck notifications.
    const reclaimed = await db.requeueStuckMessages().catch((error) => {
        log.warn("Could not reclaim stuck messages.", { error: error?.message });
        return 0;
    });

    if (reclaimed > 0) {
        log.info(`Reclaimed ${reclaimed} notification(s) stuck from a previous run.`);
    }

    log.info(`Polling every ${config.worker.pollIntervalMs}ms.`);

    while (running) {
        const startedAt = Date.now();
        cycle += 1;

        try {
            await runCycle();

            if (cycle % 120 === 0) await runMaintenance();
        } catch (error) {
            // The loop must survive anything: the API already retried the
            // rows, so a bump here is just a delayed delivery.
            log.error("Cycle threw.", { error: error?.message });
        }

        // Sleep outside the try/catch so an error never runs the loop hot.
        await sleep(config.worker.pollIntervalMs - (Date.now() - startedAt));
    }
}

function sleep(ms) {
    const wait = Math.max(ms, 250);
    return new Promise((resolve) => {
        setTimeout(resolve, wait);
    });
}

function startHealthServer() {
    const server = http.createServer(async (request, response) => {
        const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

        // No cache, no cookies, no auth headers required.
        const send = (status, body) => {
            response.writeHead(status, {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "no-store",
            });
            response.end(JSON.stringify(body));
        };

        if (url.pathname === "/health") {
            const counts = await db.countPending().catch(() => null);
            send(200, {
                status: counts ? "ok" : "degraded",
                service: "cdm-oneserve-push-service",
                cycles: cycle,
                database: counts ? "connected" : "unreachable",
                outbox: counts,
                uptimeSeconds: Math.floor(process.uptime()),
            });
            return;
        }

        if (url.pathname === "/stats") {
            const counts = await db.countPending().catch(() => null);
            send(200, {
                cycles: cycle,
                outbox: counts,
                // The public key only - never the private one.
                vapidSubject: config.vapid.subject,
            });
            return;
        }

        send(404, { status: "not found" });
    });

    server.listen(config.http.port, config.http.host, () => {
        log.info(`Health endpoint on http://${config.http.host}:${config.http.port}/health`);
    });

    return server;
}

async function main() {
    configureLogging(config.logLevel);

    log.info("CDM OneServe push service starting…");

    // Fail loudly at startup rather than silently on every send.
    assertVapidKeysShape();
    await db.initDatabase();
    initWebPush();

    const server = startHealthServer();

    const shutdown = async (signal) => {
        if (!running) return;
        running = false;
        log.info(`${signal} received, shutting down.`);

        server.close();
        await db.closeDatabase();
        process.exit(0);
    };

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));

    await loop();
}

main().catch((error) => {
    log.error("Fatal startup error.", { error: error?.message });
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
});
