// Show the guidance_appointments CHECK constraint definition.
import mysql from "mysql2/promise";

const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "cdm_oneserve",
});

const [rows] = await c.query(
    `SELECT CONSTRAINT_NAME, CHECK_CLAUSE
       FROM information_schema.CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = 'cdm_oneserve'
        AND CONSTRAINT_NAME LIKE '%gapp%'`
);
console.log(JSON.stringify(rows, null, 2));

const [cols] = await c.query(
    `SHOW CREATE TABLE guidance_appointments`
);
console.log("\nTable DDL:\n" + cols[0]["Create Table"]);

await c.end();
