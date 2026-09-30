import { useEffect } from "react";

export default function PWAInstallPrompt() {
    useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();

            window.__deferredInstallPrompt =
                event;
        };

        window.addEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt
        );

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
        };
    }, []);

    return null;
}