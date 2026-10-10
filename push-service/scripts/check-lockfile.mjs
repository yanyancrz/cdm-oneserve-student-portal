/**
 * Verifies the root package-lock.json is complete enough for `npm ci`.
 *
 * WHY THIS EXISTS
 * `npm ci` refuses to run unless EVERY platform variant of every optional
 * dependency is recorded in the lockfile. A lockfile generated on Windows
 * only records the win32 variants, so `npm ci` works on your machine and
 * fails on a Linux CI box with:
 *
 *   npm error code EUSAGE
 *   npm error `npm ci` can only install packages when your package.json and
 *   npm error   package-lock.json ... are in sync.
 *   npm error Missing: @tailwindcss/oxide-linux-x64-gnu@4.3.1 from lock file
 *
 * That is exactly what broke the Vercel deploy. Run this before committing
 * a lockfile change:
 *
 *   node push-service/scripts/check-lockfile.mjs        # report only
 *   node push-service/scripts/check-lockfile.mjs --fix  # regenerate with npm 11
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = join(here, "..", "..");
const lockPath = join(rootDir, "package-lock.json");

const fix = process.argv.includes("--fix");

const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const packages = lock.packages ?? {};

/**
 * npm resolves a dependency by walking up the node_modules chain, so check
 * the exact location first, then each ancestor's node_modules.
 *
 * Walks at most `depth` levels up - that is the real path in the tree, and a
 * hard cap is what stops this loop from spinning when a carrier sits at the
 * top of the tree and has no ancestor to strip.
 */
function isResolved(name, fromPackage) {
    let prefix = fromPackage;

    for (let depth = 0; depth < 32; depth += 1) {
        if (packages[`${prefix}/node_modules/${name}`]) return true;

        const stripped = prefix.replace(/\/node_modules\/[^/]+$/, "");
        if (stripped === prefix) break; // nothing left to climb
        prefix = stripped;
    }

    // The root of the tree is just "node_modules/<name>".
    return Boolean(packages[`node_modules/${name}`]);
}

const problems = [];

for (const [carrier, meta] of Object.entries(packages)) {
    const named = Object.keys(meta?.optionalDependencies ?? {});
    for (const name of named) {
        if (!isResolved(name, carrier)) problems.push(`${carrier} -> ${name}`);
    }
}

if (problems.length === 0) {
    console.log(`OK - lockfileVersion ${lock.lockfileVersion} records every optional`);
    console.log("dependency variant. 'npm ci' will accept it on any platform.");
    process.exit(0);
}

console.log(`INCOMPLETE - ${problems.length} optional variant(s) have no entry:`);
problems.slice(0, 20).forEach((p) => console.log("   -", p));
if (problems.length > 20) console.log(`   ... and ${problems.length - 20} more`);

if (!fix) {
    console.log("\nFix with:  node push-service/scripts/check-lockfile.mjs --fix");
    process.exit(1);
}

console.log("\nRegenerating the lockfile with npm 11 (package.json untouched)...");
try {
    execFileSync("npx", ["-y", "npm@11", "install", "--package-lock-only"], {
        cwd: rootDir,
        stdio: "inherit",
        shell: process.platform === "win32",
    });
    console.log("\nDone. Re-run this check to confirm.");
} catch (error) {
    console.error("Regeneration failed:", error.message);
    process.exit(1);
}
