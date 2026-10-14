// Login check for an auto-verified school account (via production URL).
import mysql from "mysql2/promise";

const API = process.env.PROBE_API ?? "http://localhost:5212";
const stamp = Date.now().toString().slice(-6);
const email = `logintest${stamp}@student.pnm.edu.ph`;
const password = "Strong1!Pass";
const idNumber = `L-${stamp}9`;

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
});

const reg = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
        firstName: "Login",
        middleName: "",
        lastName: "Test",
        idNumber,
        email,
        password,
        physicalIdDocument: null,
        role: "Student",
    }),
});
console.log(`register -> HTTP ${reg.status}`);

const [[otp]] = await c.query(
    "SELECT OTPCode FROM otpverifications WHERE Email = ?",
    [email]
);
const ver = await fetch(`${API}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, otpCode: otp.OTPCode }),
});
console.log(`verify -> HTTP ${ver.status}`);

const login = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
});
const loginBody = await login.text();
console.log(`login -> HTTP ${login.status}`);
console.log(
    login.status === 200 && loginBody.includes("token")
        ? "PASS: auto-verified account can sign in immediately"
        : `FAIL: ${loginBody.slice(0, 120)}`
);

await c.query("DELETE FROM users WHERE Email = ?", [email]);
await c.query("DELETE FROM otpverifications WHERE Email = ?", [email]);
await c.end();
console.log("cleanup done");
