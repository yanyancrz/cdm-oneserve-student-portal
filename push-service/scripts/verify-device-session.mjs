/**
 * End-to-end proof of the "signed in on another device" detection.
 *
 * Mints two sessions for one user the way AuthController does, then asks the
 * same question the dashboard asks - "is there a NEWER session from a
 * DIFFERENT key?" - and expects yes. Then dismisses and expects no.
 *
 *   node scripts/verify-device-session.mjs
 */
import "dotenv/config";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const APP = process.env.PROBE_API ?? "http://localhost:5212";
const here = dirname(fileURLToPath(import.meta.url));

/** The JWT signing key, read from the API's own appsettings. */
function readJwtKey() {
    const path = join(here, "..", "..", "..", "CDM-OneServe-API", "appsettings.json");
    const raw = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    return raw.match(/"Key"\s*:\s*"([^"]+)"/)[1];
}

function base64url(input) {
    return Buffer.from(input).toString("base64url");
}

function mintToken(secret, user) {
    const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const now = Math.floor(Date.now() / 1000);
    const body = base64url(
        JSON.stringify({
            nameid: String(user.Id),
            unique_name: user.FullName,
            email: user.Email,
            role: user.Role,
            nbf: now - 60,
            iat: now - 60,
            exp: now + 900,
        })
    );

    const signature = createHmac("sha256", secret)
        .update(`${header}.${body}`)
        .digest("base64url");

    return `${header}.${body}.${signature}`;
}

const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "cdm_oneserve",
});

let firstKey;
let secondKey;

try {
    const secret = readJwtKey();

    const [[user]] = await connection.query(
        "SELECT Id, FullName, Email, Role FROM users ORDER BY Id LIMIT 1"
    );
    if (!user) {
        console.log("No users to test with.");
        process.exit(1);
    }

    const token = mintToken(secret, user);

    const insert = (key, label, minutesAgo) =>
        connection.query(
            `INSERT INTO UserSessions
                (UserId, SessionKey, DeviceLabel, UserAgent, CreatedAt, LastSeenAt, IsRevoked)
             VALUES (?, ?, ?, 'probe', DATE_SUB(NOW(), INTERVAL ? MINUTE), NOW(), 0)`,
            [user.Id, key, label, minutesAgo]
        );

    // THIS device signed in 10 minutes ago.
    firstKey = randomUUID().replace(/-/g, "").slice(0, 32);
    await insert(firstKey, "Chrome on Windows (this device)", 10);

    // SOMEBODY ELSE signed in 2 minutes ago.
    secondKey = randomUUID().replace(/-/g, "").slice(0, 32);
    await insert(secondKey, "Chrome on Android (the other one)", 2);

    async function ask(key) {
        const response = await fetch(`${APP}/api/auth/session/status`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
                "X-Session-Key": key,
            },
        });

        const text = await response.text();
        try {
            return { status: response.status, body: JSON.parse(text) };
        } catch {
            return { status: response.status, body: text };
        }
    }

    console.log(`\nTesting as user ${user.Id} (${user.FullName})\n`);

    const warned = await ask(firstKey);
    console.log("1. this device (older) sees the newer login:");
    console.log(`   HTTP ${warned.status}`);
    console.log(`   hasOtherDevice  = ${warned.body?.hasOtherDevice}`);
    console.log(`   otherDeviceLabel= ${warned.body?.otherDeviceLabel}`);
    console.log(`   otherDeviceAt   = ${warned.body?.otherDeviceAt}`);

    const notWarned = await ask(secondKey);
    console.log("\n2. the newer device sees nothing newer:");
    console.log(`   HTTP ${notWarned.status}`);
    console.log(`   hasOtherDevice = ${notWarned.body?.hasOtherDevice}   (must be false)`);

    const noKey = await fetch(`${APP}/api/auth/session/status`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    console.log("\n3. a browser with no session key (signed in before this feature):");
    console.log(`   currentSessionKnown = ${noKey?.currentSessionKnown}`);
    console.log(`   hasOtherDevice = ${noKey?.hasOtherDevice}   (must be false - no guessing)`);

    const dismissed = await fetch(`${APP}/api/auth/session/dismiss-others`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "X-Session-Key": firstKey,
        },
    }).then((r) => r.json());
    const afterDismiss = await ask(firstKey);
    console.log("\n4. after the user clicks 'It was me':");
    console.log(`   dismiss -> ${dismissed?.message}`);
    console.log(`   hasOtherDevice = ${afterDismiss.body?.hasOtherDevice}   (must be false)`);

    const anon = await fetch(`${APP}/api/auth/session/status`);
    console.log("\n5. no token at all:");
    console.log(`   HTTP ${anon.status}   (must be 401)`);
} finally {
    await connection
        .query("DELETE FROM UserSessions WHERE SessionKey IN (?, ?)", [firstKey, secondKey])
        .catch(() => undefined);
    await connection.end();
    console.log("\n(test sessions removed)");
}
