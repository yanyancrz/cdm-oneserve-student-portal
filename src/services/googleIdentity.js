let scriptPromise;
let initializedClientId;
let activeCallback;

export function loadGoogleIdentity() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = () => {
                script.remove();
                scriptPromise = undefined;
                reject(new Error("Google sign-in could not be loaded."));
            };
            document.head.appendChild(script);
        });
    }
    return scriptPromise;
}

export function bindGoogleIdentity(clientId, callback) {
    activeCallback = callback;
    if (initializedClientId !== clientId) {
        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: response => activeCallback?.(response),
            auto_select: false,
            cancel_on_tap_outside: true,
        });
        initializedClientId = clientId;
    }
    return () => {
        if (activeCallback === callback) activeCallback = undefined;
    };
}
