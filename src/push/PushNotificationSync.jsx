/**
 * Runs the push hook once per page load, renders nothing.
 *
 * Mounted at the app root so EVERY page load:
 *   - drains a subscription the service worker stashed while the app was
 *     closed (pushsubscriptionchange with no open tab)
 *   - re-registers a subscription the browser rotated
 *   - proves the stored row is still active
 *
 * It never calls Notification.requestPermission(), so nobody is ever
 * interrupted by a permission prompt they did not ask for. Asking is the
 * job of the toggle on Profile (and the banner).
 */
import { usePushSubscription } from "./usePushSubscription.js";

export function PushNotificationSync() {
    usePushSubscription();
    return null;
}

export default PushNotificationSync;
