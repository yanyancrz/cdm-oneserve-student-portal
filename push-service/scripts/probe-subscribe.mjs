/**
 * End-to-end probe of POST /api/push/subscribe.
 *
 * Mints a JWT with the same secret the API uses (so no real login is
 * needed) and POSTs a subscription shaped EXACTLY the way a browser's
 * PushManager.subscribe() result looks once it goes through JSON.stringify.
 *
 * That last part is the whole point: the interesting failure is a payload
 * where `keys` arrives as {} instead of the p256dh/auth strings.
 *
 *   node scripts/probe-subscribe.mjs
 */
import { createHmac, randomBytes, createECDH } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";

// Read only what this probe needs (the database) so it does not demand the
// VAPID keys that config.js requires.
import "dotenv/config";

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = join(here, "..", "..");
const API = process.env.PROBE_API ?? "http://localhost:5212";

// The JWT signing key, read from the API's own appsettings so this stays a
// one-command local diagnostic (override with PROBE_JWT if needed).
function readJwtKey() {
    if (process.env.PROBE_JWT) return process.env.PROBE_JWT;

    const candidates = [
        join(rootDir, "..", "CDM-OneServe-API", "appsettings.json"),
        join(rootDir, "..", "CDM-OneServe-API", "appsettings.Development.json"),
    ];

    for (const path of candidates) {
        try {
            // appsettings.json carries /* */ comments, so strip them before parsing.
            const raw = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
            const match = raw.match(/"Key"\s*:\s*"([^"]+)"/);
            if (match) return match[1];
        } catch {
            // try the next candidate
        }
    }

    return null;
}

// ---- who to pretend to be -------------------------------------------------
const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "cdm_oneserve",
});

const [[user]] = await connection.query(
    "SELECT Id, Role, Email FROM users ORDER BY Id LIMIT 1"
);
await connection.end();

if (!user) {
    console.log("No users in the database to act as.");
    process.exit(1);
}

// ---- mint a JWT the API will accept ---------------------------------------
const secret = readJwtKey();
if (!secret) {
    console.log(
        "Could not read the JWT key. Set PROBE_JWT to the Jwt:Key from\n" +
            "CDM-OneServe-API/appsettings.json, or place this project next to it."
    );
    process.exit(1);
}

function base64url(input) {
    return Buffer.from(input).toString("base64url");
}

const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));

const now = Math.floor(Date.now() / 1000);
const claims = {
    nameid: String(user.Id),
    unique_name: "Probe",
    email: user.Email ?? "",
    role: user.Role ?? "Student",
    nbf: now - 60,
    iat: now - 60,
    exp: now + 900,
};

const body = base64url(JSON.stringify(claims));
const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

const token = `${header}.${body}.${signature}`;

// ---- what PushManager.subscribe() really produces --------------------------
// p256dh = uncompressed P-256 public key (0x04 || X || Y) = 65 bytes
// auth   = 16 random bytes
const ecdh = createECDH("prime256v1");
ecdh.generateKeys();
const p256dh = ecdh.getPublicKey().toString("base64url");
const auth = randomBytes(16).toString("base64url");

const endpoint = `https://fcm.googleapis.com/fcm/send/${randomBytes(16).toString("hex")}`;

const cases = [
    {
        label: "valid browser-shaped payload",
        body: { endpoint, p256dh, auth, deviceLabel: "Probe" },
    },
    {
        label: "keys MISSING (JSON.stringify of a raw subscription does this)",
        body: { endpoint, deviceLabel: "Probe" },
    },
    {
        label: "keys serialised as ArrayBuffers -> arrive as {}",
        body: {
            endpoint,
            keys: {},
            deviceLabel: "Probe",
        },
    },
    {
        label: "PADDED base64 instead of base64url",
        body: {
            endpoint,
            p256dh: Buffer.from(ecdh.getPublicKey()).toString("base64"),
            auth: Buffer.from(randomBytes(16)).toString("base64"),
        },
    },
    {
        label: "truncated p256dh (64 bytes)",
        body: {
            endpoint,
            p256dh: ecdh.getPublicKey().subarray(0, 64).toString("base64url"),
            auth,
        },
    },
];

console.log(`acting as user ${user.Id} (${user.Role}) against ${API}\n`);

for (const testCase of cases) {
    let response;
    try {
        response = await fetch(`${API}/api/push/subscribe`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(testCase.body),
        });
    } catch (error) {
        console.log(`!! ${testCase.label}\n   request failed: ${error.message}`);
        continue;
    }

    const text = await response.text();
    let message = text;
    try {
        message = JSON.parse(text).message ?? text;
    } catch {
        // not JSON
    }

    const verdict = response.status === 200 ? "ACCEPTED" : `REJECTED (${response.status})`;
    console.log(`${verdict}  ${testCase.label}`);
    console.log(`          ${message}\n`);
}
