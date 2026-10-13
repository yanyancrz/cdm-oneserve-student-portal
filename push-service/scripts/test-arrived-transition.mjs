/**
 * Reproduce the counselor "terminate" (Arrived) click against the running
 * API, exactly like the frontend: PATCH .../status with { status:"Arrived" }.
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
            exp: now + 3600,
        })
    );
    const sig = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
    return `${header}.${body}.${sig}`;
}

const c = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "cdm_oneserve",
});

// The counselor who owns the test appointments (#7-#10).
const [[counselor]] = await c.query(
    "SELECT Id, FullName, Email, Role FROM users WHERE Role = 'Counselor' LIMIT 1"
);
if (!counselor) {
    console.log("No counselor found.");
    process.exit(1);
}
console.log(`Acting as counselor #${counselor.Id} (${counselor.FullName})\n`);

const token = mint(counselor);

const [due] = await c.query(
    `SELECT Id, Status, Date, TimeSlot FROM guidance_appointments
      WHERE CounselorId = ? ORDER BY Id DESC`,
    [counselor.Id]
);
console.log("Appointments:", due.map((a) => `#${a.Id} ${a.Status}`).join(", "), "\n");

const target = due.find((a) => a.Status === "Confirmed");
if (!target) {
    console.log("No Confirmed appointment left to test the transition on.");
    await c.end();
    process.exit(0);
}

try {
    const response = await fetch(
        `${API}/api/guidance/counselor/appointments/${target.Id}/status`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "Arrived" }),
        }
    );

    console.log(`PATCH #${target.Id} -> Arrived:  HTTP ${response.status}`);
    console.log(await response.text());

    // Second click on the same (now final) row, as the UI lets you retry.
    const again = await fetch(
        `${API}/api/guidance/counselor/appointments/${target.Id}/status`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "Arrived" }),
        }
    );
    console.log(`\nPATCH #${target.Id} -> Arrived AGAIN:  HTTP ${again.status}`);
    console.log(await again.text());
} catch (error) {
    console.log("request failed:", error.message);
}

await c.end();
