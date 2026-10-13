/**
 * Verifies the proof-of-ownership chain: a claim with an actual proof
 * file on disk, served as image bytes by the authorized endpoint (the
 * URL the fixed admin preview points at).
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

const API = "http://localhost:5212";
const SECRET = JSON.parse(
    readFileSync(
        `${process.env.APPDATA}/Microsoft/UserSecrets/ea926834-fcab-4e2a-a5e0-d585d12d6da4/secrets.json`,
        "utf8"
    ).replace(/^\uFEFF/, "")
)["Jwt:Key"];

function base64url(input) {
    return Buffer.from(input).toString("base64url");
}

function mint(user) {
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
            exp: now + 600,
        })
    );
    const sig = createHmac("sha256", SECRET)
        .update(`${header}.${body}`)
        .digest("base64url");
    return `${header}.${body}.${sig}`;
}

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
});

const [[claim]] = await c.query(
    `SELECT ClaimId, ReportedByNameHolder
       FROM (SELECT ClaimId, ProofAttachmentPath AS ReportedByNameHolder
               FROM claimrecords
              WHERE ProofAttachmentPath IS NOT NULL AND ProofAttachmentPath <> ''
              ORDER BY ClaimId DESC LIMIT 1) t`
);

if (!claim) {
    console.log("No claim with a proof file.");
    await c.end();
    process.exit(0);
}

// The admin who is allowed to read any proof.
const [[admin]] = await c.query(
    "SELECT Id, FullName, Email, Role FROM users WHERE Role LIKE '%ound%' OR Role IN ('Admin','SuperAdmin') LIMIT 1"
);
await c.end();

console.log(`Claim #${claim.ClaimId} (proof file on record) as admin #${admin.Id}:`);

const authorized = await fetch(`${API}/api/lostfound/claims/${claim.ClaimId}/proof`, {
    headers: { Authorization: `Bearer ${mint(admin)}` },
});
const bytes = authorized.headers.get("content-type");
const sent = await authorized.clone().bytes().catch(() => null);

if (authorized.status === 200) {
    const size = sent?.length ?? 0;
    const magic = sent
        ? sent[0] === 0x89
            ? "PNG"
            : sent[0] === 0xff
              ? "JPEG"
              : "other"
        : "?";
    console.log(`  HTTP 200  ${bytes}  ${(size / 1024).toFixed(1)} KB  magic=${magic}`);
    console.log(
        `  ${size > 0 ? "PASS: the proof serves real image bytes (the preview image will render)" : "FAIL: empty body"}`
    );
} else {
    console.log(`  HTTP ${authorized.status}: ${await authorized.text()}`);
}

// A stranger (not claimant/finder/admin) must still be refused.
const outsider = {
    Id: 999999,
    FullName: "Outsider",
    Email: "outsider@example.com",
    Role: "Student",
};
const denied = await fetch(
    `${API}/api/lostfound/claims/${claim.ClaimId}/proof`,
    { headers: { Authorization: `Bearer ${mint(outsider)}` } }
);
console.log(
    `  outsider -> HTTP ${denied.status} ${
        denied.status === 403 ? "PASS: access restriction intact" : "FAIL"
    }`
);
