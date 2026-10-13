/**
 * Verifies the FIND fixes end-to-end against the running API:
 *   1. POST /api/lostfound/matches refuses same-owner pairs (by UserId)
 *   2. No self-matches remain in the database
 *   3. GET /api/profile/{email} answers (Profile Settings page source)
 *   4. change-email / change-password validate safely
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

const pass = [];
const fail = [];

// ---- 1+2: the self-match scenario ---------------------------------------
const [[owner]] = await c.query(
    `SELECT r.UserId
       FROM lostfoundreports r
      WHERE r.ReportType = 'Lost'
        AND r.UserId IN (
            SELECT UserId FROM lostfoundreports WHERE ReportType = 'Found'
        )
      LIMIT 1`
);

const [[selfCount]] = await c.query(
    `SELECT COUNT(*) AS n
       FROM matchrecords m
       JOIN lostfoundreports lr ON lr.ReportId = m.LostReportId
       JOIN lostfoundreports fr ON fr.ReportId = m.FoundReportId
      WHERE lr.UserId = fr.UserId`
);

if (selfCount.n === 0) pass.push("No self-matches left in the database");
else fail.push(`${selfCount.n} self-match(es) still present`);

if (owner) {
    const [lost] = await c.query(
        "SELECT ReportId FROM lostfoundreports WHERE UserId = ? AND ReportType = 'Lost' LIMIT 1",
        [owner.UserId]
    );
    const [found] = await c.query(
        "SELECT ReportId FROM lostfoundreports WHERE UserId = ? AND ReportType = 'Found' LIMIT 1",
        [owner.UserId]
    );
    const [[user]] = await c.query(
        "SELECT Id, FullName, Email, Role FROM users WHERE Id = ?",
        [owner.UserId]
    );

    const response = await fetch(`${API}/api/lostfound/matches`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${mint(user)}`,
        },
        body: JSON.stringify({
            lostReportId: lost[0].ReportId,
            foundReportId: found[0].ReportId,
            matchPercentage: 100,
        }),
    });
    const body = await response.text();
    console.log(
        `own lost #${lost[0].ReportId} + own found #${found[0].ReportId} as user #${user.Id}: HTTP ${response.status}`
    );
    console.log(`  ${body}\n`);
    if (response.status === 400) pass.push("Same-owner match refused (400)");
    else fail.push("Same-owner match was NOT refused");
} else {
    console.log("(no user owns both report types - API check skipped)\n");
}

// ---- 3+4: profile endpoints used by Profile Settings --------------------
const [[admin]] = await c.query(
    "SELECT Id, FullName, Email, Role FROM users WHERE Role LIKE '%ound%' OR Role IN ('Admin','SuperAdmin') LIMIT 1"
);
const token = mint(admin);

const call = async (path, body) => {
    const response = await fetch(`${API}${path}`, {
        method: body ? "POST" : "GET",
        headers: {
            Accept: "application/json",
            ...(body ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${token}`,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.text() };
};

console.log(`Profile checks as ${admin.FullName} (#${admin.Id}, ${admin.Role}):`);
const me = await call(`/api/profile/${encodeURIComponent(admin.Email)}`);
console.log(`  GET /api/profile/{email}      -> HTTP ${me.status}`);
if (me.status === 200) pass.push("Profile readable");
else fail.push("Profile endpoint failed");

const sameEmail = await call("/api/profile/request-email-change", {
    userId: admin.Id,
    newEmail: admin.Email,
});
console.log(
    `  request-email-change (same)    -> HTTP ${sameEmail.status} (validation)`
);
if (sameEmail.status === 400) pass.push("Email-change validation works");
else fail.push("Email-change validation did not trigger");

const badPassword = await call("/api/profile/change-password", {
    userId: admin.Id,
    currentPassword: "not-the-real-password",
    newPassword: "Another.Thing99",
});
console.log(
    `  change-password (wrong current)-> HTTP ${badPassword.status} (rejected)`
);
if (badPassword.status === 400) pass.push("Password change rejects wrong current");
else fail.push("Password change did not reject");

await c.end();

console.log("\n==== RESULT ====");
pass.forEach((p) => console.log(`  PASS  ${p}`));
fail.forEach((f) => console.log(`  FAIL  ${f}`));
process.exitCode = fail.length === 0 ? 0 : 1;
