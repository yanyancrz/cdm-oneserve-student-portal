/**
 * Outbox worker: the only thing that pushes notifications.
 *
 * Pipeline per cycle:
 *   1. claim due Pending rows (atomic status flip)
 *   2. load the target subscriptions
 *   3. sendNotification() to each
 *   4. record every attempt in PushDeliveryLogs
 *   5. close the message out: Sent / retry with backoff / Failed
 *
 * Retry policy: exponential backoff from 30s, doubling per attempt, and a
 * hard cap at MAX_ATTEMPTS. 404/410 never retries - the subscription is
 * deactivated instead, which is what stops the outbox filling up with
 * work that can never be delivered.
 */
import { config } from "./config.js";
import * as db from "./db.js";
import { child } from "./logger.js";
import { buildPayload, deliver } from "./sender.js";

const log = child("worker");

const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

export async function runCycle() {
    const messages = await db.claimDueMessages(config.worker.batchSize);

    if (messages.length === 0) return { sent: 0, failed: 0, deferred: 0 };

    let sent = 0;
    let failed = 0;
    let deferred = 0;

    for (const message of messages) {
        try {
            const outcome = await deliverMessage(message);

            // THE OUTCOME MUST BE PERSISTED. Writing it is what:
            //   - records every attempt in PushDeliveryLogs
            //   - clears the claim (Sent / Failed), or re-queues with backoff
            //   - deactivates a subscription the push service no longer knows
            // Skipping this leaves the row stuck in 'Processing', and because
            // claimDueMessages only ever picks up 'Pending', it would never be
            // delivered at all.
            await db.finishMessage(message.PushOutboxId, outcome);

            if (outcome.result === "sent") sent += 1;
            else if (outcome.result === "retry") deferred += 1;
            else failed += 1;
        } catch (error) {
            // A single bad row must never stop the batch: put it back so
            // the next cycle can try again.
            log.error("Cycle failed for a message, requeueing.", {
                outboxId: message.PushOutboxId,
                error: error?.message,
            });

            await db
                .finishMessage(message.PushOutboxId, {
                    result: "retry",
                    deliveries: [],
                    summary: `Worker error: ${error?.message ?? "unknown"}`,
                    retryDelayMs: nextRetryDelayMs(message.Attempts),
                })
                .catch(() => undefined);

            deferred += 1;
        }
    }

    return { sent, failed, deferred };
}

async function deliverMessage(message) {
    const subscriptions = await db.loadTargetSubscriptions(message);

    if (subscriptions.length === 0) {
        // Useless immediately: nobody is subscribed (yet). Give the outbox
        // a moment, then let dropUnsubscribableMessages() fail it.
        log.warn("No active subscription for a queued message.", {
            outboxId: message.PushOutboxId,
            userId: message.UserId,
        });

        return {
            result: "retry",
            deliveries: [],
            summary: "No active subscription.",
            retryDelayMs: 30_000,
        };
    }

    const payload = buildPayload(message);

    if (!payload) {
        return {
            result: "failed",
            deliveries: subscriptions.map((subscription) => ({
                subscriptionId: subscription.PushSubscriptionId,
                status: "Failed",
                statusCode: null,
                error: "Payload too large to encrypt.",
            })),
            summary: "Payload too large to encrypt.",
        };
    }

    const deliveries = [];
    let anySent = false;
    let anyRetryable = false;
    let allGone = true;
    const problems = [];

    for (const subscription of subscriptions) {
        const result = await deliver(subscription, payload);

        if (result.ok) {
            anySent = true;
            allGone = false;
            deliveries.push({
                subscriptionId: subscription.PushSubscriptionId,
                status: "Sent",
                statusCode: result.statusCode,
                error: null,
            });
            continue;
        }

        if (result.gone) {
            // The user's other devices may still be fine; only this row dies.
            deliveries.push({
                subscriptionId: subscription.PushSubscriptionId,
                status: "Expired",
                statusCode: result.statusCode,
                error: result.error,
            });
            problems.push(result.error);
            continue;
        }

        allGone = false;

        if (result.retryable) anyRetryable = true;

        deliveries.push({
            subscriptionId: subscription.PushSubscriptionId,
            status: result.retryable ? "Failed" : "Failed",
            statusCode: result.statusCode,
            error: result.error,
        });
        problems.push(result.error);
    }

    // Attempt budget exhausted: park it as Failed so the outbox stops growing.
    if (anyRetryable && message.Attempts >= config.worker.maxAttempts) {
        return {
            result: "failed",
            deliveries,
            summary: `Gave up after ${message.Attempts} attempts: ${problems.join(" | ")}`,
        };
    }

    if (anyRetryable) {
        return {
            result: "retry",
            deliveries,
            summary: problems.join(" | "),
            retryDelayMs: nextRetryDelayMs(message.Attempts),
        };
    }

    if (!anySent) {
        return {
            result: allGone ? "gone" : "failed",
            deliveries,
            summary: problems.join(" | ") || "Delivery failed.",
        };
    }

    // At least one device got it: the message is delivered.
    return { result: "sent", deliveries };
}

function nextRetryDelayMs(attempts) {
    const exponent = Math.max(Number(attempts) || 1, 1);
    return Math.min(
        config.worker.backoffBaseMs * 2 ** (exponent - 1),
        MAX_RETRY_DELAY_MS
    );
}

/** Housekeeping that is safe to run from the worker too. */
export async function runMaintenance() {
    // Reclaim anything an earlier run (or a previous process) abandoned
    // before it wrote an outcome back.
    const reclaimed = await db.requeueStuckMessages().catch(() => 0);
    const dropped = await db.dropUnsubscribableMessages().catch(() => 0);
    const pruned = await db
        .pruneDeliveryLog(config.worker.deliveryLogRetentionDays)
        .catch(() => 0);

    if (reclaimed > 0 || dropped > 0 || pruned > 0) {
        log.info("Maintenance.", { reclaimed, dropped, pruned });
    }

    return { reclaimed, dropped, pruned };
}
