export function isPWAInstalled() {
    // Android / Chrome / Edge / other browsers
    if (window.matchMedia("(display-mode: standalone)").matches) {
        return true;
    }

    // iOS Safari
    if (window.navigator.standalone === true) {
        return true;
    }

    // Some browsers/environments
    if (document.referrer.startsWith("android-app://")) {
        return true;
    }

    return false;
}