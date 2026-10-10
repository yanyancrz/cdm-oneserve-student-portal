/**
 * Generates a VAPID key pair using the official web-push library.
 *
 * A pair is generated ONCE and reused forever. Rotating the key pair
 * invalidates every existing browser subscription, because the browser
 * pins the public key it subscribed with.
 *
 * Usage:
 *   npm run keys
 *
 * Writes NOTHING to disk. Copy the two values into:
 *   push-service/.env       -> VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY (private!)
 *   ../.env                 -> VITE_VAPID_PUBLIC_KEY (public only)
 *   ../CDM-OneServe-API/appsettings.json -> WebPush:VapidPublicKey
 */
import webPush from "web-push";

const { publicKey, privateKey } = webPush.generateVAPIDKeys();

const bar = "=".repeat(66);

console.log(bar);
console.log("CDM OneServe - new VAPID key pair (RFC 8292)");
console.log(bar);
console.log("PUBLIC  key -> safe everywhere (browser bundle, appsettings):");
console.log(`  ${publicKey}`);
console.log("");
console.log("PRIVATE key -> push-service/.env ONLY. Never in git, never in the app:");
console.log(`  ${privateKey}`);
console.log(bar);
console.log("Back this up in an encrypted place. Losing it means every device");
console.log("has to re-subscribe.");
console.log(bar);
