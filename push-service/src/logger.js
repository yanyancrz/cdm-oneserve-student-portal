/**
 * Small, dependency-free logger. Keeps stdout readable and never logs
 * anything that could carry a private key or a user's message content at
 * debug level (the API already logs the module + type).
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

let threshold = LEVELS.info;

export function configureLogging(level) {
    threshold = LEVELS[level] ?? LEVELS.info;
}

function stamp() {
    return new Date().toISOString();
}

export function log(level, message, meta) {
    if ((LEVELS[level] ?? LEVELS.info) > threshold) return;

    const suffix =
        meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";

    const line = `${stamp()} [${level.toUpperCase()}] ${message}${suffix}`;

    if (level === "error" || level === "warn") console.error(line);
    else console.log(line);
}

export const child = (scope) => ({
    info: (message, meta) => log("info", `${scope} ${message}`, meta),
    warn: (message, meta) => log("warn", `${scope} ${message}`, meta),
    error: (message, meta) => log("error", `${scope} ${message}`, meta),
    debug: (message, meta) => log("debug", `${scope} ${message}`, meta),
});
