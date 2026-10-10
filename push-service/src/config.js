/**
 * Configuration, straight from the environment.
 *
 * Everything sensitive (the VAPID private key, the MySQL password) lives
 * in push-service/.env, which is git-ignored. Nothing here is ever
 * exposed over HTTP.
 */
import "dotenv/config";

function required(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(
            `Missing required environment variable ${name}. ` +
                `Copy push-service/.env.example to push-service/.env and fill it in.`
        );
    }
    return value.trim();
}

function optional(name, fallback) {
    const value = process.env[name];
    return value && value.trim().length > 0 ? value.trim() : fallback;
}

function integer(name, fallback) {
    const value = Number.parseInt(process.env[name] ?? "", 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = {
    http: {
        port: integer("PORT", 4100),
        host: optional("HOST", "127.0.0.1"),
    },

    db: {
        host: optional("DB_HOST", "localhost"),
        port: integer("DB_PORT", 3306),
        user: optional("DB_USER", "root"),
        password: process.env.DB_PASSWORD ?? "",
        database: optional("DB_NAME", "cdm_oneserve"),
        // The claim step is a read-modify-write, so this must be a
        // transaction-capable pool.
        connectionLimit: integer("DB_CONNECTION_LIMIT", 10),
    },

    vapid: {
        publicKey: required("VAPID_PUBLIC_KEY"),
        privateKey: required("VAPID_PRIVATE_KEY"),
        subject: optional("VAPID_SUBJECT", "mailto:admin@example.com"),
    },

    worker: {
        pollIntervalMs: integer("POLL_INTERVAL_MS", 5000),
        batchSize: Math.min(integer("BATCH_SIZE", 50), 200),
        maxAttempts: integer("MAX_ATTEMPTS", 6),
        maxMessageAgeHours: integer("MAX_MESSAGE_AGE_HOURS", 72),
        deliveryLogRetentionDays: integer("DELIVERY_LOG_RETENTION_DAYS", 14),
        backoffBaseMs: integer("BACKOFF_BASE_MS", 30000),
    },

    logLevel: optional("LOG_LEVEL", "info").toLowerCase(),
};

/**
 * Sanity check the key pair before any delivery: a key that is not valid
 * base64url of the right length fails every single push otherwise.
 */
export function assertVapidKeysShape() {
    const { publicKey, privateKey } = config.vapid;

    const check = (label, value, expectedLength) => {
        if (!/^[A-Za-z0-9\-_]+$/.test(value)) {
            throw new Error(`${label} is not unpadded base64url.`);
        }
        const byteLength = Buffer.from(value, "base64url").length;
        if (byteLength !== expectedLength) {
            throw new Error(
                `${label} decoded to ${byteLength} bytes, expected ${expectedLength}.`
            );
        }
    };

    check("VAPID_PUBLIC_KEY", publicKey, 65);
    check("VAPID_PRIVATE_KEY", privateKey, 32);

    if (!/^(mailto:|https?:)/.test(config.vapid.subject)) {
        throw new Error(
            'VAPID_SUBJECT must start with "mailto:" or "https:" (RFC 8292).'
        );
    }
}
