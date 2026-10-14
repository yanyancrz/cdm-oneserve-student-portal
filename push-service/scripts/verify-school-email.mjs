/**
 * End-to-end test of school-email auto-verification:
 *   1. student@student.pnm.edu.ph, NO physical ID -> OTP sent, verify -> Active/Verified
 *   2. faculty@pnm.edu.ph, NO physical ID -> OTP sent, verify -> Active/Verified
 *   3. student domain + Faculty role -> 400 mismatch
 *   4. personal email + NO physical ID -> 400 still required
 * Reads the OTP code straight from the DB (no inbox access), then
 * removes every test row afterwards.
 */
import mysql from "mysql2/promise";

const API = process.env.PROBE_API ?? "http://localhost:5212";
const stamp = Date.now().toString().slice(-6);

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
});

const results = [];
const pass = (name) => results.push(`  PASS  ${name}`);
const fail = (name, extra = "") => results.push(`  FAIL  ${name}${extra ? ` (${extra})` : ""}`);

async function register(body) {
    const r = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.text() };
}

async function verify(email) {
    const [[row]] = await c.query(
        "SELECT OTPCode FROM otpverifications WHERE Email = ?",
        [email]
    );
    if (!row) return { status: -1, body: "no OTP row" };
    const r = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, otpCode: row.OTPCode }),
    });
    return { status: r.status, body: await r.text() };
}

async function userState(email) {
    const [[u]] = await c.query(
        "SELECT IdNumber, AccountStatus, PhysicalIdVerificationStatus, PhysicalIdDocument, PhysicalIdVerifiedAt FROM users WHERE Email = ?",
        [email]
    );
    return u;
}

// ---- 1. student school email ------------------------------------------------
const studentEmail = `test${stamp}@student.pnm.edu.ph`;
const r1 = await register({
    firstName: "Test",
    middleName: "",
    lastName: "Student",
    idNumber: `T-${stamp}1`,
    email: studentEmail,
    password: "Strong1!Pass",
    physicalIdDocument: null,
    role: "Student",
});
console.log(`1. student school email, no ID -> HTTP ${r1.status}`);
r1.status === 200 ? pass("student school email accepted without ID") : fail("student register", r1.body);

const v1 = await verify(studentEmail);
console.log(`   verify OTP -> HTTP ${v1.status} ${v1.body.slice(0, 90)}`);
const u1 = await userState(studentEmail);
console.log(`   user row: ${u1?.AccountStatus} / ${u1?.PhysicalIdVerificationStatus} / doc=${u1?.PhysicalIdDocument ?? "null"}`);
if (u1?.AccountStatus === "Active" && u1?.PhysicalIdVerificationStatus === "Verified" && !u1?.PhysicalIdDocument)
    pass("student auto-verified Active/Verified, no document");
else fail("student auto-verify state");

// ---- 2. faculty school email ------------------------------------------------
const facultyEmail = `test${stamp}@pnm.edu.ph`;
const r2 = await register({
    firstName: "Test",
    middleName: "",
    lastName: "Faculty",
    idNumber: `T-${stamp}2`,
    email: facultyEmail,
    password: "Strong1!Pass",
    physicalIdDocument: null,
    role: "Faculty",
});
console.log(`2. faculty school email, no ID -> HTTP ${r2.status}`);
r2.status === 200 ? pass("faculty school email accepted without ID") : fail("faculty register", r2.body);

const v2 = await verify(facultyEmail);
const u2 = await userState(facultyEmail);
console.log(`   verify OTP -> HTTP ${v2.status}`);
console.log(`   user row: ${u2?.AccountStatus} / ${u2?.PhysicalIdVerificationStatus}`);
if (u2?.AccountStatus === "Active" && u2?.PhysicalIdVerificationStatus === "Verified")
    pass("faculty auto-verified Active/Verified");
else fail("faculty auto-verify state");

// ---- 3. role mismatch --------------------------------------------------------
const r3 = await register({
    firstName: "Test",
    middleName: "",
    lastName: "Mismatch",
    idNumber: `T-${stamp}3`,
    email: `mismatch${stamp}@student.pnm.edu.ph`,
    password: "Strong1!Pass",
    physicalIdDocument: null,
    role: "Faculty",
});
console.log(`3. student domain + Faculty role -> HTTP ${r3.status}`);
r3.status === 400 ? pass("role mismatch rejected") : fail("mismatch not rejected", r3.body);

// ---- 4. personal email, no ID -------------------------------------------------
const r4 = await register({
    firstName: "Test",
    middleName: "",
    lastName: "Personal",
    idNumber: `T-${stamp}4`,
    email: `personal${stamp}@gmail.com`,
    password: "Strong1!Pass",
    physicalIdDocument: null,
    role: "Student",
});
console.log(`4. personal email, no ID -> HTTP ${r4.status}`);
r4.status === 400 ? pass("personal email still requires ID") : fail("personal ID requirement lost", r4.body);

// ---- cleanup ------------------------------------------------------------------
await c.query("DELETE FROM users WHERE Email IN (?, ?)", [studentEmail, facultyEmail]);
await c.query("DELETE FROM otpverifications WHERE Email LIKE ?", [`%${stamp}%`]);
const [[left]] = await c.query("SELECT COUNT(*) n FROM users WHERE Email LIKE ?", [`%${stamp}%`]);
console.log(`\ncleanup: test users remaining = ${left.n}`);
await c.end();

console.log("\n==== RESULT ====");
results.forEach((r) => console.log(r));
process.exitCode = results.some((r) => r.startsWith("  FAIL")) ? 1 : 0;
